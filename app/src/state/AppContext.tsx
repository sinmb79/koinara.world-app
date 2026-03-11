import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  ChainConfig,
  ChainProfileConfig,
  JobTypeName,
  NetworkId,
  SupportedTokenId
} from "@koinara/shared";
import { getChainProfileConfig } from "@koinara/shared/config/defaultConfigs";
import { createChainClient, jobTypeToNumber } from "../chain/client";
import { useJobPolling } from "../hooks/useJobPolling";
import {
  buildManifestFromPrompt,
  buildSubmissionHashes,
  defaultDeadlineForJobType,
  recommendJobType
} from "../orchestrator/submitJob";
import { buildPaymentQuote, createPaymentAggregator } from "../payment/adapters";
import { getRuntimeBridge } from "../storage/runtimeBridge";
import { classifyAppError } from "./errors";
import { loadSessions, replaceSessions, upsertSession } from "./sessionStore";
import type { AppErrorDescriptor, AppJobSession, WalletState } from "../types/appTypes";
import { connectWalletConnect } from "../wallet/walletConnect";

interface SubmitInput {
  prompt: string;
  contentType: string;
  tokenId: SupportedTokenId;
  discoveryRoot: string;
}

interface AppContextValue {
  chainProfileConfig: ChainProfileConfig;
  chainConfig: ChainConfig;
  networks: ChainConfig[];
  selectedNetworkId: NetworkId;
  sessions: AppJobSession[];
  wallet: WalletState;
  lastError?: AppErrorDescriptor;
  selectNetwork(networkId: NetworkId): void;
  submitJob(input: SubmitInput): Promise<void>;
  chooseDiscoveryRoot(): Promise<string | null>;
  connectWalletConnect(): Promise<void>;
  saveBuiltInWallet(privateKey: string, passphrase: string): Promise<void>;
  unlockBuiltInWallet(passphrase: string): Promise<void>;
  lockBuiltInWallet(): Promise<void>;
  deleteBuiltInWallet(): Promise<void>;
  markExpired(jobId: number, networkId: NetworkId): Promise<void>;
  claimRefund(jobId: number, networkId: NetworkId): Promise<void>;
  quoteFor(tokenId: SupportedTokenId, jobType: JobTypeName, gasEstimate?: string): ReturnType<typeof buildPaymentQuote>;
  estimateGas(jobType: JobTypeName, requestHash: string, schemaHash: string, deadline: number): Promise<string | undefined>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const profile = (import.meta.env.VITE_CHAIN_PROFILE ?? "testnet") as "testnet" | "mainnet";
  const runtime = useMemo(() => getRuntimeBridge(), []);
  const chainProfileConfig = useMemo(() => getChainProfileConfig(profile), [profile]);
  const networks = useMemo(() => Object.values(chainProfileConfig.networks), [chainProfileConfig]);
  const [selectedNetworkId, setSelectedNetworkId] = useState<NetworkId>(chainProfileConfig.defaultNetwork);
  const chainConfig = useMemo(
    () => chainProfileConfig.networks[selectedNetworkId] ?? chainProfileConfig.networks[chainProfileConfig.defaultNetwork],
    [chainProfileConfig, selectedNetworkId]
  );
  const chainClients = useMemo(
    () =>
      Object.fromEntries(networks.map((network) => [network.id, createChainClient(network)])) as Record<
        NetworkId,
        ReturnType<typeof createChainClient>
      >,
    [networks]
  );
  const [sessions, setSessions] = useState<AppJobSession[]>(() => hydrateSessions(loadSessions(), chainProfileConfig));
  const [wallet, setWallet] = useState<WalletState>({
    mode: "none",
    builtInExists: false,
    builtInUnlocked: false
  });
  const [walletConnectProvider, setWalletConnectProvider] = useState<unknown>();
  const [lastError, setLastError] = useState<AppErrorDescriptor>();

  useEffect(() => {
    if (!chainProfileConfig.networks[selectedNetworkId]) {
      setSelectedNetworkId(chainProfileConfig.defaultNetwork);
    }

    const migrated = hydrateSessions(loadSessions(), chainProfileConfig);
    setSessions(migrated);
    replaceSessions(migrated);
  }, [chainProfileConfig, selectedNetworkId]);

  useEffect(() => {
    void runtime.walletStatus().then((status) => {
      setWallet((current) => ({
        ...current,
        builtInExists: status.exists,
        builtInUnlocked: status.unlocked,
        address: current.mode === "built-in" ? status.address : current.address
      }));
    });
  }, [runtime]);

  useJobPolling({
    sessions,
    enabled: Object.values(chainClients).some((client) => client.isConfigured()),
    poller: async (session) => {
      if (!session.jobId) {
        return;
      }

      const client = chainClients[session.networkId];
      if (!client || !client.isConfigured()) {
        return;
      }

      const poll = await client.pollJob(session.jobId);
      let next: AppJobSession = {
        ...session,
        lastKnownState: poll.state,
        lastPolledBlock: poll.blockNumber,
        updatedAt: new Date().toISOString(),
        responseHash: poll.responseHash,
        proof: poll.proof ?? session.proof
      };

      if (poll.responseHash) {
        const receipt = await runtime.readReceipt(session.discoveryRoot, session.jobId, poll.responseHash);
        const result = await runtime.readResult(session.discoveryRoot, session.jobId, poll.responseHash);
        next = {
          ...next,
          result: result ?? receipt?.body.output ?? next.result
        };
      }

      setSessions((current) => {
        const updated = current.map((entry) => (entry.requestHash === session.requestHash ? next : entry));
        replaceSessions(updated);
        return updated;
      });
    }
  });

  async function submitJob(input: SubmitInput): Promise<void> {
    try {
      const recommended = recommendJobType(input.prompt);
      if (recommended === "Collective") {
        throw new Error("Collective submission is coming soon. Submit Simple or General jobs in the MVP.");
      }

      if (!chainConfig.enabled) {
        throw new Error(chainConfig.reasonDisabled ?? "This network is not accepting submissions yet.");
      }

      const quote = buildPaymentQuote(chainConfig, input.tokenId, recommended);
      if (!quote.available) {
        throw new Error(quote.reasonDisabled ?? "The selected payment token is not available.");
      }

      const manifest = buildManifestFromPrompt({
        prompt: input.prompt,
        contentType: input.contentType,
        metadata: { source: "desktop-app", networkId: chainConfig.id }
      });
      const { requestHash, schemaHash } = buildSubmissionHashes(manifest);
      const deadline = defaultDeadlineForJobType(recommended);
      const premiumRewardWei = chainClients[chainConfig.id].estimatePremiumWei(recommended);
      const draft: AppJobSession = {
        networkId: chainConfig.id,
        networkLabel: chainConfig.label,
        requestHash,
        schemaHash,
        deadline,
        discoveryRoot: input.discoveryRoot,
        selectedToken: input.tokenId,
        lastKnownState: "PendingSignature",
        updatedAt: new Date().toISOString(),
        promptPreview: input.prompt.slice(0, 140)
      };

      setSessions(upsertSession(draft));
      await runtime.writeManifest(input.discoveryRoot, manifest);

      let result: { txHash: string; jobId?: number };
      if (wallet.mode === "built-in") {
        result = await runtime.submitBuiltInJob({
          chain: chainConfig,
          requestHash,
          schemaHash,
          deadline,
          jobType: jobTypeToNumber[recommended],
          premiumRewardWei
        });
      } else if (wallet.mode === "walletconnect" && walletConnectProvider) {
        result = await chainClients[chainConfig.id].createJobWithWalletConnect({
          eip1193Provider: walletConnectProvider,
          requestHash,
          schemaHash,
          deadline,
          jobType: recommended,
          premiumRewardWei
        });
      } else {
        throw new Error("Connect WalletConnect or unlock the built-in wallet before submitting.");
      }

      setSessions(
        upsertSession({
          ...draft,
          createdTxHash: result.txHash,
          jobId: result.jobId,
          lastKnownState: result.jobId ? "Open" : "PendingConfirmation",
          updatedAt: new Date().toISOString()
        })
      );
      setLastError(undefined);
    } catch (error) {
      setLastError(classifyAppError(error));
    }
  }

  async function chooseDiscoveryRoot(): Promise<string | null> {
    return runtime.selectDiscoveryRoot();
  }

  function selectNetwork(networkId: NetworkId): void {
    setSelectedNetworkId(networkId);
    setLastError(undefined);
    setWalletConnectProvider(undefined);

    if (wallet.mode === "walletconnect") {
      void runtime.walletStatus().then((status) => {
        setWallet({
          mode: status.unlocked ? "built-in" : "none",
          address: status.unlocked ? status.address : undefined,
          builtInExists: status.exists,
          builtInUnlocked: status.unlocked,
          statusMessage: "Reconnect WalletConnect for the selected network."
        });
      });
    }
  }

  async function handleConnectWalletConnect(): Promise<void> {
    try {
      const connection = await connectWalletConnect(chainConfig);
      setWalletConnectProvider(connection.provider);
      setWallet({
        mode: "walletconnect",
        address: connection.address,
        builtInExists: wallet.builtInExists,
        builtInUnlocked: wallet.builtInUnlocked,
        statusMessage: `WalletConnect v2 connected to ${chainConfig.label}.`
      });
      setLastError(undefined);
    } catch (error) {
      setLastError(classifyAppError(error));
    }
  }

  async function saveBuiltInWallet(privateKey: string, passphrase: string): Promise<void> {
    try {
      const response = await runtime.saveWallet(privateKey, passphrase);
      setWallet({
        mode: "built-in",
        address: response.address,
        builtInExists: true,
        builtInUnlocked: false,
        statusMessage: "Built-in wallet saved."
      });
    } catch (error) {
      setLastError(classifyAppError(error));
    }
  }

  async function unlockBuiltInWallet(passphrase: string): Promise<void> {
    try {
      const response = await runtime.unlockWallet(passphrase);
      setWallet({
        mode: "built-in",
        address: response.address,
        builtInExists: true,
        builtInUnlocked: true,
        statusMessage: `Built-in wallet unlocked for ${chainConfig.label}.`
      });
    } catch (error) {
      setLastError(classifyAppError(error));
    }
  }

  async function lockBuiltInWallet(): Promise<void> {
    await runtime.lockWallet();
    setWallet((current) => ({
      ...current,
      builtInUnlocked: false,
      statusMessage: "Built-in wallet locked."
    }));
  }

  async function deleteBuiltInWallet(): Promise<void> {
    await runtime.deleteWallet();
    setWallet({
      mode: wallet.mode === "walletconnect" ? "walletconnect" : "none",
      address: wallet.mode === "walletconnect" ? wallet.address : undefined,
      builtInExists: false,
      builtInUnlocked: false,
      statusMessage: "Built-in wallet deleted."
    });
  }

  async function markExpired(jobId: number, networkId: NetworkId): Promise<void> {
    const targetConfig = resolveNetworkConfig(chainProfileConfig, networkId);
    const client = chainClients[targetConfig.id];

    try {
      if (wallet.mode === "built-in") {
        await runtime.markExpiredBuiltIn({ chain: targetConfig, jobId });
      } else if (wallet.mode === "walletconnect" && walletConnectProvider) {
        await client.markExpiredWithWalletConnect(jobId, walletConnectProvider);
      } else {
        throw new Error("Connect a wallet before marking a job expired.");
      }

      setSessions((current) => {
        const nextSessions = current.map((entry) =>
          entry.jobId === jobId && entry.networkId === networkId
            ? ({ ...entry, lastKnownState: "Expired", updatedAt: new Date().toISOString() } as AppJobSession)
            : entry
        );
        replaceSessions(nextSessions);
        return nextSessions;
      });
    } catch (error) {
      setLastError(classifyAppError(error));
    }
  }

  async function claimRefund(jobId: number, networkId: NetworkId): Promise<void> {
    const targetConfig = resolveNetworkConfig(chainProfileConfig, networkId);
    const client = chainClients[targetConfig.id];

    try {
      if (wallet.mode === "built-in") {
        await runtime.claimRefundBuiltIn({ chain: targetConfig, jobId });
      } else if (wallet.mode === "walletconnect" && walletConnectProvider) {
        await client.claimRefundWithWalletConnect(jobId, walletConnectProvider);
      } else {
        throw new Error("Connect a wallet before claiming a refund.");
      }

      setSessions((current) => {
        const nextSessions = current.map((entry) =>
          entry.jobId === jobId && entry.networkId === networkId
            ? ({ ...entry, lastKnownState: "Expired", updatedAt: new Date().toISOString() } as AppJobSession)
            : entry
        );
        replaceSessions(nextSessions);
        return nextSessions;
      });
    } catch (error) {
      setLastError(classifyAppError(error));
    }
  }

  const aggregator = useMemo(() => createPaymentAggregator(chainConfig), [chainConfig]);

  const value: AppContextValue = {
    chainProfileConfig,
    chainConfig,
    networks,
    selectedNetworkId,
    sessions,
    wallet,
    lastError,
    selectNetwork,
    submitJob,
    chooseDiscoveryRoot,
    connectWalletConnect: handleConnectWalletConnect,
    saveBuiltInWallet,
    unlockBuiltInWallet,
    lockBuiltInWallet,
    deleteBuiltInWallet,
    markExpired,
    claimRefund,
    quoteFor: (tokenId, jobType, gasEstimate) => aggregator.buildQuote(tokenId, jobType, gasEstimate),
    estimateGas: async (jobType, requestHash, schemaHash, deadline) => {
      try {
        const result = await runtime.estimateCreateJobGas({
          chain: chainConfig,
          requestHash,
          schemaHash,
          deadline,
          jobType: jobTypeToNumber[jobType],
          premiumRewardWei: chainClients[chainConfig.id].estimatePremiumWei(jobType)
        });
        return result.estimatedNative;
      } catch {
        return undefined;
      }
    }
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("AppContext is not available.");
  }
  return value;
}

function hydrateSessions(sessions: AppJobSession[], profileConfig: ChainProfileConfig): AppJobSession[] {
  return sessions.map((session) => {
    const networkId = profileConfig.networks[session.networkId] ? session.networkId : profileConfig.defaultNetwork;
    const network = profileConfig.networks[networkId];
    return {
      ...session,
      networkId,
      networkLabel: session.networkLabel || network.label
    };
  });
}

function resolveNetworkConfig(profileConfig: ChainProfileConfig, networkId: NetworkId): ChainConfig {
  return profileConfig.networks[networkId] ?? profileConfig.networks[profileConfig.defaultNetwork];
}

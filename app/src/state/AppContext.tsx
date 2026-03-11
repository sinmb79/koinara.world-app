import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { JobTypeName, SupportedTokenId } from "@koinara/shared";
import { getDefaultChainConfig } from "@koinara/shared/config/defaultConfigs";
import { createChainClient, jobTypeToNumber } from "../chain/client";
import { useJobPolling } from "../hooks/useJobPolling";
import {
  buildManifestFromPrompt,
  buildSubmissionHashes,
  defaultDeadlineForJobType,
  recommendJobType
} from "../orchestrator/submitJob";
import { buildPaymentQuote } from "../payment/adapters";
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
  chainConfig: ReturnType<typeof getDefaultChainConfig>;
  sessions: AppJobSession[];
  wallet: WalletState;
  lastError?: AppErrorDescriptor;
  submitJob(input: SubmitInput): Promise<void>;
  chooseDiscoveryRoot(): Promise<string | null>;
  connectWalletConnect(): Promise<void>;
  saveBuiltInWallet(privateKey: string, passphrase: string): Promise<void>;
  unlockBuiltInWallet(passphrase: string): Promise<void>;
  lockBuiltInWallet(): Promise<void>;
  deleteBuiltInWallet(): Promise<void>;
  markExpired(jobId: number): Promise<void>;
  claimRefund(jobId: number): Promise<void>;
  quoteFor(tokenId: SupportedTokenId, jobType: JobTypeName, gasEstimate?: string): ReturnType<typeof buildPaymentQuote>;
  estimateGas(jobType: JobTypeName, requestHash: string, schemaHash: string, deadline: number): Promise<string | undefined>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const profile = (import.meta.env.VITE_CHAIN_PROFILE ?? "testnet") as "testnet" | "mainnet";
  const chainConfig = useMemo(() => getDefaultChainConfig(profile), [profile]);
  const chain = useMemo(() => createChainClient(chainConfig), [chainConfig]);
  const runtime = useMemo(() => getRuntimeBridge(), []);
  const [sessions, setSessions] = useState<AppJobSession[]>(() => loadSessions());
  const [wallet, setWallet] = useState<WalletState>({
    mode: "none",
    builtInExists: false,
    builtInUnlocked: false
  });
  const [walletConnectProvider, setWalletConnectProvider] = useState<unknown>();
  const [lastError, setLastError] = useState<AppErrorDescriptor>();

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
    enabled: chain.isConfigured(),
    poller: async (session) => {
      if (!session.jobId) {
        return;
      }
      const poll = await chain.pollJob(session.jobId);
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
      const updated = sessions.map((entry) => (entry.requestHash === session.requestHash ? next : entry));
      setSessions(updated);
      replaceSessions(updated);
    }
  });

  async function submitJob(input: SubmitInput): Promise<void> {
    try {
      const recommended = recommendJobType(input.prompt);
      if (recommended === "Collective") {
        throw new Error("Collective submission is coming soon. Submit Simple or General jobs in the MVP.");
      }

      const manifest = buildManifestFromPrompt({
        prompt: input.prompt,
        contentType: input.contentType,
        metadata: { source: "desktop-app" }
      });
      const { requestHash, schemaHash } = buildSubmissionHashes(manifest);
      const deadline = defaultDeadlineForJobType(recommended);
      const premiumRewardWei = chain.estimatePremiumWei(recommended);
      const draft: AppJobSession = {
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
        result = await chain.createJobWithWalletConnect({
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

  async function handleConnectWalletConnect(): Promise<void> {
    try {
      const connection = await connectWalletConnect(chainConfig);
      setWalletConnectProvider(connection.provider);
      setWallet({
        mode: "walletconnect",
        address: connection.address,
        builtInExists: wallet.builtInExists,
        builtInUnlocked: wallet.builtInUnlocked,
        statusMessage: "WalletConnect v2 connected."
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
        statusMessage: "Built-in wallet unlocked in memory."
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

  async function markExpired(jobId: number): Promise<void> {
    try {
      if (wallet.mode === "built-in") {
        await runtime.markExpiredBuiltIn({ chain: chainConfig, jobId });
      } else if (wallet.mode === "walletconnect" && walletConnectProvider) {
        await chain.markExpiredWithWalletConnect(jobId, walletConnectProvider);
      } else {
        throw new Error("Connect a wallet before marking a job expired.");
      }

      const nextSessions = sessions.map((entry) =>
        entry.jobId === jobId
          ? ({ ...entry, lastKnownState: "Expired", updatedAt: new Date().toISOString() } as AppJobSession)
          : entry
      );
      setSessions(nextSessions);
      replaceSessions(nextSessions);
    } catch (error) {
      setLastError(classifyAppError(error));
    }
  }

  async function claimRefund(jobId: number): Promise<void> {
    try {
      if (wallet.mode === "built-in") {
        await runtime.claimRefundBuiltIn({ chain: chainConfig, jobId });
      } else if (wallet.mode === "walletconnect" && walletConnectProvider) {
        await chain.claimRefundWithWalletConnect(jobId, walletConnectProvider);
      } else {
        throw new Error("Connect a wallet before claiming a refund.");
      }

      const nextSessions = sessions.map((entry) =>
        entry.jobId === jobId
          ? ({ ...entry, lastKnownState: "Expired", updatedAt: new Date().toISOString() } as AppJobSession)
          : entry
      );
      setSessions(nextSessions);
      replaceSessions(nextSessions);
    } catch (error) {
      setLastError(classifyAppError(error));
    }
  }

  const value: AppContextValue = {
    chainConfig,
    sessions,
    wallet,
    lastError,
    submitJob,
    chooseDiscoveryRoot,
    connectWalletConnect: handleConnectWalletConnect,
    saveBuiltInWallet,
    unlockBuiltInWallet,
    lockBuiltInWallet,
    deleteBuiltInWallet,
    markExpired,
    claimRefund,
    quoteFor: (tokenId, jobType, gasEstimate) => buildPaymentQuote(chainConfig, tokenId, jobType, gasEstimate),
    estimateGas: async (jobType, requestHash, schemaHash, deadline) => {
      try {
        const result = await runtime.estimateCreateJobGas({
          chain: chainConfig,
          requestHash,
          schemaHash,
          deadline,
          jobType: jobTypeToNumber[jobType],
          premiumRewardWei: chain.estimatePremiumWei(jobType)
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

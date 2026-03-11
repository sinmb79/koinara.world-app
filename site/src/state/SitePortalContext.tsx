import {
  buildManifestFromPrompt,
  buildRunSnapshot,
  buildSubmissionHashes,
  buildUsdDepositQuote,
  createChainClient,
  defaultDeadlineForJobType,
  recommendJobType,
  type ChainConfig,
  type DepositQuote,
  type DepositState,
  type NetworkId,
  type RunSnapshot,
  type SupportedTokenId,
  type WebJobSession
} from "@koinara/shared";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  isDiscoveryWriteConfigured,
  publishJobManifest,
  resolveReceiptArtifact,
  resolveResultArtifact,
  resolveRunSnapshotArtifact
} from "../discoveryTransport";
import { getSiteChainProfileConfig, loadNetworkDashboard, type NetworkDashboardData } from "../network";
import { loadSiteSessions, saveSiteSessions, sortSessions } from "./siteSessionStore";
import { connectInjectedWallet, connectWalletConnect } from "../wallet/connectors";

interface SiteWalletState {
  mode: "none" | "browser" | "walletconnect";
  address?: string;
  statusMessage?: string;
}

interface SitePortalContextValue {
  networks: ChainConfig[];
  selectedNetworkId: NetworkId;
  selectedNetwork: ChainConfig;
  setSelectedNetworkId(networkId: NetworkId): void;
  dashboardData: NetworkDashboardData;
  wallet: SiteWalletState;
  connectBrowserWallet(): Promise<void>;
  connectWalletConnect(): Promise<void>;
  selectedTokenId: SupportedTokenId;
  setSelectedTokenId(tokenId: SupportedTokenId): void;
  depositQuote: DepositQuote;
  depositState: DepositState;
  confirmDeposit(): void;
  resetDeposit(): void;
  prompt: string;
  setPrompt(prompt: string): void;
  sessions: WebJobSession[];
  activeSession?: WebJobSession;
  setActiveSessionId(sessionId: string): void;
  submitDisabledReason?: string;
  submitJob(): Promise<void>;
  canMarkExpired: boolean;
  canClaimRefund: boolean;
  actionPending?: "mark-expired" | "claim-refund";
  markExpiredActiveJob(): Promise<void>;
  claimRefundForActiveJob(): Promise<void>;
  lastError?: string;
  discoveryWriteConfigured: boolean;
}

const SitePortalContext = createContext<SitePortalContextValue | null>(null);
const RUN_POLL_DELAYS_MS = [8000, 15000, 30000, 60000] as const;

export function SitePortalProvider({ children }: { children: React.ReactNode }) {
  const profileConfig = useMemo(() => getSiteChainProfileConfig(), []);
  const networks = useMemo(() => Object.values(profileConfig.networks), [profileConfig]);
  const [selectedNetworkId, setSelectedNetworkId] = useState<NetworkId>(profileConfig.defaultNetwork);
  const selectedNetwork = useMemo(
    () => profileConfig.networks[selectedNetworkId] ?? profileConfig.networks[profileConfig.defaultNetwork],
    [profileConfig, selectedNetworkId]
  );
  const [dashboardData, setDashboardData] = useState<NetworkDashboardData>({
    networkId: selectedNetwork.id,
    networkLabel: selectedNetwork.label,
    status: "empty",
    jobsToday: 0,
    uniqueParticipants24h: 0,
    koinMinted: "0",
    walletGraph: [],
    activity: []
  });
  const [wallet, setWallet] = useState<SiteWalletState>({ mode: "none" });
  const [connectedProvider, setConnectedProvider] = useState<unknown>();
  const [selectedTokenId, setSelectedTokenId] = useState<SupportedTokenId>(selectedNetwork.payments.defaultTokenId);
  const [depositState, setDepositState] = useState<DepositState>({ status: "idle", usdTarget: "10" });
  const [prompt, setPrompt] = useState("");
  const [sessions, setSessions] = useState<WebJobSession[]>(() => loadSiteSessions());
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(() => loadSiteSessions()[0]?.id);
  const [actionPending, setActionPending] = useState<"mark-expired" | "claim-refund">();
  const [lastError, setLastError] = useState<string>();
  const discoveryWriteConfigured = useMemo(() => isDiscoveryWriteConfigured(), []);

  const effectiveSelectedTokenId = useMemo(() => {
    const currentExists = selectedNetwork.payments.supportedTokens.some((token) => token.id === selectedTokenId);
    return currentExists ? selectedTokenId : selectedNetwork.payments.defaultTokenId;
  }, [selectedNetwork, selectedTokenId]);

  const depositQuote = useMemo(
    () => buildUsdDepositQuote(selectedNetwork, effectiveSelectedTokenId, "10"),
    [effectiveSelectedTokenId, selectedNetwork]
  );

  const activeSession = useMemo(
    () => sessions.find((entry) => entry.id === activeSessionId) ?? sessions[0],
    [activeSessionId, sessions]
  );

  const canMarkExpired =
    Boolean(activeSession?.jobId) &&
    activeSession?.lastKnownState === "Open" &&
    Boolean(activeSession.deadline && Math.floor(Date.now() / 1000) >= activeSession.deadline);
  const canClaimRefund =
    Boolean(activeSession?.jobId) &&
    (activeSession?.lastKnownState === "Rejected" || activeSession?.lastKnownState === "Expired");

  useEffect(() => {
    if (selectedTokenId !== effectiveSelectedTokenId) {
      setSelectedTokenId(effectiveSelectedTokenId);
    }
  }, [effectiveSelectedTokenId, selectedTokenId]);

  useEffect(() => {
    setDepositState({
      status: depositQuote.available ? "quote-ready" : "idle",
      usdTarget: depositQuote.usdTarget,
      tokenId: effectiveSelectedTokenId,
      amount: depositQuote.depositAmount,
      amountBaseUnits: depositQuote.amountBaseUnits,
      reason: depositQuote.reasonDisabled
    });
  }, [
    depositQuote.amountBaseUnits,
    depositQuote.available,
    depositQuote.depositAmount,
    depositQuote.reasonDisabled,
    depositQuote.usdTarget,
    effectiveSelectedTokenId,
    selectedNetwork.id
  ]);

  useEffect(() => {
    saveSiteSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;

    const load = async () => {
      try {
        const next = await loadNetworkDashboard(selectedNetwork);
        if (!cancelled) {
          setDashboardData(next);
        }
      } catch (error) {
        if (!cancelled) {
          setDashboardData({
            networkId: selectedNetwork.id,
            networkLabel: selectedNetwork.label,
            status: "empty",
            reason: extractMessage(error),
            jobsToday: 0,
            uniqueParticipants24h: 0,
            koinMinted: "0",
            walletGraph: [],
            activity: []
          });
        }
      }

      timer = window.setTimeout(load, 30000);
    };

    void load();

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [selectedNetwork]);

  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;
    let failureIndex = 0;

    const poll = async () => {
      const pending = sessions.filter((entry) => entry.jobId && !isTerminalState(entry.lastKnownState));
      if (!pending.length) {
        return;
      }

      let hadError = false;

      try {
        const updates = await Promise.all(
          pending.map(async (session) => {
            const network = profileConfig.networks[session.networkId];
            if (!network || !session.jobId) {
              return session;
            }

            const client = createChainClient(network);
            if (!client.isConfigured()) {
              return session;
            }

            try {
              const pollResult = await client.pollJob(session.jobId);
              const runArtifact = await resolveRunSnapshotArtifact(network, session.jobId);
              const responseHash = pollResult.responseHash ?? session.runSnapshot?.responseHash;
              const receipt = responseHash ? await resolveReceiptArtifact(network, session.jobId, responseHash) : null;
              const resultArtifact = responseHash ? await resolveResultArtifact(network, session.jobId, responseHash) : null;
              const result = resultArtifact ?? receipt?.body.output ?? session.result;
              const runSnapshot = buildRunSnapshot({
                requestHash: session.requestHash ?? runArtifact?.requestHash ?? "",
                chainState: pollResult.state,
                jobId: session.jobId,
                responseHash,
                proof: pollResult.proof ?? session.proof,
                artifact: runArtifact,
                result
              });

              const nextArtifactPaths = session.artifactPaths?.job
                ? {
                    job: session.artifactPaths.job,
                    run: session.artifactPaths.run,
                    receipt:
                      responseHash && network.artifactTransport.publicBaseUrl
                        ? `${network.artifactTransport.publicBaseUrl.replace(/\/+$/, "")}/receipts/${network.id}/${session.jobId}-${responseHash}.json`
                        : session.artifactPaths.receipt,
                    result:
                      responseHash && network.artifactTransport.publicBaseUrl
                        ? `${network.artifactTransport.publicBaseUrl.replace(/\/+$/, "")}/results/${network.id}/${session.jobId}-${responseHash}.json`
                        : session.artifactPaths.result
                  }
                : undefined;

              return {
                ...session,
                lastKnownState: runSnapshot.state,
                proof: runSnapshot.proof,
                result: runSnapshot.result,
                runSnapshot,
                artifactPaths: nextArtifactPaths,
                updatedAt: new Date().toISOString()
              } satisfies WebJobSession;
            } catch {
              hadError = true;
              return session;
            }
          })
        );

        if (!cancelled) {
          setSessions((current) => mergeSessions(current, updates));
        }
      } catch {
        hadError = true;
      }

      if (cancelled) {
        return;
      }

      if (hadError) {
        failureIndex = Math.min(failureIndex + 1, RUN_POLL_DELAYS_MS.length - 1);
      } else {
        failureIndex = 0;
      }

      timer = window.setTimeout(poll, RUN_POLL_DELAYS_MS[failureIndex] + jitterMs());
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [profileConfig, sessions]);

  async function handleConnectBrowserWallet(): Promise<void> {
    try {
      const connection = await connectInjectedWallet(selectedNetwork);
      setConnectedProvider(connection.provider);
      setWallet({
        mode: "browser",
        address: connection.address,
        statusMessage: `${selectedNetwork.label} browser wallet connected.`
      });
      setLastError(undefined);
    } catch (error) {
      setLastError(extractMessage(error));
    }
  }

  async function handleConnectWalletConnect(): Promise<void> {
    try {
      const connection = await connectWalletConnect(selectedNetwork);
      setConnectedProvider(connection.provider);
      setWallet({
        mode: "walletconnect",
        address: connection.address,
        statusMessage: `WalletConnect v2 connected to ${selectedNetwork.label}.`
      });
      setLastError(undefined);
    } catch (error) {
      setLastError(extractMessage(error));
    }
  }

  function confirmDeposit() {
    if (!depositQuote.available) {
      setLastError(depositQuote.reasonDisabled ?? "Deposit is not available for the selected token.");
      return;
    }

    if (wallet.mode === "none") {
      setLastError("Connect a wallet before committing the deposit.");
      return;
    }

    setDepositState({
      status: "committed",
      usdTarget: depositQuote.usdTarget,
      tokenId: effectiveSelectedTokenId,
      amount: depositQuote.depositAmount,
      amountBaseUnits: depositQuote.amountBaseUnits
    });
    setLastError(undefined);
  }

  function resetDeposit() {
    setDepositState({
      status: depositQuote.available ? "quote-ready" : "idle",
      usdTarget: depositQuote.usdTarget,
      tokenId: effectiveSelectedTokenId,
      amount: depositQuote.depositAmount,
      amountBaseUnits: depositQuote.amountBaseUnits,
      reason: depositQuote.reasonDisabled
    });
  }

  async function submitJob(): Promise<void> {
    if (submitDisabledReason) {
      setLastError(submitDisabledReason);
      return;
    }

    if (!connectedProvider) {
      setLastError("Connect a wallet before submitting.");
      return;
    }

    try {
      const recommended = recommendJobType(prompt);
      const manifest = buildManifestFromPrompt({
        prompt,
        contentType: "text/plain",
        metadata: {
          source: "koinara-web-submit",
          networkId: selectedNetwork.id,
          tokenId: effectiveSelectedTokenId,
          usdDepositTarget: depositQuote.usdTarget
        }
      });
      const { requestHash, schemaHash } = buildSubmissionHashes(manifest);
      const deadline = defaultDeadlineForJobType(recommended);
      const sessionId = `${selectedNetwork.id}:${requestHash}`;
      const publishedUrl = await publishJobManifest(selectedNetwork, manifest);
      const client = createChainClient(selectedNetwork);

      setDepositState((current) => ({ ...current, status: "tx-pending" }));
      upsertSession({
        id: sessionId,
        networkId: selectedNetwork.id,
        networkLabel: selectedNetwork.label,
        selectedToken: effectiveSelectedTokenId,
        deposit: {
          ...depositState,
          status: "tx-pending",
          amount: depositQuote.depositAmount,
          amountBaseUnits: depositQuote.amountBaseUnits
        },
        prompt,
        requestHash,
        schemaHash,
        deadline,
        artifactPaths: {
          job: publishedUrl
        },
        lastKnownState: "PendingSignature",
        updatedAt: new Date().toISOString()
      });
      setActiveSessionId(sessionId);

      const result = await client.createJobWithEip1193({
        eip1193Provider: connectedProvider,
        requestHash,
        schemaHash,
        deadline,
        jobType: recommended,
        premiumRewardWei: depositQuote.amountBaseUnits
      });

      const runSnapshot = buildRunSnapshot({
        requestHash,
        chainState: result.jobId ? "Open" : "PendingConfirmation",
        jobId: result.jobId
      });

      upsertSession({
        id: sessionId,
        networkId: selectedNetwork.id,
        networkLabel: selectedNetwork.label,
        selectedToken: effectiveSelectedTokenId,
        deposit: {
          status: "paid",
          usdTarget: depositQuote.usdTarget,
          tokenId: effectiveSelectedTokenId,
          amount: depositQuote.depositAmount,
          amountBaseUnits: depositQuote.amountBaseUnits
        },
        prompt,
        requestHash,
        schemaHash,
        deadline,
        createdTxHash: result.txHash,
        jobId: result.jobId,
        artifactPaths: {
          job: publishedUrl,
          run: result.jobId ? `${selectedNetwork.artifactTransport.publicBaseUrl.replace(/\/+$/, "")}/runs/${result.jobId}.json` : undefined
        },
        lastKnownState: runSnapshot.state,
        runSnapshot,
        updatedAt: new Date().toISOString()
      });

      setPrompt("");
      resetDeposit();
      setLastError(undefined);
    } catch (error) {
      setDepositState((current) => ({ ...current, status: "failed", reason: extractMessage(error) }));
      setLastError(extractMessage(error));
    }
  }

  async function markExpiredActiveJob(): Promise<void> {
    if (!activeSession?.jobId || !connectedProvider) {
      return;
    }

    try {
      setActionPending("mark-expired");
      const client = createChainClient(profileConfig.networks[activeSession.networkId] ?? selectedNetwork);
      await client.markExpiredWithEip1193(activeSession.jobId, connectedProvider);
      setLastError(undefined);
      upsertSession({
        ...activeSession,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      setLastError(extractMessage(error));
    } finally {
      setActionPending(undefined);
    }
  }

  async function claimRefundForActiveJob(): Promise<void> {
    if (!activeSession?.jobId || !connectedProvider) {
      return;
    }

    try {
      setActionPending("claim-refund");
      const client = createChainClient(profileConfig.networks[activeSession.networkId] ?? selectedNetwork);
      await client.claimRefundWithEip1193(activeSession.jobId, connectedProvider);
      setLastError(undefined);
      upsertSession({
        ...activeSession,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      setLastError(extractMessage(error));
    } finally {
      setActionPending(undefined);
    }
  }

  function upsertSession(next: WebJobSession) {
    setSessions((current) => mergeSessions(current, [next]));
  }

  const submitDisabledReason = useMemo(() => {
    if (!selectedNetwork.enabled || !selectedNetwork.jobSubmissionEnabled) {
      return selectedNetwork.reasonDisabled ?? "This network is not accepting web submissions yet.";
    }
    if (!selectedNetwork.rpcUrl || !selectedNetwork.contracts.registry || !selectedNetwork.contracts.verifier) {
      return "Add RPC and contract addresses to enable live web submission.";
    }
    if (!discoveryWriteConfigured) {
      return "Configure a public discovery write endpoint before submitting from the web.";
    }
    if (wallet.mode === "none") {
      return "Connect a wallet first.";
    }
    if (depositState.status !== "committed") {
      return "Commit the 10 USD-equivalent deposit first.";
    }
    if (!prompt.trim()) {
      return "Enter a job request.";
    }
    if (!depositQuote.available) {
      return depositQuote.reasonDisabled;
    }
    if (depositQuote.token.kind !== "native") {
      return "Only native-token payment rails are live in the current protocol.";
    }
    return undefined;
  }, [depositQuote, depositState.status, discoveryWriteConfigured, prompt, selectedNetwork, wallet.mode]);

  return (
    <SitePortalContext.Provider
      value={{
        networks,
        selectedNetworkId,
        selectedNetwork,
        setSelectedNetworkId,
        dashboardData,
        wallet,
        connectBrowserWallet: handleConnectBrowserWallet,
        connectWalletConnect: handleConnectWalletConnect,
        selectedTokenId: effectiveSelectedTokenId,
        setSelectedTokenId,
        depositQuote,
        depositState,
        confirmDeposit,
        resetDeposit,
        prompt,
        setPrompt,
        sessions,
        activeSession,
        setActiveSessionId,
        submitDisabledReason,
        submitJob,
        canMarkExpired,
        canClaimRefund,
        actionPending,
        markExpiredActiveJob,
        claimRefundForActiveJob,
        lastError,
        discoveryWriteConfigured
      }}
    >
      {children}
    </SitePortalContext.Provider>
  );
}

export function useSitePortal() {
  const context = useContext(SitePortalContext);
  if (!context) {
    throw new Error("useSitePortal must be used within SitePortalProvider.");
  }
  return context;
}

function mergeSessions(current: WebJobSession[], updates: WebJobSession[]): WebJobSession[] {
  const map = new Map(current.map((entry) => [entry.id, entry]));
  for (const update of updates) {
    map.set(update.id, update);
  }
  return sortSessions(Array.from(map.values()));
}

function isTerminalState(state: WebJobSession["lastKnownState"]): boolean {
  return state === "Settled" || state === "Expired" || state === "Rejected";
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

function jitterMs(): number {
  return Math.floor(Math.random() * 900);
}

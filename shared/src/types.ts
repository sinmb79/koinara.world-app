export type ChainProfileName = "testnet" | "mainnet";
export type JobTypeName = "Simple" | "General" | "Collective";
export type JobStateName =
  | "Created"
  | "Open"
  | "Submitted"
  | "UnderVerification"
  | "Accepted"
  | "Rejected"
  | "Settled"
  | "Expired";
export type NetworkId = string;
export type SupportedTokenId = string;
export type PaymentAdapterId = string;
export type SupportedTokenKind = "native" | "erc20";
export type TokenPricingMode = "peg" | "oracle" | "disabled";
export type ArtifactTransportMode = "ipfs-first";
export type DepositStatus = "idle" | "quote-ready" | "committed" | "tx-pending" | "paid" | "failed";
export type RunLaneStatus = "pending" | "active" | "completed" | "failed" | "unavailable";
export type RunLaneStage = "planning" | "split" | "execute" | "synthesis" | "verify" | "proof";

export interface SupportedTokenConfig {
  id: SupportedTokenId;
  symbol: string;
  kind: SupportedTokenKind;
  address?: string;
  decimals: number;
  adapter: PaymentAdapterId;
  enabled: boolean;
  depositEnabled: boolean;
  jobSubmissionEnabled: boolean;
  pricingMode: TokenPricingMode;
  pricingSourceLabel?: string;
  referenceUsdPrice?: string;
  reasonDisabled?: string;
}

export interface ArtifactTransportConfig {
  mode: ArtifactTransportMode;
  publicBaseUrl: string;
  gatewayUrls: string[];
}

export interface ChainConfig {
  id: NetworkId;
  label: string;
  enabled: boolean;
  depositEnabled: boolean;
  jobSubmissionEnabled: boolean;
  reasonDisabled?: string;
  chainId: number;
  rpcUrl: string;
  backupRpcUrls: string[];
  explorerBaseUrl: string;
  confirmationsRequired: number;
  recommendedGasBufferNative: string;
  nativeToken: {
    type: string;
    symbol: string;
    address?: string;
  };
  contracts: {
    registry: string;
    verifier: string;
    rewardDistributor: string;
    token: string;
  };
  discoveryDefaults: {
    writableRoot: string;
    resultRoot: string;
  };
  artifactTransport: ArtifactTransportConfig;
  payments: {
    defaultTokenId: SupportedTokenId;
    supportedTokens: SupportedTokenConfig[];
  };
  fees: {
    minimumPremiumByJobType: Record<JobTypeName, string>;
  };
  releaseLinks: {
    app: string;
    node: string;
    protocol: string;
  };
}

export interface ChainProfileConfig {
  defaultNetwork: NetworkId;
  networks: Record<NetworkId, ChainConfig>;
}

export interface JobManifest {
  version: "koinara-job-manifest-v1";
  requestHash: string;
  body: {
    prompt: string;
    contentType: string;
    schema: Record<string, unknown>;
    metadata: Record<string, unknown>;
  };
}

export interface SubmissionReceipt {
  version: "koinara-submission-receipt-v1";
  jobId: number;
  responseHash: string;
  provider: string;
  body: {
    contentType: string;
    output: unknown;
    metadata: Record<string, unknown>;
  };
}

export interface HashVectorFixture {
  name: string;
  manifestBody: JobManifest["body"];
  requestHash: string;
  schemaHash: string;
  receiptBody: SubmissionReceipt["body"];
  responseHash: string;
}

export interface VerificationRecord {
  provider: string;
  responseHash: string;
  submittedAt: bigint;
  approvals: bigint;
  quorum: bigint;
  validJob: boolean;
  withinDeadline: boolean;
  formatPass: boolean;
  nonEmptyResponse: boolean;
  verificationPass: boolean;
  rejected: boolean;
  finalized: boolean;
  poiHash: string;
}

export interface OnChainJob {
  jobId: bigint;
  creator: string;
  requestHash: string;
  schemaHash: string;
  deadline: bigint;
  jobType: bigint;
  premiumReward: bigint;
  state: bigint;
}

export interface OnChainSubmission {
  provider: string;
  responseHash: string;
  submittedAt: bigint;
  exists: boolean;
}

export interface JobTimelineEvent {
  type:
    | "state"
    | "response"
    | "registered"
    | "verified"
    | "rejected"
    | "proof"
    | "reward"
    | "premiumReleased"
    | "premiumRefunded";
  jobId: number;
  blockNumber?: number;
  args: Record<string, unknown>;
}

export interface JobProgressSnapshot {
  jobId: number;
  state: JobStateName;
  participants: string[];
  approvals: number;
  quorum: number;
  rejectedReason?: string;
  settledAtBlock?: number;
  lastBlock?: number;
}

export interface ProofSnapshot {
  jobId: number;
  blockNumber: number;
  provider: string;
  approvals: number;
  quorum: number;
  approvedVerifiers: string[];
  poiHash: string;
  explorerUrl: string | null;
}

export interface DepositState {
  status: DepositStatus;
  usdTarget: string;
  tokenId?: SupportedTokenId;
  amount?: string;
  amountBaseUnits?: string;
  reason?: string;
}

export interface PlanArtifact {
  version: "koinara-plan-artifact-v1";
  jobId: number;
  requestHash: string;
  workflowMode: "single-path" | "collective";
  status: "pending" | "ready";
  planner?: string;
  summary: string;
  taskIds: string[];
}

export interface TaskArtifact {
  version: "koinara-task-artifact-v1";
  jobId: number;
  taskId: string;
  title: string;
  stage: RunLaneStage;
  status: RunLaneStatus;
  assignedAgent?: string;
  dependsOn: string[];
  detail?: string;
}

export interface PartialResultArtifact {
  version: "koinara-partial-result-artifact-v1";
  jobId: number;
  taskId: string;
  status: "pending" | "completed" | "failed";
  summary: string;
  provider?: string;
  responseHash?: string;
}

export interface SynthesisArtifact {
  version: "koinara-synthesis-artifact-v1";
  jobId: number;
  status: "pending" | "active" | "completed" | "failed";
  summary: string;
  provider?: string;
  responseHash?: string;
}

export interface RunLane {
  id: string;
  label: string;
  stage: RunLaneStage;
  status: RunLaneStatus;
  agent?: string;
  detail?: string;
}

export interface RunSnapshot {
  version: "koinara-run-snapshot-v1";
  requestHash: string;
  jobId?: number;
  workflowMode: "single-path" | "collective";
  detailsStatus: "available" | "chain-only";
  state: JobStateName | "PendingSignature" | "PendingConfirmation";
  lanes: RunLane[];
  responseHash?: string;
  proof?: ProofSnapshot;
  result?: unknown;
}

export interface WebJobSession {
  id: string;
  networkId: NetworkId;
  networkLabel: string;
  selectedToken: SupportedTokenId;
  deposit: DepositState;
  prompt: string;
  requestHash?: string;
  schemaHash?: string;
  deadline?: number;
  createdTxHash?: string;
  jobId?: number;
  artifactPaths?: {
    job: string;
    run?: string;
    receipt?: string;
    result?: string;
  };
  lastKnownState: RunSnapshot["state"];
  proof?: ProofSnapshot;
  result?: unknown;
  runSnapshot?: RunSnapshot;
  updatedAt: string;
}

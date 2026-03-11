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
export type SupportedTokenId = "wlc" | "wl" | "koin";
export type PaymentAdapterId = "wlc" | "wl" | "koin";
export type SupportedTokenKind = "native" | "erc20";

export interface SupportedTokenConfig {
  id: SupportedTokenId;
  symbol: string;
  kind: SupportedTokenKind;
  address?: string;
  decimals: number;
  adapter: PaymentAdapterId;
  enabled: boolean;
  reasonDisabled?: string;
}

export interface ChainConfig {
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
  supportedTokens: SupportedTokenConfig[];
  discoveryDefaults: {
    writableRoot: string;
    resultRoot: string;
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

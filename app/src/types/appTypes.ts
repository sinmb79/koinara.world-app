import type { JobStateName, ProofSnapshot, SupportedTokenId } from "@koinara/shared";

export interface AppJobSession {
  requestHash: string;
  schemaHash: string;
  createdTxHash?: string;
  jobId?: number;
  selectedToken: SupportedTokenId;
  deadline: number;
  discoveryRoot: string;
  lastKnownState: JobStateName | "PendingSignature" | "PendingConfirmation";
  lastPolledBlock?: number;
  updatedAt: string;
  promptPreview: string;
  responseHash?: string;
  proof?: ProofSnapshot;
  result?: unknown;
}

export interface WalletState {
  mode: "none" | "walletconnect" | "built-in";
  address?: string;
  builtInExists: boolean;
  builtInUnlocked: boolean;
  statusMessage?: string;
}

export interface AppErrorDescriptor {
  bucket: "retryable" | "recoverable" | "fatal";
  title: string;
  action: "retry" | "settings" | "dismiss";
  detail: string;
}

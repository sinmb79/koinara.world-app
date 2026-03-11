import type { ChainConfig, JobManifest, SubmissionReceipt } from "@koinara/shared";

declare global {
  interface Window {
    koinara?: {
      selectDiscoveryRoot(): Promise<string | null>;
      writeManifest(root: string, manifest: JobManifest): Promise<string>;
      readReceipt(root: string, jobId: number, responseHash: string): Promise<SubmissionReceipt | null>;
      readResult(root: string, jobId: number, responseHash: string): Promise<unknown | null>;
      saveWallet(privateKey: string, passphrase: string): Promise<{ address: string }>;
      unlockWallet(passphrase: string): Promise<{ address: string }>;
      lockWallet(): Promise<void>;
      deleteWallet(): Promise<void>;
      walletStatus(): Promise<{ exists: boolean; unlocked: boolean; address?: string }>;
      submitBuiltInJob(payload: {
        chain: ChainConfig;
        requestHash: string;
        schemaHash: string;
        deadline: number;
        jobType: number;
        premiumRewardWei: string;
      }): Promise<{ txHash: string; jobId?: number }>;
      markExpiredBuiltIn(payload: { chain: ChainConfig; jobId: number }): Promise<{ txHash: string }>;
      claimRefundBuiltIn(payload: { chain: ChainConfig; jobId: number }): Promise<{ txHash: string }>;
      estimateCreateJobGas(payload: {
        chain: ChainConfig;
        requestHash: string;
        schemaHash: string;
        deadline: number;
        jobType: number;
        premiumRewardWei: string;
      }): Promise<{ gasUnits: string; estimatedNative: string }>;
    };
  }
}

export {};

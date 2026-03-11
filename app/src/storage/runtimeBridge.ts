import type { ChainConfig, JobManifest, SubmissionReceipt } from "@koinara/shared";

const manifestKey = "koinara-manifests";
const receiptKey = "koinara-receipts";
const resultKey = "koinara-results";
const browserWalletKey = "koinara-browser-wallet-status";

export interface RuntimeBridge {
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
}

export function getRuntimeBridge(): RuntimeBridge {
  return window.koinara ?? createBrowserRuntimeBridge();
}

export function createBrowserRuntimeBridge(): RuntimeBridge {
  return {
    async selectDiscoveryRoot() {
      return "browser-memory-root";
    },
    async writeManifest(root, manifest) {
      const manifests = readRecord<JobManifest>(manifestKey);
      manifests[`${root}:${manifest.requestHash}`] = manifest;
      writeRecord(manifestKey, manifests);
      return `${root}/jobs/${manifest.requestHash}.json`;
    },
    async readReceipt(root, jobId, responseHash) {
      const receipts = readRecord<SubmissionReceipt>(receiptKey);
      return receipts[`${root}:${jobId}:${responseHash}`] ?? null;
    },
    async readResult(root, jobId, responseHash) {
      const results = readRecord<unknown>(resultKey);
      return results[`${root}:${jobId}:${responseHash}`] ?? null;
    },
    async saveWallet() {
      writeObject(browserWalletKey, { exists: true, unlocked: false });
      return { address: "browser-wallet" };
    },
    async unlockWallet() {
      writeObject(browserWalletKey, { exists: true, unlocked: true, address: "browser-wallet" });
      return { address: "browser-wallet" };
    },
    async lockWallet() {
      const status = readObject<{ exists: boolean; unlocked: boolean; address?: string }>(browserWalletKey, {
        exists: false,
        unlocked: false
      });
      writeObject(browserWalletKey, { ...status, unlocked: false });
    },
    async deleteWallet() {
      localStorage.removeItem(browserWalletKey);
    },
    async walletStatus() {
      return readObject<{ exists: boolean; unlocked: boolean; address?: string }>(browserWalletKey, {
        exists: false,
        unlocked: false
      });
    },
    async submitBuiltInJob() {
      return { txHash: "browser-built-in-job", jobId: 1 };
    },
    async markExpiredBuiltIn() {
      return { txHash: "browser-mark-expired" };
    },
    async claimRefundBuiltIn() {
      return { txHash: "browser-claim-refund" };
    },
    async estimateCreateJobGas() {
      return { gasUnits: "21000", estimatedNative: "0.00042" };
    }
  };
}

function readRecord<T>(key: string): Record<string, T> {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return {};
  }
  return JSON.parse(raw) as Record<string, T>;
}

function writeRecord<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function readObject<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

function writeObject<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

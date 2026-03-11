import { contextBridge, ipcRenderer } from "electron";
import type { ChainConfig, JobManifest, SubmissionReceipt } from "@koinara/shared";

const api = {
  selectDiscoveryRoot: () => ipcRenderer.invoke("runtime:selectDiscoveryRoot") as Promise<string | null>,
  writeManifest: (root: string, manifest: JobManifest) =>
    ipcRenderer.invoke("runtime:writeManifest", root, manifest) as Promise<string>,
  readReceipt: (root: string, jobId: number, responseHash: string) =>
    ipcRenderer.invoke("runtime:readReceipt", root, jobId, responseHash) as Promise<SubmissionReceipt | null>,
  readResult: (root: string, jobId: number, responseHash: string) =>
    ipcRenderer.invoke("runtime:readResult", root, jobId, responseHash) as Promise<unknown | null>,
  saveWallet: (privateKey: string, passphrase: string) =>
    ipcRenderer.invoke("wallet:save", privateKey, passphrase) as Promise<{ address: string }>,
  unlockWallet: (passphrase: string) =>
    ipcRenderer.invoke("wallet:unlock", passphrase) as Promise<{ address: string }>,
  lockWallet: () => ipcRenderer.invoke("wallet:lock") as Promise<void>,
  deleteWallet: () => ipcRenderer.invoke("wallet:delete") as Promise<void>,
  walletStatus: () =>
    ipcRenderer.invoke("wallet:status") as Promise<{ exists: boolean; unlocked: boolean; address?: string }>,
  submitBuiltInJob: (payload: {
    chain: ChainConfig;
    requestHash: string;
    schemaHash: string;
    deadline: number;
    jobType: number;
    premiumRewardWei: string;
  }) => ipcRenderer.invoke("chain:builtInCreateJob", payload) as Promise<{ txHash: string; jobId?: number }>,
  markExpiredBuiltIn: (payload: { chain: ChainConfig; jobId: number }) =>
    ipcRenderer.invoke("chain:builtInMarkExpired", payload) as Promise<{ txHash: string }>,
  claimRefundBuiltIn: (payload: { chain: ChainConfig; jobId: number }) =>
    ipcRenderer.invoke("chain:builtInClaimRefund", payload) as Promise<{ txHash: string }>,
  estimateCreateJobGas: (payload: {
    chain: ChainConfig;
    requestHash: string;
    schemaHash: string;
    deadline: number;
    jobType: number;
    premiumRewardWei: string;
  }) =>
    ipcRenderer.invoke("chain:estimateGas", payload) as Promise<{
      gasUnits: string;
      estimatedNative: string;
    }>
};

contextBridge.exposeInMainWorld("koinara", api);

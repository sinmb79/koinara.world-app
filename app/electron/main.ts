import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { Contract, JsonRpcProvider, formatEther } from "ethers";
import type { ChainConfig, JobManifest, SubmissionReceipt } from "@koinara/shared";
import { registryAbi } from "@koinara/shared";
import { claimBuiltInJobRefund, createBuiltInJob, markBuiltInJobExpired } from "./walletTransactions.js";
import { deleteWalletVault, lockWalletVault, saveWalletVault, unlockWalletVault, walletStatus } from "./walletVault.js";

const isDev = !app.isPackaged;
const userDataRoot = app.getPath("userData");
const currentDir = dirname(fileURLToPath(import.meta.url));

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1120,
    minHeight: 760,
    webPreferences: {
      preload: join(currentDir, "preload.js"),
      contextIsolation: true,
      sandbox: false
    }
  });

  if (isDev) {
    void win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    void win.loadFile(resolve(currentDir, "../dist-renderer/index.html"));
  }
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  lockWalletVault();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function registerIpc(): void {
  ipcMain.handle("runtime:selectDiscoveryRoot", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"]
    });
    return result.canceled ? null : result.filePaths[0] ?? null;
  });

  ipcMain.handle("runtime:writeManifest", async (_event, root: string, manifest: JobManifest) => {
    const target = resolve(root, "jobs", `${manifest.requestHash}.json`);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(manifest, null, 2), "utf8");
    return target;
  });

  ipcMain.handle("runtime:readReceipt", async (_event, root: string, jobId: number, responseHash: string) => {
    return readJsonMaybe<SubmissionReceipt>(resolve(root, "receipts", `${jobId}-${responseHash}.json`));
  });

  ipcMain.handle("runtime:readResult", async (_event, root: string, jobId: number, responseHash: string) => {
    return readJsonMaybe<unknown>(resolve(root, "results", `${jobId}-${responseHash}.json`));
  });

  ipcMain.handle("wallet:save", async (_event, privateKey: string, passphrase: string) => {
    return saveWalletVault(userDataRoot, privateKey, passphrase);
  });
  ipcMain.handle("wallet:unlock", async (_event, passphrase: string) => unlockWalletVault(userDataRoot, passphrase));
  ipcMain.handle("wallet:lock", async () => lockWalletVault());
  ipcMain.handle("wallet:delete", async () => deleteWalletVault(userDataRoot));
  ipcMain.handle("wallet:status", async () => walletStatus(userDataRoot));

  ipcMain.handle("chain:builtInCreateJob", async (_event, payload: BuiltInCreatePayload) => {
    return createBuiltInJob(payload.chain, payload);
  });

  ipcMain.handle("chain:builtInMarkExpired", async (_event, payload: BuiltInActionPayload) => {
    return markBuiltInJobExpired(payload.chain, payload.jobId);
  });

  ipcMain.handle("chain:builtInClaimRefund", async (_event, payload: BuiltInActionPayload) => {
    return claimBuiltInJobRefund(payload.chain, payload.jobId);
  });

  ipcMain.handle("chain:estimateGas", async (_event, payload: BuiltInEstimatePayload) => {
    const provider = new JsonRpcProvider(payload.chain.rpcUrl, payload.chain.chainId || undefined);
    const registry = new Contract(payload.chain.contracts.registry, registryAbi, provider);
    const gas = await registry.createJob.estimateGas(
      payload.requestHash,
      payload.schemaHash,
      payload.deadline,
      payload.jobType,
      { value: BigInt(payload.premiumRewardWei) }
    );
    const feeData = await provider.getFeeData();
    const price = feeData.gasPrice ?? 0n;
    return {
      gasUnits: gas.toString(),
      estimatedNative: formatEther(gas * price)
    };
  });
}

interface BuiltInCreatePayload {
  chain: ChainConfig;
  requestHash: string;
  schemaHash: string;
  deadline: number;
  jobType: number;
  premiumRewardWei: string;
}

interface BuiltInActionPayload {
  chain: ChainConfig;
  jobId: number;
}

interface BuiltInEstimatePayload extends BuiltInCreatePayload {}

function readJsonMaybe<T>(path: string): T | null {
  if (!existsSync(path)) {
    return null;
  }

  return JSON.parse(readFileSync(path, "utf8")) as T;
}

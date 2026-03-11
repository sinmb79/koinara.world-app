import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { JsonRpcProvider, Wallet } from "ethers";
import type { ChainConfig } from "@koinara/shared";

export interface BuiltInWalletVaultRecord {
  version: "koinara-wallet-vault-v1";
  ciphertext: string;
  salt: string;
  nonce: string;
  authTag: string;
  createdAt: string;
}

let unlockedPrivateKey: Buffer | null = null;
let unlockedAddress: string | null = null;

export function resolveVaultPath(baseDir: string): string {
  return resolve(baseDir, ".wallet-vault.json");
}

export function walletStatus(baseDir: string): { exists: boolean; unlocked: boolean; address?: string } {
  const vaultPath = resolveVaultPath(baseDir);
  return {
    exists: existsSync(vaultPath),
    unlocked: unlockedPrivateKey !== null,
    address: unlockedAddress ?? undefined
  };
}

export function saveWalletVault(baseDir: string, privateKey: string, passphrase: string): { address: string } {
  const wallet = new Wallet(privateKey);
  const salt = randomBytes(16);
  const nonce = randomBytes(12);
  const key = scryptSync(passphrase, salt, 32);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const ciphertext = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const record: BuiltInWalletVaultRecord = {
    version: "koinara-wallet-vault-v1",
    ciphertext: ciphertext.toString("hex"),
    salt: salt.toString("hex"),
    nonce: nonce.toString("hex"),
    authTag: authTag.toString("hex"),
    createdAt: new Date().toISOString()
  };

  const vaultPath = resolveVaultPath(baseDir);
  mkdirSync(dirname(vaultPath), { recursive: true });
  writeFileSync(vaultPath, JSON.stringify(record, null, 2), "utf8");
  return { address: wallet.address };
}

export function unlockWalletVault(baseDir: string, passphrase: string): { address: string } {
  const record = readVault(baseDir);
  const key = scryptSync(passphrase, Buffer.from(record.salt, "hex"), 32);
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(record.nonce, "hex"));
  decipher.setAuthTag(Buffer.from(record.authTag, "hex"));
  const privateKey = Buffer.concat([
    decipher.update(Buffer.from(record.ciphertext, "hex")),
    decipher.final()
  ]);
  const wallet = new Wallet(privateKey.toString("utf8"));
  unlockedPrivateKey?.fill(0);
  unlockedPrivateKey = Buffer.from(privateKey);
  unlockedAddress = wallet.address;
  return { address: wallet.address };
}

export function lockWalletVault(): void {
  unlockedPrivateKey?.fill(0);
  unlockedPrivateKey = null;
  unlockedAddress = null;
}

export function deleteWalletVault(baseDir: string): void {
  lockWalletVault();
  const vaultPath = resolveVaultPath(baseDir);
  if (existsSync(vaultPath)) {
    rmSync(vaultPath);
  }
}

export function withBuiltInWallet<T>(chain: ChainConfig, fn: (wallet: Wallet) => Promise<T>): Promise<T> {
  if (!unlockedPrivateKey) {
    throw new Error("Built-in wallet is locked.");
  }

  const provider = new JsonRpcProvider(chain.rpcUrl, chain.chainId || undefined);
  const wallet = new Wallet(unlockedPrivateKey.toString("utf8"), provider);
  return fn(wallet);
}

function readVault(baseDir: string): BuiltInWalletVaultRecord {
  const vaultPath = resolveVaultPath(baseDir);
  if (!existsSync(vaultPath)) {
    throw new Error("Wallet vault is not initialized.");
  }
  return JSON.parse(readFileSync(vaultPath, "utf8")) as BuiltInWalletVaultRecord;
}

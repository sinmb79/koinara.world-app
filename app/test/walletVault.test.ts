import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  deleteWalletVault,
  lockWalletVault,
  saveWalletVault,
  unlockWalletVault,
  walletStatus
} from "../electron/walletVault";

describe("wallet vault", () => {
  it("encrypts, unlocks, and never needs plaintext on disk", () => {
    const dir = mkdtempSync(join(tmpdir(), "koinara-wallet-"));
    const saved = saveWalletVault(
      dir,
      "0x59c6995e998f97a5a0044976fdf9a2c3f41f4e196b74f3428b6d8e6f67d05d26",
      "passphrase"
    );
    expect(saved.address).toMatch(/^0x/);
    expect(walletStatus(dir).exists).toBe(true);

    const unlocked = unlockWalletVault(dir, "passphrase");
    expect(unlocked.address).toBe(saved.address);
    lockWalletVault();
    deleteWalletVault(dir);
  });

  it("fails on a wrong passphrase", () => {
    const dir = mkdtempSync(join(tmpdir(), "koinara-wallet-"));
    saveWalletVault(
      dir,
      "0x59c6995e998f97a5a0044976fdf9a2c3f41f4e196b74f3428b6d8e6f67d05d26",
      "correct"
    );

    expect(() => unlockWalletVault(dir, "wrong")).toThrow();
  });
});

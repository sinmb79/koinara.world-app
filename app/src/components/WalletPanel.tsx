import { useState } from "react";
import { useAppContext } from "../state/AppContext";

export function WalletPanel() {
  const {
    wallet,
    connectWalletConnect,
    saveBuiltInWallet,
    unlockBuiltInWallet,
    lockBuiltInWallet,
    deleteBuiltInWallet
  } = useAppContext();
  const [privateKey, setPrivateKey] = useState("");
  const [passphrase, setPassphrase] = useState("");

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Wallet</h2>
        <span className="subtle">{wallet.address ?? "No wallet connected"}</span>
      </div>
      <div className="wallet-grid">
        <button type="button" onClick={() => void connectWalletConnect()}>
          Connect WalletConnect v2
        </button>
        <label className="field">
          <span>Built-in private key</span>
          <input
            type="password"
            value={privateKey}
            onChange={(event) => setPrivateKey(event.target.value)}
            placeholder="0x..."
          />
        </label>
        <label className="field">
          <span>Passphrase</span>
          <input
            type="password"
            value={passphrase}
            onChange={(event) => setPassphrase(event.target.value)}
            placeholder="Used for AES-256-GCM vault encryption"
          />
        </label>
        <div className="inline-row">
          <button type="button" onClick={() => void saveBuiltInWallet(privateKey, passphrase)}>
            Save built-in wallet
          </button>
          <button type="button" onClick={() => void unlockBuiltInWallet(passphrase)}>
            Unlock
          </button>
          <button type="button" onClick={() => void lockBuiltInWallet()}>
            Lock
          </button>
          <button type="button" onClick={() => void deleteBuiltInWallet()}>
            Delete
          </button>
        </div>
      </div>
      <small>
        Wallet vault status: {wallet.builtInExists ? "stored" : "missing"} /{" "}
        {wallet.builtInUnlocked ? "unlocked in memory" : "locked"}
      </small>
    </section>
  );
}

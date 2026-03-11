import type { ChainConfig, SupportedTokenConfig } from "@koinara/shared";

interface DepositConsoleProps {
  networks: ChainConfig[];
  selectedNetworkId: string;
  onSelectNetwork(networkId: string): void;
  selectedTokenId: string;
  onSelectToken(tokenId: string): void;
  tokens: SupportedTokenConfig[];
  walletAddress?: string;
  walletStatus?: string;
  onConnectBrowser(): Promise<void>;
  onConnectWalletConnect(): Promise<void>;
  depositLabel: string;
  depositReason?: string;
  depositCommitted: boolean;
  onConfirmDeposit(): void;
}

export function DepositConsole(props: DepositConsoleProps) {
  return (
    <section className="site-panel deposit-console">
      <div className="panel-headline">
        <div>
          <p className="site-eyebrow">Step 1</p>
          <h2>Connect a wallet and lock the deposit</h2>
        </div>
        <span className={`status-chip ${props.depositCommitted ? "ok" : "pending"}`}>
          {props.depositCommitted ? "Deposit committed" : "Deposit not committed"}
        </span>
      </div>

      <div className="deposit-grid">
        <div className="field-stack">
          <label htmlFor="network-select">Network</label>
          <select id="network-select" value={props.selectedNetworkId} onChange={(event) => props.onSelectNetwork(event.target.value)}>
            {props.networks.map((network) => (
              <option key={network.id} value={network.id}>
                {network.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-stack">
          <label>Wallet</label>
          <div className="wallet-actions">
            <button type="button" className="site-link-button dark" onClick={() => void props.onConnectBrowser()}>
              Browser wallet
            </button>
            <button type="button" className="site-link-button outline-dark" onClick={() => void props.onConnectWalletConnect()}>
              WalletConnect
            </button>
          </div>
          <small>{props.walletAddress ? `${props.walletAddress.slice(0, 6)}...${props.walletAddress.slice(-4)}` : props.walletStatus ?? "No wallet connected yet."}</small>
        </div>
      </div>

      <div className="token-matrix">
        {props.tokens.map((token) => {
          const selected = token.id === props.selectedTokenId;
          const disabled = !token.depositEnabled || !token.jobSubmissionEnabled || !token.enabled;
          return (
            <button
              key={token.id}
              type="button"
              className={`token-card ${selected ? "selected" : ""}`}
              disabled={disabled}
              onClick={() => props.onSelectToken(token.id)}
              title={disabled ? token.reasonDisabled : `${token.symbol} deposit rail`}
            >
              <strong>{token.symbol}</strong>
              <span>{token.kind === "native" ? "native rail" : "erc20 rail"}</span>
              <small>{disabled ? token.reasonDisabled : token.pricingSourceLabel ?? "available"}</small>
            </button>
          );
        })}
      </div>

      <div className="deposit-summary">
        <div>
          <strong>Deposit quote</strong>
          <p>{props.depositLabel}</p>
          {props.depositReason ? (
            <small>{props.depositReason}</small>
          ) : (
            <small>Use the 10 USD-equivalent deposit to unlock the composer and open a public run.</small>
          )}
        </div>
        <button type="button" className="wallet-button" onClick={props.onConfirmDeposit} disabled={Boolean(props.depositReason)}>
          Confirm deposit
        </button>
      </div>
    </section>
  );
}

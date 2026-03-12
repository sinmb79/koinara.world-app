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
  walletMode?: "none" | "browser" | "walletconnect";
  onConnectBrowser(): Promise<void>;
  onConnectWalletConnect(): Promise<void>;
  depositLabel: string;
  depositReason?: string;
  depositCommitted: boolean;
  onConfirmDeposit(): void;
}

export function DepositConsole(props: DepositConsoleProps) {
  return (
    <section className="deposit-console">
      <div className="deposit-shell">
        <div className="deposit-visual-card site-panel">
          <div className="deposit-visual-icon">
            <span className="material-symbols-outlined" aria-hidden="true">
              lock
            </span>
          </div>
          <h3>Lock collateral</h3>
          <p>Secure your position in the inference swarm by providing the required token deposit.</p>
        </div>

        <div className="deposit-controls-card site-panel">
          <div className="panel-headline panel-headline-stack">
            <div>
              <h2>Connect a wallet and lock the deposit</h2>
              <p>
                To participate in the network, link your Web3 wallet and provide the required collateral. This protects run
                reliability.
              </p>
            </div>
          </div>

          <div className="field-stack">
            <label htmlFor="network-select">Select network</label>
            <div className="select-shell">
              <select id="network-select" value={props.selectedNetworkId} onChange={(event) => props.onSelectNetwork(event.target.value)}>
                {props.networks.map((network) => (
                  <option key={network.id} value={network.id}>
                    {network.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined" aria-hidden="true">
                expand_more
              </span>
            </div>
          </div>

          <div className="field-stack">
            <label>Wallet provider</label>
            <div className="provider-grid">
              <button
                type="button"
                className={`provider-card ${props.walletMode === "browser" ? "selected" : ""}`}
                onClick={() => void props.onConnectBrowser()}
              >
                <div className="provider-icon browser">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    account_balance_wallet
                  </span>
                </div>
                <div className="provider-copy">
                  <strong>Browser wallet</strong>
                  <span>MetaMask, Rabby, Frame</span>
                </div>
                {props.walletMode === "browser" ? (
                  <span className="material-symbols-outlined provider-check" aria-hidden="true">
                    check_circle
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                className={`provider-card ${props.walletMode === "walletconnect" ? "selected" : ""}`}
                onClick={() => void props.onConnectWalletConnect()}
              >
                <div className="provider-icon walletconnect">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    qr_code_scanner
                  </span>
                </div>
                <div className="provider-copy">
                  <strong>WalletConnect</strong>
                  <span>Mobile and multi-chain</span>
                </div>
                {props.walletMode === "walletconnect" ? (
                  <span className="material-symbols-outlined provider-check" aria-hidden="true">
                    check_circle
                  </span>
                ) : null}
              </button>
            </div>
            <small>{props.walletAddress ? `${props.walletAddress.slice(0, 6)}...${props.walletAddress.slice(-4)}` : props.walletStatus ?? "No wallet connected yet."}</small>
          </div>

          <div className="field-stack">
            <label>Select asset to deposit</label>
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
                    <div className="token-card-top">
                      <span className={`token-mark token-${token.symbol.toLowerCase()}`}>{token.symbol}</span>
                      <span className={`token-badge ${badgeVariant(token, disabled)}`}>{badgeLabel(token, disabled)}</span>
                    </div>
                    <strong>{tokenName(token.symbol)}</strong>
                    <span>{token.pricingSourceLabel ?? (disabled ? "Visible but disabled" : "Live deposit rail")}</span>
                    <small>{disabled ? token.reasonDisabled : token.kind === "native" ? "Native token payment rail" : "ERC20 payment rail"}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="deposit-summary">
            <div className="deposit-copy">
              <strong>Deposit quote</strong>
              <p>{props.depositLabel}</p>
              <small>{props.depositReason ?? "Use the 10 USD-equivalent deposit to unlock the composer and open a public run."}</small>
            </div>
            <button type="button" className="wallet-button primary-action" onClick={props.onConfirmDeposit} disabled={Boolean(props.depositReason)}>
              {props.depositCommitted ? "Deposit committed" : "Confirm deposit"}
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function badgeLabel(token: SupportedTokenConfig, disabled: boolean): string {
  if (disabled) {
    return "Staged";
  }
  if (token.pricingMode === "peg") {
    return "Stable";
  }
  return "Live";
}

function badgeVariant(token: SupportedTokenConfig, disabled: boolean): string {
  if (disabled) {
    return "muted";
  }
  if (token.pricingMode === "peg") {
    return "stable";
  }
  return "live";
}

function tokenName(symbol: string): string {
  switch (symbol) {
    case "WLC":
      return "WLC Token";
    case "WL":
      return "WL Core";
    case "KOIN":
      return "KOINARA";
    case "USDC":
      return "USD Coin";
    case "USDT":
      return "Tether";
    case "ETH":
      return "Ethereum";
    case "BNB":
      return "BNB";
    default:
      return symbol;
  }
}

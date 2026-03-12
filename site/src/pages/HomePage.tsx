import { Link } from "react-router-dom";
import { DepositConsole } from "../components/DepositConsole";
import { ResultDrawer } from "../components/ResultDrawer";
import { RunBoard } from "../components/RunBoard";
import { useSitePortal } from "../state/SitePortalContext";

const samplePrompts = [
  "Summarize the latest risk memo into three action items for an operator.",
  "Break down the product backlog into legal, financial, and technical review lanes.",
  "Audit the smart contract release and synthesize a final launch recommendation."
];

const quickLinks = [
  {
    to: "/guide",
    icon: "menu_book",
    title: "Guide",
    detail: "Follow the wallet, deposit, submit, and proof flow step by step."
  },
  {
    to: "/download",
    icon: "download",
    title: "Download",
    detail: "Install the desktop client and the independent node package."
  },
  {
    to: "/docs",
    icon: "description",
    title: "Docs",
    detail: "Read protocol, discovery, proof, and operator references."
  },
  {
    to: "/network",
    icon: "language",
    title: "Network",
    detail: "Inspect live chain activity and the staged multi-chain matrix."
  }
] as const;

export function HomePage() {
  const {
    activeSession,
    actionPending,
    canClaimRefund,
    canMarkExpired,
    claimRefundForActiveJob,
    confirmDeposit,
    connectBrowserWallet,
    connectWalletConnect,
    depositQuote,
    depositState,
    discoveryWriteConfigured,
    lastError,
    markExpiredActiveJob,
    networks,
    prompt,
    selectedNetwork,
    selectedNetworkId,
    selectedTokenId,
    setPrompt,
    setSelectedNetworkId,
    setSelectedTokenId,
    submitDisabledReason,
    submitJob,
    wallet
  } = useSitePortal();

  const composerLocked = depositState.status !== "committed";

  return (
    <div className="site-stack home-stack">
      <section className="stage-hero site-panel">
        <div className="stage-header">
          <span className="site-status-pill">{selectedNetwork.label}</span>
        </div>
        <h2>Step 1: Deposit &amp; Wallet</h2>
        <p>Deposit first, then open an inference swarm to start processing transactions on the network.</p>
      </section>

      <DepositConsole
        networks={networks}
        selectedNetworkId={selectedNetworkId}
        onSelectNetwork={setSelectedNetworkId}
        selectedTokenId={selectedTokenId}
        onSelectToken={setSelectedTokenId}
        tokens={selectedNetwork.payments.supportedTokens}
        walletAddress={wallet.address}
        walletStatus={wallet.statusMessage}
        walletMode={wallet.mode}
        onConnectBrowser={connectBrowserWallet}
        onConnectWalletConnect={connectWalletConnect}
        depositLabel={`${depositQuote.depositAmount} ${depositQuote.token.symbol} for ${depositQuote.usdTarget} USD`}
        depositReason={depositQuote.reasonDisabled}
        depositCommitted={depositState.status === "committed" || depositState.status === "paid"}
        onConfirmDeposit={confirmDeposit}
      />

      <section className="site-panel composer-panel">
        <div className="panel-headline panel-headline-stack">
          <div className="step-title-row">
            <span className="step-chip">2</span>
            <div>
              <div className="step-meta">
                <span className={`status-chip ${composerLocked ? "pending" : "ok"}`}>
                  {composerLocked ? "Deposit required" : "Deposit committed"}
                </span>
                <span className="inline-note">Step 2 of 4</span>
              </div>
              <h2>Open a job request</h2>
            </div>
          </div>
          <p>
            Define the scope for the autonomous agent network. Your connected workforce is standing by to execute complex
            workflows.
          </p>
        </div>

        <div className="composer-field">
          <label htmlFor="job-request-input">Problem Description</label>
          <textarea
            id="job-request-input"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={8}
            disabled={composerLocked}
            placeholder="Describe the problem you want the connected agent network to solve..."
            aria-label="Koinara web composer"
          />
          <div className="field-note">
            <span className="material-symbols-outlined" aria-hidden="true">
              info
            </span>
            Markdown supported
          </div>
        </div>

        <div className="home-sample-row">
          <span className="suggestion-label">Suggestions</span>
          {samplePrompts.map((sample) => (
            <button key={sample} type="button" className="sample-chip" onClick={() => setPrompt(sample)} disabled={composerLocked}>
              <span className="material-symbols-outlined" aria-hidden="true">
                summarize
              </span>
              {sample}
            </button>
          ))}
        </div>

        <div className="composer-footer composer-footer-accent">
          <div className={`network-callout ${discoveryWriteConfigured ? "ok" : "warning"}`}>
            <span className="material-symbols-outlined" aria-hidden="true">
              {discoveryWriteConfigured ? "check_circle" : "warning"}
            </span>
            <div className="composer-footer-copy">
              <span className="protocol-status">Network status</span>
              <small>
                {lastError ??
                  (discoveryWriteConfigured
                    ? "Public discovery writer configured. The browser can publish the manifest path."
                    : submitDisabledReason ?? "Commit the deposit to unlock job submission.")}
              </small>
            </div>
          </div>

          <div className="action-row">
            <button type="button" className="secondary-button" disabled>
              Save draft
            </button>
            <button type="button" className="wallet-button primary-action" onClick={() => void submitJob()} disabled={Boolean(submitDisabledReason)}>
              Open run on the network
              <span className="material-symbols-outlined" aria-hidden="true">
                rocket_launch
              </span>
            </button>
          </div>
        </div>
      </section>

      <RunBoard session={activeSession} />
      <ResultDrawer
        session={activeSession}
        canMarkExpired={canMarkExpired}
        canClaimRefund={canClaimRefund}
        actionPending={actionPending}
        onMarkExpired={() => void markExpiredActiveJob()}
        onClaimRefund={() => void claimRefundForActiveJob()}
        errorMessage={lastError}
      />

      <section className="site-panel quick-links-panel">
        <div className="panel-headline panel-headline-stack">
          <div>
            <p className="site-eyebrow">Quick resources</p>
            <h3>Keep the operational pages separate from the submit console.</h3>
          </div>
        </div>

        <div className="home-destination-grid">
          {quickLinks.map((item) => (
            <Link key={item.to} to={item.to} className="destination-card">
              <span className="destination-icon material-symbols-outlined" aria-hidden="true">
                {item.icon}
              </span>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

import { Link } from "react-router-dom";
import koiHero from "../assets/koi-hero.webp";
import { DepositConsole } from "../components/DepositConsole";
import { ResultDrawer } from "../components/ResultDrawer";
import { RunBoard } from "../components/RunBoard";
import { useSitePortal } from "../state/SitePortalContext";

const samplePrompts = [
  "Summarize the latest risk memo into three action items for an operator.",
  "Break down the product backlog into legal, financial, and technical review lanes.",
  "Plan a collective run that compares three model strategies and synthesizes one final recommendation."
];

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
      <section className="home-chat-shell">
        <div className="home-greeting-row">
          <div className="home-avatar-shell">
            <img src={koiHero} alt="KOI mascot greeting the user" />
          </div>

          <div className="home-greeting-copy">
            <p className="site-eyebrow">Worldland-first web submit dApp</p>
            <h2>Deposit first, then open an inference swarm.</h2>
            <p>
              The site does not run agents in the browser. It opens work to already-connected Koinara nodes, then shows planning,
              execution, verification, and proof as public artifacts arrive.
            </p>
          </div>
        </div>

        <DepositConsole
          networks={networks}
          selectedNetworkId={selectedNetworkId}
          onSelectNetwork={setSelectedNetworkId}
          selectedTokenId={selectedTokenId}
          onSelectToken={setSelectedTokenId}
          tokens={selectedNetwork.payments.supportedTokens}
          walletAddress={wallet.address}
          walletStatus={wallet.statusMessage}
          onConnectBrowser={connectBrowserWallet}
          onConnectWalletConnect={connectWalletConnect}
          depositLabel={`${depositQuote.depositAmount} ${depositQuote.token.symbol} for ${depositQuote.usdTarget} USD`}
          depositReason={depositQuote.reasonDisabled}
          depositCommitted={depositState.status === "committed" || depositState.status === "paid"}
          onConfirmDeposit={confirmDeposit}
        />

        <section className="site-panel composer-panel">
          <div className="panel-headline">
            <div>
              <p className="site-eyebrow">Step 2</p>
              <h2>Open a job request</h2>
            </div>
            <span className={`status-chip ${composerLocked ? "pending" : "ok"}`}>
              {composerLocked ? "Deposit required" : "Composer unlocked"}
            </span>
          </div>

          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={6}
            disabled={composerLocked}
            placeholder="Describe the problem you want the connected agent network to solve. The run board below will show planner, execution, synthesis, verification, and proof states."
            aria-label="Koinara web composer"
          />

          <div className="home-sample-row">
            {samplePrompts.map((sample) => (
              <button key={sample} type="button" className="sample-chip" onClick={() => setPrompt(sample)} disabled={composerLocked}>
                {sample}
              </button>
            ))}
          </div>

          <div className="composer-footer">
            <div className="composer-footer-copy">
              <span className="protocol-status">
                {discoveryWriteConfigured ? "Public discovery writer configured" : "Public discovery writer missing"}
              </span>
              <small>{lastError ?? submitDisabledReason ?? "Commit the deposit to unlock job submission."}</small>
            </div>
            <button type="button" className="wallet-button" onClick={() => void submitJob()} disabled={Boolean(submitDisabledReason)}>
              Open run on the network
            </button>
          </div>
        </section>
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

      <section className="home-destination-grid">
        <Link to="/guide" className="destination-card">
          <strong>Guide</strong>
          <span>Follow the wallet, deposit, submit, and proof flow step by step.</span>
        </Link>
        <Link to="/download" className="destination-card">
          <strong>Download</strong>
          <span>Install the desktop client and the independent node package.</span>
        </Link>
        <Link to="/docs" className="destination-card">
          <strong>Docs</strong>
          <span>Read the protocol, discovery, proof, and operator references on separate pages.</span>
        </Link>
        <Link to="/network" className="destination-card">
          <strong>Network</strong>
          <span>Inspect live chain activity and the currently staged multi-network token matrix.</span>
        </Link>
      </section>
    </div>
  );
}

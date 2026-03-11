const steps = [
  {
    title: "1. Connect a wallet",
    detail: "Use a browser wallet or WalletConnect v2. The site stays serverless, so signing happens entirely in the browser."
  },
  {
    title: "2. Commit the 10 USD-equivalent deposit",
    detail: "Pick the target network and one of the visible token rails. Tokens without a live pricing source or payment rail stay visible but disabled."
  },
  {
    title: "3. Open the job request",
    detail: "After the deposit is committed, the composer unlocks. The browser writes the manifest to public discovery and sends createJob from your wallet."
  },
  {
    title: "4. Watch the run board",
    detail: "The site reads chain state plus public run artifacts. If detailed planning artifacts are missing, it falls back to truthful chain-only status."
  },
  {
    title: "5. Receive result, proof, or refund",
    detail: "Once the run settles, the result pane shows the final output, quorum proof, and any creator action such as mark expired or claim refund."
  }
];

export function GuidePage() {
  return (
    <section className="site-panel">
      <div className="panel-headline">
        <div>
          <h2>Guide</h2>
          <span>How the web submit dApp works from deposit to proof</span>
        </div>
      </div>

      <div className="docs-grid">
        {steps.map((step) => (
          <article key={step.title} className="doc-card">
            <h3>{step.title}</h3>
            <p>{step.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

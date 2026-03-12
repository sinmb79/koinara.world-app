import type { WebJobSession } from "@koinara/shared";

interface ResultDrawerProps {
  session?: WebJobSession;
  canMarkExpired: boolean;
  canClaimRefund: boolean;
  actionPending?: "mark-expired" | "claim-refund";
  onMarkExpired(): void;
  onClaimRefund(): void;
  errorMessage?: string;
}

export function ResultDrawer(props: ResultDrawerProps) {
  const proofLink = props.session?.proof?.explorerUrl;
  const metrics = buildMetrics(props.session);
  const output = props.session?.result ?? { status: "Pending" };

  return (
    <section className="site-panel result-drawer">
      <div className="board-header result-header">
        <div className="step-title-row">
          <span className="step-chip muted">4</span>
          <div>
            <h2>Result and proof</h2>
          </div>
        </div>
        <span className={`token-badge ${props.session?.proof ? "stable" : "warning"}`}>
          {props.session?.proof ? "Proof ready" : "Pending proof"}
        </span>
      </div>

      {!props.session ? (
        <div className="route-warning">No final result yet. Once the network settles the run, the summary, proof, and refund actions will appear here.</div>
      ) : (
        <div className="result-layout">
          <article className="result-summary-card">
            <div className="result-summary-copy">
              <h3>Final execution summary</h3>
              <p>
                {props.session.result
                  ? "The current run returned an artifact payload. You can inspect the proof, export the JSON, and continue into verification."
                  : "A detailed breakdown will appear here once the swarm completes the current task cycle."}
              </p>
            </div>

            <div className="metric-grid">
              {metrics.map((metric) => (
                <div key={metric.label} className="metric-card">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>

            <pre className="code-block">{JSON.stringify(output, null, 2)}</pre>

            <div className="action-row">
              <a
                className={`wallet-button primary-action ${proofLink ? "" : "disabled-link"}`}
                href={proofLink ?? "#"}
                target={proofLink ? "_blank" : undefined}
                rel={proofLink ? "noreferrer" : undefined}
                onClick={(event) => {
                  if (!proofLink) {
                    event.preventDefault();
                  }
                }}
              >
                View proof
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
              </a>
              <button type="button" className="secondary-button" onClick={() => exportSession(props.session)}>
                <span className="material-symbols-outlined" aria-hidden="true">
                  download
                </span>
                Export JSON
              </button>
            </div>
          </article>

          <article className="operations-card">
            <div className="operations-header">
              <span className="material-symbols-outlined" aria-hidden="true">
                account_balance_wallet
              </span>
              <h3>Operational costs</h3>
            </div>

            <div className="operations-breakdown">
              <div>
                <span>Total allocated</span>
                <strong>{allocatedDeposit(props.session)}</strong>
              </div>
              <div>
                <span>Refund status</span>
                <strong>{refundStatus(props.canMarkExpired, props.canClaimRefund, props.session)}</strong>
              </div>
            </div>

            <p className="operations-note">
              Excess compute is returned to your wallet only when the protocol state allows it. The site never takes custody of the refund.
            </p>

            <div className="operations-actions">
              {props.canMarkExpired ? (
                <button type="button" className="secondary-button wide" onClick={props.onMarkExpired} disabled={props.actionPending === "mark-expired"}>
                  {props.actionPending === "mark-expired" ? "Marking expired..." : "Mark expired"}
                </button>
              ) : null}
              {props.canClaimRefund ? (
                <button type="button" className="secondary-button wide" onClick={props.onClaimRefund} disabled={props.actionPending === "claim-refund"}>
                  {props.actionPending === "claim-refund" ? "Claiming refund..." : "Claim refund"}
                </button>
              ) : null}
              {!props.canMarkExpired && !props.canClaimRefund ? (
                <button type="button" className="secondary-button wide" disabled>
                  Request refund early
                </button>
              ) : null}
            </div>

            {props.errorMessage ? <div className="route-warning compact">{props.errorMessage}</div> : null}
          </article>
        </div>
      )}
    </section>
  );
}

function buildMetrics(session?: WebJobSession) {
  const laneCount = session?.runSnapshot?.lanes.length ?? 0;
  const detailsMode = session?.runSnapshot?.detailsStatus === "available" ? "Artifact live" : "Chain only";
  const jobState = session?.lastKnownState ?? "Pending";
  const verifierProgress = session?.proof ? `${session.proof.approvals}/${session.proof.quorum}` : "Pending";

  return [
    { label: "Total lanes", value: String(laneCount || 4) },
    { label: "Artifact mode", value: detailsMode },
    { label: "Job state", value: jobState },
    { label: "Verifier progress", value: verifierProgress }
  ];
}

function allocatedDeposit(session: WebJobSession): string {
  return `${session.deposit.amount ?? "Pending"} ${tokenSymbolFromId(session.selectedToken)}`;
}

function refundStatus(canMarkExpired: boolean, canClaimRefund: boolean, session?: WebJobSession): string {
  if (canMarkExpired) {
    return "Needs expiry";
  }
  if (canClaimRefund) {
    return "Eligible now";
  }
  return session?.proof ? "Proof pending settlement" : "Pending proof";
}

function tokenSymbolFromId(tokenId: string): string {
  const parts = tokenId.split("-");
  return parts[parts.length - 1]?.toUpperCase() ?? tokenId.toUpperCase();
}

function exportSession(session?: WebJobSession) {
  if (!session || typeof window === "undefined") {
    return;
  }

  const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `koinara-run-${session.jobId ?? "draft"}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

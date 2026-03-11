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

  return (
    <section className="site-panel result-drawer">
      <div className="panel-headline">
        <div>
          <p className="site-eyebrow">Step 4</p>
          <h2>Result and proof</h2>
        </div>
        <span className="status-chip">{props.session?.proof ? "Proof ready" : "Pending proof"}</span>
      </div>

      {!props.session ? (
        <div className="empty-run">
          <strong>No final result yet.</strong>
          <p>Once the network settles the job, this panel will show the answer, proof details, and any refund action you can trigger.</p>
        </div>
      ) : (
        <>
          <div className="result-grid">
            <article className="artifact-card">
              <strong>Final output</strong>
              <pre className="code-block">{JSON.stringify(props.session.result ?? { status: "Pending" }, null, 2)}</pre>
            </article>
            <article className="artifact-card">
              <strong>Proof</strong>
              <div className="proof-list">
                <span>jobId: {props.session.proof?.jobId ?? props.session.jobId ?? "pending"}</span>
                <span>provider: {props.session.proof?.provider ?? "pending"}</span>
                <span>quorum: {props.session.proof ? `${props.session.proof.approvals}/${props.session.proof.quorum}` : "pending"}</span>
                <span>poiHash: {props.session.proof?.poiHash ?? "pending"}</span>
                {proofLink ? (
                  <a href={proofLink} target="_blank" rel="noreferrer">
                    Open explorer proof
                  </a>
                ) : null}
              </div>
            </article>
          </div>

          {(props.canMarkExpired || props.canClaimRefund || props.errorMessage) && (
            <div className="composer-footer">
              <div className="composer-footer-copy">
                <span className="protocol-status">Creator actions</span>
                <small>
                  {props.errorMessage ??
                    (props.canMarkExpired
                      ? "The job deadline has passed while the run is still open. Mark it expired before claiming a refund."
                      : props.canClaimRefund
                        ? "This run can return the premium directly to your wallet."
                        : "No creator action is currently required.")}
                </small>
              </div>
              <div className="wallet-actions">
                {props.canMarkExpired ? (
                  <button
                    type="button"
                    className="site-link-button dark"
                    onClick={props.onMarkExpired}
                    disabled={props.actionPending === "mark-expired"}
                  >
                    {props.actionPending === "mark-expired" ? "Marking expired..." : "Mark expired"}
                  </button>
                ) : null}
                {props.canClaimRefund ? (
                  <button
                    type="button"
                    className="site-link-button outline-dark"
                    onClick={props.onClaimRefund}
                    disabled={props.actionPending === "claim-refund"}
                  >
                    {props.actionPending === "claim-refund" ? "Claiming refund..." : "Claim refund"}
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

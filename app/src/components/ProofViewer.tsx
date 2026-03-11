import type { ProofSnapshot } from "@koinara/shared";

export function ProofViewer({ proof }: { proof?: ProofSnapshot }) {
  if (!proof) {
    return <div className="panel">Proof will appear after PoI finalization.</div>;
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>On-chain Consensus Proof</h2>
      </div>
      <dl className="detail-grid">
        <div>
          <dt>Job ID</dt>
          <dd>{proof.jobId}</dd>
        </div>
        <div>
          <dt>Block</dt>
          <dd>{proof.blockNumber}</dd>
        </div>
        <div>
          <dt>Provider</dt>
          <dd>{proof.provider}</dd>
        </div>
        <div>
          <dt>Approvals</dt>
          <dd>
            {proof.approvals}/{proof.quorum}
          </dd>
        </div>
        <div>
          <dt>PoI Hash</dt>
          <dd>{proof.poiHash}</dd>
        </div>
        <div>
          <dt>Verifiers</dt>
          <dd>{proof.approvedVerifiers.join(", ") || "Pending"}</dd>
        </div>
      </dl>
      {proof.explorerUrl ? (
        <a href={proof.explorerUrl} target="_blank" rel="noreferrer">
          Open in explorer
        </a>
      ) : null}
    </section>
  );
}

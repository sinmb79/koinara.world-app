import type { WebJobSession } from "@koinara/shared";

export function RunBoard({ session }: { session?: WebJobSession }) {
  return (
    <section className="site-panel run-board">
      <div className="panel-headline">
        <div>
          <p className="site-eyebrow">Step 3</p>
          <h2>Swarm run board</h2>
        </div>
        <span className="status-chip">{session?.lastKnownState ?? "Waiting for submission"}</span>
      </div>

      {!session ? (
        <div className="empty-run">
          <strong>No active run yet.</strong>
          <p>After you commit the deposit and open a job, the planner, execution, verification, and proof lanes will appear here.</p>
        </div>
      ) : (
        <>
          <div className="run-meta">
            <article className="artifact-card">
              <strong>requestHash</strong>
              <span>{session.requestHash ?? "pending"}</span>
            </article>
            <article className="artifact-card">
              <strong>jobId</strong>
              <span>{session.jobId ?? "pending"}</span>
            </article>
            <article className="artifact-card">
              <strong>artifact detail</strong>
              <span>{session.runSnapshot?.detailsStatus ?? "chain-only"}</span>
            </article>
          </div>

          <div className="run-lanes">
            {(session.runSnapshot?.lanes ?? []).map((lane) => (
              <article key={lane.id} className={`run-lane lane-${lane.status}`}>
                <div className="run-lane-head">
                  <strong>{lane.label}</strong>
                  <span>{lane.status}</span>
                </div>
                <small>{lane.detail}</small>
                {lane.agent ? <span className="lane-agent">{lane.agent}</span> : null}
              </article>
            ))}
          </div>

          {session.runSnapshot?.detailsStatus === "chain-only" ? (
            <div className="route-warning">
              Detailed planning and split artifacts are not published yet, so the board is currently showing truthful chain-only state.
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

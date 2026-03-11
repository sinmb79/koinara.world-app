import type { AppJobSession } from "../types/appTypes";

const stages = ["Open", "Submitted", "UnderVerification", "Accepted", "Settled"] as const;

export function ProgressTracker({ session }: { session: AppJobSession }) {
  const currentStageIndex = stages.indexOf(
    stages.includes(session.lastKnownState as (typeof stages)[number])
      ? (session.lastKnownState as (typeof stages)[number])
      : "Open"
  );

  return (
    <div className="progress-card">
      <div className="progress-header">
        <strong>Job #{session.jobId ?? "pending"}</strong>
        <span>
          {session.networkLabel} · {session.lastKnownState}
        </span>
      </div>
      <div className="stage-row">
        {stages.map((stage, index) => (
          <span key={stage} className={`stage-chip ${index <= currentStageIndex ? "done" : ""}`}>
            {stage}
          </span>
        ))}
      </div>
      <small>{session.promptPreview}</small>
    </div>
  );
}

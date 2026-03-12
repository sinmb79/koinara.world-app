import type { RunLane, RunLaneStatus, WebJobSession } from "@koinara/shared";

const boardGroups = [
  {
    id: "planner",
    title: "Planner",
    icon: "tactic",
    stages: ["planning", "split"],
    emptyDetail: "Awaiting task breakdown..."
  },
  {
    id: "execution",
    title: "Execution",
    icon: "memory",
    stages: ["execute", "synthesis"],
    emptyDetail: "Stand by for plan"
  },
  {
    id: "verification",
    title: "Verification",
    icon: "verified_user",
    stages: ["verify"],
    emptyDetail: "Wait for execution"
  },
  {
    id: "proof",
    title: "ZKP Proof",
    icon: "shield_lock",
    stages: ["proof"],
    emptyDetail: "Waiting for data"
  }
] satisfies ReadonlyArray<{
  id: string;
  title: string;
  icon: string;
  stages: RunLane["stage"][];
  emptyDetail: string;
}>;

export function RunBoard({ session }: { session?: WebJobSession }) {
  const progress = progressFromState(session?.lastKnownState);
  const progressLabel = statusLabel(session?.lastKnownState);
  const lanes = boardGroups.map((group) => summarizeGroup(group, session?.runSnapshot?.lanes ?? []));

  return (
    <section className="site-panel run-board">
      <div className="board-header">
        <div className="step-title-row">
          <span className="step-chip">3</span>
          <div>
            <h2>Swarm Run Board</h2>
            <p>Monitor real-time agent execution across the decentralized cluster and verify proofs once finalized.</p>
          </div>
        </div>

        <div className="board-progress">
          <span className="board-progress-label">{progressLabel}</span>
          <div className="board-progress-track" aria-hidden="true">
            <div className="board-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <strong>{progress}%</strong>
        </div>
      </div>

      <div className="board-lanes-grid">
        {lanes.map((lane) => (
          <article key={lane.id} className={`board-lane-card lane-${lane.status}`}>
            <div className="board-lane-head">
              <strong>{lane.title}</strong>
              <span className={`token-badge ${badgeVariantForStatus(lane.status)}`}>{badgeLabelForStatus(lane.status)}</span>
            </div>
            <div className="board-lane-body">
              <span className="material-symbols-outlined board-lane-icon" aria-hidden="true">
                {lane.icon}
              </span>
              <p>{lane.detail}</p>
              {lane.agent ? <small>{lane.agent}</small> : null}
            </div>
          </article>
        ))}
      </div>

      {!session ? (
        <div className="route-warning">Waiting for submission. The board will fill in as soon as a job is opened on the network.</div>
      ) : session.runSnapshot?.detailsStatus === "chain-only" ? (
        <div className="route-warning">Detailed planning artifacts are not published yet, so the board is currently showing truthful chain-only status.</div>
      ) : null}
    </section>
  );
}

function summarizeGroup(
  group: (typeof boardGroups)[number],
  lanes: RunLane[]
): { id: string; title: string; icon: string; status: RunLaneStatus; detail: string; agent?: string } {
  const matches = lanes.filter((lane) => (group.stages as RunLane["stage"][]).includes(lane.stage));
  if (!matches.length) {
    return {
      id: group.id,
      title: group.title,
      icon: group.icon,
      status: group.id === "planner" ? "active" : "pending",
      detail: group.emptyDetail
    };
  }

  const selected =
    matches.find((lane) => lane.status === "active") ??
    matches.find((lane) => lane.status === "failed") ??
    matches.find((lane) => lane.status === "completed") ??
    matches[0];

  return {
    id: group.id,
    title: group.title,
    icon: group.icon,
    status: pickGroupStatus(matches.map((lane) => lane.status)),
    detail: selected.detail ?? group.emptyDetail,
    agent: selected.agent
  };
}

function pickGroupStatus(statuses: RunLaneStatus[]): RunLaneStatus {
  if (statuses.includes("failed")) {
    return "failed";
  }
  if (statuses.includes("active")) {
    return "active";
  }
  if (statuses.every((status) => status === "completed")) {
    return "completed";
  }
  if (statuses.includes("pending")) {
    return "pending";
  }
  return "unavailable";
}

function progressFromState(state?: WebJobSession["lastKnownState"]): number {
  switch (state) {
    case "PendingSignature":
      return 5;
    case "PendingConfirmation":
      return 12;
    case "Created":
    case "Open":
      return 25;
    case "Submitted":
      return 50;
    case "UnderVerification":
      return 72;
    case "Accepted":
      return 88;
    case "Settled":
      return 100;
    case "Rejected":
    case "Expired":
      return 100;
    default:
      return 25;
  }
}

function statusLabel(state?: WebJobSession["lastKnownState"]): string {
  if (!state) {
    return "Waiting for submission";
  }
  switch (state) {
    case "Settled":
      return "Proof finalized";
    case "Rejected":
      return "Run rejected";
    case "Expired":
      return "Run expired";
    default:
      return state;
  }
}

function badgeLabelForStatus(status: RunLaneStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "active":
      return "Active";
    case "failed":
      return "Failed";
    case "pending":
      return "Pending";
    default:
      return "Idle";
  }
}

function badgeVariantForStatus(status: RunLaneStatus): string {
  switch (status) {
    case "completed":
      return "stable";
    case "active":
      return "live";
    case "failed":
      return "warning";
    case "pending":
      return "muted";
    default:
      return "muted";
  }
}

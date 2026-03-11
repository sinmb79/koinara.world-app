import type { JobStateName, ProofSnapshot, RunLane, RunLaneStatus, RunSnapshot } from "../types.js";

export function buildRunSnapshot(input: {
  requestHash: string;
  chainState: JobStateName | "PendingSignature" | "PendingConfirmation";
  jobId?: number;
  responseHash?: string;
  proof?: ProofSnapshot;
  artifact?: Partial<RunSnapshot> | null;
  result?: unknown;
}): RunSnapshot {
  const artifact = input.artifact ?? undefined;
  const detailsStatus = artifact?.detailsStatus === "available" || (artifact?.lanes?.length ?? 0) > 0 ? "available" : "chain-only";
  const workflowMode = artifact?.workflowMode ?? "single-path";

  return {
    version: "koinara-run-snapshot-v1",
    requestHash: input.requestHash,
    jobId: input.jobId ?? artifact?.jobId,
    workflowMode,
    detailsStatus,
    state: input.chainState,
    lanes: detailsStatus === "available" ? (artifact?.lanes ?? []) : buildChainOnlyLanes(input.chainState),
    responseHash: input.responseHash ?? artifact?.responseHash,
    proof: input.proof ?? artifact?.proof,
    result: input.result ?? artifact?.result
  };
}

function buildChainOnlyLanes(state: RunSnapshot["state"]): RunLane[] {
  return [
    lane("planning", "Planner", chainOnlyStatus(state, "planning"), "Detailed planner artifact is unavailable."),
    lane("split", "Task Split", chainOnlyStatus(state, "split"), "Detailed task split is unavailable."),
    lane("execute", "Execution", chainOnlyStatus(state, "execute"), "Providers can execute once the job is open."),
    lane("synthesis", "Synthesis", chainOnlyStatus(state, "synthesis"), "Synthesis details will appear when a run snapshot is published."),
    lane("verify", "Verification", chainOnlyStatus(state, "verify"), "Verifier quorum is tracked from chain state."),
    lane("proof", "Proof", chainOnlyStatus(state, "proof"), "Proof details become available once acceptance finalizes.")
  ];
}

function lane(stage: RunLane["stage"], label: string, status: RunLaneStatus, detail: string): RunLane {
  return {
    id: stage,
    label,
    stage,
    status,
    detail
  };
}

function chainOnlyStatus(state: RunSnapshot["state"], stage: RunLane["stage"]): RunLaneStatus {
  switch (state) {
    case "PendingSignature":
    case "PendingConfirmation":
      return stage === "planning" || stage === "split" ? "unavailable" : "pending";
    case "Created":
    case "Open":
      if (stage === "execute") {
        return "active";
      }
      return stage === "planning" || stage === "split" ? "unavailable" : "pending";
    case "Submitted":
      if (stage === "execute") {
        return "completed";
      }
      if (stage === "verify") {
        return "active";
      }
      return stage === "planning" || stage === "split" ? "unavailable" : "pending";
    case "UnderVerification":
      if (stage === "execute") {
        return "completed";
      }
      if (stage === "verify") {
        return "active";
      }
      return stage === "planning" || stage === "split" ? "unavailable" : "pending";
    case "Accepted":
    case "Settled":
      if (stage === "planning" || stage === "split") {
        return "unavailable";
      }
      return "completed";
    case "Rejected":
    case "Expired":
      if (stage === "verify" || stage === "proof") {
        return "failed";
      }
      if (stage === "execute") {
        return "completed";
      }
      return stage === "planning" || stage === "split" ? "unavailable" : "pending";
  }
}

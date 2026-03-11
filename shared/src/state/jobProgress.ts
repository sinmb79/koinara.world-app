import type { JobProgressSnapshot, JobStateName, JobTimelineEvent } from "../types.js";

const stateMap: Record<number, JobStateName> = {
  0: "Created",
  1: "Open",
  2: "Submitted",
  3: "UnderVerification",
  4: "Accepted",
  5: "Rejected",
  6: "Settled",
  7: "Expired"
};

export function jobStateNameFromValue(value: number): JobStateName {
  return stateMap[value] ?? "Created";
}

export function reduceJobProgress(jobId: number, events: JobTimelineEvent[]): JobProgressSnapshot {
  const snapshot: JobProgressSnapshot = {
    jobId,
    state: "Created",
    participants: [],
    approvals: 0,
    quorum: 0
  };

  for (const event of events.filter((entry) => entry.jobId === jobId)) {
    snapshot.lastBlock = event.blockNumber ?? snapshot.lastBlock;
    if (event.type === "state") {
      snapshot.state = jobStateNameFromValue(Number(event.args.newState ?? 0));
    }
    if (event.type === "response") {
      const provider = String(event.args.provider ?? "");
      if (provider && !snapshot.participants.includes(provider)) {
        snapshot.participants.push(provider);
      }
    }
    if (event.type === "registered") {
      snapshot.quorum = Number(event.args.quorum ?? 0);
    }
    if (event.type === "verified") {
      snapshot.approvals = Number(event.args.approvals ?? 0);
      snapshot.quorum = Number(event.args.quorum ?? snapshot.quorum);
      const verifier = String(event.args.verifier ?? "");
      if (verifier && !snapshot.participants.includes(verifier)) {
        snapshot.participants.push(verifier);
      }
    }
    if (event.type === "rejected") {
      snapshot.state = "Rejected";
      snapshot.rejectedReason = String(event.args.reason ?? "");
    }
    if (event.type === "reward") {
      snapshot.state = "Settled";
      snapshot.settledAtBlock = event.blockNumber;
    }
    if (event.type === "premiumRefunded") {
      snapshot.state = "Expired";
    }
  }

  return snapshot;
}

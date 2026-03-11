import type { ChainConfig, ProofSnapshot, VerificationRecord } from "../types.js";

export function buildProofSnapshot(input: {
  chain: ChainConfig;
  jobId: number;
  blockNumber: number;
  record: VerificationRecord;
  approvedVerifiers: string[];
}): ProofSnapshot {
  const explorerUrl = input.chain.explorerBaseUrl
    ? `${input.chain.explorerBaseUrl.replace(/\/$/, "")}/tx-or-job/${input.jobId}`
    : null;

  return {
    jobId: input.jobId,
    blockNumber: input.blockNumber,
    provider: input.record.provider,
    approvals: Number(input.record.approvals),
    quorum: Number(input.record.quorum),
    approvedVerifiers: input.approvedVerifiers,
    poiHash: input.record.poiHash,
    explorerUrl
  };
}

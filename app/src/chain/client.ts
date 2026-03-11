import { BrowserProvider, Contract, Interface, JsonRpcProvider, formatEther, parseEther } from "ethers";
import type { ChainConfig, JobStateName, ProofSnapshot, VerificationRecord } from "@koinara/shared";
import { buildProofSnapshot, registryAbi, rewardDistributorAbi, verifierAbi } from "@koinara/shared";

export const jobTypeToNumber = {
  Simple: 0,
  General: 1,
  Collective: 2
} as const;

export const jobStateNames: Record<number, JobStateName> = {
  0: "Created",
  1: "Open",
  2: "Submitted",
  3: "UnderVerification",
  4: "Accepted",
  5: "Rejected",
  6: "Settled",
  7: "Expired"
};

export interface JobPollResult {
  jobId: number;
  state: JobStateName;
  responseHash?: string;
  blockNumber?: number;
  proof?: ProofSnapshot;
}

export interface DashboardMetricSnapshot {
  jobsToday: number;
  uniqueParticipants24h: number;
  koinMinted: string;
}

export function createChainClient(config: ChainConfig) {
  const provider = new JsonRpcProvider(config.rpcUrl || "http://localhost:8545", config.chainId || undefined);

  return {
    config,
    isConfigured: () => Boolean(config.rpcUrl && config.contracts.registry && config.contracts.verifier),
    estimatePremiumWei(jobType: keyof typeof jobTypeToNumber) {
      return parseEther(config.fees.minimumPremiumByJobType[jobType]).toString();
    },
    async createJobWithWalletConnect(input: {
      eip1193Provider: unknown;
      requestHash: string;
      schemaHash: string;
      deadline: number;
      jobType: keyof typeof jobTypeToNumber;
      premiumRewardWei: string;
    }) {
      const browserProvider = new BrowserProvider(input.eip1193Provider as never);
      const signer = await browserProvider.getSigner();
      const registry = new Contract(config.contracts.registry, registryAbi, signer);
      const tx = await registry.createJob(
        input.requestHash,
        input.schemaHash,
        input.deadline,
        jobTypeToNumber[input.jobType],
        { value: BigInt(input.premiumRewardWei) }
      );
      const receipt = await tx.wait(config.confirmationsRequired);
      const jobId = parseJobCreatedLog(receipt?.logs ?? []);
      return { txHash: tx.hash as string, jobId };
    },
    async estimateGas(input: {
      requestHash: string;
      schemaHash: string;
      deadline: number;
      jobType: keyof typeof jobTypeToNumber;
      premiumRewardWei: string;
    }) {
      const registry = new Contract(config.contracts.registry, registryAbi, provider);
      const gas = await registry.createJob.estimateGas(
        input.requestHash,
        input.schemaHash,
        input.deadline,
        jobTypeToNumber[input.jobType],
        { value: BigInt(input.premiumRewardWei) }
      );
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice ?? 0n;
      return {
        gasUnits: gas.toString(),
        estimatedNative: formatEther(gas * gasPrice)
      };
    },
    async pollJob(jobId: number): Promise<JobPollResult> {
      const registry = new Contract(config.contracts.registry, registryAbi, provider);
      const verifier = new Contract(config.contracts.verifier, verifierAbi, provider);
      const job = await registry.getJob(jobId);
      const submission = await registry.getSubmission(jobId);
      const state = jobStateNames[Number(job.state)] ?? "Created";
      let proof: ProofSnapshot | undefined;

      if (state === "Accepted" || state === "Settled") {
        const record = (await verifier.getRecord(jobId)) as VerificationRecord;
        if (record.finalized) {
          const approvedVerifiers = (await verifier.getApprovedVerifiers(jobId)) as string[];
          proof = buildProofSnapshot({
            chain: config,
            jobId,
            blockNumber: await provider.getBlockNumber(),
            record,
            approvedVerifiers
          });
        }
      }

      return {
        jobId,
        state,
        responseHash: submission.exists ? submission.responseHash : undefined,
        blockNumber: await provider.getBlockNumber(),
        proof
      };
    },
    async markExpiredWithWalletConnect(jobId: number, eip1193Provider: unknown) {
      const browserProvider = new BrowserProvider(eip1193Provider as never);
      const signer = await browserProvider.getSigner();
      const registry = new Contract(config.contracts.registry, registryAbi, signer);
      const tx = await registry.markExpired(jobId);
      return { txHash: tx.hash as string };
    },
    async claimRefundWithWalletConnect(jobId: number, eip1193Provider: unknown) {
      const browserProvider = new BrowserProvider(eip1193Provider as never);
      const signer = await browserProvider.getSigner();
      const registry = new Contract(config.contracts.registry, registryAbi, signer);
      const tx = await registry.claimPremiumRefund(jobId);
      return { txHash: tx.hash as string };
    },
    async loadDashboardMetrics(): Promise<DashboardMetricSnapshot> {
      if (!config.rpcUrl || !config.contracts.registry || !config.contracts.rewardDistributor) {
        return { jobsToday: 0, uniqueParticipants24h: 0, koinMinted: "0" };
      }

      const registry = new Contract(config.contracts.registry, registryAbi, provider);
      const rewardDistributor = new Contract(config.contracts.rewardDistributor, rewardDistributorAbi, provider);
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 7200);
      const createdLogs = await registry.queryFilter(registry.filters.JobCreated(), fromBlock, currentBlock);
      const responseLogs = (await registry.queryFilter(
        registry.filters.ResponseSubmitted(),
        fromBlock,
        currentBlock
      )) as Array<{ args?: Record<string, unknown>; blockNumber: number }>;
      const rewardLogs = (await rewardDistributor.queryFilter(
        rewardDistributor.filters.RewardsDistributed(),
        fromBlock,
        currentBlock
      )) as Array<{ args?: Record<string, unknown>; blockNumber: number }>;
      const participants = new Set<string>();
      let koinMinted = 0n;

      for (const log of responseLogs) {
        const address = String(log.args?.provider ?? "");
        if (address) {
          participants.add(address.toLowerCase());
        }
      }

      for (const log of rewardLogs) {
        const address = String(log.args?.provider ?? "");
        if (address) {
          participants.add(address.toLowerCase());
        }
        koinMinted +=
          BigInt((log.args?.providerReward as string | number | bigint | boolean | undefined) ?? 0n) +
          BigInt((log.args?.verifierRewardTotal as string | number | bigint | boolean | undefined) ?? 0n);
      }

      return {
        jobsToday: createdLogs.length,
        uniqueParticipants24h: participants.size,
        koinMinted: formatEther(koinMinted)
      };
    }
  };
}

function parseJobCreatedLog(logs: Array<{ topics?: string[]; data?: string }>): number | undefined {
  const iface = new Interface(registryAbi);

  for (const log of logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics ?? [], data: log.data ?? "0x" });
      if (parsed?.name === "JobCreated") {
        return Number(parsed.args.jobId);
      }
    } catch {
      continue;
    }
  }

  return undefined;
}

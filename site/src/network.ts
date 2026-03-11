import { Contract, JsonRpcProvider, formatEther } from "ethers";
import { registryAbi, rewardDistributorAbi, verifierAbi, type ChainConfig } from "@koinara/shared";
import { getDefaultChainConfig } from "@koinara/shared/config/defaultConfigs";

export interface ActivityItem {
  id: string;
  kind: "job" | "response" | "proof" | "reward";
  label: string;
  wallet?: string;
  blockNumber: number;
}

export interface NetworkDashboardData {
  status: "ready" | "empty";
  reason?: string;
  jobsToday: number;
  uniqueParticipants24h: number;
  koinMinted: string;
  walletGraph: string[];
  activity: ActivityItem[];
}

export function getSiteChainConfig(): ChainConfig {
  const profile = (import.meta.env.VITE_CHAIN_PROFILE ?? "testnet") as "testnet" | "mainnet";
  return getDefaultChainConfig(profile);
}

export async function loadNetworkDashboard(config: ChainConfig): Promise<NetworkDashboardData> {
  if (!config.rpcUrl || !config.contracts.registry || !config.contracts.rewardDistributor || !config.contracts.verifier) {
    return {
      status: "empty",
      reason: "Add RPC and contract addresses to config/chain.*.json to enable the live dashboard.",
      jobsToday: 0,
      uniqueParticipants24h: 0,
      koinMinted: "0",
      walletGraph: [],
      activity: []
    };
  }

  const provider = new JsonRpcProvider(config.rpcUrl, config.chainId || undefined);
  const registry = new Contract(config.contracts.registry, registryAbi, provider);
  const rewardDistributor = new Contract(config.contracts.rewardDistributor, rewardDistributorAbi, provider);
  const verifier = new Contract(config.contracts.verifier, verifierAbi, provider);
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - 7200);

  const [createdLogs, responseLogs, proofLogs, rewardLogs] = await Promise.all([
    registry.queryFilter(registry.filters.JobCreated(), fromBlock, currentBlock),
    registry.queryFilter(registry.filters.ResponseSubmitted(), fromBlock, currentBlock),
    verifier.queryFilter(verifier.filters.PoIFinalized(), fromBlock, currentBlock),
    rewardDistributor.queryFilter(rewardDistributor.filters.RewardsDistributed(), fromBlock, currentBlock)
  ]);

  return reduceNetworkLogs(createdLogs, responseLogs, proofLogs, rewardLogs);
}

export function reduceNetworkLogs(
  createdLogs: Array<{ args?: Record<string, unknown>; blockNumber: number }>,
  responseLogs: Array<{ args?: Record<string, unknown>; blockNumber: number }>,
  proofLogs: Array<{ args?: Record<string, unknown>; blockNumber: number }>,
  rewardLogs: Array<{ args?: Record<string, unknown>; blockNumber: number }>
): NetworkDashboardData {
  const participants = new Set<string>();
  const walletGraph = new Set<string>();
  let koinMinted = 0n;
  const activity: ActivityItem[] = [];

  for (const log of createdLogs) {
    activity.push({
      id: `job-${log.blockNumber}-${String(log.args?.jobId ?? "")}`,
      kind: "job",
      label: `Job #${String(log.args?.jobId ?? "?")} created`,
      wallet: String(log.args?.creator ?? ""),
      blockNumber: log.blockNumber
    });
  }

  for (const log of responseLogs) {
    const provider = String(log.args?.provider ?? "");
    if (provider) {
      participants.add(provider.toLowerCase());
      walletGraph.add(provider);
    }
    activity.push({
      id: `response-${log.blockNumber}-${String(log.args?.jobId ?? "")}`,
      kind: "response",
      label: `Provider response for job #${String(log.args?.jobId ?? "?")}`,
      wallet: provider,
      blockNumber: log.blockNumber
    });
  }

  for (const log of proofLogs) {
    const provider = String(log.args?.provider ?? "");
    if (provider) {
      participants.add(provider.toLowerCase());
      walletGraph.add(provider);
    }
    activity.push({
      id: `proof-${log.blockNumber}-${String(log.args?.jobId ?? "")}`,
      kind: "proof",
      label: `PoI finalized for job #${String(log.args?.jobId ?? "?")}`,
      wallet: provider,
      blockNumber: log.blockNumber
    });
  }

  for (const log of rewardLogs) {
    const provider = String(log.args?.provider ?? "");
    if (provider) {
      participants.add(provider.toLowerCase());
      walletGraph.add(provider);
    }
    koinMinted +=
      BigInt((log.args?.providerReward as string | number | bigint | boolean | undefined) ?? 0n) +
      BigInt((log.args?.verifierRewardTotal as string | number | bigint | boolean | undefined) ?? 0n);
    activity.push({
      id: `reward-${log.blockNumber}-${String(log.args?.jobId ?? "")}`,
      kind: "reward",
      label: `Rewards distributed for job #${String(log.args?.jobId ?? "?")}`,
      wallet: provider,
      blockNumber: log.blockNumber
    });
  }

  activity.sort((left, right) => right.blockNumber - left.blockNumber);

  return {
    status: "ready",
    jobsToday: createdLogs.length,
    uniqueParticipants24h: participants.size,
    koinMinted: formatEther(koinMinted),
    walletGraph: Array.from(walletGraph),
    activity: activity.slice(0, 10)
  };
}

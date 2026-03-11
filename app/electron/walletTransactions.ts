import { Contract, Interface } from "ethers";
import type { ChainConfig } from "@koinara/shared";
import { registryAbi } from "@koinara/shared";
import { withBuiltInWallet } from "./walletVault.js";

export async function createBuiltInJob(
  chain: ChainConfig,
  payload: {
    requestHash: string;
    schemaHash: string;
    deadline: number;
    jobType: number;
    premiumRewardWei: string;
  }
): Promise<{ txHash: string; jobId?: number }> {
  return withBuiltInWallet(chain, async (wallet) => {
    const registry = new Contract(chain.contracts.registry, registryAbi, wallet);
    const tx = await registry.createJob(
      payload.requestHash,
      payload.schemaHash,
      payload.deadline,
      payload.jobType,
      { value: BigInt(payload.premiumRewardWei) }
    );
    const receipt = await tx.wait(chain.confirmationsRequired);
    return { txHash: tx.hash, jobId: parseJobCreatedLog(receipt?.logs ?? []) };
  });
}

export async function markBuiltInJobExpired(
  chain: ChainConfig,
  jobId: number
): Promise<{ txHash: string }> {
  return withBuiltInWallet(chain, async (wallet) => {
    const registry = new Contract(chain.contracts.registry, registryAbi, wallet);
    const tx = await registry.markExpired(jobId);
    return { txHash: tx.hash };
  });
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

export async function claimBuiltInJobRefund(
  chain: ChainConfig,
  jobId: number
): Promise<{ txHash: string }> {
  return withBuiltInWallet(chain, async (wallet) => {
    const registry = new Contract(chain.contracts.registry, registryAbi, wallet);
    const tx = await registry.claimPremiumRefund(jobId);
    return { txHash: tx.hash };
  });
}

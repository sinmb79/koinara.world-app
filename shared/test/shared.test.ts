import { describe, expect, it } from "vitest";
import { buildProofSnapshot, computeRequestHash, computeResponseHash, computeSchemaHash, hashVectors, reduceJobProgress } from "../src";
import { getChainProfileConfig, getDefaultChainConfig } from "../src/config/defaultConfigs";

describe("hash parity fixtures", () => {
  it("matches request/schema/response fixtures", () => {
    for (const fixture of hashVectors) {
      expect(computeRequestHash({ body: fixture.manifestBody })).toBe(fixture.requestHash);
      expect(computeSchemaHash({ body: fixture.manifestBody })).toBe(fixture.schemaHash);
      expect(computeResponseHash({ body: fixture.receiptBody })).toBe(fixture.responseHash);
    }
  });
});

describe("chain config validation", () => {
  it("loads default testnet config", () => {
    const config = getDefaultChainConfig("testnet");
    expect(config.id).toBe("worldland-testnet");
    expect(config.payments.supportedTokens[0].id).toBe("worldland-wlc");
    expect(config.fees.minimumPremiumByJobType.General).toBe("0.03");
  });

  it("loads the network bundle for staged rollouts", () => {
    const profile = getChainProfileConfig("mainnet");
    expect(profile.defaultNetwork).toBe("worldland-mainnet");
    expect(Object.keys(profile.networks)).toContain("ethereum-mainnet");
    expect(profile.networks["base-mainnet"]?.enabled).toBe(false);
  });
});

describe("job progress reducer", () => {
  it("tracks participants and settled state", () => {
    const snapshot = reduceJobProgress(7, [
      { type: "state", jobId: 7, blockNumber: 12, args: { newState: 1 } },
      { type: "response", jobId: 7, blockNumber: 13, args: { provider: "0xabc" } },
      { type: "registered", jobId: 7, blockNumber: 14, args: { quorum: 3 } },
      { type: "verified", jobId: 7, blockNumber: 15, args: { verifier: "0xdef", approvals: 2, quorum: 3 } },
      { type: "reward", jobId: 7, blockNumber: 16, args: {} }
    ]);

    expect(snapshot.state).toBe("Settled");
    expect(snapshot.participants).toEqual(["0xabc", "0xdef"]);
    expect(snapshot.quorum).toBe(3);
    expect(snapshot.settledAtBlock).toBe(16);
  });
});

describe("proof snapshot", () => {
  it("builds explorer-safe proof metadata", () => {
    const config = getDefaultChainConfig("testnet");
    const proof = buildProofSnapshot({
      chain: { ...config, explorerBaseUrl: "https://explorer.worldland.test" },
      jobId: 3,
      blockNumber: 99,
      record: {
        provider: "0x123",
        responseHash: "0x456",
        submittedAt: 1n,
        approvals: 3n,
        quorum: 3n,
        validJob: true,
        withinDeadline: true,
        formatPass: true,
        nonEmptyResponse: true,
        verificationPass: true,
        rejected: false,
        finalized: true,
        poiHash: "0xpoi"
      },
      approvedVerifiers: ["0xa", "0xb", "0xc"]
    });

    expect(proof.poiHash).toBe("0xpoi");
    expect(proof.explorerUrl).toContain("/tx-or-job/3");
    expect(proof.approvedVerifiers).toHaveLength(3);
  });
});

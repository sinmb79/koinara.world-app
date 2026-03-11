import { describe, expect, it } from "vitest";
import {
  buildProofSnapshot,
  buildRunSnapshot,
  buildUsdDepositQuote,
  computeRequestHash,
  computeResponseHash,
  computeSchemaHash,
  hashVectors,
  reduceJobProgress
} from "../src";
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

describe("deposit quotes", () => {
  it("builds a 10 USD-equivalent quote for the live Worldland token", () => {
    const config = getDefaultChainConfig("testnet");
    const quote = buildUsdDepositQuote(config, "worldland-wlc", "10");

    expect(quote.available).toBe(true);
    expect(quote.depositAmount).toBe("10.0");
    expect(quote.amountBaseUnits).toBe("10000000000000000000");
  });

  it("keeps a staged peg token disabled until its payment rail is enabled", () => {
    const profile = getChainProfileConfig("mainnet");
    const config = structuredClone(profile.networks["ethereum-mainnet"]);
    const token = config.payments.supportedTokens.find((entry) => entry.id === "ethereum-usdc");

    config.enabled = true;
    config.depositEnabled = true;
    config.jobSubmissionEnabled = true;

    if (!token) {
      throw new Error("Missing ethereum-usdc fixture.");
    }

    token.enabled = true;
    token.depositEnabled = false;
    token.jobSubmissionEnabled = false;

    const quote = buildUsdDepositQuote(config, "ethereum-usdc", "10");

    expect(quote.available).toBe(false);
    expect(quote.reasonDisabled).toContain("not live yet");
  });
});

describe("run snapshot reducer", () => {
  it("falls back to truthful chain-only lanes when no artifact is present", () => {
    const snapshot = buildRunSnapshot({
      requestHash: "0xrequest",
      chainState: "Open",
      jobId: 10
    });

    expect(snapshot.detailsStatus).toBe("chain-only");
    expect(snapshot.lanes.find((lane) => lane.stage === "execute")?.status).toBe("active");
  });

  it("prefers published run artifacts when they are available", () => {
    const snapshot = buildRunSnapshot({
      requestHash: "0xrequest",
      chainState: "Submitted",
      jobId: 10,
      artifact: {
        version: "koinara-run-snapshot-v1",
        requestHash: "0xrequest",
        workflowMode: "collective",
        detailsStatus: "available",
        state: "Submitted",
        lanes: [
          {
            id: "planning",
            label: "Planner",
            stage: "planning",
            status: "completed",
            detail: "Planner published a collective branch map."
          }
        ]
      }
    });

    expect(snapshot.detailsStatus).toBe("available");
    expect(snapshot.workflowMode).toBe("collective");
    expect(snapshot.lanes).toHaveLength(1);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NodeMap } from "../src/components/NodeMap";
import { reduceNetworkLogs } from "../src/network";

describe("network reducer", () => {
  it("counts unique participants", () => {
    const data = reduceNetworkLogs(
      [{ blockNumber: 10, args: { jobId: 1, creator: "0x1" } }],
      [{ blockNumber: 11, args: { jobId: 1, provider: "0xaaa" } }],
      [{ blockNumber: 12, args: { jobId: 1, provider: "0xbbb" } }],
      [{ blockNumber: 13, args: { jobId: 1, provider: "0xaaa", providerReward: 1n, verifierRewardTotal: 2n } }]
    );

    expect(data.uniqueParticipants24h).toBe(2);
    expect(data.koinMinted).not.toBe("0");
  });
});

describe("wallet graph", () => {
  it("renders wallet bubbles", () => {
    render(<NodeMap wallets={["0x1234567890abcdef", "0xfedcba0987654321"]} />);
    expect(screen.getByText(/0x1234\.\.\.cdef/i)).toBeInTheDocument();
    expect(screen.getByText(/0xfedc\.\.\.4321/i)).toBeInTheDocument();
  });
});

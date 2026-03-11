import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { NetworkStats } from "../src/components/NetworkStats";

describe("network stats empty state", () => {
  it("shows explicit empty state messaging", () => {
    render(
      <MemoryRouter>
        <NetworkStats
          data={{
            networkId: "worldland-testnet",
            networkLabel: "Worldland Testnet",
            status: "empty",
            reason: "Add RPC and contract addresses to config/chain.*.json to enable the live dashboard.",
            jobsToday: 0,
            uniqueParticipants24h: 0,
            koinMinted: "0",
            walletGraph: [],
            activity: []
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/enable the live dashboard/i)).toBeInTheDocument();
  });
});

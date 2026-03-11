import { render } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { useJobPolling } from "../src/hooks/useJobPolling";

describe("useJobPolling", () => {
  it("backs off after errors and resumes polling", async () => {
    vi.useFakeTimers();
    const poller = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValue(undefined);

    function Harness() {
      const [sessions] = useState([
        {
          networkId: "worldland-testnet",
          networkLabel: "Worldland Testnet",
          requestHash: "0x1",
          schemaHash: "0x2",
          selectedToken: "worldland-wlc",
          deadline: Math.floor(Date.now() / 1000) + 60,
          discoveryRoot: "root",
          lastKnownState: "Open" as const,
          updatedAt: new Date().toISOString(),
          promptPreview: "hello",
          jobId: 1
        }
      ]);

      useJobPolling({ sessions, enabled: true, poller });
      return null;
    }

    render(<Harness />);
    await vi.advanceTimersByTimeAsync(4000);
    expect(poller).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(15000);
    expect(poller).toHaveBeenCalledTimes(2);
  });
});

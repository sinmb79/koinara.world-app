import { beforeEach, describe, expect, it } from "vitest";
import { loadSessions, upsertSession } from "../src/state/sessionStore";

describe("session store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("upserts and reloads sessions", () => {
    upsertSession({
      networkId: "worldland-testnet",
      networkLabel: "Worldland Testnet",
      requestHash: "0xreq",
      schemaHash: "0xschema",
      selectedToken: "worldland-wlc",
      deadline: 1,
      discoveryRoot: "root",
      lastKnownState: "Open",
      updatedAt: new Date().toISOString(),
      promptPreview: "hello"
    });

    expect(loadSessions()).toHaveLength(1);
    expect(loadSessions()[0].requestHash).toBe("0xreq");
  });
});

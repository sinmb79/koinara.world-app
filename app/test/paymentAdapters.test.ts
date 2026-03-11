import { describe, expect, it } from "vitest";
import { getDefaultChainConfig } from "@koinara/shared/config/defaultConfigs";
import { buildPaymentQuote, createPaymentAggregator } from "../src/payment/adapters";

describe("payment adapters", () => {
  it("builds WLC quote", () => {
    const config = getDefaultChainConfig("testnet");
    const quote = buildPaymentQuote(config, "worldland-wlc", "Simple", "0.001");
    expect(quote.available).toBe(true);
    expect(quote.totalDisplay).toContain("WLC");
  });

  it("keeps WL disabled in MVP", () => {
    const config = getDefaultChainConfig("testnet");
    const quote = buildPaymentQuote(config, "worldland-wl", "General");
    expect(quote.available).toBe(false);
    expect(quote.reasonDisabled).toContain("not live yet");
  });

  it("exposes a network-scoped default token", () => {
    const config = getDefaultChainConfig("mainnet");
    const aggregator = createPaymentAggregator(config);
    expect(aggregator.getDefaultTokenId()).toBe("worldland-wlc");
  });
});

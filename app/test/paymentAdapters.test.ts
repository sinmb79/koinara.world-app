import { describe, expect, it } from "vitest";
import { getDefaultChainConfig } from "@koinara/shared/config/defaultConfigs";
import { buildPaymentQuote } from "../src/payment/adapters";

describe("payment adapters", () => {
  it("builds WLC quote", () => {
    const config = getDefaultChainConfig("testnet");
    const quote = buildPaymentQuote(config, "wlc", "Simple", "0.001");
    expect(quote.available).toBe(true);
    expect(quote.totalDisplay).toContain("WLC");
  });

  it("keeps WL disabled in MVP", () => {
    const config = getDefaultChainConfig("testnet");
    const quote = buildPaymentQuote(config, "wl", "General");
    expect(quote.available).toBe(false);
    expect(quote.reasonDisabled).toContain("MVP");
  });
});

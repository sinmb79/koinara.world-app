import { formatUnits, parseUnits } from "ethers";
import type { ChainConfig, SupportedTokenConfig, SupportedTokenId } from "../types.js";

const USD_SCALE = 8;

export interface DepositQuote {
  token: SupportedTokenConfig;
  usdTarget: string;
  depositAmount: string;
  amountBaseUnits: string;
  available: boolean;
  reasonDisabled?: string;
  pricingSourceLabel?: string;
}

export function buildUsdDepositQuote(
  config: ChainConfig,
  tokenId: SupportedTokenId,
  usdTarget = "10"
): DepositQuote {
  const token = config.payments.supportedTokens.find((entry) => entry.id === tokenId);
  if (!token) {
    throw new Error(`Unknown token: ${tokenId}`);
  }

  const price = resolveUsdPrice(token);
  const available =
    config.enabled &&
    config.depositEnabled &&
    config.jobSubmissionEnabled &&
    token.enabled &&
    token.depositEnabled &&
    token.jobSubmissionEnabled &&
    Boolean(price);

  const amountBaseUnits = price
    ? computeAmountBaseUnits(usdTarget, token.decimals, price)
    : 0n;

  return {
    token,
    usdTarget,
    depositAmount: price ? formatUnits(amountBaseUnits, token.decimals) : "0",
    amountBaseUnits: amountBaseUnits.toString(),
    available,
    pricingSourceLabel: token.pricingSourceLabel,
    reasonDisabled: available ? undefined : buildDisableReason(config, token, price)
  };
}

export function resolveUsdPrice(token: SupportedTokenConfig): bigint | null {
  if (token.pricingMode === "peg") {
    return parseUnits("1", USD_SCALE);
  }

  if (token.pricingMode === "oracle" && token.referenceUsdPrice) {
    return parseUnits(token.referenceUsdPrice, USD_SCALE);
  }

  return null;
}

function computeAmountBaseUnits(usdTarget: string, decimals: number, priceUsd: bigint): bigint {
  const usdScaled = parseUnits(usdTarget, USD_SCALE);
  const base = 10n ** BigInt(decimals);
  return (usdScaled * base + priceUsd - 1n) / priceUsd;
}

function buildDisableReason(config: ChainConfig, token: SupportedTokenConfig, price: bigint | null): string {
  if (!config.enabled || !config.jobSubmissionEnabled) {
    return config.reasonDisabled ?? "This network is not accepting web submissions yet.";
  }

  if (!config.depositEnabled) {
    return "Deposit flow is not enabled for this network yet.";
  }

  if (!token.enabled || !token.jobSubmissionEnabled || !token.depositEnabled) {
    return token.reasonDisabled ?? "This token is visible but not available for live submission.";
  }

  if (!price) {
    return token.reasonDisabled ?? "This token is missing a pricing source.";
  }

  return token.reasonDisabled ?? "This token is not available.";
}

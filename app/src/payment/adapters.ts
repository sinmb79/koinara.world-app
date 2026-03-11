import { formatEther, parseEther } from "ethers";
import type { ChainConfig, JobTypeName, SupportedTokenConfig, SupportedTokenId } from "@koinara/shared";

export interface PaymentQuote {
  token: SupportedTokenConfig;
  minimumPremium: string;
  estimatedGas?: string;
  totalDisplay: string;
  available: boolean;
  reasonDisabled?: string;
}

interface PaymentAdapter {
  buildQuote(jobType: JobTypeName, gasEstimateNative?: string): PaymentQuote;
}

class WlcAdapter implements PaymentAdapter {
  constructor(private readonly token: SupportedTokenConfig, private readonly config: ChainConfig) {}

  buildQuote(jobType: JobTypeName, gasEstimateNative = "0"): PaymentQuote {
    const premium = this.config.fees.minimumPremiumByJobType[jobType];
    const total = parseEther(premium) + parseEther(gasEstimateNative || "0");
    return {
      token: this.token,
      minimumPremium: premium,
      estimatedGas: gasEstimateNative,
      totalDisplay: `${formatEther(total)} ${this.token.symbol}`,
      available: this.token.enabled
    };
  }
}

class DisabledAdapter implements PaymentAdapter {
  constructor(private readonly token: SupportedTokenConfig, private readonly config: ChainConfig) {}

  buildQuote(jobType: JobTypeName): PaymentQuote {
    return {
      token: this.token,
      minimumPremium: this.config.fees.minimumPremiumByJobType[jobType],
      totalDisplay: `Unavailable in MVP (${this.token.symbol})`,
      available: false,
      reasonDisabled: this.token.reasonDisabled ?? "This token flow is disabled."
    };
  }
}

export function buildPaymentQuote(
  config: ChainConfig,
  tokenId: SupportedTokenId,
  jobType: JobTypeName,
  gasEstimateNative?: string
): PaymentQuote {
  const token = config.supportedTokens.find((entry) => entry.id === tokenId);
  if (!token) {
    throw new Error(`Unknown token: ${tokenId}`);
  }

  const adapter =
    token.adapter === "wlc" ? new WlcAdapter(token, config) : new DisabledAdapter(token, config);

  return adapter.buildQuote(jobType, gasEstimateNative);
}

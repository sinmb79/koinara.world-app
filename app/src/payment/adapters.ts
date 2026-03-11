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

export interface PaymentAdapter {
  readonly token: SupportedTokenConfig;
  buildQuote(jobType: JobTypeName, gasEstimateNative?: string): PaymentQuote;
}

class NativeAdapter implements PaymentAdapter {
  constructor(private readonly supportedToken: SupportedTokenConfig, private readonly config: ChainConfig) {}

  buildQuote(jobType: JobTypeName, gasEstimateNative = "0"): PaymentQuote {
    const premium = this.config.fees.minimumPremiumByJobType[jobType];
    const total = parseEther(premium) + parseEther(gasEstimateNative || "0");
    return {
      token: this.supportedToken,
      minimumPremium: premium,
      estimatedGas: gasEstimateNative,
      totalDisplay: `${formatEther(total)} ${this.supportedToken.symbol}`,
      available: this.config.enabled && this.supportedToken.enabled,
      reasonDisabled:
        !this.config.enabled ? this.config.reasonDisabled ?? "This network is not accepting submissions yet." : undefined
    };
  }

  get token(): SupportedTokenConfig {
    return this.supportedToken;
  }
}

class DisabledAdapter implements PaymentAdapter {
  constructor(private readonly supportedToken: SupportedTokenConfig, private readonly config: ChainConfig) {}

  buildQuote(jobType: JobTypeName): PaymentQuote {
    return {
      token: this.supportedToken,
      minimumPremium: this.config.fees.minimumPremiumByJobType[jobType],
      totalDisplay: `Unavailable in MVP (${this.supportedToken.symbol})`,
      available: false,
      reasonDisabled:
        this.config.reasonDisabled ??
        this.supportedToken.reasonDisabled ??
        "This token flow is disabled."
    };
  }

  get token(): SupportedTokenConfig {
    return this.supportedToken;
  }
}

export class PaymentAggregator {
  constructor(private readonly config: ChainConfig) {}

  getDefaultTokenId(): SupportedTokenId {
    return this.config.payments.defaultTokenId;
  }

  getSupportedTokens(): SupportedTokenConfig[] {
    return this.config.payments.supportedTokens;
  }

  getToken(tokenId: SupportedTokenId): SupportedTokenConfig {
    const token = this.config.payments.supportedTokens.find((entry) => entry.id === tokenId);
    if (!token) {
      throw new Error(`Unknown token: ${tokenId}`);
    }
    return token;
  }

  buildQuote(tokenId: SupportedTokenId, jobType: JobTypeName, gasEstimateNative?: string): PaymentQuote {
    return this.createAdapter(this.getToken(tokenId)).buildQuote(jobType, gasEstimateNative);
  }

  private createAdapter(token: SupportedTokenConfig): PaymentAdapter {
    if (this.config.enabled && token.enabled && token.adapter === "native") {
      return new NativeAdapter(token, this.config);
    }

    return new DisabledAdapter(token, this.config);
  }
}

export function createPaymentAggregator(config: ChainConfig): PaymentAggregator {
  return new PaymentAggregator(config);
}

export function buildPaymentQuote(
  config: ChainConfig,
  tokenId: SupportedTokenId,
  jobType: JobTypeName,
  gasEstimateNative?: string
): PaymentQuote {
  return createPaymentAggregator(config).buildQuote(tokenId, jobType, gasEstimateNative);
}

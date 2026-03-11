import mainnetConfig from "../../../config/chain.mainnet.json" with { type: "json" };
import testnetConfig from "../../../config/chain.testnet.json" with { type: "json" };
import type { ChainConfig, ChainProfileName } from "../types.js";

const configMap: Record<ChainProfileName, ChainConfig> = {
  testnet: testnetConfig as ChainConfig,
  mainnet: mainnetConfig as ChainConfig
};

export function getDefaultChainConfig(profile: ChainProfileName): ChainConfig {
  return validateChainConfig(structuredClone(configMap[profile]));
}

export function validateChainConfig(config: ChainConfig): ChainConfig {
  if (!config.supportedTokens.length) {
    throw new Error("Chain config must define at least one supported token.");
  }

  for (const token of config.supportedTokens) {
    if (!token.symbol || !token.adapter) {
      throw new Error(`Token ${token.id} is missing symbol or adapter.`);
    }
  }

  if (!config.fees.minimumPremiumByJobType.Simple) {
    throw new Error("Chain config must define minimum premiums.");
  }

  return config;
}

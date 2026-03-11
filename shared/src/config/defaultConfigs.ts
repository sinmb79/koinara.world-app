import mainnetConfig from "../../../config/chain.mainnet.json" with { type: "json" };
import testnetConfig from "../../../config/chain.testnet.json" with { type: "json" };
import type { ChainConfig, ChainProfileConfig, ChainProfileName, NetworkId } from "../types.js";

const configMap: Record<ChainProfileName, ChainProfileConfig> = {
  testnet: testnetConfig as ChainProfileConfig,
  mainnet: mainnetConfig as ChainProfileConfig
};

export function getDefaultChainConfig(profile: ChainProfileName): ChainConfig {
  const config = getChainProfileConfig(profile);
  return getNetworkConfigFromProfile(config, config.defaultNetwork);
}

export function getChainProfileConfig(profile: ChainProfileName): ChainProfileConfig {
  return validateChainProfileConfig(structuredClone(configMap[profile]));
}

export function listChainConfigs(profile: ChainProfileName): ChainConfig[] {
  const config = getChainProfileConfig(profile);
  return Object.values(config.networks);
}

export function getChainConfig(profile: ChainProfileName, networkId: NetworkId): ChainConfig {
  return getNetworkConfigFromProfile(getChainProfileConfig(profile), networkId);
}

export function validateChainProfileConfig(config: ChainProfileConfig): ChainProfileConfig {
  if (!config.defaultNetwork) {
    throw new Error("Chain profile config must define a default network.");
  }

  const networkIds = Object.keys(config.networks);
  if (!networkIds.length) {
    throw new Error("Chain profile config must define at least one network.");
  }

  if (!config.networks[config.defaultNetwork]) {
    throw new Error(`Default network ${config.defaultNetwork} is missing from the profile config.`);
  }

  for (const [networkId, network] of Object.entries(config.networks)) {
    validateChainConfig({ ...network, id: network.id || networkId });
  }

  return config;
}

export function validateChainConfig(config: ChainConfig): ChainConfig {
  if (!config.payments.supportedTokens.length) {
    throw new Error("Chain config must define at least one supported token.");
  }

  if (!config.artifactTransport?.mode) {
    throw new Error(`Network ${config.id} is missing artifact transport metadata.`);
  }

  for (const token of config.payments.supportedTokens) {
    if (!token.symbol || !token.adapter) {
      throw new Error(`Token ${token.id} is missing symbol or adapter.`);
    }
    if (typeof token.depositEnabled !== "boolean" || typeof token.jobSubmissionEnabled !== "boolean") {
      throw new Error(`Token ${token.id} is missing deposit or submission metadata.`);
    }
    if (!token.pricingMode) {
      throw new Error(`Token ${token.id} is missing pricing metadata.`);
    }
  }

  if (!config.payments.supportedTokens.some((token) => token.id === config.payments.defaultTokenId)) {
    throw new Error(`Default token ${config.payments.defaultTokenId} is missing from network ${config.id}.`);
  }

  if (!config.fees.minimumPremiumByJobType.Simple) {
    throw new Error("Chain config must define minimum premiums.");
  }

  return config;
}

function getNetworkConfigFromProfile(config: ChainProfileConfig, networkId: NetworkId): ChainConfig {
  const network = config.networks[networkId];
  if (!network) {
    throw new Error(`Unknown network ${networkId}.`);
  }

  return validateChainConfig(structuredClone(network));
}

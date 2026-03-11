import EthereumProvider from "@walletconnect/ethereum-provider";
import type { ChainConfig } from "@koinara/shared";

export async function connectWalletConnect(config: ChainConfig): Promise<{
  provider: unknown;
  address: string;
}> {
  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
  if (!projectId) {
    throw new Error("WalletConnect project id is missing.");
  }

  const chainId = config.chainId || 1;
  const provider = await EthereumProvider.init({
    projectId,
    chains: [chainId],
    optionalChains: [chainId],
    showQrModal: true,
    rpcMap: { [chainId]: config.rpcUrl || "http://localhost:8545" }
  });

  await provider.enable();
  const accounts = (provider.accounts ?? []) as string[];
  return {
    provider,
    address: accounts[0] ?? ""
  };
}

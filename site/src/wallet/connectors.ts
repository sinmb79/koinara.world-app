import EthereumProvider from "@walletconnect/ethereum-provider";
import { BrowserProvider } from "ethers";
import type { ChainConfig } from "@koinara/shared";

export async function connectInjectedWallet(config: ChainConfig): Promise<{
  provider: unknown;
  address: string;
}> {
  const injected = (window as Window & { ethereum?: unknown }).ethereum;
  if (!injected) {
    throw new Error("No injected browser wallet was found.");
  }

  const browserProvider = new BrowserProvider(injected as never, config.chainId || undefined);
  await browserProvider.send("eth_requestAccounts", []);
  const signer = await browserProvider.getSigner();
  const address = await signer.getAddress();
  return {
    provider: injected,
    address
  };
}

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

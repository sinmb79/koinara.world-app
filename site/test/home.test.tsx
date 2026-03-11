import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "../src/pages/HomePage";

const useSitePortal = vi.fn();

vi.mock("../src/state/SitePortalContext", () => ({
  useSitePortal: () => useSitePortal()
}));

describe("home submit flow", () => {
  beforeEach(() => {
    useSitePortal.mockReset();
  });

  it("keeps the composer locked before the deposit is committed", () => {
    useSitePortal.mockReturnValue(buildPortalState());

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByRole("textbox", { name: /koinara web composer/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /open run on the network/i })).toBeDisabled();
    expect(screen.getByText(/deposit required/i)).toBeInTheDocument();
  });

  it("shows creator actions when a run can be expired or refunded", () => {
    useSitePortal.mockReturnValue(
      buildPortalState({
        depositState: { status: "committed", usdTarget: "10" },
        submitDisabledReason: undefined,
        activeSession: {
          id: "session-1",
          networkId: "worldland-testnet",
          networkLabel: "Worldland Testnet",
          selectedToken: "worldland-wlc",
          deposit: { status: "paid", usdTarget: "10", tokenId: "worldland-wlc", amount: "10", amountBaseUnits: "10000000000000000000" },
          prompt: "Open a collective review run.",
          requestHash: "0xrequest",
          schemaHash: "0xschema",
          jobId: 42,
          deadline: Math.floor(Date.now() / 1000) - 60,
          lastKnownState: "Expired",
          result: { summary: "done" },
          updatedAt: new Date().toISOString()
        },
        canMarkExpired: false,
        canClaimRefund: true
      })
    );

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /claim refund/i })).toBeInTheDocument();
    expect(screen.getByText(/creator actions/i)).toBeInTheDocument();
  });
});

function buildPortalState(overrides: Record<string, unknown> = {}) {
  return {
    activeSession: undefined,
    actionPending: undefined,
    canClaimRefund: false,
    canMarkExpired: false,
    claimRefundForActiveJob: vi.fn(),
    confirmDeposit: vi.fn(),
    connectBrowserWallet: vi.fn(),
    connectWalletConnect: vi.fn(),
    depositQuote: {
      usdTarget: "10",
      depositAmount: "10.0",
      amountBaseUnits: "10000000000000000000",
      available: true,
      token: {
        id: "worldland-wlc",
        symbol: "WLC",
        kind: "native",
        decimals: 18,
        adapter: "native",
        enabled: true,
        depositEnabled: true,
        jobSubmissionEnabled: true,
        pricingMode: "oracle",
        pricingSourceLabel: "Reference",
        referenceUsdPrice: "1.00"
      }
    },
    depositState: {
      status: "quote-ready",
      usdTarget: "10",
      tokenId: "worldland-wlc",
      amount: "10.0",
      amountBaseUnits: "10000000000000000000"
    },
    discoveryWriteConfigured: true,
    lastError: undefined,
    markExpiredActiveJob: vi.fn(),
    networks: [
      {
        id: "worldland-testnet",
        label: "Worldland Testnet",
        enabled: true,
        depositEnabled: true,
        jobSubmissionEnabled: true,
        chainId: 12345,
        rpcUrl: "https://rpc.example",
        backupRpcUrls: [],
        explorerBaseUrl: "https://explorer.example",
        confirmationsRequired: 1,
        recommendedGasBufferNative: "0.05",
        nativeToken: { type: "native", symbol: "WLC" },
        contracts: { registry: "0x1", verifier: "0x2", rewardDistributor: "0x3", token: "0x4" },
        discoveryDefaults: { writableRoot: "./shared-root", resultRoot: "./shared-root" },
        artifactTransport: { mode: "ipfs-first", publicBaseUrl: "https://koinara.world/discovery/worldland-testnet", gatewayUrls: [] },
        payments: {
          defaultTokenId: "worldland-wlc",
          supportedTokens: [
            {
              id: "worldland-wlc",
              symbol: "WLC",
              kind: "native",
              decimals: 18,
              adapter: "native",
              enabled: true,
              depositEnabled: true,
              jobSubmissionEnabled: true,
              pricingMode: "oracle",
              pricingSourceLabel: "Reference",
              referenceUsdPrice: "1.00"
            }
          ]
        },
        fees: { minimumPremiumByJobType: { Simple: "0.01", General: "0.03", Collective: "0.07" } },
        releaseLinks: { app: "", node: "", protocol: "" }
      }
    ],
    prompt: "",
    selectedNetwork: {
      id: "worldland-testnet",
      label: "Worldland Testnet",
      payments: {
        supportedTokens: [
          {
            id: "worldland-wlc",
            symbol: "WLC",
            kind: "native",
            decimals: 18,
            adapter: "native",
            enabled: true,
            depositEnabled: true,
            jobSubmissionEnabled: true,
            pricingMode: "oracle"
          }
        ]
      }
    },
    selectedNetworkId: "worldland-testnet",
    selectedTokenId: "worldland-wlc",
    setPrompt: vi.fn(),
    setSelectedNetworkId: vi.fn(),
    setSelectedTokenId: vi.fn(),
    submitDisabledReason: "Commit the 10 USD-equivalent deposit first.",
    submitJob: vi.fn(),
    wallet: {
      mode: "none",
      address: undefined,
      statusMessage: "No wallet connected yet."
    },
    ...overrides
  };
}

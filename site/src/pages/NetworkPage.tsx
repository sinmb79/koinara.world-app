import { ActivityFeed } from "../components/ActivityFeed";
import { NetworkStats } from "../components/NetworkStats";
import { NodeMap } from "../components/NodeMap";
import { useNetworkDashboard } from "../hooks/useNetworkDashboard";

export function NetworkPage() {
  const { data, networks, selectedNetwork, selectedNetworkId, setSelectedNetworkId } = useNetworkDashboard();

  return (
    <div className="site-stack">
      <section className="site-panel">
        <div className="panel-headline">
          <h2>Network profiles</h2>
          <span>Worldland live first, Ethereum/Base/BNB staged behind it</span>
        </div>
        <div className="site-network-grid">
          {networks.map((network) => (
            <button
              key={network.id}
              type="button"
              className={`site-network-card-button ${selectedNetworkId === network.id ? "selected" : ""}`}
              onClick={() => setSelectedNetworkId(network.id)}
            >
              <strong>{network.label}</strong>
              <div>{network.enabled ? "Dashboard ready" : "Staged profile"}</div>
              <small>{network.enabled ? `Default deposit token: ${network.payments.defaultTokenId}` : network.reasonDisabled}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="site-panel">
        <div className="panel-headline">
          <h3>Accepted token matrix</h3>
          <span>{selectedNetwork.label}</span>
        </div>
        <div className="token-matrix compact">
          {selectedNetwork.payments.supportedTokens.map((token) => (
            <article key={token.id} className={`token-card static ${token.jobSubmissionEnabled ? "selected" : ""}`}>
              <strong>{token.symbol}</strong>
              <span>{token.kind}</span>
              <small>{token.reasonDisabled ?? token.pricingSourceLabel ?? "ready"}</small>
            </article>
          ))}
        </div>
      </section>

      <NetworkStats data={data} />
      <NodeMap wallets={data.walletGraph} />
      <ActivityFeed activity={data.activity} />
    </div>
  );
}

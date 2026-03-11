import { ActivityFeed } from "../components/ActivityFeed";
import { NetworkStats } from "../components/NetworkStats";
import { NodeMap } from "../components/NodeMap";
import { useNetworkDashboard } from "../hooks/useNetworkDashboard";

export function NetworkPage() {
  const { data, networks, selectedNetworkId, setSelectedNetworkId } = useNetworkDashboard();

  return (
    <div className="site-stack">
      <section className="site-panel">
        <div className="panel-headline">
          <h2>Network profiles</h2>
          <span>Worldland live, Ethereum and Base staged for rollout</span>
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
              <div>{network.enabled ? "Live dashboard" : "Coming soon"}</div>
              <small>{network.enabled ? `Default payment: ${network.payments.defaultTokenId}` : network.reasonDisabled}</small>
            </button>
          ))}
        </div>
      </section>
      <NetworkStats data={data} />
      <NodeMap wallets={data.walletGraph} />
      <ActivityFeed activity={data.activity} />
    </div>
  );
}

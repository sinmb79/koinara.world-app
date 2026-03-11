import { Link } from "react-router-dom";
import { NetworkStats } from "../components/NetworkStats";
import { useNetworkDashboard } from "../hooks/useNetworkDashboard";

export function HomePage() {
  const { data, networks } = useNetworkDashboard();

  return (
    <div className="site-stack">
      <section className="site-hero">
        <div>
          <p className="site-eyebrow">Koinara Network</p>
          <h1>Submit inference jobs, verify results, and inspect proof without any hosted backend.</h1>
          <div className="site-cta-row">
            <Link to="/download" className="site-link-button">
              Download App
            </Link>
            <Link to="/docs" className="site-link-button secondary">
              Read Docs
            </Link>
          </div>
        </div>
      </section>
      <NetworkStats data={data} />
      <section className="site-panel">
        <div className="panel-headline">
          <h2>Network rollout</h2>
          <span>{networks.length} profiles in config</span>
        </div>
        <div className="site-network-grid">
          {networks.map((network) => (
            <article key={network.id} className="site-network-card">
              <strong>{network.label}</strong>
              <div>{network.enabled ? "Live profile" : "Planned profile"}</div>
              <small>{network.enabled ? `Primary token: ${network.payments.defaultTokenId}` : network.reasonDisabled}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

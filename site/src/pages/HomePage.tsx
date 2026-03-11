import { Link } from "react-router-dom";
import { NetworkStats } from "../components/NetworkStats";
import { ProcessShowcase } from "../components/ProcessShowcase";
import { useNetworkDashboard } from "../hooks/useNetworkDashboard";
import koiHero from "../assets/koi-hero.webp";

export function HomePage() {
  const { data, networks } = useNetworkDashboard();

  return (
    <div className="site-stack">
      <section className="site-hero">
        <div className="hero-copy">
          <p className="site-eyebrow">Koinara Network</p>
          <h1>Turn inference into a swarm: submit jobs, split work across nodes, and inspect proof without a hosted backend.</h1>
          <p className="hero-body">
            Koinara should feel less like a single AI endpoint and more like a peer-to-peer inference layer where creators,
            providers, and verifiers all participate in the same open process.
          </p>
          <div className="site-cta-row">
            <Link to="/download" className="site-link-button">
              Download App
            </Link>
            <Link to="/docs" className="site-link-button secondary">
              Read Docs
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <img src={koiHero} alt="KOI mascot representing decentralized inference" />
          <div className="hero-visual-caption">
            <strong>KOI</strong>
            <span>AI spirit for decentralized inference</span>
          </div>
        </div>
      </section>
      <ProcessShowcase />
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

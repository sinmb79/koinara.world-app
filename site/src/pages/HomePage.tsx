import { Link } from "react-router-dom";
import { NetworkStats } from "../components/NetworkStats";
import { useNetworkDashboard } from "../hooks/useNetworkDashboard";

export function HomePage() {
  const data = useNetworkDashboard();

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
    </div>
  );
}

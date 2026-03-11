import type { NetworkDashboardData } from "../network";

export function NetworkStats({ data }: { data: NetworkDashboardData }) {
  if (data.status === "empty") {
    return (
      <section className="site-panel">
        <div className="panel-headline">
          <h2>{data.networkLabel}</h2>
          <span>Dashboard unavailable</span>
        </div>
        <p>{data.reason}</p>
      </section>
    );
  }

  return (
    <section className="stats-grid">
      <article className="site-panel">
        <p className="site-eyebrow">{data.networkLabel}</p>
        <h3>Jobs today</h3>
        <strong>{data.jobsToday}</strong>
      </article>
      <article className="site-panel">
        <h3>Unique participants (24h)</h3>
        <strong title="distinct wallet addresses observed from recent provider/verifier events">
          {data.uniqueParticipants24h}
        </strong>
      </article>
      <article className="site-panel">
        <h3>KOIN minted</h3>
        <strong>{data.koinMinted}</strong>
      </article>
    </section>
  );
}

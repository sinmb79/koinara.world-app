import type { ActivityItem } from "../network";

export function ActivityFeed({ activity }: { activity: ActivityItem[] }) {
  if (!activity.length) {
    return <section className="site-panel">Recent job activity will appear once the chain profile is configured.</section>;
  }

  return (
    <section className="site-panel">
      <h3>Recent Activity</h3>
      <ul className="activity-list">
        {activity.map((item) => (
          <li key={item.id}>
            <strong>{item.label}</strong>
            <span>block {item.blockNumber}</span>
            {item.wallet ? <small>{item.wallet}</small> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

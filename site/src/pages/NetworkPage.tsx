import { ActivityFeed } from "../components/ActivityFeed";
import { NetworkStats } from "../components/NetworkStats";
import { NodeMap } from "../components/NodeMap";
import { useNetworkDashboard } from "../hooks/useNetworkDashboard";

export function NetworkPage() {
  const data = useNetworkDashboard();

  return (
    <div className="site-stack">
      <NetworkStats data={data} />
      <NodeMap wallets={data.walletGraph} />
      <ActivityFeed activity={data.activity} />
    </div>
  );
}

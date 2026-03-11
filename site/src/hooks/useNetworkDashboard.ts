import { useEffect, useState } from "react";
import { getSiteChainConfig, loadNetworkDashboard, type NetworkDashboardData } from "../network";

export function useNetworkDashboard() {
  const [data, setData] = useState<NetworkDashboardData>({
    status: "empty",
    jobsToday: 0,
    uniqueParticipants24h: 0,
    koinMinted: "0",
    walletGraph: [],
    activity: []
  });

  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;
    const config = getSiteChainConfig();

    const load = async () => {
      const next = await loadNetworkDashboard(config);
      if (!cancelled) {
        setData(next);
      }
      timer = window.setTimeout(load, 30000);
    };

    void load();

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  return data;
}

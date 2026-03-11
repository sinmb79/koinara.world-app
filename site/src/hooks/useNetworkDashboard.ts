import { useEffect, useMemo, useState } from "react";
import { getSiteChainProfileConfig, loadNetworkDashboard, type NetworkDashboardData } from "../network";

export function useNetworkDashboard() {
  const profileConfig = useMemo(() => getSiteChainProfileConfig(), []);
  const networks = useMemo(() => Object.values(profileConfig.networks), [profileConfig]);
  const [selectedNetworkId, setSelectedNetworkId] = useState(profileConfig.defaultNetwork);
  const selectedNetwork = useMemo(
    () => profileConfig.networks[selectedNetworkId] ?? profileConfig.networks[profileConfig.defaultNetwork],
    [profileConfig, selectedNetworkId]
  );
  const [data, setData] = useState<NetworkDashboardData>({
    networkId: selectedNetwork.id,
    networkLabel: selectedNetwork.label,
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

    const load = async () => {
      const next = await loadNetworkDashboard(selectedNetwork);
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
  }, [selectedNetwork]);

  return {
    data,
    networks,
    selectedNetworkId,
    setSelectedNetworkId
  };
}

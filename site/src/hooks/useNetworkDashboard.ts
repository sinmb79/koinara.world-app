import { useSitePortal } from "../state/SitePortalContext";

export function useNetworkDashboard() {
  const { dashboardData, networks, selectedNetworkId, setSelectedNetworkId, selectedNetwork } = useSitePortal();

  return {
    data: dashboardData,
    networks,
    selectedNetworkId,
    setSelectedNetworkId,
    selectedNetwork
  };
}

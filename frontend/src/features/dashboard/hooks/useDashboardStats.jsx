import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard.service";

export function useDashboardStats(year) {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["dashboard", "statistics", year],
    queryFn: () => dashboardService.getStatistics(year),
    enabled: !!year,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    totalFlights: data?.total_flights || 0,
    totalHours: data?.total_hours || 0,
    hoursByType: data?.hours_by_type || [],
    hoursByAction: data?.hours_by_action || [],
    totalPassengers: data?.total_passengers || 0,
    totalDoe: data?.total_doe || 0,
    totalCargo: data?.total_cargo || 0,
    topPilotsByType: data?.top_pilots_by_type || {},
    loading,
    error,
  };
}

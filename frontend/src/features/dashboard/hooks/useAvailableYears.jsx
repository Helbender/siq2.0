import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard.service";

export function useAvailableYears() {
  const { data: availableYears = [], isLoading: loading, error } = useQuery({
    queryKey: ["dashboard", "available-years"],
    queryFn: dashboardService.getAvailableYears,
    staleTime: 1000 * 60 * 60, // 1 hour (years don't change often)
  });

  return { availableYears, loading, error };
}

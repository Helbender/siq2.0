import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard.service";

export function useExpiringQualifications() {
  const { data = [], isLoading: loading, error } = useQuery({
    queryKey: ["dashboard", "expiring-qualifications"],
    queryFn: dashboardService.getExpiringQualifications,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return { expiringQualifications: data, loading, error };
}
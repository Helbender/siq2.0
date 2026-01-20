import { useQuery } from "@tanstack/react-query";
import { dbManagementService } from "../services/db-management.service";

export function useFlightsByYear(options = {}) {
  return useQuery({
    queryKey: ["db-management", "flights-by-year"],
    queryFn: dbManagementService.getFlightsByYear,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options.enabled !== false, // Default to true, but can be disabled
    retry: (failureCount, error) => {
      // Don't retry on 403 (Forbidden) errors - user doesn't have permission
      if (error?.response?.status === 403) {
        return false;
      }
      // Retry other errors up to 1 time
      return failureCount < 1;
    },
    ...options,
  });
}

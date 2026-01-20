import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dbManagementService } from "../services/db-management.service";

export function useRebackupFlightsByYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (year) => dbManagementService.rebackupFlightsByYear(year),
    onSuccess: () => {
      // Optionally invalidate queries if needed
      queryClient.invalidateQueries({ queryKey: ["db-management"] });
    },
  });
}
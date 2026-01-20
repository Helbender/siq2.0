import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dbManagementService } from "../services/db-management.service";

export function useRebackupFlights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dbManagementService.rebackupFlights,
    onSuccess: () => {
      // Optionally invalidate queries if needed
      queryClient.invalidateQueries({ queryKey: ["db-management"] });
    },
  });
}

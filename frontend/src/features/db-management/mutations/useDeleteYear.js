import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dbManagementService } from "../services/db-management.service";

export function useDeleteYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dbManagementService.deleteYear,
    onSuccess: () => {
      // Invalidate flights-by-year query
      queryClient.invalidateQueries({ queryKey: ["db-management", "flights-by-year"] });
      // Also invalidate flights query since we deleted flights
      queryClient.invalidateQueries({ queryKey: ["flights"] });
    },
  });
}

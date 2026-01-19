import { useMutation, useQueryClient } from "@tanstack/react-query";
import { flightsService } from "../services/flights.service";

export function useDeleteFlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: flightsService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flights"] });
    },
  });
}

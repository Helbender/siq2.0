import { useMutation, useQueryClient } from "@tanstack/react-query";
import { flightsService } from "../services/flights.service";

export function useCreateFlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) =>
      id
        ? flightsService.update(id, payload)
        : flightsService.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flights"] });
    },
  });
}

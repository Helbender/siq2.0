import { useQuery } from "@tanstack/react-query";
import { flightsService } from "../services/flights.service";

export function useFlights() {
  return useQuery({
    queryKey: ["flights"],
    queryFn: flightsService.getAll,
    staleTime: 1000 * 60, // 1 min
  });
}

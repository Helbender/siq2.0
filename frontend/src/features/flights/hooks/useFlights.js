import { useQuery } from "@tanstack/react-query";
import { flightsService } from "../services/flights.service";

export function useFlights({ q, dateFrom, dateTo } = {}) {
  return useQuery({
    queryKey: ["flights", q ?? "", dateFrom ?? "", dateTo ?? ""],
    queryFn: () => flightsService.getAll({ q, dateFrom, dateTo }),
    staleTime: 1000 * 60,
  });
}

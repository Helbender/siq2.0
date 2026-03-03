import { useQuery } from "@tanstack/react-query";
import { flightsService } from "../services/flights.service";

/**
 * Hook for searching flights by crew member (name or NIP) with optional date range.
 * Query is disabled by default; call refetch() on button click to run the search.
 *
 * @param {{ search: string, dateFrom?: string, dateTo?: string }} params - Search term and optional date range (YYYY-MM-DD)
 * @returns Query result with data, refetch, isFetching, error, etc.
 */
export function useFlightsByCrewSearch({ search = "", dateFrom, dateTo } = {}) {
  return useQuery({
    queryKey: ["flightsByCrewSearch", search, dateFrom, dateTo],
    queryFn: () => flightsService.searchByCrew(search, { dateFrom, dateTo }),
    enabled: false,
    staleTime: 1000 * 60,
  });
}

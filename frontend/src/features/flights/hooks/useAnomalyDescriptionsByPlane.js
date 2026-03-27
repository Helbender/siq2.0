import { useQuery } from "@tanstack/react-query";
import { flightsService } from "../services/flights.service";

/**
 * Fetch distinct anomaly descriptions for an aircraft (tail number).
 * Enabled only when tailNumber is a positive number.
 * @param {number} tailNumber - Aircraft tail number (e.g. from Nº Cauda field)
 * @returns {import("@tanstack/react-query").UseQueryResult<string[]>}
 */
export function useAnomalyDescriptionsByPlane(tailNumber) {
  const numericTail = Number(tailNumber);
  const enabled = numericTail > 0;

  return useQuery({
    queryKey: ["flights", "anomaly-descriptions", numericTail],
    queryFn: () => flightsService.getAnomalyDescriptions(numericTail),
    enabled,
    staleTime: 1000 * 60,
  });
}

import { useMemo } from "react";
import { useFlights } from "@/features/flights";
import { flightsToPlanesAnomalies } from "../mappers/flightsToPlanesAnomalies";

/**
 * Fetches flights and derives plane-anomaly summary for the Anomalias page.
 * Uses the same shape as the previous mock (planes with anomalias and planeAnomalyFlights).
 */
export function usePlanesWithAnomalies() {
  const { data: flights = [], isLoading, error, isError } = useFlights();
  const planes = useMemo(() => flightsToPlanesAnomalies(flights), [flights]);
  return {
    data: planes,
    isLoading,
    error,
    isError,
  };
}

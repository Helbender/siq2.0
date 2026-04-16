import { useQuery } from "@tanstack/react-query";
import { flightsService } from "../services/flights.service";

export function useQualificationsByType(tipo) {
  const { data: all = [] } = useQuery({
    queryKey: ["qualifications"],
    queryFn: flightsService.getAllQualifications,
    staleTime: 1000 * 60 * 10,
  });

  if (!tipo) return [];
  const tipoNorm = String(tipo).trim().toUpperCase();
  return all.filter(
    (qual) =>
      String(qual.tipo_aplicavel ?? "")
        .trim()
        .toUpperCase() === tipoNorm,
  );
}

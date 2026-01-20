import { useQuery } from "@tanstack/react-query";
import { pilotsService } from "../services/pilots.service";

export function usePilots(tipo) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["pilots", "by-tipo", tipo],
    queryFn: () => pilotsService.getByTipo(tipo),
    enabled: !!tipo,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Ensure pilotos is always an array
  const pilotos = Array.isArray(data) ? data : [];

  return { pilotos, loading: isLoading, error: isError };
}

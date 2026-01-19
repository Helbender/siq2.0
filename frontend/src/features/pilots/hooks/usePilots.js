import { useQuery } from "@tanstack/react-query";
import { pilotsService } from "../services/pilots.service";
import { useToast } from "@/utils/useToast";

export function usePilots(tipo) {
  const toast = useToast();

  const { data: pilotos = [], isLoading: loading, error } = useQuery({
    queryKey: ["pilots", "by-tipo", tipo],
    queryFn: () => pilotsService.getByTipo(tipo),
    enabled: !!tipo,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onError: () => {
      toast({
        title: "Erro ao carregar tripulantes",
        status: "error",
      });
    },
  });

  return { pilotos, loading, error };
}

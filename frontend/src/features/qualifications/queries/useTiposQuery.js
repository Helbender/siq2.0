import { useQuery } from "@tanstack/react-query";
import { qualificationsService } from "../services/qualifications.service";

export function useTiposQuery() {
  return useQuery({
    queryKey: ["qualifications", "tipos"],
    queryFn: qualificationsService.getTipos,
    staleTime: Infinity,
  });
}

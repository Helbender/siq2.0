import { useQuery } from "@tanstack/react-query";
import { flightsService } from "../services/flights.service";

export function usePilotQualifications(nip) {
  return useQuery({
    queryKey: ["pilot-qualifications", nip],
    queryFn: () => flightsService.getPilotQualifications(nip),
    enabled: !!nip,
  });
}

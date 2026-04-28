import { useQuery } from "@tanstack/react-query";
import { qualificationsService } from "../services/qualifications.service";

export function useQualificationGroupsQuery(crewType) {
  return useQuery({
    queryKey: ["qualifications", "groups", crewType],
    queryFn: () => qualificationsService.getQualificationGroups(crewType),
    enabled: Boolean(crewType),
    staleTime: Infinity,
  });
}

import { http } from "@/api/http";
import { useQuery } from "@tanstack/react-query";

export const qualificationsQueryKeys = {
  all: ["qualifications"],
  lists: () => [...qualificationsQueryKeys.all, "list"],
  list: (filters) => [...qualificationsQueryKeys.lists(), { filters }],
  details: () => [...qualificationsQueryKeys.all, "detail"],
  detail: (id) => [...qualificationsQueryKeys.details(), id],
};

export function useQualificationsQuery() {
  return useQuery({
    queryKey: qualificationsQueryKeys.lists(),
    queryFn: async () => {
      const response = await http.get("/v2/qualificacoes");
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

import { http } from "@/api/http";
import { useQuery } from "@tanstack/react-query";

export const usersQueryKeys = {
  all: ["users"],
  lists: () => [...usersQueryKeys.all, "list"],
  list: (filters) => [...usersQueryKeys.lists(), { filters }],
  details: () => [...usersQueryKeys.all, "detail"],
  detail: (id) => [...usersQueryKeys.details(), id],
};

export function useUsersQuery() {
  return useQuery({
    queryKey: usersQueryKeys.lists(),
    queryFn: async () => {
      const response = await http.get("/users");
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

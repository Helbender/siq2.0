import { http } from "@/api/http";
import { useQuery } from "@tanstack/react-query";

export const authQueryKeys = {
  all: ["auth"],
  me: () => [...authQueryKeys.all, "me"],
};

export function useAuthQuery() {
  return useQuery({
    queryKey: authQueryKeys.me(),
    queryFn: async () => {
      const response = await http.get("/auth/me");
      return response.data;
    },
    enabled: !!localStorage.getItem("token"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401/404/422 errors (auth failures)
      if (
        error?.response?.status === 401 ||
        error?.response?.status === 404 ||
        error?.response?.status === 422
      ) {
        return false;
      }
      return failureCount < 1;
    },
  });
}

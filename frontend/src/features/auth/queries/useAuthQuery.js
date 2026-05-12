import { http, getToken } from "@/app/config/http";
import { useQuery } from "@tanstack/react-query";

export const authQueryKeys = {
  all: ["auth"],
  me: () => [...authQueryKeys.all, "me"],
};

export function useAuthQuery(bootstrapped = false) {
  return useQuery({
    queryKey: authQueryKeys.me(),
    queryFn: async () => {
      const response = await http.get("/auth/me");
      return response.data;
    },
    // Only run after bootstrap completes AND a token exists.
    // bootstrapped is React state so the query re-enables reactively after the
    // initial /auth/refresh call sets the in-memory token.
    enabled: bootstrapped && !!getToken(),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
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

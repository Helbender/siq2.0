import { http } from "@/api/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authQueryKeys } from "../queries/useAuthQuery";
import { setLoggingOut } from "@/api/http";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nip, password }) => {
      // Ensure logout flag is reset before login attempt
      setLoggingOut(false);

      const response = await http.post("/auth/login", { nip, password });
      const { access_token } = response.data;

      if (!access_token) {
        throw new Error("Invalid response from server");
      }

      localStorage.setItem("token", access_token);

      // Fetch user data after login
      try {
        const userResponse = await http.get("/auth/me");
        return { access_token, user: userResponse.data };
      } catch (error) {
        // If fetchMe fails, it's likely a 404 - user doesn't exist
        if (error.response?.status === 404) {
          localStorage.removeItem("token");
          throw new Error(
            error.response?.data?.error ||
              error.message ||
              "User not found",
          );
        }
        // For other errors, still return the token but log the error
        console.warn("[useLogin] Non-critical error fetching user:", error);
        return { access_token, user: null };
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch auth query to get user data
      queryClient.setQueryData(authQueryKeys.me(), data.user);
    },
    onError: (error) => {
      // Clear token on error
      if (localStorage.getItem("token")) {
        localStorage.removeItem("token");
      }
    },
  });
}

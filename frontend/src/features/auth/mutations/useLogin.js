import { http, setLoggingOut, setToken, getToken } from "@/app/config/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authQueryKeys } from "../queries/useAuthQuery";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nip, password }) => {
      setLoggingOut(false);

      const response = await http.post("/auth/login", { nip, password });
      const { access_token } = response.data;

      if (!access_token) {
        throw new Error("Invalid response from server");
      }

      setToken(access_token);

      // Fetch user profile — any failure aborts the login
      try {
        const userResponse = await http.get("/auth/me");
        return { access_token, user: userResponse.data };
      } catch (error) {
        setToken(null);
        throw new Error(
          error.response?.data?.error || error.message || "Login failed",
        );
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(authQueryKeys.me(), data.user);
    },
    onError: () => {
      if (getToken()) setToken(null);
    },
  });
}

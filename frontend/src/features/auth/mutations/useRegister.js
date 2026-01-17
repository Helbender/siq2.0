import { http } from "@/api/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authQueryKeys } from "../queries/useAuthQuery";

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, email, password }) => {
      const response = await http.post("/auth/register", {
        username,
        email,
        password,
      });
      const { access_token, user } = response.data;

      if (access_token) {
        localStorage.setItem("token", access_token);
      }

      return { access_token, user };
    },
    onSuccess: (data) => {
      // Set user data in query cache
      if (data.user) {
        queryClient.setQueryData(authQueryKeys.me(), data.user);
      }
    },
    onError: (error) => {
      // Clear token on error
      if (localStorage.getItem("token")) {
        localStorage.removeItem("token");
      }
    },
  });
}

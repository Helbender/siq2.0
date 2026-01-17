import { http } from "@/api/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authQueryKeys } from "../queries/useAuthQuery";

export function useUpdateAuthUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await http.put("/auth/update", data);
      return response.data;
    },
    onSuccess: (data) => {
      // Update auth query cache with new user data
      if (data.user) {
        queryClient.setQueryData(authQueryKeys.me(), data.user);
      }
    },
  });
}

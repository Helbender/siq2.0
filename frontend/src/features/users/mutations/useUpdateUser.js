import { http } from "@/api/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersQueryKeys } from "../queries/useUsersQuery";

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, userData }) => {
      const response = await http.patch(`/users/${userId}`, userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
    },
  });
}

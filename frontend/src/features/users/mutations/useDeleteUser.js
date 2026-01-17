import { http } from "@/api/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersQueryKeys } from "../queries/useUsersQuery";

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId) => {
      const response = await http.delete(`/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
    },
  });
}

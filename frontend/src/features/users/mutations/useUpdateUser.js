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
      // Invalidate and refetch users query
      queryClient.invalidateQueries({ 
        queryKey: usersQueryKeys.all,
        refetchType: 'active' // Force refetch even if data is considered fresh
      });
    },
  });
}

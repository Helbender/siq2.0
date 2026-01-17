import { http } from "@/api/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersQueryKeys } from "../queries/useUsersQuery";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      const response = await http.post("/users", userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
    },
  });
}

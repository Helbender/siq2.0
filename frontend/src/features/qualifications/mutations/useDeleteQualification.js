import { http } from "@/api/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { qualificationsQueryKeys } from "../queries/useQualificationsQuery";

export function useDeleteQualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (qualificationId) => {
      const response = await http.delete(`/v2/qualificacoes/${qualificationId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qualificationsQueryKeys.all });
    },
  });
}

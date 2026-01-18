import { http } from "@/api/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { qualificationsQueryKeys } from "../queries/useQualificationsQuery";

export function useCreateQualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (qualificationData) => {
      const response = await http.post("/v2/qualificacoes", qualificationData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qualificationsQueryKeys.all });
    },
  });
}

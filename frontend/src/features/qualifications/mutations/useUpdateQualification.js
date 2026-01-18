import { http } from "@/api/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { qualificationsQueryKeys } from "../queries/useQualificationsQuery";

export function useUpdateQualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ qualificationId, qualificationData }) => {
      const response = await http.patch(
        `/v2/qualificacoes/${qualificationId}`,
        qualificationData,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qualificationsQueryKeys.all });
    },
  });
}

import { http } from "@/api/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useReprocessFlights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await http.post("/flights/reprocess-all-qualifications");
      return response.data;
    },
    // Optionally invalidate related queries if needed
    onSuccess: () => {
      // You might want to invalidate flights queries here if they exist
      // queryClient.invalidateQueries({ queryKey: ["flights"] });
    },
  });
}

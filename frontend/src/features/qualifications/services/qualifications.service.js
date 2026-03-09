import { http } from "@/app/config/http";

export const qualificationsService = {
  getCrewTypes: async () => {
    const response = await http.get("/v2/crew-types");
    return response.data || [];
  },
};
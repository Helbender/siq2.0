import { http } from "@/api/http";

export const flightsService = {
  getAll: async () => {
    const { data } = await http.get("/flights");
    return data ?? [];
  },

  create: async (payload) => {
    const { data } = await http.post("/flights", payload);
    return data;
  },

  update: async (id, payload) => {
    const { data } = await http.put(`/flights/${id}`, payload);
    return data;
  },

  remove: async (id) => {
    const { data } = await http.delete(`/flights/${id}`);
    return data;
  },

  getPilotQualifications: async (nip) => {
    const { data } = await http.get(`/v2/qualificacoeslist/${nip}`);
    return data ?? [];
  },
};

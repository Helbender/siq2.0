import { http } from "@/app/config/http";

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

  /**
   * Search flights by crew member name or NIP, with optional date range.
   * @param {string} search - Crew search term (name or NIP)
   * @param {{ dateFrom?: string, dateTo?: string }} [options] - Optional date range (YYYY-MM-DD)
   * @returns {Promise<Array>} List of flight objects (same shape as getAll)
   */
  searchByCrew: async (search, { dateFrom, dateTo } = {}) => {
    const params = new URLSearchParams({ search: search.trim() });
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const { data } = await http.get(`/flights/by-crew?${params.toString()}`);
    return data ?? [];
  },
};

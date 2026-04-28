import { http } from "@/app/config/http";

export const qualificationsService = {
  getCrewTypes: async () => {
    const response = await http.get("/v2/crew-types");
    return response.data || [];
  },

  getTipos: async () => {
    try {
      const res = await http.get("/v2/listas");
      const tipos = res.data?.tipos;
      if (Array.isArray(tipos) && tipos.length > 0) return tipos;
    } catch {
      // fall through to crew-types fallback
    }
    const res = await http.get("/v2/crew-types");
    return Array.isArray(res.data)
      ? res.data
          .map((item) =>
            typeof item === "string" ? item : item.value || item.name || "",
          )
          .filter(Boolean)
      : [];
  },

  getQualificationGroups: async (crewType) => {
    const res = await http.get(`/v2/qualification-groups/${crewType}`);
    if (Array.isArray(res.data)) return res.data;
    if (res.data?.groups && Array.isArray(res.data.groups))
      return res.data.groups;
    return [];
  },
};

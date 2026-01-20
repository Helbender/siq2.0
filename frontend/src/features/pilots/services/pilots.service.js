import { http } from "@/api/http";

// Utility function to convert crew type to API format
const crewTypeToApiFormat = (crewType) => {
  return crewType.replace(/\s+/g, "_").replace("OPERAÇÕES", "OPERACOES");
};

export const pilotsService = {
  getByTipo: async (tipo) => {
    const apiTipo = crewTypeToApiFormat(tipo);

    const { data } = await http.get(
      `/v2/tripulantes/qualificacoes/${apiTipo}`
    );

    return data ?? [];
  },
};

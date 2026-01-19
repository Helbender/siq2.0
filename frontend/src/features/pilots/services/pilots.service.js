import { http } from "@/api/http";

export const pilotsService = {
  getByTipo: async (tipo) => {
    const apiTipo = tipo
      .replace(" ", "_")
      .replace("OPERAÇÕES", "OPERACOES");

    const { data } = await http.get(
      `/v2/tripulantes/qualificacoes/${apiTipo}`
    );

    return data ?? [];
  },
};

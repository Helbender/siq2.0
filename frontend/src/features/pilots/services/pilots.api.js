import { http } from "@/api/http";

export async function fetchPilotsByTipo(tipo) {
  const apiTipo = tipo
    .replace(" ", "_")
    .replace("OPERAÇÕES", "OPERACOES");

  const { data } = await http.get(
    `/v2/tripulantes/qualificacoes/${apiTipo}`
  );

  return data ?? [];
}

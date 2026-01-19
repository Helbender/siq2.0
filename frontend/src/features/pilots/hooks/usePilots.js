import { useEffect, useState } from "react";
import { fetchPilotsByTipo } from "../services/pilots.api";

export function usePilots(tipo, toast) {
  const [pilotos, setPilotos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tipo) return;

    let cancelled = false;
    setLoading(true);

    fetchPilotsByTipo(tipo)
      .then(data => {
        if (!cancelled) setPilotos(data);
      })
      .catch(() => {
        toast({
          title: "Erro ao carregar tripulantes",
          status: "error",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tipo]);

  return { pilotos, loading };
}

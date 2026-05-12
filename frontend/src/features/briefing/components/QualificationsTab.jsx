import { useCrewTypes } from "@/app/providers/CrewTypesProvider";
import {
  QualificationTablePage,
  usePilots,
} from "@features/crew-qualifications";

export function QualificationsTab() {
  const { TipoTripulante } = useCrewTypes();
  const tipo = TipoTripulante?.PILOTO || "PILOTO";
  const { pilotos, loading } = usePilots(tipo);

  return <QualificationTablePage pilotos={pilotos} loading={loading} />;
}

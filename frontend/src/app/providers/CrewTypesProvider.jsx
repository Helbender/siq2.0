import { getCachedCrewTypes, useCrewTypesQuery } from "@features/qualifications";
import { createContext, useContext, useMemo } from "react";

const CrewTypesContext = createContext(null);

export const useCrewTypes = () => {
  const ctx = useContext(CrewTypesContext);
  if (!ctx) {
    throw new Error("useCrewTypes must be used within CrewTypesProvider");
  }
  return ctx;
};

export function CrewTypesProvider({ children }) {
  const { data: crewTypesData = [], isLoading } = useCrewTypesQuery();

  const TipoTripulante = useMemo(() => {
    const crewTypes = (crewTypesData && Array.isArray(crewTypesData) && crewTypesData.length > 0)
      ? crewTypesData
      : (getCachedCrewTypes() || []);

    const enumObj = {};
    if (Array.isArray(crewTypes) && crewTypes.length > 0) {
      crewTypes.forEach(({ value }) => {
        if (value) {
          const key = value.replace(/\s+/g, "_").replace("OPERAÇÕES", "OPERACOES");
          enumObj[key] = value;
        }
      });
    }

    if (Object.keys(enumObj).length === 0) {
      return {
        PILOTO: "PILOTO",
        OPERADOR_CABINE: "OPERADOR CABINE",
        COORDENADOR_TATICO: "COORDENADOR TATICO",
        OPERADOR_VIGILANCIA: "OPERADOR VIGILANCIA",
        OPERACOES: "OPERAÇÕES",
      };
    }

    return enumObj;
  }, [crewTypesData]);

  const getAllCrewTypes = useMemo(() => () => Object.values(TipoTripulante), [TipoTripulante]);

  const getCrewTypeOptions = useMemo(() => {
    return () => {
      const crewTypes = (crewTypesData && Array.isArray(crewTypesData) && crewTypesData.length > 0)
        ? crewTypesData
        : (getCachedCrewTypes() || []);

      if (Array.isArray(crewTypes) && crewTypes.length > 0) {
        return crewTypes.map(({ value }) => {
          const label = value
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");
          return { value, label };
        });
      }

      return [
        { value: "PILOTO", label: "Piloto" },
        { value: "OPERADOR CABINE", label: "Operador Cabine" },
        { value: "COORDENADOR TATICO", label: "Coordenador Tático" },
        { value: "OPERADOR VIGILANCIA", label: "Operador Vigilância" },
        { value: "OPERAÇÕES", label: "Operações" },
      ];
    };
  }, [crewTypesData]);

  const positionToCrewType = useMemo(() => {
    return (position) => {
      const mapping = {
        PI: TipoTripulante.PILOTO,
        PC: TipoTripulante.PILOTO,
        P: TipoTripulante.PILOTO,
        CP: TipoTripulante.PILOTO,
        OCI: TipoTripulante.OPERADOR_CABINE,
        OC: TipoTripulante.OPERADOR_CABINE,
        OCA: TipoTripulante.OPERADOR_CABINE,
        CTI: TipoTripulante.COORDENADOR_TATICO,
        CT: TipoTripulante.COORDENADOR_TATICO,
        CTA: TipoTripulante.COORDENADOR_TATICO,
        OPVI: TipoTripulante.OPERADOR_VIGILANCIA,
        OPV: TipoTripulante.OPERADOR_VIGILANCIA,
        OPVA: TipoTripulante.OPERADOR_VIGILANCIA,
      };
      return mapping[position] || null;
    };
  }, [TipoTripulante]);

  const crewTypeToApiFormat = useMemo(
    () => (crewType) => crewType.replace(/\s+/g, "_").replace("OPERAÇÕES", "OPERACOES"),
    []
  );

  const apiFormatToCrewType = useMemo(
    () => (apiFormat) => apiFormat.replace(/_/g, " ").replace("OPERACOES", "OPERAÇÕES"),
    []
  );

  const value = useMemo(
    () => ({
      TipoTripulante,
      getAllCrewTypes,
      getCrewTypeOptions,
      positionToCrewType,
      crewTypeToApiFormat,
      apiFormatToCrewType,
      isLoading,
    }),
    [
      TipoTripulante,
      getAllCrewTypes,
      getCrewTypeOptions,
      positionToCrewType,
      crewTypeToApiFormat,
      apiFormatToCrewType,
      isLoading,
    ]
  );

  return (
    <CrewTypesContext.Provider value={value}>
      {children}
    </CrewTypesContext.Provider>
  );
}

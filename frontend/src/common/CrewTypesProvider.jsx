import { getCachedCrewTypes, useCrewTypesQuery } from "@/features/qualifications/queries/useCrewTypesQuery";
import { createContext, useContext, useMemo } from "react";

const CrewTypesContext = createContext(null);

/**
 * Hook to access crew types enum and utilities
 * Fetches crew types from API and caches them
 */
export const useCrewTypes = () => {
  const ctx = useContext(CrewTypesContext);
  if (!ctx) {
    throw new Error("useCrewTypes must be used within CrewTypesProvider");
  }
  return ctx;
};

/**
 * Provider that fetches crew types from API and provides enum utilities
 */
export function CrewTypesProvider({ children }) {
  const { data: crewTypesData = [], isLoading } = useCrewTypesQuery();

  // Build enum object from API data or cache
  const TipoTripulante = useMemo(() => {
    // Handle null/undefined cases
    const crewTypes = (crewTypesData && Array.isArray(crewTypesData) && crewTypesData.length > 0)
      ? crewTypesData 
      : (getCachedCrewTypes() || []);

    // Build enum object from API response
    const enumObj = {};
    if (Array.isArray(crewTypes) && crewTypes.length > 0) {
      crewTypes.forEach(({ value }) => {
        if (value) {
          // Convert "OPERADOR CABINE" -> "OPERADOR_CABINE" for enum key
          const key = value.replace(/\s+/g, "_").replace("OPERAÇÕES", "OPERACOES");
          enumObj[key] = value;
        }
      });
    }

    // Fallback to default if no data available
    if (Object.keys(enumObj).length === 0) {
      return {
        PILOTO: "PILOTO",
        OPERADOR_CABINE: "OPERADOR CABINE",
        CONTROLADOR_TATICO: "CONTROLADOR TATICO",
        OPERADOR_VIGILANCIA: "OPERADOR VIGILANCIA",
        OPERACOES: "OPERAÇÕES",
      };
    }

    return enumObj;
  }, [crewTypesData]);

  // Get all crew type values
  const getAllCrewTypes = useMemo(() => {
    return () => Object.values(TipoTripulante);
  }, [TipoTripulante]);

  // Get crew type options for UI components
  const getCrewTypeOptions = useMemo(() => {
    return () => {
      // Handle null/undefined cases
      const crewTypes = (crewTypesData && Array.isArray(crewTypesData) && crewTypesData.length > 0)
        ? crewTypesData 
        : (getCachedCrewTypes() || []);

      // Map API response to UI options
      if (Array.isArray(crewTypes) && crewTypes.length > 0) {
        return crewTypes.map(({ value }) => {
          // Generate label from value (capitalize first letter of each word)
          const label = value
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");

          return { value, label };
        });
      }

      // Fallback to default options
      return [
        { value: "PILOTO", label: "Piloto" },
        { value: "OPERADOR CABINE", label: "Operador Cabine" },
        { value: "CONTROLADOR TATICO", label: "Controlador Tático" },
        { value: "OPERADOR VIGILANCIA", label: "Operador Vigilância" },
        { value: "OPERAÇÕES", label: "Operações" },
      ];
    };
  }, [crewTypesData]);

  // Map position codes to crew types
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
        CTI: TipoTripulante.CONTROLADOR_TATICO,
        CT: TipoTripulante.CONTROLADOR_TATICO,
        CTA: TipoTripulante.CONTROLADOR_TATICO,
        OPVI: TipoTripulante.OPERADOR_VIGILANCIA,
        OPV: TipoTripulante.OPERADOR_VIGILANCIA,
        OPVA: TipoTripulante.OPERADOR_VIGILANCIA,
      };
      return mapping[position] || null;
    };
  }, [TipoTripulante]);

  // Convert crew type to API format
  const crewTypeToApiFormat = useMemo(() => {
    return (crewType) => {
      return crewType.replace(/\s+/g, "_").replace("OPERAÇÕES", "OPERACOES");
    };
  }, []);

  // Convert API format to crew type
  const apiFormatToCrewType = useMemo(() => {
    return (apiFormat) => {
      return apiFormat.replace(/_/g, " ").replace("OPERACOES", "OPERAÇÕES");
    };
  }, []);

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
/**
 * Crew Type Enum Utilities
 * 
 * This file provides access to crew types fetched from the backend API.
 * The enum values come from api/app/shared/enums.py and are fetched
 * after login and cached in localStorage.
 * 
 * IMPORTANT: Components should use the useCrewTypes() hook from CrewTypesProvider
 * to access these utilities. This ensures crew types are always up-to-date
 * from the backend.
 * 
 * For backward compatibility, this file also exports a hook that wraps useCrewTypes.
 */

import { useCrewTypes } from "./CrewTypesProvider";

/**
 * Hook to access crew types enum and utilities
 * This is the recommended way to access crew types in components
 */
export function useCrewTypesEnum() {
  return useCrewTypes();
}

/**
 * Default fallback enum (used before API data is loaded)
 * This matches the backend enum structure but should be replaced
 * by fetched values from the API
 */
export const TipoTripulanteDefault = {
  PILOTO: "PILOTO",
  OPERADOR_CABINE: "OPERADOR CABINE",
  CONTROLADOR_TATICO: "CONTROLADOR TATICO",
  OPERADOR_VIGILANCIA: "OPERADOR VIGILANCIA",
  OPERACOES: "OPERAÇÕES",
};

// Re-export for convenience (components should use useCrewTypes hook instead)
export { useCrewTypes };

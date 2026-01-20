import { useQuery } from "@tanstack/react-query";
import { qualificationsService } from "../services/qualifications.service";

const CREW_TYPES_STORAGE_KEY = "crew_types";
const CREW_TYPES_CACHE_KEY = ["qualifications", "crew-types"];

/**
 * Get crew types from localStorage cache
 */
export const getCachedCrewTypes = () => {
  try {
    const cached = localStorage.getItem(CREW_TYPES_STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error("Error reading cached crew types:", error);
  }
  return null;
};

/**
 * Save crew types to localStorage cache
 */
export const setCachedCrewTypes = (crewTypes) => {
  try {
    localStorage.setItem(CREW_TYPES_STORAGE_KEY, JSON.stringify(crewTypes));
  } catch (error) {
    console.error("Error caching crew types:", error);
  }
};

/**
 * Hook to fetch crew types from API
 * Fetches from API if authenticated, falls back to cache if available
 */
export function useCrewTypesQuery() {
  return useQuery({
    queryKey: CREW_TYPES_CACHE_KEY,
    queryFn: async () => {
      const crewTypes = await qualificationsService.getCrewTypes();
      // Cache the result
      setCachedCrewTypes(crewTypes);
      return crewTypes;
    },
    enabled: !!localStorage.getItem("token"),
    staleTime: Infinity, // Crew types rarely change, cache indefinitely
    initialData: () => {
      // Use cached data as initial data if available
      return getCachedCrewTypes();
    },
    retry: 1,
  });
}
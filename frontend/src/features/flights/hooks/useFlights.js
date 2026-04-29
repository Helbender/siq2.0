import { useQuery } from "@tanstack/react-query";
import { flightsService } from "../services/flights.service";

export function useFlights({
  airtask,
  tailNumber,
  action,
  atd,
  dateFrom,
  dateTo,
} = {}) {
  return useQuery({
    queryKey: [
      "flights",
      airtask ?? "",
      tailNumber ?? "",
      action ?? "",
      atd ?? "",
      dateFrom ?? "",
      dateTo ?? "",
    ],
    queryFn: () =>
      flightsService.getAll({
        airtask,
        tailNumber,
        action,
        atd,
        dateFrom,
        dateTo,
      }),
    staleTime: 1000 * 60,
  });
}

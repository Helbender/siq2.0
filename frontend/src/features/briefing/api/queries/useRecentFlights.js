import { useQuery } from "@tanstack/react-query";
import { briefingService } from "../briefing.service";

export function useRecentFlights(days = 7) {
  return useQuery({
    queryKey: ["briefing", "recent-flights", days],
    queryFn: () => briefingService.getRecentFlights(days),
  });
}

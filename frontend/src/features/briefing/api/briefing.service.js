import { http } from "@/app/config/http";

export const briefingService = {
  getRecentFlights: async (days = 7) => {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const dateFromStr = dateFrom.toISOString().slice(0, 10);
    const params = new URLSearchParams({
      date_from: dateFromStr,
      per_page: "100",
    });
    const { data } = await http.get(`/flights?${params}`);
    return data?.data ?? [];
  },
};

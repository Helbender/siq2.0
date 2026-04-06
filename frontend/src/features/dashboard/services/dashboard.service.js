import { http } from "@/app/config/http";

export const dashboardService = {
  getStatistics: async (dateFrom, dateTo) => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const response = await http.get(
      `/dashboard/statistics?${params.toString()}`,
    );
    return response.data;
  },

  getAvailableYears: async () => {
    const response = await http.get("/dashboard/available-years");
    return response.data.years;
  },
};

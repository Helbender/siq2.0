import { http } from "@/api/http";

export const dashboardService = {
  getStatistics: async (year) => {
    const response = await http.get(`/dashboard/statistics?year=${year}`);
    return response.data;
  },

  getAvailableYears: async () => {
    const response = await http.get("/dashboard/available-years");
    return response.data.years;
  },
};

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

  getExpiringQualifications: async () => {
    const response = await http.get("/dashboard/expiring-qualifications");
    return response.data.expiring_qualifications || [];
  },
};

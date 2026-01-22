import { http } from "@/api/http";

export const dbManagementService = {
  getFlightsByYear: async () => {
    const { data } = await http.get("/db-management/flights-by-year");
    return data ?? [];
  },

  deleteYear: async (year) => {
    const { data } = await http.delete(`/db-management/flights-by-year/${year}`);
    return data;
  },

  rebackupFlights: async () => {
    const { data } = await http.post("/db-management/rebackup-flights");
    return data;
  },

  rebackupFlightsByYear: async (year) => {
    const { data } = await http.post(`/db-management/rebackup-flights/${year}`);
    return data;
  },

  exportQualifications: async () => {
    const response = await http.get("/db-management/export/qualifications", {
      responseType: "blob",
    });
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "qualifications_backup.json");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return { message: "Qualifications backup downloaded" };
  },

  exportUsers: async () => {
    const response = await http.get("/db-management/export/users", {
      responseType: "blob",
    });
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "users_backup.json");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return { message: "Users backup downloaded" };
  },

  uploadQualifications: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await http.post("/db-management/import/qualifications", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },
};

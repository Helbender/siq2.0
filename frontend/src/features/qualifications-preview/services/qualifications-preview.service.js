import { http } from "@/api/http";
import { PREVIEW_DAYS } from "../constants";

export const qualificationsPreviewService = {
  getExpiringByQualification: async (previewDays = PREVIEW_DAYS) => {
    const params = new URLSearchParams();
    params.set("preview_days", String(previewDays));
    const response = await http.get(
      `/qualifications-preview?${params.toString()}`
    );
    return response.data;
  },
};

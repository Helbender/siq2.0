import { useQuery } from "@tanstack/react-query";
import { qualificationsPreviewService } from "../services/qualifications-preview.service";
import { PREVIEW_DAYS } from "../constants";

export function usePilotQualificationsPreview(previewDays = PREVIEW_DAYS) {
  const {
    data,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["qualifications-preview", "expiring", previewDays],
    queryFn: () => qualificationsPreviewService.getExpiringByQualification(previewDays),
    staleTime: 1000 * 60 * 5,
  });

  return {
    columns: data?.columns ?? [],
    loading,
    error,
  };
}

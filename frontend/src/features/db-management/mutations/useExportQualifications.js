import { useMutation } from "@tanstack/react-query";
import { dbManagementService } from "../services/db-management.service";

export function useExportQualifications() {
  return useMutation({
    mutationFn: dbManagementService.exportQualifications,
  });
}

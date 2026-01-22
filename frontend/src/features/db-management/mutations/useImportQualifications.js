import { useMutation } from "@tanstack/react-query";
import { dbManagementService } from "../services/db-management.service";

export function useImportQualifications() {
  return useMutation({
    mutationFn: dbManagementService.uploadQualifications,
  });
}

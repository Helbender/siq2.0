import {
  Button,
  Dialog,
  IconButton,
  Portal,
  Text,
} from "@chakra-ui/react";
import { HiX } from "react-icons/hi";
import { useDeleteYear } from "../mutations/useDeleteYear";
import { toaster } from "@/utils/toaster";

export function DeleteYearModal({ isOpen, onClose, year, flightCount }) {
  const deleteYear = useDeleteYear();

  const handleDelete = async () => {
    // Show loading toast for pending delete - stays open until API responds
    const pendingToast = toaster.create({
      title: `Deleting year ${year}...`,
      description: `Deleting ${flightCount} flight${flightCount !== 1 ? "s" : ""} and associated records. This may take a moment.`,
      type: "loading",
      duration: null, // Keep it open until we close it
      closable: false,
    });

    const dismissPendingToast = () => {
      try {
        // Try multiple ways to dismiss the toast
        if (pendingToast?.id) {
          toaster.dismiss(pendingToast.id);
        } else if (pendingToast) {
          toaster.dismiss(pendingToast);
        } else {
          // Last resort: dismiss all toasts
          toaster.dismiss();
        }
      } catch (e) {
        // If all else fails, dismiss all
        toaster.dismiss();
      }
    };

    try {
      const result = await deleteYear.mutateAsync(year);
      // Close pending toast and show success
      dismissPendingToast();
      toaster.create({
        title: "Year deleted successfully",
        description: result.message || `All flights for year ${year} have been deleted.`,
        type: "success",
        duration: 3000,
        closable: true,
      });
      onClose();
    } catch (error) {
      // Close pending toast and show error
      dismissPendingToast();
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "An error occurred while deleting the year.";
      toaster.create({
        title: "Error deleting year",
        description: errorMessage,
        type: "error",
        duration: 3000,
        closable: true,
      });
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>Delete Year {year}?</Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <IconButton variant="ghost" size="sm">
                <HiX />
              </IconButton>
            </Dialog.CloseTrigger>
            <Dialog.Body>
              <Text>
                Are you sure you want to delete all flights for year <strong>{year}</strong>?
              </Text>
              <Text mt={2} color="red.500" fontWeight="semibold">
                This will permanently delete {flightCount} flight{flightCount !== 1 ? "s" : ""} and all associated flight pilot records.
              </Text>
              <Text mt={2} fontSize="sm" color="gray.500">
                This action cannot be undone.
              </Text>
            </Dialog.Body>
            <Dialog.Footer gap={2}>
              <Button onClick={onClose} disabled={deleteYear.isPending}>
                Cancel
              </Button>
              <Button
                colorPalette="red"
                onClick={handleDelete}
                isLoading={deleteYear.isPending}
                loadingText="Deleting..."
              >
                Delete Year
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

import {
  Button,
  Dialog,
  IconButton,
  Portal,
  Text,
} from "@chakra-ui/react";
import { HiX } from "react-icons/hi";
import { useDeleteYear } from "../mutations/useDeleteYear";
import { useToast } from "@/utils/useToast";

export function DeleteYearModal({ isOpen, onClose, year, flightCount }) {
  const deleteYear = useDeleteYear();
  const toast = useToast();

  const handleDelete = async () => {
    try {
      const result = await deleteYear.mutateAsync(year);
      toast({
        title: "Year deleted successfully",
        description: result.message,
        status: "success",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error deleting year",
        description: error.response?.data?.error || error.message,
        status: "error",
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

import { useToast } from "@/utils/useToast";
import {
  Button,
  Dialog,
  IconButton,
  Portal,
  useDisclosure,
} from "@chakra-ui/react";
import { BiTrash } from "react-icons/bi";
import { HiX } from "react-icons/hi";
import { useDeleteFlight } from "../../hooks/useDeleteFlight";

export function DeleteFlightModal({ flight }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { mutateAsync, isLoading } = useDeleteFlight();
  const toast = useToast();

  const handleDelete = async () => {
    await mutateAsync(flight.id);
    toast({
      title: "Voo apagado",
      status: "success",
    });
    onClose();
  };

  return (
    <>
      <IconButton
        variant="ghost"
        colorPalette="red"
        onClick={onOpen}
        icon={<BiTrash />}
      />

      <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>Apagar voo</Dialog.Header>

              <Dialog.CloseTrigger asChild>
                <IconButton variant="ghost" size="sm">
                  <HiX />
                </IconButton>
              </Dialog.CloseTrigger>

              <Dialog.Body>
                Tens a certeza que queres apagar o voo{" "}
                <strong>{flight.airtask}</strong>?
              </Dialog.Body>

              <Dialog.Footer>
                <Button onClick={onClose} variant="ghost">
                  Cancelar
                </Button>
                <Button
                  colorPalette="red"
                  onClick={handleDelete}
                  loading={isLoading}
                >
                  Apagar
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

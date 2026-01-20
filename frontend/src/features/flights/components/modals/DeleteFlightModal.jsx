import { useToast } from "@/utils/useToast";
import {
  Button,
  Dialog,
  IconButton,
  Portal,
  useDisclosure,
} from "@chakra-ui/react";
import { BiTrash } from "react-icons/bi";
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
    <Dialog.Root 
      open={isOpen} 
      onOpenChange={({ open }) => {
        if (open) {
          onOpen();
        } else {
          onClose();
        }
      }}
    >
      <Dialog.Trigger asChild>
        <IconButton
          variant="ghost"
          colorPalette="red"
          aria-label="Apagar voo"
        >
          <BiTrash />
        </IconButton>
      </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content bg="bg.surface">
              <Dialog.Header>Apagar voo</Dialog.Header>

              {/* <Dialog.CloseTrigger asChild>
                <IconButton variant="ghost" size="sm">
                  <HiX />
                </IconButton>
              </Dialog.CloseTrigger> */}

              <Dialog.Body>
                Tens a certeza que queres apagar o voo{" "}
                <strong>{flight.airtask}</strong>?
              </Dialog.Body>

              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="ghost">
                    Cancelar
                  </Button>
                </Dialog.ActionTrigger>
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
  );
}

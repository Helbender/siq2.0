import { toaster } from "@/shared/utils/toaster";
import {
  Button,
  Dialog,
  IconButton,
  Portal
} from "@chakra-ui/react";
import { useState } from "react";
import { BiTrash } from "react-icons/bi";
import { useDeleteFlight } from "../../hooks/useDeleteFlight";

export function DeleteFlightModal({ flight }) {
  const { mutateAsync, isPending } = useDeleteFlight();
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    const pendingToast = toaster.create({
      title: "A apagar voo…",
      type: "loading",
      duration: null,
      closable: false,
    });

    const dismissPendingToast = () => {
      try {
        if (pendingToast?.id) toaster.dismiss(pendingToast.id);
        else if (pendingToast) toaster.dismiss(pendingToast);
        else toaster.dismiss();
      } catch {
        toaster.dismiss();
      }
    };

    try {
      await mutateAsync(flight.id);
      dismissPendingToast();
      toaster.create({
        title: "Voo apagado",
        type: "success",
      });
      // Defer close so Dialog receives state update after async/toaster (fixes modal not closing)
      // setTimeout(() => onClose(), 0);
      setOpen(false);
    } catch (error) {
      dismissPendingToast();
      const message =
        error.response?.data?.error ??
        error.response?.data?.message ??
        error.message ??
        "Erro ao apagar o voo.";
      toaster.create({
        title: "Erro ao apagar voo",
        description: message,
        type: "error",
      });
    }
  };

  return (
    <Dialog.Root 
      open={open} 
      onOpenChange={(e) => setOpen(e.open)}
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
              <Dialog.Body>
                Tens a certeza que queres apagar o voo{" "}
                <strong>{flight.airtask}</strong>?
              </Dialog.Body>

              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="ghost" disabled={isPending}>
                    Cancelar
                  </Button>
                </Dialog.ActionTrigger>
                {/* <Dialog.ActionTrigger> */}
                  <Button
                    colorPalette="red"
                    onClick={handleDelete}
                    loading={isPending}
                  >
                    Apagar
                  </Button>
                {/* </Dialog.ActionTrigger> */}
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
  );
}

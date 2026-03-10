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
    const promise = mutateAsync(flight.id);

    toaster.promise(promise, {
      loading: {
        title: "A apagar voo…",
        description: "Por favor aguarde",
      },
      success: {
        title: "Voo apagado",
        description: "Operação concluída com sucesso",
      },
      error: (err) => ({
        title: "Erro ao apagar voo",
        description:
          err.response?.data?.error ??
          err.response?.data?.message ??
          err.message ??
          "Erro ao apagar o voo.",
      }),
    });

    try {
      await promise;
      setOpen(false);
    } catch {
      // Error toast handled by toaster.promise
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

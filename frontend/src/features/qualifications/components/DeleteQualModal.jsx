import { toaster } from "@/utils/toaster";
import {
    Button,
    Dialog,
    IconButton,
    Portal,
    Text,
    useDisclosure,
} from "@chakra-ui/react";
import { Fragment, React } from "react";
import { BiTrash } from "react-icons/bi";
import { HiX } from "react-icons/hi";
import { useDeleteQualification } from "../mutations/useDeleteQualification";

export function DeleteQualModal({ qual }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteQualification = useDeleteQualification();

  const deleteQual = async () => {
    try {
      await deleteQualification.mutateAsync(qual.id);
      toaster.create({
        title: "Sucesso!",
        description: "Qualificação excluída com sucesso.",
        type: "success",
        duration: 3000,
        closable: true,
      });
      onClose();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Ocorreu um erro ao excluir a qualificação.";
      toaster.create({
        title: "Erro!",
        description: errorMessage,
        type: "error",
        duration: 3000,
        closable: true,
      });
    }
  };
  return (
    <Fragment>
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
            colorPalette="red"
            aria-label="Delete Qualification"
          >
            <BiTrash />
          </IconButton>
        </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>Confirmar Ação</Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <IconButton variant="ghost" size="sm">
                  <HiX />
                </IconButton>
              </Dialog.CloseTrigger>
              <Dialog.Body>
                <Text>
                  {`Tem certeza que deseja excluir a qualificação ${qual.nome} do grupo ${qual.grupo}?`}
                </Text>
              </Dialog.Body>
              <Dialog.Footer gap={2}>
                <Button colorPalette="red" onClick={deleteQual}>
                  Excluir
                </Button>
                <Dialog.ActionTrigger asChild>
                  <Button variant="ghost">
                    Cancelar
                  </Button>
                </Dialog.ActionTrigger>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Fragment>
  );
}

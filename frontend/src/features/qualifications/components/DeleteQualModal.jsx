import { useToast } from "@/utils/useToast";
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
  const toast = useToast();
  const deleteQualification = useDeleteQualification();

  const deleteQual = async () => {
    try {
      await deleteQualification.mutateAsync(qual.id);
      toast({
        title: "Sucesso!",
        description: "Qualificação excluída com sucesso.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Ocorreu um erro ao excluir a qualificação.";
      toast({
        title: "Erro!",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  return (
    <Fragment>
      <IconButton
        colorPalette="red"
        onClick={onOpen}
        aria-label="Delete Qualification"
      >
        <BiTrash />
      </IconButton>
      <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
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
                <Button onClick={() => onClose()}>Cancelar</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Fragment>
  );
}

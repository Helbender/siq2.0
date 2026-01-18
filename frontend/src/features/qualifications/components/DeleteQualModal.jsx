import { React, Fragment } from "react";
import {
  Button,
  useDisclosure,
  IconButton,
  Text,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import { HiX } from "react-icons/hi";
import { BiTrash } from "react-icons/bi";
import { http } from "@/api/http";
import { useToast } from "@/utils/useToast";

export function DeleteQualModal({ qual, setQualifications }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const deleteQual = async () => {
    try {
      await http.delete(`/v2/qualificacoes/${qual.id}`);
      toast({
        title: "Sucesso!",
        description: "Qualificação excluída com sucesso.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setQualifications((prev) => prev.filter((item) => item.id !== qual.id));
      onClose();
    } catch (error) {
      console.log(error);
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao excluir a qualificação.",
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

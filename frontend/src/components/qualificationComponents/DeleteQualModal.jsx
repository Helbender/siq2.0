import { React, Fragment } from "react";
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalOverlay,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Button,
  useDisclosure,
  IconButton,
  useToast,
  Text,
} from "@chakra-ui/react";
import { BiTrash } from "react-icons/bi";
import { apiAuth } from "../../utils/api";

const DeleteQualModal = ({ qual, setQualifications }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const deleteQual = async () => {
    try {
      await apiAuth.delete(`/v2/qualificacoes/${qual.id}`);
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
        icon={<BiTrash />}
        colorScheme="red"
        onClick={onOpen}
        aria-label="Delete User"
      />
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar Ação</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              {`Tem certeza que deseja excluir a qualificação ${qual.nome} do grupo ${qual.grupo}?`}
            </Text>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button colorScheme="red" onClick={deleteQual}>
              Excluir
            </Button>
            <Button onClick={() => onClose()}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Fragment>
  );
};

export default DeleteQualModal;

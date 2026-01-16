import React, { Fragment, useState, useContext, useEffect } from "react";
import {
  Button,
  useDisclosure,
  Flex,
  Field,
  Input,
  IconButton,
  Text,
  VStack,
  HStack,
  Switch,
  Select,
  Image,
  Box,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import { HiX } from "react-icons/hi";
import { useForm } from "react-hook-form";
import api, { apiAuth } from "@/utils/api";
import { AuthContext } from "@/features/auth/contexts/AuthContext";
import { useToast } from "@/utils/useToast";

const today = new Date();

export function InsertInitQual(props) {
  const [qualList, setQualList] = useState([]);
  const { token, removeToken } = useContext(AuthContext);
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      date: today.toISOString().substring(0, 10),
    },
  });
  const getQualificationList = async () => {
    try {
      const response = await api.get(
        `/v2/qualificacoeslist/${props.user.nip}`,
        {
          headers: { Authorization: "Bearer " + token },
        },
      );
      const normalized =
        Array.isArray(response.data) && response.data.length > 0
          ? response.data
              .map((qual) => {
                if (!qual) return null;
                const id =
                  typeof qual.id !== "undefined"
                    ? String(qual.id)
                    : Array.isArray(qual) && typeof qual[0] !== "undefined"
                      ? String(qual[0])
                      : null;
                const nome =
                  qual.nome ??
                  (Array.isArray(qual) && typeof qual[1] !== "undefined"
                    ? qual[1]
                    : null);
                if (!id || !nome) return null;
                return { id, nome };
              })
              .filter(Boolean)
          : [];
      setQualList(normalized);
    } catch (error) {
      console.log(error);
    }
  };
  const sendQualification = async (data) => {
    try {
      const response = await apiAuth.post(
        `/v2/qualificacoeslist/${props.user.nip}`,
        data,
      );
      toast({
        title: "Qualificação Actualizada",
        description: response.data.message,
        status: "info",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } catch (error) {
      console.log(error);
      toast({
        title: "Erro",
        description: error.response.data.message,
        status: "info",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };
  return (
    <Fragment>
      <IconButton
        icon={<Image src="plane.png" h={"30px"} w={"30px"} />}
        colorScheme="green"
        onClick={() => {
          onOpen();
          getQualificationList();
        }}
      />
      <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <form onSubmit={handleSubmit(sendQualification)}>
              <Dialog.Content bg={"gray.700"}>
                <Dialog.Header>Adicionar Qualificação Initial</Dialog.Header>
                <Dialog.CloseTrigger asChild>
                  <IconButton variant="ghost" size="sm">
                    <HiX />
                  </IconButton>
                </Dialog.CloseTrigger>
                <Dialog.Body>
                  <Box>
                    <Text
                      margin={"auto"}
                      align={"center"}
                      alignSelf={"center"}
                      textAlign={"center"}
                      maxWidth={"-moz-max-content"}
                      fontSize={"lg"}
                    >
                      {`${props.user.rank} ${props.user.name}`}
                    </Text>
                    <Flex marginTop={8} justifyContent={"space-evenly"}>
                      <Field.Root w={"-moz-max-content"}>
                        <Field.Label textAlign={"center"}>Qualificação</Field.Label>
                        <Select
                          name="qualfication"
                          {...register("qualification")}
                          bg={"gray.600"}
                        >
                          {qualList.map((qual) => (
                            <option key={qual.id} value={qual.id}>
                              {qual.nome}
                            </option>
                          ))}
                        </Select>
                      </Field.Root>
                      <Field.Root w={"min-content"}>
                        <Field.Label textAlign={"center"}>Data</Field.Label>
                        <Input
                          name="date"
                          type="date"
                          {...register("date")}
                          bg={"gray.600"}
                        />
                      </Field.Root>
                    </Flex>
                  </Box>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button
                    colorScheme="green"
                    mr={3}
                    type="submit"
                    onClick={handleSubmit}
                  >
                    Guardar
                  </Button>
                  <Button
                    colorScheme="blue"
                    mr={3}
                    onClick={() => {
                      onClose();
                    }}
                  >
                    Close
                  </Button>
                </Dialog.Footer>
              </Dialog.Content>
            </form>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Fragment>
  );
}

import React, { Fragment, useState, useContext, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  Flex,
  FormControl,
  FormLabel,
  Input,
  IconButton,
  Text,
  VStack,
  HStack,
  Switch,
  useToast,
  Select,
  Tooltip,
  Image,
  Box,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import api, { apiAuth } from "../../utils/api";
import { AuthContext } from "../../Contexts/AuthContext";

const today = new Date();

function InsertInitQual(props) {
  const [qualList, setQualList] = useState([]);
  const { token, removeToken } = useContext(AuthContext);
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    register,
    handleSubmit,
    formState: { errors },
    // reset,
    // watch,
    // setValue,
    // control,
  } = useForm({
    defaultValues: {
      date: today.toISOString().substring(0, 10),
    },
  });
  const getQualificationList = async () => {
    try {
      const response = await api.get(
        `/users/qualificationlist/${props.user.nip}`,
        {
          headers: { Authorization: "Bearer " + token },
        },
      );
      setQualList(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  //   useEffect(() => {
  //     getQualificationList();
  //   }, []);
  const sendQualification = async (data) => {
    try {
      const response = await apiAuth.post(
        `/api/users/qualificationlist/${props.user.nip}`,
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
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <form onSubmit={handleSubmit(sendQualification)}>
          <ModalContent bg={"gray.700"}>
            <ModalHeader>Adicionar Qualificação Initial</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
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
                  <FormControl w={"-moz-max-content"}>
                    <FormLabel textAlign={"center"}>Qualificação</FormLabel>
                    <Select
                      name="qualfication"
                      {...register("qualification")}
                      bg={"gray.600"}
                    >
                      {qualList.map((qual, index) => (
                        <option key={index}>{qual}</option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl w={"min-content"}>
                    <FormLabel textAlign={"center"}>Data</FormLabel>
                    <Input
                      name="date"
                      type="date"
                      {...register("date")}
                      bg={"gray.600"}
                    />
                  </FormControl>
                </Flex>
              </Box>
            </ModalBody>
            <ModalFooter>
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
            </ModalFooter>
          </ModalContent>
        </form>
      </Modal>
    </Fragment>
  );
}

export default InsertInitQual;

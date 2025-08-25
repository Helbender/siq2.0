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
  Stack,
  GridItem,
  Grid,
  Divider,
  Select,
  useToast,
  FormErrorMessage,
  Box,
  Center,
  IconButton,
} from "@chakra-ui/react";
import { useState, useContext, useRef, useEffect } from "react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { FaPlus } from "react-icons/fa";
import { FlightContext } from "../../Contexts/FlightsContext";
import { AuthContext } from "../../Contexts/AuthContext";
import { UserContext } from "../../Contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { getTimeDiff } from "../../Functions/timeCalc";
import { BiEdit } from "react-icons/bi";
import axios from "axios";

const CreateQualModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [tipos, setTipos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        // const res = await axios.get("api/v2/listas");
        const res = await api.get("/v2/listas");
        console.log(res);
        setTipos(res.data.tipos);
        setGrupos(res.data.grupos);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);
  return (
    <>
      <Button onClick={onOpen} colorScheme="green">
        Novo Modelo
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader textAlign={"center"}>Adicionar Qualificação</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormProvider>
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel>Nome da Qualificação</FormLabel>
                  <Input placeholder="Nome da Qualificação" />
                </FormControl>
                <FormControl>
                  <FormLabel>Validade</FormLabel>
                  <Input type="number" placeholder="Validade em dias" />
                </FormControl>
                <FormControl>
                  <FormLabel>Tipo de Tripulante</FormLabel>
                  <Select placeholder="Selecione um tipo">
                    {tipos &&
                      tipos.map((tipo) => <option key={tipo}>{tipo}</option>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Grupo de Qualificação</FormLabel>
                  <Select placeholder="Selecione um grupo">
                    {grupos &&
                      grupos.map((tipo) => <option key={tipo}>{tipo}</option>)}
                  </Select>
                </FormControl>
              </Stack>
            </FormProvider>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3}>
              Salvar
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreateQualModal;

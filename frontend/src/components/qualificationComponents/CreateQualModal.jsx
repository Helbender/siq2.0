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

const CreateQualModal = ({ setQualifications }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [tipos, setTipos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const toast = useToast();
  const qualificacao = useForm();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log(qualificacao.getValues());
      const res = await api.post(
        "/v2/qualificacoes",
        qualificacao.getValues(),
        {},
      );
      toast({ title: "Qualificação criada com sucesso", status: "success" });
      console.log(qualificacao);
      setQualifications((prev) => [
        ...prev,
        { ...qualificacao.getValues(), id: res.data.id },
      ]);
      onClose();
    } catch (error) {
      toast({ title: "Erro a salvar a Qualificação", status: "error" });
      console.error("Erro a salvar a Qualificação:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // const res = await axios.get("api/v2/listas");
        const res = await api.get("/v2/listas");
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
        Nova Qualificação
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
                  <Input
                    placeholder="Nome da Qualificação"
                    {...qualificacao.register("nome")}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Validade</FormLabel>
                  <Input
                    type="number"
                    placeholder="Validade em dias"
                    {...qualificacao.register("validade")}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Tipo de Tripulante</FormLabel>
                  <Select
                    placeholder="Selecione um tipo"
                    {...qualificacao.register("tipo_aplicavel")}
                  >
                    {tipos &&
                      tipos.map((tipo) => <option key={tipo}>{tipo}</option>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Grupo de Qualificação</FormLabel>
                  <Select
                    placeholder="Selecione um grupo"
                    {...qualificacao.register("grupo")}
                  >
                    {grupos &&
                      grupos.map((tipo) => <option key={tipo}>{tipo}</option>)}
                  </Select>
                </FormControl>
              </Stack>
            </FormProvider>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
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

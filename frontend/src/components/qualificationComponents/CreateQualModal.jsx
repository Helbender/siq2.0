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
import { useState, useContext, useRef, useEffect, useMemo } from "react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { FaEdit, FaPlus } from "react-icons/fa";
import { api } from "../../utils/api";

const CreateQualModal = ({ setQualifications, edit, qualification }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [tipos, setTipos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const toast = useToast();
  const qualificacao = useForm(
    qualification || {
      nome: "",
      validade: "",
      tipo_aplicavel: "",
      grupo: "",
    },
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    let res;
    try {
      console.log(qualificacao.getValues());
      {
        edit
          ? (res = await api.patch(
              `/v2/qualificacoes/${qualification.id}`,
              qualificacao.getValues(),
              {},
            ))
          : (res = await api.post(
              "/v2/qualificacoes",
              qualificacao.getValues(),
              {},
            ));
      }
      if (edit) {
        // Update the qualification in the list
        setQualifications((prev) =>
          prev.map((q) =>
            q.id === qualification.id
              ? { ...q, ...qualificacao.getValues(), id: qualification.id }
              : q,
          ),
        );
        toast({
          title: "Qualificação atualizada com sucesso",
          status: "success",
        });
      } else {
        // Add the new qualification to the list
        setQualifications((prev) => [
          ...prev,
          { ...qualificacao.getValues(), id: res.data.id },
        ]);
        toast({ title: "Qualificação criada com sucesso", status: "success" });
      }

      onClose();
    } catch (error) {
      toast({ title: "Erro a salvar a Qualificação", status: "error" });
      console.error("Erro a salvar a Qualificação:", error);
    }
  };

  useMemo(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/v2/listas");
        setTipos(res.data.tipos);
        setGrupos(res.data.grupos);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Populate form fields if in edit mode and qualification is provided
  useEffect(() => {
    if (edit && qualification) {
      qualificacao.reset({
        nome: qualification.nome || "",
        validade: qualification.validade || "",
        tipo_aplicavel: qualification.tipo_aplicavel || "",
        grupo: qualification.grupo || "",
      });
    }
  }, [edit, qualification]);
  return (
    <>
      {edit ? (
        <IconButton
          icon={<FaEdit />}
          colorScheme="yellow"
          onClick={onOpen}
          aria-label="Edit User"
        />
      ) : (
        <Button onClick={onOpen} colorScheme="green">
          Nova Qualificação
        </Button>
      )}
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
              {edit ? "Guardar Alterações" : "Salvar"}
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

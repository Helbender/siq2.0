import {
  Button,
  useDisclosure,
  Flex,
  Field,
  Input,
  Stack,
  IconButton,
  Select,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import { HiX } from "react-icons/hi";
import { useState, useContext, useEffect, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useToast } from "@/utils/useToast";
import { FaEdit } from "react-icons/fa";
import { http } from "@/api/http";

export function CreateQualModal({ setQualifications, edit, qualification }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Reset form and groups when modal opens
  const handleModalOpen = () => {
    if (!edit) {
      qualificacao.reset({
        nome: "",
        validade: "",
        tipo_aplicavel: "",
        grupo: "",
      });
      setGrupos([]);
    }
    onOpen();
  };
  const [tipos, setTipos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [allGrupos, setAllGrupos] = useState([]);
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
          ? (res = await http.patch(
              `/v2/qualificacoes/${qualification.id}`,
              qualificacao.getValues(),
            ))
          : (res = await http.post(
              "/v2/qualificacoes",
              qualificacao.getValues(),
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

  // Function to fetch qualification groups for a specific crew type
  const fetchQualificationGroups = async (crewType) => {
    if (!crewType) {
      setGrupos([]);
      return;
    }

    try {
      const res = await http.get(`/v2/qualification-groups/${crewType}`);
      setGrupos(res.data);
    } catch (error) {
      console.error("Error fetching qualification groups:", error);
      setGrupos([]);
    }
  };

  // Function to fetch all qualification groups (for initial load)
  const fetchAllQualificationGroups = async () => {
    try {
      const res = await http.get("/v2/qualification-groups");
      setAllGrupos(res.data);
    } catch (error) {
      console.error("Error fetching all qualification groups:", error);
    }
  };

  useMemo(() => {
    const fetchData = async () => {
      try {
        const res = await http.get("/v2/listas");
        setTipos(res.data.tipos);
        // Also fetch all qualification groups
        await fetchAllQualificationGroups();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Watch for crew type changes and update qualification groups
  useEffect(() => {
    const subscription = qualificacao.watch((value, { name }) => {
      if (name === "tipo_aplicavel" && value.tipo_aplicavel) {
        fetchQualificationGroups(value.tipo_aplicavel);
        // Clear the grupo field when crew type changes
        qualificacao.setValue("grupo", "");
      }
    });

    return () => subscription.unsubscribe();
  }, [qualificacao]);

  // Populate form fields if in edit mode and qualification is provided
  useEffect(() => {
    if (edit && qualification) {
      qualificacao.reset({
        nome: qualification.nome || "",
        validade: qualification.validade || "",
        tipo_aplicavel: qualification.tipo_aplicavel || "",
        grupo: qualification.grupo || "",
      });
      // If editing and we have a crew type, fetch the appropriate groups
      if (qualification.tipo_aplicavel) {
        fetchQualificationGroups(qualification.tipo_aplicavel);
      }
    }
  }, [edit, qualification]);
  return (
    <>
      {edit ? (
        <IconButton
          icon={<FaEdit />}
          colorPalette="yellow"
          onClick={onOpen}
          aria-label="Edit User"
        />
      ) : (
        <Button onClick={handleModalOpen} colorPalette="green">
          Nova Qualificação
        </Button>
      )}
      <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="xl">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header textAlign={"center"}>Adicionar Qualificação</Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <IconButton variant="ghost" size="sm">
                  <HiX />
                </IconButton>
              </Dialog.CloseTrigger>
              <Dialog.Body>
                <FormProvider>
                  <Stack spacing={4}>
                    <Field.Root>
                      <Field.Label>Nome da Qualificação</Field.Label>
                      <Input
                        placeholder="Nome da Qualificação"
                        {...qualificacao.register("nome")}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Validade</Field.Label>
                      <Input
                        type="number"
                        placeholder="Validade em dias"
                        {...qualificacao.register("validade")}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Tipo de Tripulante</Field.Label>
                      <Select
                        placeholder="Selecione um tipo"
                        {...qualificacao.register("tipo_aplicavel")}
                      >
                        {tipos &&
                          tipos.map((tipo) => <option key={tipo}>{tipo}</option>)}
                      </Select>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Grupo de Qualificação</Field.Label>
                      <Select
                        placeholder={
                          qualificacao.watch("tipo_aplicavel")
                            ? grupos.length > 0
                              ? "Selecione um grupo"
                              : "Carregando grupos..."
                            : "Primeiro selecione um tipo de tripulante"
                        }
                        {...qualificacao.register("grupo")}
                        isDisabled={
                          !qualificacao.watch("tipo_aplicavel") ||
                          grupos.length === 0
                        }
                      >
                        {grupos &&
                          grupos.map((grupo) => (
                            <option key={grupo.value} value={grupo.value}>
                              {grupo.name}
                            </option>
                          ))}
                      </Select>
                    </Field.Root>
                  </Stack>
                </FormProvider>
              </Dialog.Body>

              <Dialog.Footer>
                <Button colorPalette="blue" mr={3} onClick={handleSubmit}>
                  {edit ? "Guardar Alterações" : "Salvar"}
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  Cancelar
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

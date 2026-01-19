import { http } from "@/api/http";
import { useToast } from "@/utils/useToast";
import {
    Button,
    Dialog,
    Field,
    IconButton,
    Input,
    Portal,
    Stack,
    useDisclosure
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FaEdit } from "react-icons/fa";
import { HiX } from "react-icons/hi";
import { useCreateQualification } from "../mutations/useCreateQualification";
import { useUpdateQualification } from "../mutations/useUpdateQualification";

export function CreateQualModal({ edit, qualification }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const createQualification = useCreateQualification();
  const updateQualification = useUpdateQualification();

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
  const [dataFetched, setDataFetched] = useState(false);
  const toast = useToast();
  const qualificacao = useForm(
    qualification || {
      nome: "",
      validade: "",
      tipo_aplicavel: "",
      grupo: "",
    },
  );
  const isMountedRef = useRef(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = qualificacao.getValues();
      if (edit) {
        await updateQualification.mutateAsync({
          qualificationId: qualification.id,
          qualificationData: formData,
        });
        toast({
          title: "Qualificação atualizada com sucesso",
          status: "success",
        });
      } else {
        await createQualification.mutateAsync(formData);
        toast({ title: "Qualificação criada com sucesso", status: "success" });
      }
      onClose();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Erro a salvar a Qualificação";
      toast({ title: errorMessage, status: "error" });
      console.error("Erro a salvar a Qualificação:", error);
    }
  };

  // Function to fetch qualification groups for a specific crew type
  const fetchQualificationGroups = async (crewType) => {
    if (!crewType) {
      if (isMountedRef.current) {
        setGrupos([]);
      }
      return;
    }

    try {
      const res = await http.get(`/v2/qualification-groups/${crewType}`);
      if (isMountedRef.current) {
        setGrupos(res.data);
      }
    } catch (error) {
      console.error("Error fetching qualification groups:", error);
      if (isMountedRef.current) {
        setGrupos([]);
      }
    }
  };

  // Function to fetch all qualification groups (for initial load)
  const fetchAllQualificationGroups = async () => {
    try {
      const res = await http.get("/v2/qualification-groups");
      if (isMountedRef.current) {
        setAllGrupos(res.data);
      }
    } catch (error) {
      console.error("Error fetching all qualification groups:", error);
    }
  };

  // Fetch data only when modal opens, not on component mount
  useEffect(() => {
    isMountedRef.current = true;
    
    if (isOpen && !dataFetched) {
      const fetchData = async () => {
        try {
          const res = await http.get("/v2/listas");
          if (isMountedRef.current) {
            setTipos(res.data.tipos);
            setDataFetched(true);
            // Also fetch all qualification groups
            await fetchAllQualificationGroups();
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
      fetchData();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [isOpen, dataFetched]);

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

  // Populate form fields if in edit mode and qualification is provided (only when modal opens)
  useEffect(() => {
    if (isOpen && edit && qualification) {
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
  }, [isOpen, edit, qualification]);
  return (
    <>
      {edit && (
        <IconButton
          colorPalette="yellow"
          onClick={handleModalOpen}
          aria-label="Edit Qualification"
        >
          <FaEdit />
        </IconButton>
      )}
      <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="xl">
        {!edit && (
          <Dialog.Trigger asChild>
            <Button onClick={handleModalOpen} colorPalette="green">Nova Qualificação</Button>
          </Dialog.Trigger>
        )}
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header textAlign={"center"}>
                {edit ? "Editar Qualificação" : "Adicionar Qualificação"}
              </Dialog.Header>
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
                    {/* <Field.Root>
                      <Field.Label>Tipo de Tripulante</Field.Label>
                      <Select
                        placeholder="Selecione um tipo"
                        {...qualificacao.register("tipo_aplicavel")}
                      >
                        {tipos &&
                          tipos.map((tipo) => <option key={tipo}>{tipo}</option>)}
                      </Select>
                    </Field.Root> */}
                    {/* <Field.Root>
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
                    </Field.Root> */}
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

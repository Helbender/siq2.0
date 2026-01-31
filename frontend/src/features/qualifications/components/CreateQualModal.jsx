import { http } from "@/api/http";
import { useCrewTypes } from "@/common/CrewTypesProvider";
import { toaster } from "@/utils/toaster";
import {
  Button,
  Dialog,
  Field,
  IconButton,
  Input,
  NativeSelect,
  Portal,
  Stack,
  useDisclosure
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { FaEdit } from "react-icons/fa";
import { HiX } from "react-icons/hi";
import { useCreateQualification } from "../mutations/useCreateQualification";
import { useUpdateQualification } from "../mutations/useUpdateQualification";

export function CreateQualModal({ edit, qualification }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const createQualification = useCreateQualification();
  const updateQualification = useUpdateQualification();
  
  let getAllCrewTypes, isLoadingCrewTypes;
  try {
    const crewTypesHook = useCrewTypes();
    getAllCrewTypes = crewTypesHook.getAllCrewTypes;
    isLoadingCrewTypes = crewTypesHook.isLoading;
  } catch (error) {
    getAllCrewTypes = () => [];
    isLoadingCrewTypes = false;
  }

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
  };
  const [tipos, setTipos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [allGrupos, setAllGrupos] = useState([]);
  const [dataFetched, setDataFetched] = useState(false);
  const qualificacao = useForm(
    qualification || {
      nome: "",
      validade: "",
      tipo_aplicavel: "",
      grupo: "",
    },
  );
  const isMountedRef = useRef(true);
  const tipoAplicavel = useWatch({
    control: qualificacao.control,
    name: "tipo_aplicavel",
  });

  // Immediate test - fetch tipos on component mount
  useEffect(() => {
    http.get("/v2/listas")
      .then((res) => {
        if (res.data?.tipos && Array.isArray(res.data.tipos)) {
          setTipos(res.data.tipos);
        }
      })
      .catch((err) => {
        // Error handled silently
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = qualificacao.getValues();
      if (edit) {
        await updateQualification.mutateAsync({
          qualificationId: qualification.id,
          qualificationData: formData,
        });
        toaster.create({
          title: "Qualificação atualizada com sucesso",
          type: "success",
        });
      } else {
        await createQualification.mutateAsync(formData);
        toaster.create({ title: "Qualificação criada com sucesso", type: "success" });
      }
      onClose();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Erro a salvar a Qualificação";
      toaster.create({ title: errorMessage, type: "error" });
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
        // API returns array of {value, name} objects
        let gruposData = [];
        if (Array.isArray(res.data)) {
          gruposData = res.data;
        } else if (res.data?.groups && Array.isArray(res.data.groups)) {
          gruposData = res.data.groups;
        }
        setGrupos(gruposData);
      }
    } catch (error) {
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
      // Error handled silently
    }
  };

  // Set tipos from useCrewTypes hook when modal opens
  useEffect(() => {
    // Check if modal is actually open by checking Dialog state or just fetch when component mounts
    // Since isOpen might be undefined, we'll fetch tipos on mount and when modal state changes
    if (isOpen !== false) {
      // Always fetch from API when modal opens (more reliable)
      if (!dataFetched) {
        http.get("/v2/listas")
          .then((res) => {
            const tiposData = res.data?.tipos;
            
            if (Array.isArray(tiposData) && tiposData.length > 0) {
              setTipos(tiposData);
            } else {
              // Fallback to crew-types
              return http.get("/v2/crew-types");
            }
            fetchAllQualificationGroups();
            setDataFetched(true);
          })
          .then((crewTypesRes) => {
            if (crewTypesRes) {
              if (Array.isArray(crewTypesRes.data) && crewTypesRes.data.length > 0) {
                const tiposFromCrewTypes = crewTypesRes.data.map((item) => 
                  typeof item === "string" ? item : (item.value || item.name || "")
                ).filter(Boolean);
                setTipos(tiposFromCrewTypes);
              }
              fetchAllQualificationGroups();
              setDataFetched(true);
            }
          })
          .catch((error) => {
            setDataFetched(true);
          });
      }
      
      // Also try hook as backup
      try {
        if (getAllCrewTypes) {
          const crewTypes = getAllCrewTypes();
          if (Array.isArray(crewTypes) && crewTypes.length > 0 && tipos.length === 0) {
            setTipos(crewTypes);
          }
        }
      } catch (error) {
        // Error handled silently
      }
    } else {
      // Reset when modal closes
      setDataFetched(false);
      setTipos([]);
      setGrupos([]);
    }
  }, [isOpen, dataFetched]);

  // Watch for crew type changes and update qualification groups
  useEffect(() => {
    // Always fetch when tipoAplicavel changes, regardless of modal state
    // The modal might be open even if isOpen is undefined (Dialog manages its own state)
    
    if (tipoAplicavel) {
      fetchQualificationGroups(tipoAplicavel);
    } else {
      setGrupos([]);
      qualificacao.setValue("grupo", "");
    }
  }, [tipoAplicavel, qualificacao]);

  // Populate form fields if in edit mode and qualification is provided
  // This should run whenever qualification changes, not just when modal opens
  useEffect(() => {
    if (edit && qualification) {
      const formData = {
        nome: qualification.nome || "",
        validade: qualification.validade?.toString() || "",
        tipo_aplicavel: qualification.tipo_aplicavel || "",
        grupo: qualification.grupo || "",
      };
      qualificacao.reset(formData);
      // If editing and we have a crew type, fetch the appropriate groups
      if (qualification.tipo_aplicavel) {
        fetchQualificationGroups(qualification.tipo_aplicavel);
      }
    } else if (!edit) {
      // Reset form when not in edit mode
      qualificacao.reset({
        nome: "",
        validade: "",
        tipo_aplicavel: "",
        grupo: "",
      });
      setGrupos([]);
    }
  }, [edit, qualification, qualificacao]);
  return (
    <>
      <Dialog.Root 
        open={isOpen} 
        onOpenChange={({ open }) => {
          if (open) {
            handleModalOpen();
            onOpen();
            // Populate form when dialog opens in edit mode
            if (edit && qualification) {
              const formData = {
                nome: qualification.nome || "",
                validade: qualification.validade?.toString() || "",
                tipo_aplicavel: qualification.tipo_aplicavel || "",
                grupo: qualification.grupo || "",
              };
              qualificacao.reset(formData);
              // Fetch grupos for the tipo
              if (qualification.tipo_aplicavel) {
                fetchQualificationGroups(qualification.tipo_aplicavel);
              }
            }
          } else {
            // Reset form and state when closing
            if (!edit) {
              qualificacao.reset({
                nome: "",
                validade: "",
                tipo_aplicavel: "",
                grupo: "",
              });
              setGrupos([]);
            }
            onClose();
          }
        }} 
        // size="xl"
      >
        {edit ? (
          <Dialog.Trigger asChild>
            <IconButton
              colorPalette="yellow"
              aria-label="Edit Qualification"
            >
              <FaEdit />
            </IconButton>
          </Dialog.Trigger>
        ) : (
          <Dialog.Trigger asChild>
            <Button colorPalette="green">Nova Qualificação</Button>
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
                  <Stack gap={4}>
                    <Field.Root>
                      <Field.Label>Nome da Qualificação</Field.Label>
                      <Input
                        bg="bg.canvas"
                        placeholder="Nome da Qualificação"
                        value={qualificacao.watch("nome") || ""}
                        onChange={(e) => qualificacao.setValue("nome", e.target.value)}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Validade</Field.Label>
                      <Input
                        bg="bg.canvas"
                        type="number"
                        placeholder="Validade em dias"
                        value={qualificacao.watch("validade") || ""}
                        onChange={(e) => qualificacao.setValue("validade", e.target.value)}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Tipo de Tripulante</Field.Label>
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          bg="bg.canvas"
                          placeholder={isLoadingCrewTypes ? "Carregando..." : "Selecione um tipo"}
                          value={qualificacao.watch("tipo_aplicavel") || ""}
                          onChange={(e) => {
                            const newTipo = e.target.value;
                            qualificacao.setValue("tipo_aplicavel", newTipo);
                            // Immediately fetch grupos when tipo changes
                            if (newTipo) {
                              fetchQualificationGroups(newTipo);
                            } else {
                              setGrupos([]);
                              qualificacao.setValue("grupo", "");
                            }
                          }}
                          disabled={isLoadingCrewTypes}
                        >
                          {!isLoadingCrewTypes && <option value="">Selecione um tipo</option>}
                          {Array.isArray(tipos) && tipos.length > 0
                            ? tipos.map((tipo) => (
                                <option key={tipo} value={tipo}>
                                  {tipo}
                                </option>
                              ))
                            : !isLoadingCrewTypes ? (
                              <option value="" disabled>
                                Nenhum tipo disponível
                              </option>
                            ) : null}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Grupo de Qualificação</Field.Label>
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          bg="bg.canvas"
                          placeholder={
                            tipoAplicavel
                              ? grupos.length > 0
                                ? "Selecione um grupo"
                                : "Carregando grupos..."
                              : "Primeiro selecione um tipo de tripulante"
                          }
                          value={qualificacao.watch("grupo") || ""}
                          onChange={(e) => qualificacao.setValue("grupo", e.target.value)}
                          disabled={
                            !tipoAplicavel ||
                            grupos.length === 0
                          }
                        >
                          {!tipoAplicavel || grupos.length === 0 ? (
                            <option value="" disabled>
                              {tipoAplicavel
                                ? "Carregando grupos..."
                                : "Primeiro selecione um tipo de tripulante"}
                            </option>
                          ) : (
                            <>
                              <option value="">Selecione um grupo</option>
                              {grupos.map((grupo) => {
                                const value = typeof grupo === "string" ? grupo : (grupo.value || grupo);
                                const name = typeof grupo === "string" ? grupo : (grupo.name || grupo.value || grupo);
                                return (
                                  <option key={value} value={value}>
                                    {name}
                                  </option>
                                );
                              })}
                            </>
                          )}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>
                  </Stack>
                </FormProvider>
              </Dialog.Body>

              <Dialog.Footer>
                <Button colorPalette="success" mr={3} onClick={handleSubmit}>
                  {edit ? "Guardar Alterações" : "Salvar"}
                </Button>
                <Dialog.ActionTrigger asChild>
                  <Button variant="subtle">
                    Cancelar
                  </Button>
                </Dialog.ActionTrigger>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

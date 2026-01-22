import { useCrewTypes } from "@/common/CrewTypesProvider";
import { http } from "@/api/http";
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
  console.log("CreateQualModal component rendering, edit:", edit, "qualification:", qualification);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  console.log("useDisclosure - isOpen:", isOpen);
  
  const createQualification = useCreateQualification();
  const updateQualification = useUpdateQualification();
  
  let getAllCrewTypes, isLoadingCrewTypes;
  try {
    const crewTypesHook = useCrewTypes();
    getAllCrewTypes = crewTypesHook.getAllCrewTypes;
    isLoadingCrewTypes = crewTypesHook.isLoading;
    console.log("useCrewTypes hook loaded, isLoading:", isLoadingCrewTypes);
  } catch (error) {
    console.error("Error using useCrewTypes:", error);
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
    console.log("🚀 Component mounted, testing API call immediately...");
    http.get("/v2/listas")
      .then((res) => {
        console.log("✅ IMMEDIATE API CALL SUCCESS:", res.data);
        if (res.data?.tipos && Array.isArray(res.data.tipos)) {
          console.log("✅ Tipos found:", res.data.tipos);
          setTipos(res.data.tipos);
        }
      })
      .catch((err) => {
        console.error("❌ IMMEDIATE API CALL FAILED:", err);
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
      console.error("Erro a salvar a Qualificação:", error);
    }
  };

  // Function to fetch qualification groups for a specific crew type
  const fetchQualificationGroups = async (crewType) => {
    console.log("🔵 fetchQualificationGroups called with crewType:", crewType);
    if (!crewType) {
      console.log("⚠️ No crewType provided, clearing grupos");
      if (isMountedRef.current) {
        setGrupos([]);
      }
      return;
    }

    try {
      console.log("📡 Fetching grupos from /v2/qualification-groups/" + crewType);
      const res = await http.get(`/v2/qualification-groups/${crewType}`);
      console.log("✅ Grupos response:", res.data);
      console.log("✅ Response structure:", typeof res.data, "isArray:", Array.isArray(res.data));
      if (isMountedRef.current) {
        // API returns array of {value, name} objects
        let gruposData = [];
        if (Array.isArray(res.data)) {
          gruposData = res.data;
        } else if (res.data?.groups && Array.isArray(res.data.groups)) {
          gruposData = res.data.groups;
        }
        console.log("✨ Setting grupos:", gruposData, "Count:", gruposData.length);
        setGrupos(gruposData);
      }
    } catch (error) {
      console.error("❌ Error fetching qualification groups:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
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

  // Set tipos from useCrewTypes hook when modal opens
  useEffect(() => {
    console.log("🔵 useEffect for tipos triggered - isOpen:", isOpen, "dataFetched:", dataFetched);
    
    // Check if modal is actually open by checking Dialog state or just fetch when component mounts
    // Since isOpen might be undefined, we'll fetch tipos on mount and when modal state changes
    if (isOpen !== false) {
      console.log("🟢 Modal is open, fetching tipos...");
      
      // Always fetch from API when modal opens (more reliable)
      if (!dataFetched) {
        console.log("📡 Fetching from API /v2/listas...");
        http.get("/v2/listas")
          .then((res) => {
            console.log("✅ API response received:", res);
            console.log("📦 API data:", res.data);
            const tiposData = res.data?.tipos;
            console.log("🎯 Tipos extracted:", tiposData, "Type:", typeof tiposData, "IsArray:", Array.isArray(tiposData));
            
            if (Array.isArray(tiposData) && tiposData.length > 0) {
              console.log("✨ Setting tipos from API:", tiposData);
              setTipos(tiposData);
            } else {
              console.warn("⚠️ API returned empty or invalid tipos, trying crew-types endpoint...");
              // Fallback to crew-types
              return http.get("/v2/crew-types");
            }
            fetchAllQualificationGroups();
            setDataFetched(true);
          })
          .then((crewTypesRes) => {
            if (crewTypesRes) {
              console.log("✅ Crew-types response:", crewTypesRes.data);
              if (Array.isArray(crewTypesRes.data) && crewTypesRes.data.length > 0) {
                const tiposFromCrewTypes = crewTypesRes.data.map((item) => 
                  typeof item === 'string' ? item : (item.value || item.name || '')
                ).filter(Boolean);
                console.log("✨ Setting tipos from crew-types:", tiposFromCrewTypes);
                setTipos(tiposFromCrewTypes);
              }
              fetchAllQualificationGroups();
              setDataFetched(true);
            }
          })
          .catch((error) => {
            console.error("❌ Error fetching tipos:", error);
            console.error("❌ Error details:", error.response?.data);
            console.error("❌ Error status:", error.response?.status);
            setDataFetched(true);
          });
      }
      
      // Also try hook as backup
      try {
        if (getAllCrewTypes) {
          const crewTypes = getAllCrewTypes();
          console.log("🪝 Crew types from hook:", crewTypes);
          if (Array.isArray(crewTypes) && crewTypes.length > 0 && tipos.length === 0) {
            console.log("✨ Setting tipos from hook (backup):", crewTypes);
            setTipos(crewTypes);
          }
        }
      } catch (error) {
        console.error("❌ Error getting crew types from hook:", error);
      }
    } else {
      // Reset when modal closes
      console.log("🔴 Modal closed, resetting state");
      setDataFetched(false);
      setTipos([]);
      setGrupos([]);
    }
  }, [isOpen, dataFetched]);

  // Watch for crew type changes and update qualification groups
  useEffect(() => {
    console.log("🟡 Watch effect - tipoAplicavel:", tipoAplicavel);
    // Always fetch when tipoAplicavel changes, regardless of modal state
    // The modal might be open even if isOpen is undefined (Dialog manages its own state)
    
    if (tipoAplicavel) {
      console.log("✅ tipoAplicavel has value, fetching grupos...");
      fetchQualificationGroups(tipoAplicavel);
    } else {
      console.log("⚠️ No tipoAplicavel, clearing grupos");
      setGrupos([]);
      qualificacao.setValue("grupo", "");
    }
  }, [tipoAplicavel, qualificacao]);

  // Populate form fields if in edit mode and qualification is provided
  // This should run whenever qualification changes, not just when modal opens
  useEffect(() => {
    if (edit && qualification) {
      console.log("📝 Populating form for edit mode, qualification:", qualification);
      const formData = {
        nome: qualification.nome || "",
        validade: qualification.validade?.toString() || "",
        tipo_aplicavel: qualification.tipo_aplicavel || "",
        grupo: qualification.grupo || "",
      };
      console.log("📝 Form data to set:", formData);
      qualificacao.reset(formData);
      // If editing and we have a crew type, fetch the appropriate groups
      if (qualification.tipo_aplicavel) {
        console.log("📥 Fetching grupos for edit mode, tipo:", qualification.tipo_aplicavel);
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
          console.log("🔵 Dialog onOpenChange - open:", open, "edit:", edit, "qualification:", qualification);
          if (open) {
            handleModalOpen();
            onOpen();
            // Populate form when dialog opens in edit mode
            if (edit && qualification) {
              console.log("📝 Dialog opened in edit mode, populating form");
              const formData = {
                nome: qualification.nome || "",
                validade: qualification.validade?.toString() || "",
                tipo_aplicavel: qualification.tipo_aplicavel || "",
                grupo: qualification.grupo || "",
              };
              console.log("📝 Setting form data:", formData);
              qualificacao.reset(formData);
              // Fetch grupos for the tipo
              if (qualification.tipo_aplicavel) {
                console.log("📥 Fetching grupos for tipo:", qualification.tipo_aplicavel);
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
        size="xl"
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
                  <Stack spacing={4}>
                    <Field.Root>
                      <Field.Label>Nome da Qualificação</Field.Label>
                      <Input
                        placeholder="Nome da Qualificação"
                        value={qualificacao.watch("nome") || ""}
                        onChange={(e) => qualificacao.setValue("nome", e.target.value)}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Validade</Field.Label>
                      <Input
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
                          bg="bg.surface"
                          placeholder={isLoadingCrewTypes ? "Carregando..." : "Selecione um tipo"}
                          value={qualificacao.watch("tipo_aplicavel") || ""}
                          onChange={(e) => {
                            const newTipo = e.target.value;
                            console.log("🎯 Tipo changed to:", newTipo);
                            qualificacao.setValue("tipo_aplicavel", newTipo);
                            // Immediately fetch grupos when tipo changes
                            if (newTipo) {
                              console.log("🚀 Immediately fetching grupos for:", newTipo);
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
                          bg="bg.surface"
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
                                const value = typeof grupo === 'string' ? grupo : (grupo.value || grupo);
                                const name = typeof grupo === 'string' ? grupo : (grupo.name || grupo.value || grupo);
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
                <Button colorPalette="blue" mr={3} onClick={handleSubmit}>
                  {edit ? "Guardar Alterações" : "Salvar"}
                </Button>
                <Dialog.ActionTrigger asChild>
                  <Button variant="ghost">
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

import { toaster } from "@/shared/utils/toaster";
import {
  Button,
  Dialog,
  Field,
  IconButton,
  Input,
  NativeSelect,
  Portal,
  Stack,
  useDisclosure,
} from "@chakra-ui/react";
import { useForm, useWatch } from "react-hook-form";
import { FaEdit } from "react-icons/fa";
import { HiX } from "react-icons/hi";
import { useCreateQualification } from "../mutations/useCreateQualification";
import { useUpdateQualification } from "../mutations/useUpdateQualification";
import { useQualificationGroupsQuery } from "../queries/useQualificationGroupsQuery";
import { useTiposQuery } from "../queries/useTiposQuery";

export function CreateQualModal({ edit, qualification }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const createQualification = useCreateQualification();
  const updateQualification = useUpdateQualification();

  const { data: tipos = [], isLoading: isLoadingTipos } = useTiposQuery();

  const qualificacao = useForm(
    qualification || {
      nome: "",
      validade: "",
      tipo_aplicavel: "",
      grupo: "",
    },
  );

  const [tipoAplicavel, nomeWatch, validadeWatch, grupoWatch] = useWatch({
    control: qualificacao.control,
    name: ["tipo_aplicavel", "nome", "validade", "grupo"],
  });

  const { data: grupos = [], isLoading: isLoadingGrupos } =
    useQualificationGroupsQuery(tipoAplicavel);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = qualificacao.getValues();
    const promise = edit
      ? updateQualification.mutateAsync({
          qualificationId: qualification.id,
          qualificationData: formData,
        })
      : createQualification.mutateAsync(formData);

    toaster.promise(promise, {
      loading: {
        title: edit ? "A atualizar qualificação…" : "A criar qualificação…",
        description: "Por favor aguarde",
      },
      success: {
        title: edit
          ? "Qualificação atualizada com sucesso"
          : "Qualificação criada com sucesso",
        description: "Operação concluída",
      },
      error: (err) => ({
        title: edit ? "Erro ao atualizar" : "Erro ao criar",
        description:
          err.response?.data?.message ?? "Erro a salvar a Qualificação",
      }),
    });

    try {
      await promise;
      onClose();
    } catch {
      // Error toast handled by toaster.promise
    }
  };

  const handleOpen = () => {
    onOpen();
    if (edit && qualification) {
      qualificacao.reset({
        nome: qualification.nome || "",
        validade: qualification.validade?.toString() || "",
        tipo_aplicavel: qualification.tipo_aplicavel || "",
        grupo: qualification.grupo || "",
      });
    } else {
      qualificacao.reset({
        nome: "",
        validade: "",
        tipo_aplicavel: "",
        grupo: "",
      });
    }
  };

  return (
    <>
      <Dialog.Root
        open={isOpen}
        onOpenChange={({ open }) => {
          if (open) {
            handleOpen();
          } else {
            if (!edit) {
              qualificacao.reset({
                nome: "",
                validade: "",
                tipo_aplicavel: "",
                grupo: "",
              });
            }
            onClose();
          }
        }}
      >
        {edit ? (
          <Dialog.Trigger asChild>
            <IconButton colorPalette="yellow" aria-label="Edit Qualification">
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
                <Stack gap={4}>
                  <Field.Root>
                    <Field.Label>Nome da Qualificação</Field.Label>
                    <Input
                      placeholder="Nome da Qualificação"
                      value={nomeWatch || ""}
                      onChange={(e) =>
                        qualificacao.setValue("nome", e.target.value)
                      }
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Validade</Field.Label>
                    <Input
                      type="number"
                      placeholder="Validade em dias"
                      value={validadeWatch || ""}
                      onChange={(e) =>
                        qualificacao.setValue("validade", e.target.value)
                      }
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Tipo de Tripulante</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        placeholder={
                          isLoadingTipos ? "Carregando..." : "Selecione um tipo"
                        }
                        value={tipoAplicavel || ""}
                        onChange={(e) => {
                          qualificacao.setValue(
                            "tipo_aplicavel",
                            e.target.value,
                          );
                          qualificacao.setValue("grupo", "");
                        }}
                        disabled={isLoadingTipos}
                      >
                        {!isLoadingTipos && (
                          <option value="">Selecione um tipo</option>
                        )}
                        {Array.isArray(tipos) && tipos.length > 0 ? (
                          tipos.map((tipo) => (
                            <option key={tipo} value={tipo}>
                              {tipo}
                            </option>
                          ))
                        ) : !isLoadingTipos ? (
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
                        placeholder={
                          tipoAplicavel
                            ? grupos.length > 0
                              ? "Selecione um grupo"
                              : isLoadingGrupos
                                ? "Carregando grupos..."
                                : "Sem grupos disponíveis"
                            : "Primeiro selecione um tipo de tripulante"
                        }
                        value={grupoWatch || ""}
                        onChange={(e) =>
                          qualificacao.setValue("grupo", e.target.value)
                        }
                        disabled={
                          !tipoAplicavel ||
                          isLoadingGrupos ||
                          grupos.length === 0
                        }
                      >
                        {tipoAplicavel && grupos.length > 0 && (
                          <>
                            <option value="">Selecione um grupo</option>
                            {grupos.map((grupo) => {
                              const value =
                                typeof grupo === "string"
                                  ? grupo
                                  : grupo.value || grupo;
                              const name =
                                typeof grupo === "string"
                                  ? grupo
                                  : grupo.name || grupo.value || grupo;
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
              </Dialog.Body>

              <Dialog.Footer>
                <Button colorPalette="success" mr={3} onClick={handleSubmit}>
                  {edit ? "Guardar Alterações" : "Salvar"}
                </Button>
                <Dialog.ActionTrigger asChild>
                  <Button variant="subtle">Cancelar</Button>
                </Dialog.ActionTrigger>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

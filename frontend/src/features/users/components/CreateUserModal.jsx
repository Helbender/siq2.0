import { useCrewTypes } from "@/common/CrewTypesProvider";
import { getRoleOptionsForUser } from "@/common/roles";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import {
    Button,
    Dialog,
    Field,
    Flex,
    HStack,
    Input,
    NativeSelect,
    VStack
} from "@chakra-ui/react";
import { useUserForm } from "../hooks/useUserForm";

export function CreateUserModal({
  isOpen,
  onClose,
  editingUser,
  onSubmit,
  isSubmitting = false,
}) {
  const { user: currentUser } = useAuth();
  const { TipoTripulante, crewTypeToApiFormat } = useCrewTypes();
  const { formData, setFormData } = useUserForm(editingUser);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await onSubmit(editingUser?.nip ?? null, formData);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  }
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.CloseTrigger />
          <Dialog.Header>
            <Dialog.Title textAlign={"center"}>{editingUser ? `Editar ${editingUser.rank} ${editingUser.name}` : "Novo Utilizador"}</Dialog.Title>
          </Dialog.Header>
          
          <Dialog.Body>
            <form onSubmit={handleSubmit}>
              <VStack gap={4}>
                <Flex flexDirection={"row"} gap={"4"} width="100%">
                  <Field.Root flex="1">
                    <Field.Label>Posto</Field.Label>
                    <Input
                      value={formData.rank}
                      placeholder="Posto"
                      onChange={(e) =>
                        setFormData({ ...formData, rank: e.target.value })
                      }
                    />
                  </Field.Root>
                  <Field.Root flex="1">
                    <Field.Label>NIP</Field.Label>
                    <Input
                      value={formData.nip}
                      placeholder="NIP"
                      onChange={(e) =>
                        setFormData({ ...formData, nip: e.target.value })
                      }
                      readOnly={!!editingUser}
                      disabled={!!editingUser}
                      variant={editingUser ? "readOnly" : undefined}
                    />
                  </Field.Root>
                  <Field.Root flex="1">
                    <Field.Label>Função</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        value={formData.position}
                        onChange={(e) =>
                          setFormData({ ...formData, position: e.target.value })
                        }
                      >
                        <option>Default</option>
                        <option>PC</option>
                        <option>P</option>
                        <option>CP</option>
                        <option>PA</option>
                        <option>PI</option>
                        <option>OCI</option>
                        <option>OC</option>
                        <option>OCA</option>
                        <option>CTI</option>
                        <option>CT</option>
                        <option>CTA</option>
                        <option>OPVI</option>
                        <option>OPV</option>
                        <option>OPVA</option>
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>
                </Flex>
                <Field.Root width="100%">
                  <Field.Label>Nome</Field.Label>
                  <Input
                      value={formData.name}
                    placeholder="Primeiro e Último Nome"
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </Field.Root>
                <Field.Root width="100%">
                  <Field.Label>Email</Field.Label>
                  <Input
                    value={formData.email}
                    type="email"
                    placeholder="Email"
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </Field.Root>
                <HStack width="100%">
                  <Field.Root>
                    <Field.Label>Grupo</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        value={formData.tipo}
                        onChange={(e) =>
                          setFormData({ ...formData, tipo: e.target.value })
                        }
                      >
                        <option value={crewTypeToApiFormat(TipoTripulante.PILOTO)}>
                          {TipoTripulante.PILOTO}
                        </option>
                        <option value={crewTypeToApiFormat(TipoTripulante.OPERADOR_CABINE)}>
                          {TipoTripulante.OPERADOR_CABINE}
                        </option>
                        <option value={crewTypeToApiFormat(TipoTripulante.CONTROLADOR_TATICO)}>
                          {TipoTripulante.CONTROLADOR_TATICO}
                        </option>
                        <option value={crewTypeToApiFormat(TipoTripulante.OPERADOR_VIGILANCIA)}>
                          {TipoTripulante.OPERADOR_VIGILANCIA}
                        </option>
                        <option value={crewTypeToApiFormat(TipoTripulante.OPERACOES)}>
                          {TipoTripulante.OPERACOES}
                        </option>
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Status</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                      >
                        <option value="Presente">Presente</option>
                        <option value="Fora">Fora</option>
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>
                  {currentUser?.roleLevel || currentUser?.role?.level ? (
                    <Field.Root>
                      <Field.Label>Role</Field.Label>
                      <NativeSelect.Root>
<NativeSelect.Field
                        value={formData.roleLevel}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              roleLevel: parseInt(e.target.value, 10),
                            })
                          }
                        >
                          {getRoleOptionsForUser(
                            currentUser?.roleLevel || currentUser?.role?.level
                          ).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>
                  ) : null}
                </HStack>
                <HStack width="100%" gap={2}>
                  <Button
                    type="button"
                    flex="1"
                    variant="subtle"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Fechar
                  </Button>
                  <Button
                    type="submit"
                    flex="1"
                    variant="solid"
                    colorPalette="success"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    {editingUser ? "Guardar" : "Criar"}
                  </Button>
                </HStack>
              </VStack>
            </form>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

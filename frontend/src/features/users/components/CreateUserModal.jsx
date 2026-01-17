import { useAuth } from "@/features/auth/contexts/AuthContext";
import {
  Button,
  Dialog,
  Field,
  Flex,
  HStack,
  Input,
  NativeSelect,
  Switch,
  VStack
} from "@chakra-ui/react";
import { useState } from "react";
import { useUserForm } from "../hooks/useUserForm";

export function CreateUserModal({
  isOpen,
  onClose,
  editingUser,
  onSubmit,
}) {
  const { user: currentUser } = useAuth();
  const { formData, setFormData } = useUserForm(editingUser);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(editingUser?.nip ?? null, formData);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
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
              <VStack spacing={4}>
                <Flex flexDirection={"row"} gap={"4"} width="100%">
                  <Field.Root flex="1">
                    <Field.Label>Posto</Field.Label>
                    <Input
                      bg="bg.surface"
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
                      bg="bg.surface"
                      value={formData.nip}
                      placeholder="NIP"
                      onChange={(e) =>
                        setFormData({ ...formData, nip: e.target.value })
                      }
                      readOnly={!!editingUser}
                      disabled={!!editingUser}
                    />
                  </Field.Root>
                  <Field.Root flex="1">
                    <Field.Label>Função</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        bg="bg.surface"
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
                    bg="bg.surface"
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
                    bg="bg.surface"
                    value={formData.email}
                    type="email"
                    placeholder="Email"
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </Field.Root>
                <HStack width="100%">
                  {currentUser?.admin ? (
                    <Field.Root align={"center"}>
                      <Field.Label textAlign={"center"}>Admin</Field.Label>
                      <Switch.Root
                        checked={formData.admin}
                        onCheckedChange={(details) =>
                          setFormData({
                            ...formData,
                            admin: details.checked,
                          })
                        }
                      >
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label />
                      </Switch.Root>
                    </Field.Root>
                  ) : null}
                  <Field.Root hidden={true}>
                    <Field.Label>Esquadra</Field.Label>
                    <Input
                      bg="bg.surface"
                      value={formData.squadron}
                      type="text"
                      placeholder="Esquadra"
                      onChange={(e) =>
                        setFormData({ ...formData, squadron: e.target.value })
                      }
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Grupo</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        bg="bg.surface"
                        value={formData.tipo}
                        onChange={(e) =>
                          setFormData({ ...formData, tipo: e.target.value })
                        }
                      >
                        <option value="PILOTO">PILOTO</option>
                        <option value="OPERADOR_CABINE">OPERADOR CABINE</option>
                        <option value="CONTROLADOR_TATICO">
                          CONTROLADOR TÁTICO
                        </option>
                        <option value="OPERADOR_VIGILANCIA">
                          OPERADOR VIGILÂNCIA
                        </option>
                        <option value="OPERACOES">OPERAÇÕES</option>
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Status</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        bg="bg.surface"
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
                </HStack>
                <Button
                  type="submit"
                  width="full"
                  variant="solid"
                  colorPalette="success"
                  isLoading={isSubmitting}
                >
                  {editingUser ? "Guardar" : "Criar"}
                </Button>
              </VStack>
            </form>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

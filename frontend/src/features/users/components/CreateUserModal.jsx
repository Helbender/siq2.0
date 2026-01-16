import {
  Button,
  useDisclosure,
  Flex,
  Field,
  Input,
  IconButton,
  Text,
  VStack,
  HStack,
  Switch,
  Select,
  Dialog,
  Portal,
  Tooltip,
} from "@chakra-ui/react";
import { HiX } from "react-icons/hi";
import { FaEdit, FaPlus } from "react-icons/fa";
import { useState, useContext } from "react";
import { AuthContext } from "@/features/auth/contexts/AuthContext";
import { UserContext } from "../contexts/UserContext";
import { BiTrash } from "react-icons/bi";
import api, { apiAuth } from "@/utils/api";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/utils/useToast";

export function CreateUserModal({ edit, add, isDelete, user }) {
  const navigate = useNavigate();

  const { token, removeToken, getUser } = useContext(AuthContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [inputs, setInputs] = useState(
    user ?? {
      rank: "",
      nip: "",
      name: "",
      email: "",
      position: "Default",
      admin: false,
      squadron: "502 - Elefantes",
      tipo: "PILOTO",
      status: "Presente",
    },
  );
  const { users, setUsers } = useContext(UserContext);
  const User = getUser();

  //Updates inputs when filling the form
  const handleInputsChange = async (event) => {
    event.preventDefault();
    const { value, name } = event.target;
    setInputs(() => ({ ...inputs, [name]: value }));
  };

  //Submits the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log(inputs);
      const res = await apiAuth.post("/users", inputs, {});
      toast({ title: "User created successfully", status: "success" });

      setUsers([...users, res.data]);
      onClose();
    } catch (error) {
      toast({ title: "Error saving user", status: "error" });
      console.error("Error saving user:", error);
    }
  };

  //Edits the user
  const handleEditUser = async (e) => {
    e.preventDefault();

    try {
      const res = await apiAuth.patch(`/users/${user.nip}`, inputs);
      toast({ title: "User updated successfully", status: "success" });

      console.log(res.data);
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.nip === user.nip ? res.data : u)),
      );

      onClose();
    } catch (error) {
      toast({
        title: "Error editing user",
        description: error.response.data.message,
        status: "error",
      });
      console.error("Error editing user:", error);
    }
  };

  //Deletes the user
  const handleDeleteUser = async () => {
    try {
      const res = await api.delete(`/users/${user.nip}`, {
        headers: { Authorization: "Bearer " + token },
      });
      console.log(res);
      if (res.data?.deleted_id) {
        setUsers(users.filter((piloto) => piloto.nip != user.nip));
        toast({
          title: "Utilizador apagado com sucesso",
          description: `Utilizador com o nip ${res.data.deleted_id} apagado`,
          status: "info",
        });
        onClose();
      }
    } catch (error) {
      console.log(error);
      toast({
        title: "Error deleting user",
        description: error.response.data.message,
        status: "error",
      });
    }
  };
  return (
    <>
      {add ? (
        <Button leftIcon={<FaPlus />} onClick={onOpen}>
          Criar Utilizador
        </Button>
      ) : edit ? (
        <IconButton
          icon={<FaEdit />}
          colorScheme="yellow"
          onClick={onOpen}
          aria-label="Edit User"
        />
      ) : (
        <IconButton
          icon={<BiTrash />}
          colorScheme="red"
          onClick={onOpen}
          aria-label="Delete User"
        />
      )}

      <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              {add ? (
                <Dialog.Header textAlign={"center"}>Novo Utilizador</Dialog.Header>
              ) : edit ? (
                <Dialog.Header>{`Editar ${user.rank} ${user.name}`}</Dialog.Header>
              ) : (
                <Dialog.Header>{`Apagar ${user.rank} ${user.name}`}</Dialog.Header>
              )}
              <Dialog.CloseTrigger asChild>
                <IconButton variant="ghost" size="sm">
                  <HiX />
                </IconButton>
              </Dialog.CloseTrigger>
              {isDelete ? (
                <Text textAlign={"center"}>Tem a certeza?</Text>
              ) : (
                <Dialog.Body>
              <Flex flexDirection={"row"} gap={"4"}>
                <Field.Root>
                  <Field.Label>Posto</Field.Label>
                  <Input
                    value={inputs?.rank ? inputs.rank : ""}
                    name="rank"
                    placeholder="Posto"
                    onChange={handleInputsChange}
                  ></Input>
                </Field.Root>
                <Field.Root>
                  <Field.Label>NIP</Field.Label>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Input
                        value={inputs?.nip}
                        name="nip"
                        placeholder="NIP"
                        onChange={handleInputsChange}
                        isReadOnly={edit || isDelete}
                        isDisabled={edit || isDelete}
                      ></Input>
                    </Tooltip.Trigger>
                    <Tooltip.Positioner>
                      <Tooltip.Content>
                        <Tooltip.Arrow>
                          <Tooltip.ArrowTip />
                        </Tooltip.Arrow>
                        Introduza o NIP sem modúlo
                      </Tooltip.Content>
                    </Tooltip.Positioner>
                  </Tooltip.Root>
                </Field.Root>
                <Field.Root>
                  <Field.Label>Função</Field.Label>
                  <Select
                    value={inputs?.position ? inputs.position : "Default"}
                    name="position"
                    onChange={handleInputsChange}
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
                  </Select>
                </Field.Root>
              </Flex>
              <VStack mt={5} spacing={4} align="stretch">
                <Field.Root>
                  <Field.Label flexGrow={"2"}>Nome</Field.Label>
                  <Input
                    value={inputs?.name ? inputs.name : ""}
                    name="name"
                    flexGrow={"2"}
                    placeholder="Primeiro e Último Nome"
                    onChange={handleInputsChange}
                  ></Input>
                </Field.Root>
                <Field.Root>
                  <Field.Label>Email</Field.Label>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Input
                        value={inputs?.email ? inputs.email : ""}
                        name="email"
                        type="email"
                        placeholder="Email"
                        onChange={handleInputsChange}
                      ></Input>
                    </Tooltip.Trigger>
                    <Tooltip.Positioner>
                      <Tooltip.Content>
                        <Tooltip.Arrow>
                          <Tooltip.ArrowTip />
                        </Tooltip.Arrow>
                        O email serve para trocar/recuperar a password
                      </Tooltip.Content>
                    </Tooltip.Positioner>
                  </Tooltip.Root>
                </Field.Root>
                <HStack>
                  {User.admin ? (
                    <Field.Root align={"center"}>
                      <Field.Label textAlign={"center"}>Admin</Field.Label>
                      <Switch
                        name="admin"
                        isChecked={inputs.admin}
                        onChange={(e) =>
                          setInputs((prev) => ({
                            ...prev,
                            admin: e.target.checked,
                          }))
                        }
                      />
                    </Field.Root>
                  ) : null}
                  <Field.Root hidden={true}>
                    <Field.Label>Esquadra</Field.Label>
                    <Input
                      value={inputs.squadron}
                      name="squadron"
                      type="text"
                      placeholder="Esquadra"
                      onChange={handleInputsChange}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Grupo</Field.Label>
                    <Select
                      value={inputs?.tipo ? inputs.tipo : ""}
                      name="tipo"
                      onChange={handleInputsChange}
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
                    </Select>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Status</Field.Label>
                    <Select
                      value={inputs?.status ? inputs.status : "Presente"}
                      name="status"
                      onChange={handleInputsChange}
                    >
                      <option value="Presente">Presente</option>
                      <option value="Fora">Fora</option>
                    </Select>
                  </Field.Root>
                </HStack>
              </VStack>
              </Dialog.Body>
            )}
              <Dialog.Footer>
                {isDelete ? (
                  <Button
                    colorScheme="red"
                    mr={3}
                    type="submit"
                    onClick={handleDeleteUser}
                  >
                    Apagar
                  </Button>
                ) : (
                  <Button
                    colorScheme="green"
                    mr={3}
                    type="submit"
                    onClick={edit ? handleEditUser : handleSubmit}
                  >
                    {edit ? "Guardar" : "Criar"}
                  </Button>
                )}
                <Button
                  colorScheme="blue"
                  mr={3}
                  onClick={() => {
                    onClose();
                  }}
                >
                  Close
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

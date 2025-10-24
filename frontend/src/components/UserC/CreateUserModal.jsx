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
  IconButton,
  Text,
  VStack,
  HStack,
  Switch,
  useToast,
  Select,
  Tooltip,
} from "@chakra-ui/react";
import { FaEdit, FaPlus } from "react-icons/fa";
import { useState, useContext } from "react";
import { AuthContext } from "../../Contexts/AuthContext";
import { UserContext } from "../../Contexts/UserContext";
import { BiTrash } from "react-icons/bi";
import api, { apiAuth } from "../../utils/api";
import { useNavigate } from "react-router-dom";

function CreateUserModal({ edit, add, isDelete, user }) {
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
      // setInputs({
      //   rank: "",
      //   nip: "",
      //   name: "",
      //   email: "",
      //   position: "Default",
      //   admin: false,
      //   squadron: "502 - Elefantes",
      // });
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
      // setFilteredUsers((prevUsers) =>
      //   prevUsers.map((u) => (u.nip === user.nip ? res.data : u)),
      // );

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
        // setFilteredUsers(pilotos.filter((piloto) => piloto.nip != user.nip));
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

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          {add ? (
            <ModalHeader textAlign={"center"}>Novo Utilizador</ModalHeader>
          ) : edit ? (
            <ModalHeader>{`Editar ${user.rank} ${user.name}`}</ModalHeader>
          ) : (
            <ModalHeader>{`Apagar ${user.rank} ${user.name}`}</ModalHeader>
          )}
          <ModalCloseButton />
          {isDelete ? (
            <Text textAlign={"center"}>Tem a certeza?</Text>
          ) : (
            <ModalBody>
              <Flex flexDirection={"row"} gap={"4"}>
                <FormControl>
                  <FormLabel>Posto</FormLabel>
                  <Input
                    value={inputs?.rank ? inputs.rank : ""}
                    name="rank"
                    placeholder="Posto"
                    onChange={handleInputsChange}
                  ></Input>
                </FormControl>
                <FormControl>
                  <FormLabel>NIP</FormLabel>
                  <Tooltip hasArrow label="Introduza o NIP sem modúlo">
                    <Input
                      // type="number"
                      // maxLength={6}
                      value={inputs?.nip}
                      name="nip"
                      placeholder="NIP"
                      onChange={handleInputsChange}
                      isReadOnly={edit || isDelete}
                      isDisabled={edit || isDelete}
                    ></Input>
                  </Tooltip>
                </FormControl>
                <FormControl>
                  <FormLabel>Função</FormLabel>
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
                </FormControl>
              </Flex>
              <VStack mt={5} spacing={4} align="stretch">
                <FormControl>
                  <FormLabel flexGrow={"2"}>Nome</FormLabel>
                  <Input
                    value={inputs?.name ? inputs.name : ""}
                    name="name"
                    flexGrow={"2"}
                    placeholder="Primeiro e Último Nome"
                    onChange={handleInputsChange}
                  ></Input>
                </FormControl>
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Tooltip
                    hasArrow
                    label="O email serve para trocar/recuperar a password"
                  >
                    <Input
                      value={inputs?.email ? inputs.email : ""}
                      name="email"
                      type="email"
                      placeholder="Email"
                      onChange={handleInputsChange}
                    ></Input>
                  </Tooltip>
                </FormControl>
                <HStack>
                  {User.admin ? (
                    <FormControl align={"center"}>
                      <FormLabel textAlign={"center"}>Admin</FormLabel>
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
                    </FormControl>
                  ) : null}
                  <FormControl hidden={true}>
                    <FormLabel>Esquadra</FormLabel>
                    <Input
                      value={inputs.squadron}
                      name="squadron"
                      type="text"
                      placeholder="Esquadra"
                      onChange={handleInputsChange}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Grupo</FormLabel>
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
                  </FormControl>
                </HStack>
              </VStack>
            </ModalBody>
          )}
          <ModalFooter>
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
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default CreateUserModal;

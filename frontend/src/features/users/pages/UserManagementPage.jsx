import { useContext, useState, useEffect } from "react";
import {
  Container,
  HStack,
  Input,
  Spacer,
  Table,
  IconButton,
  useBreakpointValue,
  Grid,
  Text,
} from "@chakra-ui/react";
import { UserContext } from "../contexts/UserContext";
import { CreateUserModal } from "../components/CreateUserModal";
import { FaMailBulk } from "react-icons/fa";
import { UserDataCard } from "../components/UserDataCard";
import { useSendEmail } from "@/utils/useSendEmail";
import { AuthContext } from "@/features/auth/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { IoCheckmarkCircleSharp } from "react-icons/io5";
import { IoCloseCircleSharp } from "react-icons/io5";
import { IoIosCheckmark } from "react-icons/io";
import { IoIosClose } from "react-icons/io";
import { FileUpload } from "../components/FileUpload";
import { InsertInitQual } from "../components/InsertInitQual";
import { useToast } from "@/utils/useToast";

export function UserManagementPage() {
  const navigate = useNavigate();
  const { token, getUser } = useContext(AuthContext);
  const { users } = useContext(UserContext);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const displayAsTable = useBreakpointValue({ base: false, xl: true });
  const sendEmail = useSendEmail();
  const toast = useToast();

  const User = getUser();
  const checkToken = () => {
    if (!token && token !== "" && token !== undefined) {
      navigate("/");
    }
  };
  checkToken();
  // Filter users based on search term
  useEffect(() => {
    if (User.admin) {
      const results = users.filter((user) =>
        [
          user.nip,
          user.name,
          user.position,
          user.tipo,
          user.status,
        ]
          .map((field) => (field ? field.toString().toLowerCase() : ""))
          .some((field) => field.includes(searchTerm.toLowerCase())),
      );
      setFilteredUsers(results);
    } else {
      const results = users.filter((u) => u.nome === User.nome);
      setFilteredUsers(results);
    }
  }, [searchTerm, users]);
  return (
    <Container maxW="90%" py={6} mb={35}>
      <HStack mb={10} align={"center"}>
        <CreateUserModal add={true} />
        <Spacer />
        <Text>Nº de Utilizadores: {filteredUsers.length}</Text>
        <Spacer />
        <Input
          placeholder="Search..."
          maxWidth={200}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="md"
          flex="1"
        />
      </HStack>
      <HStack>
        {Array.from(
          filteredUsers.reduce((set, user) => {
            if (user.position) set.add(user.position);
            return set;
          }, new Set()),
        ).map((position) => (
          <Text key={position}>
            <b>{position}</b>:{" "}
            {filteredUsers.filter((user) => user.position === position).length}
          </Text>
        ))}
      </HStack>

      {displayAsTable ? (
        <Table.Root variant="simple" mt={4} overflowX="auto">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>NIP</Table.ColumnHeader>
              <Table.ColumnHeader>Nome</Table.ColumnHeader>
              <Table.ColumnHeader>Posto</Table.ColumnHeader>
              <Table.ColumnHeader>Função</Table.ColumnHeader>
              <Table.ColumnHeader>Tipo</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader>Admin</Table.ColumnHeader>
              <Table.ColumnHeader></Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredUsers.map((user) => (
              <Table.Row key={user.nip}>
                <Table.Cell>{user.nip}</Table.Cell>
                <Table.Cell>{user.name}</Table.Cell>
                <Table.Cell>{user.rank}</Table.Cell>
                <Table.Cell>{user.position}</Table.Cell>
                <Table.Cell>{user.tipo}</Table.Cell>
                <Table.Cell>
                  {user.status === "Presente" ? (
                    <IoIosCheckmark size={"30px"} color="green" />
                  ) : (
                    <IoIosClose size={"30px"} color="red" />
                  )}
                </Table.Cell>
                <Table.Cell>
                  {user.admin ? (
                    <IoCheckmarkCircleSharp size={"30px"} color="green" />
                  ) : (
                    <IoCloseCircleSharp size={"30px"} color="red" />
                  )}
                </Table.Cell>
                <Table.Cell>
                  <HStack spacing={2} align="center">
                    <CreateUserModal edit={true} user={user} />
                    <InsertInitQual user={user} />
                    <IconButton
                      icon={<FaMailBulk />}
                      colorScheme="blue"
                      onClick={() => {
                        toast({
                          title: "Sending Email",
                          description: "Wait while we send the Email",
                          status: "info",
                          duration: 5000,
                          isClosable: true,
                          position: "top",
                        });
                        sendEmail(user.email, `/api/recover/${user.email}`);
                      }}
                      aria-label="Email User"
                    />
                    <CreateUserModal isDelete={true} user={user} />
                  </HStack>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      ) : (
        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(2,1fr)",
            xl: "repeat(3,1fr)",
          }}
          gap={5}
          mt="8"
        >
          {filteredUsers.map((user) => (
            <UserDataCard m={5} key={user.nip} user={user} />
          ))}
        </Grid>
      )}
      <FileUpload />
    </Container>
  );
}

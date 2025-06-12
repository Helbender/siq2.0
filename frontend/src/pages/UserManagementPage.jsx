import { useContext, useState, useEffect } from "react";
import {
  Container,
  HStack,
  Input,
  Spacer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  IconButton,
  useBreakpointValue,
  Grid,
  useToast,
  Image,
} from "@chakra-ui/react";
import { UserContext } from "../Contexts/UserContext";
import CreateUserModal from "../components/UserC/CreateUserModal";
import { FaMailBulk } from "react-icons/fa";
import UserDataCard from "../components/UserC/UserDataCard";
import { useSendEmail } from "../Functions/useSendEmail";
import { AuthContext } from "../Contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { IoCheckmarkCircleSharp } from "react-icons/io5";
import { IoCloseCircleSharp } from "react-icons/io5";
import FileUpload from "../components/FileUpload";
import { GiPlanePilot } from "react-icons/gi";
import InsertInitQual from "../components/UserC/InsertInitQual";

function UserManagementPage() {
  const navigate = useNavigate();
  const { token, getUser } = useContext(AuthContext);
  const { pilotos } = useContext(UserContext);
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
      const results = pilotos.filter((user) =>
        [
          user.nip,
          user.name,
          user.rank,
          user.position,
          user.email,
          user.admin ? "Yes" : "No",
          user.squadron,
        ]
          .map((field) => (field ? field.toString().toLowerCase() : ""))
          .some((field) => field.includes(searchTerm.toLowerCase())),
      );
      setFilteredUsers(results);
    } else {
      const results = pilotos.filter((u) => u.name === User.name);
      setFilteredUsers(results);
    }
  }, [searchTerm, pilotos]);
  return (
    <Container maxW="90%" py={6} mb={35}>
      <HStack mb={10} align={"center"}>
        <CreateUserModal add={true} />

        <Spacer />
        <Input
          placeholder="Search..."
          maxWidth={200}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="md"
          flex="1"
        />
      </HStack>
      {displayAsTable ? (
        <Table variant="simple" mt={4} overflowX="auto">
          <Thead>
            <Tr>
              <Th>NIP</Th>
              <Th>Name</Th>
              <Th>Rank</Th>
              <Th>Position</Th>
              {/* <Th>Email</Th> */}
              <Th>Admin</Th>
              {/* <Th>Squadron</Th> */}
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredUsers.map((user) => (
              <Tr key={user.nip}>
                <Td>{user.nip}</Td>
                <Td>{user.name}</Td>
                <Td>{user.rank}</Td>
                <Td>{user.position}</Td>
                {/* <Td>{user.email}</Td> */}
                <Td>
                  {user.admin ? (
                    <IoCheckmarkCircleSharp size={"30px"} color="green" />
                  ) : (
                    <IoCloseCircleSharp size={"30px"} color="red" />
                  )}
                </Td>
                {/* <Td>{user.squadron}</Td> */}
                <Td>
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
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
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

export default UserManagementPage;

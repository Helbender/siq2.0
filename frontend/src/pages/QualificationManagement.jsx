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
  Text,
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
import axios from "axios";
import CreateQualModal from "../components/qualificationComponents/CreateQualModal";

function QualificationManagement() {
  const navigate = useNavigate();
  const { token, getUser } = useContext(AuthContext);
  const [filteredQualifications, setFilteredQualifications] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const toast = useToast();
  // console.log(pilotos);

  const getData = async () => {
    try {
      const res = await axios.get("/api/v2/qualificacoes");
      setQualifications(res.data);
    } catch (error) {
      console.log(error);
      console.log(error.response.status);
    }
  };
  useEffect(() => {
    getData();
  }, []);
  // Filter users based on search term
  useEffect(() => {
    const results = qualifications.filter((qual) =>
      [qual.nome, qual.validade, qual.tipos_permitidos]
        .map((field) => (field ? field.toString().toLowerCase() : ""))
        .some((field) => field.includes(searchTerm.toLowerCase())),
    );
    setFilteredQualifications(results);
  }, [searchTerm, qualifications]);
  return (
    <Container maxW="90%" py={6} mb={35}>
      <HStack mb={10} align={"center"}>
        <CreateQualModal />
        <Spacer />
        <Input
          m="auto"
          placeholder="Search..."
          maxWidth={200}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="md"
          flex="1"
        />
      </HStack>

      <Table variant="simple" mt={4} overflowX="auto">
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Qualificação</Th>
            <Th>Validade (Dias)</Th>
            <Th>Tipo Tripulante</Th>
            <Th>Grupo</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredQualifications.map((qual) => (
            <Tr key={qual.id}>
              <Td>{qual.id}</Td>
              <Td>{qual.nome}</Td>
              <Td>{qual.validade}</Td>
              <Td>{qual.tipo_aplicavel}</Td>
              <Td>{qual.grupo}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Container>
  );
}

export default QualificationManagement;

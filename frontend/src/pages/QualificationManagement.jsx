import { useState, useEffect } from "react";
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
  Box,
  useToast,
  Flex,
  Button,
} from "@chakra-ui/react";
import CreateQualModal from "../components/qualificationComponents/CreateQualModal";
import DeleteQualModal from "../components/qualificationComponents/DeleteQualModal";
import QualificationGroupFilter from "../components/qualificationComponents/QualificationGroupFilter";
import { apiAuth } from "../utils/api";
import { BiRefresh } from "react-icons/bi";

function QualificationManagement() {
  const [filteredQualifications, setFilteredQualifications] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const toast = useToast();
  // const { removeToken } = AuthContext();
  const getData = async () => {
    try {
      const res = await apiAuth.get("/v2/qualificacoes");
      setQualifications(res.data);

      // Extract unique groups from qualifications
      const groups = [
        ...new Set(res.data.map((qual) => qual.grupo).filter(Boolean)),
      ];
      const types = [
        ...new Set(res.data.map((qual) => qual.tipo_aplicavel).filter(Boolean)),
      ];
      setAvailableGroups(groups);
      setSelectedGroups(groups); // Select all groups by default
      setAvailableTypes(types);
      setSelectedTypes(types); // Select all types by default
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getData();
  }, []);
  // Filter qualifications based on search term and selected groups
  useEffect(() => {
    let results = qualifications;

    // Filter by selected groups
    if (selectedGroups.length > 0) {
      results = results.filter((qual) => selectedGroups.includes(qual.grupo));
    }
    // Filter by selected types
    if (selectedTypes.length > 0) {
      results = results.filter((qual) =>
        selectedTypes.includes(qual.tipo_aplicavel),
      );
    }

    // Filter by search term
    if (searchTerm) {
      results = results.filter((qual) =>
        [qual.nome, qual.validade, qual.tipo_aplicavel, qual.grupo]
          .map((field) => (field ? field.toString().toLowerCase() : ""))
          .some((field) => field.includes(searchTerm.toLowerCase())),
      );
    }

    setFilteredQualifications(results);
  }, [searchTerm, qualifications, selectedGroups, selectedTypes]);

  const handleReprocessAllFlights = async () => {
    setIsReprocessing(true);
    toast({
      title: "A reprocessar voos",
      description: "Por favor aguarde, isto pode demorar alguns minutos...",
      status: "info",
      duration: 10000,
      isClosable: true,
    });

    try {
      const res = await apiAuth.post("/flights/reprocess-all-qualifications");
      toast.closeAll();
      toast({
        title: "Sucesso!",
        description: res.data.message,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast.closeAll();
      toast({
        title: "Erro",
        description:
          error.response?.data?.message || "Erro ao reprocessar voos",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsReprocessing(false);
    }
  };

  return (
    <Container maxW="90%" py={6} mb={35}>
      <HStack mb={10} align={"center"}>
        <CreateQualModal setQualifications={setQualifications} />
        <Spacer />
        <Button
          leftIcon={<BiRefresh />}
          colorScheme="blue"
          onClick={handleReprocessAllFlights}
          isLoading={isReprocessing}
          loadingText="A processar..."
        >
          Reprocessar Todas as Qualificações
        </Button>
        <Input
          m="auto"
          placeholder="Search..."
          maxWidth={200}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="md"
          flex="1"
        />
      </HStack>

      <Flex mb={6} gap={4} direction={{ base: "column", md: "row" }}>
        <QualificationGroupFilter
          availableGroups={availableGroups}
          selectedGroups={selectedGroups}
          onGroupChange={setSelectedGroups}
        />
        <Spacer />
        <QualificationGroupFilter
          availableGroups={availableTypes}
          selectedGroups={selectedTypes}
          onGroupChange={setSelectedTypes}
          filter={"Posição"}
        />
      </Flex>

      <Table variant="simple" mt={4} overflowX="auto">
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Qualificação</Th>
            <Th>Validade (Dias)</Th>
            <Th>Tipo Tripulante</Th>
            <Th>Grupo</Th>
            <Th>Ações</Th>
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
              <Td>
                <Box gap={1} display={"flex"}>
                  <CreateQualModal
                    qualification={qual}
                    setQualifications={setQualifications}
                    edit={true}
                  />
                  <DeleteQualModal
                    qual={qual}
                    setQualifications={setQualifications}
                  />
                </Box>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Container>
  );
}

export default QualificationManagement;

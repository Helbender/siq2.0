import React, { useContext, useState, useEffect, useMemo } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useColorModeValue,
  Stack,
  useToast,
  Flex,
  Text,
} from "@chakra-ui/react";
import { AuthContext } from "../Contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { api } from "../utils/api";
import QualificationGroupFilter from "../components/qualificationComponents/QualificationGroupFilter";

const QualificationTable = ({ tipo }) => {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [filteredCrew, setFilteredCrew] = useState([]);
  const [crew, setCrew] = useState([]);
  const [sortBy, setSortBy] = useState(null); // { qualName: string, direction: 'asc' | 'desc' }
  const { token } = useContext(AuthContext);
  const location = useLocation();
  const toast = useToast();

  const getSavedCrew = async () => {
    toast({
      title: "A carregar Tripulantes",
      description: "Em processo.",
      status: "loading",
      duration: 5000,
      isClosable: true,
      position: "bottom",
    });
    try {
      const res = await api.get(
        `/v2/tripulantes/qualificacoes/${tipo.replace(" ", "_").replace("OPERAÇÕES", "OPERACOES")}`,
        {
          headers: { Authorization: "Bearer " + token },
        },
      );
      toast.closeAll();
      toast({
        title: "Tripulantes Carregados",
        description: `${res.data.length} Tripulantes carregados com sucesso.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setCrew(res.data || []);
      const types = [
        ...new Set(res.data.map((qual) => qual.position).filter(Boolean)),
      ];
      setAvailableTypes(types);
      setSelectedTypes(types); // Select all types by default
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getSavedCrew();
  }, [location, tipo]);

  // Filter crew by selected types
  useEffect(() => {
    let results = crew;

    // Filter by selected types
    if (selectedTypes.length > 0) {
      results = results.filter((member) =>
        selectedTypes.includes(member.position),
      );
    }

    setFilteredCrew(results);
  }, [crew, selectedTypes]);

  // Get all unique qualifications from all crew members
  const allQualifications = useMemo(() => {
    const qualSet = new Set();
    filteredCrew.forEach((member) => {
      if (member.qualificacoes) {
        member.qualificacoes.forEach((qual) => {
          qualSet.add(qual.nome);
        });
      }
    });
    return Array.from(qualSet).sort();
  }, [filteredCrew]);

  // Get days left for a specific qualification for a crew member
  const getDaysLeft = (member, qualName) => {
    const qual = member.qualificacoes?.find((q) => q.nome === qualName);
    if (!qual || !qual.validade_info) return null;
    return qual.validade_info[0]; // days_restantes
  };

  const emptyBg = useColorModeValue("gray.100", "gray.800");

  // Color formatter for days left (matching QualificationsPanel logic)
  const getColorForDays = (days) => {
    if (days === null || days === undefined) return emptyBg;
    if (days < 0) return "red.600";
    if (days < 10) return "yellow.400";
    return "green.400";
  };

  // Sort crew by qualification
  const sortedCrew = useMemo(() => {
    if (!sortBy) return filteredCrew;

    const sorted = [...filteredCrew].sort((a, b) => {
      const daysA = getDaysLeft(a, sortBy.qualName);
      const daysB = getDaysLeft(b, sortBy.qualName);

      // Handle null values (crew without this qualification)
      if (daysA === null && daysB === null) return 0;
      if (daysA === null) return 1; // Put nulls at the end
      if (daysB === null) return -1;

      if (sortBy.direction === "asc") {
        return daysA - daysB;
      } else {
        return daysB - daysA;
      }
    });

    return sorted;
  }, [filteredCrew, sortBy]);

  // Handle column header click for sorting
  const handleSort = (qualName) => {
    if (sortBy && sortBy.qualName === qualName) {
      // Toggle direction if clicking same column
      setSortBy({
        qualName,
        direction: sortBy.direction === "asc" ? "desc" : "asc",
      });
    } else {
      // New column, default to ascending (smallest first)
      setSortBy({ qualName, direction: "asc" });
    }
  };

  const cardBg = useColorModeValue("white", "gray.800");
  const headerBg = useColorModeValue("gray.200", "gray.700");

  return (
    <Stack m={4}>
      <Box ml={4} mb={6} alignSelf={"flex-start"}>
        <QualificationGroupFilter
          availableGroups={availableTypes}
          selectedGroups={selectedTypes}
          onGroupChange={setSelectedTypes}
        />
      </Box>

      <TableContainer
        bg={cardBg}
        borderRadius="lg"
        boxShadow="md"
        maxW="100%"
        overflowX="auto"
      >
        <Table size="sm" variant="simple">
          <Thead bg={headerBg}>
            <Tr>
              {/* <Th
                fontSize={"lg"}
                position="sticky"
                left={0}
                bg={headerBg}
                zIndex={2}
                minW="80px"
                borderRight="1px solid"
                borderColor={useColorModeValue("gray.300", "gray.600")}
              >
                NIP
              </Th> */}
              <Th
                fontSize={"lg"}
                position="sticky"
                left="0px"
                bg={headerBg}
                zIndex={2}
                minW="20px"
                maxW="30px"
                borderRight="1px solid"
                borderColor={useColorModeValue("gray.300", "gray.600")}
              >
                Posição
              </Th>
              <Th
                fontSize={"lg"}
                position="sticky"
                left="30px"
                bg={headerBg}
                zIndex={2}
                minW="30px"
                maxW="50px"
                borderRight="1px solid"
                borderColor={useColorModeValue("gray.300", "gray.600")}
              >
                Nome
              </Th>
              {allQualifications.map((qualName) => (
                <Th
                  key={qualName}
                  fontSize={"lg"}
                  textAlign="center"
                  cursor="pointer"
                  onClick={() => handleSort(qualName)}
                  _hover={{ bg: useColorModeValue("gray.300", "gray.600") }}
                  userSelect="none"
                  minW="120px"
                >
                  <Flex align="center" justify="center" gap={2}>
                    <Text fontSize="lg" isTruncated>
                      {qualName}
                    </Text>
                    {sortBy && sortBy.qualName === qualName && (
                      <Text fontSize="xs" fontWeight="bold">
                        {sortBy.direction === "asc" ? "↑" : "↓"}
                      </Text>
                    )}
                  </Flex>
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {sortedCrew.length === 0 ? (
              <Tr>
                <Td
                  colSpan={3 + allQualifications.length}
                  textAlign="center"
                  py={8}
                >
                  <Text>Nenhum tripulante encontrado</Text>
                </Td>
              </Tr>
            ) : (
              sortedCrew.map((member) => (
                <Tr
                  key={member.nip}
                  _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
                >
                  {/* <Td
                    position="sticky"
                    left={0}
                    bg={cardBg}
                    zIndex={1}
                    borderRight="1px solid"
                    borderColor={useColorModeValue("gray.300", "gray.600")}
                  >
                    {member.nip}
                  </Td> */}
                  <Td
                    position="sticky"
                    left="0px"
                    bg={cardBg}
                    zIndex={1}
                    borderRight="1px solid"
                    borderColor={useColorModeValue("gray.300", "gray.600")}
                  >
                    {member.position}
                  </Td>
                  <Td
                    position="sticky"
                    left="50px"
                    bg={cardBg}
                    zIndex={1}
                    borderRight="1px solid"
                    borderColor={useColorModeValue("gray.300", "gray.600")}
                  >
                    {member.name}
                  </Td>
                  {allQualifications.map((qualName) => {
                    const daysLeft = getDaysLeft(member, qualName);
                    return (
                      <Td
                        key={qualName}
                        textAlign="center"
                        bg={getColorForDays(daysLeft)}
                        fontWeight={
                          daysLeft !== null && daysLeft < 10 ? "bold" : "normal"
                        }
                        color={
                          daysLeft !== null && daysLeft < 10
                            ? "black"
                            : "inherit"
                        }
                      >
                        {daysLeft !== null ? daysLeft : "-"}
                      </Td>
                    );
                  })}
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default QualificationTable;

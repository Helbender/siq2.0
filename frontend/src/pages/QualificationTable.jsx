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
  Spacer,
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
  const [visibleGroups, setVisibleGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
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

  // Get all unique qualifications from all crew members with their groups
  const allQualifications = useMemo(() => {
    const qualMap = new Map(); // Map of qualName -> { nome, grupo }
    filteredCrew.forEach((member) => {
      if (member.qualificacoes) {
        member.qualificacoes.forEach((qual) => {
          if (!qualMap.has(qual.nome)) {
            qualMap.set(qual.nome, {
              nome: qual.nome,
              grupo: qual.grupo || "Ungrouped",
            });
          }
        });
      }
    });
    return Array.from(qualMap.values()).sort((a, b) => {
      // Sort by grupo first, then by nome
      const grupoCompare = a.grupo.localeCompare(b.grupo);
      if (grupoCompare !== 0) return grupoCompare;
      return a.nome.localeCompare(b.nome);
    });
  }, [filteredCrew]);

  // Group qualifications by grupo
  const qualificationsByGroup = useMemo(() => {
    const grouped = {};
    allQualifications.forEach((qual) => {
      const grupo = qual.grupo || "Ungrouped";
      if (!grouped[grupo]) {
        grouped[grupo] = [];
      }
      grouped[grupo].push(qual);
    });
    return grouped;
  }, [allQualifications]);

  // Initialize visible groups when qualificationsByGroup changes
  useEffect(() => {
    const groups = Object.keys(qualificationsByGroup);
    setAvailableGroups(groups);
    // Set all groups as visible by default if not already set
    if (groups.length > 0) {
      setVisibleGroups((prev) => {
        // Only update if we have new groups or if prev is empty
        if (prev.length === 0) {
          return groups;
        }
        // Keep existing visible groups that still exist, add new ones
        const existingGroups = prev.filter((g) => groups.includes(g));
        const newGroups = groups.filter((g) => !prev.includes(g));
        return [...existingGroups, ...newGroups];
      });
    }
  }, [qualificationsByGroup]);

  // Filter qualifications by visible groups
  const visibleQualificationsByGroup = useMemo(() => {
    const filtered = {};
    Object.entries(qualificationsByGroup).forEach(([grupo, quals]) => {
      if (visibleGroups.includes(grupo)) {
        filtered[grupo] = quals;
      }
    });
    return filtered;
  }, [qualificationsByGroup, visibleGroups]);

  // Get total count of visible qualifications for colspan calculation
  const visibleQualificationsCount = useMemo(() => {
    return Object.values(visibleQualificationsByGroup).reduce(
      (sum, quals) => sum + quals.length,
      0,
    );
  }, [visibleQualificationsByGroup]);

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
    <Stack m={4} pb={10}>
      <Flex ml={4} mb={6} gap={4} direction={{ base: "column", md: "row" }}>
        <Box alignSelf={"flex-start"}>
          <QualificationGroupFilter
            availableGroups={availableTypes}
            selectedGroups={selectedTypes}
            onGroupChange={setSelectedTypes}
            filter={"Função"}
          />
        </Box>
        <Spacer />
        <Box alignSelf={"flex-start"}>
          <QualificationGroupFilter
            availableGroups={availableGroups}
            selectedGroups={visibleGroups}
            onGroupChange={setVisibleGroups}
            filter={"Tipo"}
          />
        </Box>
      </Flex>

      <TableContainer
        bg={cardBg}
        borderRadius="lg"
        boxShadow="md"
        maxW="100%"
        overflowX="auto"
      >
        <Table size="sm" variant="simple">
          <Thead bg={headerBg}>
            {/* Group header row */}
            <Tr>
              <Th
                rowSpan={2}
                fontSize={"lg"}
                position="sticky"
                left="0px"
                bg={headerBg}
                zIndex={3}
                minW="20px"
                borderRight="1px solid"
                borderColor={useColorModeValue("gray.300", "gray.600")}
              >
                Posição
              </Th>
              <Th
                rowSpan={2}
                fontSize={"lg"}
                position="sticky"
                left="30px"
                bg={headerBg}
                zIndex={3}
                borderRight="1px solid"
                borderColor={useColorModeValue("gray.300", "gray.600")}
              >
                Nome
              </Th>
              {Object.entries(visibleQualificationsByGroup)
                .sort(([grupoA], [grupoB]) => grupoA.localeCompare(grupoB))
                .map(([grupo, quals]) => (
                  <Th
                    key={grupo}
                    colSpan={quals.length}
                    fontSize={"md"}
                    textAlign="center"
                    bg={useColorModeValue("gray.300", "gray.600")}
                    borderRight="1px solid"
                    borderColor={useColorModeValue("gray.400", "gray.500")}
                  >
                    <Text fontWeight="bold">{grupo}</Text>
                  </Th>
                ))}
            </Tr>
            {/* Qualification name row */}
            <Tr>
              {Object.entries(visibleQualificationsByGroup)
                .sort(([grupoA], [grupoB]) => grupoA.localeCompare(grupoB))
                .flatMap(([, quals]) =>
                  quals.map((qual) => (
                    <Th
                      key={qual.nome}
                      fontSize={"lg"}
                      textAlign="center"
                      cursor="pointer"
                      onClick={() => handleSort(qual.nome)}
                      _hover={{ bg: useColorModeValue("gray.300", "gray.600") }}
                      userSelect="none"
                      minW="20px"
                      borderRight="1px solid"
                      borderColor={useColorModeValue("gray.300", "gray.600")}
                      borderRightWidth={
                        quals[quals.length - 1] === qual ? "2px" : "1px"
                      }
                    >
                      <Flex align="center" justify="center" gap={2}>
                        <Text fontSize="lg" isTruncated>
                          {qual.nome}
                        </Text>
                        {sortBy && sortBy.qualName === qual.nome && (
                          <Text fontSize="xs" fontWeight="bold">
                            {sortBy.direction === "asc" ? "↑" : "↓"}
                          </Text>
                        )}
                      </Flex>
                    </Th>
                  )),
                )}
            </Tr>
          </Thead>
          <Tbody>
            {sortedCrew.length === 0 ? (
              <Tr>
                <Td
                  colSpan={2 + visibleQualificationsCount}
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
                    left="30px"
                    bg={cardBg}
                    zIndex={1}
                    borderRight="1px solid"
                    borderColor={useColorModeValue("gray.300", "gray.600")}
                    width="200px"
                    isTruncated
                  >
                    {member.name?.trim() || member.name}
                  </Td>
                  {Object.entries(visibleQualificationsByGroup)
                    .sort(([grupoA], [grupoB]) => grupoA.localeCompare(grupoB))
                    .flatMap(([, quals]) =>
                      quals.map((qual) => {
                        const daysLeft = getDaysLeft(member, qual.nome);
                        return (
                          <Td
                            key={qual.nome}
                            textAlign="center"
                            bg={getColorForDays(daysLeft)}
                            fontWeight={
                              daysLeft !== null && daysLeft < 10
                                ? "bold"
                                : "normal"
                            }
                            color={
                              daysLeft !== null && daysLeft < 10
                                ? "black"
                                : "inherit"
                            }
                            borderRight="1px solid"
                            borderColor={useColorModeValue(
                              "gray.300",
                              "gray.600",
                            )}
                            borderRightWidth={
                              quals[quals.length - 1] === qual ? "2px" : "1px"
                            }
                          >
                            {daysLeft !== null ? daysLeft : "-"}
                          </Td>
                        );
                      }),
                    )}
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

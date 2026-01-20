import { http } from "@/api/http";
import { useCrewTypes } from "@/common/CrewTypesProvider";
import { useToast } from "@/utils/useToast";
import {
    Box,
    Flex,
    SegmentGroup,
    Stack,
    Table,
    Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";

export function QualificationTablePage({ tipo: initialTipo }) {
  const { TipoTripulante, getCrewTypeOptions, crewTypeToApiFormat } = useCrewTypes();
  const [selectedTipo, setSelectedTipo] = useState(initialTipo || TipoTripulante.PILOTO);
  const [selectedFuncao, setSelectedFuncao] = useState(null);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [filteredCrew, setFilteredCrew] = useState([]);
  const [crew, setCrew] = useState([]);
  const [sortBy, setSortBy] = useState(null); // { qualName: string, direction: 'asc' | 'desc' }
  const [visibleGroup, setVisibleGroup] = useState(null);
  const [availableGroups, setAvailableGroups] = useState([]);
  const toast = useToast();

  const getSavedCrew = async () => {
    if (!selectedTipo) return;
    
    toast({
      title: "A carregar Tripulantes",
      description: "Em processo.",
      status: "loading",
      duration: 5000,
      isClosable: true,
      position: "bottom",
    });
    try {
      const tipoForApi = crewTypeToApiFormat(selectedTipo);
      const res = await http.get(
        `/v2/tripulantes/qualificacoes/${tipoForApi}`,
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
      ].sort();
      setAvailableTypes(types);
      // Select first type by default
      if (types.length > 0) {
        setSelectedFuncao(types[0]);
      } else {
        setSelectedFuncao(null);
      }
    } catch (error) {
      console.log(error);
      toast.closeAll();
    }
  };

  useEffect(() => {
    getSavedCrew();
  }, [selectedTipo]);

  // Filter crew by selected função
  useEffect(() => {
    let results = crew;

    // Filter by selected função
    if (selectedFuncao) {
      results = results.filter((member) => member.position === selectedFuncao);
    }

    setFilteredCrew(results);
  }, [crew, selectedFuncao]);

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
    const groups = Object.keys(qualificationsByGroup).sort();
    setAvailableGroups(groups);
    // Set first group as visible by default if not already set
    if (groups.length > 0 && !visibleGroup) {
      setVisibleGroup(groups[0]);
    }
  }, [qualificationsByGroup, visibleGroup]);

  // Filter qualifications by visible group
  const visibleQualificationsByGroup = useMemo(() => {
    const filtered = {};
    if (visibleGroup && qualificationsByGroup[visibleGroup]) {
      filtered[visibleGroup] = qualificationsByGroup[visibleGroup];
    }
    return filtered;
  }, [qualificationsByGroup, visibleGroup]);

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

  // Color formatter for days left (matching QualificationsPanel logic)
  const getColorForDays = (days) => {
    if (days === null || days === undefined) return "bg.muted";
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

  return (
    <Stack m={4} pb={10}>
      <Box ml={4} mb={6}>
        <Text fontWeight="bold" mb={3} fontSize="md" color="text.secondary">
          Tipo de Tripulante
        </Text>
        <SegmentGroup.Root
          value={selectedTipo}
          onValueChange={(details) => setSelectedTipo(details.value)}
          size="md"
          css={{
            "--segment-indicator-bg": "colors.teal.500",
            "& [data-selected]": {
              bg: "teal.500",
              color: "white",
            },
          }}
        >
          <SegmentGroup.Items items={getCrewTypeOptions()} />
          <SegmentGroup.Indicator />
        </SegmentGroup.Root>
      </Box>
      {availableTypes.length > 0 && (
        <Box ml={4} mb={6}>
          <Text fontWeight="bold" mb={3} fontSize="md" color="text.secondary">
            Função
          </Text>
          <SegmentGroup.Root
            value={selectedFuncao || ""}
            onValueChange={(details) => setSelectedFuncao(details.value)}
            size="md"
            css={{
              "--segment-indicator-bg": "colors.teal.500",
              "& [data-selected]": {
                bg: "teal.500",
                color: "white",
              },
            }}
          >
            <SegmentGroup.Items
              items={availableTypes.map((type) => ({
                value: type,
                label: type,
              }))}
            />
            <SegmentGroup.Indicator />
          </SegmentGroup.Root>
        </Box>
      )}
      {availableGroups.length > 0 && (
        <Box ml={4} mb={6}>
          <Text fontWeight="bold" mb={3} fontSize="md" color="text.secondary">
            Tipo
          </Text>
          <SegmentGroup.Root
            value={visibleGroup || ""}
            onValueChange={(details) => setVisibleGroup(details.value)}
            size="md"
            css={{
              "--segment-indicator-bg": "colors.teal.500",
              "& [data-selected]": {
                bg: "teal.500",
                color: "white",
              },
            }}
          >
            <SegmentGroup.Items
              items={availableGroups.map((group) => ({
                value: group,
                label: group,
              }))}
            />
            <SegmentGroup.Indicator />
          </SegmentGroup.Root>
        </Box>
      )}

      <Box
        bg="bg.card"
        borderRadius="lg"
        boxShadow="md"
        maxW="100%"
        overflowX="auto"
      >
        <Table.Root size="sm" variant="simple">
          <Table.Header bg="bg.muted">
            {/* Group header row */}
            <Table.Row>
              <Table.ColumnHeader
                rowSpan={2}
                fontSize={"lg"}
                position="sticky"
                left="0px"
                bg="bg.muted"
                zIndex={3}
                minW="20px"
                borderRight="1px solid"
                borderColor="border.muted"
              >
                Posição
              </Table.ColumnHeader>
              <Table.ColumnHeader
                rowSpan={2}
                fontSize={"lg"}
                position="sticky"
                left="30px"
                bg="bg.muted"
                zIndex={3}
                borderRight="1px solid"
                borderColor="border.muted"
              >
                Nome
              </Table.ColumnHeader>
              {Object.entries(visibleQualificationsByGroup)
                .sort(([grupoA], [grupoB]) => grupoA.localeCompare(grupoB))
                .map(([grupo, quals]) => (
                  <Table.ColumnHeader
                    key={grupo}
                    colSpan={quals.length}
                    fontSize={"md"}
                    textAlign="center"
                    bg="bg.card-muted"
                    borderRight="1px solid"
                    borderColor="border.strong"
                  >
                    <Text fontWeight="bold">{grupo}</Text>
                  </Table.ColumnHeader>
                ))}
            </Table.Row>
            {/* Qualification name row */}
            <Table.Row>
              {Object.entries(visibleQualificationsByGroup)
                .sort(([grupoA], [grupoB]) => grupoA.localeCompare(grupoB))
                .flatMap(([, quals]) =>
                  quals.map((qual) => (
                    <Table.ColumnHeader
                      key={qual.nome}
                      fontSize={"lg"}
                      textAlign="center"
                      cursor="pointer"
                      onClick={() => handleSort(qual.nome)}
                      _hover={{ bg: "bg.card-muted" }}
                      userSelect="none"
                      minW="20px"
                      borderRight="1px solid"
                      borderColor="border.muted"
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
                    </Table.ColumnHeader>
                  )),
                )}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sortedCrew.length === 0 ? (
              <Table.Row>
                <Table.Cell
                  colSpan={2 + visibleQualificationsCount}
                  textAlign="center"
                  py={8}
                >
                  <Text>Nenhum tripulante encontrado</Text>
                </Table.Cell>
              </Table.Row>
            ) : (
              sortedCrew.map((member) => (
                <Table.Row
                  key={member.nip}
                  _hover={{ bg: "bg.muted" }}
                >
                  <Table.Cell
                    position="sticky"
                    left="0px"
                    bg="bg.card"
                    zIndex={1}
                    borderRight="1px solid"
                    borderColor="border.muted"
                  >
                    {member.position}
                  </Table.Cell>
                  <Table.Cell
                    position="sticky"
                    left="30px"
                    bg="bg.card"
                    zIndex={1}
                    borderRight="1px solid"
                    borderColor="border.muted"
                    width="200px"
                    isTruncated
                  >
                    {member.name?.trim() || member.name}
                  </Table.Cell>
                  {Object.entries(visibleQualificationsByGroup)
                    .sort(([grupoA], [grupoB]) => grupoA.localeCompare(grupoB))
                    .flatMap(([, quals]) =>
                      quals.map((qual) => {
                        const daysLeft = getDaysLeft(member, qual.nome);
                        return (
                          <Table.Cell
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
                                ? "text.primary"
                                : "text.primary"
                            }
                            borderRight="1px solid"
                            borderColor="border.muted"
                            borderRightWidth={
                              quals[quals.length - 1] === qual ? "2px" : "1px"
                            }
                          >
                            {daysLeft !== null ? daysLeft : "-"}
                          </Table.Cell>
                        );
                      }),
                    )}
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </Box>
    </Stack>
  );
}

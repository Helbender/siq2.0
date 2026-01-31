import {
  Box,
  Center,
  Checkbox,
  Flex,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";

export function QualificationTablePage({ pilotos = [], loading }) {
  const [sortBy, setSortBy] = useState(null); // { qualName: string, direction: 'asc' | 'desc' }
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);

  // Get all unique qualifications from all crew members with their groups
  const allQualifications = useMemo(() => {
    const qualMap = new Map(); // Map of qualName -> { nome, grupo }
    pilotos.forEach((member) => {
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
  }, [pilotos]);

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

  // Initialize selected groups when qualificationsByGroup changes
  useEffect(() => {
    const groups = Object.keys(qualificationsByGroup).sort();
    setAvailableGroups(groups);
    // Select all groups by default if none selected
    if (groups.length > 0 && selectedGroups.length === 0) {
      setSelectedGroups(groups);
    }
  }, [qualificationsByGroup, selectedGroups.length]);

  // Filter qualifications by selected groups
  const visibleQualificationsByGroup = useMemo(() => {
    const filtered = {};
    selectedGroups.forEach((group) => {
      if (qualificationsByGroup[group]) {
        filtered[group] = qualificationsByGroup[group];
      }
    });
    return filtered;
  }, [qualificationsByGroup, selectedGroups]);

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
    if (!sortBy) return pilotos;

    const sorted = [...pilotos].sort((a, b) => {
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
  }, [pilotos, sortBy]);

  // Early returns after all hooks
  if (loading) {
    return (
      <Center py="10">
        <Spinner size="lg" />
      </Center>
    );
  }

  if (!pilotos || !pilotos.length) {
    return (
      <Center py="10">
        <Text opacity={0.6}>Sem dados</Text>
      </Center>
    );
  }

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

  const handleToggleGroup = (group) => {
    if (selectedGroups.includes(group)) {
      setSelectedGroups(selectedGroups.filter((g) => g !== group));
    } else {
      setSelectedGroups([...selectedGroups, group]);
    }
  };

  const handleSelectAll = () => {
    if (selectedGroups.length === availableGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups([...availableGroups]);
    }
  };

  const allSelected = availableGroups.length > 0 && selectedGroups.length === availableGroups.length;
  const isIndeterminate = selectedGroups.length > 0 && !allSelected;

  return (
    <Stack m={4} pb={10}>
      {/* Qualification Group Filter */}
      {availableGroups.length > 0 && (
        <Box ml={4} mb={6}>
          <Text fontWeight="bold" mb={3} fontSize="md" color="text.secondary">
            Tipo
          </Text>
          <Box
            p={4}
            bg="bg.cardSubtle"
            borderRadius="md"
            border="1px solid"
            borderColor="border.muted"
            boxShadow="sm"
            maxW="fit-content"
          >
            <Flex gap={4} direction="row" wrap="wrap">
              <Checkbox.Root
                checked={allSelected}
                {...(isIndeterminate && { indeterminate: true })}
                onCheckedChange={handleSelectAll}
                colorPalette="teal"
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Label>
                  <Text fontSize="sm">Todos</Text>
                </Checkbox.Label>
              </Checkbox.Root>
              {availableGroups.map((group) => (
                <Checkbox.Root
                  key={group}
                  checked={selectedGroups.includes(group)}
                  onCheckedChange={() => handleToggleGroup(group)}
                  colorPalette="teal"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label>
                    <Text fontSize="sm">{group}</Text>
                  </Checkbox.Label>
                </Checkbox.Root>
              ))}
            </Flex>
          </Box>
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
                w="fit-content"
                whiteSpace="nowrap"
                borderRight="1px solid"
                borderColor="border.muted"
              >
                Posição
              </Table.ColumnHeader>
              <Table.ColumnHeader
                rowSpan={2}
                fontSize={"lg"}
                position="sticky"
                left="80px"
                bg="bg.muted"
                zIndex={3}
                w="fit-content"
                maxW="200px"
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
                    w="fit-content"
                    whiteSpace="nowrap"
                    borderRight="1px solid"
                    borderColor="border.muted"
                  >
                    {member.position}
                  </Table.Cell>
                  <Table.Cell
                    position="sticky"
                    left="80px"
                    bg="bg.card"
                    zIndex={1}
                    w="fit-content"
                    maxW="200px"
                    borderRight="1px solid"
                    borderColor="border.muted"
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
                            color={getColorForDays(daysLeft) === "red.600" ? "white" : "black"}
                              // daysLeft !== null && daysLeft < 10
                              //   ? "text.primary"
                              //   : "text.primary"
                            
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

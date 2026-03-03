import { Can } from "@/common/components/Can";
import { Role } from "@/common/roles";
import {
  Box,
  Button,
  Center,
  Flex,
  Input,
  Spinner,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { useFlightsByCrewSearch } from "../hooks/useFlightsByCrewSearch";

export function FlightsByCrewSearchPage() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  const { data: rows = [], refetch, isFetching, error, isFetched } = useFlightsByCrewSearch({
    search,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const handleSearch = () => {
    setValidationMessage("");
    const trimmed = search.trim();
    if (!trimmed) {
      setValidationMessage("Introduza um nome ou NIP para pesquisar.");
      return;
    }
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setValidationMessage("A data de início deve ser anterior ou igual à data de fim.");
      return;
    }
    refetch();
  };

  return (
    <Can
      minLevel={Role.READONLY}
      fallback={
        <Center h="80vh">
          <VStack>
            <Text fontSize="xl" fontWeight="bold" color="text.secondary">
              Acesso Negado
            </Text>
            <Text mt={2} color="text.muted">
              Você precisa ter nível READONLY ou superior para visualizar esta página.
            </Text>
          </VStack>
        </Center>
      }
    >
      <VStack mt={10} spacing={6} align="stretch" maxW="900px" mx="auto" px={4}>
        <Text fontSize="xl" fontWeight="semibold">
          Pesquisar voos por tripulante
        </Text>

        <Flex gap={4} flexWrap="wrap" align="flex-end">
          <Box flex="1" minW="200px">
            <Text mb={1} fontSize="sm" color="text.muted">
              Nome ou NIP
            </Text>
            <Input
              placeholder="Nome ou NIP do tripulante"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              borderRadius="md"
              border="1px solid"
              borderColor="border.subtle"
              bg="gray.700"
              _hover={{ borderColor: "teal.500" }}
              _focus={{ borderColor: "teal.500", border: "1px solid" }}
            />
          </Box>
          <Box>
            <Text mb={1} fontSize="sm" color="text.muted">
              Data de início
            </Text>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              borderRadius="md"
              border="1px solid"
              borderColor="border.subtle"
              bg="gray.700"
              _hover={{ borderColor: "teal.500" }}
              _focus={{ borderColor: "teal.500", border: "1px solid" }}
            />
          </Box>
          <Box>
            <Text mb={1} fontSize="sm" color="text.muted">
              Data de fim
            </Text>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              borderRadius="md"
              border="1px solid"
              borderColor="border.subtle"
              bg="gray.700"
              _hover={{ borderColor: "teal.500" }}
              _focus={{ borderColor: "teal.500", border: "1px solid" }}
            />
          </Box>
          <Button
            colorPalette="teal"
            onClick={handleSearch}
            disabled={isFetching}
            loading={isFetching}
          >
            Pesquisar
          </Button>
        </Flex>

        {validationMessage && (
          <Text color="orange.400" fontSize="sm">
            {validationMessage}
          </Text>
        )}

        {error && (
          <Text color="red.400" fontSize="sm">
            {error?.response?.data?.message ?? error?.message ?? "Erro ao pesquisar."}
          </Text>
        )}

        {isFetching && (
          <Center py={8}>
            <Spinner size="lg" />
          </Center>
        )}

        {isFetched && !isFetching && (
          <>
            <Text fontSize="sm" color="text.muted">
              {rows.length} resultado(s) encontrado(s).
            </Text>
            {rows.length > 0 ? (
              <Box overflowX="auto" w="100%">
                <Table.Root size="sm" >
                  <Table.Header>
                    <Table.Row>
                      {/* <Table.ColumnHeader>Tripulante</Table.ColumnHeader>
                      <Table.ColumnHeader>NIP</Table.ColumnHeader>
                      <Table.ColumnHeader>Posto</Table.ColumnHeader> */}
                      <Table.ColumnHeader>Posição</Table.ColumnHeader>
                      <Table.ColumnHeader>ATR</Table.ColumnHeader>
                      <Table.ColumnHeader>ATN</Table.ColumnHeader>
                      <Table.ColumnHeader>Prec.App</Table.ColumnHeader>
                      <Table.ColumnHeader>N.Prec.App</Table.ColumnHeader>
                      <Table.ColumnHeader>ID Voo</Table.ColumnHeader>
                      <Table.ColumnHeader>Airtask</Table.ColumnHeader>
                      <Table.ColumnHeader>Data</Table.ColumnHeader>
                      <Table.ColumnHeader>Qualificações</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {rows.map((row, idx) => (
                      <Table.Row key={`${row.flightId}-${row.nip}-${idx}`} _hover={{ bg: "bg.cardSubtle" }}>
                        {/* <Table.Cell>{row.name}</Table.Cell>
                        <Table.Cell>{row.nip}</Table.Cell>
                        <Table.Cell>{row.rank ?? "-"}</Table.Cell> */}
                        <Table.Cell>{row.position ?? "-"}</Table.Cell>
                        <Table.Cell>{row.ATR ?? "-"}</Table.Cell>
                        <Table.Cell>{row.ATN ?? "-"}</Table.Cell>
                        <Table.Cell>{row.precapp ?? "-"}</Table.Cell>
                        <Table.Cell>{row.nprecapp ?? "-"}</Table.Cell>
                        <Table.Cell>{row.flightId}</Table.Cell>
                        <Table.Cell>{row.airtask}</Table.Cell>
                        <Table.Cell>{row.date}</Table.Cell>
                        <Table.Cell>
                          {[row.QUAL1, row.QUAL2, row.QUAL3, row.QUAL4, row.QUAL5, row.QUAL6]
                            .filter(Boolean)
                            .join(", ") || "-"}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            ) : (
              <Text color="text.muted">Nenhum voo encontrado para os critérios indicados.</Text>
            )}
          </>
        )}
      </VStack>
    </Can>
  );
}

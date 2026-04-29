import { Can } from "@/shared/components/Can";
import { StyledText } from "@/shared/components/StyledText";
import { Role } from "@/shared/roles";
import {
  Box,
  Button,
  Center,
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
  Flex,
  Grid,
  HStack,
  Input,
  Spacer,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { List } from "react-window";
import { FlightCard } from "../components/FlightCard";
import { CreateFlightModal } from "../components/modals/CreateFlightModal";
import { useFlights } from "../hooks/useFlights";

const EMPTY_FORM = {
  airtask: "",
  tailNumber: "",
  action: "",
  atd: "",
  dateFrom: "",
  dateTo: "",
};

function Row({ index, style, flights }) {
  const flight = flights[index];
  if (!flight) return null;
  return (
    <Box
      style={{
        ...style,
        paddingLeft: "10%",
        paddingRight: "10%",
        paddingBottom: "16px",
      }}
    >
      <FlightCard flight={flight} />
    </Box>
  );
}

export function FlightsPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [params, setParams] = useState({});
  const { data: flights = [], isLoading } = useFlights(params);
  const [listHeight, setListHeight] = useState(600);
  const containerRef = useRef(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setListHeight(containerRef.current.offsetHeight);
      } else if (typeof window !== "undefined") {
        setListHeight(window.innerHeight - 200);
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSearch = () => {
    setParams({
      airtask: form.airtask.trim() || undefined,
      tailNumber: form.tailNumber.trim() || undefined,
      action: form.action.trim() || undefined,
      atd: form.atd.trim() || undefined,
      dateFrom: form.dateFrom || undefined,
      dateTo: form.dateTo || undefined,
    });
  };

  const handleClear = () => {
    setForm(EMPTY_FORM);
    setParams({});
  };

  const hasActiveFilters = Object.values(params).some(Boolean);

  if (isLoading) {
    return (
      <Center h="80vh">
        <Spinner size="xl" />
      </Center>
    );
  }

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
              Você precisa ter nível READONLY ou superior para visualizar voos.
            </Text>
          </VStack>
        </Center>
      }
    >
      <VStack mt={10} gap={0}>
        {/* CollapsibleRoot wraps header bar + panel so content renders below the Flex */}
        <CollapsibleRoot w="80%" maxW="1000px" mb={4}>
          {/* Header bar */}
          <Flex align="center" mb={0}>
            <StyledText query="Voos:" text={`Voos: ${flights.length}`} />
            <Spacer />
            <Can minLevel={Role.FLYERS}>
              <CreateFlightModal />
            </Can>
            <Spacer />
            <CollapsibleTrigger asChild>
              <Button
                size="sm"
                variant={hasActiveFilters ? "solid" : "outline"}
                colorPalette={hasActiveFilters ? "blue" : "gray"}
              >
                Filtros{hasActiveFilters ? " ●" : ""}
              </Button>
            </CollapsibleTrigger>
          </Flex>

          {/* Filter panel — below the header bar */}
          <CollapsibleContent>
            <Box
              mt={3}
              p={4}
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="md"
              bg="bg.card"
            >
              <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                <Box>
                  <Text fontSize="xs" color="text.muted" mb={1}>
                    Airtask
                  </Text>
                  <Input
                    size="sm"
                    placeholder="ex: 00X0000"
                    value={form.airtask}
                    onChange={set("airtask")}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" color="text.muted" mb={1}>
                    Nº de cauda
                  </Text>
                  <Input
                    size="sm"
                    placeholder="ex: 16801"
                    value={form.tailNumber}
                    onChange={set("tailNumber")}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" color="text.muted" mb={1}>
                    Ação
                  </Text>
                  <Input
                    size="sm"
                    placeholder="ex: LOC"
                    value={form.action}
                    onChange={set("action")}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" color="text.muted" mb={1}>
                    Hora de descolagem (ATD)
                  </Text>
                  <Input
                    size="sm"
                    placeholder="ex: 10:30"
                    value={form.atd}
                    onChange={set("atd")}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" color="text.muted" mb={1}>
                    Data — de
                  </Text>
                  <Input
                    size="sm"
                    type="date"
                    value={form.dateFrom}
                    onChange={set("dateFrom")}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" color="text.muted" mb={1}>
                    Data — até
                  </Text>
                  <Input
                    size="sm"
                    type="date"
                    value={form.dateTo}
                    onChange={set("dateTo")}
                  />
                </Box>
              </Grid>
              <HStack mt={4} justify="flex-end" gap={2}>
                <Button size="sm" variant="ghost" onClick={handleClear}>
                  Limpar
                </Button>
                <Button size="sm" colorPalette="blue" onClick={handleSearch}>
                  Pesquisar
                </Button>
              </HStack>
            </Box>
          </CollapsibleContent>
        </CollapsibleRoot>

        {/* Flight list */}
        <Box ref={containerRef} w="80%" h="calc(100vh - 200px)">
          {flights.length > 0 && listHeight > 0 && (
            <List
              height={listHeight}
              rowCount={flights.length}
              rowHeight={650}
              rowComponent={Row}
              rowProps={{ flights }}
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </Box>
      </VStack>
    </Can>
  );
}

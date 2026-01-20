import { Can } from "@/common/components/Can";
import { Role } from "@/common/roles";
import { StyledText } from "@/common/components/StyledText";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { formatDate } from "@/utils/timeCalc";
import {
  Box,
  Center,
  Flex,
  Input,
  Spacer,
  Spinner,
  Text,
  VStack
} from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { List } from "react-window";
import { FlightCard } from "../components/FlightCard";
import { CreateFlightModal } from "../components/modals/CreateFlightModal";
import { useFlights } from "../hooks/useFlights";
function Row({ index, style, flights }) {
  const flight = flights[index];
  if (!flight) return null;
  return (
    <Box style={{ ...style, paddingLeft: "10%", paddingRight: "10%", paddingBottom: "16px" }}>
      <FlightCard flight={flight} />
    </Box>
  );
}

export function FlightsPage() {
  const { data: flights = [], isLoading } = useFlights();
  const [search, setSearch] = useState("");
  const [listHeight, setListHeight] = useState(600);
  const containerRef = useRef(null);
  const { user } = useAuth();

  const filteredFlights = useMemo(() => {
    return flights.filter((flight) =>
      [
        flight.airtask,
        flight.flightType,
        flight.flightAction,
        formatDate(flight.date),
        flight.tailNumber,
        flight.id,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [flights, search]);

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
      <VStack mt={10}>
        <Flex w="80%" maxW="1000px" align="center">
          <StyledText query="Voos:" text={`Voos: ${filteredFlights.length}`} />
          <Spacer />
          <Can minLevel={Role.FLYERS}>
            <CreateFlightModal />
          </Can>
          <Spacer />
          <Input
            borderRadius={"md"}
            border="1px solid"
            borderColor="border.subtle"
            bg="gray.700"
            _hover={{borderColor:"teal.500"}}
            _focus={{borderColor:"teal.500",border:"1px solid"}}
            maxW="150px"
            placeholder="Procurar…"
            onChange={(e) => setSearch(e.target.value)}
          />
        </Flex>

        <Box ref={containerRef} w="80%" h="calc(100vh - 200px)">
          {filteredFlights.length > 0 && listHeight > 0 && (
            <List
              height={listHeight}
              rowCount={filteredFlights.length}
              rowHeight={650}
              rowComponent={Row}
              rowProps={{ flights: filteredFlights }}
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </Box>
      </VStack>
    </Can>
  );
}

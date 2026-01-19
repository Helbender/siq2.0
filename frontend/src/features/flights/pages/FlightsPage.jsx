import { useAuth } from "@/features/auth/hooks/useAuth";
import { StyledText } from "@/features/shared/components/StyledText";
import { formatDate } from "@/utils/timeCalc";
import {
  Center,
  Flex,
  Input,
  Spacer,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { FlightCard } from "../components/FlightCard";
import { CreateFlightModal } from "../components/modals/CreateFlightModal";
import { useFlights } from "../hooks/useFlights";

export function FlightsPage() {
  const { data: flights = [], isLoading } = useFlights();
  const [search, setSearch] = useState("");
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

  if (isLoading) {
    return (
      <Center h="80vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <VStack mt={10}>
      <Flex w="80%" maxW="1000px" align="center">
        <StyledText query="Voos:" text={flights.length} />
        <Spacer />
        {user?.admin && <CreateFlightModal />}
        <Input
          maxW="150px"
          placeholder="Procurar…"
          onChange={(e) => setSearch(e.target.value)}
        />
      </Flex>

      <VStack w="80%" spacing={4}>
        {filteredFlights.map((flight) => (
          <FlightCard key={flight.id} flight={flight} />
        ))}
      </VStack>
    </VStack>
  );
}

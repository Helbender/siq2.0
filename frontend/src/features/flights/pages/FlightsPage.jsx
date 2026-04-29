import { Can } from "@/shared/components/Can";
import { StyledText } from "@/shared/components/StyledText";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Role } from "@/shared/roles";
import {
  Box,
  Center,
  Flex,
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
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const { data: flights = [], isLoading } = useFlights({
    q: debouncedSearch || undefined,
  });
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
          <StyledText query="Voos:" text={`Voos: ${flights.length}`} />
          <Spacer />
          <Can minLevel={Role.FLYERS}>
            <CreateFlightModal />
          </Can>
          <Spacer />
          <Input
            borderRadius={"md"}
            border="1px solid"
            borderColor="border.subtle"
            maxW="150px"
            placeholder="Procurar…"
            onChange={(e) => setSearch(e.target.value)}
          />
        </Flex>

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

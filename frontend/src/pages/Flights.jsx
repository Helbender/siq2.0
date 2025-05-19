import React from "react";
import {
  Stack,
  FormControl,
  Input,
  VStack,
  Flex,
  Spacer,
  Center,
  Spinner,
  useBreakpointValue,
} from "@chakra-ui/react";
import FlightCard from "../components/flightComponents/FlightCard";
import CreateFlightModal from "../components/flightComponents/CreateFlightModal";
import { useContext, useEffect, useState } from "react";
import { FlightContext } from "../Contexts/FlightsContext";
import { AuthContext } from "../Contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import StyledText from "../components/styledcomponents/StyledText";

export default function Flights() {
  const isColumn = useBreakpointValue({ base: true, lg: false });
  const [filteredFlights, setFilteredFlights] = useState([]);
  const { flights, loading } = useContext(FlightContext);
  const [searchTerm, setSearchTerm] = useState("");
  const { token, removeToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const showed = 20;

  useEffect(() => {
    const results = flights.filter((flight) =>
      [
        flight.airtask,
        flight.flightType,
        flight.flightAction,
        flight.date,
        flight.origin,
        flight.destination,
        flight.tailNumber,
        flight.id,
      ]
        .map((field) => (field ? field.toString().toLowerCase() : ""))
        .some((field) => field.includes(searchTerm.toLowerCase())),
    );
    setFilteredFlights(results);
  }, [searchTerm, flights]);

  useEffect(() => {
    if (!token && token !== "" && token !== undefined) {
      console.log("Removing Token");
      removeToken();
      navigate("/");
    }
  }, []);
  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
      </Center>
    );
  }
  return (
    <VStack mt={10}>
      <Flex w={"80%"} maxW={"1000px"} alignItems={"center"} flex={"row"}>
        {isColumn ? null : (
          <StyledText
            query={"Número de Voos:"}
            text={`Número de Voos: ${flights.length}`}
          />
        )}
        <Spacer />
        <CreateFlightModal />
        <FormControl textAlign={"center"} ml={5} maxW="130px">
          <Input
            placeholder="Procurar..."
            textAlign={"center"}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </FormControl>
        <Spacer />
        {isColumn ? null : (
          <StyledText
            query={["Mostrados:", "Encontrados"]}
            text={`Mostrados: ${filteredFlights.length >= showed ? showed : filteredFlights.length} / ${filteredFlights.length} Encontrados`}
          />
        )}
      </Flex>
      <Stack
        gap={5}
        mt="8"
        overflowY="scroll"
        w={"95%"}
        maxW={"1200px"}
        h={"80vh"}
        p={2}
      >
        {filteredFlights.length
          ? // !!filteredFlights.length &&
            filteredFlights
              .slice(0, showed)
              .map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  setFilteredFlights={setFilteredFlights}
                />
              ))
          : null}
      </Stack>
    </VStack>
  );
}

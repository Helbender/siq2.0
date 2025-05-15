import React from "react";
import {
  Stack,
  FormControl,
  Input,
  Text,
  VStack,
  Flex,
  Spacer,
  useColorModeValue,
  Center,
  Spinner,
  useBreakpointValue,
} from "@chakra-ui/react";
import FlightCard from "../components/flightComponents/FlightCard";
// const FlightCard = React.lazy(
//   () => import("../components/flightComponents/FlightCard"),
// );
import CreateFlightModal from "../components/flightComponents/CreateFlightModal";
import { useContext, useEffect, useState } from "react";
import { FlightContext } from "../Contexts/FlightsContext";
import { AuthContext } from "../Contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import StyledText from "../components/styledcomponents/StyledText";

export default function Flights() {
  const { flights, loading } = useContext(FlightContext);
  const [filteredFlights, setFilteredFlights] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const isColumn = useBreakpointValue({ base: true, lg: false });
  useColorModeValue();
  const { token, removeToken } = useContext(AuthContext);

  useEffect(() => {
    if (!token && token !== "" && token !== undefined) {
      console.log("Removing Token");
      removeToken();
      navigate("/");
    }
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
        {/* <Text ml={10}>{`Numero de Voos: ${flights.length}`}</Text> */}
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

        {/* <Text mr={10}>{`Voos filtrados: ${filteredFlights.length}`}</Text> */}
        <StyledText
          query={"Voos filtrados:"}
          text={`Voos filtrados: ${filteredFlights.length}`}
        />
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
          ? !!filteredFlights.length &&
            filteredFlights
              .slice(0, 10)
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

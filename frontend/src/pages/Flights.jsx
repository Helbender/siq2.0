import React, { useMemo } from "react";
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
  Heading,
  Box,
} from "@chakra-ui/react";
import FlightCard from "../components/flightComponents/FlightCard";
import CreateFlightModal from "../components/flightComponents/CreateFlightModal";
import { useContext, useEffect, useState } from "react";
import { FlightContext } from "../Contexts/FlightsContext";
import { AuthContext } from "../Contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import StyledText from "../components/styledcomponents/StyledText";
import { formatDate } from "../Functions/timeCalc";
import { FixedSizeList as List } from "react-window";

export default function Flights() {
  const isColumn = useBreakpointValue({ base: true, lg: false });
  const { flights, loading } = useContext(FlightContext);
  const [searchTerm, setSearchTerm] = useState("");
  const { token, removeToken, getUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const showed = 100;
  const User = getUser();
  const filteredFlights = useMemo(() => {
    return flights.filter((flight) =>
      [
        flight.airtask,
        flight.flightType,
        flight.flightAction,
        formatDate(flight.date),
        // flight.date,
        // flight.origin,
        // flight.destination,
        flight.tailNumber,
        flight.id,
      ]
        .map((field) => (field ? field.toString().toLowerCase() : ""))
        .some((field) => field.includes(searchTerm.toLowerCase())),
    );
  }, [searchTerm, flights]);

  useEffect(() => {
    if (!token && token !== "" && token !== undefined) {
      console.log("Removing Token");
      removeToken();
      navigate("/");
    }
  }, []);
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
        {User.admin ? <CreateFlightModal /> : null}
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
            // text={`Mostrados: ${filteredFlights.length >= showed ? showed : filteredFlights.length} / ${filteredFlights.length} Encontrados`}
            text={`${filteredFlights.length} Encontrados`}
          />
        )}
      </Flex>
      {loading ? (
        <Center h="80vh" flexDirection={"column"}>
          <Heading mb={10} fontSize={"lg"}>
            A carregar VOOS
          </Heading>
          <Spinner size="xl" thickness="4px" speed="1.65s" color="blue.500" />
        </Center>
      ) : (
        <Box
          mt="8"
          overflowY="hidden"
          w={"95%"}
          maxW={"1200px"}
          h={"80vh"}
          // p={10}
        >
          <List
            height={window.innerHeight}
            itemCount={filteredFlights.length}
            itemSize={650}
            width={"100%"}
          >
            {({ index, style }) => (
              <Box style={style}>
                {filteredFlights.length ? (
                  <FlightCard
                    key={filteredFlights[index].id}
                    flight={filteredFlights[index]}
                  />
                ) : null}
              </Box>
            )}
          </List>
        </Box>
        // <Stack
        //   gap={5}
        //   mt="8"
        //   overflowY="auto"
        //   w={"95%"}
        //   maxW={"1200px"}
        //   h={"80vh"}
        //   p={2}
        // >
        //   {filteredFlights.length
        //     ? // !!filteredFlights.length &&
        //       filteredFlights
        //         .slice(0, showed)
        //         .map((flight) => <FlightCard key={flight.id} flight={flight} />)
        //     : null}
        // </Stack>
      )}
    </VStack>
  );
}

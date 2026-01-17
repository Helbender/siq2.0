import React, { useMemo } from "react";
import {
  Stack,
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
import { Field } from "@chakra-ui/react";
import { FlightCard } from "../components/FlightCard";
import { CreateFlightModal } from "../components/CreateFlightModal";
import { useContext, useEffect, useState } from "react";
import { FlightContext } from "../contexts/FlightsContext";
import { AuthContext } from "@/features/auth/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { StyledText } from "@/features/shared/components/StyledText";
import { formatDate } from "@/utils/timeCalc";
import { List } from "react-window";

export function FlightsPage() {
  const isColumn = useBreakpointValue({ base: true, lg: false });
  const { flights, loading } = useContext(FlightContext);
  const [searchTerm, setSearchTerm] = useState("");
  const { token, removeToken, getUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const User = getUser();
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
        .map((field) => (field ? field.toString().toLowerCase() : ""))
        .some((field) => field.includes(searchTerm.toLowerCase())),
    );
  }, [searchTerm, flights]);

  useEffect(() => {
    if (!token && token !== "" && token !== undefined) {
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
        <Field.Root textAlign={"center"} ml={5} maxW="130px">
          <Input
            placeholder="Procurar..."
            textAlign={"center"}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Field.Root>
        <Spacer />
        {isColumn ? null : (
          <StyledText
            query={["Mostrados:", "Encontrados"]}
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
        <Box mt="8" overflowY="hidden" w={"95%"} maxW={"1210px"} h={"80vh"}>
          {filteredFlights.length > 0 ? (
            <List
              height={window.innerHeight}
              itemCount={filteredFlights.length}
              itemSize={650}
              width={"100%"}
              itemData={filteredFlights}
            >
              {({ index, style, data }) => (
                <Box style={style} p={2}>
                  {data && data[index] ? (
                    <FlightCard
                      key={data[index].id}
                      flight={data[index]}
                    />
                  ) : null}
                </Box>
              )}
            </List>
          ) : (
            <Center h="80vh">
              <Heading fontSize={"lg"}>Nenhum voo encontrado</Heading>
            </Center>
          )}
        </Box>
      )}
    </VStack>
  );
}

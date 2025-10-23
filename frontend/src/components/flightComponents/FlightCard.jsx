import {
  Stack,
  Card,
  Flex,
  CardHeader,
  Text,
  Heading,
  Divider,
  CardBody,
  Spacer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useBreakpointValue,
  Box,
} from "@chakra-ui/react";
import { useColorMode } from "@chakra-ui/react";
import StyledText from "../styledcomponents/StyledText";
import DeleteFlightModal from "./DeleteFlightModal";
import CreateFlightModal from "./CreateFlightModal";
import { formatDate } from "../../Functions/timeCalc";
import InfoMed from "./InfoMed";

const FlightCard = ({ flight }) => {
  const isColumn = useBreakpointValue({ base: true, lg: false });
  const { colorMode } = useColorMode();
  return (
    <Card
      boxShadow={"lg"}
      bg={colorMode === "light" ? "gray.300" : "gray.700"}
      // height={"600px"}
    >
      <CardHeader>
        <Flex align={"center"}>
          {isColumn ? (
            <Box>
              <Heading>{`${flight.airtask}`}</Heading>
              <Text>{`${formatDate(flight.date)}`}</Text>
            </Box>
          ) : (
            <Heading>{`${flight.airtask} (${flight.id})`}</Heading>
          )}
          <Spacer />
          {/* <EditFlightModal flight={flight} /> */}
          <CreateFlightModal flight={flight} />

          <Heading as="h3">{flight.ATD}</Heading>
          <DeleteFlightModal flight={flight} />
          <Spacer />
          {isColumn ? null : <Heading>{formatDate(flight.date)}</Heading>}
        </Flex>
        <Divider />
      </CardHeader>
      <CardBody>
        <Flex alignItems={"top"} gap={2} overflowX={"auto"}>
          <Stack>
            <Text>{`${flight.flightType} / ${flight.flightAction}`}</Text>
            <StyledText
              query={"Nº de Cauda:"}
              text={`Nº de Cauda: ${flight.tailNumber}`}
            />
            <StyledText
              query={"Nº TRIP:"}
              text={`Nº TRIP: ${flight.numberOfCrew}`}
            />
            <StyledText
              query={"Aterragens:"}
              text={`Aterragens: ${flight.totalLandings}`}
            />
          </Stack>
          <Spacer />
          <Stack>
            <StyledText query={"ORM:"} text={`ORM: ${flight.orm}`} />
            <StyledText
              query={["PAX", "DOE", "/", ":"]}
              text={
                flight.doe
                  ? `PAX/DOE: ${flight.passengers} / ${flight.doe}`
                  : `PAX: ${flight.passengers}`
              }
            />
            <StyledText query={"CARGO:"} text={`CARGO: ${flight.cargo} Kg`} />
            <StyledText query={"FUEL:"} text={`FUEL: ${flight.fuel} Kg`} />
          </Stack>
          <Spacer />
          <Stack>
            <StyledText query={"ATD:"} text={`ATD: ${flight.ATD}`} />
            <StyledText query={"ATA:"} text={`ATA: ${flight.ATA}`} />
            <StyledText query={"ATE:"} text={`ATE: ${flight.ATE}`} />
            <StyledText
              query={["De", "para"]}
              text={`De ${flight.origin} para ${flight.destination}`}
            />
          </Stack>
          <InfoMed flight={flight} />
        </Flex>

        <Divider my="5" />
        {/* <TableContainer overflowY={"auto"} maxHeight={"300px"}>
          <Table size={"sm"}>
            <Thead>
              <Tr>
                <Th textAlign={"center"} fontSize={"md"}>
                  NIP
                </Th>
                <Th textAlign={"center"} fontSize={"md"}>
                  Func
                </Th>
                <Th>Nome</Th>
                <Th textAlign={"center"} fontSize={"md"}>
                  ATR
                </Th>
                <Th textAlign={"center"} fontSize={"md"}>
                  ATN
                </Th>
                <Th textAlign={"center"} fontSize={"md"}>
                  Precisão
                </Th>
                <Th textAlign={"center"} fontSize={"md"}>
                  Não Precisão
                </Th>
                <Th textAlign={"center"} fontSize={"md"}>
                  Qualificações
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {flight.flight_pilots.map((pilot) => {
                let texto = "";
                for (let i = 1; i <= 6; i++) {
                  const qual = pilot[`QUAL${i}`];
                  if (qual && qual.trim() !== "") {
                    texto += (texto ? " " : "") + qual;
                  }
                }
                return (
                  <Tr key={pilot.nip}>
                    <Td textAlign={"center"}>{pilot.nip}</Td>
                    <Td textAlign={"center"}>{pilot.position}</Td>
                    <Td>{pilot.name}</Td>
                    <Td textAlign={"center"}>{pilot.ATR}</Td>
                    <Td textAlign={"center"}>{pilot.ATN}</Td>
                    <Td textAlign={"center"}>{pilot.precapp}</Td>
                    <Td textAlign={"center"}>{pilot.nprecapp}</Td>
                    <Td textAlign={"center"}>{texto}</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer> */}
      </CardBody>
    </Card>
  );
};

export default FlightCard;

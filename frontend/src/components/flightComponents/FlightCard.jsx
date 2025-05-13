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
} from "@chakra-ui/react";
import { useColorMode } from "@chakra-ui/react";
import StyledText from "../styledcomponents/StyledText";
import DeleteFlightModal from "./DeleteFlightModal";
import EditFlightModal from "./EditFlightModal";

const FlightCard = ({ flight }) => {
  const { colorMode } = useColorMode();

  return (
    <Card boxShadow={"lg"} bg={colorMode === "light" ? "gray.300" : "gray.700"}>
      <CardHeader>
        <Flex align={"center"}>
          <Heading>{flight.airtask}</Heading>
          <Spacer />
          <EditFlightModal flight={flight} />

          <Heading as="h3">{flight.ATD}</Heading>
          {/* <IconButton
            variant="ghost"
            colorScheme="red"
            size={"lg"}
            onClick={() => handleDeleteFlight(flight.id)}
            icon={<BiTrash />}
          /> */}
          <DeleteFlightModal flight={flight} />
          <Spacer />
          <Heading>
            {
              // `${l.toLocaleDateString("pt-pt", {
              //   day: "2-digit",
              //   month: "short",
              //   year: "numeric",
              // })}`
              flight.date
            }
          </Heading>
        </Flex>
        <Divider />
      </CardHeader>
      <CardBody>
        {/* <Stack>
          <Text alignContent={"center"} textAlign={"center"}>
            {"ID: "}
            {flight.id}
          </Text> */}
        <Flex alignItems={"top"}>
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
              query={["PAX:", "DOE:", "/"]}
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
        </Flex>
        {/* </Stack> */}
        <Divider my="5" />
        <TableContainer>
          <Table size={"sm"}>
            <Thead>
              <Tr>
                <Th textAlign={"center"}>NIP</Th>
                <Th textAlign={"center"}>Func</Th>
                <Th>Nome</Th>
                <Th textAlign={"center"}>ATR</Th>
                <Th textAlign={"center"}>ATN</Th>
                <Th textAlign={"center"}>Precisão</Th>
                <Th textAlign={"center"}>Não Precisão</Th>
                <Th textAlign={"center"}>Qualificações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {flight.flight_pilots.map((pilot) => {
                let qualification = [];
                if (pilot.QA1) {
                  qualification = [...qualification, "QA1"];
                }
                if (pilot.QA2) {
                  qualification = [...qualification, "QA2"];
                }
                if (pilot.BSP1) {
                  qualification = [...qualification, "BSP1"];
                }
                if (pilot.BSP2) {
                  qualification = [...qualification, "BSP2"];
                }
                if (pilot.TA) {
                  qualification = [...qualification, "TA"];
                }
                if (pilot.VRP1) {
                  qualification = [...qualification, "VRP1"];
                }
                if (pilot.VRP2) {
                  qualification = [...qualification, "VRP2"];
                }
                if (pilot.CTO) {
                  qualification = [...qualification, "CTO"];
                }
                if (pilot.SID) {
                  qualification = [...qualification, "SID"];
                }
                if (pilot.MONO) {
                  qualification = [...qualification, "MONO"];
                }
                if (pilot.NFP) {
                  qualification = [...qualification, "NFP"];
                }
                if (pilot.QUAL1) {
                  qualification = [...qualification, pilot.QUAL1];
                }
                if (pilot.QUAL2) {
                  qualification = [...qualification, pilot.QUAL2];
                }
                let texto = "";
                for (let i = 0; i < qualification.length; i++) {
                  // console.log(qualification[i]);
                  texto = texto + " " + qualification[i];
                }
                // console.log(texto);
                // console.log("first");
                return (
                  <Tr key={pilot.nip}>
                    <Td textAlign={"center"}>{pilot.nip}</Td>
                    <Td textAlign={"center"}>{pilot.position}</Td>
                    <Td>{pilot.name}</Td>
                    <Td textAlign={"center"}>{pilot.ATR}</Td>
                    <Td textAlign={"center"}>{pilot.ATN}</Td>
                    <Td textAlign={"center"}>{pilot.precapp}</Td>
                    <Td textAlign={"center"}>{pilot.nprecapp}</Td>
                    <Td textAlign={"center"}>
                      {texto}
                      {/* {qualification.length === 2
                        ? `${qualification[0]} and ${qualification[1]}`
                        : qualification[0]} */}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      </CardBody>
    </Card>
  );
};

export default FlightCard;

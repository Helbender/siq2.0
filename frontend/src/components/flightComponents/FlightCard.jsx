import {
  Stack,
  Card,
  Flex,
  CardHeader,
  Text,
  Heading,
  Divider,
  CardBody,
  IconButton,
  Spacer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useToast,
} from "@chakra-ui/react";
import { BiTrash } from "react-icons/bi";
import { useColorMode } from "@chakra-ui/react";
import axios from "axios";
import StyledText from "../styledcomponents/StyledText";
import { FlightContext } from "../../Contexts/FlightsContext";
import { useContext } from "react";
import { AuthContext } from "../../Contexts/AuthContext";
import EditFlightModal from "./EditFlightModal";
import { useNavigate } from "react-router-dom";

const FlightCard = ({ flight }) => {
  const { flights, setFlights } = useContext(FlightContext);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const handleDeleteFlight = async (id) => {
    try {
      const res = await axios.delete(`/api/flights/${id}`, {
        headers: { Authorization: "Bearer " + token },
      });
      // console.log(res.data);
      if (res.data?.deleted_id) {
        console.log(`Deleted flight ${res.data?.deleted_id}`);

        setFlights(flights.filter((flight) => flight.id != id));
      }
    } catch (error) {
      if (error.response.status === 404) {
        toast({
          title: "Erro a apagar",
          description: `ID is ${id}. Voo não encontrado.\nExperimente fazer refresh à página`,
          status: "error",
          duration: 5000,
          position: "bottom",
        });
      }
      // window.location.reload(false);
      console.log(error.response);
    }
  };
  // console.log(flight);
  // eslint-disable-next-line no-unused-vars
  const { colorMode, toggleColorMode } = useColorMode();

  const l = new Date(Date.parse(flight.date));

  return (
    <Card boxShadow={"lg"} bg={colorMode === "light" ? "gray.100" : "gray.700"}>
      <CardHeader>
        <Flex align={"center"}>
          <Heading>{flight.airtask}</Heading>
          <Spacer />
          <EditFlightModal flight={flight} navigate={navigate} />

          <Heading as="h3">{flight.ATD}</Heading>
          <IconButton
            variant="ghost"
            colorScheme="red"
            size={"lg"}
            onClick={() => handleDeleteFlight(flight.id)}
            icon={<BiTrash />}
          />
          <Spacer />
          <Heading>{
            `${l.toLocaleDateString("pt-pt")}`
            // `${l.getDate()}-${l.getMonth() + 1}-${l.getFullYear()}`
          }</Heading>
        </Flex>
        <Divider />
      </CardHeader>
      <CardBody>
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
                <Th textAlign={"center"}>PrecApp</Th>
                <Th textAlign={"center"}>NPrecApp</Th>
                <Th textAlign={"center"}>Qualifications</Th>
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
                if (pilot.QUAL1) {
                  qualification = [...qualification, pilot.QUAL1];
                }
                if (pilot.QUAL2) {
                  qualification = [...qualification, pilot.QUAL2];
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
                    <Td textAlign={"center"}>
                      {qualification.length === 2
                        ? `${qualification[0]} and ${qualification[1]}`
                        : qualification[0]}
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

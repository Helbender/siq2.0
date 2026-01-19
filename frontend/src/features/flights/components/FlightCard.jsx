import { StyledText } from "@/common/components/StyledText";
import { formatDate } from "@/utils/timeCalc";
import {
  Box,
  Card,
  Flex,
  Heading,
  Separator,
  Spacer,
  Stack,
  Table,
  Text,
  useBreakpointValue
} from "@chakra-ui/react";
import { InfoMed } from "./InfoMed";
import { CreateFlightModal } from "./modals/CreateFlightModal";
import { DeleteFlightModal } from "./modals/DeleteFlightModal";

export function FlightCard({ flight }) {
  const isColumn = useBreakpointValue({ base: true, lg: false });
  return (
    <Card.Root boxShadow={"lg"} bg="#2D3748">
      <Card.Header>
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
          <CreateFlightModal flight={flight} />

          <Heading as="h3">{flight.ATD}</Heading>
          <DeleteFlightModal flight={flight} />
          <Spacer />
          {isColumn ? null : <Heading>{formatDate(flight.date)}</Heading>}
        </Flex>
        <Separator />
      </Card.Header>
      <Card.Body>
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

        <Separator my="5" />
        <Box overflowY={"auto"} height={"300px"}>
          <Table.Root size={"sm"} variant="simple">
            <Table.Header>
              <Table.Row>
                {[
                  "NIP",
                  "Func",
                  "Nome",
                  "ATR",
                  "ATN",
                  "Precisão",
                  "Não Precisão",
                  "Qualificações",
                ].map((header) => (
                  <Table.ColumnHeader key={header} textAlign={"center"} fontSize={"md"}>
                    {header}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {flight.flight_pilots.map((pilot) => {
                // Collect qualifications from QUAL1-QUAL6, filtering out empty strings
                const qualifications = [1, 2, 3, 4, 5, 6]
                  .map((n) => pilot[`QUAL${n}`])
                  .filter((qual) => qual && qual.trim() !== "");

                // Join qualifications into a single string
                const qualificationsText = qualifications.join(" ");

                return (
                  <Table.Row key={pilot.nip}>
                    <Table.Cell textAlign={"center"}>{pilot.nip}</Table.Cell>
                    <Table.Cell textAlign={"center"}>{pilot.position}</Table.Cell>
                    <Table.Cell>{pilot.name}</Table.Cell>
                    <Table.Cell textAlign={"center"}>{pilot.ATR}</Table.Cell>
                    <Table.Cell textAlign={"center"}>{pilot.ATN}</Table.Cell>
                    <Table.Cell textAlign={"center"}>{pilot.precapp}</Table.Cell>
                    <Table.Cell textAlign={"center"}>{pilot.nprecapp}</Table.Cell>
                    <Table.Cell textAlign={"center"}>{qualificationsText}</Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Box>
      </Card.Body>
    </Card.Root>
  );
}

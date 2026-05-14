import {
  Badge,
  Box,
  Card,
  DataList,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function FlightActivityCard({ flight }) {
  const {
    airtask,
    date,
    ATD,
    ATA,
    origin,
    destination,
    flight_pilots = [],
    cargo,
    passengers,
  } = flight;

  const POSITION_ORDER = [
    "PI",
    "PC",
    "P",
    "CP",
    "PA",
    "OCI",
    "OC",
    "OCA",
    "CTI",
    "CT",
    "CTA",
    "OPVI",
    "OPV",
    "OPVA",
  ];
  const sortedPilots = [...flight_pilots].sort(
    (a, b) =>
      POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position),
  );

  const hasCargo = cargo > 0;
  const hasPax = passengers > 0;

  return (
    <Card.Root variant="glass">
      <Card.Header bg="emerald.900/40" borderTopRadius="md">
        <HStack justify="space-between">
          <Card.Title>
            <Text
            // fontWeight="bold" fontSize="md"
            >
              {airtask}
            </Text>
          </Card.Title>
          <Badge size="md" variant="gold">
            {formatDate(date)}
          </Badge>
        </HStack>
        {/* Header row */}
        <HStack justify="space-between">
          {/* Route */}
          <Text fontSize="sm" fontWeight="medium">
            {origin} → {destination}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {ATD} → {ATA}
          </Text>
        </HStack>
      </Card.Header>
      <Card.Body p={4}>
        <VStack align="stretch" gap={2}>
          <Text fontSize="md" color="fg">
            Tripulação
          </Text>
          {/* Crew + Cargo/PAX side by side */}
          <HStack justify="space-between" align="flex-start" gap={4}>
            {/* Crew list */}
            {/* <VStack align="flex-start" gap={1} flex="1"> */}
            <DataList.Root orientation="horizontal" gap={0}>
              {sortedPilots.map((p) => (
                <DataList.Item key={p.nip}>
                  <DataList.ItemLabel minWidth="20px">
                    {p.position}
                  </DataList.ItemLabel>
                  <DataList.ItemValue px={0}>{p.name}</DataList.ItemValue>
                </DataList.Item>
                // <Text key={p.nip} fontSize="sm" color="fg.muted">
                //   <Text as="span" fontWeight="semibold" color="fg.default">
                //     {p.position}
                //   </Text>{" "}
                //   {p.name}
                // </Text>
              ))}
            </DataList.Root>
            {/* </VStack> */}

            {(hasCargo || hasPax) && (
              <VStack align="flex-end" gap={1} flexShrink={0}>
                {!!hasCargo && (
                  <Box>
                    <Text fontSize="xs" color="fg.muted">
                      Carga
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {cargo} kg
                    </Text>
                  </Box>
                )}
                {!!hasPax && (
                  <Box textAlign="right">
                    <Text fontSize="xs" color="fg.muted">
                      PAX
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {passengers}
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

import {
  Badge,
  Box,
  Card,
  HStack,
  Separator,
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

  const hasCargo = cargo && cargo > 0;
  const hasPax = passengers && passengers > 0;

  return (
    <Card.Root variant="outline">
      <Card.Body p={4}>
        <VStack align="stretch" gap={2}>
          {/* Header row */}
          <HStack justify="space-between">
            <HStack gap={2}>
              <Text fontWeight="bold" fontSize="md">
                {airtask}
              </Text>
              <Badge variant="subtle" colorPalette="gray" size="sm">
                {formatDate(date)}
              </Badge>
            </HStack>
            <Text fontSize="sm" color="fg.muted">
              {ATD} → {ATA}
            </Text>
          </HStack>

          {/* Route */}
          <Text fontSize="sm" fontWeight="medium">
            {origin} → {destination}
          </Text>

          <Separator borderColor="border.subtle" />

          {/* Crew + Cargo/PAX side by side */}
          <HStack align="flex-start" gap={4}>
            {/* Crew list */}
            <VStack align="flex-start" gap={1} flex="1">
              {flight_pilots.map((p) => (
                <Text key={p.nip} fontSize="sm" color="fg.muted">
                  <Text as="span" fontWeight="semibold" color="fg.default">
                    {p.position}
                  </Text>{" "}
                  {p.name}
                </Text>
              ))}
            </VStack>

            {/* Cargo + PAX */}
            {(hasCargo || hasPax) && (
              <VStack align="flex-end" gap={1} flexShrink={0}>
                {hasCargo && (
                  <Box textAlign="right">
                    <Text fontSize="xs" color="fg.muted">
                      Carga
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {cargo} kg
                    </Text>
                  </Box>
                )}
                {hasPax && (
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

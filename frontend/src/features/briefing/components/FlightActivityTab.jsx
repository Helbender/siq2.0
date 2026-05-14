import { Box, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { StatCard } from "@/shared/components/StatCard";
import { useRecentFlights } from "../api/queries/useRecentFlights";
import { FlightActivityCard } from "./FlightActivityCard";

function minutesBetween(atd, ata) {
  const [h1, m1] = atd.split(":").map(Number);
  const [h2, m2] = ata.split(":").map(Number);
  let end = h2 * 60 + m2;
  const start = h1 * 60 + m1;
  if (end < start) end += 24 * 60;
  return end - start;
}

export function FlightActivityTab() {
  const { data: flights = [], isLoading, isError } = useRecentFlights();

  const stats = useMemo(() => {
    const totalMins = flights.reduce(
      (sum, f) => sum + minutesBetween(f.ATD, f.ATA),
      0,
    );
    const h = Math.floor(totalMins / 60);
    const m = String(totalMins % 60).padStart(2, "0");
    const totalPax = flights.reduce((sum, f) => sum + (f.passengers || 0), 0);
    const totalCargo = flights.reduce((sum, f) => sum + (f.cargo || 0), 0);
    return {
      flights: flights.length,
      hours: [h, m],
      pax: totalPax,
      cargo: totalCargo,
    };
  }, [flights]);

  if (isLoading) {
    return (
      <Box py={10} textAlign="center">
        <Spinner />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box py={10} textAlign="center">
        <Text color="fg.error">Erro ao carregar voos.</Text>
      </Box>
    );
  }

  if (!flights.length) {
    return (
      <Box py={10} textAlign="center">
        <Text color="fg.muted">Sem voos nos últimos 7 dias.</Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={3} p={3}>
      <SimpleGrid columns={4} gap={3}>
        <StatCard label="Voos (7 dias)" value={stats.flights} />
        <StatCard label="Horas de voo" value={stats.hours} unit={["h", "m"]} />
        <StatCard label="Passageiros" value={stats.pax} />
        <StatCard label="Carga" value={stats.cargo} unit="kg" />
      </SimpleGrid>

      <SimpleGrid columns={2} gap={3}>
        {flights.map((flight) => (
          <FlightActivityCard key={flight.id} flight={flight} />
        ))}
      </SimpleGrid>
    </VStack>
  );
}

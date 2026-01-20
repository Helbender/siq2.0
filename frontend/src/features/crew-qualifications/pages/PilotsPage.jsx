import {
  Center,
  SimpleGrid,
  Spinner,
  Text
} from "@chakra-ui/react";
import { PilotCard } from "../components/PilotCard";

export function PilotsPage({ pilotos = [], loading }) {
  if (loading) {
    return (
      <Center py="10">
        <Spinner size="lg" />
      </Center>
    );
  }

  if (!pilotos || !pilotos.length) {
    return (
      <Center py="10">
        <Text opacity={0.6}>Sem tripulantes</Text>
      </Center>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
      {pilotos.map((pilot) => (
          <PilotCard key={pilot.nip} user={pilot} />
        ))}
    </SimpleGrid>
  );
}

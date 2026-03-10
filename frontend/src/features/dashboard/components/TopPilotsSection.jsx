import { useCrewTypes } from "@/app/providers/CrewTypesProvider";
import { formatHours } from "@/shared/utils/timeCalc";
import { Box, Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react";

export function TopPilotsSection({ topPilotsByType, dateRangeLabel }) {
  const { getAllCrewTypes } = useCrewTypes();

  if (Object.keys(topPilotsByType).length === 0) {
    return null;
  }

  return (
    <Box mb={6}>
      <Heading size="md" mb={4} textAlign="center">
        Tripulantes com Mais Horas de Voo ({dateRangeLabel})
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
        {getAllCrewTypes().filter((tipo) => topPilotsByType[tipo])
          .map((tipo) => {
            const pilot = topPilotsByType[tipo];
            if (!pilot) return null;
            return (
              <Box
                key={tipo}
                bg="bg.cardSubtle"
                p={4}
                borderRadius="lg"
                boxShadow="md"
              >
                <Heading
                  size="sm"
                  mb={2}
                  textAlign="center"
                  color="teal.500"
                >
                  {tipo}
                </Heading>
                <Flex direction="column" align="center" gap={2}>
                  <Text fontSize="lg" fontWeight="bold">
                    {pilot.rank} {pilot.name}
                  </Text>
                  <Text fontSize="xl" fontWeight="bold" color="teal.500">
                    {formatHours(pilot.hours)}
                  </Text>
                </Flex>
              </Box>
            );
          })}
      </SimpleGrid>
    </Box>
  );
}
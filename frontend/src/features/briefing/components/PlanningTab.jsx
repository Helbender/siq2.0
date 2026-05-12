import { Box, Center, Heading, Text, VStack } from "@chakra-ui/react";
import { LuFileSpreadsheet } from "react-icons/lu";
import { PLANNING_SHEET_URL } from "../constants";

export function PlanningTab() {
  if (PLANNING_SHEET_URL) {
    return (
      <Box
        as="iframe"
        src={PLANNING_SHEET_URL}
        width="100%"
        height="800px"
        border="0"
        borderRadius="md"
        title="Planeamento Semanal"
      />
    );
  }

  return (
    <Center py={20}>
      <VStack gap={3} color="fg.muted">
        <LuFileSpreadsheet size={40} />
        <Heading size="md" color="fg.muted">
          Planeamento Semanal
        </Heading>
        <Text fontSize="sm" textAlign="center" maxW="sm">
          O Google Sheet de planeamento será embebido aqui. Consulta as
          instruções no plano para configurar o embed.
        </Text>
      </VStack>
    </Center>
  );
}

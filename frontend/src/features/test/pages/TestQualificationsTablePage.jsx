import { Box, Text } from "@chakra-ui/react";
import { FeatureBasePage } from "@/features/shared/pages/FeatureBasePage";

export function TestQualificationsTablePage() {
  return (
    <FeatureBasePage title="Tabela de Qualificações">
      <Box bg="gray.700" p={4} borderRadius="md">
        <Text color="gray.300">This is a test qualifications table page with some content.</Text>
      </Box>
    </FeatureBasePage>
  );
}
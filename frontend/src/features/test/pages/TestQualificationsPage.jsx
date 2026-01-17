import { FeatureBasePage } from "@/shared/components/FeatureBasePage";
import { Box, Text } from "@chakra-ui/react";

export function TestQualificationsPage() {
  return (
    <FeatureBasePage title="Qualificações">
      <Box bg="gray.700" p={4} borderRadius="md">
        <Text color="gray.300">This is a test qualifications page with some content.</Text>
      </Box>
    </FeatureBasePage>
  );
}
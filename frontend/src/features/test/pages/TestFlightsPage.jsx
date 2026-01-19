import { FeatureBasePage } from "@/common/components/FeatureBasePage";
import { Box, Text } from "@chakra-ui/react";

export function TestFlightsPage() {
  return (
    <FeatureBasePage title="Voos">
      <Box bg="gray.700" p={4} borderRadius="md">
        <Text color="gray.300">This is a test flights page with some content.</Text>
      </Box>
    </FeatureBasePage>
  );
}
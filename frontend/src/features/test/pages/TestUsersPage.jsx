import { FeatureBasePage } from "@/features/shared/pages/FeatureBasePage";
import { Box, Text } from "@chakra-ui/react";

export function TestUsersPage() {
  return (
    <FeatureBasePage title="Utilizadores">
      <Box bg="gray.700" p={4} borderRadius="md">
        <Text color="gray.300">This is a test users page with some content.</Text>
      </Box>
    </FeatureBasePage>
  );
}
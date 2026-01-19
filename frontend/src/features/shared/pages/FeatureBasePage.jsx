import { Box, Heading } from "@chakra-ui/react";

export function FeatureBasePage({ title, children }) {
  return (
    <Box w="100%" h="100%" p={6}>
      <Heading textAlign="center" size="lg" mb={4} color="white">
        {title}
      </Heading>
      <Box>{children}</Box>
    </Box>
  );
}
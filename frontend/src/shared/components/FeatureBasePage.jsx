import { Box } from "@chakra-ui/react";

export function FeatureBasePage({ children }) {
  return (
    <Box w="100%" h="100%" p={{ base: 2, md: 4 }}>
      {/* <Heading textAlign="center" size="lg" mb={4} color="white">
        {title}
      </Heading> */}
      <Box>{children}</Box>
    </Box>
  );
}

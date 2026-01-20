/* eslint-disable no-undef */
// Footer.jsx
import { HStack, Spacer, Text, useBreakpointValue } from "@chakra-ui/react";

export function Footer() {
  const isSmall = useBreakpointValue({ base: true, sm: false });
  return (
    <HStack
      w="100%"
      bg="teal.500"
      color="white"
      py={2}
      px={3}
      textAlign="center"
      boxShadow="lg"
      flexShrink={0}
      h="45px"
    >
      <Spacer />

      <Text mb={1} fontSize="lg" fontWeight="bold">
        Esquadra 502
      </Text>
      <Spacer />
      {isSmall ? null : (
        <Text textAlign="right" mb={1} fontSize="sm" fontWeight="italic">
          {"Build: " + BUILD_DATE}
        </Text>
      )}
    </HStack>
  );
}

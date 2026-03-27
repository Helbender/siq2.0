import { HStack, Spacer, Text, useBreakpointValue } from "@chakra-ui/react";

export function Footer() {
  const isSmall = useBreakpointValue({ base: true, sm: false });
  const buildDate = typeof BUILD_DATE !== "undefined" ? BUILD_DATE : "";

  return (
    <HStack
      w="100%"
      bg="bg.card"
      backdropFilter="blur(10px)"
      borderTop="1px solid"
      borderColor="border.subtle"
      py={2}
      px={4}
      flexShrink={0}
      minH="45px"
    >
      <Text fontSize="sm" fontWeight="600" color="text.primary">
        Esquadra 502
      </Text>
      <Spacer />
      {!isSmall && buildDate && (
        <Text fontSize="xs" color="text.muted">
          Build: {buildDate}
        </Text>
      )}
    </HStack>
  );
}

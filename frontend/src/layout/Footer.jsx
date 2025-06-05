/* eslint-disable no-undef */
// Footer.jsx
import { HStack, Spacer, Text, useBreakpointValue } from "@chakra-ui/react";

function Footer() {
  const isSmall = useBreakpointValue({ base: true, sm: false });
  console.log(isSmall);
  return (
    <HStack
      w="100%"
      bg="teal.500"
      color="white"
      py={2}
      px={3}
      mt={6}
      textAlign="center"
      // borderRadius="md"
      boxShadow="lg"
      position="fixed"
      bottom={0}
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

export default Footer;

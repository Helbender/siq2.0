import { Box, Flex, Heading, Image } from "@chakra-ui/react";

export function Header() {
  return (
    <Box
      as="header"
      w="100%"
      bg="teal.500"
      color="white"
      p={4}
      boxShadow="md"
      position="relative"
    >
      <Flex align="center" justify="space-between">
        <Image
          src="/Esquadra_502.png"
          alt="Esquadra 502 Logo"
          boxSize="60px"
          objectFit="contain"
          mr={4}
        />

        <Flex flex="1" justify="center">
          <Heading size="2xl" cursor="pointer" textAlign={"center"}>
            Sistema Integrado de Qualificações 2.0
          </Heading>
        </Flex>
      </Flex>
    </Box>
  );
}

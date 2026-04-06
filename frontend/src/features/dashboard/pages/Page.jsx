import { Box, Card, Heading, Input, Text } from "@chakra-ui/react";

export function Page() {
  return (
    <Box
      p="8"
      // bg="bg.canvas"
      minH="100vh"
    >
      {/* <Box
      p="5"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="card"
      bg="white"
      shadow="card"
    >
      <Text fontSize="sm" color="gray.500">
        Titulo
      </Text>

      <Heading size="lg">
        Valor
      </Heading>
    </Box> */}
      <Input variant="subtle" size="md" my="2" />
      <Card.Root>
        <Card.Header>
          <Text fontSize="sm" color="gray.500">
            Titulo
          </Text>
        </Card.Header>
        <Card.Body>
          <Heading size="lg">Valor</Heading>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}

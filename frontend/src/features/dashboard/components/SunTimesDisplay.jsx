import { Flex, Heading, Text } from "@chakra-ui/react";

export function SunTimesDisplay({ date, sunrise, sunset, error }) {
  if (error) {
    return <Text>Error: {error}</Text>;
  }

  if (!sunrise || !sunset) {
    return null;
  }

  return (
    <Flex mb={0} alignItems={"center"} flexDirection={"column"}>
      <Heading>{date}</Heading>
      <Text>{`SR: ${sunrise.toLocaleTimeString()}L`}</Text>
      <Text>{`SS: ${sunset.toLocaleTimeString()}L`}</Text>
    </Flex>
  );
}
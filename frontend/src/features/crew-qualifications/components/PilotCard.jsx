import {
  Card,
  Circle,
  Flex,
  Heading
} from "@chakra-ui/react";
import { GroupedQualifications } from "./GroupedQualifications";

export function PilotCard({ user }) {
  return (
    <Card.Root
      bg="bg.cardSubtle"
      boxShadow={"xl"}
      border="none"
      // maxW={"1000px"}
      // minW="550px"
    >
      <Card.Header>
        <Flex gap={4}>
          <Flex flex={"1"} flexDirection={"row"} align="center" gap={"5"}>
            <Circle
              bg={
                user.position === "PI"
                  ? "red.700"
                  : user.position === "PC"
                    ? "blue.500"
                    : "green"
              }
              size="40px"
              boxShadow="dark-lg"
              pt={"1"}
            >
              {user.position}
            </Circle>
            <Heading size="sm">{`${user.rank} ${user.name}`}</Heading>
          </Flex>
          <Flex align={"center"} gap={2}></Flex>
        </Flex>
      </Card.Header>
      <Card.Body>
        <GroupedQualifications qualificacoes={user.qualificacoes} />
      </Card.Body>
    </Card.Root>
  );
}

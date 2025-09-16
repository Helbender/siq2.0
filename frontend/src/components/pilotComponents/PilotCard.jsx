import {
  Card,
  Text,
  CardBody,
  CardHeader,
  Heading,
  Flex,
  Circle,
  useColorModeValue,
  Grid,
  Stack,
  Spacer,
  GridItem,
} from "@chakra-ui/react";
import DaysLeftColumn from "./DaysLeftColumn";
import QualificationsPanel from "./QualificationsPanel";
import StandardText from "../styledcomponents/StandardText";
import { Fragment, useState } from "react";
// ...existing code...
import GroupedQualifications from "./GroupedQualifications";
// ...existing code...

// ...existing code...
const PilotCard = ({ user }) => {
  return (
    <Card
      bg={useColorModeValue("gray.400", "gray.700")}
      boxShadow={"xl"}
      // maxW={"1000px"}
      // minW="550px"
    >
      <CardHeader>
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
      </CardHeader>
      <CardBody>
        <GroupedQualifications qualificacoes={user.qualificacoes} />
      </CardBody>
    </Card>
  );
};

export default PilotCard;

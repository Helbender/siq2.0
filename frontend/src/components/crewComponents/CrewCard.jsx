 
/* eslint-disable react/prop-types */
import {
  Card,
  Text,
  Box,
  CardBody,
  CardHeader,
  Heading,
  Flex,
  Circle,
  useColorModeValue,
} from "@chakra-ui/react";
import QualificationsPanel from "../pilotComponents/QualificationsPanel";

const CrewCard = ({ user }) => {
  return (
    <Card bg={useColorModeValue("gray.200", "gray.700")} boxShadow={"xl"}>
      <CardHeader>
        <Flex gap={4}>
          <Flex flex={"1"} flexDirection={"row"} align="center" gap={"5"}>
            <Circle bg="green" size="40px" boxShadow="dark-lg" pt={"1"}>
              {user.position}
            </Circle>
            <Heading size="sm">{`${user.rank} ${user.name}`}</Heading>
          </Flex>
          <Flex align={"center"} gap={2}></Flex>
        </Flex>
      </CardHeader>
      <CardBody>
        <Flex flexDirection={"row"}>
          {/* {!!user.qualification?.lastDayLandings ? (
            <DaysLeftColumn
              qualification={"BSOC"}
              dates={user.qualification.lastBSOC}
            />
          ) : null}
          {!!user.qualification?.lastNightLandings ? (
            <DaysLeftColumn
              qualification={"ATN"}
              dates={user.qualification.lastNightLandings}
            />
          ) : null}
          {!!user.qualification?.lastPrecApp ? (
            <DaysLeftColumn
              qualification={"P"}
              dates={user.qualification.lastPrecApp}
            />
          ) : null}
          {!!user.qualification?.lastNprecApp ? (
            <DaysLeftColumn
              qualification={"NP"}
              dates={user.qualification.lastNprecApp}
            />
          ) : null} */}
          <Box borderColor={"black"} borderWidth={"2px"}>
            <Text
              color="white"
              fontSize={"16"}
              fontWeight={"bold"}
              align={"center"}
              paddingX={2}
              bg="grey"
            >
              BSOC
            </Text>
          </Box>
          <Box borderColor={"black"} borderWidth={"2px"}>
            <QualificationsPanel qualification={user.qualification?.lastBSOC} />
          </Box>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default CrewCard;

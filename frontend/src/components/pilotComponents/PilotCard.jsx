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
} from "@chakra-ui/react";
import DaysLeftColumn from "./DaysLeftColumn";
import QualificationsPanel from "./QualificationsPanel";
import StandardText from "../styledcomponents/StandardText";

const PilotCard = ({ user }) => {
  console.log(user);
  return (
    <Card
      bg={useColorModeValue("gray.400", "gray.700")}
      boxShadow={"xl"}
      // maxW={"1000px"}
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
        <Stack>
          <Flex
            m={"auto"}
            flexDirection={"row"}
            justifyContent={"center"}
            backgroundColor={"#1a202c"}
            borderRadius={10}
            gap={2}
            p={3}
            // minH={"180px"}
          >
            <DaysLeftColumn
              qualification={"ATD"}
              dates={user.qualification?.lastDayLandings}
            />
            {/* {!!user.qualification?.lastDayLandings ? (
              <DaysLeftColumn
                qualification={"ATD"}
                dates={user.qualification.lastDayLandings}
              />
            ) : null} */}
            {/* {user.qualification?.lastNightLandings ? ( */}
            <DaysLeftColumn
              qualification={"ATN"}
              dates={user.qualification.lastNightLandings}
            />
            {/* ) : null} */}
            {user.qualification?.lastPrecApp ? (
              <DaysLeftColumn
                qualification={"P"}
                dates={user.qualification.lastPrecApp}
              />
            ) : null}
            {user.qualification?.lastNprecApp ? (
              <DaysLeftColumn
                qualification={"NP"}
                dates={user.qualification.lastNprecApp}
              />
            ) : null}
          </Flex>
          <Spacer />
          <Grid mt={5} templateColumns="repeat(11,1fr)" gap={0}>
            <StandardText text="QA1" borderTopLeftRadius={10} />
            <StandardText text="QA2" />
            <StandardText text="BSP1" />
            <StandardText text="BSP2" />
            <StandardText text="TA" />
            <StandardText text="VRP1" />
            <StandardText text="VRP2" />
            <StandardText text="CTO" />
            <StandardText text="SID" />
            <StandardText text="MONO" />
            <StandardText text="NFP" borderTopRightRadius={10} />

            <QualificationsPanel
              maxW={10}
              qualification={user.qualification?.lastQA1}
              borderBottomLeftRadius={10}
            />
            <QualificationsPanel
              maxW={10}
              qualification={user.qualification?.lastQA2}
            />
            <QualificationsPanel
              maxW={10}
              qualification={user.qualification?.lastBSP1}
            />
            <QualificationsPanel
              maxW={10}
              qualification={user.qualification?.lastBSP2}
            />
            <QualificationsPanel
              maxW={10}
              qualification={user.qualification?.lastTA}
            />
            <QualificationsPanel
              maxW={10}
              qualification={user.qualification?.lastVRP1}
            />
            <QualificationsPanel
              maxW={10}
              qualification={user.qualification?.lastVRP2}
            />
            <QualificationsPanel
              maxW={10}
              qualification={user.qualification?.lastCTO}
            />
            <QualificationsPanel
              maxW={10}
              qualification={user.qualification?.lastSID}
            />
            <QualificationsPanel
              maxW={10}
              qualification={user.qualification?.lastMONO}
            />
            <QualificationsPanel
              maxW={10}
              qualification={user.qualification?.lastNFP}
              borderBottomRightRadius={10}
            />
          </Grid>
          <Text
            borderRadius={5}
            bg="rgba(229,62,62,0.7)"
            align={"center"}
            alignSelf={"center"}
            fontWeight={"bold"}
            mt={5}
            minW={250}
            fontSize={17}
          >
            {`${user.qualification?.oldest[0]} expira a ${user.qualification?.oldest[1]}`}
          </Text>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default PilotCard;

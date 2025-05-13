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

const PilotCard = ({ user }) => {
  console.log(user);
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
        <Stack>
          <Flex
            m={"auto"}
            flexDirection={"row"}
            justifyContent={"center"}
            backgroundColor={"#1a202c"}
            borderRadius={10}
            gap={2}
            p={3}
            minHeight={"180px"}
          >
            <DaysLeftColumn
              qualification={"ATD"}
              dates={user.qualification?.lastDayLandings}
            />
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
          <Flex
            m={"auto"}
            flexDirection={"column"}
            backgroundColor={"#1a202c"}
            borderRadius={10}
            gap={2}
            p={3}
          >
            <Text fontWeight={"bold"}>Pronto para Alerta</Text>
            <Grid
              my={1}
              rowGap={1}
              columnGap={1}
              templateColumns={"repeat(6,1fr)"}
            >
              <GridItem alignContent={"center"}>
                <StandardText text="QA1" />
              </GridItem>
              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualification={user.qualification?.lastQA1}
                />
              </GridItem>
              <StandardText text="QA2" />
              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualification={user.qualification?.lastQA2}
                />
              </GridItem>
              <StandardText text="BSP1" />
              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualification={user.qualification?.lastBSP1}
                />
              </GridItem>
              <StandardText text="BSP2" />

              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualificationName="BSP2"
                  qualification={user.qualification?.lastBSP2}
                />
              </GridItem>
              <StandardText text="TA" />

              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualificationName="TA"
                  qualification={user.qualification?.lastTA}
                />
              </GridItem>
            </Grid>
          </Flex>
          <Flex
            m={"auto"}
            flexDirection={"column"}
            // justifyContent={"center"}
            backgroundColor={"#1a202c"}
            borderRadius={10}
            gap={2}
            p={3}
            // minHeight={"180px"}
          >
            <Text fontWeight={"bold"}>ISR</Text>
            <Grid
              my={1}
              rowGap={1}
              columnGap={1}
              templateColumns={"repeat(6,1fr)"}
              // bg={"teal.100"}
            >
              <StandardText text="VRP1" />

              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualificationName="VRP1"
                  qualification={user.qualification?.lastVRP1}
                />
              </GridItem>
              <StandardText text="VRP2" />
              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualification={user.qualification?.lastVRP2}
                />
              </GridItem>
            </Grid>
          </Flex>
          <Flex
            m={"auto"}
            flexDirection={"column"}
            backgroundColor={"#1a202c"}
            borderRadius={10}
            gap={2}
            p={3}
          >
            <Text fontWeight={"bold"}>Currencies</Text>
            <Grid
              my={1}
              rowGap={1}
              columnGap={1}
              templateColumns={"repeat(6,1fr)"}
            >
              <StandardText text="CTO" />
              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualification={user.qualification?.lastCTO}
                  type={2}
                />
              </GridItem>

              <StandardText text="SID" />
              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualification={user.qualification?.lastSID}
                  type={2}
                />
              </GridItem>

              <StandardText text="MONO" />
              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualification={user.qualification?.lastMONO}
                  type={2}
                />
              </GridItem>

              <StandardText text="NFP" />
              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualification={user.qualification?.lastNFP}
                  type={2}
                />
              </GridItem>
            </Grid>
          </Flex>
          {/* <HStack mt={5} gap={0}>
            <Grid
              my={1}
              rowGap={1}
              columnGap={1}
              templateColumns={"repeat(3,1fr)"}
            >
              <StandardText text="QA1" />

              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualification={user.qualification?.lastQA1}
                />
              </GridItem>
              <StandardText text="QA2" />
              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualification={user.qualification?.lastQA2}
                />
              </GridItem>

              <StandardText text="BSP1" />
              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualification={user.qualification?.lastBSP1}
                />
              </GridItem>
              <StandardText text="BSP2" />

              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualificationName="BSP2"
                  qualification={user.qualification?.lastBSP2}
                />
              </GridItem>
              <StandardText text="TA" />

              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualificationName="TA"
                  qualification={user.qualification?.lastTA}
                />
              </GridItem>
              <StandardText text="VRP1" />

              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualificationName="VRP1"
                  qualification={user.qualification?.lastVRP1}
                />
              </GridItem>
            </Grid>
            <Grid
              my={1}
              rowGap={1}
              columnGap={1}
              templateColumns={"repeat(3,1fr)"}
            >
              <StandardText text="VRP2" />
              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualification={user.qualification?.lastVRP2}
                />
              </GridItem>

              <StandardText text="CTO" />
              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualification={user.qualification?.lastCTO}
                />
              </GridItem>

              <StandardText text="SID" />
              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualification={user.qualification?.lastSID}
                />
              </GridItem>

              <StandardText text="MONO" />
              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualification={user.qualification?.lastMONO}
                />
              </GridItem>

              <StandardText text="NFP" />
              <GridItem colSpan={2}>
                <QualificationsPanel
                  qualification={user.qualification?.lastNFP}
                />
              </GridItem>
            </Grid>
          </HStack> */}
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

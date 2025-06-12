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
import { Fragment } from "react";

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
            {user.qualification
              .filter((qual) => qual.grupo === "aterragens")
              .map((qual, index) =>
                qual.name === "oldest" ? null : (
                  <DaysLeftColumn
                    key={index}
                    qualification={qual.name}
                    dates={qual.dados}
                  />
                ),
              )}
            {/* <DaysLeftColumn
              qualification={"ATD"}
              dates={user.qualification?.lastDayLandings}
            />
            <DaysLeftColumn
              qualification={"ATN"}
              dates={user.qualification.lastNightLandings}
            />
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
            ) : null} */}
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
            <Text fontWeight={"bold"} color={"white"} >Pronto para Alerta</Text>
            <Grid
              my={1}
              rowGap={1}
              columnGap={1}
              templateColumns={"repeat(6,1fr)"}
            >
              {user.qualification
                .filter((qual) => qual.grupo === "alerta")
                .map((qual, index) => (
                  <Fragment key={index}>
                    <StandardText text={`${qual.name}`} />
                    <GridItem colSpan={2}>
                      <QualificationsPanel qualification={qual.dados} />
                    </GridItem>
                  </Fragment>
                ))}
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
            <Text fontWeight={"bold"}color={"white"}>ISR</Text>
            <Grid
              my={1}
              rowGap={1}
              columnGap={1}
              templateColumns={"repeat(6,1fr)"}
              // bg={"teal.100"}
            >
              {user.qualification
                .filter((qual) => qual.grupo === "vrp")
                .map((qual, index) =>
                  qual.name === "oldest" ? null : (
                    <>
                      <StandardText key={index} text={`${qual.name}`} />
                      <GridItem colSpan={2}>
                        <QualificationsPanel qualification={qual.dados} />
                      </GridItem>
                    </>
                  ),
                )}
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
            <Text fontWeight={"bold"}color={"white"}>Currencies</Text>
            <Grid
              my={1}
              rowGap={1}
              columnGap={1}
              templateColumns={"repeat(6,1fr)"}
            >
              {user.qualification
                .filter((qual) => qual.grupo === "currencies")
                .map((qual, index) =>
                  qual.name === "oldest" ? null : (
                    <>
                      <StandardText key={index} text={`${qual.name}`} />
                      <GridItem colSpan={2}>
                        <QualificationsPanel qualification={qual.dados} />
                      </GridItem>
                    </>
                  ),
                )}
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
            <Text fontWeight={"bold"}color={"white"}>Diversos</Text>
            <Grid
              my={1}
              rowGap={1}
              columnGap={1}
              templateColumns={"repeat(6,1fr)"}
            >
              {user.qualification
                .filter((qual) => qual.grupo === "diversos")
                .map((qual, index) =>
                  qual.name === "oldest" ? null : (
                    <>
                      <StandardText key={index} text={`${qual.name}`} />
                      <GridItem colSpan={2}>
                        <QualificationsPanel qualification={qual.dados} />
                      </GridItem>
                    </>
                  ),
                )}
            </Grid>
          </Flex>

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
            {`${user.qualification.at(-1).dados[0]} expira a ${user.qualification.at(-1).dados[1]}`}
          </Text>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default PilotCard;

import {
  Card,
  Text,
  Grid,
  GridItem,
  CardBody,
  CardHeader,
  Heading,
  Flex,
  Circle,
  useColorModeValue,
} from "@chakra-ui/react";
import QualificationsPanel from "../pilotComponents/QualificationsPanel";
import StandardText from "../styledcomponents/StandardText";

const colors = {
  OCI: "red.500",
  OC: "green",
  OCA: "blue.900",
  // P: "blue.500",
  // CP: "blue.300",
  Default: "violet.500",
};
const CrewCard = ({ user }) => {
  console.log(user);
  return (
    <Card bg={useColorModeValue("gray.200", "gray.700")} boxShadow={"xl"}>
      <CardHeader>
        <Flex gap={4}>
          <Flex flex={"1"} flexDirection={"row"} align="center" gap={"5"}>
            <Circle
              bg={colors[user.position] || colors["Default"]}
              size="40px"
              boxShadow="dark-lg"
            >
              {user.position}
            </Circle>
            <Heading size="sm">{`${user.rank} ${user.name}`}</Heading>
          </Flex>
          <Flex align={"center"} gap={2}></Flex>
        </Flex>
      </CardHeader>
      <CardBody>
        <Flex
          m={"auto"}
          flexDirection={"column"}
          backgroundColor={"#1a202c"}
          borderRadius={10}
          gap={2}
          p={3}
        >
          <Text fontWeight={"bold"}>Qualificações</Text>
          <Grid
            my={1}
            rowGap={1}
            columnGap={1}
            templateColumns={"repeat(3,1fr)"}
          >
            {user.qualification.map((qual, index) =>
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
      </CardBody>
    </Card>
  );
};

export default CrewCard;

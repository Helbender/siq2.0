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
        <Flex
          m={"auto"}
          flexDirection={"column"}
          backgroundColor={"#1a202c"}
          borderRadius={10}
          gap={2}
          p={3}
        >
          <Text fontWeight={"bold"}>Alerta</Text>
          <Grid
            my={1}
            rowGap={1}
            columnGap={1}
            templateColumns={"repeat(3,1fr)"}
          >
            <StandardText text="BSOC" />
            <GridItem colSpan={2}>
              <QualificationsPanel
                qualification={user.qualification?.lastBSOC}
              />
            </GridItem>
          </Grid>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default CrewCard;

import { Flex, Text, Stack, Grid, GridItem } from "@chakra-ui/react";
import QualificationsPanel from "./QualificationsPanel";
import { Fragment } from "react";
import StandardText from "../styledcomponents/StandardText";

const GroupedQualifications = ({ qualificacoes }) => {
  // Group by 'grupo'
  const grouped = qualificacoes.reduce((acc, qual) => {
    acc[qual.grupo] = acc[qual.grupo] || [];
    acc[qual.grupo].push(qual);
    return acc;
  }, {});

  return (
    <Fragment>
      {Object.entries(grouped).map(([grupo, quals]) => (
        <Flex
          key={grupo}
          m={"auto"}
          flexDirection={"column"}
          backgroundColor={"#1a202c"}
          borderRadius={10}
          gap={2}
          p={3}
          mb={5}
        >
          <Text fontWeight="bold" color={"white"} textAlign={"center"}>
            {grupo}
          </Text>
          <Grid
            my={1}
            rowGap={1}
            columnGap={1}
            templateColumns={"repeat(6,minmax(0,1fr))"}
          >
            {quals.map((qual, idx) => (
              <Fragment key={idx}>
                <GridItem colSpan={1}>
                  <StandardText
                    text={`${qual.nome}`}
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  />
                </GridItem>
                <GridItem colSpan={2}>
                  <QualificationsPanel key={idx} qualification={qual} />
                </GridItem>
              </Fragment>
            ))}
          </Grid>
        </Flex>
      ))}
    </Fragment>
  );
};

export default GroupedQualifications;

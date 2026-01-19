import { Flex, Text, Grid, GridItem } from "@chakra-ui/react";
import { QualificationsPanel } from "./QualificationsPanel";
import { Fragment } from "react";
import { StandardText } from "@/common/components/StandardText";

export function GroupedQualifications({ qualificacoes }) {
  // Group by 'grupo'
  const grouped = qualificacoes.reduce((acc, qual) => {
    acc[qual.grupo] = acc[qual.grupo] || [];
    acc[qual.grupo].push(qual);
    return acc;
  }, {});

  // Sort groups alphabetically and sort qualifications within each group
  const sortedGroups = Object.entries(grouped)
    .sort(([grupoA], [grupoB]) => {
      // Handle cases where grupo might be null/undefined
      const a = grupoA || "";
      const b = grupoB || "";
      return a.localeCompare(b);
    })
    .map(([grupo, quals]) => [
      grupo,
      [...quals].sort((a, b) => {
        // Sort qualifications by nome alphabetically
        const nomeA = a.nome || "";
        const nomeB = b.nome || "";
        return nomeA.localeCompare(nomeB);
      }),
    ]);

  return (
    <Fragment>
      {sortedGroups.map(([grupo, quals]) => (
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
}

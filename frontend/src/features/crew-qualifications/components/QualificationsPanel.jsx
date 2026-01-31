import { HStack, Text } from "@chakra-ui/react";
import { useMemo } from "react";

export function QualificationsPanel(props) {
  const validade = props.qualification.validade_info[2] / 6;
  const bg = useMemo(() => {
  const days = props.qualification.validade_info[0];
  if (days < 0) return "red.600";
  if (days < validade) return "yellow";
  return "green";
}, [props.qualification.validade_info, validade]);
  return (
    <HStack gap={0} h="100%">
      <Text
        align={"center"}
        alignContent={"center"}
        fontSize={14}
        py={1}
        h="100%"
        // w={"52px"}
        px={2}
        bg={bg}
        color={bg === "red.600" ? "white" : "black"}
        borderTopLeftRadius={props.borderTopLeftRadius}
        borderTopRightRadius={props.borderTopRightRadius}
        borderBottomLeftRadius={props.borderBottomLeftRadius}
        borderBottomRightRadius={props.borderBottomRightRadius}
      >
        {props.qualification.validade_info[0]}
      </Text>
      <Text
        color={"white"}
        py={1}
        pl={2}
        textAlign={"right"}
        alignContent={"center"}
        // isTruncated
      >
        {props.qualification.validade_info[1]}
      </Text>
    </HStack>
  );
}

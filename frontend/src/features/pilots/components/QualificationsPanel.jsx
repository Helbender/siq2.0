import { HStack, Text } from "@chakra-ui/react";

export function QualificationsPanel(props) {
  const validade = props.qualification.validade_info[2] / 6;
  function colorFormatter(days) {
    let color = "";
    if (days < 0) return (color = "red.600");
    if (days < validade) return (color = "yellow");
    // eslint-disable-next-line no-unused-vars
    else return (color = "green");
  }
  return (
    <HStack gap={0} h="100%">
      <Text
        align={"center"}
        alignContent={"center"}
        fontSize={14}
        color="text.primary"
        py={1}
        h="100%"
        // w={"52px"}
        px={2}
        bg={colorFormatter(props.qualification.validade_info[0])}
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

/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/prop-types */
import { HStack, Spacer, Text } from "@chakra-ui/react";

const QualificationsPanel = (props) => {
  function colorFormatter(days) {
    let color = "";
    if (days < 0) return (color = "red.600");
    if (days < 45) return (color = "yellow");
    // eslint-disable-next-line no-unused-vars
    else return (color = "green");
  }
  return (
    <HStack gap={0}>
      <Text
        align={"center"}
        alignContent={"center"}
        fontSize={14}
        color="black"
        py={1}
        minH={"40px"}
        minWidth={"60px"}
        px={2}
        bg={colorFormatter(props.qualification[0])}
        borderTopLeftRadius={props.borderTopLeftRadius}
        borderTopRightRadius={props.borderTopRightRadius}
        borderBottomLeftRadius={props.borderBottomLeftRadius}
        borderBottomRightRadius={props.borderBottomRightRadius}
      >
        {props.qualification[0]}
      </Text>
      <Spacer />
      <Text
        py={1}
        px={2}
        textAlign={"right"}
        minHeight={10}
        alignContent={"center"}
      >
        {props.qualification[1]}
      </Text>
    </HStack>
  );
};

export default QualificationsPanel;

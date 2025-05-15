 
 
import { HStack, Text } from "@chakra-ui/react";

const QualificationsPanel = (props) => {
  const type = props.type === 2 ? 10 : 45;
  function colorFormatter(days) {
    let color = "";
    if (days < 0) return (color = "red.600");
    if (days < type) return (color = "yellow");
    // eslint-disable-next-line no-unused-vars
    else return (color = "green");
  }
  return (
    <HStack gap={0} h="100%">
      <Text
        align={"center"}
        alignContent={"center"}
        fontSize={14}
        color="black"
        py={1}
        h="100%"
        // w={"50%"}
        px={2}
        bg={colorFormatter(props.qualification[0])}
        borderTopLeftRadius={props.borderTopLeftRadius}
        borderTopRightRadius={props.borderTopRightRadius}
        borderBottomLeftRadius={props.borderBottomLeftRadius}
        borderBottomRightRadius={props.borderBottomRightRadius}
      >
        {props.qualification[0]}
      </Text>
      {/* <Spacer /> */}
      <Text
        py={1}
        px={2}
        textAlign={"right"}
        alignContent={"center"}
        isTruncated
      >
        {props.qualification[1]}
      </Text>
    </HStack>
  );
};

export default QualificationsPanel;

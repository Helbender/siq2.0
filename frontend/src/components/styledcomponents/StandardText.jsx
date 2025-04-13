/* eslint-disable react/prop-types */
import { Text } from "@chakra-ui/react";
import React from "react";

const StandardText = (props) => {
  return (
    <Text
      color={"white"}
      align="center"
      alignContent={"center"}
      fontSize={"14"}
      fontWeight={"bold"}
      paddingX={2}
      // width={"60px"}
      // maxW={"80px"}
      paddingY={1}
      bg="cyan.700"
      borderTopLeftRadius={props.borderTopLeftRadius}
      borderTopRightRadius={props.borderTopRightRadius}
      borderBottomLeftRadius={props.borderBottomLeftRadius}
      borderBottomRightRadius={props.borderBottomRightRadius}
    >
      {props.text}
    </Text>
  );
};

export default StandardText;

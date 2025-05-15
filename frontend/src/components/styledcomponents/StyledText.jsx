 
import { Text, Highlight, useColorMode } from "@chakra-ui/react";

function StyledText({ query, text }) {
  const { colorMode } = useColorMode();
  let color = colorMode === "light" ? "black" : "white";

  return (
    <Text>
      <Highlight query={query} styles={{ color: color, fontWeight: "bold" }}>
        {text}
      </Highlight>
    </Text>
  );
}

export default StyledText;

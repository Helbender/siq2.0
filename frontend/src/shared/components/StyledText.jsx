import { Text, Highlight } from "@chakra-ui/react";

export function StyledText({ query, text }) {
  return (
    <Text>
      <Highlight
        query={query}
        styles={{ color: "text.default", fontWeight: "bold", fontSize: "lg" }}
      >
        {text}
      </Highlight>
    </Text>
  );
}

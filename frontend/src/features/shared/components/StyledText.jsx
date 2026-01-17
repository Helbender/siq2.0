import { Text, Highlight } from "@chakra-ui/react";

export function StyledText({ query, text }) {
  return (
    <Text color="text.primary">
      <Highlight
        query={query}
        styles={{ color: "text.primary", fontWeight: "bold", fontSize: "lg" }}
      >
        {text}
      </Highlight>
    </Text>
  );
}

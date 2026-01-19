import { Text, Highlight } from "@chakra-ui/react";

export function StyledText({ query, text }) {
  // Ensure text is always a string
  const textString = String(text ?? "");
  
  return (
    <Text color="text.primary">
      <Highlight
        query={query}
        styles={{ color: "text.primary", fontWeight: "bold", fontSize: "lg" }}
      >
        {textString}
      </Highlight>
    </Text>
  );
}

import { Field as ChakraField, Input } from "@chakra-ui/react";

export function Field({ label, error, ...props }) {
  return (
    <ChakraField.Root invalid={!!error}>
      <ChakraField.Label>{label}</ChakraField.Label>

      <Input {...props} />

      {error && <ChakraField.ErrorText>{error}</ChakraField.ErrorText>}
    </ChakraField.Root>
  );
}

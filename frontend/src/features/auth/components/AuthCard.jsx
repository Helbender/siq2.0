import { Stack } from "@chakra-ui/react";

export function AuthCard({ children, ...props }) {
  return (
    <Stack
      bg="bg.card"
      backdropBlur={"12px"}
      borderColor="border.strong"
      border="1px"
      rounded="md"
      p={10}
      shadow="md"
      _hover={{ borderColor: "border.focus" }}
      {...props}
    >
      {children}
    </Stack>
  );
}

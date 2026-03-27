import { Box } from "@chakra-ui/react";
import { HealthCard } from "../components/HealthCard";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  return (
    <Box
      w={"100%"}
      h={"100%"}
      display={"flex"}
      justifyContent={"center"}
      alignItems={{ sm: "center", md: "top" }}
      overflowY="auto"
      position="relative"
    >
      <HealthCard />
      <LoginForm />
    </Box>
  );
}

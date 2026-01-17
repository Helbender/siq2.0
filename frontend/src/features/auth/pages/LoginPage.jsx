import {
  Box,
  Input,
  Stack,
  Heading,
  Button,
  Alert,
  Field,
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { HealthCard } from "../components/HealthCard";

export function LoginPage() {
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(nip, password);
      if (result.success) {
        // Small delay to ensure state is updated before navigation
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 100);
      } else {
        setError(result.error || "Login failed");
        setLoading(false);
      }
    } catch (err) {
      console.error("Login submission error:", err);
      setError("Unexpected error");
      setLoading(false);
    }
  };

  return (
    <Box
      w={"100vw"}
      h={"100vh"}
      display={"flex"}
      justifyContent={"center"}
      alignItems={{ sm: "center", md: "top" }}
      overflowY="auto"
      bg="#1A202C"
      position="relative"
    >
      <HealthCard />
      <form onSubmit={handleSubmit}>
        <Stack>
          <Heading mb={"25px"} textAlign="center" color="white">
            Esquadra 502
          </Heading>
          {error && (
            <Alert.Root status="error" mb={4}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Error</Alert.Title>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}
          <Field.Root>
            <Field.Label textAlign={"center"}>NIP</Field.Label>
            <Input
              bg="gray.700"
              type="number"
              value={nip}
              name="nip"
              placeholder="NIP"
              onChange={(e) => setNip(e.target.value)}
            />
          </Field.Root>
          <Field.Root mt="2">
            <Field.Label textAlign={"center"}>Password</Field.Label>
            <Input
              bg="gray.700"
              type="password"
              value={password}
              name="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field.Root>
          {/* <Link
            mt={4}
            color="teal.500"
            fontWeight="bold"
            onClick={() => navigate("/recover-password")}
            aria-label="Recover Password"
            width={["80%", "60%", "100%"]} // Adjust link width for small screens and larger screens
            textAlign="center"
          >
            Recover Password
          </Link> */}
          <Button
            mt="10"
            type="submit"
            isLoading={loading}
            isDisabled={loading}
          >
            Login
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

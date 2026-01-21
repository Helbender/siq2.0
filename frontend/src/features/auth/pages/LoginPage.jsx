import {
  Alert,
  Box,
  Button,
  Field,
  Heading,
  Input,
  Stack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HealthCard } from "../components/HealthCard";
import { useLogin } from "../mutations/useLogin";

export function LoginPage() {
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const loginMutation = useLogin();
  const navigate = useNavigate();
  const location = useLocation();

  // Reset form state when navigating to login page
  useEffect(() => {
    if (location.pathname === "/login") {
      setNip("");
      setPassword("");
      setError("");
      // Reset mutation state to clear any previous errors
      loginMutation.reset();
    }
  }, [location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await loginMutation.mutateAsync({ nip, password });
      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 100);
    } catch (err) {
      console.error("Login submission error:", err);
      // Extract error message
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Login failed";
      setError(errorMessage);
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
          <Heading mb={"25px"} textAlign="center" color="white" as={"h1"} fontSize={"4xl"}>
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
          <Field.Root textAlign={"center"}>
            <Field.Label textAlign={"center"}>NIP</Field.Label>
            <Input
              bg="gray.700"
              type="text"
              value={nip}
              name="nip"
              placeholder="NIP"
              borderRadius={"md"}
              _hover={{borderColor:"teal.500"}}
              // _focus={{borderColor:"teal.500",border:"2px solid"}}
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
              _hover={{borderColor:"teal.500"}}

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
            isLoading={loginMutation.isPending}
            isDisabled={loginMutation.isPending}
            colorPalette={"teal"}
          >
            <b>
              Login
              </b>
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

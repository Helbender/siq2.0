import {
  Alert,
  Button,
  Field,
  Heading,
  Input,
  Link,
} from "@chakra-ui/react";
import { AuthCard } from "./AuthCard";
import { useLoginPage } from "../hooks/useLoginPage";

export function LoginForm() {
  const {
    error,
    nip,
    password,
    isLoading,
    handleSubmit,
    setNip,
    setPassword,
    handleForgotPassword,
  } = useLoginPage();
  return (
    <form onSubmit={handleSubmit}>
      <AuthCard>
        <Heading
          mb={"25px"}
          textAlign="center"
          color="text.primary"
          as={"h1"}
          fontSize={"4xl"}
        >
          Esquadra 502
        </Heading>
        {error && (
          <Alert.Root status="error" mb={4}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Erro</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}
        <Field.Root textAlign={"center"}>
          <Field.Label textAlign={"center"}>NIP</Field.Label>
          <Input
            bg="bg.input"
            type="text"
            value={nip}
            name="nip"
            placeholder="NIP"
            borderRadius={"md"}
            _hover={{ borderColor: "teal.500" }}
            onChange={(e) => setNip(e.target.value)}
          />
        </Field.Root>
        <Field.Root mt="2">
          <Field.Label textAlign={"center"}>Palavra-passe</Field.Label>
          <Input
            bg="bg.input"
            type="password"
            value={password}
            name="password"
            placeholder="Palavra-passe"
            _hover={{ borderColor: "teal.500" }}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field.Root>
        <Link
          mt={4}
          color="teal.500"
          fontWeight="bold"
          onClick={handleForgotPassword}
          aria-label="Esqueceu-se da palavra-passe"
          textAlign="center"
          cursor="pointer"
          _hover={{ textDecoration: "underline" }}
        >
          Esqueceu-se da palavra-passe?
        </Link>
        <Button
          mt="10"
          type="submit"
          isLoading={isLoading}
          isDisabled={isLoading}
          colorPalette={"teal"}
        >
          <b>Entrar</b>
        </Button>
      </AuthCard>
    </form>
  );
}

import { toaster } from "@/utils/toaster";
import {
  Button,
  Field,
  Flex,
  Heading,
  Input,
  Stack
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPasswordRequest } from "../services/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const goBack = () => navigate("/login");

  const sendEmail = async () => {
    if (!email) {
      toaster.create({
        title: "Email required",
        description: "Please enter your email address.",
        type: "error",
        duration: 5000,
        closable: true,
        placement: "top",
      });
      return;
    }

    try {
      await forgotPasswordRequest(email);
      toaster.create({
        title: "Email sent.",
        description: "Please check your email for password reset instructions.",
        type: "success",
        duration: 5000,
        closable: true,
        placement: "top",
      });
      navigate("/login");
    } catch (error) {
      console.error("Error sending email:", error); // Log error for debugging

      toaster.create({
        title: "Error.",
        description:
          error.response?.data?.message ||
          "Failed to send the recovery email. Please try again.",
        type: "error",
        duration: 5000,
        closable: true,
        placement: "top",
      });
    }
  };

  function handleChange(event) {
    setEmail(event.target.value);
  }
  return (
    <Flex
      flex="1"
      w="100vw"
      h="100vh"
      justifyContent="center"
      alignItems={"center"}
    >
      <Stack mb={{ base: "10", md: "25" }} textAlign={"center"}>
        <Heading textAlign={"center"} my={10} fontSize={["xl", "2xl", "3xl"]}>
          Recuperação de Password
        </Heading>
        <Field.Root mx="auto">
          <Field.Label textAlign={"center"}>Email</Field.Label>
          <Input
          bg="gray.700"

            type="email"
            value={email}
            name="email"
            placeholder="Enter your email"
            onChange={handleChange}
            aria-label="Email input"
            mx="auto" // Center the input field
            alignContent={"center"}
            alignItems={"center"}
            alignSelf={"center"}
            width={["60", "80%", "100%"]} // Adjust input width for small screens and larger screens
          />
        </Field.Root>

        <Button
          mt={5}
          colorPalette="teal"
          onClick={sendEmail}
          width={["60%", "80%", "100%"]} // Adjust button width for small screens and larger screens
          mx="auto" // Center the button
        >
          Recover
        </Button>
        <Button
        colorPalette="blue"
          onClick={goBack}
          width={["60%", "80%", "100%"]} // Adjust button width for small screens and larger screens
          mx="auto" // Center the button
        >
          Voltar a página anterior
        </Button>
      </Stack>
    </Flex>
  );
}

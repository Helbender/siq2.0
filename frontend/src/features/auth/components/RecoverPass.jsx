import {
  Box,
  Input,
  Stack,
  Heading,
  Button,
  Field,
} from "@chakra-ui/react";
import { toaster } from "@/utils/toaster";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "@/api/http";

export function RecoverPass() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const goBack = () => navigate("/");

  const sendEmail = async () => {
    try {
      const response = await http.post(`/api/recover/${email}`);
      console.log("Email sent response:", response); // Log response for debugging
      toaster.create({
        title: "Email sent.",
        description: "Please check your email.",
        type: "success",
        duration: 5000,
        closable: true,
        placement: "top",
      });
      navigate("/");
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
    <Box
      w={"100vw"}
      h={"70vh"}
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
    >
      <Stack mb={{ base: "10", md: "25" }} textAlign={"center"}>
        <Heading textAlign={"center"} my={10} fontSize={["xl", "2xl", "3xl"]}>
          Sistema Integrado de Qualificações
        </Heading>
        <Field.Root mx="auto">
          <Field.Label textAlign={"center"}>Email</Field.Label>
          <Input
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
          onClick={goBack}
          width={["60%", "80%", "100%"]} // Adjust button width for small screens and larger screens
          mx="auto" // Center the button
        >
          Go Back
        </Button>
      </Stack>
    </Box>
  );
}

import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  Button,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/api";

export function RecoverPass() {
  const [email, setEmail] = useState("");
  const toast = useToast();
  const navigate = useNavigate();
  const goBack = () => navigate("/");

  const sendEmail = async () => {
    try {
      const response = await api.post(`/api/recover/${email}`);
      console.log("Email sent response:", response); // Log response for debugging
      toast({
        title: "Email sent.",
        description: "Please check your email.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      navigate("/");
    } catch (error) {
      console.error("Error sending email:", error); // Log error for debugging

      toast({
        title: "Error.",
        description:
          error.response?.data?.message ||
          "Failed to send the recovery email. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
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
        <FormControl mx="auto">
          <FormLabel textAlign={"center"}>Email</FormLabel>
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
        </FormControl>

        <Button
          mt={5}
          colorScheme="teal"
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

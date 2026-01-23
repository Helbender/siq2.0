import { toaster } from "@/utils/toaster";
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  Stack,
} from "@chakra-ui/react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useEffect, useState } from "react";
import { resetPasswordRequest } from "../services/api";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toaster.create({
        title: "Invalid link",
        description: "No reset token found. Please request a new password reset.",
        type: "error",
        duration: 5000,
        closable: true,
        placement: "top",
      });
      navigate("/forgot-password");
    }
  }, [token, navigate]);
  const handleChangeNewPassword = (event) => {
    setNewPassword(event.target.value);
  };

  const handleChangeConfirmPassword = (event) => {
    setConfirmPassword(event.target.value);
  };

  const setnewpass = async (event) => {
    event.preventDefault();

    if (!token) {
      toaster.create({
        title: "Invalid token",
        description: "No reset token found. Please request a new password reset.",
        type: "error",
        duration: 5000,
        closable: true,
        placement: "top",
      });
      navigate("/forgot-password");
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      toaster.create({
        title: "Passwords do not match.",
        description:
          "Please ensure that the new password and confirmation match.",
        type: "error",
        duration: 5000,
        closable: true,
        placement: "top",
      });
      return;
    }

    if (newPassword === "") {
      toaster.create({
        title: "Password required",
        description: "Please enter a non-empty password",
        type: "error",
        duration: 5000,
        closable: true,
        placement: "top",
      });
      return;
    }

    setIsLoading(true);

    try {
      await resetPasswordRequest(token, newPassword);
      toaster.create({
        title: "Password updated.",
        description: "Your password has been updated successfully. You can now login.",
        type: "success",
        duration: 5000,
        closable: true,
        placement: "top",
      });
      navigate("/login");
    } catch (error) {
      console.error("Error resetting password:", error);
      toaster.create({
        title: "Error.",
        description:
          error.response?.data?.message ||
          "Failed to update the password. Please try again.",
        type: "error",
        duration: 5000,
        closable: true,
        placement: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      w="100vw"
      flex ="1"
      justifyContent="center"
      alignItems="center"
      p={2}
      mt="0px" // Adjust padding top as needed
    >
      <Box mb={[0, 15]}>
        {" "}
        {/* Smaller margin-bottom for small screens */}
        <Heading
          pt={20}
          pb={10}
          textAlign={"center"}
          fontSize={["2xl", "2xl", "3xl"]}
        >
          {" "}
          {/* Responsive font size */}
          Recuperação de Password
        </Heading>
      </Box>
      <Stack
        spacing={[4, 6]} // Smaller spacing for small screens
        textAlign="center"
        width="100%"
        maxWidth="md"
        alignItems="center" // Center the Stack items horizontally
      >
        <Field.Root mt={4}>
          <Field.Label textAlign="center">Nova Password</Field.Label>
          <Input
            bg="gray.700"
            type="password"
            value={newPassword}
            name="newPassword"
            placeholder="Nova Password"
            onChange={handleChangeNewPassword}
            aria-label="New Password"
            width={["80%", "60%", "100%"]} // Adjust input width for small screens and larger screens
            mx="auto" // Center the input field
          />
        </Field.Root>

        <Field.Root mt={4}>
          <Field.Label textAlign="center">Confirmar Password</Field.Label>
          <Input
            bg="gray.700"
            type="password"
            value={confirmPassword}
            name="confirmPassword"
            placeholder="Confirmar Password"
            onChange={handleChangeConfirmPassword}
            aria-label="Confirm Password"
            width={["80%", "60%", "100%"]} // Adjust input width for small screens and larger screens
            mx="auto" // Center the input field
          />
        </Field.Root>

        <Button
          mt={6}
          colorPalette="teal"
          onClick={setnewpass}
          isLoading={isLoading}
          isDisabled={isLoading || !token}
          aria-label="Reset da password"
          width={["80%", "60%", "100%"]} // Adjust button width for small screens and larger screens
          mx="auto" // Center the button
        >
          Reset da password
        </Button>
      </Stack>
      <Box
        position={"fixed"}
        bottom={0}
        w="100%"
        bg="gray.300"
        py="3"
        alignItems={"center"}
      ></Box>
    </Flex>
  );
}

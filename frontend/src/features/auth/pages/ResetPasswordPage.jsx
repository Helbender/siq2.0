import { toaster } from "@/shared/utils/toaster";
import {
  Button,
  Field,
  Flex,
  Heading,
  Input,
} from "@chakra-ui/react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useEffect, useState } from "react";
import { AuthCard } from "../components/AuthCard";
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
      w={"100%"}
      h={"100%"}
      justifyContent="center"
      alignItems={{ sm: "center", md: "top" }}
      overflowY="auto"
      position="relative"
    >
      <AuthCard mb={{ base: "10", md: "25" }} textAlign={"center"}>
        <Heading
          textAlign={"center"}
          my={10}
          color="text.primary"
          fontSize={["xl", "2xl", "3xl"]}
        >
          Recuperação de Password
        </Heading>

        <Field.Root mx="auto" w="100%">
          <Field.Label textAlign="center">Nova Password</Field.Label>
          <Input
            bg="bg.input"
            type="password"
            value={newPassword}
            name="newPassword"
            placeholder="Nova Password"
            onChange={handleChangeNewPassword}
            aria-label="New Password"
            width="100%"
            _hover={{ borderColor: "teal.500" }}
          />
        </Field.Root>

        <Field.Root mt={4} mx="auto" w="100%">
          <Field.Label textAlign="center">Confirmar Password</Field.Label>
          <Input
            bg="bg.input"
            type="password"
            value={confirmPassword}
            name="confirmPassword"
            placeholder="Confirmar Password"
            onChange={handleChangeConfirmPassword}
            aria-label="Confirm Password"
            width="100%"
            _hover={{ borderColor: "teal.500" }}
          />
        </Field.Root>

        <Button
          mt={6}
          colorPalette="teal"
          type="submit"
          onClick={setnewpass}
          isLoading={isLoading}
          isDisabled={isLoading || !token}
          aria-label="Reset da password"
          width="100%"
        >
          Reset da password
        </Button>

        <Button variant="subtle" onClick={() => navigate("/login")} width="100%">
          Voltar a página anterior
        </Button>
      </AuthCard>
    </Flex>
  );
}

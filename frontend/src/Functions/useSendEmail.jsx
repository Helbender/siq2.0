import { useState } from "react";
import axios from "axios";
import { useToast } from "@chakra-ui/react";

/**
 * Custom hook to send an email and handle the response.
 *
 * @returns {Function} sendEmail - The function to send an email.
 */
export const useSendEmail = () => {
  const toast = useToast();
  const [setLoading] = useState(true);

  /**
   * Function to send an email.
   *
   * @param {string} email - The email address to send to.
   * @param {string} endpoint - The API endpoint for sending the email.
   * @returns {Promise<void>} - A promise that resolves when the operation completes.
   */
  const sendEmail = async (email, endpoint) => {
    setLoading(true);
    try {
      const response = await axios.post(endpoint, { email });
      console.log("Email sent response:", response); // Log response for debugging
      toast({
        title: "Email sent.",
        description: "Please check your email.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
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
    } finally {
      setLoading(false);
    }
  };

  return sendEmail;
};

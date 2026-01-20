import { useState } from "react";
import axios from "axios";
import { toaster } from "./toaster";

/**
 * Custom hook to send an email and handle the response.
 *
 * @returns {Function} sendEmail - The function to send an email.
 */
export const useSendEmail = () => {
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
      toaster.create({
        title: "Email sent.",
        description: "Please check your email.",
        type: "success",
        duration: 5000,
        closable: true,
        placement: "top",
      });
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
    } finally {
      setLoading(false);
    }
  };

  return sendEmail;
};

import { Box, Button, Code, Heading, Text, VStack } from "@chakra-ui/react";
import { useEffect } from "react";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router";

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  // Log error for debugging
  useEffect(() => {
    console.error("Route Error:", error);
  }, [error]);

  let errorMessage = "An unexpected error occurred";
  let errorStatus = null;

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status;
    errorMessage = error.statusText || error.data?.message || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  }

  const handleGoHome = () => {
    navigate("/dashboard");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Box
      w="100%"
      h="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="bg.canvas"
      p={4}
    >
      <VStack spacing={6} maxW="600px" textAlign="center">
        <VStack spacing={2}>
          <Heading size="2xl" color="red.500">
            {errorStatus ? `${errorStatus} Error` : "Oops!"}
          </Heading>
          <Text fontSize="lg" color="text.secondary">
            Something went wrong
          </Text>
        </VStack>

        <Box
          bg="bg.surface"
          p={6}
          borderRadius="md"
          border="1px solid"
          borderColor="border.subtle"
          w="100%"
        >
          <VStack spacing={4} align="stretch">
            <Text fontWeight="semibold" color="text.primary">
              Error Details:
            </Text>
            <Code
              p={3}
              borderRadius="md"
              bg="bg.muted"
              color="text.primary"
              fontSize="sm"
              whiteSpace="pre-wrap"
              wordBreak="break-word"
            >
              {errorMessage}
            </Code>
          </VStack>
        </Box>

        <VStack spacing={3} w="100%">
          <Button
            onClick={handleGoHome}
            colorPalette="teal"
            size="lg"
            w="100%"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={handleGoBack}
            variant="outline"
            colorPalette="teal"
            w="100%"
          >
            Go Back
          </Button>
          <Button
            onClick={handleReload}
            variant="ghost"
            colorPalette="teal"
            w="100%"
          >
            Reload Page
          </Button>
        </VStack>

        {import.meta.env.DEV && error instanceof Error && (
          <Box
            mt={4}
            p={4}
            bg="bg.muted"
            borderRadius="md"
            w="100%"
            textAlign="left"
          >
            <Text fontSize="xs" color="text.secondary" mb={2}>
              Stack Trace (Development Only):
            </Text>
            <Code
              p={2}
              borderRadius="md"
              bg="bg.canvas"
              fontSize="xs"
              whiteSpace="pre-wrap"
              wordBreak="break-word"
              display="block"
              maxH="200px"
              overflowY="auto"
            >
              {error.stack}
            </Code>
          </Box>
        )}
      </VStack>
    </Box>
  );
}

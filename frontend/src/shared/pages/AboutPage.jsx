import { Text, Box, Stack, Heading, Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export function AboutPage() {
  const navigate = useNavigate();

  const goBack = () => navigate("/");

  return (
    <Box
      w="100vw"
      h="70vh"
      display="flex"
      flexDirection="column"
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
          Sistema Integrado de Qualificações
        </Heading>
      </Box>
      <Stack
        spacing={[4, 6]} // Smaller spacing for small screens
        textAlign="center"
        width="100%"
        maxWidth="md"
        alignItems="center" // Center the Stack items horizontally
      >
        <Text fontSize={["md", "lg", "xl"]}>
          <strong>Desenvolvido por dois grandes Elefantes:</strong>
        </Text>
        <Text fontSize={["md", "lg", "xl"]}>Cap. PilAv Tiago Branco</Text>
        <Text fontSize={["md", "lg", "xl"]}>Maj. PilAv Pedro Andrade</Text>
        <Text fontSize={["md", "lg", "xl"]} mt={4}>
          Elefantes - Sobre as asas ínclitas da Fama
        </Text>
        <Button
          mt={5}
          colorPalette="teal"
          onClick={goBack}
          width={["80%", "60%", "100%"]} // Adjust button width for small screens and larger screens
          mx="auto" // Center the button
        >
          Go Back
        </Button>
      </Stack>
    </Box>
  );
}

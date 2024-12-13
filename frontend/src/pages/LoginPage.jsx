/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/prop-types */
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  Button,
  Link,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../Contexts/AuthContext";

function LoginPage() {
  const { removeToken, setToken } = useContext(AuthContext);

  const [loginForm, setloginForm] = useState({
    nip: "",
    password: "",
  });
  const navigate = useNavigate();
  const toast = useToast();
  const navigateRecover = () => navigate("/recover");

  const [timeoutId, setTimeoutId] = useState(null);

  const startTimeout = (delay) => {
    if (timeoutId) {
      clearTimeout(timeoutId); // Clear any existing timeout
    }

    // Set a new timeout
    const id = setTimeout(() => {
      console.log("Timeout executed!");
      removeToken();
      navigate("/");
    }, delay);

    // Store the new timeout ID
    setTimeoutId(id);
  };

  function logMeIn(event) {
    axios({
      method: "POST",
      url: "/api/token",
      data: {
        nip: loginForm.nip,
        password: loginForm.password,
      },
    })
      .then((response) => {
        setToken(response.data.access_token);
        startTimeout(1 * 60 * 60 * 1000);
        navigate("/");
      })
      .catch((error) => {
        if (error.response) {
          const errorMessage = error.response.data?.message;

          toast({
            title: "Login failed.",
            description: errorMessage,
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "top",
          });
          console.log(error.response);
          console.log(error.response.status);
          console.log(error.response.headers);
        }
      });

    event.preventDefault();
  }
  function handleChange(event) {
    const { value, name } = event.target;
    setloginForm((prev) => ({ ...prev, [name]: value }));
  }
  return (
    <Box
      w={"100vw"}
      h={"100vh"}
      display={"flex"}
      justifyContent={"center"}
      alignItems={{ sm: "center", md: "top" }}
      overflowY="auto"
    >
      <Stack>
        <Heading mb={"25px"}>Esquadra 502</Heading>
        <FormControl>
          <FormLabel textAlign={"center"}>NIP</FormLabel>
          <Input
            type="text"
            value={loginForm.nip}
            name="nip"
            placeholder="NIP"
            onChange={handleChange}
          />
        </FormControl>

        <FormControl mt="2">
          <FormLabel textAlign={"center"}>Password</FormLabel>
          <Input
            type="password"
            value={loginForm.password}
            name="password"
            placeholder="Password"
            onChange={handleChange}
          />
        </FormControl>
        <Link
          mt={4}
          color="teal.500"
          fontWeight="bold"
          onClick={navigateRecover}
          aria-label="Recover Password"
          width={["80%", "60%", "100%"]} // Adjust link width for small screens and larger screens
          textAlign="center"
        >
          Recover Password
        </Link>
        <Button mt="10" onClick={logMeIn}>
          Login
        </Button>
      </Stack>
    </Box>
  );
}

export default LoginPage;

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
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "../Contexts/AuthContext";
import { api } from "../utils/api";

function LoginPage() {
  const { setToken } = useContext(AuthContext);

  const [loginForm, setloginForm] = useState({
    nip: "",
    password: "",
  });
  const navigate = useNavigate();
  const toast = useToast();
  const navigateRecover = () => navigate("/recover");

  const logMeIn = async (e) => {
    e.preventDefault();
    toast({
      title: "A efetuar login.",
      description: "Agarde um momento.",
      status: "loading",
      duration: 5000,
      isClosable: true,
      position: "bottom",
    });
    try {
      const data = {
        nip: loginForm.nip,
        password: loginForm.password,
      };
      const response = await api.post("/api/token", data);
      if (response.status === 201) {
        toast.closeAll();
        const decodedToken = jwtDecode(response.data.access_token);

        toast({
          title: "Logado com sucesso.",
          description: `Login efetuado como ${decodedToken.name}`,

          status: "success",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
        // console.log(response);
        // console.log(response.data.access_token);
        setToken(response.data.access_token);
        navigate("/flights");
      }
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data?.message;
        toast.closeAll();
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
    }
  };
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          logMeIn();
        }}
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
          <FormControl mt="2" onSubmit={logMeIn}>
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
          <Button mt="10" onClick={logMeIn} type="submit">
            Login
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

export default LoginPage;

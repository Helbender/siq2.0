import {
  Box,
  Button,
  Flex,
  Heading,
  Link as ChakraLink,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  VStack,
  Divider,
  Spacer,
  DrawerFooter,
  useColorMode,
  Image,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { MdSpaceDashboard } from "react-icons/md";
import {
  FaInfoCircle,
  FaInstagram,
  FaBars,
  FaSignOutAlt,
  FaPlaneArrival,
  FaTable,
  FaTh,
  FaTools,
  FaUsers,
} from "react-icons/fa";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "../Contexts/AuthContext";
import { LuSun } from "react-icons/lu";
import { IoMoon } from "react-icons/io5";

function Header() {
  const { token, removeToken, getUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();

  const User = getUser();
  const handleLogout = async () => {
    try {
      const response = await axios.post("/api/logout");
      console.log(response.status);
      navigate("/");
      removeToken();
    } catch (error) {
      removeToken();
      navigate("/");
      if (error.response) {
        console.log(error.response);
        console.log(error.response.status);
        console.log(error.response.headers);
      }
    }
  };

  return (
    <Box
      as="header"
      w="100%"
      bg="teal.500"
      color="white"
      p={4}
      boxShadow="md"
      position="fixed"
      top={0}
      left={0}
      zIndex={1000}
    >
      <Flex align="center" justify="space-between">
        {/* Menu Button on the Left */}
        <IconButton
          icon={<FaBars />}
          variant="outline"
          color="white"
          onClick={onOpen}
          aria-label="Open Menu"
          mr={4} // Adds margin to the right of the button
        />

        {/* Centered Heading */}
        <Flex flex="1" justify="center">
          <Heading
            size="lg"
            cursor="pointer"
            textAlign={"center"}
            onClick={() => navigate("/")}
          >
            Sistema Integrado de Qualificações
          </Heading>
        </Flex>
        {/* Right Side Button Theme */}
        <Flex display={{ base: "none", sm: "block" }}>
          <Button onClick={toggleColorMode}>
            {colorMode === "light" ? <IoMoon /> : <LuSun />}
          </Button>
        </Flex>
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay>
            <DrawerContent>
              <DrawerCloseButton />
              {token ? (
                //Drawer render if logged in
                <>
                  <DrawerHeader flexDirection={"row"}>
                    <Flex flexDirection={"row"} pr={10}>
                      <Box>
                        <Heading
                          size="sm"
                          color="teal.500"
                          mt="10"
                          cursor="pointer"
                          onClick={() => {
                            navigate("/");
                            onClose();
                          }}
                        >
                          Bem-vindo,
                        </Heading>
                        <Heading
                          size="md"
                          mt="0"
                          color={"teal.500"}
                          cursor="pointer"
                          onClick={() => {
                            navigate("/");
                            onClose();
                          }}
                        >
                          {User.name}
                        </Heading>
                        <Heading size="sm" mt="0" color={"teal.700"}>
                          {User.admin ? "Admin" : ""}
                        </Heading>
                      </Box>
                      <Spacer />
                      <Image
                        src="/Esquadra_502.png"
                        alt="Logo"
                        boxSize="50px"
                        alignSelf={"center"}
                        objectFit="cover"
                      />
                    </Flex>
                  </DrawerHeader>
                  <DrawerBody>
                    <VStack align="flex-start" h="100%">
                      <ChakraLink
                        p={2}
                        color="teal.500"
                        fontSize="lg"
                        onClick={() => {
                          navigate("/dashboard");
                          onClose();
                        }}
                        aria-label="Dashboard"
                      >
                        <Flex align="center">
                          <MdSpaceDashboard />
                          <Box ml={2}>Dashboard</Box>
                        </Flex>
                      </ChakraLink>
                      <ChakraLink
                        p={2}
                        color="teal.500"
                        fontSize="lg"
                        onClick={() => {
                          navigate("/flights");
                          onClose();
                        }}
                        aria-label="Voos"
                      >
                        <Flex align="center">
                          <FaPlaneArrival />
                          <Box ml={2}>Voos</Box>
                        </Flex>
                      </ChakraLink>
                      <ChakraLink
                        p={2}
                        color="teal.500"
                        fontSize="lg"
                        onClick={() => {
                          navigate("/piloto");
                          onClose();
                        }}
                        aria-label="Qualificações"
                      >
                        <Flex align="center">
                          <FaTable />
                          <Box ml={2}>Qualificações</Box>
                        </Flex>
                      </ChakraLink>
                      <ChakraLink
                        p={2}
                        color="teal.500"
                        fontSize="lg"
                        onClick={() => {
                          navigate("/piloto-table");
                          onClose();
                        }}
                        aria-label="Tabela de Qualificações"
                      >
                        <Flex align="center">
                          <FaTh />
                          <Box ml={2}>Tabela de Qualificações</Box>
                        </Flex>
                      </ChakraLink>

                      {User.admin ? (
                        <ChakraLink
                          p={2}
                          color="teal.500"
                          fontSize="lg"
                          onClick={() => {
                            navigate("/qualificacoes");
                            onClose();
                          }}
                        >
                          <Flex align="center">
                            <FaTools />

                            <Box ml={2}>Gerir Qualificações</Box>
                          </Flex>
                        </ChakraLink>
                      ) : null}

                      {User.admin ? (
                        <ChakraLink
                          p={2}
                          color="teal.500"
                          fontSize="lg"
                          onClick={() => {
                            navigate("/users");
                            onClose();
                          }}
                        >
                          <Flex align="center">
                            <FaUsers />

                            <Box ml={2}>Utilizadores</Box>
                          </Flex>
                        </ChakraLink>
                      ) : (
                        <ChakraLink
                          p={2}
                          color="teal.500"
                          fontSize="lg"
                          onClick={() => {
                            navigate("/users");
                            onClose();
                          }}
                        >
                          <Flex align="center">
                            <FaUsers />

                            <Box ml={2}>Utilizador</Box>
                          </Flex>
                        </ChakraLink>
                      )}

                      <Spacer />
                      <ChakraLink
                        p={2}
                        color="teal.500"
                        fontSize="lg"
                        onClick={() => {
                          handleLogout();
                          onClose();
                        }}
                        aria-label="Logout"
                      >
                        <Flex align={"center"}>
                          <FaSignOutAlt /> <Box ml={2}>Logout</Box>
                        </Flex>
                      </ChakraLink>
                      {/* Horizontal line above Logout */}
                      <Divider borderWidth="1px" borderColor={"teal.500"} />
                    </VStack>
                  </DrawerBody>
                </>
              ) : (
                //Drawer render if not logged in

                <DrawerHeader>
                  <Heading
                    size="sm"
                    fontSize="sm"
                    color="teal.500"
                    mt="10"
                    textAlign="center"
                  >
                    Por favor efetue o seu login
                  </Heading>
                </DrawerHeader>
              )}

              <DrawerFooter>
                <Flex
                  direction="row"
                  textAlign={"center"}
                  justify={"center"}
                  align="center"
                  w="100%"
                >
                  <ChakraLink
                    p={2}
                    color="teal.500"
                    fontSize="lg"
                    onClick={() => {
                      navigate("/about");
                      onClose();
                    }}
                    aria-label="About"
                  >
                    <Flex align="center">
                      <FaInfoCircle />
                      <Box ml={2}>About</Box>
                    </Flex>
                  </ChakraLink>
                  <ChakraLink
                    p={2}
                    color="teal.500"
                    fontSize="lg"
                    href="https://www.instagram.com/esquadra502/"
                    isExternal
                    aria-label="Instagram"
                    onClick={onClose}
                  >
                    <Flex align="center">
                      <FaInstagram />
                      <Box ml={2}>Instagram</Box>
                    </Flex>
                  </ChakraLink>
                </Flex>
              </DrawerFooter>
            </DrawerContent>
          </DrawerOverlay>
        </Drawer>
      </Flex>
    </Box>
  );
}

export default Header;

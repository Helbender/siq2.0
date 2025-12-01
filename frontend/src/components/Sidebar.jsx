import React, { useState } from "react";
import {
  Box,
  Flex,
  IconButton,
  Text,
  Tooltip,
  VStack,
  useColorModeValue,
  Link as ChakraLink,
  Spacer,
  Divider,
} from "@chakra-ui/react";
import { FiHome, FiUser, FiSettings, FiLogOut } from "react-icons/fi";
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

const navItems = [
  { label: "Dashboard", icon: MdSpaceDashboard, to: "/dashboard" },
  { label: "Voos", icon: FaPlaneArrival, to: "/flights" },
  { label: "Qualificações", icon: FaTable, to: "/piloto" },
  { label: "Tabela de Qualificações", icon: FaTh, to: "/piloto-table" },
  { label: "Gerir Qualificações", icon: FaTools, to: "/qualificacoes" },
  { label: "Utilizadores", icon: FaUsers, to: "/users" },
  // { label: "About", icon: FaInfoCircle, to: "/about" },
  // {
  //   label: "Instagram",
  //   icon: FaInstagram,
  //   to: "https://www.instagram.com/esquadra502/",
  // },
  // { label: "Logout", icon: FaSignOutAlt, to: "/logout" },
];

const Sidebar = () => {
  const { token, removeToken, getUser } = useContext(AuthContext);

  const navigate = useNavigate();

  const [isHovered, setIsHovered] = useState(false);
  const bg = useColorModeValue("gray.100", "gray.900");

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
    <Flex
      direction="column"
      as="nav"
      pos="fixed"
      left={0}
      top={"75px"}
      h="calc(95vh - 75px)"
      bg={bg}
      w={isHovered ? "250px" : "60px"}
      // w="250px"
      transition="width 0.2s ease"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      boxShadow="md"
      zIndex={1000}
    >
      <VStack align="stretch" spacing={0} mt={0}>
        {navItems.map(({ label, icon: Icon, to }) => (
          <ChakraLink
            // href={to}
            key={label}
            p={2}
          >
            <ChakraLink
              p={2}
              color="teal.500"
              fontSize="lg"
              onClick={() => {
                navigate(to);
              }}
              aria-label={label}
            >
              <Flex align="center">
                <Icon />
                {isHovered && <Box ml={2}>{label}</Box>}
              </Flex>
            </ChakraLink>
          </ChakraLink>
        ))}
      </VStack>
      <Spacer />
      <ChakraLink
        p={2}
        color="teal.500"
        fontSize="lg"
        onClick={() => {
          handleLogout();
        }}
        aria-label="Logout"
      >
        <Flex align={"center"}>
          <FaSignOutAlt /> {isHovered && <Box ml={2}>Logout</Box>}
        </Flex>
      </ChakraLink>
      <Divider borderWidth="1px" borderColor={"teal.500"} />
      <Flex
        // display={isHovered ? "flex" : "none"}
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
          }}
          aria-label="About"
        >
          <Flex align="center">
            <FaInfoCircle />
            {isHovered && <Box ml={2}>About</Box>}
          </Flex>
        </ChakraLink>
        <ChakraLink
          p={2}
          color="teal.500"
          fontSize="lg"
          href="https://www.instagram.com/esquadra502/"
          isExternal
          aria-label="Instagram"
        >
          <Flex align="center">
            <FaInstagram />
            {isHovered && <Box ml={2}>Instagram</Box>}
          </Flex>
        </ChakraLink>
      </Flex>
    </Flex>
  );
};

export default Sidebar;

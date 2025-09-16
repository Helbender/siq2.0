import { Link, useLocation } from "react-router-dom";
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Container,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import api from "../utils/api";

const Navbar = () => {
  const [tipos, setTipos] = useState([]);
  const location = useLocation();
  const selected_style = {
    bg: "purple.600",
    borderRadius: 10,
    color: "black",
    fontWeight: "bold",
  };
  useMemo(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/v2/listas");
        setTipos(res.data.tipos);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);
  return (
    <Container maxW={"80%"} my={10}>
      <Box
        px={5}
        // my={4}
        // mx={10}
        borderRadius={20}
        bg={useColorModeValue("gray.400", "gray.700")}
      >
        <Flex
          h="16"
          alignItems={"center"}
          gap={3}
          justifyContent={"space-around"}
        >
          {/* Left Side*/}
          <Breadcrumb separator={"-"}>
            {tipos.map((tipo) => (
              <BreadcrumbItem key={tipo}>
                <BreadcrumbLink
                  p={2}
                  as={Link}
                  to={tipo.toLowerCase().replace(" ", "-")}
                  sx={
                    location.pathname ===
                    `/${tipo.toLowerCase().replace(" ", "-")}`
                      ? selected_style
                      : null
                  }
                >
                  {tipo}
                </BreadcrumbLink>
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        </Flex>
      </Box>
    </Container>
  );
};

export default Navbar;

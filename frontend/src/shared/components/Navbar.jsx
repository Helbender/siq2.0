import { Link, useLocation } from "react-router-dom";
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Container,
  Flex,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import api from "@/utils/api";

export function Navbar() {
  const [tipos, setTipos] = useState([]);
  const location = useLocation();
  const selected_style = {
    bg: "purple.600",
    borderRadius: 10,
    color: "text.primary",
    fontWeight: "bold",
  };

  // Check if we're on a table page (path ends with -table)
  const isTablePage = location.pathname.endsWith("-table");

  // Helper function to normalize tipo to path format
  const normalizeTipo = (tipo) => {
    return tipo
      .toLowerCase()
      .replace(" ", "-")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
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
        borderRadius={20}
        bg="bg.card-strong"
      >
        <Flex
          h="16"
          alignItems={"center"}
          gap={3}
          justifyContent={"space-around"}
        >
          {/* Left Side*/}
          <Breadcrumb separator={"-"}>
            {tipos.map((tipo) => {
              const normalizedTipo = normalizeTipo(tipo);
              const basePath = `/${normalizedTipo}`;
              const tablePath = `${basePath}-table`;
              const linkPath = isTablePage ? tablePath : basePath;
              const currentPath = isTablePage ? tablePath : basePath;

              return (
                <BreadcrumbItem key={tipo}>
                  <BreadcrumbLink
                    p={2}
                    as={Link}
                    to={linkPath}
                    sx={
                      location.pathname === currentPath ? selected_style : null
                    }
                  >
                    {tipo}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              );
            })}
          </Breadcrumb>
        </Flex>
      </Box>
    </Container>
  );
};

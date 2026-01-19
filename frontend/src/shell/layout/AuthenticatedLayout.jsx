import { Navbar } from "@/shell/components/Navbar";
import { Box, Flex } from "@chakra-ui/react";
import { Outlet } from "react-router";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function AuthenticatedLayout() {
  return (
    <Flex direction="column" h="100vh" bg="#1A202C" overflow="hidden">
      <Header />
      
      <Flex flex="1" overflow="hidden" position="relative">
        <Navbar />
        
        <Box flex="1" bg="#1A202C" overflow="auto" minW="0">
          <Outlet />
        </Box>
      </Flex>
      
      <Footer />
    </Flex>
  );
}

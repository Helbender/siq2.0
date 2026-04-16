import { BackgroundWithOrbs } from "@/layout/components/BackgroundWithOrbs";
import { Footer } from "@/layout/components/Footer";
import { Sidebar } from "@/layout/components/Sidebar";
import { TopBar } from "@/layout/components/TopBar";
import { Box, Flex } from "@chakra-ui/react";
import { Outlet } from "react-router";

export function AuthenticatedLayout() {
  return (
    <Box position="relative" h="100vh" overflow="visible">
      <BackgroundWithOrbs />
      <Flex h="100vh" overflow="hidden" position="relative" bg="transparent">
        <Sidebar />
        <Flex
          direction="column"
          flex="1"
          minW="0"
          overflow="hidden"
          position="relative"
          bg="transparent"
        >
          <TopBar />
          <Box flex="1" overflow="auto" p={6} bg="transparent">
            <Outlet />
          </Box>
          <Footer />
        </Flex>
      </Flex>
    </Box>
  );
}

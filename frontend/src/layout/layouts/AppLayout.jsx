import { BackgroundWithOrbs } from "@/layout/components/BackgroundWithOrbs";
import { Box, Flex } from "@chakra-ui/react";
import { Outlet } from "react-router";
import { Footer } from "../components/Footer";
import { TopBar } from "../components/TopBar";
export function Layout() {
  return (
    <Box position="relative" h="100vh" overflow="visible">
      <BackgroundWithOrbs />
      {/* <Flex h="100vh" overflow="hidden" position="relative" bg="transparent"> */}
      {/* <Sidebar /> */}
      <Flex
        direction="column"
        flex="1"
        minW="0"
        h="100vh"
        overflow="hidden"
        position="relative"
        bg="transparent"
      >
        <TopBar />
        {/* <Box flex="1" overflow="auto" p={6} bg="transparent"> */}
        <Outlet />
        {/* </Box> */}
        <Footer />
      </Flex>
      {/* </Flex> */}
      {/* <Header />
      <Outlet />
      <Footer /> */}
    </Box>
  );
}

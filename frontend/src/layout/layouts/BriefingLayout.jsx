import { BackgroundWithOrbs } from "@/layout/components/BackgroundWithOrbs";
import { TopBar } from "@/layout/components/TopBar";
import { Box, Flex } from "@chakra-ui/react";
import { Outlet } from "react-router";

export function BriefingLayout() {
  return (
    <Box position="relative" h="100vh" overflow="hidden">
      <BackgroundWithOrbs />
      <Flex
        direction="column"
        h="100vh"
        position="relative"
        bg="transparent"
        overflow="hidden"
      >
        <TopBar showHome />
        <Box flex="1" overflow="auto" px={4} py={3} bg="transparent">
          <Outlet />
        </Box>
      </Flex>
    </Box>
  );
}

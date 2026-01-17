import { Navbar } from "@/shared/components/Navbar";
import { Outlet } from "react-router-dom";
import { Box } from "@chakra-ui/react";

export function Master() {
  return (
    <Box w="100vw">
      <Navbar />
      <Outlet />
    </Box>
  );
}

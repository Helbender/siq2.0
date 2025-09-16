import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import { Box } from "@chakra-ui/react";

export default function Master() {
  return (
    <Box w="100vw">
      <Navbar />
      <Outlet />
    </Box>
  );
}

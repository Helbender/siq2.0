import { Box } from "@chakra-ui/react";
import { Outlet } from "react-router";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function Layout() {
  return (
  <Box>
    <Header />
    <Outlet />
    <Footer />
  </Box>)
}

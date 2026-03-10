import { Flex } from "@chakra-ui/react";
import { Outlet } from "react-router";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";

export function Layout() {
  return (
    <Flex direction="column" h="100vh" bg="#1A202C" overflow="hidden">
      <Header />
      <Outlet />
      <Footer />
    </Flex>
  );
}

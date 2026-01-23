import { Flex } from "@chakra-ui/react";
import { Outlet } from "react-router";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function Layout() {
  return (
<Flex direction="column" h="100vh" bg="#1A202C" overflow="hidden">
    <Header />
    <Outlet />
    <Footer />
  </Flex>)
}

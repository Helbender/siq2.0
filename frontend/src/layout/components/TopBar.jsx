import { ColorModeButton } from "@/components/ui/color-mode";
import { getPageTitle } from "@/layout/constants/pageTitles";
import { Box, Flex, Heading } from "@chakra-ui/react";
import { useLocation } from "react-router";

export function TopBar() {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <Box
      as="header"
      w="100%"
      bg="bg.card"
      backdropFilter="blur(10px)"
      WebkitBackdropFilter="blur(10px)"
      borderBottom="1px solid"
      borderColor="border.subtle"
      px={6}
      py={4}
      flexShrink={0}
    >
      <Flex align="center" justify="space-between" gap={5}>
        <Heading size="lg" fontWeight="600" color="text.primary">
          {pageTitle}
        </Heading>

        <ColorModeButton
          size="md"
          color="text.secondary"
          _hover={{ bg: "bg.cardSubtle", color: "text.primary" }}
        />
      </Flex>
    </Box>
  );
}

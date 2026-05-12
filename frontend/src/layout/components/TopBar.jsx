import { ColorModeButton } from "@/components/ui/color-mode";
import { getPageTitle } from "@/layout/constants/pageTitles";
import { Box, Flex, Heading, IconButton } from "@chakra-ui/react";
import { MdHome } from "react-icons/md";
import { useLocation, useNavigate } from "react-router";

export function TopBar({ showHome = false }) {
  const location = useLocation();
  const navigate = useNavigate();
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

        <Flex align="center" gap={2}>
          {showHome && (
            <IconButton
              aria-label="Ir para Dashboard"
              variant="ghost"
              size="md"
              color="text.secondary"
              _hover={{ bg: "bg.cardSubtle", color: "text.primary" }}
              onClick={() => navigate("/dashboard")}
            >
              <MdHome />
            </IconButton>
          )}
          <ColorModeButton
            size="md"
            color="text.secondary"
            _hover={{ bg: "bg.cardSubtle", color: "text.primary" }}
          />
        </Flex>
      </Flex>
    </Box>
  );
}

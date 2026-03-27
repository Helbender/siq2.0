import { useAuth } from "@features/auth";
import { Box, Link as ChakraLink, Flex, Separator, Spacer, Text } from "@chakra-ui/react";
import { FaInfoCircle, FaSignOutAlt } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "@/layout/constants/navItems";

export function Navbar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userRoleLevel = user?.roleLevel || user?.role?.level;

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (item.minLevel !== undefined) {
      if (!userRoleLevel || userRoleLevel < item.minLevel) {
        return false;
      }
    }
    return true;
  });

  const navItemStyles = {
    p: 2,
    borderRadius: "md",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 3,
    transition: "all 0.2s ease",
    _hover: {
      transform: "translateX(4px)",
      color: "white",
    },
  };

  return (
    <Flex
      direction="column"
      w="230px"
      h="100%"
      bg="bg.surface"
      flexShrink={0}
    >
      {user && (
        <Box px={3} py={2}>
          <Text
            color="brand.500"
            fontSize="sm"
            fontWeight="semibold"
            textAlign="left"
          >
            Welcome, {user.name}
          </Text>
        </Box>
      )}
      <Separator borderWidth="1px" borderColor="border.subtle" mb={2} mx={2} />
      {filteredNavItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink key={item.path} to={item.path} end>
            {({ isActive }) => (
              <Box
                {...navItemStyles}
                bg={isActive ? "brand.600" : "transparent"}
                color={isActive ? "white" : "brand.500"}
                _hover={{
                  ...navItemStyles._hover,
                  bg: isActive ? "brand.700" : "gray.600",
                }}
              >
                <Icon style={{ fontSize: "20px" }} />
                <Box as="span">{item.label}</Box>
              </Box>
            )}
          </NavLink>
        );
      })}

      <Spacer />
      <NavLink to="/about">
        {({ isActive }) => (
          <Box
            {...navItemStyles}
            bg={isActive ? "brand.600" : "transparent"}
            color={isActive ? "white" : "brand.500"}
            _hover={{
              ...navItemStyles._hover,
              bg: isActive ? "brand.700" : "gray.600",
            }}
          >
            <FaInfoCircle style={{ fontSize: "20px" }} />
            <Box as="span">About</Box>
          </Box>
        )}
      </NavLink>
      <Separator borderWidth="1px" borderColor="border.subtle" mt={2} mx={2} />

      <ChakraLink
        onClick={handleLogout}
        m={1}
        p={2}
        borderRadius="md"
        bg="transparent"
        color="brand.500"
        _hover={{
          bg: "red.600",
          color: "white",
          transform: "translateX(4px)",
        }}
        cursor="pointer"
        display="flex"
        alignItems="center"
        gap={3}
        transition="all 0.2s ease"
      >
        <FaSignOutAlt style={{ fontSize: "20px" }} />
        <Box as="span">Logout</Box>
      </ChakraLink>
    </Flex>
  );
}

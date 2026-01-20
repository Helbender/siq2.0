import { useAuth } from "@/features/auth/contexts/AuthContext";
import { Box, Link as ChakraLink, Flex, Separator, Spacer, Text } from "@chakra-ui/react";
import {
  FaInfoCircle,
  FaSignOutAlt
} from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "../contants/navItems";



export function Navbar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userRoleLevel = user?.roleLevel || user?.role?.level;

  // Filter navigation items based on user role level
  const filteredNavItems = NAV_ITEMS.filter((item) => {
    // If item requires a minimum level, check user's role
    if (item.minLevel !== undefined) {
      // Only show if user is loaded and has sufficient role level
      if (!userRoleLevel || userRoleLevel < item.minLevel) {
        return false;
      }
    }
    return true;
  });

  return (
    <Flex
      direction="column"
      w="230px"
      h="100%"
      bg="gray.700"
      // borderRight="1px solid"
      // borderColor="gray.00"
      flexShrink={0}
    >
      {/* <VStack align="stretch" spacing={0} p={2}> */}
        {user && (
          <Box px={3} py={2}>
            <Text
              color="teal.500"
              fontSize="sm"
              fontWeight="semibold"
              textAlign="left"
            >
              Welcome, {user.name}
            </Text>
          </Box>
        )}
        <Separator borderWidth="1px" borderColor="teal.400" mb={2} mx={2}/>
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <NavLink key={item.path} to={item.path} end>
              {({ isActive }) => (
                <Box
                  p={2}
                  borderRadius="md"
                  bg={isActive ? "teal.600" : "transparent"}
                  color={isActive ? "white" : "teal.500"}
                  _hover={{
                    bg: isActive ? "teal.700" : "gray.800",
                    color: "white",
                  }}
                  cursor="pointer"
                  display="flex"
                  alignItems="center"
                  gap={3}
                  transition="all 0.2s"
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
              p={2}
              borderRadius="md"
              bg={isActive ? "teal.600" : "transparent"}
              color={isActive ? "white" : "teal.500"}
              _hover={{
                bg: isActive ? "teal.700" : "gray.700",
                color: "white",
              }}
              cursor="pointer"
              display="flex"
              alignItems="center"
              gap={3}
              transition="all 0.2s"
            >
              <FaInfoCircle style={{ fontSize: "20px" }} />
              <Box as="span">About</Box>
            </Box>
          )}
        </NavLink>
        <Separator borderWidth="1px" borderColor="teal.400" mt={2} mx={2}/>
        
        
        <ChakraLink
          onClick={handleLogout}
          m={1}
          p={2}
          borderRadius="md"
          bg="transparent"
          color="teal.500"
          _hover={{
            bg: "red.600",
            color: "white",
          }}
          cursor="pointer"
          display="flex"
          alignItems="center"
          gap={3}
          transition="all 0.2s"
        >
          <FaSignOutAlt style={{ fontSize: "20px" }} />
          <Box as="span">Logout</Box>
        </ChakraLink>
      {/* </VStack> */}
    </Flex>
  );
}

import React, { useState } from "react";
import {
  Box,
  Flex,
  IconButton,
  Text,
  Tooltip,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiHome, FiUser, FiSettings, FiLogOut } from "react-icons/fi";

const navItems = [
  { label: "Home", icon: FiHome },
  { label: "Profile", icon: FiUser },
  { label: "Settings", icon: FiSettings },
  { label: "Logout", icon: FiLogOut },
];

const Sidebar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const bg = useColorModeValue("gray.100", "gray.900");

  return (
    <Box
      as="nav"
      pos="fixed"
      left={0}
      top={"75px"}
      h="100vh"
      bg={bg}
      w={isHovered ? "200px" : "60px"}
      transition="width 0.2s ease"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      boxShadow="md"
      zIndex={1000}
    >
      <VStack align="stretch" spacing={2} mt={4}>
        {navItems.map(({ label, icon: Icon }) => (
          <Tooltip
            label={label}
            placement="right"
            isDisabled={isHovered}
            key={label}
          >
            <Flex
              align="center"
              px={4}
              py={2}
              role="group"
              cursor="pointer"
              _hover={{ bg: useColorModeValue("gray.200", "gray.700") }}
            >
              <IconButton
                aria-label={label}
                icon={<Icon />}
                variant="ghost"
                fontSize="xl"
                isRound
              />
              {isHovered && (
                <Text ml={4} fontSize="md">
                  {label}
                </Text>
              )}
            </Flex>
          </Tooltip>
        ))}
      </VStack>
    </Box>
  );
};

export default Sidebar;

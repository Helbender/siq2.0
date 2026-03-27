import { NAV_ITEMS } from "@/layout/constants/navItems";
import { sidebarRecipe } from "@/theme2/recipes/sidebar.recipe";
import {
  Box,
  chakra,
  Flex,
  Spacer,
  Text,
  useSlotRecipe,
  VStack,
} from "@chakra-ui/react";
import { useAuth } from "@features/auth";
import { FaInfoCircle, FaSignOutAlt } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";

function getInitials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Sidebar() {
  const recipe = useSlotRecipe({ recipe: sidebarRecipe });
  const [recipeProps, restProps] = recipe.splitVariantProps({});
  const styles = recipe(recipeProps);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const userRoleLevel = user?.roleLevel ?? user?.role?.level;
  const mainItems = NAV_ITEMS.filter((item) => {
    if (
      item.minLevel != null &&
      (!userRoleLevel || userRoleLevel < item.minLevel)
    )
      return false;
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <chakra.aside
      css={[styles.root, { display: "flex", flexDirection: "column" }]}
      {...restProps}
    >
      <Flex css={styles.header}>
        <Box css={styles.logo} aria-hidden>
          S
        </Box>
        <Text css={styles.logoText}>SIQ 2.0</Text>
      </Flex>

      <VStack align="stretch" gap="0" flex="1" overflow="auto" css={styles.nav}>
        <Box css={styles.section}>
          <Text as="span" css={styles.sectionTitle}>
            Menu principal
          </Text>
          <VStack align="stretch" gap="1">
            {mainItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/dashboard"}
                >
                  {({ isActive }) => (
                    <chakra.div
                      css={[
                        styles.item,
                        isActive && { bg: "brand.600", color: "white" },
                      ]}
                      data-active={isActive || undefined}
                      as="span"
                      display="flex"
                      alignItems="center"
                    >
                      <Box as={Icon} css={styles.itemIcon} flexShrink={0} />
                      <Box as="span">{item.label}</Box>
                    </chakra.div>
                  )}
                </NavLink>
              );
            })}
          </VStack>
        </Box>
        <Spacer />
        <Box css={styles.section} mt="0">
          <Text as="span" css={styles.sectionTitle}>
            Conta
          </Text>
          <VStack align="stretch" gap="1">
            <NavLink to="/about">
              {({ isActive }) => (
                <chakra.div
                  css={[
                    styles.item,
                    isActive && { bg: "brand.600", color: "white" },
                  ]}
                  data-active={isActive || undefined}
                  as="span"
                  display="flex"
                  alignItems="center"
                >
                  <Box as={FaInfoCircle} css={styles.itemIcon} flexShrink={0} />
                  <Box as="span">About</Box>
                </chakra.div>
              )}
            </NavLink>
            <chakra.button
              type="button"
              css={styles.item}
              onClick={handleLogout}
              textAlign="left"
              w="100%"
              border="none"
              bg="transparent"
              _hover={{ bg: "red.600", color: "white" }}
            >
              <Box as={FaSignOutAlt} css={styles.itemIcon} flexShrink={0} />
              <Box as="span">Logout</Box>
            </chakra.button>
          </VStack>
        </Box>
      </VStack>

      <Box css={styles.footer} mt="auto">
        <Flex css={styles.user}>
          <Box css={styles.userAvatar} aria-hidden>
            {user ? getInitials(user.name) : "?"}
          </Box>
          <Box css={styles.userInfo}>
            <Text css={styles.userName}>{user?.name ?? "Utilizador"}</Text>
            <Text css={styles.userRole}>
              {user?.role?.name ?? user?.role ?? "—"}
            </Text>
          </Box>
        </Flex>
      </Box>
    </chakra.aside>
  );
}

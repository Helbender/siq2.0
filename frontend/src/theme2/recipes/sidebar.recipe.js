import { defineSlotRecipe } from "@chakra-ui/react";

// Glass Admin: sidebar with glass bg, blur, section titles, nav link hover/active
export const sidebarRecipe = defineSlotRecipe({
  className: "sidebar",
  slots: [
    "root",
    "header",
    "logo",
    "logoText",
    "nav",
    "section",
    "sectionTitle",
    "item",
    "itemIcon",
    "badge",
    "footer",
    "user",
    "userAvatar",
    "userInfo",
    "userName",
    "userRole",
  ],

  base: {
    root: {
      width: "280px",
      bg: "bg.card",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRight: "1px solid",
      borderColor: "border.subtle",
      h: "100vh",
      p: "6",
      overflowY: "auto",
      transition: "all 0.3s ease",
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: "3",
      pb: "8",
      borderBottom: "1px solid",
      borderColor: "border.subtle",
      mb: "8",
    },
    logo: {
      width: "45px",
      height: "45px",
      background:
        "linear-gradient(135deg, var(--chakra-colors-emerald-500), var(--chakra-colors-gold-200))",
      borderRadius: "lg",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "700",
      fontSize: "xl",
      color: "white",
      boxShadow: "0 8px 32px rgba(5, 150, 105, 0.3)",
    },
    logoText: {
      fontSize: "xl",
      fontWeight: "600",
      background:
        "linear-gradient(135deg, var(--chakra-colors-emerald-400), var(--chakra-colors-gold-200))",
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
    },
    nav: {
      flex: 1,
    },
    section: {
      mb: "6",
    },
    sectionTitle: {
      fontSize: "2xs",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "wider",
      color: "text.muted",
      mb: "3",
      pl: "4",
    },
    item: {
      display: "flex",
      alignItems: "center",
      gap: "3.5",
      px: "4",
      py: "3.5",
      color: "text.secondary",
      borderRadius: "lg",
      transition: "all 0.2s ease",
      cursor: "pointer",
      fontWeight: "500",
      _hover: {
        bg: "bg.cardSubtle",
        color: "text.primary",
      },
      "&[data-active]": {
        bg: "bg.cardSubtle",
        color: "text.primary",
      },
    },
    itemIcon: {
      width: "22px",
      height: "22px",
      opacity: 0.8,
      "[data-active] &": { opacity: 1 },
      ".sidebar-item:hover &": { opacity: 1 },
    },
    badge: {
      ml: "auto",
      background:
        "linear-gradient(135deg, var(--chakra-colors-gold-200), var(--chakra-colors-amber-500))",
      color: "white",
      fontSize: "2xs",
      fontWeight: "600",
      px: "2",
      py: "1",
      borderRadius: "full",
    },
    footer: {
      pt: "5",
      borderTop: "1px solid",
      borderColor: "border.subtle",
    },
    user: {
      display: "flex",
      alignItems: "center",
      gap: "3",
      p: "3",
      borderRadius: "lg",
      cursor: "pointer",
      transition: "background 0.2s ease",
      _hover: {
        bg: "bg.cardSubtle",
      },
    },
    userAvatar: {
      width: "42px",
      height: "42px",
      borderRadius: "lg",
      background:
        "linear-gradient(135deg, var(--chakra-colors-emerald-500), var(--chakra-colors-gold-200))",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "600",
      fontSize: "md",
      color: "white",
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontWeight: "500",
      fontSize: "sm",
      color: "text.primary",
    },
    userRole: {
      fontSize: "xs",
      color: "text.muted",
    },
  },

  variants: {
    variant: {
      default: {},
    },
  },

  defaultVariants: {
    variant: "default",
  },
});

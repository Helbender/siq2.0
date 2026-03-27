import { defineSlotRecipe } from "@chakra-ui/react";

// Glass Admin: glass dialog — blur backdrop, glass card content, top highlight line
export const dialogRecipe = defineSlotRecipe({
  className: "chakra-dialog",
  slots: [
    "root",
    "backdrop",
    "positioner",
    "content",
    "header",
    "closeTrigger",
    "title",
    "body",
    "footer",
  ],

  base: {
    backdrop: {
      bg: "rgba(0, 0, 0, 0.55)",
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
    },
    positioner: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      bg: "bg.surface",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid",
      borderColor: "border.subtle",
      borderRadius: "card",
      overflow: "hidden",
      boxShadow: "floating",
      position: "relative",
      _before: {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "1px",
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
        pointerEvents: "none",
      },
    },
    header: {
      px: "6",
      py: "4",
      bg: "emerald.700",
      borderBottom: "1px solid",
      borderColor: "border.subtle",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      textAlign: "center",
      fontWeight: "bold",
      fontSize: "lg",
      color: "text.primary",
    },
    body: {
      px: "6",
      py: "5",
      color: "text.secondary",
    },
    footer: {
      px: "6",
      py: "4",
      borderTop: "1px solid",
      borderColor: "border.subtle",
      display: "flex",
      gap: "3",
      justifyContent: "flex-end",
    },
    closeTrigger: {
      color: "text.muted",
      borderRadius: "lg",
      transition: "all 0.2s ease",
      _hover: {
        color: "text.primary",
        bg: "bg.cardSubtle",
      },
    },
  },
});

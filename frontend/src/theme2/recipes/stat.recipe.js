import { defineSlotRecipe } from "@chakra-ui/react";

export const statRecipe = defineSlotRecipe({
  className: "chakra-stat",
  slots: [
    "root",
    "label",
    "valueText",
    "valueUnit",
    "helpText",
    "upIndicator",
    "downIndicator",
  ],

  base: {
    root: {
      display: "flex",
      flexDirection: "column",
      gap: "1",
    },
    label: {
      fontSize: "sm",
      color: "text.muted",
      fontWeight: "medium",
    },
    valueText: {
      fontSize: "2xl",
      fontWeight: "bold",
      color: "text.primary",
      display: "flex",
      alignItems: "baseline",
      gap: "1",
    },
    valueUnit: {
      fontSize: "sm",
      color: "text.muted",
      fontWeight: "normal",
    },
    helpText: {
      fontSize: "xs",
      color: "text.muted",
    },
  },

  variants: {
    variant: {
      glass: {
        root: {
          bg: "bg.card",
          borderRadius: "card",
          border: "1px solid",
          borderColor: "border.subtle",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          p: 4,
          position: "relative",
          overflow: "hidden",
          transition: "all 0.3s ease",
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
          _hover: {
            bg: "bg.cardSubtle",
            borderColor: "rgba(255, 255, 255, 0.15)",
            boxShadow: "0 0 40px rgba(52, 211, 153, 0.1)",
          },
        },
      },
    },
  },
});

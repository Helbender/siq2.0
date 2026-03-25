import { defineSlotRecipe } from "@chakra-ui/react";

// Glass Admin: segment group like .card-btn (glass, active = emerald border)
export const segmentGroupSlotRecipe = defineSlotRecipe({
  className: "chakra-segment-group",
  slots: ["root", "item", "indicator"],

  base: {
    root: {
      "--segment-radius": "12px",
      borderRadius: "var(--segment-radius)",
      display: "inline-flex",
      bg: "bg.cardSubtle",
      border: "1px solid",
      borderColor: "border.subtle",
      p: "1",
      gap: "1",
      isolation: "isolate",
      position: "relative",
    },
    item: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      userSelect: "none",
      fontSize: "sm",
      px: "4",
      py: "2",
      borderRadius: "sm",
      color: "text.secondary",
      transition: "all 0.2s ease",
      cursor: "pointer",
      _hover: {
        color: "text.primary",
      },
      "&[data-state=checked]": {
        bg: "bg.card",
        border: "1px solid",
        borderColor: "border.focus",
        color: "text.primary",
      },
      _disabled: {
        opacity: 0.5,
      },
    },
    indicator: {
      display: "none",
    },
  },

  variants: {
    size: {
      sm: {
        item: {
          px: "3",
          py: "1.5",
          fontSize: "xs",
        },
      },
      md: {
        item: {
          px: "4",
          py: "2",
          fontSize: "sm",
        },
      },
      lg: {
        item: {
          px: "5",
          py: "2.5",
          fontSize: "md",
        },
      },
    },
  },

  defaultVariants: {
    size: "md",
  },
});

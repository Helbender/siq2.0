import { defineRecipe } from "@chakra-ui/react";

// Glass Admin: primary = emerald gradient, secondary = glass
export const buttonRecipe = defineRecipe({
  base: {
    borderRadius: "button",
    fontWeight: "500",
    transition: "all 0.2s ease",
    fontFamily: "var(--font-outfit, inherit)",
    _focusVisible: {
      outline: "2px solid",
      outlineColor: "border.focus",
    },
  },

  variants: {
    variant: {
      solid: {
        // bg: "brand.600",
        color: "white",
        boxShadow: "glass",
        _hover: {
          transform: "translateY(-2px)",
          boxShadow: "0 12px 32px rgba(5, 150, 105, 0.4)",
        },
      },

      subtle: {
        bg: "bg.card",
        border: "1px solid",
        borderColor: "border.subtle",
        color: "text.default",
        backdropFilter: "blur(10px)",
        _hover: {
          bg: "bg.cardSubtle",
          borderColor: "border.focus",
        },
      },

      ghost: {
        color: "text.secondary",
        _hover: {
          bg: "bg.cardSubtle",
          color: "text.primary",
        },
      },

      danger: {
        bg: "red.600",
        color: "white",
        _hover: {
          bg: "red.700",
        },
      },

      success: {
        bg: "green.400",
        color: "white",
        _hover: {
          bg: "green.500",
        },
      },

      edit: {
        bg: "gold.200",
        color: "gray.900",
        _hover: {
          bg: "gold.100",
        },
      },
    },

    size: {
      sm: {
        px: "3",
        h: "32px",
        fontSize: "sm",
      },
      md: {
        px: "4",
        h: "40px",
        fontSize: "sm",
      },
      lg: {
        px: "6",
        h: "48px",
        fontSize: "md",
      },
    },
  },

  defaultVariants: {
    variant: "solid",
    size: "md",
  },
});

import { defineRecipe } from "@chakra-ui/react";

// Glass Admin: glass input, emerald focus ring
export const inputRecipe = defineRecipe({
  base: {
    bg: "bg.card",
    color: "text.primary",
    appearance: "none",
    borderRadius: "input",
    border: "1px solid",
    borderColor: "border.subtle",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    transition: "all 0.2s ease",
    _placeholder: {
      color: "text.muted",
    },
    _focusVisible: {
      outline: "none",
      borderColor: "border.focus",
      boxShadow: "focus",
    },
  },

  variants: {
    variant: {
      outline: {
        bg: "bg.card",
        borderColor: "border.subtle",
      },
      subtle: {
        border: "none",
        bg: "bg.cardSubtle",
      },
      readOnly: {
        bg: "bg.disabled",
        cursor: "not-allowed",
        borderColor: "border.strong",
      },
    },
    size: {
      sm: {
        h: "32px",
        px: "3",
        fontSize: "sm",
      },
      md: {
        h: "40px",
        px: "4",
        fontSize: "sm",
      },
      lg: {
        h: "48px",
        px: "5",
        fontSize: "md",
      },
    },
  },

  defaultVariants: {
    variant: "outline",
    size: "md",
  },
});

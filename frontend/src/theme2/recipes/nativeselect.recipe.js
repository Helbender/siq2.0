import { defineSlotRecipe } from "@chakra-ui/react";

// Glass Admin: glass native select, emerald focus ring — matches .form-input styling
export const nativeSelectRecipe = defineSlotRecipe({
  className: "native-select",
  slots: ["root", "field", "indicator"],

  base: {
    root: {
      position: "relative",
      width: "full",
    },
    field: {
      width: "full",
      appearance: "none",
      bg: "bg.card",
      color: "text.primary",
      border: "1px solid",
      borderColor: "border.subtle",
      borderRadius: "input",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      transition: "all 0.2s ease",
      _placeholder: { color: "text.muted" },
      _focusVisible: {
        outline: "none",
        borderColor: "border.focus",
        boxShadow: "focus",
      },
      _disabled: {
        opacity: 0.5,
        cursor: "not-allowed",
      },
      "& option": {
        bg: "gray.800",
        color: "text.primary",
      },
    },
    indicator: {
      color: "text.muted",
      pointerEvents: "none",
    },
  },

  variants: {
    variant: {
      outline: {
        field: {
          bg: "bg.card",
          borderColor: "border.subtle",
        },
      },
      subtle: {
        field: {
          border: "none",
          bg: "bg.cardSubtle",
        },
      },
    },
    size: {
      sm: {
        field: { h: "32px", px: "3", fontSize: "sm" },
      },
      md: {
        field: { h: "40px", px: "4", fontSize: "sm" },
      },
      lg: {
        field: { h: "48px", px: "5", fontSize: "md" },
      },
    },
  },

  defaultVariants: {
    variant: "outline",
    size: "md",
  },
});

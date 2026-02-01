import { defineRecipe } from "@chakra-ui/react";
export const inputRecipe = defineRecipe({
  className: "input",
  base: {
    bg: "bg.cardSubtle",
    borderRadius: "md",
    border: "1px solid",
    borderColor: "border.subtle",
    color: "text.primary",
    _placeholder: { color: "text.muted" },
    textAlign: "center",
  },
  variants: {
    variant: {
      filled: {},
      readOnly: {
        bg: "bg.disabled",
        cursor: "not-allowed",
        borderColor: "border.strong",
      },
    },
  },
  defaultVariants: {
    variant: "filled",
  },
});

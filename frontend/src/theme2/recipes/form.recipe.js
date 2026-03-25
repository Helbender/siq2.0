import { defineSlotRecipe } from "@chakra-ui/react";

// Glass Admin: form section matching .form-group, .form-label, .form-input
export const formRecipe = defineSlotRecipe({
  className: "formsection",
  slots: ["root", "label", "helperText", "errorText", "requiredIndicator"],

  base: {
    root: {
      display: "flex",
      flexDirection: "column",
      gap: "2",
      mb: "6",
    },
    label: {
      fontSize: "sm",
      fontWeight: "500",
      color: "text.secondary",
    },
    helperText: {
      fontSize: "xs",
      color: "text.muted",
    },
    errorText: {
      fontSize: "xs",
      color: "danger.solid",
    },
  },

  variants: {
    variant: {
      default: {},
      inline: {
        root: {
          flexDirection: "row",
          alignItems: "center",
        },
      },
    },
  },

  defaultVariants: {
    variant: "default",
  },
});

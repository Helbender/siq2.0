import { defineSlotRecipe } from "@chakra-ui/react";

export const nativeSelectRecipe = defineSlotRecipe({
  className: "native-select",
  slots: ["root", "field", "indicator"],
  base: {
    root: {
      color: "text.primary",
      _placeholder: { color: "text.muted" },
      border: "1px solid",
      borderColor: "border.subtle",
      borderRadius: "md",
      bg: "bg.cardSubtle",
    },
    field: {
      border: "1px solid",
      borderColor: "border.subtle",
      borderRadius: "md",
    },
    indicator: {
      color: "text.primary",
      bg: "bg.white",
    },
  },
});

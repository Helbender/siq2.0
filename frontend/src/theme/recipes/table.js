import { defineSlotRecipe } from "@chakra-ui/react";

export const tableRecipe = defineSlotRecipe({
  slots: ["root", "header", "body", "row", "cell", "columnHeader"],
  base: {
    root: {
      width: "100%",
      striped: true,
    },

    columnHeader: {
      color: "text.primary",
      fontWeight: "bold",
    },

    cell: {
      color: "text.primary",
    },

    row: {
      _hover: {
        bg: "bg.muted",
      },
    },
  },
});

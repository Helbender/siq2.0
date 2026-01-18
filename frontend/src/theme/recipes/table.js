import { defineSlotRecipe } from "@chakra-ui/react";

export const tableRecipe = defineSlotRecipe({
  slots: ["root", "header", "body", "row", "cell", "columnHeader"],
  base: {
    root: {
      width: "100%",
      striped: true,
      textAlign: "center",
      alignItems: "center",
    },
      _hover: {
        bg: "bg.muted",
      },
    header: {
      bg: "teal.500",
      // color: "text.primary",
      // fontWeight: "bold",
      // _hover: {
        //   bg: "teal.500",
        // },
      },
      body: {
        border: "1px solid",
        borderColor: "border.subtle",
      },
      row: {
        padding: "2",
        border: "1px solid",
        borderColor: "border.subtle",
      },
      columnHeader: {
      padding: "2",
      color: "text.primary",
      fontWeight: "bold",
      fontSize: "lg",
    },

    cell: {
      color: "text.primary",
    },

  },
});

import { defineSlotRecipe } from "@chakra-ui/react";

export const dialogRecipe = defineSlotRecipe({
  slots: ["root", "backdrop", "positioner", "content", "header", "closeTrigger", "title", "body", "footer"],
  base: {
    root: {
    //   bg: "bg.canvas",
      border: "1px solid",
padding:"0",
      borderColor: "border.subtle",
      borderRadius: "lg",
      overflow: "hidden",
    },

    backdrop: {
      bg: "blackAlpha.500",
    },
    title: {
      color: "text.inverted",
      fontWeight: "bold",
      fontSize: "lg",
      textAlign: "center",
    },
    header: {
      bg: "teal.300",
      fontWeight: "bold",
      fontSize: "lg",
      textAlign: "center",
      justifyContent: "center",
      p:"2",
      m:"0",
    },
    content: {
      padding: "2",
      bg: "bg.surface",
      color: "text.secondary",
    },
  },
});

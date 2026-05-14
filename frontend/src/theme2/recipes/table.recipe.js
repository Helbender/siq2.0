import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * Glass Admin table – matches templatemo users.html / .data-table
 * Translucent rows, uppercase muted headers, row hover (glass-hover), no grid lines.
 */
export const tableRecipe = defineSlotRecipe({
  className: "chakra-table",
  slots: ["root", "header", "body", "row", "cell", "columnHeader", "wrapper"],

  base: {
    root: {
      width: "100%",
      minW: "700px",
      borderCollapse: "separate",
      borderSpacing: "0",
    },
    wrapper: {
      overflowX: "auto",
      margin: "0 -10px",
      padding: "0 10px",
    },
    header: {
      borderBottom: "1px solid",
      borderColor: "border.subtle",
    },
    columnHeader: {
      px: "4",
      py: "4",
      textAlign: "left",
      fontSize: "xs",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      color: "text.muted",
    },
    body: {},
    row: {
      transition: "background 0.2s ease",
      borderBottom: "1px solid",
      borderColor: "rgba(255, 255, 255, 0.03)",
      _hover: {
        bg: "bg.cardSubtle",
      },
    },
    cell: {
      px: "4",
      py: "4",
      fontSize: "sm",
      color: "text.secondary",
    },
  },

  variants: {
    variant: {
      default: {},
      simple: {
        row: {
          borderBottom: "1px solid",
          borderColor: "rgba(255, 255, 255, 0.03)",
          _hover: {
            bg: "bg.cardSubtle",
          },
        },
      },
      glass: {
        row: {
          _hover: {
            bg: "bg.cardSubtle",
          },
        },
      },
    },
    size: {
      sm: {
        columnHeader: {
          px: "3",
          py: "3",
          fontSize: "2xs",
        },
        cell: {
          px: "3",
          py: "3",
          fontSize: "xs",
        },
      },
      md: {},
      lg: {
        columnHeader: {
          px: "5",
          py: "5",
        },
        cell: {
          px: "5",
          py: "5",
          fontSize: "md",
        },
      },
    },
  },

  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

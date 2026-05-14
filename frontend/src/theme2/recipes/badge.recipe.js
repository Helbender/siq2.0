import { defineRecipe } from "@chakra-ui/react";

// Glass Admin: status badges with dot (completed, pending, processing, etc.)
export const badgeRecipe = defineRecipe({
  base: {
    borderRadius: "full",
    fontWeight: "500",
    fontSize: "xs",
    px: "3",
    py: "1.5",
    display: "inline-flex",
    alignItems: "center",
    gap: "1.5",
    // _before: {
    //   content: '""',
    //   width: "6px",
    //   height: "6px",
    //   borderRadius: "full",
    // },
  },

  variants: {
    variant: {
      outline: {},
      solid: {},
      subtle: {},
      surface: {},
      plain: {},
      success: {
        bg: "success.subtle",
        color: "success.solid",
        _before: {
          bg: "success.solid",
          boxShadow: "0 0 8px var(--chakra-colors-green-400)",
        },
      },
      completed: {
        bg: "success.subtle",
        color: "success.solid",
        _before: {
          bg: "success.solid",
          boxShadow: "0 0 8px var(--chakra-colors-green-400)",
        },
      },
      warning: {
        bg: "warning.subtle",
        color: "warning.solid",
        _before: {
          bg: "warning.solid",
          boxShadow: "0 0 8px var(--chakra-colors-yellow-500)",
        },
      },
      pending: {
        bg: "warning.subtle",
        color: "warning.solid",
        _before: {
          bg: "warning.solid",
          boxShadow: "0 0 8px var(--chakra-colors-yellow-500)",
        },
      },
      error: {
        bg: "danger.subtle",
        color: "danger.solid",
        _before: {
          bg: "danger.solid",
        },
      },
      info: {
        bg: "info.subtle",
        color: "info.solid",
        _before: {
          bg: "info.solid",
          boxShadow: "0 0 8px var(--chakra-colors-blue-500)",
        },
      },
      processing: {
        bg: "info.subtle",
        color: "info.solid",
        _before: {
          bg: "info.solid",
          boxShadow: "0 0 8px var(--chakra-colors-blue-500)",
        },
      },
      edit: {
        bg: "edit.subtle",
        color: "edit.solid",
        _before: {
          bg: "edit.solid",
        },
      },
      gold: {
        bg: "rgba(212, 165, 116, 0.2)",
        color: "gold.200",
        _before: {
          bg: "gold.200",
        },
      },
    },
  },

  defaultVariants: {
    variant: "info",
  },
});

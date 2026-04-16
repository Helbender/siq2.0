import { defineSlotRecipe } from "@chakra-ui/react";

// Glass Admin: status-colored alerts with glass bg and border accent
export const alertRecipe = defineSlotRecipe({
  className: "chakra-alert",
  slots: ["root", "title", "description", "icon", "indicator", "spinner"],

  base: {
    root: {
      borderRadius: "lg",
      border: "1px solid",
      px: "4",
      py: "3",
      display: "flex",
      alignItems: "flex-start",
      gap: "3",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
    },
    title: {
      fontWeight: "600",
      fontSize: "sm",
    },
    description: {
      fontSize: "sm",
      mt: "1",
      color: "text.secondary",
    },
    icon: {
      flexShrink: 0,
      mt: "0.5",
    },
    indicator: {
      flexShrink: 0,
    },
  },

  variants: {
    status: {
      info: {
        root: { bg: "info.subtle", borderColor: "info.solid" },
        title: { color: "info.solid" },
        icon: { color: "info.solid" },
        indicator: { color: "info.solid" },
      },
      success: {
        root: { bg: "success.subtle", borderColor: "success.solid" },
        title: { color: "success.solid" },
        icon: { color: "success.solid" },
        indicator: { color: "success.solid" },
      },
      warning: {
        root: { bg: "warning.subtle", borderColor: "warning.solid" },
        title: { color: "warning.solid" },
        icon: { color: "warning.solid" },
        indicator: { color: "warning.solid" },
      },
      error: {
        root: { bg: "danger.subtle", borderColor: "danger.solid" },
        title: { color: "danger.solid" },
        icon: { color: "danger.solid" },
        indicator: { color: "danger.solid" },
      },
    },
  },

  defaultVariants: {
    status: "info",
  },
});

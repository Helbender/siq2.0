import { defineSemanticTokens } from "@chakra-ui/react";

export const baseSemanticTokens = defineSemanticTokens({
  colors: {
    bg: {
      canvas: { value: "{colors.gray.900}" },
      surface: { value: "{colors.gray.800}" },
      muted: { value: "{colors.gray.800}" },
    },

    text: {
      primary: { value: "{white}" },
      secondary: { value: "{colors.gray.300}" },
      muted: { value: "{colors.gray.400}" },
    },

    border: {
      subtle: { value: "{colors.gray.800}" },
      focus: { value: "{colors.blue.300}" },
    },

    success: {
      solid: { value: "{colors.green.400}" },
      subtle: { value: "{colors.green.900}" },
    },

    warning: {
      solid: { value: "{colors.orange.400}" },
      subtle: { value: "{colors.orange.900}" },
    },

    danger: {
      solid: { value: "{colors.red.400}" },
      subtle: { value: "{colors.red.900}" },
    },
  },
});

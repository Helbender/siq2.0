import { defineSemanticTokens } from "@chakra-ui/react";

// Glass Admin: Emerald & Gold luxury, glassmorphism, deep forest / light canvas
export const baseSemanticTokens = defineSemanticTokens({
  colors: {
    bg: {
      canvas: {
        value: { _light: "{colors.bgLight}", _dark: "{colors.bgDark}" },
      },
      surface: {
        value: {
          _light: "{colors.bgLightGradient1}",
          _dark: "{colors.bgGradient2}",
        },
      },
      card: {
        value: {
          _light: "rgba(255, 255, 255, 0.6)",
          _dark: "rgba(255, 255, 255, 0.05)",
        },
      },
      cardSubtle: {
        value: {
          _light: "rgba(255, 255, 255, 0.3)",
          _dark: "rgba(255, 255, 255, 0.08)",
        },
      },
      panel: {
        value: {
          _light: "rgba(0, 0, 0, 0.06)",
          _dark: "{colors.bgGradient2}",
        },
      },
      muted: {
        value: { _light: "{colors.gray.600}", _dark: "{colors.gray.500}" },
      },
      disabled: {
        value: {
          _light: "rgba(255,255,255,0.3)",
          _dark: "rgba(255,255,255,0.3)",
        },
      },
    },

    text: {
      primary: {
        value: { _light: "colors.black", _dark: "#f5f5f4" },
      },
      secondary: {
        value: { _light: "rgba(26,26,26,0.7)", _dark: "rgba(245,245,244,0.7)" },
      },
      muted: {
        value: { _light: "rgba(26,26,26,0.5)", _dark: "rgba(245,245,244,0.4)" },
      },
      inverted: { value: "{colors.gray.900}" },
      default: {
        value: { _light: "#1a1a1a", _dark: "#f5f5f4" },
      },
    },

    border: {
      subtle: {
        value: {
          _light: "rgba(0,0,0,0.1)",
          _dark: "rgba(255, 255, 255, 0.1)",
        },
      },
      strong: {
        value: {
          _light: "rgba(0,0,0,0.15)",
          _dark: "rgba(255, 255, 255, 0.15)",
        },
      },
      emphasized: {
        value: {
          _light: "rgba(0,0,0,0.15)",
          _dark: "rgba(255, 255, 255, 0.15)",
        },
      },
      focus: { value: "{colors.emerald.400}" },
    },

    brand: {
      50: { value: "{colors.emerald.50}" },
      100: { value: "{colors.emerald.100}" },
      200: { value: "{colors.emerald.200}" },
      300: { value: "{colors.emerald.300}" },
      400: { value: "{colors.emerald.400}" },
      500: { value: "{colors.emerald.500}" },
      600: { value: "{colors.emerald.600}" },
      700: { value: "{colors.emerald.700}" },
      800: { value: "{colors.emerald.800}" },
      900: { value: "{colors.emerald.900}" },
    },

    success: {
      solid: { value: "{colors.green.400}" },
      subtle: { value: "rgba(34, 197, 94, 0.15)" },
    },

    warning: {
      solid: { value: "{colors.amber.400}" },
      subtle: { value: "rgba(234, 179, 8, 0.15)" },
    },

    danger: {
      solid: { value: "{colors.red.600}" },
      subtle: { value: "rgba(255, 107, 107, 0.15)" },
    },

    info: {
      solid: { value: "{colors.blue.500}" },
      subtle: { value: "rgba(59, 130, 246, 0.15)" },
    },

    edit: {
      solid: { value: "{colors.gold.200}" },
      subtle: { value: "{colors.amber.500}" },
    },
  },
});

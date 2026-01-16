import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    semanticTokens: {
      colors: {
        // Background colors
        "bg.subtle": {
          value: { _light: "{colors.gray.50}", _dark: "{colors.gray.900}" },
        },
        "bg.muted": {
          value: { _light: "{colors.gray.100}", _dark: "{colors.gray.800}" },
        },
        "bg.card": {
          value: { _light: "{colors.white}", _dark: "{colors.gray.800}" },
        },
        "bg.card-subtle": {
          value: { _light: "{colors.gray.200}", _dark: "{colors.gray.700}" },
        },
        "bg.card-muted": {
          value: { _light: "{colors.gray.300}", _dark: "{colors.gray.600}" },
        },
        "bg.card-strong": {
          value: { _light: "{colors.gray.400}", _dark: "{colors.gray.700}" },
        },
        // Border colors
        "border.subtle": {
          value: { _light: "{colors.gray.200}", _dark: "{colors.gray.600}" },
        },
        "border.muted": {
          value: { _light: "{colors.gray.300}", _dark: "{colors.gray.600}" },
        },
        "border.strong": {
          value: { _light: "{colors.gray.400}", _dark: "{colors.gray.500}" },
        },
        // Text colors
        "text.muted": {
          value: { _light: "{colors.gray.600}", _dark: "{colors.gray.400}" },
        },
        "text.default": {
          value: { _light: "{colors.black}", _dark: "{colors.white}" },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);


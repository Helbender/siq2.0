import { createSystem, defaultConfig } from "@chakra-ui/react";
import {
  alertRecipe,
  badgeRecipe,
  buttonRecipe,
  cardRecipe,
  dialogRecipe,
  formRecipe,
  inputRecipe,
  nativeSelectRecipe,
  segmentGroupSlotRecipe,
  sidebarRecipe,
  tableRecipe,
  tabsSlotRecipe,
} from "./recipes";
import { baseSemanticTokens } from "./semantic-tokens/base";
import { colors } from "./tokens/colors";
import { fonts } from "./tokens/fonts";
import { radii } from "./tokens/radii";
import { shadows } from "./tokens/shadows";

export const system = createSystem(defaultConfig, {
  globalCss: {
    body: {
      fontFamily: "'Outfit', sans-serif",
      bg: "transparent",
      color: "text.primary",
      minHeight: "100vh",
      lineHeight: 1.6,
    },
    "html, body": {
      overflowX: "hidden",
    },
  },
  theme: {
    keyframes: {
      float: {
        "0%, 100%": { transform: "translate(0, 0) scale(1)" },
        "25%": { transform: "translate(30px, -30px) scale(1.05)" },
        "50%": { transform: "translate(-20px, 20px) scale(0.95)" },
        "75%": { transform: "translate(20px, 10px) scale(1.02)" },
      },
    },
    semanticTokens: {
      colors: baseSemanticTokens.colors,
    },
    tokens: {
      colors,
      fonts,
      radii,
      shadows,
    },
    recipes: {
      button: buttonRecipe,
      input: inputRecipe,
      badge: badgeRecipe,
    },
    slotRecipes: {
      card: cardRecipe,
      table: tableRecipe,
      sidebar: sidebarRecipe,
      formSection: formRecipe,
      segmentGroup: segmentGroupSlotRecipe,
      tabs: tabsSlotRecipe,
      nativeSelect: nativeSelectRecipe,
      dialog: dialogRecipe,
      alert: alertRecipe,
    },
  },
});

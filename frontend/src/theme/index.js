import { createSystem, defaultConfig } from "@chakra-ui/react";
import { colors } from "./colors";
import { dialogRecipe } from "./recipes/dialog";
import { tableRecipe } from "./recipes/table";
import { baseSemanticTokens } from "./semantic-tokens/base";
const system = createSystem(defaultConfig, {
  theme: {
    tokens: {colors},
    semanticTokens: {
      colors: {
        ...baseSemanticTokens.colors,
      },
    },
    recipes: {
      text: {
        base: {
          color: "text.default",
        },
      },
    },
    slotRecipes: {
      table: tableRecipe,
      dialog: dialogRecipe,
    },
  },
});

export default system;

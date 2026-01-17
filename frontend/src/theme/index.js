import { createSystem, defaultConfig } from "@chakra-ui/react";
import { baseSemanticTokens } from "./semantic-tokens/base";
import { tableRecipe } from "./recipes/table";

const system = createSystem(defaultConfig, {
  theme: {
    semanticTokens: {
      colors: {
        ...baseSemanticTokens.colors,
      },
    },
    recipes: {
      text: {
        base: {
          color: "text.primary",
        },
      },
    },
    slotRecipes: {
      table: tableRecipe,
    },
  },
});

export default system;

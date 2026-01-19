import { createSystem, defaultConfig } from "@chakra-ui/react";
import { dialogRecipe } from "./recipes/dialog";
import { tableRecipe } from "./recipes/table";
import { baseSemanticTokens } from "./semantic-tokens/base";

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

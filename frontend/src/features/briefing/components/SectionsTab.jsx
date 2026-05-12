import { sidebarRecipe } from "@/theme2/recipes/sidebar.recipe";
import {
  Box,
  Button,
  chakra,
  HStack,
  Text,
  useSlotRecipe,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import {
  FaBinoculars,
  FaBoxOpen,
  FaBuilding,
  FaBus,
  FaCogs,
  FaLifeRing,
  FaShieldAlt,
  FaTshirt,
} from "react-icons/fa";

const SECTIONS = [
  { key: "Secretaria", label: "Secretaria", icon: FaBuilding },
  { key: "OPS", label: "Operações", icon: FaCogs },
  { key: "UNIF", label: "Uniformização", icon: FaTshirt },
  { key: "SAM", label: "Apoio e Mobilidade", icon: FaBus },
  { key: "LOG", label: "Logística", icon: FaBoxOpen },
  { key: "SPA", label: "Seg. e Prev. de Acidentes", icon: FaShieldAlt },
  { key: "SAR", label: "Busca e Salvamento", icon: FaLifeRing },
  { key: "VIMAR", label: "Vigilância Marítima", icon: FaBinoculars },
];

function SectionsTab() {
  const recipe = useSlotRecipe({ recipe: sidebarRecipe });
  const [recipeProps] = recipe.splitVariantProps({});
  const styles = recipe(recipeProps);

  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, SECTIONS.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
  }

  function advance() {
    setActiveIndex((i) => Math.min(i + 1, SECTIONS.length - 1));
  }

  return (
    <VStack align="stretch" gap={4} pt={4}>
      <Box
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        outline="none"
        _focusVisible={{ outline: "none" }}
      >
        <VStack align="stretch" gap="1">
          {SECTIONS.map(({ key, label, icon: Icon }, index) => {
            const isActive = index === activeIndex;
            return (
              <chakra.div
                key={key}
                css={[
                  styles.item,
                  isActive && { bg: "brand.600", color: "white" },
                ]}
                data-active={isActive || undefined}
                onClick={() => setActiveIndex(index)}
              >
                <Box as={Icon} css={styles.itemIcon} flexShrink={0} />
                <Box as="span">{label}</Box>
              </chakra.div>
            );
          })}
        </VStack>
      </Box>

      <HStack justify="center" gap={3}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveIndex((i) => Math.max(i - 1, 0))}
          disabled={activeIndex === 0}
        >
          ↑ Anterior
        </Button>
        <Text fontSize="sm" color="fg.muted">
          {activeIndex + 1} / {SECTIONS.length}
        </Text>
        <Button
          size="sm"
          variant="outline"
          onClick={advance}
          disabled={activeIndex === SECTIONS.length - 1}
        >
          Próximo ↓
        </Button>
      </HStack>
    </VStack>
  );
}

export default SectionsTab;

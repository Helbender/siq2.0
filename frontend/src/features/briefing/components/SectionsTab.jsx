import { useEffect, useRef, useState } from "react";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";

const SECTIONS = [
  "Secretaria",
  "OPS",
  "UNIF",
  "SAM",
  "LOG",
  "SPA",
  "SAR",
  "VIMAR",
];

function SectionsTab() {
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
        <VStack align="stretch" gap={0}>
          {SECTIONS.map((section, index) => {
            const isActive = index === activeIndex;
            return (
              <Box
                key={section}
                px={4}
                py={3}
                cursor="pointer"
                onClick={() => setActiveIndex(index)}
                bg={isActive ? "blue.500" : "transparent"}
                borderRadius="md"
                transition="background 0.15s"
                _hover={{ bg: isActive ? "blue.500" : "bg.subtle" }}
              >
                <Text
                  fontSize={isActive ? "2xl" : "md"}
                  fontWeight={isActive ? "bold" : "normal"}
                  color={isActive ? "white" : "fg"}
                  transition="all 0.15s"
                  letterSpacing={isActive ? "wide" : "normal"}
                >
                  {section}
                </Text>
              </Box>
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

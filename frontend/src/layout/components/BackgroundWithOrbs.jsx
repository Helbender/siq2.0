import { useColorModeValue } from "@/components/ui/color-mode";
import { Box } from "@chakra-ui/react";
import { createPortal } from "react-dom";

/**
 * Template-style background: gradient base + soft radial tints + floating blurred orbs
 * (emerald, gold, coral) so glass components get a green/glow look from behind.
 * Rendered via portal under body so it's never clipped by layout overflow.
 */
const gradientBgDark =
  "linear-gradient(135deg, #0d1a14 0%, #132419 50%, #1a2e23 100%)";
const gradientBgLight =
  "linear-gradient(135deg, #f3fbf6 0%, #ecf7f1 50%, #f7fbff 100%)";

const radialOverlayDark =
  "radial-gradient(ellipse 80% 50% at 20% 40%, rgba(5, 150, 105, 0.12) 0%, transparent 50%), " +
  "radial-gradient(ellipse 60% 40% at 80% 60%, rgba(212, 165, 116, 0.1) 0%, transparent 50%), " +
  "radial-gradient(ellipse 50% 30% at 50% 80%, rgba(224, 122, 95, 0.08) 0%, transparent 50%)";
const radialOverlayLight =
  "radial-gradient(ellipse 80% 50% at 20% 40%, rgba(16, 185, 129, 0.1) 0%, transparent 50%), " +
  "radial-gradient(ellipse 60% 40% at 80% 60%, rgba(245, 158, 11, 0.08) 0%, transparent 50%), " +
  "radial-gradient(ellipse 50% 30% at 50% 80%, rgba(251, 146, 60, 0.06) 0%, transparent 50%)";

const orbBase = {
  position: "fixed",
  borderRadius: "full",
  filter: "blur(80px)",
  animation: "float 20s ease-in-out infinite",
  pointerEvents: "none",
};

export function BackgroundWithOrbs() {
  const gradientBg = useColorModeValue(gradientBgLight, gradientBgDark);
  const radialOverlay = useColorModeValue(
    radialOverlayLight,
    radialOverlayDark,
  );
  const orb1Color = useColorModeValue("emerald.300", "emerald.500");
  const orb2Color = useColorModeValue("orange.200", "gold.200");
  const orb3Color = useColorModeValue("orange.300", "coral");
  const orbOpacity = useColorModeValue(0.22, 0.45);

  const content = (
    <>
      {/* Base gradient layer - behind orbs */}
      <Box
        position="fixed"
        top={0}
        left={0}
        w="100%"
        h="100%"
        zIndex={-2}
        bg={gradientBg}
        _before={{
          content: '""',
          position: "absolute",
          inset: 0,
          background: radialOverlay,
          pointerEvents: "none",
        }}
      />
      {/* Floating orbs - emerald, gold, coral */}
      <Box
        {...orbBase}
        w="400px"
        h="400px"
        top="10%"
        left="10%"
        bg={orb1Color}
        opacity={orbOpacity}
        zIndex={-1}
        animationDelay="0s"
      />
      <Box
        {...orbBase}
        w="350px"
        h="350px"
        top="60%"
        right="10%"
        bg={orb2Color}
        opacity={orbOpacity}
        zIndex={-1}
        animationDelay="-5s"
      />
      <Box
        {...orbBase}
        w="300px"
        h="300px"
        bottom="10%"
        left="30%"
        bg={orb3Color}
        opacity={orbOpacity}
        zIndex={-1}
        animationDelay="-10s"
      />
    </>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
}

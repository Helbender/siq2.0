import { defineSlotRecipe } from "@chakra-ui/react";

// Glass Admin: glassmorphism card with blur, top highlight, emerald hover glow
export const cardRecipe = defineSlotRecipe({
  className: "chakra-card",
  slots: ["root", "title", "description", "header", "body", "footer"],

  base: {
    root: {
      bg: "bg.card",
      borderRadius: "card",
      border: "1px solid",
      borderColor: "border.subtle",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      p: "6",
      position: "relative",
      overflow: "hidden",
      transition: "all 0.3s ease",
      _before: {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "1px",
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
        pointerEvents: "none",
      },
      _hover: {
        bg: "bg.cardSubtle",
        borderColor: "rgba(255, 255, 255, 0.15)",
        boxShadow: "floating",
      },
    },
    header: {
      px: "5",
      py: "4",
      borderBottom: "1px solid",
      borderColor: "border.subtle",
      fontWeight: "600",
      fontSize: "lg",
      color: "text.primary",
    },
    title: {
      fontWeight: "600",
      fontSize: "lg",
      color: "text.primary",
    },
    description: {
      fontSize: "sm",
      color: "text.muted",
      mt: "1",
    },
    body: {
      px: "5",
      py: "4",
      color: "text.secondary",
    },
    footer: {
      px: "5",
      py: "3",
      borderTop: "1px solid",
      borderColor: "border.subtle",
    },
  },

  variants: {
    variant: {
      outline: {
        root: {
          bg: "bg.card",
          borderColor: "border.subtle",
        },
      },
      subtle: {
        root: {
          bg: "bg.cardSubtle",
          border: "none",
        },
      },
      elevated: {
        root: {
          _hover: {
            transform: "translateY(-2px)",
            boxShadow: "floating",
          },
        },
      },
      glass: {
        root: {
          p: "0",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          _hover: {
            boxShadow: "0 0 40px rgba(52, 211, 153, 0.1)",
          },
        },
      },
      "glass-3d": {
        root: {
          transition: "transform 0.4s cubic-bezier(0.03, 0.98, 0.52, 0.99)",
          _hover: {
            transform: "rotateX(5deg) rotateY(-5deg) translateZ(10px)",
            boxShadow: "floating",
          },
        },
      },
    },
  },

  defaultVariants: {
    variant: "outline",
  },
});

import { useState, useEffect } from "react";

export function useColorMode() {
  const [colorMode, setColorMode] = useState(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem("chakra-ui-color-mode");
    if (stored) return stored;
    
    // Check system preference
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  useEffect(() => {
    // Apply color mode to document
    document.documentElement.setAttribute("data-theme", colorMode);
    localStorage.setItem("chakra-ui-color-mode", colorMode);
  }, [colorMode]);

  const toggleColorMode = () => {
    setColorMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return { colorMode, toggleColorMode };
}


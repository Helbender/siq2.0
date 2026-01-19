import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ColorModeProvider } from "./components/ui/color-mode";
import { Toaster } from "./components/ui/toaster";
// import "./global.css";
import system from "./theme/index.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system} defaultColorMode="dark">
        <ColorModeProvider forcedTheme="dark">
          <App />
          <Toaster />
        </ColorModeProvider>
      </ChakraProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);

import { ChakraProvider } from "@chakra-ui/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { Toaster } from "./components/ui/toaster";
import { ColorModeProvider } from "./components/ui/color-mode";
import { system } from "./theme";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ChakraProvider value={system}>
      <ColorModeProvider>
        <BrowserRouter>
          <App />
          <Toaster />
        </BrowserRouter>
      </ColorModeProvider>
    </ChakraProvider>
  </React.StrictMode>,
);

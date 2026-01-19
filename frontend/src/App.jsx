import { ColorModeProvider } from "@/components/ui/color-mode";
import { AuthProvider } from "@/features/auth/contexts/AuthContext";
import { router } from "@/routes/router";
import React from "react";
import { RouterProvider } from "react-router";

function App() {
  return (
    <AuthProvider>
      <ColorModeProvider forcedTheme="dark" enableSystem={false}>
        <RouterProvider router={router} />
      </ColorModeProvider>
    </AuthProvider>
  );
}

export default App;

import { ColorModeProvider } from "@/components/ui/color-mode";
import { CrewTypesProvider } from "@/common/CrewTypesProvider";
import { AuthProvider } from "@/features/auth/contexts/AuthContext";
import { router } from "@/routes/router";
import React from "react";
import { RouterProvider } from "react-router";

function App() {
  return (
    <AuthProvider>
      <CrewTypesProvider>
        <ColorModeProvider forcedTheme="dark" enableSystem={false}>
          <RouterProvider router={router} />
        </ColorModeProvider>
      </CrewTypesProvider>
    </AuthProvider>
  );
}

export default App;

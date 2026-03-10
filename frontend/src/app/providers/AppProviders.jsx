import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ColorModeProvider } from "@/components/ui/color-mode";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@features/auth";
import { CrewTypesProvider } from "./CrewTypesProvider";
import { RouterProvider } from "react-router";
import { router } from "@/app/router/router";
import system from "@/theme/index.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system} defaultColorMode="dark">
        <ColorModeProvider forcedTheme="dark" enableSystem={false}>
          <AuthProvider>
            <CrewTypesProvider>
              <RouterProvider router={router} />
              <Toaster />
            </CrewTypesProvider>
          </AuthProvider>
        </ColorModeProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

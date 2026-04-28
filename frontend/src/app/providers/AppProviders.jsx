import { router } from "@/app/router/router";
import { ColorModeProvider } from "@/components/ui/color-mode";
import { Toaster } from "@/components/ui/toaster";
import { theme as system } from "@/theme2";
// import system from "@/theme";
import { Center, ChakraProvider, Spinner } from "@chakra-ui/react";
import { AuthProvider } from "@features/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { RouterProvider } from "react-router";
import { CrewTypesProvider } from "./CrewTypesProvider";
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
      <ChakraProvider
        value={system}
        // defaultColorMode="dark"
      >
        <ColorModeProvider
          defaultTheme="dark"
          // enableSystem={false}
        >
          <AuthProvider>
            <CrewTypesProvider>
              <Suspense
                fallback={
                  <Center h="100vh">
                    <Spinner size="xl" />
                  </Center>
                }
              >
                <RouterProvider router={router} />
              </Suspense>
              <Toaster />
            </CrewTypesProvider>
          </AuthProvider>
        </ColorModeProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

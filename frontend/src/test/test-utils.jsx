import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render as rtlRender } from "@testing-library/react";
import system from "@/theme/index.js";

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

function AllTheProviders({ children, queryClient = defaultQueryClient }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system} defaultColorMode="dark">
        {children}
      </ChakraProvider>
    </QueryClientProvider>
  );
}

function render(ui, { queryClient, ...options } = {}) {
  const client = queryClient ?? defaultQueryClient;
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={client}>{children}</AllTheProviders>
    ),
    ...options,
  });
}

export * from "@testing-library/react";
export { render };

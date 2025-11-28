import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import { ThirdwebProvider } from "thirdweb/react";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import { client } from "./thirdwebClient.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache configuration to prevent rate limiting
      staleTime: 60 * 1000,
      gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnReconnect: false, // Don't refetch on network reconnect
      retry: 1, // Only retry once on failure
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ThirdwebProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App client={client} />
          </BrowserRouter>
        </QueryClientProvider>
      </ThirdwebProvider>
    </ThemeProvider>
  </StrictMode>
);

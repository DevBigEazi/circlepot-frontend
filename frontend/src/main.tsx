import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import { ThirdwebProvider } from "thirdweb/react";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { client } from "./thirdwebClient.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
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

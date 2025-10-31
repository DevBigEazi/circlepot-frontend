import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import { ThirdwebProvider } from "thirdweb/react";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { client } from "./thirdwebClient.ts";
import { AuthProvider } from "./context/AuthContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ThirdwebProvider>
        <AuthProvider>
          <BrowserRouter>
            <App client={client} />
          </BrowserRouter>
        </AuthProvider>
      </ThirdwebProvider>
    </ThemeProvider>
  </StrictMode>
);

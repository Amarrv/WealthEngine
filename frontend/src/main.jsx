import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { FinanceProvider } from "./context/FinanceContext.jsx";
import { ThemeProvider } from "./components/ThemeProvider.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { TooltipProvider } from "./components/ui/tooltip";
import "@fontsource/inter";
import "@fontsource/jetbrains-mono";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="wealth-engine-theme">
      <AuthProvider>
        <TooltipProvider>
          <FinanceProvider>
            <App />
          </FinanceProvider>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

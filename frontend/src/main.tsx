import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.tsx";

import { ValidationProvider } from "./context/ValidationContext.tsx";
import { SessionProvider } from "./context/SessionContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <ValidationProvider>
          <App />
        </ValidationProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);

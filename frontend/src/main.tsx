import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { ValidationProvider } from "./context/ValidationContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ValidationProvider>
        <App />
      </ValidationProvider>
    </BrowserRouter>
  </StrictMode>,
);

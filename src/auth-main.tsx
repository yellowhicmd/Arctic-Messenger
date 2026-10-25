import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AuthApp from "./AuthApp";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element "#root" was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthApp />
  </StrictMode>,
);

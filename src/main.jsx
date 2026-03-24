import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./salon_full.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

// SW registration moved into <UpdateToast> so onNeedRefresh can drive a user-prompted update
// (registerType: "prompt") instead of the previous silent autoUpdate reload.

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

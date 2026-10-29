import React from "react";
import { createRoot } from "react-dom/client";
import AppMobile from "./AppMobile";
import { initTheme } from "./lib/m";
import "./index.css";

// Theme must be decided before first paint — light is the default, dark is opt-in.
initTheme();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppMobile />
  </React.StrictMode>,
);

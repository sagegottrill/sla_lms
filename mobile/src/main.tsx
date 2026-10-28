import React from "react";
import { createRoot } from "react-dom/client";
import AppMobile from "./AppMobile";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppMobile />
  </React.StrictMode>,
);

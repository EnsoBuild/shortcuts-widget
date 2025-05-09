import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<App />}
        />
        <Route
          path="/:slug"
          element={<App />}
        />
        <Route
          path="*"
          element={<div>Empty page</div>}
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);

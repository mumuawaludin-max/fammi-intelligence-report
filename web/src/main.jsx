import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import CwChartsPreview from "./pages/cw/CwChartsPreview.jsx";
import CwIndividuPreview from "./pages/cw/CwIndividuPreview.jsx";
import CwAgregatPreview from "./pages/cw/CwAgregatPreview.jsx";
import CwListPreview from "./pages/cw/CwListPreview.jsx";
import CwPagePreview from "./pages/cw/CwPagePreview.jsx";

// Preview lepas-login untuk komponen CW yang belum dirakit ke halaman produk final, dibuka
// lewat ?preview=... di URL dev server. Project ini tidak pakai Storybook, jadi ini pengganti
// ringannya -- tidak pernah dipakai di alur produk normal (default tetap <App/>).
const PREVIEWS = {
  "cw-charts": CwChartsPreview,
  "cw-individu": CwIndividuPreview,
  "cw-agregat": CwAgregatPreview,
  "cw-list": CwListPreview,
  "cw-page": CwPagePreview,
};
const previewParam = new URLSearchParams(window.location.search).get("preview");
const RootComponent = PREVIEWS[previewParam] || App;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RootComponent />
  </StrictMode>
);

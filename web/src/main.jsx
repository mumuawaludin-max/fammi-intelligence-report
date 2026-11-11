import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import CwChartsPreview from "./pages/cw/CwChartsPreview.jsx";
import CwIndividuPreview from "./pages/cw/CwIndividuPreview.jsx";
import CwAgregatPreview from "./pages/cw/CwAgregatPreview.jsx";
import CwListPreview from "./pages/cw/CwListPreview.jsx";
import CwPagePreview from "./pages/cw/CwPagePreview.jsx";
import CwKaryawanPreview from "./pages/cw/CwKaryawanPreview.jsx";
import ScChartsPreview from "./pages/sc/ScChartsPreview.jsx";
import ScIndividuPreview from "./pages/sc/ScIndividuPreview.jsx";
import ScAgregatPreview from "./pages/sc/ScAgregatPreview.jsx";
import ScListPreview from "./pages/sc/ScListPreview.jsx";
import ScPagePreview from "./pages/sc/ScPagePreview.jsx";
import ScKaryawanPreview from "./pages/sc/ScKaryawanPreview.jsx";
import PaPreview from "./pages/pa/PaPreview.jsx";
import PaAgregatPreview from "./pages/pa/PaAgregatPreview.jsx";
import LwPreview from "./pages/lw/LwPreview.jsx";
import SwPreview from "./pages/sw/SwPreview.jsx";
import WaPreview from "./pages/wa/WaPreview.jsx";
import MuridDetailPreview from "./pages/karakter/MuridDetailPreview.jsx";
import YptPreview from "./pages/ypt/YptPreview.jsx";
import YptPreviewData from "./pages/ypt/YptPreviewData.jsx";

// Preview lepas-login untuk komponen CW/SC yang belum dirakit ke halaman produk final, dibuka
// lewat ?preview=... di URL dev server. Project ini tidak pakai Storybook, jadi ini pengganti
// ringannya -- tidak pernah dipakai di alur produk normal (default tetap <App/>).
const PREVIEWS = {
  "cw-charts": CwChartsPreview,
  "cw-individu": CwIndividuPreview,
  "cw-agregat": CwAgregatPreview,
  "cw-list": CwListPreview,
  "cw-page": CwPagePreview,
  "cw-karyawan": CwKaryawanPreview,
  "sc-charts": ScChartsPreview,
  "sc-individu": ScIndividuPreview,
  "sc-agregat": ScAgregatPreview,
  "sc-list": ScListPreview,
  "sc-page": ScPagePreview,
  "sc-karyawan": ScKaryawanPreview,
  "pa": PaPreview,
  "pa-agregat": PaAgregatPreview,
  "lw": LwPreview,
  "sw": SwPreview,
  "wa": WaPreview,
  "karakter-anak": MuridDetailPreview,
  "ypt": YptPreview,
  "ypt-data": YptPreviewData,
};
// Prototipe demo Sekolah Proteksi lewat penampil demo sungguhan, HANYA di dev server. Di produksi
// cabang ini terbuang saat build, jadi prototipe tetap cuma terbuka lewat kode demo yang sah.
if (import.meta.env.DEV) {
  const ProteksiPreview = lazy(() => import("./pages/demo/proteksi/ProteksiPreview.jsx"));
  PREVIEWS["demo-proteksi"] = function PratinjauProteksi() {
    return (
      <Suspense fallback={null}>
        <ProteksiPreview />
      </Suspense>
    );
  };
}
const previewParam = new URLSearchParams(window.location.search).get("preview");
const RootComponent = PREVIEWS[previewParam] || App;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RootComponent />
  </StrictMode>
);

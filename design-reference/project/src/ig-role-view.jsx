// ============================================================
// INTELI-GEN · ROLE-VIEW OVERRIDES
// Dimuat TERAKHIR di tiap dashboard HTML.
// Menggantikan tampilan MI tipis dengan tampilan INTELI-GEN kaya.
//
// Pola:
//   Wali Kelas       → override window.WMIView
//   Kepala Sekolah   → override window.ViewRouter (intercept "mi")
//   Yayasan          → tambah nav item + override window.YViewRouter
//   Orang Tua        → override window.OBakat
//   Siswa            → override window.SBakat
// ============================================================

// CSS animations for the modal (injected once)
(function injectIGStyles() {
  if (document.getElementById("ig-modal-styles")) return;
  const s = document.createElement("style");
  s.id = "ig-modal-styles";
  s.textContent = `
    @keyframes igFadeModal { from { opacity: 0; } to { opacity: 1; } }
    @keyframes igSlideUp   { from { opacity: 0; transform: translateY(14px) scale(.98); } to { opacity: 1; transform: none; } }
  `;
  document.head.appendChild(s);
})();

// ──────────────────────────────────────────────────────────────
// WALI KELAS — replaces WMIView (called by WViewRouter)
// ──────────────────────────────────────────────────────────────
window.WMIView = function WMIView() {
  return (
    <div style={{ paddingBottom: 40 }}>
      <window.CohortView scope="wali" />
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// KEPALA SEKOLAH — wraps ViewRouter to intercept the "mi" case
// ──────────────────────────────────────────────────────────────
(function patchViewRouter() {
  if (!window.ViewRouter) return;
  const _orig = window.ViewRouter;
  window.ViewRouter = function ViewRouter({ activeView, P, modIds }) {
    if (activeView === "mi") {
      return (
        <div style={{ paddingBottom: 40 }}>
          <window.CohortView scope="sekolah" />
        </div>
      );
    }
    return _orig({ activeView, P, modIds });
  };
})();

// ──────────────────────────────────────────────────────────────
// YAYASAN — adds "Peta Kecerdasan" tab + handles it in YViewRouter
// ──────────────────────────────────────────────────────────────
(function patchYayasan() {
  // Add nav tab if not already there
  if (window.Y_NAV && !window.Y_NAV.find((n) => n.id === "inteli")) {
    window.Y_NAV.push({ id: "inteli", label: "Peta Kecerdasan" });
  }
  if (!window.YViewRouter) return;
  const _origY = window.YViewRouter;
  window.YViewRouter = function YViewRouter({ activeView, setActiveView, modIds }) {
    if (activeView === "inteli") {
      return (
        <div style={{ paddingBottom: 40 }}>
          <window.CohortView scope="yayasan" />
        </div>
      );
    }
    return _origY({ activeView, setActiveView, modIds });
  };
})();

// ──────────────────────────────────────────────────────────────
// ORANG TUA — replaces OBakat (called by OViewRouter)
// ──────────────────────────────────────────────────────────────
window.OBakat = function OBakat({ voice, embedded }) {
  // voice comes from OViewRouter; default to "ortu"
  const v = voice || "ortu";
  return (
    <div style={{ paddingBottom: embedded ? 0 : 40 }}>
      <window.IndividualView voice={v} compact />
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// SISWA — replaces SBakat (called by SViewRouter)
// ──────────────────────────────────────────────────────────────
window.SBakat = function SBakat({ embedded }) {
  return (
    <div style={{ paddingBottom: embedded ? 0 : 40 }}>
      <window.IndividualView voice="siswa" compact />
    </div>
  );
};

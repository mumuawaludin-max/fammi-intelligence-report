const { useState: useStateApp } = React;

const KS_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "productMix": "lengkap"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = window.useTweaks(KS_TWEAK_DEFAULTS);
  const [sel, setSel] = useStateApp({ type: "bulanan", year: "2025/2026", calYear: 2026, month: 2, week: 4 });
  const [activeView, setActiveView] = useStateApp("ringkasan");

  // ---- active products → visible modules & nav ----
  const modIds = window.activeInstModules(t.productMix); // subset of [karakter, screening, mi]
  const hasScreening = modIds.includes("screening");
  const visibleNav = window.NAV.filter((n) => {
    if (["karakter", "screening", "mi"].includes(n.id)) return modIds.includes(n.id);
    if (n.id === "analitik") return hasScreening;
    return true; // ringkasan, kelas, kepuasan
  });
  // if current view got hidden by a config change, fall back to ringkasan
  React.useEffect(() => {
    if (!visibleNav.some((n) => n.id === activeView)) setActiveView("ringkasan");
  }, [t.productMix]);

  const base = window.PERIODS[sel.type];
  const P = { ...base, range: window.computeRange(sel) };
  const Pfull = P.empty ? { ...window.PERIODS.bulanan, range: window.computeRange(sel) } : P;
  const isRingkasan = activeView === "ringkasan";

  return (
    <div>
      <window.Header sel={sel} setSel={setSel} activeView={activeView} setActiveView={setActiveView} nav={visibleNav} />
      <main style={{ ...window.SHELL, padding: "32px 40px 52px", display: "flex", flexDirection: "column", gap: 34 }}>
        <window.ViewRouter activeView={activeView} P={isRingkasan ? P : Pfull} modIds={modIds} />
      </main>
      <window.Footer />

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Paket produk sekolah" />
        <window.TweakSelect label="Produk aktif" value={t.productMix}
          options={window.PRESET_KEYS.map((k) => ({ value: k, label: window.PRODUCT_PRESETS[k].label }))}
          onChange={(v) => setTweak("productMix", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

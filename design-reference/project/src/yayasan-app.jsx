const { useState: useStateYA } = React;

const Y_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "productMix": "lengkap"
}/*EDITMODE-END*/;

function YApp() {
  const [t, setTweak] = window.useTweaks(Y_TWEAK_DEFAULTS);
  const [sel, setSel] = useStateYA({ type: "bulanan", year: "2025/2026", calYear: 2026, month: 2, week: 4 });
  const [activeView, setActiveView] = useStateYA("ringkasan");
  const modIds = window.activeInstModules(t.productMix);

  return (
    <div>
      <window.YHeader sel={sel} setSel={setSel} activeView={activeView} setActiveView={setActiveView} />
      <main style={{ ...window.YSHELL, padding: "32px 40px 52px" }}>
        <window.YViewRouter activeView={activeView} setActiveView={setActiveView} modIds={modIds} />
      </main>
      <window.YFooter />

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Paket produk yayasan" />
        <window.TweakSelect label="Produk aktif" value={t.productMix}
          options={window.PRESET_KEYS.map((k) => ({ value: k, label: window.PRODUCT_PRESETS[k].label }))}
          onChange={(v) => setTweak("productMix", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<YApp />);

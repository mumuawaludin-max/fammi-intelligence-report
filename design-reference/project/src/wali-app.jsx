const { useState: useStateWA } = React;

const W_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "productMix": "lengkap"
}/*EDITMODE-END*/;

function WApp() {
  const [t, setTweak] = window.useTweaks(W_TWEAK_DEFAULTS);
  const [sel, setSel] = useStateWA({ type: "bulanan", year: "2025/2026", calYear: 2026, month: 11, week: 4 });
  const [activeView, setActiveView] = useStateWA("ringkasan");
  const [openId, setOpenId] = useStateWA(null);

  const modIds = window.activeInstModules(t.productMix);
  const visibleNav = window.W_NAV.filter((n) => ["karakter", "screening", "mi"].includes(n.id) ? modIds.includes(n.id) : true);
  React.useEffect(() => {
    if (!visibleNav.some((n) => n.id === activeView)) setActiveView("ringkasan");
  }, [t.productMix]);

  return (
    <div>
      <window.WHeader sel={sel} setSel={setSel} activeView={activeView} setActiveView={setActiveView} nav={visibleNav} />
      <main style={{ ...window.WSHELL, padding: "32px 40px 52px" }}>
        <window.WViewRouter activeView={activeView} openStudent={setOpenId} setActiveView={setActiveView} modIds={modIds} />
      </main>
      <window.WFooter />
      {openId != null && <window.WStudentModal id={openId} onClose={() => setOpenId(null)} />}

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Paket produk sekolah" />
        <window.TweakSelect label="Produk aktif" value={t.productMix}
          options={window.PRESET_KEYS.map((k) => ({ value: k, label: window.PRODUCT_PRESETS[k].label }))}
          onChange={(v) => setTweak("productMix", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<WApp />);

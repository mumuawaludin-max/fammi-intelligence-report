const { useState: useStateSU } = React;

// ============================================================
// SISWA shell — dark, glassy, personal. Deliberately a different
// "package" from the warm Orang Tua report: bolder, first-person,
// achievement-flavoured.
// ============================================================

const S_NAV = [
  { id: "beranda", label: "Beranda", Icon: window.IconHome },
  { id: "karakter", label: "Karakter", Icon: window.IconHeart },
  { id: "perasaan", label: "Perasaan", Icon: window.IconShield },
  { id: "bakat", label: "Bakat", Icon: window.IconSparkle },
];

// glass card
function SCard({ children, style, glow }) {
  return (
    <div style={{
      background: "linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.022))",
      border: "1px solid var(--line)", borderRadius: "var(--radius-lg)",
      boxShadow: glow ? "0 18px 54px rgba(124,58,237,0.28), inset 0 1px 0 rgba(255,255,255,0.07)" : "var(--shadow-card), inset 0 1px 0 rgba(255,255,255,0.05)",
      backdropFilter: "blur(14px)", position: "relative", overflow: "hidden", ...style,
    }}>{children}</div>
  );
}

function SHeading({ kicker, title, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {kicker && <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ungu-bright)", textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 7, fontFamily: "'Space Grotesk', sans-serif" }}>{kicker}</div>}
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", color: "var(--ink)", lineHeight: 1.15 }}>{title}</h2>
      {sub && <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

const STrend = ({ t, size = 14 }) => {
  const m = t === "naik" ? { c: "var(--aman)", I: window.IconArrowUp } : t === "turun" ? { c: "var(--waspada)", I: window.IconArrowDown } : { c: "var(--ink-4)", I: window.IconMinus };
  return <m.I size={size} style={{ color: m.c }} />;
};

// chip / badge
function SChip({ children, tone = "ungu", style }) {
  const map = {
    ungu: { fg: "var(--ungu-bright)", bg: "var(--ungu-100)", bd: "rgba(157,107,255,0.34)" },
    aman: { fg: "var(--aman)", bg: "var(--aman-bg)", bd: "rgba(52,211,153,0.34)" },
    perhatian: { fg: "var(--perhatian)", bg: "var(--perhatian-bg)", bd: "rgba(251,191,36,0.34)" },
  };
  const c = map[tone] || map.ungu;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: c.fg, background: c.bg, border: "1px solid " + c.bd, padding: "5px 11px", borderRadius: 99, whiteSpace: "nowrap", ...style }}>{children}</span>
  );
}

// ---------- header ----------
function SHeader({ single }) {
  const c = window.CHILD;
  const a = single && single.accent;
  return (
    <header style={{ flex: "none", background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0))", borderBottom: "1px solid var(--line)", backdropFilter: "blur(10px)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px 0" }}>
        <img src={(window.__resources && window.__resources.fammiLogoWhite) || "assets/fammi-logo-white.png"} alt="Fammi" style={{ height: 21, width: "auto", display: "block" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {single
            ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: a.dMain, background: a.dSoft, border: "1px solid " + a.dMain + "55", padding: "5px 11px", borderRadius: 99 }}><single.Icon size={12} /> {single.short}</span>
            : <SChip><window.IconSparkle size={12} /> Mode Siswa</SChip>}
          <button title="Keluar" onClick={() => (window.location.href = "Masuk.html")} style={{ width: 31, height: 31, borderRadius: 9, border: "1px solid var(--line)", background: "rgba(255,255,255,0.04)", color: "var(--ink-3)", display: "grid", placeItems: "center" }}><window.IconLogout size={15} /></button>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px 16px" }}>
        <span style={{ position: "relative", width: 52, height: 52, borderRadius: 17, background: "linear-gradient(135deg, #B68CFF, #6D28D9)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 21, flex: "none", boxShadow: "0 8px 26px rgba(124,58,237,0.6)" }}>
          {c.panggilan[0]}
          <span style={{ position: "absolute", inset: 0, borderRadius: 17, border: "1px solid rgba(255,255,255,0.3)" }} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ungu-bright)", textTransform: "uppercase", letterSpacing: ".12em", fontFamily: "'Space Grotesk', sans-serif" }}>Peta Diriku</div>
          <h1 style={{ margin: "2px 0 0", fontSize: 19, fontWeight: 800, letterSpacing: "-.02em", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ink-3)" }}>{c.kelas} · {c.sekolah}</p>
        </div>
      </div>
    </header>
  );
}

// ---------- bottom nav (built from active products) ----------
function SBottomNav({ nav, activeView, setActiveView }) {
  return (
    <nav style={{ flex: "none", display: "flex", background: "rgba(12,8,23,0.72)", borderTop: "1px solid var(--line)", backdropFilter: "blur(16px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {nav.map((n) => {
        const active = n.id === activeView;
        const Icon = n.Icon;
        return (
          <button key={n.id} onClick={() => setActiveView(n.id)} style={{
            flex: 1, border: "none", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "10px 4px 11px", color: active ? "var(--ungu-bright)" : "var(--ink-4)", transition: "color .15s ease",
          }}>
            <span style={{ display: "grid", placeItems: "center", width: 42, height: 28, borderRadius: 99, background: active ? "var(--ungu-100)" : "transparent", boxShadow: active ? "0 0 18px rgba(157,107,255,0.4)" : "none", transition: "all .15s ease" }}>
              <Icon size={20} />
            </span>
            <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 600, letterSpacing: ".01em" }}>{n.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ---------- app ----------
const SU_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "productMix": "lengkap",
  "childName": "Aisyah Putri Faisal",
  "schoolName": "SMA Al Fath Cireundeu"
}/*EDITMODE-END*/;

function SiswaApp() {
  const [t, setTweak] = window.useTweaks(SU_TWEAK_DEFAULTS);
  window.CHILD.name = (t.childName || "").trim() || "Aisyah Putri Faisal";
  window.CHILD.panggilan = window.CHILD.name.split(/\s+/)[0];
  window.CHILD.sekolah = (t.schoolName || "").trim() || "SMA Al Fath Cireundeu";

  const products = window.activeProducts(t.productMix);
  const single = products.length === 1 ? products[0] : null;
  const ids = products.map((p) => p.id);
  const [activeView, setActiveView] = useStateSU("beranda");
  const mainRef = React.useRef(null);
  React.useEffect(() => { setActiveView("beranda"); }, [t.productMix]);
  React.useEffect(() => { if (mainRef.current) mainRef.current.scrollTop = 0; }, [activeView, t.productMix]);

  const nav = [{ id: "beranda", label: "Beranda", Icon: window.IconHome }, ...products.map((p) => ({ id: p.siswaView, label: p.short, Icon: p.Icon }))];

  return (
    <div className="phone">
      <SHeader single={single} />
      <main ref={mainRef} className="app-main">
        <div style={{ padding: "20px 18px 28px", display: "flex", flexDirection: "column", gap: 26 }}>
          {single
            ? <window.SSingleProduct product={single} />
            : <window.SViewRouter activeView={activeView} setActiveView={setActiveView} ids={ids} />}
        </div>
      </main>
      {!single && <SBottomNav nav={nav} activeView={activeView} setActiveView={setActiveView} />}

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Paket produk sekolah" />
        <window.TweakSelect label="Produk aktif" value={t.productMix}
          options={window.PRESET_KEYS.map((k) => ({ value: k, label: window.PRODUCT_PRESETS[k].label }))}
          onChange={(v) => setTweak("productMix", v)} />
        <window.TweakSection label="Identitas (demo)" />
        <window.TweakText label="Nama siswa" value={t.childName} onChange={(v) => setTweak("childName", v)} />
        <window.TweakText label="Sekolah" value={t.schoolName} onChange={(v) => setTweak("schoolName", v)} />
      </window.TweaksPanel>
    </div>
  );
}

Object.assign(window, { SCard, SHeading, STrend, SChip, SHeader, SBottomNav, SiswaApp });

const { useState: useStateOU } = React;

// ============================================================
// Mobile-first, app-like shell for the family report.
// Used by both Orang Tua and Siswa pages (voice fixed per page).
// ============================================================

const ODot = ({ color, size = 8 }) => (
  <span style={{ width: size, height: size, borderRadius: 99, background: color, display: "inline-block", flex: "none" }} />
);

const OTrend = ({ t, size = 14 }) => {
  const m = t === "naik" ? { c: "var(--aman)", I: window.IconArrowUp } : t === "turun" ? { c: "var(--waspada)", I: window.IconArrowDown } : { c: "var(--ink-4)", I: window.IconMinus };
  return <m.I size={size} style={{ color: m.c }} />;
};

function OStatusPill({ s }) {
  const c = window.O_STATUS[s] || window.O_STATUS.aman;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: c.fg, background: c.bg, padding: "5px 11px", borderRadius: 99, whiteSpace: "nowrap" }}>
      <ODot color={c.fg} size={7} /> {c.label}
    </span>
  );
}

// section heading inside the scroll body
function OSectionHeading({ title, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-.015em", color: "var(--ink)" }}>{title}</h2>
      {sub && <p style={{ margin: "5px 0 0", fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

function OCard({ children, style }) {
  return <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", ...style }}>{children}</div>;
}

function HomeTip({ children, voice }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "16px 17px", background: "var(--ungu-050)", borderRadius: 18, border: "1px solid var(--ungu-100)" }}>
      <span style={{ width: 34, height: 34, borderRadius: 11, background: "#fff", color: "var(--ungu)", display: "grid", placeItems: "center", flex: "none" }}><window.IconHome size={17} /></span>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ungu-700)", marginBottom: 4 }}>
          {window.V(voice, "Yang bisa Anda lakukan di rumah", "Yang bisa kamu coba")}
        </div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)" }}>{children}</p>
      </div>
    </div>
  );
}

// ---------- app header ----------
function AppHeader({ voice, single }) {
  const c = window.CHILD;
  return (
    <header style={{ flex: "none", background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
      {/* top strip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px 0" }}>
        <img src={(window.__resources && window.__resources.fammiLogo) || "assets/fammi-logo.png"} alt="Fammi" style={{ height: 22, width: "auto", display: "block" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {single
            ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: single.accent.main, background: single.accent.soft, padding: "5px 10px", borderRadius: 99 }}><single.Icon size={12} /> {single.short}</span>
            : <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--ungu)", background: "var(--ungu-050)", padding: "5px 10px", borderRadius: 99, border: "1px solid var(--ungu-100)" }}>{window.V(voice, <window.IconHeart size={12} />, <window.IconSparkle size={12} />)} {window.V(voice, "Orang Tua", "Siswa")}</span>}
          <button title="Keluar" onClick={() => (window.location.href = "Masuk.html")} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", display: "grid", placeItems: "center" }}><window.IconLogout size={16} /></button>
        </div>
      </div>
      {/* child identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 18px 16px" }}>
        <span style={{ width: 50, height: 50, borderRadius: 16, background: "var(--ungu)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 19, flex: "none", boxShadow: "var(--shadow-hero)" }}>{c.panggilan[0]}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ungu)", textTransform: "uppercase", letterSpacing: ".05em" }}>
            {window.V(voice, "Laporan Ananda", "Laporan kamu")}
          </div>
          <h1 style={{ margin: "2px 0 0", fontSize: 18.5, fontWeight: 800, letterSpacing: "-.02em", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ink-3)" }}>{c.kelas} · {c.sekolah}</p>
        </div>
      </div>
    </header>
  );
}

// ---------- bottom tab nav (built from active products) ----------
function BottomNav({ nav, activeView, setActiveView }) {
  return (
    <nav style={{ flex: "none", display: "flex", background: "var(--surface)", borderTop: "1px solid var(--line)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {nav.map((n) => {
        const active = n.id === activeView;
        const Icon = n.Icon || window.IconHome;
        return (
          <button key={n.id} onClick={() => setActiveView(n.id)} style={{
            flex: 1, border: "none", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "10px 4px 11px", color: active ? "var(--ungu)" : "var(--ink-4)", transition: "color .15s ease",
          }}>
            <span style={{ display: "grid", placeItems: "center", width: 40, height: 28, borderRadius: 99, background: active ? "var(--ungu-050)" : "transparent", transition: "background .15s ease" }}>
              <Icon size={20} />
            </span>
            <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 600, letterSpacing: ".01em" }}>{n.short || n.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ---------- phone app ----------
const OU_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "productMix": "lengkap",
  "childName": "Aisyah Putri Faisal",
  "schoolName": "SMA Al Fath Cireundeu"
}/*EDITMODE-END*/;

function PhoneApp({ voice }) {
  const [t, setTweak] = window.useTweaks(OU_TWEAK_DEFAULTS);
  // demo identity tweaks → shared data
  window.CHILD.name = (t.childName || "").trim() || "Aisyah Putri Faisal";
  window.CHILD.panggilan = window.CHILD.name.split(/\s+/)[0];
  window.CHILD.sekolah = (t.schoolName || "").trim() || "SMA Al Fath Cireundeu";

  const products = window.activeProducts(t.productMix);
  const single = products.length === 1 ? products[0] : null;
  const ids = products.map((p) => p.id);
  const [activeView, setActiveView] = useStateOU("ringkasan");
  const mainRef = React.useRef(null);
  React.useEffect(() => { setActiveView("ringkasan"); }, [t.productMix]);
  React.useEffect(() => { if (mainRef.current) mainRef.current.scrollTop = 0; }, [activeView, t.productMix]);

  const nav = [{ id: "ringkasan", short: "Ringkasan", Icon: window.IconHome }, ...products.map((p) => ({ id: p.ortuView, short: p.short, Icon: p.Icon }))];

  return (
    <div className="phone">
      <AppHeader voice={voice} single={single} />
      <main ref={mainRef} className="app-main">
        <div style={{ padding: "20px 18px 26px", display: "flex", flexDirection: "column", gap: 26 }}>
          {single
            ? <window.OSingleProduct product={single} voice={voice} />
            : <window.OViewRouter activeView={activeView} voice={voice} setActiveView={setActiveView} ids={ids} />}
        </div>
      </main>
      {!single && <BottomNav nav={nav} activeView={activeView} setActiveView={setActiveView} />}

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Paket produk sekolah" />
        <window.TweakSelect label="Produk aktif" value={t.productMix}
          options={window.PRESET_KEYS.map((k) => ({ value: k, label: window.PRODUCT_PRESETS[k].label }))}
          onChange={(v) => setTweak("productMix", v)} />
        <window.TweakSection label="Identitas (demo)" />
        <window.TweakText label="Nama anak" value={t.childName} onChange={(v) => setTweak("childName", v)} />
        <window.TweakText label="Sekolah" value={t.schoolName} onChange={(v) => setTweak("schoolName", v)} />
      </window.TweaksPanel>
    </div>
  );
}

Object.assign(window, { ODot, OTrend, OStatusPill, OSectionHeading, OCard, HomeTip, AppHeader, BottomNav, PhoneApp });

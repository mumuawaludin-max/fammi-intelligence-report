// ============================================================
// INTELI-GEN · KIT — shell, role switcher, cards, Ringkasan,
// stat tiles, level badge, intelligence chip. Light theme.
// ============================================================
const { useState: useStateK } = React;

const SHELL_IG = { maxWidth: 1320, margin: "0 auto", padding: "0 32px", width: "100%" };

const ROLES = [
  { id: "yayasan",  label: "Yayasan",     Icon: () => window.IconBuilding({ size: 17 }) },
  { id: "sekolah",  label: "Kepala Sekolah", Icon: () => window.IconLayers({ size: 17 }) },
  { id: "wali",     label: "Wali Kelas",  Icon: () => window.IconUsers({ size: 17 }) },
  { id: "ortu",     label: "Orang Tua",   Icon: () => window.IconHeart({ size: 17 }) },
  { id: "siswa",    label: "Siswa",       Icon: () => window.IconSparkle({ size: 17 }) },
];

// ---------- intelligence icon badge ----------
function IntelBadge({ code, size = 34, tone = "soft" }) {
  const m = window.MI_BY[code];
  const Icon = window.INTEL_ICON[m.icon] || window.IconBrain;
  const solid = tone === "solid";
  return (
    <span style={{
      width: size, height: size, borderRadius: Math.round(size * 0.3), flex: "none",
      display: "grid", placeItems: "center",
      background: solid ? m.color : `color-mix(in srgb, ${m.color} 14%, transparent)`,
      color: solid ? "#fff" : m.color,
    }}>
      <Icon size={Math.round(size * 0.54)} />
    </span>
  );
}

// ---------- level badge (Kuat / Sedang / Berkembang) ----------
function LevelBadge({ index }) {
  const lv = window.levelOf(index);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: lv.fg, background: lv.bg, padding: "4px 10px", borderRadius: 99, whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: lv.color }} /> {lv.key}
    </span>
  );
}

// ---------- card ----------
function IGCard({ children, pad = 22, style }) {
  return (
    <section style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: pad, ...style }}>
      {children}
    </section>
  );
}

// ---------- card header ----------
function IGCardHead({ title, sub, right, Icon }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 18 }}>
      <div style={{ display: "flex", gap: 11, minWidth: 0 }}>
        {Icon && <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", flex: "none" }}><Icon size={18} /></span>}
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: "-.01em", color: "var(--ink)", textWrap: "pretty" }}>{title}</h3>
          {sub && <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.45 }}>{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

// ---------- RINGKASAN — the summary that sits under every chart ----------
// tone: 'insight' (purple) | 'good' | 'watch'
function IGRingkasan({ children, tone = "insight", label = "Ringkasan" }) {
  const map = {
    insight: { fg: "var(--ungu-700)", bg: "var(--ungu-050)", bar: "var(--ungu)", Icon: window.IconSparkle },
    good:    { fg: "var(--aman)",     bg: "var(--aman-bg)",  bar: "var(--aman)",  Icon: window.IconCheckCircle },
    watch:   { fg: "var(--perhatian)",bg: "var(--perhatian-bg)", bar: "var(--perhatian)", Icon: window.IconFlag },
  };
  const t = map[tone] || map.insight;
  return (
    <div style={{ display: "flex", gap: 11, background: t.bg, borderRadius: 12, padding: "12px 14px", marginTop: 16 }}>
      <span style={{ color: t.fg, flex: "none", marginTop: 1 }}><t.Icon size={17} /></span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: t.fg, marginBottom: 3 }}>{label}</div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)", textWrap: "pretty" }}>{children}</p>
      </div>
    </div>
  );
}

// ---------- stat tile ----------
function IGStatTile({ label, value, unit, sub, Icon, delta, tone = "ungu" }) {
  const accent = tone === "ungu" ? "var(--ungu)" : `var(--${tone})`;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)", padding: "18px 18px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: tone === "ungu" ? "var(--ungu-050)" : `var(--${tone}-bg)`, color: accent, display: "grid", placeItems: "center" }}>{Icon && <Icon size={17} />}</span>
        {delta != null && <window.DeltaChip value={delta} size={11} />}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.02em", color: "var(--ink)", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)" }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", marginTop: 8 }}>{label}</div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ---------- section heading (scroll anchor between major bands) ----------
function IGBand({ kicker, title, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {kicker && <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ungu)", marginBottom: 7 }}>{kicker}</div>}
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", color: "var(--ink)", textWrap: "balance" }}>{title}</h2>
      {sub && <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--ink-3)", lineHeight: 1.5, maxWidth: 760, textWrap: "pretty" }}>{sub}</p>}
    </div>
  );
}

// ---------- legend chip ----------
function LegendRow({ items }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px" }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>
          <span style={{ width: 11, height: 11, borderRadius: 4, background: it.color, flex: "none" }} /> {it.label}
        </span>
      ))}
    </div>
  );
}

// ---------- top app bar with role switcher ----------
function AppBar({ role, setRole, scopeKicker, scopeName, parentName }) {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40 }}>
      <div style={{ background: "rgba(255,255,255,0.86)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--line-warm)" }}>
        <div style={{ ...SHELL_IG, display: "flex", alignItems: "center", gap: 22, height: 66 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "none" }}>
            <img src={(window.__resources && window.__resources.fammiLogo) || "assets/fammi-logo.png"} alt="Fammi" style={{ height: 26, width: "auto", display: "block" }} />
            <span style={{ width: 1, height: 22, background: "var(--line-warm)" }} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ungu-700)", letterSpacing: ".01em" }}>INTELI&#8209;GEN</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-4)", letterSpacing: ".02em" }}>Peta Kecerdasan &amp; Belajar</span>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <nav style={{ display: "flex", alignItems: "center", gap: 3, background: "var(--bg-2)", padding: 4, borderRadius: 13, flex: "none", overflowX: "auto" }}>
            {ROLES.map((r) => {
              const active = r.id === role;
              return (
                <button key={r.id} onClick={() => setRole(r.id)} title={r.label} style={{
                  display: "inline-flex", alignItems: "center", gap: 7, border: "none", whiteSpace: "nowrap",
                  background: active ? "var(--ungu)" : "transparent", color: active ? "#fff" : "var(--ink-2)",
                  fontSize: 13, fontWeight: active ? 700 : 600, padding: "8px 13px", borderRadius: 10, transition: "all .15s ease",
                }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface)"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                  <r.Icon /> <span>{r.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      {/* context bar */}
      <div style={{ background: "var(--bg)", borderBottom: "1px solid var(--line-warm)" }}>
        <div style={{ ...SHELL_IG, padding: "15px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ungu)" }}>{scopeKicker}</span>
            <window.IconChevron size={13} style={{ transform: "rotate(-90deg)", color: "var(--ink-4)" }} />
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-.02em", color: "var(--ink)" }}>{scopeName}</h1>
            {parentName && <span style={{ fontSize: 13, color: "var(--ink-3)" }}>· {parentName}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: "var(--ink-3)", background: "var(--surface)", border: "1px solid var(--line)", padding: "6px 12px", borderRadius: 99 }}>
              <window.IconCalendar size={14} style={{ color: "var(--ungu)" }} /> Periode Jun–Des 2026
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: "var(--ungu)", background: "var(--ungu-050)", border: "1px solid var(--ungu-100)", padding: "6px 11px", borderRadius: 99 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--ungu-300)" }} /> Data contoh
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

Object.assign(window, { SHELL_IG, ROLES, IntelBadge, LevelBadge, IGCard, IGCardHead, IGRingkasan, IGStatTile, IGBand, LegendRow, AppBar });

const { useState: useStateYU } = React;

// ---------- shared primitives ----------
const YSHELL = { maxWidth: 1720, margin: "0 auto", padding: "0 40px", width: "100%" };

const YDot = ({ color, size = 8 }) => (
  <span style={{ width: size, height: size, borderRadius: 99, background: color, display: "inline-block", flex: "none" }} />
);

const YSampleTag = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: "var(--ungu)", background: "var(--ungu-050)", padding: "4px 9px", borderRadius: 99, border: "1px solid var(--ungu-100)" }}>
    <YDot color="var(--ungu-300)" size={6} /> Data contoh
  </span>
);

const YTrend = ({ t, size = 13 }) => {
  const m = t === "naik" ? { c: "var(--aman)", I: window.IconArrowUp } : t === "turun" ? { c: "var(--waspada)", I: window.IconArrowDown } : { c: "var(--ink-4)", I: window.IconMinus };
  return <m.I size={size} style={{ color: m.c }} />;
};

function YStatusPill({ s }) {
  const c = window.Y_STATUS[s] || window.Y_STATUS.baik;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: c.fg, background: c.bg, padding: "5px 11px", borderRadius: 99, whiteSpace: "nowrap" }}>
      <YDot color={c.fg} size={7} /> {c.label}
    </span>
  );
}

function YSplit({ amanPct, perhatianPct, waspadaPct, h = 9 }) {
  return (
    <div style={{ display: "flex", height: h, borderRadius: 99, overflow: "hidden", gap: 2, minWidth: 90 }}>
      <div style={{ width: `${amanPct}%`, background: "var(--aman)" }} />
      <div style={{ width: `${perhatianPct}%`, background: "var(--perhatian)" }} />
      <div style={{ width: `${waspadaPct}%`, background: "var(--waspada)" }} />
    </div>
  );
}

function YSectionHeading({ title, sub, right }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 13 }}>
        <span style={{ width: 4, borderRadius: 99, background: "var(--ungu)", flex: "none", alignSelf: "stretch", minHeight: 34 }} />
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-.015em", color: "var(--ink)" }}>{title}</h2>
          {sub && <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--ink-3)" }}>{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function YStatTile({ label, value, note, Icon, tone }) {
  const c = tone === "waspada" ? "var(--waspada)" : tone === "perhatian" ? "var(--perhatian)" : "var(--ungu)";
  const bg = tone === "waspada" ? "var(--waspada-bg)" : tone === "perhatian" ? "var(--perhatian-bg)" : "var(--ungu-050)";
  return (
    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ width: 46, height: 46, borderRadius: 14, background: bg, color: c, display: "grid", placeItems: "center", flex: "none" }}><Icon size={22} /></span>
      <div>
        <div style={{ fontSize: 27, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.02em", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginTop: 5 }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{note}</div>
      </div>
    </div>
  );
}

// ---------- nav + header ----------
function YIconBtn({ children, title }) {
  const [h, setH] = useStateYU(false);
  return (
    <button title={title} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      width: 38, height: 38, borderRadius: 11, border: "1px solid " + (h ? "var(--ungu-100)" : "var(--line)"),
      background: h ? "var(--ungu-050)" : "var(--surface)", display: "grid", placeItems: "center",
      color: h ? "var(--ungu)" : "var(--ink-2)", transition: "all .15s ease",
    }}>{children}</button>
  );
}

function YNavBar({ activeView, setActiveView }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.86)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--line-warm)" }}>
      <div style={{ ...YSHELL, display: "flex", alignItems: "center", gap: 28, height: 68 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "none" }}>
          <img src={(window.__resources && window.__resources.fammiLogo) || "assets/fammi-logo.png"} alt="Fammi" style={{ height: 28, width: "auto", display: "block" }} />
          <span style={{ width: 1, height: 24, background: "var(--line-warm)" }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ungu-700)", letterSpacing: ".01em", whiteSpace: "nowrap" }}>Intelligence&nbsp;Report</span>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0, overflowX: "auto" }}>
          {window.Y_NAV.map((n) => {
            const active = n.id === activeView;
            return (
              <button key={n.id} onClick={() => setActiveView(n.id)} style={{
                border: "none", background: active ? "var(--ungu)" : "transparent", whiteSpace: "nowrap",
                color: active ? "#fff" : "var(--ink-2)", fontSize: 13.5, fontWeight: active ? 700 : 600,
                padding: "9px 16px", borderRadius: 99, transition: "all .16s ease",
              }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--ungu-050)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                {n.label}
              </button>
            );
          })}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flex: "none" }}>
          <YIconBtn title="Cari"><window.IconSearch size={18} /></YIconBtn>
          <YIconBtn title="Notifikasi"><window.IconBell size={18} /></YIconBtn>
          <YIconBtn title="Pengaturan"><window.IconSettings size={18} /></YIconBtn>
          <span style={{ width: 1, height: 24, background: "var(--line-warm)", margin: "0 2px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--ungu)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13.5 }}>AF</div>
            <YIconBtn title="Keluar"><window.IconLogout size={18} /></YIconBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

function YHeader({ sel, setSel, activeView, setActiveView }) {
  const activeLabel = (window.Y_NAV.find((n) => n.id === activeView) || window.Y_NAV[0]).label;
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40 }}>
      <YNavBar activeView={activeView} setActiveView={setActiveView} />
      <div style={{ background: "var(--bg)", borderBottom: "1px solid var(--line-warm)" }}>
        <div style={{ ...YSHELL, padding: "18px 40px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7, fontSize: 12.5, fontWeight: 600, color: "var(--ink-3)" }}>
              <span style={{ fontWeight: 700, color: "var(--ungu)", textTransform: "uppercase", letterSpacing: ".06em" }}>{window.Y_ROLE}</span>
              <window.IconChevron size={13} style={{ transform: "rotate(-90deg)", color: "var(--ink-4)" }} />
              <span>{activeLabel}</span>
              <YSampleTag />
            </div>
            <h1 style={{ margin: 0, fontSize: 25, fontWeight: 800, letterSpacing: "-.02em", color: "var(--ink)" }}>{window.FOUNDATION}</h1>
          </div>
          <YPeriodPicker sel={sel} setSel={setSel} />
        </div>
      </div>
    </header>
  );
}

// ---------- period picker ----------
function YField({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 9 }}>{label}</div>
      {children}
    </div>
  );
}
function YChip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      border: "1px solid " + (active ? "var(--ungu)" : "var(--line)"), background: active ? "var(--ungu)" : "var(--surface)",
      color: active ? "#fff" : "var(--ink-2)", cursor: "pointer", fontSize: 12.5, fontWeight: 600,
      padding: "8px 0", borderRadius: 10, width: "100%", transition: "all .14s ease",
    }}>{children}</button>
  );
}
function YChipRow({ options, value, onPick, render, minW = 58 }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {options.map((o) => (
        <div key={o} style={{ flex: "1 1 0", minWidth: minW }}>
          <YChip active={o === value} onClick={() => onPick(o)}>{render ? render(o) : o}</YChip>
        </div>
      ))}
    </div>
  );
}
function YMonthGrid({ value, onPick }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7 }}>
      {window.Y_MONTHS.map((m, i) => <YChip key={i} active={i === value} onClick={() => onPick(i)}>{m.slice(0, 3)}</YChip>)}
    </div>
  );
}
function YPeriodPicker({ sel, setSel }) {
  const [open, setOpen] = useStateYU(false);
  const types = [{ id: "mingguan", label: "Mingguan" }, { id: "bulanan", label: "Bulanan" }, { id: "tahunan", label: "Tahunan" }];
  const set = (patch) => setSel({ ...sel, ...patch });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, position: "relative" }}>
      <div style={{ display: "inline-flex", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 4, boxShadow: "var(--shadow-card)" }}>
        {types.map((o) => {
          const active = o.id === sel.type;
          return (
            <button key={o.id} onClick={() => set({ type: o.id })} style={{
              border: "none", background: active ? "var(--ungu)" : "transparent", color: active ? "#fff" : "var(--ink-2)",
              fontSize: 13.5, fontWeight: 600, padding: "8px 18px", borderRadius: 10, transition: "all .18s ease",
            }}>{o.label}</button>
          );
        })}
      </div>
      <button onClick={() => setOpen(!open)} style={{
        display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", background: open ? "var(--ungu-050)" : "transparent",
        border: "1px solid " + (open ? "var(--ungu-100)" : "transparent"), borderRadius: 99, padding: "5px 11px",
        color: "var(--ink-2)", fontSize: 12.5, fontWeight: 600, transition: "all .15s ease",
      }}>
        <window.IconCalendar size={15} style={{ color: "var(--ungu)" }} /> {window.yComputeRange(sel)}
        <window.IconChevron size={14} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s ease", color: "var(--ink-3)" }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 51, width: 340, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 18, boxShadow: "var(--shadow-pop)", padding: "18px 18px 16px", animation: "fadeIn .16s ease" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 16 }}>Pilih periode {sel.type}</div>
            {sel.type === "tahunan" && <YField label="Tahun ajaran"><YChipRow options={window.Y_ACADEMIC_YEARS} value={sel.year} onPick={(v) => set({ year: v })} minW={90} /></YField>}
            {sel.type === "bulanan" && <><YField label="Bulan"><YMonthGrid value={sel.month} onPick={(v) => set({ month: v })} /></YField><YField label="Tahun"><YChipRow options={window.Y_CAL_YEARS} value={sel.calYear} onPick={(v) => set({ calYear: v })} /></YField></>}
            {sel.type === "mingguan" && <><YField label="Minggu ke"><YChipRow options={[1, 2, 3, 4, 5]} value={sel.week} onPick={(v) => set({ week: v })} render={(v) => window.Y_ROMAN[v - 1]} minW={44} /></YField><YField label="Bulan"><YMonthGrid value={sel.month} onPick={(v) => set({ month: v })} /></YField><YField label="Tahun"><YChipRow options={window.Y_CAL_YEARS} value={sel.calYear} onPick={(v) => set({ calYear: v })} /></YField></>}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <button onClick={() => setOpen(false)} style={{ border: "none", background: "var(--ungu)", color: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 700, padding: "10px 20px", borderRadius: 10 }}>Terapkan</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function YFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--line-warm)", marginTop: 8 }}>
      <div style={{ maxWidth: 1720, margin: "0 auto", padding: "26px 40px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={(window.__resources && window.__resources.fammiLogo) || "assets/fammi-logo.png"} alt="Fammi" style={{ height: 22, opacity: .85 }} />
          <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Intelligence Report</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "var(--ink-4)", maxWidth: 520, textAlign: "right" }}>
          Seluruh angka pada tampilan ini adalah <b style={{ color: "var(--ink-3)" }}>data contoh</b> untuk keperluan rancangan, bukan temuan nyata.
        </p>
      </div>
    </footer>
  );
}

Object.assign(window, {
  YSHELL, YDot, YSampleTag, YTrend, YStatusPill, YSplit, YSectionHeading, YStatTile,
  YNavBar, YHeader, YPeriodPicker, YFooter,
});

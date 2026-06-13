const { useState } = React;

// ---------- small primitives ----------
const tone = (name) => {
  const t = window.STATUS_TONE[name];
  if (t === "aman") return { fg: "var(--aman)", bg: "var(--aman-bg)" };
  if (t === "perhatian") return { fg: "var(--perhatian)", bg: "var(--perhatian-bg)" };
  if (t === "waspada") return { fg: "var(--waspada)", bg: "var(--waspada-bg)" };
  return { fg: "var(--ungu)", bg: "var(--ungu-100)" };
};

const Dot = ({ color, size = 8 }) => (
  <span style={{ width: size, height: size, borderRadius: 99, background: color, display: "inline-block", flex: "none" }} />
);

const SampleTag = ({ subtle }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600,
    letterSpacing: ".02em", color: subtle ? "var(--ink-3)" : "var(--ungu)",
    background: subtle ? "transparent" : "var(--ungu-050)", padding: subtle ? 0 : "4px 9px",
    borderRadius: 99, border: subtle ? "none" : "1px solid var(--ungu-100)",
  }}>
    <Dot color="var(--ungu-300)" size={6} /> Data contoh
  </span>
);

// shell width used across the whole report
const SHELL = { maxWidth: 1720, margin: "0 auto", padding: "0 40px", width: "100%" };

// section heading with the left accent bar (dashboard feel)
function SectionHeading({ title, sub, right }) {
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

// ============================================================
// HEADER  ·  full-width nav bar + context bar
// ============================================================
function IconBtn({ children, title }) {
  const [h, setH] = useState(false);
  return (
    <button title={title} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      width: 38, height: 38, borderRadius: 11, border: "1px solid " + (h ? "var(--ungu-100)" : "var(--line)"),
      background: h ? "var(--ungu-050)" : "var(--surface)", display: "grid", placeItems: "center",
      color: h ? "var(--ungu)" : "var(--ink-2)", transition: "all .15s ease",
    }}>{children}</button>
  );
}

function NavBar({ activeView, setActiveView, nav }) {
  const items = nav || window.NAV;
  return (
    <div style={{ background: "rgba(255,255,255,0.86)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--line-warm)" }}>
      <div style={{ ...SHELL, display: "flex", alignItems: "center", gap: 28, height: 68 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "none" }}>
          <img src={(window.__resources && window.__resources.fammiLogo) || "assets/fammi-logo.png"} alt="Fammi" style={{ height: 28, width: "auto", display: "block" }} />
          <span style={{ width: 1, height: 24, background: "var(--line-warm)" }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ungu-700)", letterSpacing: ".01em", whiteSpace: "nowrap" }}>Intelligence&nbsp;Report</span>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0, overflowX: "auto" }}>
          {items.map((n) => {
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
          <IconBtn title="Cari"><window.IconSearch size={18} /></IconBtn>
          <IconBtn title="Notifikasi"><window.IconBell size={18} /></IconBtn>
          <IconBtn title="Pengaturan"><window.IconSettings size={18} /></IconBtn>
          <span style={{ width: 1, height: 24, background: "var(--line-warm)", margin: "0 2px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--ungu)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13.5 }}>RK</div>
            <IconBtn title="Keluar"><window.IconLogout size={18} /></IconBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ sel, setSel, activeView, setActiveView, nav }) {
  const items = nav || window.NAV;
  const activeLabel = (items.find((n) => n.id === activeView) || items[0]).label;
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40 }}>
      <NavBar activeView={activeView} setActiveView={setActiveView} nav={items} />
      {/* context bar */}
      <div style={{ background: "var(--bg)", borderBottom: "1px solid var(--line-warm)" }}>
        <div style={{ ...SHELL, padding: "18px 40px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7, fontSize: 12.5, fontWeight: 600, color: "var(--ink-3)" }}>
              <span style={{ fontWeight: 700, color: "var(--ungu)", textTransform: "uppercase", letterSpacing: ".06em" }}>{window.ROLE}</span>
              <window.IconChevron size={13} style={{ transform: "rotate(-90deg)", color: "var(--ink-4)" }} />
              <span>{activeLabel}</span>
              <SampleTag />
            </div>
            <h1 style={{ margin: 0, fontSize: 25, fontWeight: 800, letterSpacing: "-.02em", color: "var(--ink)" }}>{window.SCHOOL}</h1>
          </div>
          <PeriodPicker sel={sel} setSel={setSel} />
        </div>
      </div>
    </header>
  );
}

function PeriodPicker({ sel, setSel }) {
  const [open, setOpen] = useState(false);
  const types = [
    { id: "mingguan", label: "Mingguan" },
    { id: "bulanan", label: "Bulanan" },
    { id: "tahunan", label: "Tahunan" },
  ];
  const range = window.computeRange(sel);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, position: "relative" }}>
      <div style={{ display: "inline-flex", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 4, boxShadow: "var(--shadow-card)" }}>
        {types.map((o) => {
          const active = o.id === sel.type;
          return (
            <button key={o.id} onClick={() => setSel({ ...sel, type: o.id })} style={{
              border: "none", background: active ? "var(--ungu)" : "transparent",
              color: active ? "#fff" : "var(--ink-2)", fontSize: 13.5, fontWeight: 600,
              padding: "8px 18px", borderRadius: 10, transition: "all .18s ease",
            }}>{o.label}</button>
          );
        })}
      </div>
      <button onClick={() => setOpen(!open)} style={{
        display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
        background: open ? "var(--ungu-050)" : "transparent",
        border: "1px solid " + (open ? "var(--ungu-100)" : "transparent"),
        borderRadius: 99, padding: "5px 11px", color: "var(--ink-2)", fontSize: 12.5, fontWeight: 600,
        transition: "all .15s ease",
      }}>
        <window.IconCalendar size={15} style={{ color: "var(--ungu)" }} /> {range}
        <window.IconChevron size={14} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s ease", color: "var(--ink-3)" }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
          <PickerPanel sel={sel} setSel={setSel} onClose={() => setOpen(false)} />
        </>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 9 }}>{label}</div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      border: "1px solid " + (active ? "var(--ungu)" : "var(--line)"),
      background: active ? "var(--ungu)" : "var(--surface)",
      color: active ? "#fff" : "var(--ink-2)", cursor: "pointer",
      fontSize: 12.5, fontWeight: 600, padding: "8px 0", borderRadius: 10,
      width: "100%", transition: "all .14s ease",
    }}>{children}</button>
  );
}

function ChipRow({ options, value, onPick, render, minW = 58 }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {options.map((o) => (
        <div key={o} style={{ flex: "1 1 0", minWidth: minW }}>
          <Chip active={o === value} onClick={() => onPick(o)}>{render ? render(o) : o}</Chip>
        </div>
      ))}
    </div>
  );
}

function MonthGrid({ value, onPick }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7 }}>
      {window.MONTHS.map((m, i) => (
        <Chip key={i} active={i === value} onClick={() => onPick(i)}>{m.slice(0, 3)}</Chip>
      ))}
    </div>
  );
}

function PickerPanel({ sel, setSel, onClose }) {
  const set = (patch) => setSel({ ...sel, ...patch });
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 51, width: 340,
      background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 18,
      boxShadow: "var(--shadow-pop)", padding: "18px 18px 16px", animation: "fadeIn .16s ease",
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 16 }}>
        Pilih periode {window.PERIODS[sel.type].label.toLowerCase()}
      </div>
      {sel.type === "tahunan" && (
        <Field label="Tahun ajaran">
          <ChipRow options={window.ACADEMIC_YEARS} value={sel.year} onPick={(v) => set({ year: v })} minW={90} />
        </Field>
      )}
      {sel.type === "bulanan" && (
        <>
          <Field label="Bulan"><MonthGrid value={sel.month} onPick={(v) => set({ month: v })} /></Field>
          <Field label="Tahun"><ChipRow options={window.CAL_YEARS} value={sel.calYear} onPick={(v) => set({ calYear: v })} /></Field>
        </>
      )}
      {sel.type === "mingguan" && (
        <>
          <Field label="Minggu ke"><ChipRow options={[1, 2, 3, 4, 5]} value={sel.week} onPick={(v) => set({ week: v })} render={(v) => window.ROMAN[v - 1]} minW={44} /></Field>
          <Field label="Bulan"><MonthGrid value={sel.month} onPick={(v) => set({ month: v })} /></Field>
          <Field label="Tahun"><ChipRow options={window.CAL_YEARS} value={sel.calYear} onPick={(v) => set({ calYear: v })} /></Field>
        </>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
        <button onClick={onClose} style={{ border: "none", background: "var(--ungu)", color: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 700, padding: "10px 20px", borderRadius: 10 }}>Terapkan</button>
      </div>
    </div>
  );
}

// ============================================================
// BRIEFING HERO
// ============================================================
function BriefingHero({ P }) {
  return (
    <section style={{
      background: "linear-gradient(135deg, #6B2BE0 0%, #5316C0 100%)",
      borderRadius: "var(--radius-xl)", padding: "38px 40px", color: "#fff", position: "relative", overflow: "hidden",
      boxShadow: "var(--shadow-hero)",
    }}>
      <div style={{ position: "absolute", right: -60, top: -70, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
      <div style={{ position: "absolute", right: 60, bottom: -120, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
      <div style={{ position: "relative", maxWidth: 760 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.14)", padding: "6px 13px", borderRadius: 99, fontSize: 12.5, fontWeight: 600, letterSpacing: ".02em", marginBottom: 20 }}>
          <window.IconSparkle size={15} /> Briefing dari Fammi
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#E9DDFF", marginBottom: 12 }}>{P.range}</div>
        <p style={{ margin: 0, fontSize: 26, lineHeight: 1.45, fontWeight: 600, letterSpacing: "-.01em", textWrap: "pretty" }}>
          {P.briefing[0]}{" "}
          <span style={{ color: "#E9DDFF", fontWeight: 500 }}>{P.briefing[1]}</span>
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 22, color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 500 }}>
          <window.IconCalmFace size={16} /> {P.briefingMeta}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FOLLOW-UP RIBBON
// ============================================================
const PRIO = {
  tinggi:  { label: "Prioritas tinggi",  fg: "var(--waspada)",   bg: "var(--waspada-bg)",   bar: "var(--waspada)" },
  sedang:  { label: "Prioritas sedang",  fg: "var(--perhatian)", bg: "var(--perhatian-bg)", bar: "var(--perhatian)" },
  rendah:  { label: "Prioritas rendah",  fg: "var(--ink-3)",     bg: "var(--bg-2)",         bar: "var(--ink-4)" },
};

function FollowupCard({ f, index }) {
  const p = PRIO[f.priority];
  const [hover, setHover] = useState(false);
  return (
    <article
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)",
        padding: "22px 22px 18px", position: "relative", overflow: "hidden",
        boxShadow: hover ? "var(--shadow-pop)" : "var(--shadow-card)",
        transform: hover ? "translateY(-3px)" : "none", transition: "all .2s ease", cursor: "default",
        display: "flex", flexDirection: "column", minHeight: 218,
      }}>
      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: p.bar }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: p.fg, background: p.bg, padding: "5px 11px", borderRadius: 99 }}>
          <window.IconFlag size={13} /> {p.label}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-4)" }}>{String(index + 1).padStart(2, "0")}</span>
      </div>
      <h3 style={{ margin: "0 0 12px", fontSize: 17.5, lineHeight: 1.35, fontWeight: 700, letterSpacing: "-.01em", color: "var(--ink)" }}>{f.action}</h3>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)", flex: 1 }}>
        <span style={{ fontWeight: 600, color: "var(--ink-3)" }}>Pemicu: </span>{f.trigger}
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)" }}>{f.module}</span>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent",
          color: "var(--ungu)", fontSize: 13, fontWeight: 700, padding: 0, whiteSpace: "nowrap",
        }}>Tindak lanjut <window.IconArrowRight size={15} /></button>
      </div>
    </article>
  );
}

const MOD_NAME_TO_INST = { "Screening": "screening", "Rapor Karakter": "karakter", "Multiple Intelligence": "mi" };
function FollowupRibbon({ P, modIds }) {
  const list = modIds ? P.followups.filter((f) => { const m = MOD_NAME_TO_INST[f.module]; return !m || modIds.includes(m); }) : P.followups;
  if (list.length === 0) return null;
  return (
    <section>
      <SectionHeading
        title="Tindak lanjut berprioritas"
        sub={"Sudah diurutkan dari yang paling perlu perhatian " + P.short + "."}
        right={<span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-3)" }}>{list.length} aksi disarankan</span>}
      />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(list.length, 3)}, 1fr)`, gap: 18 }}>
        {list.map((f, i) => <FollowupCard key={i} f={f} index={i} />)}
      </div>
    </section>
  );
}

Object.assign(window, { Header, NavBar, PeriodPicker, PickerPanel, BriefingHero, FollowupRibbon, FollowupCard, SectionHeading, SHELL, tone, Dot, SampleTag, PRIO });

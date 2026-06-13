const { useState: useStateM } = React;

// ---------- shared viz primitives ----------
const fmtTrend = (t) => t === "naik" ? { c: "var(--aman)", s: "↑ naik" } : t === "turun" ? { c: "var(--waspada)", s: "↓ turun" } : { c: "var(--ink-3)", s: "→ stabil" };

// Karakter: single stacked distribution bar across 4 levels (monochrome purple scale — calm, not rainbow)
function KarakterViz({ m }) {
  const scale = ["#E4DBF4", "#C3ABED", "#9268E0", "var(--ungu)"]; // light → deep
  return (
    <div>
      <div style={{ display: "flex", height: 18, borderRadius: 99, overflow: "hidden", border: "1px solid var(--line)" }}>
        {m.dist.map((d, i) => (
          <div key={i} title={`${d.level} · ${d.value}%`} style={{ width: `${d.value}%`, background: scale[i] }} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 12 }}>
        {m.dist.map((d, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>
            <window.Dot color={scale[i]} size={9} /> {d.level} <b style={{ color: "var(--ink)", fontWeight: 700 }}>{d.value}%</b>
          </span>
        ))}
      </div>
    </div>
  );
}

// Screening: 3-segment status split (green/amber/red — the one place semantic color is warranted)
function ScreeningViz({ m }) {
  const map = { "Aman": ["var(--aman)", "var(--aman-bg)"], "Perlu Perhatian": ["var(--perhatian)", "var(--perhatian-bg)"], "Perlu Diwaspadai": ["var(--waspada)", "var(--waspada-bg)"] };
  return (
    <div>
      <div style={{ display: "flex", height: 18, borderRadius: 99, overflow: "hidden", gap: 3 }}>
        {m.dist.map((d, i) => (
          <div key={i} title={`${d.level} · ${d.count} siswa`} style={{ width: `${d.value}%`, background: map[d.level][0], borderRadius: 4 }} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 12 }}>
        {m.dist.map((d, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>
            <window.Dot color={map[d.level][0]} size={9} /> {d.level} <b style={{ color: "var(--ink)", fontWeight: 700 }}>{d.count}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

// MI: top-3 dominant intelligences as calm purple bars
function MIViz({ m }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {m.dist.map((d, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12.5 }}>
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>{i + 1}. {d.level}</span>
            <span style={{ fontWeight: 700, color: "var(--ungu)" }}>{d.value}%</span>
          </div>
          <div style={{ height: 8, background: "var(--ungu-050)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${d.value}%`, height: "100%", background: i === 0 ? "var(--ungu)" : "var(--ungu-300)", borderRadius: 99 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- detail panels ----------
function KarakterDetail({ d }) {
  return (
    <div>
      <p style={detailIntro}>{d.intro}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {d.rows.map((r, i) => {
          const tr = fmtTrend(r.trend);
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "150px 1fr 78px", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{r.name}</span>
              <div style={{ height: 7, background: "var(--ungu-050)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${r.value}%`, height: "100%", background: "var(--ungu-300)", borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: 12.5, textAlign: "right", color: "var(--ink-2)" }}><b style={{ color: "var(--ink)" }}>{r.value}%</b> <span style={{ color: tr.c, fontSize: 11, fontWeight: 600 }}>{tr.s}</span></span>
            </div>
          );
        })}
      </div>
      <DetailNote text={d.note} />
    </div>
  );
}

function ScreeningDetail({ d }) {
  const tot = (r) => r.aman + r.perhatian + r.waspada;
  return (
    <div>
      <p style={detailIntro}>{d.intro}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {d.rows.map((r, i) => {
          const t = tot(r);
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "150px 1fr", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{r.name}</span>
              <div style={{ display: "flex", height: 9, borderRadius: 99, overflow: "hidden", gap: 2 }}>
                <div style={{ width: `${r.aman / t * 100}%`, background: "var(--aman)" }} />
                <div style={{ width: `${r.perhatian / t * 100}%`, background: "var(--perhatian)" }} />
                <div style={{ width: `${r.waspada / t * 100}%`, background: "var(--waspada)" }} />
              </div>
            </div>
          );
        })}
      </div>
      {d.flagged.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>Siswa perlu diwaspadai (kode samaran)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {d.flagged.map((s, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--waspada-bg)", border: "1px solid #F3D2D8", borderRadius: 10, padding: "7px 11px", fontSize: 12.5, whiteSpace: "nowrap" }}>
                <b style={{ color: "var(--ink)" }}>{s.code}</b>
                <span style={{ color: "var(--ink-3)" }}>{s.kelas}</span>
                <span style={{ color: "var(--waspada)", fontWeight: 600 }}>{s.note}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      <DetailNote text={d.note} warn />
    </div>
  );
}

function MIDetail({ d }) {
  return (
    <div>
      <p style={detailIntro}>{d.intro}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 28px" }}>
        {d.rows.map((r, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12.5 }}>
              <span style={{ fontWeight: 600, color: "var(--ink)" }}>{r.name}</span>
              <span style={{ fontWeight: 700, color: "var(--ungu)" }}>{r.value}%</span>
            </div>
            <div style={{ height: 7, background: "var(--ungu-050)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${r.value}%`, height: "100%", background: "var(--ungu-300)", borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
      <DetailNote text={d.note} />
    </div>
  );
}

const detailIntro = { margin: "0 0 18px", fontSize: 13, lineHeight: 1.55, color: "var(--ink-3)" };
function DetailNote({ text, warn }) {
  return (
    <div style={{ marginTop: 18, padding: "12px 14px", background: warn ? "var(--waspada-bg)" : "var(--ungu-050)", borderRadius: 12, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)", display: "flex", gap: 9 }}>
      <window.IconSparkle size={15} style={{ color: warn ? "var(--waspada)" : "var(--ungu)", flex: "none", marginTop: 1 }} />
      <span>{text}</span>
    </div>
  );
}

// ============================================================
// MODULE CARD
// ============================================================
function ModuleCard({ id, m, forceOpen }) {
  const meta = window.MODULE_META[id];
  const [open, setOpen] = useStateM(!!forceOpen);
  const Viz = id === "karakter" ? KarakterViz : id === "screening" ? ScreeningViz : MIViz;
  const Detail = id === "karakter" ? KarakterDetail : id === "screening" ? ScreeningDetail : MIDetail;

  return (
    <article style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "22px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", flex: "none" }}>
            <meta.Icon size={21} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--ink)", letterSpacing: "-.01em" }}>{meta.title}</h3>
            <p style={{ margin: "1px 0 0", fontSize: 11.5, color: "var(--ink-3)", fontWeight: 500 }}>{meta.sub}</p>
          </div>
        </div>
        <p style={{ margin: "0 0 18px", fontSize: 14, lineHeight: 1.5, color: "var(--ink)", fontWeight: 600, letterSpacing: "-.005em", minHeight: 42, textWrap: "pretty" }}>{m.headline}</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 16 }}>
          <span style={{ fontSize: id === "mi" ? 19 : 28, fontWeight: 800, color: "var(--ungu)", letterSpacing: "-.02em", lineHeight: 1 }}>{m.metric}</span>
          <span style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500 }}>{m.metricNote}</span>
        </div>
        <Viz m={m} />
      </div>

      {open && (
        <div>
          <div style={{ padding: "20px 22px 4px", marginTop: 20, borderTop: "1px solid var(--line)" }}>
            <Detail d={m.detail} />
          </div>
        </div>
      )}

      <button onClick={() => setOpen(!open)} style={{
        margin: "18px 22px 22px", marginTop: open ? 16 : 18, border: "1px solid var(--line)", background: "var(--surface-soft)",
        borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        color: "var(--ungu)", fontSize: 13, fontWeight: 700, transition: "background .15s ease",
      }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--ungu-050)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "var(--surface-soft)"}>
        {open ? "Tutup detail" : "Lihat detail"}
        <window.IconChevron size={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .3s ease" }} />
      </button>
    </article>
  );
}

function ModuleGrid({ P, latest, modIds }) {
  const ids = (modIds && modIds.length ? modIds : ["karakter", "screening", "mi"]).filter((id) => P.modules[id]);
  const cols = Math.min(ids.length, 3);
  return (
    <section>
      <window.SectionHeading
        title="Produk yang digunakan"
        sub={latest ? "Menampilkan ringkasan terkini. Buka detail untuk melihat lebih dalam." : "Bukti pendukung yang ringkas. Buka detail untuk melihat lebih dalam."}
      />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 18, alignItems: "start" }}>
        {ids.map((id) => <ModuleCard key={id} id={id} m={P.modules[id]} />)}
      </div>
    </section>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================
function EmptyState({ P }) {
  return (
    <section style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", border: "1px dashed var(--ungu-100)", padding: "56px 40px", textAlign: "center", boxShadow: "var(--shadow-card)" }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", margin: "0 auto 22px" }}>
        <window.IconCalmFace size={30} />
      </div>
      <h2 style={{ margin: "0 0 10px", fontSize: 21, fontWeight: 800, letterSpacing: "-.01em", color: "var(--ink)" }}>Tidak ada tindak lanjut {P.short}</h2>
      <p style={{ margin: "0 auto", maxWidth: 440, fontSize: 14.5, lineHeight: 1.6, color: "var(--ink-2)" }}>
        Tidak ada hal yang perlu dikerjakan pada periode ini. Data tetap bisa Anda telusuri lewat modul di bawah, atau pilih periode lain di atas.
      </p>
      <div style={{ display: "inline-flex", gap: 10, marginTop: 24 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500 }}><window.IconCalendar size={15} /> {P.range}</span>
      </div>
    </section>
  );
}

function Footer() {
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

Object.assign(window, { ModuleGrid, ModuleCard, KarakterViz, ScreeningViz, MIViz, KarakterDetail, ScreeningDetail, MIDetail, EmptyState, Footer });

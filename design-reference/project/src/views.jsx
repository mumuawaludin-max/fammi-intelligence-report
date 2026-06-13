const { useState: useStateV } = React;

// ============================================================
// Helpers
// ============================================================
const CLS_STATUS = {
  baik: { label: "Stabil", fg: "var(--aman)", bg: "var(--aman-bg)" },
  perhatian: { label: "Perlu perhatian", fg: "var(--perhatian)", bg: "var(--perhatian-bg)" },
};

function StatusPill({ s }) {
  const c = CLS_STATUS[s] || CLS_STATUS.baik;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: c.fg, background: c.bg, padding: "5px 11px", borderRadius: 99, whiteSpace: "nowrap" }}>
      <window.Dot color={c.fg} size={7} /> {c.label}
    </span>
  );
}

const TrendMark = ({ t }) => {
  const m = t === "naik" ? { c: "var(--aman)", I: window.IconArrowUp } : t === "turun" ? { c: "var(--waspada)", I: window.IconArrowDown } : { c: "var(--ink-4)", I: window.IconMinus };
  return <m.I size={13} style={{ color: m.c }} />;
};

// segmented screening bar (aman/perhatian/waspada) reused in tables
function MiniSplit({ aman, perhatian, waspada }) {
  const t = aman + perhatian + waspada;
  return (
    <div style={{ display: "flex", height: 9, borderRadius: 99, overflow: "hidden", gap: 2, minWidth: 90 }}>
      <div style={{ width: `${aman / t * 100}%`, background: "var(--aman)" }} />
      <div style={{ width: `${perhatian / t * 100}%`, background: "var(--perhatian)" }} />
      <div style={{ width: `${waspada / t * 100}%`, background: "var(--waspada)" }} />
    </div>
  );
}

// ============================================================
// PER KELAS  ·  comparison table
// ============================================================
function PerKelasView({ P }) {
  const [sort, setSort] = useStateV("waspada");
  const rows = [...window.CLASSES].sort((a, b) =>
    sort === "karakter" ? b.karakter - a.karakter :
    sort === "aman" ? (b.aman / b.siswa) - (a.aman / a.siswa) :
    b.waspada - a.waspada
  );
  const totSiswa = window.CLASSES.reduce((s, c) => s + c.siswa, 0);
  const totWaspada = window.CLASSES.reduce((s, c) => s + c.waspada, 0);
  const perlu = window.CLASSES.filter((c) => c.status === "perhatian").length;

  const sorts = [
    { id: "waspada", label: "Paling perlu perhatian" },
    { id: "karakter", label: "Capaian karakter" },
    { id: "aman", label: "Proporsi Aman" },
  ];

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        <StatTile label="Kelas terpantau" value={window.CLASSES.length} note={`${totSiswa} siswa keseluruhan`} Icon={window.IconGrid} />
        <StatTile label="Kelas perlu perhatian" value={perlu} note="berdasarkan hasil Screening" Icon={window.IconFlag} tone="perhatian" />
        <StatTile label="Siswa perlu diwaspadai" value={totWaspada} note="butuh pendampingan guru BK" Icon={window.IconShield} tone="waspada" />
      </div>

      <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "18px 24px", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>Perbandingan antar kelas</h3>
            <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--ink-3)" }}>Ringkasan tiga produk untuk tiap kelas pada {P.short}.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)" }}>Urutkan:</span>
            <div style={{ display: "inline-flex", background: "var(--surface-soft)", border: "1px solid var(--line)", borderRadius: 11, padding: 3 }}>
              {sorts.map((s) => (
                <button key={s.id} onClick={() => setSort(s.id)} style={{
                  border: "none", background: sort === s.id ? "var(--ungu)" : "transparent",
                  color: sort === s.id ? "#fff" : "var(--ink-2)", fontSize: 12, fontWeight: 600,
                  padding: "6px 12px", borderRadius: 8, transition: "all .15s ease",
                }}>{s.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* table head */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.5fr .8fr 1.4fr 1.6fr 1.2fr 1fr", gap: 16, padding: "13px 24px", background: "var(--surface-soft)", borderBottom: "1px solid var(--line)" }}>
          {["Kelas", "Wali kelas", "Siswa", "Capaian karakter", "Sebaran Screening", "Kecerdasan dominan", "Status"].map((h, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</span>
          ))}
        </div>

        {rows.map((c, i) => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.5fr .8fr 1.4fr 1.6fr 1.2fr 1fr", gap: 16, padding: "16px 24px", alignItems: "center", borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12.5, flex: "none" }}>{c.id}</span>
            </span>
            <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>{c.wali}</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{c.siswa}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ flex: 1, height: 7, background: "var(--ungu-050)", borderRadius: 99, overflow: "hidden", minWidth: 40 }}>
                <div style={{ width: `${c.karakter}%`, height: "100%", background: "var(--ungu-300)", borderRadius: 99 }} />
              </div>
              <b style={{ fontSize: 13, color: "var(--ink)" }}>{c.karakter}%</b>
              <TrendMark t={c.karakterTrend} />
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <MiniSplit aman={c.aman} perhatian={c.perhatian} waspada={c.waspada} />
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{c.aman} aman · {c.perhatian} perhatian · {c.waspada} waspada</span>
            </span>
            <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>{c.mi}</span>
            <StatusPill s={c.status} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "13px 16px", background: "var(--ungu-050)", borderRadius: 14, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)" }}>
        <window.IconSparkle size={15} style={{ color: "var(--ungu)", flex: "none", marginTop: 1 }} />
        <span>Kelas <b>X-B</b> paling perlu perhatian: capaian karakter menurun dan empat siswa berstatus perlu diwaspadai pada Screening. Baik dijadikan bahan obrolan dengan wali kelasnya, Ibu Sri Lestari.</span>
      </div>
    </section>
  );
}

function StatTile({ label, value, note, Icon, tone }) {
  const c = tone === "waspada" ? "var(--waspada)" : tone === "perhatian" ? "var(--perhatian)" : "var(--ungu)";
  const bg = tone === "waspada" ? "var(--waspada-bg)" : tone === "perhatian" ? "var(--perhatian-bg)" : "var(--ungu-050)";
  return (
    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ width: 46, height: 46, borderRadius: 14, background: bg, color: c, display: "grid", placeItems: "center", flex: "none" }}><Icon size={22} /></span>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.02em", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginTop: 5 }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{note}</div>
      </div>
    </div>
  );
}

// ============================================================
// MODULE FOCUS  ·  single product, full detail + per-class
// ============================================================
const FOCUS_INTRO = {
  karakter: "Enam karakter custom sekolah, dinilai bersama dari sekolah dan rumah. Di bawah ini capaian lembaga sekaligus perbandingan tiap kelas.",
  screening: "Lima aspek HEART untuk menjaga kesehatan perilaku dan mental siswa. Status disajikan ringkas; rincian tiap siswa dibuka bersama guru BK.",
  mi: "Delapan jenis kecerdasan untuk mengenali cara belajar yang paling cocok bagi tiap kelas dan siswa.",
};

function ModuleFocusView({ id, P }) {
  const m = P.modules[id];
  const meta = window.MODULE_META[id];
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", gap: 15, alignItems: "flex-start", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "22px 24px" }}>
        <span style={{ width: 48, height: 48, borderRadius: 14, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", flex: "none" }}><meta.Icon size={24} /></span>
        <div>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>{meta.title}</h2>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 760, textWrap: "pretty" }}>{FOCUS_INTRO[id]}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
        <window.ModuleCard id={id} m={m} forceOpen />
        <ClassPanel id={id} />
      </div>
    </section>
  );
}

function ClassPanel({ id }) {
  const title = id === "karakter" ? "Capaian karakter per kelas" : id === "screening" ? "Status Screening per kelas" : "Kecerdasan dominan per kelas";
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "22px 22px" }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 15.5, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>{title}</h3>
      <p style={{ margin: "0 0 18px", fontSize: 12.5, color: "var(--ink-3)" }}>Membantu Anda melihat kelas mana yang perlu didahulukan.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {window.CLASSES.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <span style={{ width: 40, height: 32, borderRadius: 9, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12, flex: "none" }}>{c.id}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {id === "karakter" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                    <span style={{ color: "var(--ink-3)" }}>{c.siswa} siswa</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, color: "var(--ink)" }}>{c.karakter}% <TrendMark t={c.karakterTrend} /></span>
                  </div>
                  <div style={{ height: 7, background: "var(--ungu-050)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${c.karakter}%`, height: "100%", background: "var(--ungu-300)", borderRadius: 99 }} />
                  </div>
                </>
              )}
              {id === "screening" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5, color: "var(--ink-3)" }}>
                    <span>{c.aman} aman · {c.perhatian} perhatian</span>
                    <span style={{ fontWeight: 700, color: c.waspada > 0 ? "var(--waspada)" : "var(--ink-3)" }}>{c.waspada} waspada</span>
                  </div>
                  <MiniSplit aman={c.aman} perhatian={c.perhatian} waspada={c.waspada} />
                </>
              )}
              {id === "mi" && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 12.5 }}>
                  <span style={{ color: "var(--ink-3)" }}>{c.siswa} siswa</span>
                  <span style={{ fontWeight: 700, color: "var(--ungu)" }}>{c.mi}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// VIEW ROUTER
// ============================================================
function ViewRouter({ activeView, P, modIds }) {
  if (activeView === "kelas") return <PerKelasView P={P} />;
  if (activeView === "analitik") return <window.AnalitikView P={P} />;
  if (activeView === "kepuasan") return <window.SatisfactionView scope="kepala" />;
  if (activeView === "karakter" || activeView === "screening" || activeView === "mi")
    return <ModuleFocusView id={activeView} P={P} />;
  // ringkasan (default)
  return (
    <>
      {P.empty ? (
        <>
          <window.EmptyState P={P} />
          <window.ModuleGrid P={window.PERIODS.bulanan} latest modIds={modIds} />
        </>
      ) : (
        <>
          <window.BriefingHero P={P} />
          <window.FollowupRibbon P={P} modIds={modIds} />
          <window.ModuleGrid P={P} modIds={modIds} />
        </>
      )}
    </>
  );
}

Object.assign(window, { PerKelasView, ModuleFocusView, ClassPanel, StatTile, StatusPill, MiniSplit, ViewRouter });

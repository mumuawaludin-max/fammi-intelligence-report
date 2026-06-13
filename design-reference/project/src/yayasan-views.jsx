const { useState: useStateYV } = React;

// ============================================================
// BRIEFING HERO (tingkat yayasan)
// ============================================================
function YBriefingHero() {
  const b = window.Y_BRIEFING;
  return (
    <section style={{ background: "linear-gradient(135deg, #6B2BE0 0%, #5316C0 100%)", borderRadius: "var(--radius-xl)", padding: "38px 40px", color: "#fff", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-hero)" }}>
      <div style={{ position: "absolute", right: -60, top: -70, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
      <div style={{ position: "absolute", right: 60, bottom: -120, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
      <div style={{ position: "relative", maxWidth: 820 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.14)", padding: "6px 13px", borderRadius: 99, fontSize: 12.5, fontWeight: 600, marginBottom: 20 }}>
          <window.IconSparkle size={15} /> Briefing dari Fammi
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#E9DDFF", marginBottom: 12 }}>{b.eyebrow}</div>
        <p style={{ margin: 0, fontSize: 26, lineHeight: 1.45, fontWeight: 600, letterSpacing: "-.01em", textWrap: "pretty" }}>
          {b.lead} <span style={{ color: "#E9DDFF", fontWeight: 500 }}>{b.rest}</span>
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 22, color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 500 }}>
          <window.IconCalmFace size={16} /> {b.meta}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// OVERVIEW
// ============================================================
function YOverview({ setActiveView, modIds }) {
  const has = (m) => !modIds || modIds.includes(m);
  const totSekolah = window.SCHOOLS.length;
  const totSiswa = window.SCHOOLS.reduce((a, s) => a + s.siswa, 0);
  const wKar = Math.round(window.SCHOOLS.reduce((a, s) => a + s.karakter * s.siswa, 0) / totSiswa);
  const perlu = window.SCHOOLS.filter((s) => s.status === "perhatian");
  const fmt = (n) => n.toLocaleString("id-ID");

  const tiles = [
    { label: "Sekolah dalam naungan", value: totSekolah, note: "3 jenjang pendidikan", Icon: window.IconBuilding },
    { label: "Total siswa terpantau", value: fmt(totSiswa), note: "seluruh jenjang", Icon: window.IconUsers },
  ];
  if (has("karakter")) tiles.push({ label: "Rata-rata capaian karakter", value: wKar + "%", note: "tertimbang jumlah siswa", Icon: window.IconHeart });
  if (has("screening")) tiles.push({ label: "Sekolah perlu perhatian", value: perlu.length, note: "berdasarkan hasil Screening", Icon: window.IconFlag, tone: "perhatian" });
  if (!has("karakter") && !has("screening") && has("mi")) tiles.push({ label: "Pemetaan kecerdasan", value: "8 jenis", note: "lihat rinci per jenjang", Icon: window.IconBrain });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
      <YBriefingHero />

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(tiles.length, 4)}, 1fr)`, gap: 18 }}>
        {tiles.map((t, i) => <window.YStatTile key={i} label={t.label} value={t.value} note={t.note} Icon={t.Icon} tone={t.tone} />)}
      </div>

      {/* denyut kepuasan orang tua — selalu tampil (citra sekolah) */}
      <window.YParentPulse onOpen={() => setActiveView("dampak")} />

      {/* per-jenjang ringkas */}
      <section>
        <window.YSectionHeading title="Sekilas per jenjang" sub="Rangkuman per jenjang pendidikan."
          right={<button onClick={() => setActiveView("jenjang")} style={linkBtn}>Lihat rinci per jenjang <window.IconArrowRight size={15} /></button>} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {window.JENJANG.map((j) => <YJenjangCard key={j.id} j={j} onOpen={() => setActiveView("jenjang")} modIds={modIds} />)}
        </div>
      </section>

      {/* perlu perhatian — screening */}
      {has("screening") && (
        <section>
          <window.YSectionHeading title="Sekolah yang perlu perhatian" sub="Dahulukan obrolan dengan kepala sekolah berikut bulan ini."
            right={<button onClick={() => setActiveView("banding")} style={linkBtn}>Bandingkan sekolah <window.IconScale size={15} /></button>} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
            {perlu.map((s) => <YAttentionCard key={s.id} s={s} modIds={modIds} />)}
          </div>
        </section>
      )}
    </div>
  );
}

const linkBtn = {
  display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid var(--line)", background: "var(--surface)",
  color: "var(--ungu)", fontSize: 12.5, fontWeight: 700, padding: "8px 14px", borderRadius: 99, cursor: "pointer",
};

function YJenjangCard({ j, onOpen, modIds }) {
  const has = (m) => !modIds || modIds.includes(m);
  const a = window.jenjangAgg(j.id);
  return (
    <article style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", padding: "22px 22px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 44, height: 44, borderRadius: 13, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 15 }}>{j.label}</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>{j.full}</h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ink-3)" }}>{a.sekolah} sekolah · {a.siswa.toLocaleString("id-ID")} siswa</p>
          </div>
        </div>
        {has("screening") && a.perhatian > 0 && <window.YStatusPill s="perhatian" />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {has("karakter") && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
              <span style={{ color: "var(--ink-3)" }}>Capaian karakter</span>
              <b style={{ color: "var(--ink)" }}>{a.karakter}%</b>
            </div>
            <div style={{ height: 7, background: "var(--ungu-050)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${a.karakter}%`, height: "100%", background: "var(--ungu-300)", borderRadius: 99 }} />
            </div>
          </div>
        )}
        {has("screening") && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
              <span style={{ color: "var(--ink-3)" }}>Siswa berstatus Aman</span>
              <b style={{ color: "var(--ink)" }}>{a.aman}%</b>
            </div>
            <div style={{ height: 7, background: "var(--aman-bg)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${a.aman}%`, height: "100%", background: "var(--aman)", borderRadius: 99 }} />
            </div>
          </div>
        )}
        {!has("karakter") && !has("screening") && has("mi") && (
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5 }}>Profil kecerdasan beragam pada {a.sekolah} sekolah. Buka rincian per jenjang untuk melihat sebarannya.</p>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
        <span style={{ fontSize: 12, color: has("screening") && a.waspada > 0 ? "var(--waspada)" : "var(--ink-3)", fontWeight: 600 }}>{has("screening") ? a.waspada + " siswa perlu diwaspadai" : a.kelas + " kelas"}</span>
        <button onClick={onOpen} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", color: "var(--ungu)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Rinci <window.IconArrowRight size={14} /></button>
      </div>
    </article>
  );
}

function YAttentionCard({ s, modIds }) {
  const has = (m) => !modIds || modIds.includes(m);
  const stats = [];
  if (has("karakter")) stats.push({ label: "Karakter", value: s.karakter + "%", trend: s.karakterTrend });
  if (has("screening")) stats.push({ label: "Aman", value: s.amanPct + "%" });
  if (has("screening")) stats.push({ label: "Perlu diwaspadai", value: s.waspada, tone: "waspada" });
  return (
    <article style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", padding: "20px 22px", position: "relative", overflow: "hidden" }}>
      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "var(--perhatian)" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>{s.name}</h3>
          <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--ink-3)" }}>{s.jenjang} · {s.kota} · {s.siswa} siswa</p>
        </div>
        <window.YStatusPill s={s.status} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: 14 }}>
        {stats.map((st, i) => <MiniStat key={i} label={st.label} value={st.value} trend={st.trend} tone={st.tone} />)}
      </div>
      <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 16, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)" }}>
        <window.IconSparkle size={14} style={{ color: "var(--perhatian)", flex: "none", marginTop: 2 }} />
        <span>Area paling perlu dijaga: <b style={{ color: "var(--ink)" }}>{s.weakAspect}</b>. Capaian karakter cenderung {s.karakterTrend === "turun" ? "menurun" : "stabil"} periode ini.</span>
      </div>
    </article>
  );
}

function MiniStat({ label, value, trend, tone }) {
  const c = tone === "waspada" ? "var(--waspada)" : "var(--ink)";
  return (
    <div style={{ background: "var(--surface-soft)", border: "1px solid var(--line)", borderRadius: 12, padding: "11px 13px" }}>
      <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 17, fontWeight: 800, color: c, letterSpacing: "-.01em" }}>
        {value} {trend && <window.YTrend t={trend} size={13} />}
      </div>
    </div>
  );
}

// ============================================================
// PER JENJANG
// ============================================================
function YPerJenjang({ modIds }) {
  const [filter, setFilter] = useStateYV("Semua");
  const shown = filter === "Semua" ? window.JENJANG : window.JENJANG.filter((j) => j.id === filter);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <JenjangFilter filter={filter} setFilter={setFilter} />
      {shown.map((j) => <JenjangSection key={j.id} j={j} modIds={modIds} />)}
    </div>
  );
}

function JenjangFilter({ filter, setFilter }) {
  const opts = ["Semua", ...window.JENJANG.map((j) => j.id)];
  return (
    <div style={{ display: "inline-flex", alignSelf: "flex-start", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 4, boxShadow: "var(--shadow-card)" }}>
      {opts.map((o) => {
        const active = o === filter;
        return (
          <button key={o} onClick={() => setFilter(o)} style={{
            border: "none", background: active ? "var(--ungu)" : "transparent", color: active ? "#fff" : "var(--ink-2)",
            fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 10, transition: "all .16s ease",
          }}>{o === "Semua" ? "Semua jenjang" : o}</button>
        );
      })}
    </div>
  );
}

function YJenjangCell({ id, s }) {
  if (id === "sekolah") return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", flex: "none" }}><window.IconBuilding size={19} /></span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{s.name}</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{s.kota}</div>
      </div>
    </div>
  );
  if (id === "siswa") return <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{s.siswa}</span>;
  if (id === "karakter") return (
    <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ flex: 1, height: 7, background: "var(--ungu-050)", borderRadius: 99, overflow: "hidden", minWidth: 40 }}>
        <div style={{ width: `${s.karakter}%`, height: "100%", background: "var(--ungu-300)", borderRadius: 99 }} />
      </div>
      <b style={{ fontSize: 13, color: "var(--ink)" }}>{s.karakter}%</b>
      <window.YTrend t={s.karakterTrend} />
    </span>
  );
  if (id === "screening") return (
    <span style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <window.YSplit amanPct={s.amanPct} perhatianPct={s.perhatianPct} waspadaPct={s.waspadaPct} />
      <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{s.amanPct}% aman · {s.waspada} perlu diwaspadai</span>
    </span>
  );
  if (id === "mi") return <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>{s.mi}</span>;
  if (id === "status") return <window.YStatusPill s={s.status} />;
  return null;
}

function JenjangSection({ j, modIds }) {
  const has = (m) => !modIds || modIds.includes(m);
  const a = window.jenjangAgg(j.id);
  const cols = [
    { id: "sekolah", head: "Sekolah", w: "1.7fr", on: true },
    { id: "siswa", head: "Siswa", w: ".9fr", on: true },
    { id: "karakter", head: "Capaian karakter", w: "1.4fr", on: has("karakter") },
    { id: "screening", head: "Sebaran Screening", w: "1.7fr", on: has("screening") },
    { id: "mi", head: "Kecerdasan dominan", w: "1.3fr", on: has("mi") },
    { id: "status", head: "Status", w: "1fr", on: true },
  ].filter((c) => c.on);
  const template = cols.map((c) => c.w).join(" ");
  const aggs = [];
  if (has("karakter")) aggs.push({ label: "Karakter", value: a.karakter + "%" });
  if (has("screening")) aggs.push({ label: "Aman", value: a.aman + "%" });
  if (has("screening")) aggs.push({ label: "Perlu diwaspadai", value: a.waspada, tone: a.waspada > 0 ? "waspada" : null });
  return (
    <section>
      <window.YSectionHeading title={j.full}
        sub={`${a.sekolah} sekolah · ${a.siswa.toLocaleString("id-ID")} siswa · ${a.kelas} kelas`}
        right={<div style={{ display: "flex", gap: 22, alignItems: "center" }}>{aggs.map((x, i) => <AggStat key={i} label={x.label} value={x.value} tone={x.tone} />)}</div>} />
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: template, gap: 16, padding: "13px 24px", background: "var(--surface-soft)", borderBottom: "1px solid var(--line)" }}>
          {cols.map((c) => <span key={c.id} style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>{c.head}</span>)}
        </div>
        {a.list.map((s, i) => (
          <div key={s.id} style={{ display: "grid", gridTemplateColumns: template, gap: 16, padding: "16px 24px", alignItems: "center", borderBottom: i === a.list.length - 1 ? "none" : "1px solid var(--line)" }}>
            {cols.map((c) => <YJenjangCell key={c.id} id={c.id} s={s} />)}
          </div>
        ))}
      </div>
    </section>
  );
}

function AggStat({ label, value, tone }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 19, fontWeight: 800, color: tone === "waspada" ? "var(--waspada)" : "var(--ink)", letterSpacing: "-.01em", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function SchoolRow({ s, last }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.7fr .9fr 1.4fr 1.7fr 1.3fr 1fr", gap: 16, padding: "16px 24px", alignItems: "center", borderBottom: last ? "none" : "1px solid var(--line)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", flex: "none" }}><window.IconBuilding size={19} /></span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{s.name}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{s.kota}</div>
        </div>
      </div>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{s.siswa}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ flex: 1, height: 7, background: "var(--ungu-050)", borderRadius: 99, overflow: "hidden", minWidth: 40 }}>
          <div style={{ width: `${s.karakter}%`, height: "100%", background: "var(--ungu-300)", borderRadius: 99 }} />
        </div>
        <b style={{ fontSize: 13, color: "var(--ink)" }}>{s.karakter}%</b>
        <window.YTrend t={s.karakterTrend} />
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <window.YSplit amanPct={s.amanPct} perhatianPct={s.perhatianPct} waspadaPct={s.waspadaPct} />
        <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{s.amanPct}% aman · {s.waspada} perlu diwaspadai</span>
      </span>
      <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>{s.mi}</span>
      <window.YStatusPill s={s.status} />
    </div>
  );
}

// ============================================================
// BANDINGKAN SEKOLAH
// ============================================================
function YCompare({ modIds }) {
  const [picked, setPicked] = useStateYV(["sma-cir", "sma-ser"]);
  const toggle = (id) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]);
  const cols = picked.map((id) => window.SCHOOLS.find((s) => s.id === id)).filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>Pilih sekolah untuk dibandingkan</h3>
          <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Pilih 2 sampai 3 sekolah · terpilih {picked.length}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {window.SCHOOLS.map((s) => {
            const on = picked.includes(s.id);
            const disabled = !on && picked.length >= 3;
            return (
              <button key={s.id} onClick={() => toggle(s.id)} disabled={disabled} style={{
                display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid " + (on ? "var(--ungu)" : "var(--line)"),
                background: on ? "var(--ungu)" : "var(--surface)", color: on ? "#fff" : disabled ? "var(--ink-4)" : "var(--ink-2)",
                fontSize: 13, fontWeight: 600, padding: "9px 14px", borderRadius: 99, cursor: disabled ? "not-allowed" : "pointer",
                transition: "all .14s ease", opacity: disabled ? .55 : 1,
              }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, padding: "2px 7px", borderRadius: 6, background: on ? "rgba(255,255,255,0.22)" : "var(--ungu-050)", color: on ? "#fff" : "var(--ungu)" }}>{s.jenjang}</span>
                {s.short}
              </button>
            );
          })}
        </div>
      </div>

      {cols.length < 2 ? (
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", border: "1px dashed var(--ungu-100)", padding: "52px 40px", textAlign: "center", boxShadow: "var(--shadow-card)" }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}><window.IconScale size={28} /></div>
          <h3 style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 800, color: "var(--ink)" }}>Pilih minimal dua sekolah</h3>
          <p style={{ margin: "0 auto", maxWidth: 420, fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)" }}>Tambah satu sekolah lagi dari daftar di atas untuk melihat perbandingannya berdampingan.</p>
        </div>
      ) : <CompareGrid cols={cols} modIds={modIds} />}
    </div>
  );
}

function CompareGrid({ cols, modIds }) {
  const has = (m) => !modIds || modIds.includes(m);
  const labelW = "200px";
  const gridCols = `${labelW} repeat(${cols.length}, minmax(0, 1fr))`;
  const best = (vals, dir) => {
    const ext = dir === "max" ? Math.max(...vals) : Math.min(...vals);
    return vals.map((v) => v === ext && vals.filter((x) => x === ext).length < vals.length);
  };
  const karBest = best(cols.map((c) => c.karakter), "max");
  const amanBest = best(cols.map((c) => c.amanPct), "max");
  const wasBest = best(cols.map((c) => c.waspada), "min");

  return (
    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
      {/* header columns */}
      <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 0, borderBottom: "1px solid var(--line)" }}>
        <div style={{ padding: "20px 22px", background: "var(--surface-soft)" }} />
        {cols.map((c) => (
          <div key={c.id} style={{ padding: "20px 22px", background: "var(--surface-soft)", borderLeft: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", flex: "none" }}><window.IconBuilding size={17} /></span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--ungu)", background: "var(--ungu-050)", padding: "2px 7px", borderRadius: 6 }}>{c.jenjang}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em", lineHeight: 1.2 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3 }}>{c.kota} · {c.siswa} siswa</div>
          </div>
        ))}
      </div>

      <CmpRow label="Jumlah siswa" cols={cols} render={(c) => <b style={{ fontSize: 15, color: "var(--ink)" }}>{c.siswa}</b>} />
      {has("karakter") && <CmpRow label="Capaian karakter" cols={cols} render={(c, i) => (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <b style={{ fontSize: 15, color: karBest[i] ? "var(--ungu)" : "var(--ink)" }}>{c.karakter}%</b>
            <window.YTrend t={c.karakterTrend} />
            {karBest[i] && <span style={badge}>Tertinggi</span>}
          </div>
          <div style={{ height: 6, background: "var(--ungu-050)", borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${c.karakter}%`, height: "100%", background: "var(--ungu-300)", borderRadius: 99 }} /></div>
        </div>
      )} />}
      {has("screening") && <CmpRow label="Status Screening" cols={cols} render={(c, i) => (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <b style={{ fontSize: 15, color: amanBest[i] ? "var(--aman)" : "var(--ink)" }}>{c.amanPct}%</b>
            <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>aman</span>
            {amanBest[i] && <span style={{ ...badge, color: "var(--aman)", background: "var(--aman-bg)" }}>Tertinggi</span>}
          </div>
          <window.YSplit amanPct={c.amanPct} perhatianPct={c.perhatianPct} waspadaPct={c.waspadaPct} h={7} />
        </div>
      )} />}
      {has("screening") && <CmpRow label="Siswa perlu diwaspadai" cols={cols} render={(c, i) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <b style={{ fontSize: 15, color: c.waspada > 0 ? "var(--waspada)" : "var(--ink)" }}>{c.waspada}</b>
          {wasBest[i] && <span style={{ ...badge, color: "var(--aman)", background: "var(--aman-bg)" }}>Paling sedikit</span>}
        </span>
      )} />}
      {has("mi") && <CmpRow label="Kecerdasan dominan" cols={cols} render={(c) => <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ungu)" }}>{c.mi}</span>} />}
      {has("karakter") && <CmpRow label="Karakter terkuat" cols={cols} render={(c) => <span style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 600 }}>{c.topChar}</span>} />}
      {has("karakter") && <CmpRow label="Perlu dibiasakan" cols={cols} render={(c) => <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{c.weakChar}</span>} />}
      {has("screening") && <CmpRow label="Aspek perlu dijaga" cols={cols} render={(c) => <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{c.weakAspect}</span>} />}
      <CmpRow label="Status keseluruhan" cols={cols} last render={(c) => <window.YStatusPill s={c.status} />} />
    </div>
  );
}

const badge = { fontSize: 10, fontWeight: 800, color: "var(--ungu)", background: "var(--ungu-050)", padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap" };

function CmpRow({ label, cols, render, last }) {
  const gridCols = `200px repeat(${cols.length}, minmax(0, 1fr))`;
  return (
    <div style={{ display: "grid", gridTemplateColumns: gridCols, borderBottom: last ? "none" : "1px solid var(--line)" }}>
      <div style={{ padding: "16px 22px", fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".04em", display: "flex", alignItems: "center" }}>{label}</div>
      {cols.map((c, i) => (
        <div key={c.id} style={{ padding: "16px 22px", borderLeft: "1px solid var(--line)", display: "flex", alignItems: "center" }}>{render(c, i)}</div>
      ))}
    </div>
  );
}

// ============================================================
// ROUTER
// ============================================================
function YViewRouter({ activeView, setActiveView, modIds }) {
  if (activeView === "dampak") return <window.YImpactView modIds={modIds} />;
  if (activeView === "jenjang") return <YPerJenjang modIds={modIds} />;
  if (activeView === "banding") return <YCompare modIds={modIds} />;
  if (activeView === "kepuasan") return <window.SatisfactionView scope="yayasan" />;
  return <YOverview setActiveView={setActiveView} modIds={modIds} />;
}

Object.assign(window, { YOverview, YPerJenjang, YCompare, YViewRouter });

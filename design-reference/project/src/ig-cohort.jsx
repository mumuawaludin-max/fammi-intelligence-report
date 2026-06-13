// ============================================================
// INTELI-GEN · COHORT VIEW v2 — agregat (Wali / Sekolah / Yayasan)
// Semua card dan baris clickable, buka modal detail.
// ============================================================
const { useState: useStateCV2 } = React;

function CohortView({ scope }) {
  const D = window.COHORTS[scope];
  const C = window.IGCard, CH = window.IGCardHead, RG = window.IGRingkasan, IB = window.IntelBadge, B = window.IGBand, ST = window.IGStatTile;
  const isYay = scope === "yayasan", isWali = scope === "wali";

  // modal: { type: "intel", code } | { type: "student", idx } | { type: "theme", idx } | { type: "heat", row, col }
  const [modal, setModal] = useStateCV2(null);

  const maxDist = Math.max(...D.miDist.map((d) => d.n));
  const radarAxes = window.MI.map((m) => ({ label: m.name, short: m.code, value: D.miAvg[m.code], max: 100 }));
  const labels = window.TL.map((t) => t.short);
  const series = [
    { label: "Kesadaran Diri", data: D.journey.sa, color: "var(--ungu)" },
    { label: "Kebiasaan Belajar", data: D.journey.lb, color: "#2F6BD4" },
    { label: "Arah Karier", data: D.journey.cf, color: "#C57A2C" },
  ];
  const topDom = D.miDist[0];
  const topDomPct = Math.round((topDom.n / D.nSiswa) * 100);

  const stats = isYay ? [
    { label: "Total siswa terpetakan", value: D.nSiswa.toLocaleString("id-ID"), Icon: window.IconUsers, sub: `${D.breakdown.length} sekolah · ${D.nKelas} kelas` },
    { label: "Naik kesadaran diri", value: D.flags.awarenessNaik, unit: "%", Icon: window.IconArrowUpRight, tone: "aman", sub: "vs awal program", delta: null },
    { label: "Cita-cita sudah jelas", value: D.flags.citaJelas, unit: "%", Icon: window.IconSparkle, sub: "dapat menyebutkan arah" },
    { label: "Perlu dukungan kelola cemas", value: D.flags.cemasTinggi, Icon: window.IconFlag, tone: "perhatian", sub: "siswa skor rendah" },
  ] : [
    { label: isWali ? "Siswa di kelas" : "Siswa terpetakan", value: D.nSiswa, Icon: window.IconUsers, sub: isWali ? "satu rombongan belajar" : `${D.nKelas} kelas` },
    { label: "Naik kesadaran diri", value: D.flags.awarenessNaik, unit: "%", Icon: window.IconArrowUpRight, tone: "aman", sub: "vs awal program" },
    { label: "Cita-cita sudah jelas", value: D.flags.citaJelas, unit: "%", Icon: window.IconSparkle, sub: "dapat menyebutkan arah" },
    { label: "Perlu dukungan kelola cemas", value: D.flags.cemasTinggi, Icon: window.IconFlag, tone: "perhatian", sub: "siswa skor rendah" },
  ];

  // ---- intel class modal — delegates to IGIntelPanel with scope as roleCtx ----
  function IntelClassModal({ code }) {
    const m = window.MI_BY[code];
    const d = window.MI_DEEP[code];
    const count = D.miDist.find((x) => x.code === code)?.n || 0;
    const pct = Math.round((count / D.nSiswa) * 100);
    if (!d || !m) return null;
    const scopeLabel = isYay ? "di seluruh yayasan" : isWali ? "di kelas ini" : "di sekolah";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 11, alignItems: "center", background: `color-mix(in srgb, ${m.color} 10%, transparent)`, borderRadius: 13, padding: "13px 16px", border: `1px solid color-mix(in srgb, ${m.color} 22%, transparent)` }}>
          <window.IntelBadge code={code} size={42} tone="solid" />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{count} siswa dominan · {pct}% dari total</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3 }}>Kecerdasan {m.name} terkuat {scopeLabel}</div>
          </div>
        </div>
        <window.IGIntelPanel code={code} roleCtx={scope} />
      </div>
    );
  }

  // ---- student quick-view modal (wali only) ----
  function StudentModal({ idx }) {
    const s = D.students[idx];
    if (!s) return null;
    const m = window.MI_BY[s.top];
    const flagMap = { cemas: { t: "Kelola cemas perlu didukung", c: "var(--waspada)" }, fokus: { t: "Fokus belajar perlu dijaga", c: "var(--perhatian)" } };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 52, height: 52, borderRadius: 15, background: "var(--ungu)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 19, flex: "none" }}>{s.nama[0]}</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>{s.nama}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><IB code={s.top} size={22} /><span style={{ fontSize: 13, color: "var(--ink-2)" }}>Dominan: {m.name}</span></span>
              {s.flag && <span style={{ fontSize: 12, fontWeight: 700, color: flagMap[s.flag].c, background: `color-mix(in srgb, ${flagMap[s.flag].c} 12%, transparent)`, padding: "3px 9px", borderRadius: 99 }}>{flagMap[s.flag].t}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[{ l: "Kesadaran Diri", v: s.sa, d: s.saD, c: "var(--ungu)" },
            { l: "Kebiasaan Belajar", v: s.lb, d: s.lbD, c: "#2F6BD4" },
            { l: "Arah Karier", v: s.cf, d: s.cfD, c: "#C57A2C" }].map((it, i) => (
            <div key={i} style={{ background: "var(--surface-soft)", border: "1px solid var(--line)", borderRadius: 13, padding: "14px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: it.c, lineHeight: 1 }}>{it.v}</div>
              <window.DeltaChip value={it.d} size={11} />
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600, marginTop: 6 }}>{it.l}</div>
            </div>
          ))}
        </div>
        <div style={{ background: `color-mix(in srgb, ${m.color} 10%, transparent)`, borderRadius: 13, padding: "14px 16px", border: `1px solid color-mix(in srgb, ${m.color} 22%, transparent)` }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>Cara belajar dominan</div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)", marginBottom: 5 }}>{m.name}</div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{m.tagline}. {window.MI_DEEP[s.top]?.pengaktif[0]}.</p>
        </div>
      </div>
    );
  }

  // ---- theme modal ----
  function ThemeModal({ idx }) {
    const t = D.themes[idx];
    if (!t) return null;
    const maxN = Math.max(...D.themes.map((x) => x.n));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ background: "var(--ungu-050)", borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>{t.theme}</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1, height: 8, background: "var(--bg-2)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${(t.n / maxN) * 100}%`, height: "100%", background: "var(--ungu)" }} />
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ungu)", whiteSpace: "nowrap" }}>{t.n.toLocaleString("id-ID")} siswa</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--ink-4)", marginBottom: 10 }}>Kutipan dari siswa</div>
          <div style={{ borderLeft: "3px solid var(--ungu)", paddingLeft: 14 }}>
            <p style={{ margin: 0, fontSize: 14.5, color: "var(--ink)", lineHeight: 1.65, fontStyle: "italic" }}>"{t.quote}"</p>
          </div>
        </div>
        <div style={{ background: "var(--surface-soft)", borderRadius: 13, padding: "14px 16px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ungu-700)", marginBottom: 6 }}>Apa yang bisa dilakukan?</div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Tema ini muncul dari banyak siswa — artinya ada kebutuhan nyata yang belum terpenuhi sepenuhnya. Pertimbangkan untuk memasukkan metode yang mendukung tema ini ke dalam strategi pembelajaran kelas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* ---- STAT TILES ---- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {stats.map((s, i) => <ST key={i} {...s} />)}
      </div>

      {/* ---- SEBARAN KECERDASAN ---- */}
      <div>
        <B kicker="Komposisi kecerdasan"
           title={isYay ? "Kekuatan belajar di seluruh yayasan" : isWali ? "Kekuatan belajar di kelas ini" : "Kekuatan belajar di sekolah"}
           sub="Tiap siswa punya satu kecerdasan dominan. Klik baris kecerdasan untuk memahami artinya bagi proses pembelajaran." />
        <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 18 }}>
          <C>
            <CH title="Sebaran kecerdasan dominan" sub={`Jumlah siswa per kecerdasan terkuat (n=${D.nSiswa.toLocaleString("id-ID")}). Klik untuk detail.`} Icon={window.IconLayers} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {D.miDist.map((d) => {
                const m = window.MI_BY[d.code];
                const pct = Math.round((d.n / D.nSiswa) * 100);
                return (
                  <button key={d.code} onClick={() => setModal({ type: "intel", code: d.code })} style={{ display: "flex", alignItems: "center", gap: 11, background: "none", border: "none", cursor: "pointer", borderRadius: 11, padding: "7px 9px", transition: "background .14s", width: "100%", textAlign: "left" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--ungu-050)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <IB code={d.code} size={30} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{m.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)" }}>{d.n} · {pct}%</span>
                      </div>
                      <div style={{ height: 7, background: "var(--bg-2)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${(d.n / maxDist) * 100}%`, height: "100%", background: m.color, borderRadius: 99 }} />
                      </div>
                    </div>
                    <window.IconArrowRight size={13} style={{ color: "var(--ink-4)", flex: "none" }} />
                  </button>
                );
              })}
            </div>
          </C>
          <C>
            <CH title="Profil rata-rata" sub="Index rata-rata kelompok per kecerdasan." Icon={window.IconBrain} />
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: "100%", maxWidth: 310 }}><window.Radar axes={radarAxes} size={290} /></div>
            </div>
          </C>
        </div>
        <C style={{ marginTop: 18 }}>
          <RG tone="insight" label="Ringkasan sebaran">
            Kecerdasan paling umum adalah <b>{window.MI_BY[topDom.code].name}</b> ({topDom.n} siswa · {topDomPct}%). {isYay
              ? "Karena tiap sekolah berbeda, metode mengajar sebaiknya disesuaikan per jenjang — bukan seragam di seluruh yayasan."
              : `Metode ${window.MI_BY[topDom.code].tagline.toLowerCase()} akan menjangkau paling banyak siswa.`}
          </RG>
        </C>
      </div>

      {/* ---- HEATMAP MI × MAPEL ---- */}
      <div>
        <B kicker="Kecerdasan ketemu pelajaran"
           title="Kecerdasan dominan vs rumpun mata pelajaran favorit"
           sub="Persilangan kecerdasan terkuat dengan rumpun pelajaran yang paling disukai. Sel makin pekat = makin banyak siswa." />
        <C>
          <CH title="Peta silang kecerdasan × pelajaran" sub="Jumlah siswa per kombinasi. Klik untuk interpretasi." Icon={window.IconGrid} />
          <window.Heatmap
            rows={D.heat.rows.map((code) => ({ label: window.MI_BY[code].name, color: window.MI_BY[code].color }))}
            cols={window.SUBJECTS}
            matrix={D.heat.matrix} />
          <RG tone="insight" label="Ringkasan persilangan">
            Siswa <b>Logis-Matematis</b> menumpuk di <b>MIPA</b>; siswa <b>Kinestetik</b> condong ke <b>Olahraga/praktik</b>. Siswa <b>Spasial</b> tersebar antara Seni dan MIPA — peluang mengajarkan sains lewat pendekatan visual.
          </RG>
        </C>
      </div>

      {/* ---- PERJALANAN 6 BULAN ---- */}
      <div>
        <B kicker="Pemantauan bulanan · baseline → bulan 6"
           title="Perkembangan rata-rata selama enam bulan"
           sub="Rata-rata tiga indeks per bulan — menunjukkan apakah program berdampak secara kolektif." />
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }}>
          <C>
            <CH title="Tren tiga indeks" Icon={window.IconArrowUpRight}
                right={<window.LegendRow items={series.map((s) => ({ color: s.color, label: s.label }))} />} />
            <window.TrendLines series={series} labels={labels} />
          </C>
          <C>
            <CH title="Perubahan vs awal" Icon={window.IconScale} />
            <window.Dumbbell rows={[
              { label: "Kesadaran Diri", from: D.journey.sa[0], to: D.journey.sa[6], color: "var(--ungu)" },
              { label: "Kebiasaan Belajar", from: D.journey.lb[0], to: D.journey.lb[6], color: "#2F6BD4" },
              { label: "Arah Karier", from: D.journey.cf[0], to: D.journey.cf[6], color: "#C57A2C" },
            ]} />
          </C>
        </div>
        <C style={{ marginTop: 18 }}>
          <RG tone="good" label="Ringkasan perkembangan">
            Ketiga indeks naik konsisten. Kenaikan terbesar pada <b>Arah Karier</b> (+{window.delta(D.journey.cf)} poin) — siswa makin punya gambaran masa depan. <b>Kebiasaan Belajar</b> bergerak paling lambat (+{window.delta(D.journey.lb)}), wajar karena perubahan kebiasaan butuh waktu paling lama.
          </RG>
        </C>
      </div>

      {/* ---- RINCIAN PER UNIT (sekolah / yayasan) ---- */}
      {!isWali && (
        <div>
          <B kicker={isYay ? "Per sekolah" : "Per kelas"}
             title={isYay ? "Perbandingan antar sekolah" : "Perbandingan antar kelas"}
             sub="Klik baris untuk melihat detail." />
          <C pad={0}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--surface-soft)" }}>
                    {[isYay ? "Sekolah" : "Kelas", "Siswa", "Kecerdasan utama", "Kesadaran Diri", "Kebiasaan Belajar", "Arah Karier", "Perlu dukungan"].map((h, i) => (
                      <th key={i} style={{ textAlign: "left", padding: "13px 16px", fontSize: 11, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--ink-4)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {D.breakdown.map((u, i) => {
                    const m = window.MI_BY[u.topMI];
                    return (
                      <tr key={i} style={{ borderBottom: i < D.breakdown.length - 1 ? "1px solid var(--line)" : "none", cursor: "pointer", transition: "background .12s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--ungu-050)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        onClick={() => setModal({ type: "intel", code: u.topMI })}>
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{u.name}</div>
                          {isYay && <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 1 }}>{u.jenjang}</div>}
                        </td>
                        <td style={{ padding: "13px 16px", fontSize: 13.5, fontWeight: 700, color: "var(--ink-2)" }}>{u.nSiswa}</td>
                        <td style={{ padding: "13px 16px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><IB code={u.topMI} size={26} /><span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>{m.name}</span></span>
                        </td>
                        {[["sa", "saD", "var(--ungu)"], ["lb", "lbD", "#2F6BD4"], ["cf", "cfD", "#C57A2C"]].map(([k, dk, col], j) => (
                          <td key={j} style={{ padding: "13px 16px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                              <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{u[k]}</span>
                              <window.DeltaChip value={u[dk]} size={10.5} />
                            </span>
                          </td>
                        ))}
                        <td style={{ padding: "13px 16px" }}>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: u.cemas > 30 ? "var(--perhatian)" : "var(--ink-3)" }}>
                            <window.IconFlag size={13} style={{ marginRight: 5 }} />{u.cemas} siswa
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </C>
        </div>
      )}

      {/* ---- TABEL SISWA (Wali only) ---- */}
      {isWali && (
        <div>
          <B kicker="Per siswa" title="Potret tiap siswa di kelas"
             sub="Klik baris untuk membuka profil dan rekomendasi." />
          <C pad={0}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--surface-soft)" }}>
                    {["Siswa", "Kecerdasan utama", "Kesadaran Diri", "Kebiasaan Belajar", "Arah Karier", "Catatan"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "13px 16px", fontSize: 11, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--ink-4)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {D.students.map((s, i) => {
                    const m = window.MI_BY[s.top];
                    const flagMap = { cemas: { t: "Cemas tinggi", c: "var(--waspada)", bg: "var(--waspada-bg)" }, fokus: { t: "Fokus rendah", c: "var(--perhatian)", bg: "var(--perhatian-bg)" } };
                    return (
                      <tr key={i} style={{ borderBottom: i < D.students.length - 1 ? "1px solid var(--line)" : "none", cursor: "pointer", transition: "background .12s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--ungu-050)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        onClick={() => setModal({ type: "student", idx: i })}>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", fontSize: 11.5, fontWeight: 800, flex: "none" }}>{s.nama[0]}</span>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{s.nama}</span>
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><IB code={s.top} size={24} /><span style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600 }}>{m.name}</span></span>
                        </td>
                        {[["sa", "saD", "var(--ungu)"], ["lb", "lbD", "#2F6BD4"], ["cf", "cfD", "#C57A2C"]].map(([k, dk, col], j) => (
                          <td key={j} style={{ padding: "12px 16px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                              <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{s[k]}</span>
                              <window.DeltaChip value={s[dk]} size={10.5} />
                            </span>
                          </td>
                        ))}
                        <td style={{ padding: "12px 16px" }}>
                          {s.flag ? <span style={{ fontSize: 11.5, fontWeight: 700, color: flagMap[s.flag].c, background: flagMap[s.flag].bg, padding: "4px 9px", borderRadius: 99 }}>{flagMap[s.flag].t}</span>
                            : <span style={{ fontSize: 12, color: "var(--ink-4)" }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </C>
        </div>
      )}

      {/* ---- TEMA REFLEKSI ---- */}
      <div>
        <B kicker="Suara siswa · analisis refleksi" title="Tema yang paling sering muncul"
           sub="Klik kartu untuk melihat konteks dan rekomendasi tindak lanjut." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {D.themes.map((t, i) => {
            const maxN = Math.max(...D.themes.map((x) => x.n));
            return (
              <button key={i} onClick={() => setModal({ type: "theme", idx: i })} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "18px 20px", textAlign: "left", cursor: "pointer", transition: "all .14s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--ungu-300)"; e.currentTarget.style.background = "var(--ungu-050)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "var(--surface)"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", lineHeight: 1.35 }}>{t.theme}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ungu)", background: "var(--ungu-050)", padding: "4px 10px", borderRadius: 99, whiteSpace: "nowrap", flex: "none" }}>{t.n.toLocaleString("id-ID")} siswa</span>
                </div>
                <div style={{ height: 5, background: "var(--bg-2)", borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ width: `${(t.n / maxN) * 100}%`, height: "100%", background: "var(--ungu)", borderRadius: 99 }} />
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5, fontStyle: "italic", borderLeft: "2px solid var(--ungu-100)", paddingLeft: 10 }}>"{t.quote}"</p>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ungu)", marginTop: 10 }}>Klik untuk konteks lengkap →</div>
              </button>
            );
          })}
        </div>
        <C style={{ marginTop: 18 }}>
          <RG tone="insight" label="Ringkasan suara siswa">
            Mayoritas refleksi mengarah ke <b>belajar visual</b> dan <b>belajar bersama</b> — selaras dengan kecerdasan Interpersonal & Spasial yang dominan. Tema <b>mengatasi cemas ujian</b> memperkuat temuan {D.flags.cemasTinggi} siswa yang perlu dukungan kelola stres.
          </RG>
        </C>
      </div>

      {/* ---- MODALS ---- */}
      {modal?.type === "intel" && (
        <window.IGModal onClose={() => setModal(null)} title={window.MI_DEEP[modal.code]?.judul || "Detail Kecerdasan"}>
          <IntelClassModal code={modal.code} />
        </window.IGModal>
      )}
      {modal?.type === "student" && (
        <window.IGModal onClose={() => setModal(null)} title="Profil Siswa" width={540}>
          <StudentModal idx={modal.idx} />
        </window.IGModal>
      )}
      {modal?.type === "theme" && (
        <window.IGModal onClose={() => setModal(null)} title="Tema Refleksi" width={520}>
          <ThemeModal idx={modal.idx} />
        </window.IGModal>
      )}
    </div>
  );
}

window.CohortView = CohortView;

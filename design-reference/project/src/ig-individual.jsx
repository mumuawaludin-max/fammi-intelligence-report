// ============================================================
// INTELI-GEN · INDIVIDUAL VIEW v2 — satu siswa.
// voice: "siswa" | "ortu"
// compact: true → single-column (untuk tampilan mobile Siswa/Ortu)
// ============================================================
const { useState: useStateIV2 } = React;

function IndividualView({ voice, compact }) {
  const S = window.STUDENT;
  const isS = voice === "siswa";
  const miList = window.studentMIList();
  const top = miList.slice(0, 3);
  const low = miList[miList.length - 1];
  const J = S.journey;
  const labels = window.TL.map((t) => t.short);
  const combo = window.comboFor([top[0].code, top[1].code]);

  // modal state
  const [modal, setModal] = useStateIV2(null);
  // { type: "intel", code } | { type: "profile" } | { type: "reflection", idx }

  const C = window.IGCard, CH = window.IGCardHead, RG = window.IGRingkasan, IB = window.IntelBadge, LB = window.LevelBadge, B = window.IGBand;
  const col2 = compact ? "1fr" : "minmax(0,1fr) minmax(0,1.15fr)";
  const col3 = compact ? "1fr" : "repeat(3, 1fr)";

  // ============ HERO ============
  const Hero = (
    <section style={{
      background: "linear-gradient(135deg, #6B2BE0 0%, #4F14B8 100%)", borderRadius: "var(--radius-xl)",
      padding: compact ? "24px 20px" : "28px 32px", color: "#fff", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", right: -50, top: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div style={{ maxWidth: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
            <span style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(255,255,255,0.16)", display: "grid", placeItems: "center", fontSize: 17, fontWeight: 800, flex: "none" }}>{S.panggilan[0]}</span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{isS ? S.panggilan : S.nama}</div>
              <div style={{ fontSize: 12, color: "#E9DDFF" }}>{S.kelas} · {S.sekolah}</div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: compact ? 17 : 20, lineHeight: 1.45, fontWeight: 600, letterSpacing: "-.01em", textWrap: "pretty" }}>
            {isS ? "Cara belajarmu paling kuat lewat " : `${S.panggilan} paling cepat paham lewat `}
            <span style={{ borderBottom: "2px solid rgba(255,255,255,.45)" }}>{top[0].name.toLowerCase()}</span>
            {" & "}
            <span style={{ borderBottom: "2px solid rgba(255,255,255,.45)" }}>{top[1].name.toLowerCase()}</span>.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button onClick={() => setModal({ type: "profile" })} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 10, padding: "9px 16px", cursor: "pointer", backdropFilter: "blur(4px)", transition: "background .15s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.28)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}>
              <window.IconSparkle size={15} /> Baca profil lengkap
            </button>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.75)", background: "rgba(255,255,255,0.10)", borderRadius: 10, padding: "9px 14px" }}>
              <window.IconCalendar size={14} /> Jun – Des 2026
            </span>
          </div>
        </div>
        {!compact && (
          <div style={{ display: "flex", gap: 12, flex: "none" }}>
            {[top[0], top[1]].map((m, i) => (
              <button key={i} onClick={() => setModal({ type: "intel", code: m.code })} style={{ background: "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 16, padding: "16px 18px", minWidth: 140, cursor: "pointer", textAlign: "left", transition: "background .15s", backdropFilter: "blur(6px)", color: "#fff" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.13)"}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#E9DDFF", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>{i === 0 ? "Terkuat" : "Kedua"}</div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1 }}>{m.index}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 5 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: "#E9DDFF", marginTop: 3 }}>Klik untuk detail →</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  // ============ MI PROFILE ============
  const MISection = (
    <div>
      <B kicker="Profil Kecerdasan · diukur sekali di awal"
         title={isS ? "Delapan cara belajar, dari yang terkuat" : `Peta delapan kecerdasan ${S.panggilan}`}
         sub={isS ? "Index 0–100 dari 7 pernyataan per kecerdasan. Klik tiap baris untuk memahami artinya bagi cara belajarmu." : `Index 0–100 menunjukkan seberapa efektif tiap cara belajar bagi ${S.panggilan}. Klik tiap baris untuk memahami artinya dan cara mendukungnya di rumah.`} />
      <div style={{ display: "grid", gridTemplateColumns: col2, gap: 18, alignItems: "stretch" }}>
        <C>
          <CH title="Radar kecerdasan" Icon={window.IconBrain} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 320 }}>
              <window.Radar axes={miList.map((m) => ({ label: m.name, short: m.code, value: m.index, max: 100 }))} size={300} />
            </div>
          </div>
          {/* combo insight */}
          <div style={{ background: `color-mix(in srgb, ${top[0].color} 8%, var(--bg-2))`, border: `1px solid color-mix(in srgb, ${top[0].color} 20%, transparent)`, borderRadius: 12, padding: "12px 14px", marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: top[0].color, marginBottom: 5 }}>{combo.judul}</div>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)", textWrap: "pretty" }}>{combo.desc.split(".")[0] + "."}</p>
            <button onClick={() => setModal({ type: "profile" })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: top[0].color, marginTop: 5, padding: 0 }}>Baca interpretasi lengkap →</button>
          </div>
        </C>
        <C>
          <CH title="Peringkat kedelapan kecerdasan" sub="Klik tiap baris untuk penjelasan mendalam." Icon={window.IconScale} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {miList.map((m) => (
              <button key={m.code} onClick={() => setModal({ type: "intel", code: m.code })} style={{ display: "flex", alignItems: "center", gap: 11, background: "none", border: "none", cursor: "pointer", borderRadius: 12, padding: "8px 10px", textAlign: "left", transition: "background .14s ease", width: "100%" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--ungu-050)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <IB code={m.code} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{m.name}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{m.index}</span>
                      <LB index={m.index} />
                    </span>
                  </div>
                  <div style={{ height: 6, background: "var(--bg-2)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${m.index}%`, height: "100%", background: m.color, borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 3 }}>{m.tagline}</div>
                </div>
                <window.IconArrowRight size={14} style={{ color: "var(--ink-4)", flex: "none" }} />
              </button>
            ))}
          </div>
        </C>
      </div>
      <C style={{ marginTop: 18 }}>
        <RG tone="insight" label="Ringkasan profil">
          {isS ? <>Tiga cara belajarmu terkuat: <b>{top[0].name}</b>, <b>{top[1].name}</b>, dan <b>{top[2].name}</b> — semuanya level <b>Kuat</b>. Kecerdasan yang paling perlu dikembangkan adalah <b>{low.name}</b>; bukan kelemahan, hanya gaya yang belum terbiasa dipakai.</> :
            <>Tiga kekuatan belajar {S.panggilan}: <b>{top[0].name}</b>, <b>{top[1].name}</b>, dan <b>{top[2].name}</b>. Yang perlu didukung adalah <b>{low.name}</b> — bukan kelemahan, melainkan gaya yang belum terlatih.</>}
        </RG>
      </C>
    </div>
  );

  // ============ STRATEGI ============
  const StrategiSection = (
    <div>
      <B kicker="Dari kekuatan ke aksi"
         title={isS ? "Strategi belajar yang cocok untukmu" : `Cara terbaik mendukung ${S.panggilan}`}
         sub={isS ? "Tiga kecerdasan terkuatmu diterjemahkan jadi cara belajar konkret yang bisa langsung kamu terapkan. Klik kartu untuk penjelasan lebih dalam." : `Tiga kecerdasan terkuat ${S.panggilan} diterjemahkan jadi cara belajar konkret dan cara orang tua mendukungnya. Klik untuk melihat rekomendasi spesifik.`} />
      <div style={{ display: "grid", gridTemplateColumns: col3, gap: 16 }}>
        {top.map((m) => (
          <button key={m.code} onClick={() => setModal({ type: "intel", code: m.code })} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "18px 18px", textAlign: "left", cursor: "pointer", transition: "all .16s ease", display: "block", width: "100%" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.boxShadow = `0 0 0 3px color-mix(in srgb, ${m.color} 15%, transparent), var(--shadow-card)`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "var(--shadow-card)"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <IB code={m.code} size={38} tone="solid" />
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>{m.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{m.tagline}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
              {m.strategi.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.4 }}>
                  <window.IconCheckCircle size={14} style={{ color: m.color, flex: "none", marginTop: 2 }} />{s}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {m.karir.slice(0, 3).map((k, i) => (
                <span key={i} style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-3)", background: "var(--bg-2)", padding: "4px 9px", borderRadius: 99 }}>{k}</span>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: m.color }}>Klik untuk penjelasan lengkap →</div>
          </button>
        ))}
      </div>
    </div>
  );

  // ============ MI × MAPEL ============
  const MapelSection = (
    <div>
      <B kicker="Kecerdasan ketemu pelajaran" title="Kesesuaian cara belajar dengan mata pelajaran" />
      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(3, 1fr) 1.3fr", gap: 14 }}>
        {[{ tag: "Paling disukai", val: S.mapel.suka, Icon: window.IconHeart, tone: "var(--ungu)" },
          { tag: "Paling mudah", val: S.mapel.mudah, Icon: window.IconCheckCircle, tone: "var(--aman)" },
          { tag: "Paling sulit", val: S.mapel.sulit, Icon: window.IconFlag, tone: "var(--perhatian)" }].map((s, i) => (
          <C key={i}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: `color-mix(in srgb, ${s.tone} 14%, transparent)`, color: s.tone, display: "grid", placeItems: "center", marginBottom: 12 }}><s.Icon size={18} /></span>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--ink-4)", marginBottom: 5 }}>{s.tag}</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: "var(--ink)" }}>{s.val}</div>
          </C>
        ))}
        <C style={{ background: "var(--ungu-050)", border: "1px solid var(--ungu-100)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9, color: "var(--ungu-700)" }}>
            <window.IconSparkle size={16} /><span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" }}>Insight</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)", textWrap: "pretty" }}>
            Kesulitan di <b>{S.mapel.sulit}</b> sejalan dengan profil — <b>Logis-Matematis</b> ada di level berkembang. Coba dekati lewat kekuatan <b>Spasial</b>: ubah soal jadi diagram visual.
          </p>
        </C>
      </div>
    </div>
  );

  // ============ PERJALANAN 6 BULAN ============
  const series = [
    { label: "Kesadaran Diri", data: J.sa, color: "var(--ungu)" },
    { label: "Kebiasaan Belajar", data: J.lb, color: "#2F6BD4" },
    { label: "Arah Karier", data: J.cf, color: "#C57A2C" },
  ];
  const PerjalananSection = (
    <div>
      <B kicker="Pemantauan bulanan · baseline → bulan 6"
         title={isS ? "Perjalananmu selama enam bulan" : `Perjalanan belajar ${S.panggilan} selama enam bulan`}
         sub={isS ? "Tiga aspek dipantau tiap bulan: seberapa kenal dirimu sendiri, kualitas kebiasaan belajarmu, dan kejelasan arah kariermu. Klik ringkasan untuk interpretasi mendalam." : `Tiga aspek yang dipantau tiap bulan: kesadaran diri, kebiasaan belajar, dan kejelasan arah karier ${S.panggilan}. Data ini membantu Anda melihat perkembangan dari waktu ke waktu.`} />
      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1.45fr 1fr", gap: 18 }}>
        <C>
          <CH title="Tren tiga indeks" sub="Index 0–100 per bulan." Icon={window.IconArrowUpRight}
              right={<window.LegendRow items={series.map((s) => ({ color: s.color, label: s.label }))} />} />
          <window.TrendLines series={series} labels={labels} />
        </C>
        <C>
          <CH title="Perubahan vs awal" Icon={window.IconScale} />
          <window.Dumbbell rows={[
            { label: "Kesadaran Diri", from: J.sa[0], to: J.sa[6], color: "var(--ungu)" },
            { label: "Kebiasaan Belajar", from: J.lb[0], to: J.lb[6], color: "#2F6BD4" },
            { label: "Arah Karier", from: J.cf[0], to: J.cf[6], color: "#C57A2C" },
          ]} />
        </C>
      </div>
      <C style={{ marginTop: 18 }}>
        <RG tone="good" label="Ringkasan perjalanan">
          {isS ? <>Arah Karier naik paling tajam (+{window.delta(J.cf)} poin), diikuti Kesadaran Diri (+{window.delta(J.sa)}). Kebiasaan Belajar sempat turun di bulan 2 lalu pulih +{window.delta(J.lb)} poin. Arahnya konsisten membaik.</> :
            <>Arah Karier naik paling tajam (+{window.delta(J.cf)} poin), diikuti Kesadaran Diri (+{window.delta(J.sa)}). Kebiasaan Belajar sempat turun di bulan 2 lalu pulih +{window.delta(J.lb)} poin — tren stabil menuju akhir semester.</>}
        </RG>
      </C>
    </div>
  );

  // ============ KEBIASAAN BULAN INI ============
  const KebiasaanSection = (
    <div>
      <B kicker="Potret bulan terakhir" title="Rincian kebiasaan & kesiapan" />
      <div style={{ display: "grid", gridTemplateColumns: col3, gap: 16 }}>
        <C>
          <CH title="Kebiasaan belajar" Icon={window.IconRefresh} />
          <window.BarList rows={S.lbBreak.map((b) => ({ label: b.label, value: b.value, max: 100, tag: String(b.value) }))} />
          <div style={{ marginTop: 14, display: "flex", gap: 9, alignItems: "center", fontSize: 12.5, color: "var(--ink-2)", background: "var(--bg-2)", padding: "10px 12px", borderRadius: 10 }}>
            <window.IconUsers size={15} style={{ color: "var(--ungu)", flex: "none" }} />
            Paling nyaman belajar <b style={{ color: "var(--ink)", marginLeft: 4 }}>{S.environment.toLowerCase()}</b>
          </div>
        </C>
        <C>
          <CH title="Kesadaran diri" Icon={window.IconCalmFace} />
          <window.BarList rows={S.saBreak.map((b) => ({ label: b.label, value: b.value, max: 100, tag: String(b.value), color: "var(--ungu)" }))} />
          <RG tone="insight" label="Catatan">
            {isS ? "Kesadaran kekuatanmu akurat — kamu menyebut kemampuan memahami teman, yang sejalan persis dengan Interpersonal yang terukur Kuat." : `Kesadaran diri ${S.panggilan} akurat — ia menyebut kemampuan memahami teman, yang sejalan dengan Interpersonal yang terukur Kuat.`}
          </RG>
        </C>
        <C>
          <CH title="Arah karier" Icon={window.IconArrowUpRight} />
          <window.BarList rows={S.cfBreak.map((b) => ({ label: b.label, value: b.value, max: 100, tag: String(b.value), color: "#C57A2C" }))} />
          <div style={{ marginTop: 14, display: "flex", gap: 9, alignItems: "center", fontSize: 12.5, color: "var(--ink-2)", background: "var(--bg-2)", padding: "10px 12px", borderRadius: 10 }}>
            <window.IconScale size={15} style={{ color: "#C57A2C", flex: "none" }} />
            Mengenal <b style={{ color: "var(--ink)", margin: "0 4px" }}>{S.digitalProf}</b> profesi digital
          </div>
        </C>
      </div>
    </div>
  );

  // ============ REFLEKSI ============
  const RefleksiSection = (
    <div>
      <B kicker="Kata-kata sendiri · refleksi tiap bulan"
         title={isS ? "Perjalananmu dalam kata-katamu sendiri" : `Apa yang ${S.panggilan} ceritakan tiap bulan`}
         sub={isS ? "Satu pertanyaan refleksi setiap bulan — jawabanmu sendiri, bukan penilaian orang lain. Ini jejak pertumbuhan cara berpikirmu." : `Satu pertanyaan refleksi berbeda setiap bulan, dijawab ${S.panggilan} dengan kata-katanya sendiri. Ini adalah jendela paling jujur ke dalam perkembangan cara belajarnya.`} />
      <div style={{ position: "relative", paddingLeft: 22 }}>
        <span style={{ position: "absolute", left: 5, top: 8, bottom: 8, width: 2, background: "var(--line)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {S.reflections.map((r, i) => {
            const tl = window.TL.find((t) => t.key === r.tl);
            const isLast = i === S.reflections.length - 1;
            return (
              <div key={i} style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: -22, top: 18, width: 14, height: 14, borderRadius: 99, background: isLast ? "var(--ungu)" : "var(--surface)", border: "2px solid " + (isLast ? "var(--ungu)" : "var(--ungu-300)") }} />
                <button onClick={() => setModal({ type: "reflection", idx: i })} style={{ display: "block", width: "100%", textAlign: "left", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)", padding: "14px 16px", cursor: "pointer", transition: "all .14s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--ungu-300)"; e.currentTarget.style.background = "var(--ungu-050)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "var(--surface)"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ungu)", background: "var(--ungu-050)", padding: "2px 8px", borderRadius: 99 }}>{tl.label}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>{r.prompt}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.55, textWrap: "pretty" }}>"{r.text}"</p>
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <C style={{ marginTop: 16 }}>
        <RG tone="insight" label="Benang merah refleksi">
          Kata kunci yang berulang: <b>visual</b>, <b>belajar bersama</b>, dan <b>menyiapkan jauh hari</b>. Pola ini menegaskan profil Spasial–Interpersonal dan menunjukkan rasa cemas ujian yang menurun dari bulan ke bulan.
        </RG>
      </C>
    </div>
  );

  // ============ REFLECTION MODAL ============
  const reflModal = modal?.type === "reflection" ? (() => {
    const r = S.reflections[modal.idx];
    const tl = window.TL.find((t) => t.key === r.tl);
    const miRelated = top.slice(0, 2);
    return (
      <window.IGModal onClose={() => setModal(null)} title={`Refleksi · ${tl.label}`} width={560}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ background: "var(--bg-2)", borderRadius: 13, padding: "14px 16px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 7 }}>Pertanyaan refleksi</div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{r.prompt}</p>
          </div>
          <div style={{ borderLeft: "3px solid var(--ungu)", paddingLeft: 14 }}>
            <p style={{ margin: 0, fontSize: 14.5, color: "var(--ink)", lineHeight: 1.65, fontStyle: "italic" }}>"{r.text}"</p>
          </div>
          <div style={{ background: "var(--ungu-050)", borderRadius: 13, padding: "14px 16px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ungu-700)", marginBottom: 7 }}>Kaitannya dengan profil kecerdasan</div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
              Pernyataan ini konsisten dengan kecerdasan <b>{miRelated[0].name}</b> dan <b>{miRelated[1].name}</b> yang terukur kuat. Cara belajar yang {isS ? "kamu" : S.panggilan + " lakukan"} dalam refleksi ini adalah ekspresi alami dari kedua kecerdasan tersebut.
            </p>
          </div>
        </div>
      </window.IGModal>
    );
  })() : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 24 : 32 }}>
      {Hero}
      {MISection}
      {StrategiSection}
      {MapelSection}
      {PerjalananSection}
      {KebiasaanSection}
      {RefleksiSection}

      {/* === MODALS === */}
      {modal?.type === "intel" && (
        <window.IGModal onClose={() => setModal(null)} title={window.MI_DEEP[modal.code]?.judul || "Kecerdasan"} width={660}>
          <window.IGIntelPanel code={modal.code} index={window.STUDENT.mi[modal.code]} roleCtx={voice} />
        </window.IGModal>
      )}
      {modal?.type === "profile" && (
        <window.IGModal onClose={() => setModal(null)} title="Profil Psikologis Lengkap" width={680}>
          <window.IGProfilePanel voice={voice} />
        </window.IGModal>
      )}
      {reflModal}
    </div>
  );
}

window.IndividualView = IndividualView;

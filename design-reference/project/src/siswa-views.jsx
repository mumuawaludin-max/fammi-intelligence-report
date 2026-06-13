const { useState: useStateSV } = React;

// ---- dark-theme chart palettes ----
const S_KAR_COLOR = {
  "Konsisten": "#B68CFF",
  "Sering Muncul": "#9D6BFF",
  "Kadang Muncul": "var(--perhatian)",
  "Belum Muncul": "var(--ink-4)",
};
const S_INTEL_COLOR = { "Kuat": "#B68CFF", "Sedang": "#8B5CF6", "Berkembang": "var(--ink-4)" };
const S_WELL = { aman: 100, perhatian: 64, waspada: 28 };
const sShortKar = (n) => (n === "7 Kebiasaan Anak Hebat" ? "7 Kebiasaan" : n);
function sWellbeing() {
  const a = window.O_ASPEK;
  return Math.round(a.reduce((s, x) => s + (S_WELL[x.status] || 70), 0) / a.length);
}

function SLegend({ items }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 6 }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: "var(--ink-3)" }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: it.color, flex: "none" }} /> {it.label}
        </span>
      ))}
    </div>
  );
}

// ============================================================
// BERANDA
// ============================================================
function SBeranda({ setActiveView, ids }) {
  const c = window.CHILD;
  const has = (k) => ids.includes(k);
  const dom = window.O_INTEL.filter((i) => i.level === "Kuat");
  const perhatian = window.O_ASPEK.filter((a) => a.status === "perhatian");
  const well = sWellbeing();
  const heroRing = has("karakter") ? { value: c.karakter, grad: ["#C9B0FF", "#7C3AED"], label: "Karakter" }
    : has("screening") ? { value: well, grad: ["#5EEAD4", "#14B8A6"], label: "Perasaan" }
    : { value: Math.round(dom[0].score / 25 * 100), grad: ["#B0C2FF", "#5B79F0"], label: "Bakat" };
  const bits = [];
  if (has("karakter")) bits.push("karaktermu makin kuat");
  if (has("bakat")) bits.push("bakatmu mulai bersinar");
  if (has("screening")) bits.push("dan perasaanmu lagi cukup cerah");
  const tail = bits.join(", ").replace(", dan", " dan");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* hero */}
      <window.SCard glow style={{ padding: "22px 20px", background: "linear-gradient(150deg, rgba(157,107,255,0.28), rgba(109,40,217,0.10) 60%, rgba(255,255,255,0.02))" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <window.SChip><window.IconSparkle size={12} /> Semester ini</window.SChip>
            <h2 style={{ margin: "12px 0 0", fontSize: 23, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.15, color: "#fff" }}>Halo, {c.panggilan}!</h2>
            <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)", textWrap: "pretty" }}>
              Kamu berkembang pesat semester ini. {tail.charAt(0).toUpperCase() + tail.slice(1)}.
            </p>
          </div>
          <window.RingGauge value={heroRing.value} size={104} stroke={11} gradient={heroRing.grad} label={heroRing.label} />
        </div>
      </window.SCard>

      {/* superpowers */}
      {has("bakat") && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ungu-bright)", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 11, fontFamily: "'Space Grotesk', sans-serif" }}>Kekuatan supermu</div>
          <div style={{ display: "flex", gap: 11 }}>
            {dom.map((it) => {
              const MIc = window.INTEL_ICON[it.code];
              return (
                <window.SCard key={it.code} style={{ flex: 1, padding: "16px 15px", textAlign: "center" }}>
                  <span style={{ width: 44, height: 44, margin: "0 auto", borderRadius: 13, background: "linear-gradient(135deg, #B68CFF, #6D28D9)", color: "#fff", display: "grid", placeItems: "center", boxShadow: "0 8px 22px rgba(124,58,237,0.5)" }}><MIc size={22} /></span>
                  <div style={{ marginTop: 11, fontSize: 14.5, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>{it.name}</div>
                  <div style={{ marginTop: 3, fontSize: 11.5, fontWeight: 700, color: "var(--ungu-bright)" }}>{it.score}/25 · Kuat</div>
                </window.SCard>
              );
            })}
          </div>
        </div>
      )}

      {/* quick tiles */}
      <div style={{ display: "flex", gap: 11 }}>
        {has("karakter") && <STile label="Karakter" value={c.karakter + "%"} trend={c.karakterTrend} onClick={() => setActiveView("karakter")} Icon={window.IconHeart} />}
        {has("screening") && <STile label="Perasaan" value={well} sub="/ 100" onClick={() => setActiveView("perasaan")} Icon={window.IconShield} tone={perhatian.length ? "perhatian" : "aman"} />}
        {has("bakat") && <STile label="Bakat" value={dom.length} sub="menonjol" onClick={() => setActiveView("bakat")} Icon={window.IconSparkle} />}
      </div>

      {/* quote */}
      {(has("karakter") || has("screening")) && (
        <window.SCard style={{ padding: "20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--ungu-100)", color: "var(--ungu-bright)", display: "grid", placeItems: "center" }}><window.IconChat size={16} /></span>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>Kata kamu sendiri</h3>
          </div>
          <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
            <span style={{ fontSize: 38, lineHeight: .8, color: "var(--ungu)", fontWeight: 800, fontFamily: "Georgia, serif", flex: "none" }}>&ldquo;</span>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "var(--ink)", fontWeight: 500, fontStyle: "italic" }}>{window.O_DUKUNGAN}</p>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "var(--ink-3)" }}>Ini yang kamu sampaikan saat asesmen. Terima kasih sudah jujur.</p>
        </window.SCard>
      )}

      {/* jump links */}
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {has("karakter") && <SJump Icon={window.IconHeart} title="Karaktermu" note="6 kebiasaan baik yang kamu tumbuhkan" onOpen={() => setActiveView("karakter")} />}
        {has("screening") && <SJump Icon={window.IconShield} title="Perasaanmu" note={perhatian.length ? "Ada 1 hal yang bisa kamu rawat" : "Semua terasa baik"} tone={perhatian.length ? "perhatian" : "aman"} onOpen={() => setActiveView("perasaan")} />}
        {has("bakat") && <SJump Icon={window.IconSparkle} title="Bakatmu" note={"Menonjol: " + dom.map((d) => d.name).join(" & ")} onOpen={() => setActiveView("bakat")} />}
      </div>
    </div>
  );
}

function STile({ label, value, sub, trend, Icon, tone, onClick }) {
  const col = tone === "perhatian" ? "var(--perhatian)" : "var(--ungu-bright)";
  return (
    <button onClick={onClick} style={{ flex: 1, textAlign: "left", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.04)", padding: "13px 13px", display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--ungu-100)", color: col, display: "grid", placeItems: "center" }}><Icon size={16} /></span>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.02em" }}>{value}</span>
          {sub && <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-3)" }}>{sub}</span>}
          {trend && <window.STrend t={trend} size={13} />}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-3)", marginTop: 1 }}>{label}</div>
      </div>
    </button>
  );
}

function SJump({ Icon, title, note, tone, onOpen }) {
  const col = tone === "perhatian" ? "var(--perhatian)" : "var(--ungu-bright)";
  return (
    <button onClick={onOpen} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 13, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", padding: "14px 15px" }}>
      <span style={{ width: 42, height: 42, borderRadius: 13, background: "var(--ungu-100)", color: col, display: "grid", placeItems: "center", flex: "none" }}><Icon size={21} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{note}</div>
      </div>
      <window.IconArrowRight size={18} style={{ color: "var(--ink-4)", flex: "none" }} />
    </button>
  );
}

// ============================================================
// KARAKTER — level donut + ring-medallion "badges"
// ============================================================
function SKarakter({ embedded }) {
  const levels = ["Konsisten", "Sering Muncul", "Kadang Muncul"];
  const counts = levels.map((lv) => ({ lv, n: window.O_KARAKTER.filter((k) => k.level === lv).length }));
  const segments = counts.filter((x) => x.n > 0).map((x) => ({ value: x.n, color: S_KAR_COLOR[x.lv], label: x.lv }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {!embedded && <window.SHeading kicker="Lencana Karakter" title="Karaktermu" sub="Enam kebiasaan baik yang kamu tumbuhkan di sekolah dan di rumah. Kumpulkan terus lencananya!" />}

      {/* donut overview */}
      <window.SCard style={{ padding: "20px 18px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <window.Donut segments={segments} size={132} stroke={20} center={window.O_KARAKTER.length} centerSub="Karakter" />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 9 }}>
            {counts.map((x) => (
              <div key={x.lv} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: S_KAR_COLOR[x.lv], flex: "none" }} />
                <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 600, flex: 1 }}>{x.lv}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{x.n}</span>
              </div>
            ))}
          </div>
        </div>
      </window.SCard>

      {/* ring-medallion badges */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {window.O_KARAKTER.map((k) => <SBadgeCard key={k.name} k={k} />)}
      </div>

      <SHomeTip>
        Kesantunanmu sedang tumbuh dan sudah makin baik. Coba perhatikan pilihan kata saat sedang kesal — pelan-pelan saja, kamu pasti bisa.
      </SHomeTip>
    </div>
  );
}

function SBadgeCard({ k }) {
  const col = S_KAR_COLOR[k.level];
  const earned = k.level === "Konsisten";
  return (
    <window.SCard style={{ padding: "15px 16px", display: "flex", alignItems: "center", gap: 15 }}>
      <div style={{ position: "relative", flex: "none" }}>
        <window.RingGauge value={k.val} size={68} stroke={7} color={col} suffix="%" />
        {earned && <span style={{ position: "absolute", right: -2, bottom: -2, width: 22, height: 22, borderRadius: 99, background: "var(--ungu)", color: "#fff", display: "grid", placeItems: "center", border: "2px solid var(--bg)", boxShadow: "0 0 12px rgba(157,107,255,0.7)" }}><window.IconCheckCircle size={13} /></span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>{k.name}</h3>
          <window.SChip tone={k.level === "Kadang Muncul" ? "perhatian" : "ungu"} style={{ padding: "3px 9px", fontSize: 10.5 }}>{k.level} <window.STrend t={k.trend} size={11} /></window.SChip>
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-3)" }}>{k.note}</p>
      </div>
    </window.SCard>
  );
}

function SHomeTip({ children }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "16px 17px", background: "var(--ungu-100)", borderRadius: 18, border: "1px solid rgba(157,107,255,0.3)" }}>
      <span style={{ width: 34, height: 34, borderRadius: 11, background: "rgba(255,255,255,0.08)", color: "var(--ungu-bright)", display: "grid", placeItems: "center", flex: "none" }}><window.IconSparkle size={17} /></span>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ungu-bright)", marginBottom: 4 }}>Yang bisa kamu coba</div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)" }}>{children}</p>
      </div>
    </div>
  );
}

// ============================================================
// PERASAAN
// ============================================================
function SPerasaan({ embedded }) {
  const perhatian = window.O_ASPEK.filter((a) => a.status === "perhatian");
  const aman = window.O_ASPEK.filter((a) => a.status === "aman");
  const well = sWellbeing();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {!embedded && <window.SHeading kicker="Cuaca Perasaan" title="Perasaanmu" sub="Gambaran lembut tentang perasaan dan pertemananmu. Ini bukan penilaian — cuma cara mengenali diri sendiri." />}

      <window.SCard style={{ padding: "20px 18px 16px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <window.SemiGauge value={well} size={250} label="Kesejahteraan" sub="Perasaanmu secara umum lagi cerah" />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <SWellTile big={aman.length} label="Terasa baik" color="var(--aman)" />
          <SWellTile big={perhatian.length} label="Bisa dirawat" color="var(--perhatian)" />
        </div>
        <SLegend items={[{ color: "var(--waspada)", label: "Perlu perhatian" }, { color: "var(--perhatian)", label: "Dirawat" }, { color: "var(--aman)", label: "Baik" }]} />
      </window.SCard>

      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {window.O_ASPEK.map((a) => <SAspek key={a.name} a={a} />)}
      </div>
      {perhatian.map((a) => (
        <SHomeTip key={a.name}>
          Soal {a.name.toLowerCase()}: nggak apa-apa kalau lagi banyak pikiran. Coba tulis perasaanmu atau cerita ke orang yang kamu percaya, sedikit demi sedikit.
        </SHomeTip>
      ))}
      <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "13px 15px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--line)", borderRadius: 14, fontSize: 12, lineHeight: 1.5, color: "var(--ink-3)" }}>
        <window.IconShield size={15} style={{ color: "var(--ink-4)", flex: "none", marginTop: 1 }} />
        <span>Hasil ini cuma gambaran. Kalau kamu ingin ngobrol lebih jauh, guru BK di sekolah siap mendengarkan.</span>
      </div>
    </div>
  );
}

function SWellTile({ big, label, color }) {
  return (
    <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 11 }}>
      <span style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: "-.02em", lineHeight: 1 }}>{big}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)", lineHeight: 1.25 }}>{label}</span>
    </div>
  );
}

function SAspek({ a }) {
  const ok = a.status === "aman";
  const col = ok ? "var(--aman)" : "var(--perhatian)";
  return (
    <window.SCard style={{ padding: "15px 17px", display: "flex", alignItems: "flex-start", gap: 13 }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, background: ok ? "var(--aman-bg)" : "var(--perhatian-bg)", color: col, display: "grid", placeItems: "center", flex: "none" }}>
        {ok ? <window.IconCheckCircle size={20} /> : <window.IconHeart size={20} />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>{a.name}</span>
          <window.SChip tone={ok ? "aman" : "perhatian"} style={{ padding: "4px 9px", fontSize: 10.5 }}>{ok ? "Baik" : "Dirawat"}</window.SChip>
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>{a.siswa}</p>
      </div>
    </window.SCard>
  );
}

// ============================================================
// BAKAT — superpowers + radar + ranked bars + future arrows
// ============================================================
function SBakat({ embedded }) {
  const dom = window.O_INTEL.filter((i) => i.level === "Kuat");
  const r = window.O_REKOM;
  const axes = window.O_INTEL.map((it) => ({ label: it.name, short: it.code, value: it.score, max: 25 }));
  const bars = [...window.O_INTEL].sort((a, b) => b.score - a.score).map((it) => ({
    label: it.name, value: it.score, max: 25, color: S_INTEL_COLOR[it.level], tag: it.level, Icon: window.INTEL_ICON[it.code],
  }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {!embedded && <window.SHeading kicker="Kekuatan Super" title="Bakatmu" sub="Kamu punya dua kecerdasan yang paling bersinar. Ini bisa jadi petunjuk arah minat dan masa depanmu." />}

      {/* superpower cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {dom.map((it) => {
          const MIc = window.INTEL_ICON[it.code];
          return (
            <window.SCard key={it.code} glow style={{ padding: "18px 18px", background: "linear-gradient(135deg, rgba(157,107,255,0.20), rgba(255,255,255,0.02))" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 11 }}>
                <span style={{ width: 50, height: 50, borderRadius: 15, background: "linear-gradient(135deg, #B68CFF, #6D28D9)", color: "#fff", display: "grid", placeItems: "center", flex: "none", boxShadow: "0 8px 24px rgba(124,58,237,0.55)" }}><MIc size={25} /></span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ungu-bright)", textTransform: "uppercase", letterSpacing: ".08em" }}>Kekuatan super · {it.score}/25</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-.01em" }}>{it.name}</div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)" }}>{it.desc}</p>
            </window.SCard>
          );
        })}
      </div>

      {/* radar */}
      <window.SCard style={{ padding: "18px 16px 14px" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>Peta delapan kecerdasanmu</h3>
        <window.Radar axes={axes} size={290} color="#B68CFF" fill="rgba(157,107,255,0.22)" dotColor="#fff" />
        <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--ink-3)", textAlign: "center" }}>Makin jauh dari pusat, makin menonjol kecerdasan itu.</p>
      </window.SCard>

      {/* ranked bars */}
      <window.SCard style={{ padding: "20px 18px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>Peringkat kecerdasan</h3>
        <window.BarList rows={bars} accent="#9D6BFF" />
      </window.SCard>

      {/* future arrows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <SRekom title="Arah belajar yang cocok" Icon={window.IconBrain} items={[...r.jurusan, ...r.kuliah]} />
        <SRekom title="Profesi yang bisa kamu jajaki" Icon={window.IconSparkle} items={r.profesi} />
        <SRekom title="Kegiatan & ekskul buat kamu" Icon={window.IconUsers} items={r.ekskul} />
        <SRekom title="Lomba yang relevan" Icon={window.IconFlag} items={r.lomba} />
      </div>

      <SHomeTip>
        Bakat Interpersonal dan Spasialmu cocok untuk hal yang memadukan orang dan karya visual. Teruslah berkarya rupa sambil aktif berkegiatan bareng teman — itu zona suksesmu!
      </SHomeTip>
    </div>
  );
}

function SRekom({ title, Icon, items }) {
  return (
    <window.SCard style={{ padding: "18px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--ungu-100)", color: "var(--ungu-bright)", display: "grid", placeItems: "center", flex: "none" }}><Icon size={19} /></span>
        <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>{title}</h3>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((it, i) => (
          <span key={i} style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", padding: "7px 12px", borderRadius: 99 }}>{it}</span>
        ))}
      </div>
    </window.SCard>
  );
}

// ============================================================
// SINGLE-PRODUCT (dark, product-accented hero)
// ============================================================
function SProductHero({ product, children }) {
  const a = product.accent;
  const Icon = product.Icon;
  return (
    <window.SCard glow style={{ padding: "22px 20px", background: `linear-gradient(150deg, ${a.dSoft}, rgba(255,255,255,0.02))`, border: `1px solid ${a.dMain}44` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 13 }}>
        <span style={{ width: 46, height: 46, borderRadius: 14, background: `linear-gradient(135deg, ${a.dGrad[0]}, ${a.dGrad[1]})`, color: "#0C0817", display: "grid", placeItems: "center", flex: "none", boxShadow: `0 8px 24px ${a.dMain}66` }}><Icon size={24} /></span>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: a.dMain }}>{product.kicker}</div>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.02em", color: "#fff" }}>{product.name}</div>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)", textWrap: "pretty" }}>{product.tagline}</p>
      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </window.SCard>
  );
}

function SHeroStat({ product }) {
  const c = window.CHILD;
  const a = product.accent;
  if (product.id === "karakter") {
    const konsisten = window.O_KARAKTER.filter((k) => k.level === "Konsisten").length;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <window.RingGauge value={c.karakter} size={92} stroke={10} color={a.dMain} track="rgba(255,255,255,0.12)" label="Skor" />
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <SHeroFig n={konsisten + " / 6"} t="lencana sudah konsisten" />
          <SHeroFig n="Naik" t="dibanding semester lalu" />
        </div>
      </div>
    );
  }
  if (product.id === "screening") {
    const well = sWellbeing();
    const perhatian = window.O_ASPEK.filter((x) => x.status === "perhatian").length;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <window.RingGauge value={well} size={92} stroke={10} color={a.dMain} track="rgba(255,255,255,0.12)" suffix="" label="Cerah" />
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <SHeroFig n={(window.O_ASPEK.length - perhatian) + " aspek"} t="terasa baik" />
          <SHeroFig n={perhatian + " aspek"} t="bisa kamu rawat" />
        </div>
      </div>
    );
  }
  const dom = window.O_INTEL.filter((i) => i.level === "Kuat");
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {dom.map((it) => (
        <div key={it.code} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid var(--line)", borderRadius: 14, padding: "12px 13px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: a.dMain }}>{it.score}/25 · Kuat</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2, color: "#fff" }}>{it.name}</div>
        </div>
      ))}
    </div>
  );
}
function SHeroFig({ n, t }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1, letterSpacing: "-.01em", color: "#fff" }}>{n}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 3 }}>{t}</div>
    </div>
  );
}

function SSingleProduct({ product }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SProductHero product={product}><SHeroStat product={product} /></SProductHero>
      {product.id === "karakter" && <SKarakter embedded />}
      {product.id === "screening" && <SPerasaan embedded />}
      {product.id === "bakat" && <SBakat embedded />}
    </div>
  );
}

// ============================================================
// ROUTER
// ============================================================
function SViewRouter({ activeView, setActiveView, ids }) {
  if (activeView === "karakter") return <SKarakter />;
  if (activeView === "perasaan") return <SPerasaan />;
  if (activeView === "bakat") return <SBakat />;
  return <SBeranda setActiveView={setActiveView} ids={ids} />;
}

Object.assign(window, { SBeranda, SKarakter, SPerasaan, SBakat, SViewRouter, SProductHero, SSingleProduct });

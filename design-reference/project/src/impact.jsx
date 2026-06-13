const { useState: useStateIM, useEffect: useEffectIM } = React;

// ============================================================
// IMPACT VIEW — "Dampak Fammi" untuk Yayasan.
// Penuh grafik; tiap grafik membawa caption "Artinya ..." agar
// maknanya langsung terbaca. Adaptif terhadap produk aktif.
// ============================================================

function imReveal(delay = 90) {
  const [on, setOn] = useStateIM(false);
  useEffectIM(() => { const t = setTimeout(() => setOn(true), delay); return () => clearTimeout(t); }, []);
  return on;
}
const IC = (name) => window[name] || window.IconSparkle;
const I_TONE = { aman: "var(--aman)", perhatian: "var(--perhatian)", waspada: "var(--waspada)", ungu: "var(--ungu)" };
const I_TONEBG = { aman: "var(--aman-bg)", perhatian: "var(--perhatian-bg)", waspada: "var(--waspada-bg)", ungu: "var(--ungu-050)" };

// ---------- insight caption ----------
function Insight({ children, tone = "ungu" }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 16, padding: "13px 15px", background: I_TONEBG[tone], borderRadius: 13, border: "1px solid var(--line)" }}>
      <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--surface)", color: I_TONE[tone], display: "grid", placeItems: "center", flex: "none", boxShadow: "var(--shadow-card)" }}><window.IconSparkle size={15} /></span>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>
        <b style={{ color: "var(--ink)", fontWeight: 700 }}>Artinya:</b> {children}
      </p>
    </div>
  );
}

function ICard({ title, sub, children, style, right }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "22px 24px", display: "flex", flexDirection: "column", ...style }}>
      {(title || right) && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>{title}</h3>
            {sub && <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5 }}>{sub}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

// ---------- growth line (single series area, rising emphasis) ----------
function GrowthLine({ data, labels, color = "var(--ungu)", fill = "rgba(99,35,218,0.12)", yMin, yMax, unit = "%", height = 200, endBadge }) {
  const on = imReveal(120);
  const [hover, setHover] = useStateIM(null);
  const W = 560, padL = 38, padR = 20, padT = 16, padB = 38;
  const innerW = W - padL - padR, innerH = height - padT - padB;
  const lo = yMin != null ? yMin : Math.min(...data) - 4;
  const hi = yMax != null ? yMax : Math.max(...data) + 4;
  const n = data.length;
  const x = (i) => padL + (innerW * i) / (n - 1);
  const y = (v) => padT + innerH * (1 - (v - lo) / (hi - lo));
  const gid = "grad" + Math.round(lo) + Math.round(hi) + n;
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(on ? v : lo)}`).join(" ");
  const area = `${line} L ${x(n - 1)} ${y(lo)} L ${x(0)} ${y(lo)} Z`;
  const first = data[0], last = data[n - 1], delta = last - first;
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${height}`} style={{ display: "block", overflow: "visible" }} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.22" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => {
          const v = lo + (hi - lo) * f;
          return <g key={f}><line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="var(--line)" strokeWidth="1" /><text x={padL - 8} y={y(v) + 3.5} textAnchor="end" fontSize="10.5" fill="var(--ink-4)" fontWeight="600">{Math.round(v)}</text></g>;
        })}
        <path d={area} fill={`url(#${gid})`} opacity={on ? 1 : 0} style={{ transition: "opacity .9s ease .3s" }} />
        <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
          strokeDasharray="1400" strokeDashoffset={on ? 0 : 1400} style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.3,.8,.3,1)" }} />
        {data.map((v, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(on ? v : lo)} r={i === n - 1 ? 5 : 3.4} fill={i === n - 1 ? color : "var(--surface)"} stroke={color} strokeWidth="2" style={{ transition: "cy 1.2s cubic-bezier(.3,.8,.3,1)" }} />
            <text x={x(i)} y={height - 20} textAnchor="middle" fontSize="10.5" fill="var(--ink-3)" fontWeight="600">{(labels[i] || "").split("\n")[0]}</text>
            <text x={x(i)} y={height - 8} textAnchor="middle" fontSize="9.5" fill="var(--ink-4)" fontWeight="600">{(labels[i] || "").split("\n")[1] || ""}</text>
            {hover === i && <text x={x(i)} y={y(v) - 12} textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--ink)">{v}{unit}</text>}
            <rect x={x(i) - innerW / (n - 1) / 2} y={0} width={innerW / (n - 1)} height={height} fill="transparent" onMouseEnter={() => setHover(i)} />
          </g>
        ))}
        {/* delta badge near last point */}
        <g style={{ opacity: on ? 1 : 0, transition: "opacity .5s ease 1s" }}>
          <rect x={x(n - 1) - 30} y={y(last) - 40} width="60" height="22" rx="11" fill={color} />
          <text x={x(n - 1)} y={y(last) - 25} textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">+{delta}{unit}</text>
        </g>
      </svg>
    </div>
  );
}

// ---------- funnel (3 steps) ----------
function Funnel({ steps }) {
  const on = imReveal();
  const max = Math.max(...steps.map((s) => s.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {steps.map((s, i) => {
        const w = (s.value / max) * 100;
        const keep = i > 0 ? Math.round((s.value / steps[i - 1].value) * 100) : 100;
        return (
          <div key={i}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: I_TONE[s.tone] }}>{s.value} <span style={{ fontSize: 11, color: "var(--ink-4)", fontWeight: 600 }}>siswa</span></span>
            </div>
            <div style={{ position: "relative", height: 34, background: "var(--surface-soft)", borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)" }}>
              <div style={{ width: on ? `${w}%` : 0, height: "100%", background: I_TONE[s.tone], borderRadius: 10, transition: `width 1s cubic-bezier(.2,.8,.2,1) ${i * 0.12}s`, display: "flex", alignItems: "center", paddingLeft: 12 }}>
                {i > 0 && <span style={{ fontSize: 11.5, fontWeight: 700, color: "#fff", opacity: on ? 1 : 0, transition: "opacity .4s ease .8s" }}>{keep}% bertahan</span>}
              </div>
            </div>
            <p style={{ margin: "5px 0 0", fontSize: 11.5, color: "var(--ink-3)" }}>{s.note}</p>
          </div>
        );
      })}
    </div>
  );
}

// ---------- before/after paired bar ----------
function BeforeAfter({ before, now, beforeLabel, nowLabel, unit = "%", good = "down" }) {
  const on = imReveal();
  const max = Math.max(before, now);
  const improved = good === "down" ? before - now : now - before;
  const Bar = ({ v, label, color }) => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-end", height: 130 }}>
        <div style={{ width: 64, height: on ? `${(v / max) * 100}%` : 0, background: color, borderRadius: "10px 10px 0 0", transition: "height 1s cubic-bezier(.2,.8,.2,1)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{v}{unit}</span>
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)" }}>{label}</span>
    </div>
  );
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 20, padding: "0 12px", borderBottom: "1px solid var(--line)" }}>
        <Bar v={before} label={beforeLabel} color="var(--ink-4)" />
        <window.IconArrowRight size={22} style={{ color: "var(--ink-4)", marginBottom: 30, flex: "none" }} />
        <Bar v={now} label={nowLabel} color="var(--aman)" />
      </div>
      <div style={{ textAlign: "center", marginTop: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: "var(--aman)", background: "var(--aman-bg)", padding: "6px 14px", borderRadius: 99 }}>
          <window.IconArrowDown size={15} /> turun {improved} poin
        </span>
      </div>
    </div>
  );
}

// ---------- big gauge stat ----------
function GaugeStat({ value, label, note, color = "var(--ungu)", suffix = "%" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <window.RingGauge value={value} size={120} stroke={13} color={color} suffix={suffix} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", lineHeight: 1.3 }}>{label}</div>
        {note && <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.5 }}>{note}</div>}
      </div>
    </div>
  );
}

// ---------- pillar header ----------
function PillarHeader({ num, kicker, title, lead, tone = "ungu" }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <span style={{ width: 50, height: 50, borderRadius: 15, background: I_TONE[tone], color: "#fff", display: "grid", placeItems: "center", flex: "none", fontWeight: 800, fontSize: 20, boxShadow: "var(--shadow-card)" }}>{num}</span>
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: I_TONE[tone], textTransform: "uppercase", letterSpacing: ".1em" }}>{kicker}</div>
        <h2 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 800, letterSpacing: "-.02em", color: "var(--ink)", lineHeight: 1.15 }}>{title}</h2>
        <p style={{ margin: "8px 0 0", fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 760, textWrap: "pretty" }}>{lead}</p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================
function YImpactView({ modIds }) {
  const has = (m) => !modIds || modIds.includes(m);
  const levers = window.Q_LEVERS.filter((l) => !l.prod || has(l.prod));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {/* HERO */}
      <section style={{ background: "linear-gradient(135deg, #6B2BE0 0%, #4912A8 100%)", borderRadius: "var(--radius-xl)", padding: "36px 40px", color: "#fff", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-hero)" }}>
        <div style={{ position: "absolute", right: -70, top: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.14)", padding: "6px 13px", borderRadius: 99, fontSize: 12.5, fontWeight: 600, marginBottom: 16 }}>
            <window.IconSparkle size={15} /> Dampak Fammi · {window.IMPACT_SINCE}
          </div>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.2, maxWidth: 880, textWrap: "pretty" }}>
            Fammi membantu yayasan <span style={{ color: "#D9C7FF" }}>meningkatkan kualitas pendidikan</span> sekaligus <span style={{ color: "#D9C7FF" }}>memperkuat citra sekolah</span> di mata orang tua.
          </h1>
          <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap" }}>
            <HeroChip value={"+11"} unit="poin" label="capaian karakter naik" />
            <HeroChip value={"96"} unit="siswa" label="pulih setelah deteksi dini" />
            <HeroChip value={"86"} unit="%" label="orang tua merekomendasikan" />
            <HeroChip value={"95"} unit="%" label="daftar ulang tahun berikutnya" />
          </div>
        </div>
      </section>

      {/* ===== PILAR 1 ===== */}
      <PillarHeader num="1" kicker="Bukti dampak" title="Meningkatkan kualitas pendidikan"
        lead="Bukan sekadar laporan — Fammi mengubah cara sekolah memantau dan menindak. Inilah caranya, dengan angka yang bergerak ke arah benar." tone="ungu" />

      {/* cara/levers */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(levers.length, 4)}, 1fr)`, gap: 16 }}>
        {levers.map((l, i) => {
          const Icon = IC(l.Icon);
          return (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "20px 22px" }}>
              <span style={{ width: 42, height: 42, borderRadius: 12, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", marginBottom: 13 }}><Icon size={21} /></span>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink)", marginBottom: 6, letterSpacing: "-.01em" }}>{l.title}</div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ink-3)" }}>{l.text}</p>
            </div>
          );
        })}
      </div>

      {/* growth charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>
        {has("karakter") && (
          <ICard title="Capaian karakter terus naik" sub={window.IMPACT_SINCE}>
            <GrowthLine data={window.Q_GROWTH.karakter} labels={window.IMPACT_TERMS} color="var(--ungu)" yMin={60} yMax={90} />
            <Insight>{window.Q_GROWTH_INSIGHT_KAR}</Insight>
          </ICard>
        )}
        {has("screening") && (
          <ICard title="Makin banyak siswa di zona Aman" sub={window.IMPACT_SINCE}>
            <GrowthLine data={window.Q_GROWTH.aman} labels={window.IMPACT_TERMS} color="var(--aman)" fill="rgba(45,158,107,0.12)" yMin={50} yMax={85} />
            <Insight tone="aman">{window.Q_GROWTH_INSIGHT_AMAN}</Insight>
          </ICard>
        )}
        {has("screening") && (
          <ICard title="Deteksi dini yang berujung pemulihan" sub="Perjalanan siswa dalam satu tahun ajaran">
            <Funnel steps={window.Q_FUNNEL} />
            <Insight>{window.Q_FUNNEL_INSIGHT}</Insight>
          </ICard>
        )}
        {has("screening") && (
          <ICard title="Siswa berisiko makin sedikit" sub="Proporsi siswa berisiko, sebelum vs sekarang">
            <BeforeAfter before={window.Q_RISK.before} now={window.Q_RISK.now} beforeLabel={window.Q_RISK.beforeLabel} nowLabel={window.Q_RISK.nowLabel} good="down" />
            <Insight tone="aman">{window.Q_RISK_INSIGHT}</Insight>
          </ICard>
        )}
        {has("mi") && (
          <ICard title="Belajar di jalur kekuatannya" sub="Penjurusan & ekskul berbasis pemetaan bakat">
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ fontSize: 52, fontWeight: 800, color: "var(--ungu)", letterSpacing: "-.03em", lineHeight: 1 }}>{window.Q_TALENT.matched}</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4 }}>{window.Q_TALENT.label}<div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-3)", marginTop: 4 }}>{window.Q_TALENT.note}</div></div>
            </div>
            <Insight>{window.Q_TALENT_INSIGHT}</Insight>
          </ICard>
        )}
        <ICard title="Rekomendasi yang benar-benar dijalankan" sub="Tindak lanjut & kesiapan guru">
          <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
            <GaugeStat value={window.Q_FOLLOWUP.pct} label={window.Q_FOLLOWUP.label} color="var(--ungu)" />
            <GaugeStat value={window.Q_TEACHER.pct} label={window.Q_TEACHER.label} color="var(--aman)" />
          </div>
          <Insight>Rekomendasi Fammi tidak berhenti di laporan — {window.Q_FOLLOWUP.pct}% ditindaklanjuti tuntas dan {window.Q_TEACHER.pct}% guru mengubah pendekatannya. Di sinilah mutu pendidikan benar-benar terangkat.</Insight>
        </ICard>
      </div>

      {/* ===== PILAR 2 ===== */}
      <PillarHeader num="2" kicker="Bukti citra" title="Meningkatkan citra sekolah di mata orang tua"
        lead="Komunikasi yang transparan dan penuh perhatian membuat orang tua percaya, bertahan, dan merekomendasikan. Inilah buktinya." tone="aman" />

      {/* recommendation + satisfaction trend */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.2fr)", gap: 18, alignItems: "start" }}>
        <ICard title="Orang tua merekomendasikan sekolah" sub="Indikator paling jujur dari kepercayaan">
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
            <window.SemiGauge value={window.I_HEADLINE.value} size={280} label="Merekomendasikan" sub="dari seluruh orang tua responden"
              zones={[{ upto: 50, color: "var(--waspada)" }, { upto: 75, color: "var(--perhatian)" }, { upto: 100, color: "var(--aman)" }]} />
          </div>
          <Insight tone="aman">{window.I_PROOF[0].insight}</Insight>
        </ICard>
        <ICard title="Kepuasan orang tua naik tiap semester" sub="Rata-rata penilaian layanan (skala 1–5)">
          <GrowthLine data={window.I_SAT_TREND} labels={window.IMPACT_TERMS} color="var(--ungu)" yMin={3.4} yMax={4.5} unit="" />
          <Insight>{window.I_SAT_INSIGHT}</Insight>
        </ICard>
      </div>

      {/* proof grid */}
      <div>
        <window.YSectionHeading title="Bukti citra sekolah menguat" sub="Tiap angka membawa maknanya sendiri — arahkan untuk membaca." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {window.I_PROOF.map((p) => <ProofCard key={p.key} p={p} />)}
        </div>
      </div>

      {/* sentiment donut + quote */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.3fr)", gap: 18, alignItems: "stretch" }}>
        <ICard title="Nada pesan orang tua" sub="Dirangkum otomatis dari pesan terbuka">
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <window.Donut segments={window.I_SENTIMENT} size={140} stroke={20} center="99%" centerSub="Apresiasi" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {window.I_SENTIMENT.map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flex: "none" }} />
                  <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 600 }}>{s.label}</span>
                  <b style={{ fontSize: 13, color: "var(--ink)", marginLeft: "auto" }}>{s.value}%</b>
                </div>
              ))}
            </div>
          </div>
          <Insight tone="aman">{window.I_SENTIMENT_INSIGHT}</Insight>
        </ICard>
        <div style={{ background: "linear-gradient(135deg, var(--ungu-050), var(--surface))", border: "1px solid var(--ungu-100)", borderRadius: "var(--radius-lg)", padding: "30px 34px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ fontSize: 60, lineHeight: .6, color: "var(--ungu-300)", fontWeight: 800, fontFamily: "Georgia, serif" }}>&ldquo;</span>
          <p style={{ margin: "6px 0 0", fontSize: 20, lineHeight: 1.5, fontWeight: 600, color: "var(--ink)", letterSpacing: "-.01em", textWrap: "pretty" }}>{window.I_QUOTE.text}</p>
          <div style={{ marginTop: 18, fontSize: 13, fontWeight: 700, color: "var(--ungu)" }}>{window.I_QUOTE.by}</div>
        </div>
      </div>

      {/* ===== CTA / TRUST ===== */}
      <section style={{ background: "var(--ink)", borderRadius: "var(--radius-xl)", padding: "34px 40px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -60, bottom: -80, width: 260, height: 260, borderRadius: "50%", background: "rgba(124,58,237,0.22)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 34, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 540 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ungu-300)", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 10 }}>Mengapa yayasan mempercayai Fammi</div>
            <p style={{ margin: 0, fontSize: 21, lineHeight: 1.45, fontWeight: 600, letterSpacing: "-.01em", textWrap: "pretty" }}>{window.TRUST_LEAD}</p>
          </div>
          <div style={{ display: "flex", gap: 30 }}>
            {window.TRUST_POINTS.map((t, i) => {
              const Icon = IC(t.Icon);
              return (
                <div key={i} style={{ textAlign: "center" }}>
                  <Icon size={22} style={{ color: "var(--ungu-300)" }} />
                  <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.02em", marginTop: 8, lineHeight: 1 }}>{t.value}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 5, maxWidth: 120 }}>{t.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <p style={{ margin: 0, fontSize: 12, color: "var(--ink-4)" }}>Seluruh angka dan kutipan adalah data contoh untuk keperluan rancangan.</p>
    </div>
  );
}

function HeroChip({ value, unit, label }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 16, padding: "14px 18px", minWidth: 150 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.02em" }}>{value}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#D9C7FF" }}>{unit}</span>
      </div>
      <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.82)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function ProofCard({ p }) {
  const [hover, setHover] = useStateIM(false);
  const Icon = IC(p.Icon);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)",
      boxShadow: hover ? "var(--shadow-pop)" : "var(--shadow-card)", transform: hover ? "translateY(-3px)" : "none",
      transition: "all .2s ease", padding: "22px 24px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 14 }}>
        <span style={{ width: 46, height: 46, borderRadius: 13, background: I_TONEBG[p.tone], color: I_TONE[p.tone], display: "grid", placeItems: "center", flex: "none" }}><Icon size={23} /></span>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.02em", lineHeight: 1 }}>{p.value}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginTop: 4 }}>{p.label}</div>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "var(--ink-3)", paddingTop: 13, borderTop: "1px solid var(--line)" }}>
        <b style={{ color: I_TONE[p.tone], fontWeight: 700 }}>Artinya:</b> {p.insight}
      </p>
    </div>
  );
}

// ============================================================
// PARENT PULSE — ringkas, untuk dijahit ke Ringkasan Yayasan
// ============================================================
function YParentPulse({ onOpen }) {
  return (
    <section>
      <window.YSectionHeading title="Denyut kepuasan orang tua" sub="Sekilas suara orang tua lintas sekolah — bukti citra sekolah di mata mereka."
        right={<button onClick={onOpen} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", color: "var(--ungu)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Lihat Dampak Fammi <window.IconArrowRight size={15} /></button>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <PulseTile value="4,2/5" label="Kepuasan orang tua" note="naik tiap semester" Icon={window.IconSparkle} tone="ungu" />
        <PulseTile value="86%" label="Merekomendasikan sekolah" note="ke keluarga lain" Icon={window.IconHeart} tone="aman" />
        <PulseTile value="87%" label="Merasa anak diperhatikan" note="sekolah hadir konsisten" Icon={window.IconCalmFace} tone="ungu" />
        <PulseTile value="95%" label="Daftar ulang" note="bertahan tahun berikutnya" Icon={window.IconShield} tone="aman" />
      </div>
    </section>
  );
}
function PulseTile({ value, label, note, Icon, tone }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: I_TONEBG[tone], color: I_TONE[tone], display: "grid", placeItems: "center", flex: "none" }}><Icon size={19} /></span>
        <span style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.02em" }}>{value}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)" }}>{label}</div>
      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{note}</div>
    </div>
  );
}

Object.assign(window, { YImpactView, YParentPulse, Insight, GrowthLine, Funnel, BeforeAfter });

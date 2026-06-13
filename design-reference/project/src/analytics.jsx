const { useState: useStateAn, useEffect: useEffectAn, useRef: useRefAn } = React;

// ============================================================
// ANALYTICS — SVG chart primitives (light theme) + Analitik view
// Dependency-free, animated on mount. Tokens follow the page palette.
// ============================================================

function anReveal(delay = 90) {
  const [on, setOn] = useStateAn(false);
  useEffectAn(() => { const t = setTimeout(() => setOn(true), delay); return () => clearTimeout(t); }, []);
  return on;
}
const TONE = {
  aman: "var(--aman)", perhatian: "var(--perhatian)", waspada: "var(--waspada)", ungu: "var(--ungu)",
};
const toneBg = { aman: "var(--aman-bg)", perhatian: "var(--perhatian-bg)", waspada: "var(--waspada-bg)", ungu: "var(--ungu-050)" };

// risk → color ramp for heatmap (warm purple→amber→red by severity)
function riskColor(p) {
  if (p >= 30) return { bg: "#D6455A", fg: "#fff" };
  if (p >= 22) return { bg: "#E68A4E", fg: "#fff" };
  if (p >= 15) return { bg: "#E8C98F", fg: "#5b4a25" };
  if (p >= 10) return { bg: "#EADBC6", fg: "#6b5a3e" };
  return { bg: "#E7F0E9", fg: "#2E7D54" };
}

// ------------------------------------------------------------
// MULTI-LINE TREND
// series: [{ key, name, color, data:[...] , highlight }]
// ------------------------------------------------------------
function ALine({ series, labels, height = 240, yMax = 40, unit = "%", highlightKey }) {
  const on = anReveal(120);
  const [hover, setHover] = useStateAn(null);
  const W = 620, padL = 34, padR = 16, padT = 14, padB = 26;
  const innerW = W - padL - padR, innerH = height - padT - padB;
  const n = labels.length;
  const x = (i) => padL + (innerW * i) / (n - 1);
  const y = (v) => padT + innerH * (1 - v / yMax);
  const grid = [0, 10, 20, 30, 40].filter((g) => g <= yMax);
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${height}`} style={{ display: "block", overflow: "visible" }}
        onMouseLeave={() => setHover(null)}>
        {grid.map((g) => (
          <g key={g}>
            <line x1={padL} y1={y(g)} x2={W - padR} y2={y(g)} stroke="var(--line)" strokeWidth="1" />
            <text x={padL - 7} y={y(g) + 3.5} textAnchor="end" fontSize="10.5" fill="var(--ink-4)" fontWeight="600">{g}{unit === "%" ? "" : ""}</text>
          </g>
        ))}
        {labels.map((lb, i) => (
          <text key={i} x={x(i)} y={height - 7} textAnchor="middle" fontSize="10.5" fill="var(--ink-3)" fontWeight="600">{lb}</text>
        ))}
        {series.map((s) => {
          const dim = highlightKey && s.key !== highlightKey;
          const d = s.data.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(on ? v : 0)}`).join(" ");
          const len = 1400;
          return (
            <path key={s.key} d={d} fill="none" stroke={s.color} strokeWidth={dim ? 1.6 : 2.6}
              strokeLinejoin="round" strokeLinecap="round" opacity={dim ? 0.35 : 1}
              strokeDasharray={len} strokeDashoffset={on ? 0 : len}
              style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.3,.8,.3,1)" }} />
          );
        })}
        {/* end dots + hover column */}
        {series.map((s) => {
          const dim = highlightKey && s.key !== highlightKey;
          const i = n - 1;
          return <circle key={s.key} cx={x(i)} cy={y(on ? s.data[i] : 0)} r={dim ? 2.6 : 3.6} fill={s.color} opacity={dim ? 0.4 : 1}
            style={{ transition: "cy 1.1s cubic-bezier(.3,.8,.3,1)" }} />;
        })}
        {labels.map((_, i) => (
          <rect key={i} x={x(i) - innerW / (n - 1) / 2} y={0} width={innerW / (n - 1)} height={height} fill="transparent"
            onMouseEnter={() => setHover(i)} />
        ))}
        {hover != null && (
          <g>
            <line x1={x(hover)} y1={padT} x2={x(hover)} y2={height - padB} stroke="var(--ink-4)" strokeWidth="1" strokeDasharray="3 3" />
            {series.map((s) => <circle key={s.key} cx={x(hover)} cy={y(s.data[hover])} r="3.6" fill={s.color} stroke="#fff" strokeWidth="1.4" />)}
          </g>
        )}
      </svg>
      {/* legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 8 }}>
        {series.map((s) => (
          <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: s.key === highlightKey ? 700 : 600, color: s.key === highlightKey ? "var(--ink)" : "var(--ink-3)" }}>
            <span style={{ width: 12, height: 3, borderRadius: 2, background: s.color, display: "inline-block" }} /> {s.name}
            {hover != null && <b style={{ color: "var(--ink)" }}>· {s.data[hover]}%</b>}
          </span>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// HEATMAP  rows × cols
// ------------------------------------------------------------
function AHeat({ rows, cols, get, rowLabel }) {
  const on = anReveal(80);
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: `150px repeat(${cols.length}, minmax(64px, 1fr))`, gap: 6, minWidth: 360 }}>
        <span />
        {cols.map((c) => <span key={c} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--ink-3)" }}>{c}</span>)}
        {rows.map((r, ri) => (
          <React.Fragment key={r.key || r}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center" }}>{rowLabel ? rowLabel(r) : r}</span>
            {cols.map((c, ci) => {
              const v = get(r, c);
              const col = riskColor(v);
              return (
                <div key={c} title={`${v}% berisiko`} style={{
                  height: 42, borderRadius: 9, background: col.bg, color: col.fg,
                  display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800,
                  opacity: on ? 1 : 0, transform: on ? "scale(1)" : "scale(.8)",
                  transition: `all .5s cubic-bezier(.2,.8,.2,1) ${(ri * cols.length + ci) * 0.025}s`,
                }}>{v}</div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 11.5, color: "var(--ink-3)" }}>
        <span>Lebih rendah</span>
        <div style={{ display: "flex", gap: 3 }}>
          {["#E7F0E9", "#EADBC6", "#E8C98F", "#E68A4E", "#D6455A"].map((c) => <span key={c} style={{ width: 22, height: 10, borderRadius: 3, background: c }} />)}
        </div>
        <span>Lebih tinggi · % siswa berisiko</span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// STATUS FLOW  — 4 buckets with animated bars
// ------------------------------------------------------------
function AFlow({ items, total }) {
  const on = anReveal();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      {items.map((it, i) => {
        const pct = (it.value / total) * 100;
        return (
          <div key={it.key}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: TONE[it.tone] }} /> {it.label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: TONE[it.tone] }}>{it.sign === "+" ? "+" : it.sign === "!" ? "−" : ""}{it.value} <span style={{ fontSize: 11, color: "var(--ink-4)", fontWeight: 600 }}>siswa</span></span>
            </div>
            <div style={{ height: 9, background: "var(--surface-soft)", borderRadius: 99, overflow: "hidden", border: "1px solid var(--line)" }}>
              <div style={{ width: on ? `${pct}%` : 0, height: "100%", background: TONE[it.tone], borderRadius: 99, transition: `width .9s cubic-bezier(.2,.8,.2,1) ${i * 0.08}s` }} />
            </div>
            <p style={{ margin: "5px 0 0", fontSize: 11.5, color: "var(--ink-3)" }}>{it.desc}</p>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// SCATTER  — karakter (x) vs risiko (y)
// ------------------------------------------------------------
const CLS_COLOR = { "X-A": "#7C3AED", "X-B": "#D6455A", "X-C": "#2E9E6B" };
function AScatter({ points, height = 280 }) {
  const on = anReveal(120);
  const W = 460, padL = 40, padR = 16, padT = 14, padB = 34;
  const innerW = W - padL - padR, innerH = height - padT - padB;
  const x = (v) => padL + innerW * ((v - 55) / (100 - 55));
  const y = (v) => padT + innerH * (1 - v / 90);
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${height}`} style={{ display: "block", overflow: "visible" }}>
        {[0, 30, 60, 90].map((g) => (
          <g key={g}>
            <line x1={padL} y1={y(g)} x2={W - padR} y2={y(g)} stroke="var(--line)" strokeWidth="1" />
            <text x={padL - 7} y={y(g) + 3.5} textAnchor="end" fontSize="10" fill="var(--ink-4)" fontWeight="600">{g}</text>
          </g>
        ))}
        {[60, 70, 80, 90, 100].map((g) => (
          <text key={g} x={x(g)} y={height - 16} textAnchor="middle" fontSize="10" fill="var(--ink-4)" fontWeight="600">{g}%</text>
        ))}
        {/* trend guide (negative corr) */}
        <line x1={x(60)} y1={y(48)} x2={x(96)} y2={y(14)} stroke="var(--ungu-300)" strokeWidth="2" strokeDasharray="5 4" opacity={on ? 0.7 : 0} style={{ transition: "opacity .8s ease .6s" }} />
        {points.map((p, i) => (
          <circle key={i} cx={x(p.kar)} cy={y(on ? p.risk : 0)} r={5} fill={CLS_COLOR[p.kelas]} fillOpacity="0.62" stroke={CLS_COLOR[p.kelas]} strokeWidth="1"
            style={{ transition: `cy .9s cubic-bezier(.2,.8,.2,1) ${i * 0.01}s` }} />
        ))}
        <text x={padL} y={11} fontSize="10.5" fill="var(--ink-3)" fontWeight="700">↑ Skor risiko</text>
        <text x={W - padR} y={height - 2} textAnchor="end" fontSize="10.5" fill="var(--ink-3)" fontWeight="700">Capaian karakter →</text>
      </svg>
      <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
        {A_CLASSES.map((c) => (
          <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--ink-3)" }}>
            <span style={{ width: 9, height: 9, borderRadius: 99, background: CLS_COLOR[c] }} /> {c}
          </span>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// CO-OCCURRENCE — ranked pair bars
// ------------------------------------------------------------
function APairs({ pairs }) {
  const on = anReveal();
  const max = Math.max(...pairs.map((p) => p.n));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {pairs.map((p, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{p.a} <span style={{ color: "var(--ink-4)" }}>+</span> {p.b}</span>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ungu)" }}>{p.n} <span style={{ fontSize: 10.5, color: "var(--ink-4)", fontWeight: 600 }}>siswa</span></span>
          </div>
          <div style={{ height: 8, background: "var(--ungu-050)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: on ? `${(p.n / max) * 100}%` : 0, height: "100%", background: i === 0 ? "var(--ungu)" : "var(--ungu-300)", borderRadius: 99, transition: `width .9s cubic-bezier(.2,.8,.2,1) ${i * 0.07}s` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// shared card + section title
// ------------------------------------------------------------
function ACard({ title, sub, children, style, right }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "22px 22px", ...style }}>
      {(title || right) && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>{title}</h3>
            {sub && <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5, maxWidth: 520 }}>{sub}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

// ------------------------------------------------------------
// INSIGHT CARD — finding · evidence · why · action
// ------------------------------------------------------------
function InsightCard({ ins, index }) {
  const [hover, setHover] = useStateAn(false);
  return (
    <article onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)",
      boxShadow: hover ? "var(--shadow-pop)" : "var(--shadow-card)", transform: hover ? "translateY(-3px)" : "none",
      transition: "all .2s ease", padding: "22px 22px 18px", position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: TONE[ins.tone] }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: TONE[ins.tone], background: toneBg[ins.tone], padding: "5px 11px", borderRadius: 99 }}>
          <window.IconSparkle size={13} /> {ins.tag}
        </span>
        <span style={{ fontSize: 22, fontWeight: 800, color: TONE[ins.tone], letterSpacing: "-.02em" }}>{ins.metric}</span>
      </div>
      <h3 style={{ margin: "0 0 10px", fontSize: 16.5, lineHeight: 1.35, fontWeight: 800, letterSpacing: "-.01em", color: "var(--ink)" }}>{ins.finding}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)", flex: 1 }}>
        <Row k="Bukti" v={ins.evidence} />
        <Row k="Mengapa penting" v={ins.why} />
      </div>
      <div style={{ marginTop: 14, paddingTop: 13, borderTop: "1px solid var(--line)", display: "flex", gap: 9, alignItems: "flex-start" }}>
        <window.IconArrowRight size={16} style={{ color: TONE[ins.tone], flex: "none", marginTop: 2 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.45 }}>{ins.action}</span>
      </div>
    </article>
  );
}
function Row({ k, v }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".04em", flex: "none", width: 96, paddingTop: 1 }}>{k}</span>
      <span>{v}</span>
    </div>
  );
}

// ------------------------------------------------------------
// WATCHLIST
// ------------------------------------------------------------
function Watchlist({ rows }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {rows.map((r, i) => {
        const col = r.status === "waspada" ? "var(--waspada)" : "var(--perhatian)";
        const bg = r.status === "waspada" ? "var(--waspada-bg)" : "var(--perhatian-bg)";
        return (
          <div key={r.code} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "center", padding: "13px 4px", borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, background: bg, color: col, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 16 }}>{r.score}</span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{r.code} <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-3)" }}>· {r.kelas}</span></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {r.signals.map((s, k) => <span key={k} style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", background: "var(--surface-soft)", border: "1px solid var(--line)", padding: "3px 8px", borderRadius: 99 }}>{s}</span>)}
                </div>
              </div>
            </div>
            <span />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: col }}>
              {r.trend === "naik" ? <window.IconArrowUp size={14} /> : <window.IconMinus size={14} />} {r.status === "waspada" ? "Waspada" : "Perhatian"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// ANALITIK VIEW
// ============================================================
function AnalitikView({ P }) {
  const aspects = window.A_ASPECTS;
  const series = aspects.map((a) => ({
    key: a.key, name: a.name, data: window.A_TREND[a.key],
    color: a.key === "EM" ? "var(--waspada)" : a.key === "RP" ? "var(--perhatian)" : "var(--ungu-300)",
  }));
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      {/* intro */}
      <div style={{ display: "flex", gap: 15, alignItems: "flex-start", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "22px 24px" }}>
        <span style={{ width: 48, height: 48, borderRadius: 14, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", flex: "none" }}><window.IconLayers size={24} /></span>
        <div>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>Analitik Screening</h2>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 820, textWrap: "pretty" }}>
            Bukan sekadar angka status, tapi <b>pola yang bisa ditindaklanjuti</b>: arah tren tiap aspek, di kelas mana risiko menumpuk, aspek apa yang saling berkaitan, dan siswa mana yang perlu dipantau lebih dulu.
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {window.A_KPI.map((k) => (
          <div key={k.label} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: TONE[k.tone] }} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)" }}>{k.label}</span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.02em", marginTop: 9, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>{k.note}</div>
          </div>
        ))}
      </div>

      {/* insights */}
      <div>
        <window.SectionHeading title="Insight utama" sub="Tiga temuan paling penting bulan ini, lengkap dengan langkah yang disarankan." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {window.A_INSIGHTS.map((ins, i) => <InsightCard key={i} ins={ins} index={i} />)}
        </div>
      </div>

      {/* trend + heatmap */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.25fr) minmax(0,1fr)", gap: 18, alignItems: "start" }}>
        <ACard title="Tren risiko per aspek · 6 bulan" sub="Persentase siswa berisiko (perhatian + perlu diwaspadai). Emosional disorot karena terus menanjak.">
          <ALine series={series} labels={window.A_MONTHS} highlightKey="EM" />
        </ACard>
        <ACard title="Peta panas: aspek × kelas" sub="Di mana risiko menumpuk. Semakin merah, semakin banyak siswa berisiko.">
          <AHeat rows={aspects} cols={window.A_CLASSES} rowLabel={(r) => r.name} get={(r, c) => window.A_HEAT[r.key][c]} />
        </ACard>
      </div>

      {/* flow + cooccurrence + gender */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, alignItems: "start" }}>
        <ACard title="Aliran status bulan ini" sub="Pergerakan dibanding bulan lalu — 67 siswa.">
          <AFlow items={window.A_FLOW} total={67} />
        </ACard>
        <ACard title="Aspek yang sering berkaitan" sub="Pada siswa berisiko, aspek apa yang muncul bersamaan.">
          <APairs pairs={window.A_COOCCUR} />
        </ACard>
        <ACard title="Sebaran per gender" sub="% berisiko pada tiga aspek teratas.">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {window.A_GENDER.map((g) => (
              <div key={g.aspek}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", marginBottom: 7 }}>{g.aspek}</div>
                {["Perempuan", "Laki-laki"].map((k) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
                    <span style={{ width: 64, fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>{k}</span>
                    <div style={{ flex: 1, height: 8, background: "var(--surface-soft)", borderRadius: 99, overflow: "hidden", border: "1px solid var(--line)" }}>
                      <div style={{ width: `${g[k] * 2.2}%`, height: "100%", background: k === "Perempuan" ? "var(--ungu)" : "var(--ungu-300)", borderRadius: 99 }} />
                    </div>
                    <b style={{ fontSize: 12, color: "var(--ink)", width: 30, textAlign: "right" }}>{g[k]}%</b>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ACard>
      </div>

      {/* scatter + watchlist */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.25fr)", gap: 18, alignItems: "start" }}>
        <ACard title="Karakter ↔ risiko" sub="Tiap titik satu siswa. Capaian karakter lebih tinggi cenderung diiringi risiko lebih rendah.">
          <AScatter points={window.A_SCATTER} />
        </ACard>
        <ACard title="Daftar pantau dini" sub="Siswa yang perlu didahulukan, diurutkan dari skor risiko tertinggi. Kode disamarkan demi privasi."
          right={<span style={{ fontSize: 12, fontWeight: 700, color: "var(--waspada)", background: "var(--waspada-bg)", padding: "5px 11px", borderRadius: 99 }}>{window.A_WATCH.length} siswa</span>}>
          <Watchlist rows={window.A_WATCH} />
          <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "12px 14px", background: "var(--ungu-050)", borderRadius: 12, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)", marginTop: 14 }}>
            <window.IconShield size={15} style={{ color: "var(--ungu)", flex: "none", marginTop: 1 }} />
            <span>Rincian tiap siswa hanya dibuka bersama guru BK. Skor risiko menggabungkan tingkat status, arah tren, dan lamanya bertahan.</span>
          </div>
        </ACard>
      </div>
    </section>
  );
}

Object.assign(window, { AnalitikView, ALine, AHeat, AFlow, AScatter, APairs, ACard, InsightCard, Watchlist });

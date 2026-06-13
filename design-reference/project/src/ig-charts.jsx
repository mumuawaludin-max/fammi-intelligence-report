// ============================================================
// INTELI-GEN · CHARTS — primitives baru di atas charts.jsx
// (TrendLines, Heatmap, MiniSpark, JourneyDelta). Pure SVG,
// dependency-free, animasi saat mount, theme via CSS vars.
// ============================================================
const { useState: useStateIC, useEffect: useEffectIC, useRef: useRefIC } = React;

function useRevealIC(delay = 80) {
  const [on, setOn] = useStateIC(false);
  useEffectIC(() => { const t = setTimeout(() => setOn(true), delay); return () => clearTimeout(t); }, []);
  return on;
}

// ------------------------------------------------------------
// TRENDLINES — multi-series line over the 6-month timeline.
// series: [{ label, data:[...7], color }]  · labels: [...7]
// Baseline (index 0) ditandai garis putus-putus.
// ------------------------------------------------------------
function TrendLines({ series, labels, height = 230, min = 0, max = 100, yStep = 25, showBaseline = true, showDots = true }) {
  const on = useRevealIC(120);
  const padL = 34, padR = 14, padT = 14, padB = 30;
  const W = 640, H = height;
  const iw = W - padL - padR, ih = H - padT - padB;
  const n = labels.length;
  const x = (i) => padL + (iw * i) / (n - 1);
  const y = (v) => padT + ih * (1 - (v - min) / (max - min));
  const gy = [];
  for (let v = min; v <= max; v += yStep) gy.push(v);

  const linePath = (data) => data.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const areaPath = (data) => `${linePath(data)} L ${x(n - 1)} ${y(min)} L ${x(0)} ${y(min)} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        {series.map((s, si) => (
          <linearGradient key={si} id={`tlg${si}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={s.color} stopOpacity="0.16" />
            <stop offset="1" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {/* gridlines + y labels */}
      {gy.map((v, i) => (
        <g key={i}>
          <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="var(--line)" strokeWidth="1" />
          <text x={padL - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize="10.5" fontWeight="600" fill="var(--ink-4)">{v}</text>
        </g>
      ))}
      {/* baseline marker */}
      {showBaseline && (
        <line x1={x(0)} y1={padT} x2={x(0)} y2={padT + ih} stroke="var(--ink-4)" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
      )}
      {/* x labels */}
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={H - 9} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--ink-3)">{l}</text>
      ))}
      {/* areas + lines */}
      {series.map((s, si) => (
        <g key={si} style={{ opacity: on ? 1 : 0, transition: `opacity .5s ease ${si * 0.12}s` }}>
          <path d={areaPath(s.data)} fill={`url(#tlg${si})`} style={{ opacity: on ? 1 : 0, transition: `opacity .8s ease ${0.3 + si * 0.12}s` }} />
          <path d={linePath(s.data)} fill="none" stroke={s.color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: 1400, strokeDashoffset: on ? 0 : 1400, transition: `stroke-dashoffset 1.1s cubic-bezier(.4,.8,.3,1) ${si * 0.12}s` }} />
          {showDots && s.data.map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v)} r={i === s.data.length - 1 ? 4.5 : 3} fill={i === s.data.length - 1 ? s.color : "var(--surface)"} stroke={s.color} strokeWidth="2"
              style={{ opacity: on ? 1 : 0, transition: `opacity .4s ease ${0.6 + i * 0.05}s` }} />
          ))}
        </g>
      ))}
    </svg>
  );
}

// ------------------------------------------------------------
// HEATMAP — matrix of counts; cell opacity ∝ value.
// rows:[{label,color}] cols:[string] matrix:[[...]]
// ------------------------------------------------------------
function Heatmap({ rows, cols, matrix, accent = "var(--ungu)", cell = 46, gap = 5 }) {
  const on = useRevealIC(120);
  const flat = matrix.flat();
  const maxV = Math.max(1, ...flat);
  const labelW = 116;
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: `${labelW}px repeat(${cols.length}, minmax(${cell}px, 1fr))`, gap, minWidth: labelW + cols.length * (cell + gap) }}>
        {/* header */}
        <div />
        {cols.map((c, ci) => (
          <div key={ci} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", paddingBottom: 2 }}>{c}</div>
        ))}
        {/* rows */}
        {rows.map((r, ri) => (
          <React.Fragment key={ri}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "var(--ink)", paddingRight: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: r.color || accent, flex: "none" }} />
              {r.label}
            </div>
            {matrix[ri].map((v, ci) => {
              const t = v / maxV;
              return (
                <div key={ci} title={`${v} siswa`} style={{
                  height: cell, borderRadius: 9, display: "grid", placeItems: "center",
                  background: v === 0 ? "var(--surface-soft)" : `color-mix(in srgb, ${r.color || accent} ${18 + t * 70}%, transparent)`,
                  border: "1px solid " + (v === 0 ? "var(--line)" : "transparent"),
                  color: t > 0.55 ? "#fff" : "var(--ink)", fontSize: 13.5, fontWeight: 700,
                  transform: on ? "scale(1)" : "scale(.6)", opacity: on ? 1 : 0,
                  transition: `all .5s cubic-bezier(.2,.8,.2,1) ${(ri * cols.length + ci) * 0.018}s`,
                }}>{v === 0 ? "" : v}</div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// MINISPARK — tiny line for table rows. data:[...]
// ------------------------------------------------------------
function MiniSpark({ data, color = "var(--ungu)", w = 72, h = 24, min = 0, max = 100 }) {
  const x = (i) => (w * i) / (data.length - 1);
  const y = (v) => h - 2 - (h - 4) * ((v - min) / (max - min));
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const up = data[data.length - 1] >= data[0];
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="2.4" fill={color} />
    </svg>
  );
}

// ------------------------------------------------------------
// DELTACHIP — arrow + signed number (perubahan vs baseline).
// ------------------------------------------------------------
function DeltaChip({ value, suffix = "", size = 12.5 }) {
  const up = value > 0, flat = value === 0;
  const col = flat ? "var(--ink-3)" : up ? "var(--aman)" : "var(--waspada)";
  const bg = flat ? "var(--bg-2)" : up ? "var(--aman-bg)" : "var(--waspada-bg)";
  const Ar = flat ? window.IconMinus : up ? window.IconArrowUp : window.IconArrowDown;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: size, fontWeight: 700, color: col, background: bg, padding: "3px 8px", borderRadius: 99, lineHeight: 1 }}>
      <Ar size={size} /> {up ? "+" : ""}{value}{suffix}
    </span>
  );
}

// ------------------------------------------------------------
// DUMBBELL — baseline → sekarang, satu baris per index.
// rows:[{label, from, to, color}]
// ------------------------------------------------------------
function Dumbbell({ rows, min = 0, max = 100 }) {
  const on = useRevealIC(100);
  const pct = (v) => ((v - min) / (max - min)) * 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 9 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{r.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)" }}>
              {r.from} <span style={{ color: "var(--ink-4)" }}>→</span> <span style={{ color: r.color }}>{r.to}</span>
              <span style={{ marginLeft: 8 }}><DeltaChip value={r.to - r.from} size={11} /></span>
            </span>
          </div>
          <div style={{ position: "relative", height: 12 }}>
            <div style={{ position: "absolute", top: 4, left: 0, right: 0, height: 4, borderRadius: 99, background: "var(--bg-2)" }} />
            <div style={{ position: "absolute", top: 4, height: 4, borderRadius: 99, background: r.color,
              left: `${pct(r.from)}%`, width: on ? `${pct(r.to) - pct(r.from)}%` : 0, transition: `width .9s cubic-bezier(.2,.8,.2,1) ${i * 0.07}s` }} />
            <span style={{ position: "absolute", top: 0, left: `${pct(r.from)}%`, width: 12, height: 12, marginLeft: -6, borderRadius: 99, background: "var(--surface)", border: "2px solid var(--ink-4)" }} />
            <span style={{ position: "absolute", top: 0, left: on ? `${pct(r.to)}%` : `${pct(r.from)}%`, width: 14, height: 14, marginLeft: -7, marginTop: -1, borderRadius: 99, background: r.color, border: "2px solid var(--surface)", boxShadow: "0 1px 4px rgba(0,0,0,.18)", transition: `left .9s cubic-bezier(.2,.8,.2,1) ${i * 0.07}s` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { TrendLines, Heatmap, MiniSpark, DeltaChip, Dumbbell });

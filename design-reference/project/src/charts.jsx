// ============================================================
// CHARTS — pure-SVG, dependency-free, animated on mount.
// Shared by Orang Tua + Siswa reports. Theme-able via props
// (every color defaults to a CSS var so the page palette wins).
// ============================================================
const { useState: useStateCh, useEffect: useEffectCh, useRef: useRefCh } = React;

// reveal toggle: flips true shortly after mount so CSS transitions run
function useReveal(delay = 80) {
  const [on, setOn] = useStateCh(false);
  useEffectCh(() => {
    const t = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(t);
  }, []);
  return on;
}

// count a number up from 0 → value
function useCountUp(value, on, ms = 900) {
  const [n, setN] = useStateCh(0);
  useEffectCh(() => {
    if (!on) return;
    let raf, start;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(value * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [on, value]);
  return n;
}

const polar = (cx, cy, r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

// ------------------------------------------------------------
// RING GAUGE — one big percentage, sweeping arc + count-up.
// ------------------------------------------------------------
function RingGauge({ value, size = 132, stroke = 13, color = "var(--ungu)", track = "var(--ungu-050)", suffix = "%", label, sub, gradient }) {
  const on = useReveal();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const n = useCountUp(pct, on);
  const gid = useRefCh("rg" + Math.random().toString(36).slice(2, 8)).current;
  const dash = on ? c * (1 - pct / 100) : c;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {gradient && (
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={gradient[0]} />
              <stop offset="1" stopColor={gradient[1]} />
            </linearGradient>
          </defs>
        )}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={gradient ? `url(#${gid})` : color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={dash}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
        <span style={{ fontSize: size * 0.27, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.02em" }}>
          {Math.round(n)}<span style={{ fontSize: size * 0.13, fontWeight: 700, color: "var(--ink-3)" }}>{suffix}</span>
        </span>
        {label && <span style={{ fontSize: size * 0.1, fontWeight: 700, color: "var(--ink-3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>}
        {sub && <span style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 2 }}>{sub}</span>}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// DONUT — multi-segment breakdown with a center caption.
// segments: [{ value, color, label }]
// ------------------------------------------------------------
function Donut({ segments, size = 150, stroke = 22, center, centerSub, gap = 0.02 }) {
  const on = useReveal();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} opacity={0.4} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const len = on ? Math.max(0, (frac - gap) * c) : 0;
          const off = -acc * c;
          acc += frac;
          return (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={s.color} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={`${len} ${c}`} strokeDashoffset={off}
              style={{ transition: `stroke-dasharray 1s cubic-bezier(.2,.8,.2,1) ${i * 0.09}s` }} />
          );
        })}
      </svg>
      {(center || centerSub) && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1.1 }}>
          {center && <span style={{ fontSize: size * 0.19, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.02em" }}>{center}</span>}
          {centerSub && <span style={{ fontSize: size * 0.085, fontWeight: 700, color: "var(--ink-3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>{centerSub}</span>}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// RADAR — profile polygon over a grid. axes: [{ label, value, max }]
// ------------------------------------------------------------
function Radar({ axes, size = 280, levels = 4, color = "var(--ungu)", fill = "rgba(99,35,218,0.16)", labelColor = "var(--ink-3)", dotColor }) {
  const on = useReveal(120);
  const cx = size / 2, cy = size / 2;
  const pad = 46;
  const R = (size - pad * 2) / 2;
  const n = axes.length;
  const step = 360 / n;

  const ringPts = (rad) => axes.map((_, i) => polar(cx, cy, rad, i * step).join(",")).join(" ");
  const dataPts = axes.map((a, i) => {
    const v = Math.max(0, Math.min(1, a.value / a.max));
    return polar(cx, cy, R * v, i * step);
  });

  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ display: "block", overflow: "visible" }}>
      {/* grid rings */}
      {Array.from({ length: levels }, (_, l) => {
        const rad = (R * (l + 1)) / levels;
        return <polygon key={l} points={ringPts(rad)} fill={l === levels - 1 ? "var(--surface-soft)" : "none"} stroke="var(--line)" strokeWidth="1" opacity={l === levels - 1 ? 0.6 : 1} />;
      })}
      {/* spokes */}
      {axes.map((_, i) => {
        const [x, y] = polar(cx, cy, R, i * step);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth="1" />;
      })}
      {/* data polygon (scales up from center) */}
      <g style={{ transform: on ? "scale(1)" : "scale(0.02)", transformOrigin: `${cx}px ${cy}px`, transition: "transform 1s cubic-bezier(.2,.8,.2,1)", opacity: on ? 1 : 0 }}>
        <polygon points={dataPts.map((p) => p.join(",")).join(" ")} fill={fill} stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        {dataPts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.6" fill={dotColor || color} stroke="#fff" strokeWidth="1.6" />)}
      </g>
      {/* axis labels */}
      {axes.map((a, i) => {
        const [x, y] = polar(cx, cy, R + 22, i * step);
        const anchor = Math.abs(x - cx) < 6 ? "middle" : x > cx ? "start" : "end";
        return (
          <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle"
            fontSize="11.5" fontWeight="700" fill={labelColor} style={{ fontFamily: "inherit" }}>
            {a.short || a.label}
          </text>
        );
      })}
    </svg>
  );
}

// ------------------------------------------------------------
// RADIAL BLOOM — one rounded petal per item, length ∝ value.
// items: [{ label, value, max, color }]
// ------------------------------------------------------------
function RadialBloom({ items, size = 300, inner = 34, color = "var(--ungu)", trackColor = "var(--ungu-050)" }) {
  const on = useReveal(100);
  const cx = size / 2, cy = size / 2;
  const max = (size / 2) - 60;
  const n = items.length;
  const step = 360 / n;
  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ display: "block", overflow: "visible" }}>
      {/* hub */}
      <circle cx={cx} cy={cy} r={inner - 7} fill="var(--ungu-050)" />
      {items.map((it, i) => {
        const frac = Math.max(0, Math.min(1, it.value / (it.max || 100)));
        const len = inner + (on ? frac : 0) * (max - inner);
        const ang = i * step;
        const [tx, ty] = polar(cx, cy, len, ang);
        const [lx, ly] = polar(cx, cy, max + 26, ang);
        const anchor = Math.abs(lx - cx) < 8 ? "middle" : lx > cx ? "start" : "end";
        const petalColor = it.color || color;
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={polar(cx, cy, max, ang)[0]} y2={polar(cx, cy, max, ang)[1]} stroke={trackColor} strokeWidth="11" strokeLinecap="round" />
            <line x1={cx} y1={cy} x2={tx} y2={ty} stroke={petalColor} strokeWidth="11" strokeLinecap="round"
              style={{ transition: `all .95s cubic-bezier(.2,.8,.2,1) ${i * 0.07}s` }} />
            <circle cx={tx} cy={ty} r="4.5" fill={petalColor} stroke="#fff" strokeWidth="1.6" style={{ transition: `all .95s cubic-bezier(.2,.8,.2,1) ${i * 0.07}s` }} />
            <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" fontSize="11" fontWeight="700" fill="var(--ink-2)" style={{ fontFamily: "inherit" }}>{it.label}</text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={inner - 7} fill="none" />
    </svg>
  );
}

// ------------------------------------------------------------
// SEMICIRCLE GAUGE — wellbeing meter, needle + colored track.
// ------------------------------------------------------------
function SemiGauge({ value, size = 230, stroke = 16, zones, label, sub }) {
  const on = useReveal();
  const r = (size - stroke) / 2 - 6;
  const cx = size / 2, cy = size / 2 + 6;
  const half = Math.PI * r; // arc length of semicircle
  const pct = Math.max(0, Math.min(100, value));
  const n = useCountUp(pct, on);
  const arc = (frac) => {
    const a0 = Math.PI, a1 = Math.PI + Math.PI * frac;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  const z = zones || [
    { upto: 50, color: "var(--waspada)" },
    { upto: 75, color: "var(--perhatian)" },
    { upto: 100, color: "var(--aman)" },
  ];
  const needleA = Math.PI + Math.PI * ((on ? pct : 0) / 100);
  const nx = cx + (r) * Math.cos(needleA), ny = cy + (r) * Math.sin(needleA);
  return (
    <div style={{ position: "relative", width: size, height: size / 2 + 30 }}>
      <svg width={size} height={size / 2 + 30} style={{ overflow: "visible" }}>
        {/* zone backdrop */}
        {(() => {
          let prev = 0;
          return z.map((zz, i) => {
            const seg = (
              <path key={i} d={`M ${cx + r * Math.cos(Math.PI + Math.PI * (prev / 100))} ${cy + r * Math.sin(Math.PI + Math.PI * (prev / 100))} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(Math.PI + Math.PI * (zz.upto / 100))} ${cy + r * Math.sin(Math.PI + Math.PI * (zz.upto / 100))}`}
                fill="none" stroke={zz.color} strokeWidth={stroke} strokeLinecap="butt" opacity="0.24" />
            );
            prev = zz.upto;
            return seg;
          });
        })()}
        {/* value arc */}
        <path d={arc((on ? pct : 0) / 100)} fill="none" stroke="var(--ungu)" strokeWidth={stroke} strokeLinecap="round"
          style={{ transition: "all 1.1s cubic-bezier(.2,.8,.2,1)" }} />
        {/* needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" style={{ transition: "all 1.1s cubic-bezier(.2,.8,.2,1)" }} />
        <circle cx={cx} cy={cy} r="6.5" fill="var(--ink)" />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: size / 2 - 26, textAlign: "center", lineHeight: 1.1 }}>
        <div style={{ fontSize: 34, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.02em" }}>{Math.round(n)}</div>
        {label && <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>}
        {sub && <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// BAR LIST — ranked animated horizontal bars.
// rows: [{ label, value, max, color, tag, Icon }]
// ------------------------------------------------------------
function BarList({ rows, accent = "var(--ungu)", muted = "var(--ungu-300)", track = "var(--ungu-050)", showValue, valueSuffix = "" }) {
  const on = useReveal();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      {rows.map((r, i) => {
        const frac = Math.max(0, Math.min(1, r.value / (r.max || 100)));
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 11 }}>
            {r.Icon && (
              <span style={{ width: 30, height: 30, borderRadius: 9, background: track, color: r.color || accent, display: "grid", placeItems: "center", flex: "none" }}><r.Icon size={16} /></span>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{r.label}</span>
                {(r.tag || showValue) && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)" }}>{r.tag || (Math.round(r.value) + valueSuffix)}</span>}
              </div>
              <div style={{ height: 8, background: track, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: on ? `${frac * 100}%` : 0, height: "100%", background: r.color || accent, borderRadius: 99, transition: `width .9s cubic-bezier(.2,.8,.2,1) ${i * 0.06}s` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// SEGMENT STRIP — discrete level dots/segments (e.g. 4-step scale).
// ------------------------------------------------------------
function StepStrip({ steps, active, activeColor = "var(--ungu)", trackColor = "var(--ungu-050)", height = 7 }) {
  const on = useReveal();
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {steps.map((s, i) => (
        <div key={i} title={s} style={{ flex: 1, height, borderRadius: 99, background: i <= active && on ? activeColor : trackColor, transition: `background .4s ease ${i * 0.08}s` }} />
      ))}
    </div>
  );
}

Object.assign(window, { useReveal, useCountUp, RingGauge, Donut, Radar, RadialBloom, SemiGauge, BarList, StepStrip });

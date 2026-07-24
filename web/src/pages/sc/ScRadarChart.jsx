import styles from "./ScRadarChart.module.css";

/**
 * ScRadarChart -- radar 4 sumbu tetap (Kekeluargaan, Inovasi, Orientasi, Aturan, label persis
 * data olahan sekolah) membandingkan saat_ini (garis penuh, teal) vs harapan (garis putus-putus,
 * amber). Salinan lokal dari pages/cw/CultureRadarChart.jsx dengan AXIS_ORDER sekolah -- modul SC
 * sengaja berdiri sendiri (lihat catatan arsitektur di sc.types.ts), bukan impor lintas-modul.
 * Warna dan konvensi garis tetap pakai token --cw-line-* (tokens.css) yang sama dengan CW.
 */
const AXIS_ORDER = ["Kekeluargaan", "Inovasi", "Orientasi", "Aturan"];

export default function ScRadarChart({ data = [], size = 280 }) {
  const axes = AXIS_ORDER.map(
    (tipe) => data.find((d) => d.tipe === tipe) || { tipe, saat_ini: null, harapan: null }
  );

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const n = axes.length;
  const levels = [0.25, 0.5, 0.75, 1];
  const labelOffset = 18;

  function angleOf(i) {
    return (2 * Math.PI * i) / n - Math.PI / 2;
  }

  function point(i, fraction) {
    const a = angleOf(i);
    return {
      x: cx + maxR * fraction * Math.cos(a),
      y: cy + maxR * fraction * Math.sin(a),
    };
  }

  function polygonPoints(fractions) {
    return fractions.map((f, i) => { const p = point(i, f); return `${p.x},${p.y}`; }).join(" ");
  }

  function fractionsFor(key) {
    return axes.map((a) => (a[key] ?? 0) / 100);
  }

  function labelAnchor(i) {
    const x = Math.cos(angleOf(i));
    if (x > 0.15) return "start";
    if (x < -0.15) return "end";
    return "middle";
  }

  function labelBaseline(i) {
    const y = Math.sin(angleOf(i));
    if (y > 0.15) return "hanging";
    if (y < -0.15) return "auto";
    return "middle";
  }

  const saatIniFractions = fractionsFor("saat_ini");
  const harapanFractions = fractionsFor("harapan");

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ overflow: "visible" }} aria-hidden="true">
        {levels.map((lvl) => (
          <polygon
            key={lvl}
            points={polygonPoints(axes.map(() => lvl))}
            fill="none"
            stroke="var(--line)"
            strokeWidth={lvl === 1 ? 1 : 0.75}
            strokeDasharray={lvl < 1 ? "3 3" : undefined}
          />
        ))}

        {axes.map((_, i) => {
          const tip = point(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="var(--line)" strokeWidth={0.75} />;
        })}

        <polygon
          points={polygonPoints(saatIniFractions)}
          fill="var(--cw-line-saat-ini)"
          fillOpacity={0.14}
          stroke="var(--cw-line-saat-ini)"
          strokeWidth={2.25}
          strokeLinejoin="round"
        />
        {saatIniFractions.map((f, i) => {
          const p = point(i, f);
          return <circle key={`si-${i}`} cx={p.x} cy={p.y} r={4} fill="var(--cw-line-saat-ini)" stroke="var(--surface)" strokeWidth={2} />;
        })}

        <polygon
          points={polygonPoints(harapanFractions)}
          fill="none"
          stroke="var(--cw-line-harapan)"
          strokeWidth={2.25}
          strokeDasharray="6 4"
          strokeLinejoin="round"
        />
        {harapanFractions.map((f, i) => {
          const p = point(i, f);
          return <circle key={`hr-${i}`} cx={p.x} cy={p.y} r={3.5} fill="var(--surface)" stroke="var(--cw-line-harapan)" strokeWidth={2} />;
        })}

        {axes.map((a, i) => {
          const tip = point(i, 1 + labelOffset / maxR);
          return (
            <text
              key={i}
              x={tip.x} y={tip.y}
              fontSize={11}
              fontWeight={700}
              fontFamily="var(--font-body)"
              fill="var(--ink-2)"
              textAnchor={labelAnchor(i)}
              dominantBaseline={labelBaseline(i)}
            >
              {a.tipe}
            </text>
          );
        })}
      </svg>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <svg width="18" height="10" aria-hidden="true">
            <line x1="0" y1="5" x2="18" y2="5" stroke="var(--cw-line-saat-ini)" strokeWidth="2.5" />
          </svg>
          Saat Ini
        </span>
        <span className={styles.legendItem}>
          <svg width="18" height="10" aria-hidden="true">
            <line x1="0" y1="5" x2="18" y2="5" stroke="var(--cw-line-harapan)" strokeWidth="2.5" strokeDasharray="4 3" />
          </svg>
          Harapan
        </span>
      </div>
    </div>
  );
}

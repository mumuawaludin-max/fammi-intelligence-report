/**
 * RadarChart — radar SVG untuk 8 kecerdasan MI.
 *
 * axes: [{ label, short, value, max, color }]
 * size: lebar dan tinggi kotak SVG (px)
 */
export default function RadarChart({ axes = [], size = 280 }) {
  if (axes.length < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const n = axes.length;
  const levels = [0.25, 0.5, 0.75, 1];
  const labelOffset = 18;

  function angleOf(i) {
    // Mulai dari atas, searah jarum jam
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
    return fractions
      .map((f, i) => {
        const p = point(i, f);
        return `${p.x},${p.y}`;
      })
      .join(" ");
  }

  // Poligon data
  const dataFractions = axes.map((a) => (a.value ?? 0) / (a.max ?? 100));
  const dataPoints = polygonPoints(dataFractions);

  // Label anchor: kiri/kanan/tengah berdasarkan posisi sudut
  function labelAnchor(i) {
    const a = angleOf(i);
    const x = Math.cos(a);
    if (x > 0.15) return "start";
    if (x < -0.15) return "end";
    return "middle";
  }

  function labelBaseline(i) {
    const a = angleOf(i);
    const y = Math.sin(a);
    if (y > 0.15) return "hanging";
    if (y < -0.15) return "auto";
    return "middle";
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      {/* Grid rings */}
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

      {/* Axis spokes */}
      {axes.map((_, i) => {
        const tip = point(i, 1);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={tip.x} y2={tip.y}
            stroke="var(--line)"
            strokeWidth={0.75}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPoints}
        fill="var(--purple-600)"
        fillOpacity={0.15}
        stroke="var(--purple-600)"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data dots */}
      {axes.map((a, i) => {
        const f = dataFractions[i];
        const p = point(i, f);
        return (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={4}
            fill="var(--purple-600)"
            stroke="var(--surface)"
            strokeWidth={2}
          />
        );
      })}

      {/* Labels */}
      {axes.map((a, i) => {
        const tip = point(i, 1 + labelOffset / maxR);
        return (
          <text
            key={i}
            x={tip.x} y={tip.y}
            fontSize={10}
            fontWeight={700}
            fontFamily="var(--font-body)"
            fill="var(--ink-2)"
            textAnchor={labelAnchor(i)}
            dominantBaseline={labelBaseline(i)}
          >
            {a.short ?? a.label}
          </text>
        );
      })}
    </svg>
  );
}

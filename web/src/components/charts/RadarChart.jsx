/**
 * RadarChart — radar SVG, mode satu seri (default) atau overlay banyak seri.
 *
 * Mode satu seri (dipakai MIPage & radar tunggal Karakter):
 *   axes: [{ label, short, value, max, color }]
 *
 * Mode overlay (perbandingan antar kelas/sekolah):
 *   series: [{ name, color, axes: [{ label, short, value, max }] }]
 *   Semua seri wajib punya axes dengan urutan/jumlah sumbu yang sama.
 *
 * size: lebar dan tinggi kotak SVG (px)
 */
export default function RadarChart({ axes = [], series = null, size = 280 }) {
  const overlay = Array.isArray(series) && series.length > 0;
  const refAxes = overlay ? series[0].axes : axes;
  if (!refAxes || refAxes.length < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const n = refAxes.length;
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

  function fractionsFor(axesArr) {
    return axesArr.map((a) => (a.value ?? 0) / (a.max ?? 100));
  }

  const seriesData = overlay
    ? series.map((s) => ({ name: s.name, color: s.color, fractions: fractionsFor(s.axes) }))
    : [{ name: null, color: "var(--purple-600)", fractions: fractionsFor(axes) }];

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
    <div>
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
            points={polygonPoints(refAxes.map(() => lvl))}
            fill="none"
            stroke="var(--line)"
            strokeWidth={lvl === 1 ? 1 : 0.75}
            strokeDasharray={lvl < 1 ? "3 3" : undefined}
          />
        ))}

        {/* Axis spokes */}
        {refAxes.map((_, i) => {
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

        {/* Data polygon per seri */}
        {seriesData.map((s, si) => (
          <polygon
            key={si}
            points={polygonPoints(s.fractions)}
            fill={s.color}
            fillOpacity={overlay ? 0.1 : 0.15}
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}

        {/* Data dots per seri */}
        {seriesData.map((s, si) =>
          s.fractions.map((f, i) => {
            const p = point(i, f);
            return (
              <circle
                key={`${si}-${i}`}
                cx={p.x} cy={p.y} r={overlay ? 3 : 4}
                fill={s.color}
                stroke="var(--surface)"
                strokeWidth={2}
              />
            );
          })
        )}

        {/* Labels */}
        {refAxes.map((a, i) => {
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

      {overlay && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 14px", marginTop: 10, justifyContent: "center" }}>
          {series.map((s, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: "var(--ink-2)" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: s.color, display: "inline-block" }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

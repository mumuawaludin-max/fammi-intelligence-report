import styles from "./CultureRadarChart.module.css";

/**
 * CultureRadarChart -- radar 4 sumbu tetap (Klan, Adhokrasi, Pasar, Hierarki, kerangka OCAI)
 * membandingkan dua deret dalam satu grafik: saat_ini (garis penuh, teal) vs harapan (garis
 * putus-putus, amber, tanpa isi supaya tidak menumpuk visual dengan saat_ini). Konvensi warna
 * ini instruksi eksplisit produk (lihat --cw-line-saat-ini/--cw-line-harapan di tokens.css),
 * bukan token status 3-tingkat yang dipakai modul lain.
 *
 * Polanya sengaja meniru RadarChart.jsx (spoke/grid/label math sama) supaya konsisten dengan
 * modul lain, tapi dibuat komponen terpisah karena butuh dua gaya garis berbeda dalam satu
 * grafik -- RadarChart existing tidak punya konsep "salah satu seri putus-putus".
 *
 * data: RadarBudayaPoint[] (lihat cw.types.ts) -- boleh kurang dari 4 entri atau urutan acak,
 * komponen ini yang menata ulang ke urutan tetap Klan/Adhokrasi/Pasar/Hierarki. Entri yang
 * tidak ada di `data` dirender sebagai titik kosong (0), bukan dihilangkan, supaya bentuk
 * poligon 4 sudut tetap terjaga.
 */
const AXIS_ORDER = ["Klan", "Adhokrasi", "Pasar", "Hierarki"];

export default function CultureRadarChart({ data = [], size = 280 }) {
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
          return <line key={i} x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="var(--line)" strokeWidth={0.75} />;
        })}

        {/* Saat ini: garis penuh, terisi tipis */}
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

        {/* Harapan: garis putus-putus, tanpa isi */}
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

        {/* Labels */}
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

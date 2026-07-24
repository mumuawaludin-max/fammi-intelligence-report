import { useMemo } from "react";
import { KATEGORI_NILAI_COLOR } from "./scColors";
import styles from "./ScAnalisisCharts.module.css";

/** Warna per tipe budaya, sama urutan/nada dengan CULTURE_CARD_STYLE di ScLaporanAgregatPage.jsx
 * (lilac/sun/mint/sky) supaya satu tipe budaya konsisten warnanya di seluruh laporan. */
const TIPE_COLOR = {
  Kekeluargaan: "var(--lilac-ink)",
  Inovasi: "var(--sun-ink)",
  Orientasi: "var(--mint-ink)",
  Aturan: "var(--sky-ink)",
};

const ARAH_COLOR = { naik: "var(--purple-600)", tetap: "var(--ink-4)", turun: "var(--sky-ink)" };
const ARAH_LABEL = { naik: "Ingin memperkuat", tetap: "Sudah selaras", turun: "Ingin mengurangi" };
const TIPE_ORDER = ["Kekeluargaan", "Inovasi", "Orientasi", "Aturan"];

/** Jitter horizontal deterministik (bukan Math.random -- harus stabil antar render) supaya
 * titik-titik dengan indeks berdekatan di kolom yang sama tidak numpuk sempurna. Pola sederhana
 * berulang tiap 7 titik, cukup untuk memisahkan visual tanpa pura-pura presisi statistik. */
function jitterFor(i) {
  const pola = [0, -10, 8, -6, 4, -4, 6];
  return pola[i % pola.length];
}

/**
 * ScDonutChart -- donut generik dari segmen {label, persen, color}, dipakai untuk "pie budaya
 * dominan responden" dan "donut distribusi kategori kesejahteraan" (Blueprint School Culture v2
 * bagian 3, Level 2 & 5). SVG tangan sendiri (bukan library chart), pola stroke-dasharray pada
 * lingkaran -- konsisten dengan cara RadarChart/ScRadarChart lain di FIR dibangun.
 */
export function ScDonutChart({ segments = [], size = 140, centerLabel, centerSub }) {
  const valid = segments.filter((s) => s.persen > 0);
  if (valid.length === 0) {
    return <p className={styles.emptyNote}>Belum ada data untuk periode ini.</p>;
  }
  const r = size * 0.36;
  const stroke = size * 0.16;
  const circumference = 2 * Math.PI * r;
  let offsetAcc = 0;

  return (
    <div className={styles.donutWrap}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        {valid.map((s, i) => {
          const dash = (s.persen / 100) * circumference;
          const el = (
            <circle
              key={i}
              cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={s.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offsetAcc}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap={valid.length > 1 ? "butt" : "round"}
            />
          );
          offsetAcc += dash;
          return el;
        })}
        {centerLabel != null && (
          <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fontFamily="var(--font-display)" fontSize={size * 0.16} fontWeight={800} fill="var(--ink)">
            {centerLabel}
          </text>
        )}
        {centerSub && (
          <text x={size / 2} y={size / 2 + size * 0.14} textAnchor="middle" fontFamily="var(--font-body)" fontSize={size * 0.07} fill="var(--ink-4)">
            {centerSub}
          </text>
        )}
      </svg>
      <div className={styles.legend}>
        {segments.map((s, i) => (
          <span key={i} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: s.color }} />
            {s.label} · {s.persen}%
          </span>
        ))}
      </div>
    </div>
  );
}

/** Pie budaya dominan responden -- pembungkus ScDonutChart dengan warna tipe budaya tetap. */
export function ScPieBudayaDominan({ pieDominan = [], jumlahResponden }) {
  const segments = pieDominan.map((p) => ({ label: p.tipe, persen: p.persen, color: TIPE_COLOR[p.tipe] || "var(--ink-4)" }));
  return <ScDonutChart segments={segments} centerLabel={jumlahResponden} centerSub="staf" />;
}

/** Donut distribusi kategori kesejahteraan -- pembungkus ScDonutChart dengan warna kategori. */
export function ScDonutKategoriWellbeing({ donutKategori = [] }) {
  const segments = donutKategori
    .filter((k) => k.jumlah > 0)
    .map((k) => ({ label: k.kategori, persen: k.persen, color: KATEGORI_NILAI_COLOR[k.kategori] || "var(--ink-4)" }));
  return <ScDonutChart segments={segments} />;
}

/**
 * ScDistribusiArahChart -- stacked bar horizontal per tipe budaya: persen staf yang arahnya
 * ingin memperkuat/sudah selaras/ingin mengurangi. Ini yang membongkar polarisasi yang
 * tersembunyi di rata-rata gap sekolah (Blueprint bagian 3, Level 3).
 */
export function ScDistribusiArahChart({ rows = [] }) {
  if (rows.length === 0) return <p className={styles.emptyNote}>Belum ada data untuk periode ini.</p>;
  return (
    <div className={styles.arahList}>
      {rows.map((r) => (
        <div key={r.tipe} className={styles.arahRow}>
          <span className={styles.arahLabel}>{r.tipe}</span>
          <div className={styles.arahTrack}>
            {["naik", "tetap", "turun"].map((k) => (
              r[k] > 0 && (
                <span
                  key={k}
                  className={styles.arahSegment}
                  style={{ width: `${r[k]}%`, background: ARAH_COLOR[k] }}
                  title={`${ARAH_LABEL[k]}: ${r[k]}%`}
                />
              )
            ))}
          </div>
        </div>
      ))}
      <div className={styles.arahLegend}>
        {["naik", "tetap", "turun"].map((k) => (
          <span key={k} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: ARAH_COLOR[k] }} />
            {ARAH_LABEL[k]}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * ScStripPlot -- satu baris per subdimensi kesejahteraan, tiap titik satu responden (anonim)
 * di sepanjang skala 0-100. Ini yang mengangkat outlier (mis. satu responden datar di angka
 * rendah) yang tersembunyi di balik rata-rata (Blueprint bagian 3, Level 5).
 */
export function ScStripPlot({ items = [] }) {
  if (items.length === 0) return <p className={styles.emptyNote}>Belum ada data untuk periode ini.</p>;
  return (
    <div className={styles.stripList}>
      {items.map((it) => (
        <div key={it.kode} className={styles.stripRow}>
          <span className={styles.stripLabel} title={it.label}>{it.label}</span>
          <div className={styles.stripTrack}>
            {it.nilai.map((n, i) => (
              <span key={i} className={styles.stripDot} style={{ left: `${Math.max(0, Math.min(100, n))}%` }} title={`${n}%`} />
            ))}
          </div>
        </div>
      ))}
      <p className={styles.stripFootnote}>Tiap titik satu responden, anonim. Titik yang menjauh dari kerumunan layak diperhatikan meski rata-ratanya baik.</p>
    </div>
  );
}

/**
 * ScHeatmapGrid -- matriks 6 dimensi x 4 tipe budaya, intensitas warna dari kategori nilai
 * (Blueprint bagian 3, Level 4). Sumber data: rata-rata item mentah gambaran_<dimensi>_<tipe>
 * lintas seluruh responden (lihat heatmapDimensiTipe di useScData.js).
 */
export function ScHeatmapGrid({ cells = [] }) {
  if (cells.length === 0) return <p className={styles.emptyNote}>Belum ada data untuk periode ini.</p>;
  const dimensiList = [...new Set(cells.map((c) => c.dimensi))];
  const tipeList = [...new Set(cells.map((c) => c.tipe))];
  const cellByKey = Object.fromEntries(cells.map((c) => [`${c.dimensi}|${c.tipe}`, c]));

  function kategoriDariNilai(n) {
    if (n == null) return null;
    if (n <= 24) return "Sangat Rendah";
    if (n <= 41) return "Rendah";
    if (n <= 58) return "Sedang";
    if (n <= 74) return "Tinggi";
    return "Sangat Tinggi";
  }

  return (
    <div className={styles.heatmapWrap}>
      <table className={styles.heatmapTable}>
        <thead>
          <tr>
            <th />
            {tipeList.map((t) => <th key={t}>{t}</th>)}
          </tr>
        </thead>
        <tbody>
          {dimensiList.map((d) => (
            <tr key={d}>
              <th scope="row">{d}</th>
              {tipeList.map((t) => {
                const cell = cellByKey[`${d}|${t}`];
                const kategori = kategoriDariNilai(cell?.nilai);
                const color = KATEGORI_NILAI_COLOR[kategori] || "var(--line)";
                return (
                  <td key={t}>
                    <span
                      className={styles.heatmapCell}
                      style={{ background: `color-mix(in srgb, ${color} 22%, var(--surface))`, color }}
                      title={`${d} · ${t}: ${cell?.nilai ?? "—"}%`}
                    >
                      {cell?.nilai ?? "—"}%
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * ScScatterChart -- Fase D item 11 (Blueprint bagian 3, Level 6): satu titik per staf, kolom
 * tipe budaya dominannya, tinggi kolom = indeks kesejahteraan gabungannya. Jawaban visual untuk
 * "apakah staf dengan budaya dominan tertentu cenderung lebih/kurang sejahtera" -- TAPI ini
 * korelasi kasar dari sedikit data, WAJIB selalu tampil bareng label "Indikatif · n kecil",
 * jangan pernah dilepas jadi klaim sebab-akibat.
 */
export function ScScatterChart({ points = [] }) {
  const width = 420;
  const height = 240;
  const marginBottom = 30;
  const marginTop = 14;
  const plotH = height - marginBottom - marginTop;
  const colW = width / TIPE_ORDER.length;

  const grouped = useMemo(() => {
    const byTipe = Object.fromEntries(TIPE_ORDER.map((t) => [t, []]));
    points.forEach((p) => { if (byTipe[p.tipe_dominan]) byTipe[p.tipe_dominan].push(p.indeks); });
    return byTipe;
  }, [points]);

  if (points.length === 0) return <p className={styles.emptyNote}>Belum ada data untuk periode ini.</p>;

  return (
    <div className={styles.scatterWrap}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Scatter budaya dominan vs indeks kesejahteraan">
        {[0, 25, 50, 75, 100].map((g) => {
          const y = marginTop + plotH * (1 - g / 100);
          return (
            <g key={g}>
              <line x1={0} x2={width} y1={y} y2={y} stroke="var(--line)" strokeWidth={1} />
              <text x={2} y={y - 3} fontSize={9} fill="var(--ink-4)" fontFamily="var(--font-body)">{g}%</text>
            </g>
          );
        })}
        {TIPE_ORDER.map((tipe, ti) => {
          const cx = colW * ti + colW / 2;
          return (
            <g key={tipe}>
              <text x={cx} y={height - 10} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink-2)" fontFamily="var(--font-body)">{tipe}</text>
              {(grouped[tipe] || []).map((indeks, i) => (
                <circle
                  key={i}
                  cx={cx + jitterFor(i)}
                  cy={marginTop + plotH * (1 - Math.max(0, Math.min(100, indeks)) / 100)}
                  r={4.5}
                  fill={TIPE_COLOR[tipe] || "var(--ink-4)"}
                  fillOpacity={0.75}
                  stroke="var(--surface)"
                  strokeWidth={1}
                >
                  <title>{`${tipe} · indeks kesejahteraan ${indeks}%`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
      <div className={styles.scatterFootnote}>
        <span className={styles.scatterBadge}>Indikatif · n kecil</span>
        Tiap titik satu staf (anonim). Pola ini gambaran kasar, bukan bukti sebab-akibat -- jumlah staf per sekolah biasanya terlalu kecil untuk kesimpulan statistik.
      </div>
    </div>
  );
}

/**
 * ScTrenLineChart -- Fase E item 14: garis tren indeks kesejahteraan lintas periode. Kalau baru
 * satu periode data SC yang tersedia, tampilkan placeholder "menunggu periode kedua" -- jangan
 * pernah menggambar garis dari satu titik seolah itu tren. `periodeLabel` di-inject dari
 * pemanggil (ScLaporanAgregatPage.jsx sudah punya fungsi label periode sendiri) supaya modul ini
 * tidak perlu duplikat logikanya.
 */
export function ScTrenLineChart({ points = [], periodeLabel = (id) => id }) {
  const valid = points.filter((p) => p.indeks != null);
  if (valid.length < 2) {
    return (
      <div className={styles.trenPlaceholder}>
        <span className={styles.trenPlaceholderIcon}>📈</span>
        <p className={styles.trenPlaceholderText}>
          Menunggu periode kedua. Tren antarperiode baru bisa ditampilkan begitu sekolah ini
          punya data School Culture untuk 2 periode atau lebih.
        </p>
      </div>
    );
  }

  const width = 420;
  const height = 160;
  const marginX = 8;
  const marginTop = 16;
  const marginBottom = 26;
  const plotW = width - marginX * 2;
  const plotH = height - marginTop - marginBottom;
  const stepX = valid.length > 1 ? plotW / (valid.length - 1) : 0;
  const xy = valid.map((p, i) => ({
    x: marginX + stepX * i,
    y: marginTop + plotH * (1 - Math.max(0, Math.min(100, p.indeks)) / 100),
    p,
  }));
  const pathD = xy.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Tren indeks kesejahteraan antarperiode">
      {[0, 50, 100].map((g) => {
        const y = marginTop + plotH * (1 - g / 100);
        return <line key={g} x1={0} x2={width} y1={y} y2={y} stroke="var(--line)" strokeWidth={1} />;
      })}
      <path d={pathD} fill="none" stroke="var(--purple-600)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {xy.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r={4} fill="var(--purple-600)" stroke="var(--surface)" strokeWidth={1.5} />
          <text x={pt.x} y={marginTop - 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--ink-2)" fontFamily="var(--font-display)">{pt.p.indeks}%</text>
          <text x={pt.x} y={height - 6} textAnchor="middle" fontSize={9.5} fill="var(--ink-4)" fontFamily="var(--font-body)">{periodeLabel(pt.p.periode_id)}</text>
        </g>
      ))}
    </svg>
  );
}

/**
 * ScTemaEsaiList -- Fase D item 12 (Blueprint bagian 3, Level 7): tema hasil pengelompokan
 * Gemini atas jawaban esai staf (Q3/Q5/Q6 digabung, lihat geminiPromptSc.ts), sudah lewat
 * gerbang approve briefing (ApprovalDrawer.jsx) sebelum sampai di sini. Ringkasan tiap tema
 * SUDAH diparafrasekan Gemini (bukan kutipan verbatim) supaya tidak mengidentifikasi staf
 * tertentu -- lihat instruksi di SYSTEM_INSTRUCTION_SC_BRIEFING.
 */
export function ScTemaEsaiList({ tema = [] }) {
  if (tema.length === 0) return <p className={styles.emptyNote}>Belum ada tema esai untuk periode ini.</p>;
  return (
    <div className={styles.temaList}>
      {tema.map((t, i) => (
        <div key={i} className={styles.temaCard}>
          <div className={styles.temaHead}>
            <span className={styles.temaNama}>{t.tema}</span>
            <span className={styles.temaCount}>{t.jumlah_mention}× disinggung</span>
          </div>
          <p className={styles.temaRingkasan}>{t.ringkasan}</p>
        </div>
      ))}
    </div>
  );
}

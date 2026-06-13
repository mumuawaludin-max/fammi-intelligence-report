import { useState, useRef, useEffect } from "react";
import SampleTag from "../../components/SampleTag";
import { useGasRead } from "../../lib/useGasRead";
import { transformMIData } from "./miTransform";
import styles from "./SiswaPage.module.css";

// ── Sample data (referensi desain) ────────────────────────────────────────────
const SAMPLE_STUDENT = {
  name: "Aisyah Putri Faisal",
  panggilan: "Aisyah",
  kelas: "X-A",
  sekolah: "SMA Al Fath Cireundeu",
  karakter: 86,
  karakterTrend: "naik",
};

const SAMPLE_INTEL = [
  { code: "Ie", name: "Interpersonal",    score: 23, level: "Kuat",       desc: "Kamu mudah memahami perasaan orang lain dan nyaman menjalin pertemanan. Teman-teman sering menjadikanmu tempat bercerita." },
  { code: "Sp", name: "Spasial",          score: 22, level: "Kuat",       desc: "Kamu punya daya imajinasi visual yang kuat dan senang berkarya. Kamu menangkap bentuk, warna, dan ruang dengan baik." },
  { code: "Ia", name: "Intrapersonal",    score: 19, level: "Sedang",     desc: "Kamu cukup mengenali perasaan dan tujuanmu sendiri. Terus diperkuat lewat kebiasaan refleksi." },
  { code: "Ve", name: "Linguistik",       score: 18, level: "Sedang",     desc: "Kamu berkomunikasi dengan baik dalam keseharian. Latihan menulis dan berbicara akan menajamkan potensi ini." },
  { code: "Na", name: "Naturalis",        score: 16, level: "Sedang",     desc: "Kamu menikmati kegiatan di alam dan peka terhadap lingkungan sekitar." },
  { code: "Mu", name: "Musikal",          score: 15, level: "Sedang",     desc: "Kamu menikmati musik dan mampu mengikuti irama dengan baik." },
  { code: "Lo", name: "Logika-Matematika",score: 13, level: "Berkembang", desc: "Kemampuan penalaran logismu sedang berkembang dan akan tumbuh dengan latihan bertahap." },
  { code: "Ki", name: "Kinestetik",       score: 12, level: "Berkembang", desc: "Koordinasi gerakmu sedang berkembang. Aktivitas fisik yang menyenangkan akan membantu." },
];

const SAMPLE_REKOM = {
  jurusan:  ["IPS / Bahasa & Budaya", "Seni & Desain"],
  kuliah:   ["Desain Komunikasi Visual", "Arsitektur", "Psikologi", "Ilmu Komunikasi", "Seni Rupa"],
  profesi:  ["Desainer grafis / ilustrator", "Arsitek interior", "Perancang UI/UX", "Psikolog", "Hubungan masyarakat"],
  ekskul:   ["Klub Seni Rupa", "Klub Desain & Fotografi", "Pengurus OSIS", "Mading sekolah"],
  lomba:    ["Lomba poster & ilustrasi", "Lomba desain grafis", "Lomba debat / pidato"],
};

const SAMPLE_DUKUNGAN = "Aku ingin difasilitasi untuk melukis, dan tidak terlalu banyak dikomentari soal apa yang sedang kukerjakan.";

const SAMPLE_KARAKTER = [
  { name: "Mandiri",              level: "Konsisten",    val: 92, trend: "naik",   note: "Kamu mengerjakan tugas dan keperluanmu tanpa banyak diingatkan." },
  { name: "7 Kebiasaan Anak Hebat", level: "Konsisten", val: 88, trend: "naik",   note: "Kebiasaan baik harian seperti beribadah dan merapikan diri sudah melekat." },
  { name: "Aktif",                level: "Sering Muncul",val: 85, trend: "naik",   note: "Kamu aktif bertanya dan ikut serta dalam kegiatan kelas." },
  { name: "Terampil",             level: "Sering Muncul",val: 84, trend: "stabil", note: "Terampil berkarya, terutama dalam kegiatan seni dan kerajinan." },
  { name: "Religius",             level: "Sering Muncul",val: 82, trend: "stabil", note: "Menjalankan ibadah dengan kesadaran sendiri." },
  { name: "Santun",               level: "Kadang Muncul",val: 74, trend: "naik",   note: "Kesantunan dalam tutur kata sedang dibiasakan dan menunjukkan kemajuan." },
];

const SAMPLE_ASPEK = [
  { name: "Tolong Menolong",  status: "aman",      teks: "Kamu mudah membantu teman dan peka pada keadaan sekitar." },
  { name: "Relasi Pertemanan",status: "aman",      teks: "Kamu punya pertemanan yang sehat dan saling mendukung." },
  { name: "Hiperaktivitas",   status: "aman",      teks: "Kamu mampu menjaga fokus dan tenang saat belajar." },
  { name: "Emosional",        status: "perhatian", teks: "Kadang kamu memendam perasaan saat banyak pikiran. Tidak apa-apa, cerita ke orang yang kamu percaya bisa membantu." },
  { name: "Agresi",           status: "aman",      teks: "Kamu jarang bereaksi kasar dan bisa menahan diri dengan baik." },
];

// ── Level color maps ──────────────────────────────────────────────────────────
const KAR_COLOR = {
  "Konsisten":    "#B68CFF",
  "Sering Muncul":"#9D6BFF",
  "Kadang Muncul":"#FBBF24",
  "Belum Muncul": "rgba(245,242,252,0.34)",
};
const INTEL_LEVEL_COLOR = {
  "Kuat":       "#B68CFF",
  "Sedang":     "#8B5CF6",
  "Berkembang": "rgba(245,242,252,0.34)",
};

// ── Helper: wellbeing score ────────────────────────────────────────────────────
function calcWellbeing(aspek) {
  const W = { aman: 100, perhatian: 64, waspada: 28 };
  return Math.round(aspek.reduce((s, a) => s + (W[a.status] || 70), 0) / aspek.length);
}

// ── SVG Charts ────────────────────────────────────────────────────────────────

function RingGauge({ value = 0, size = 104, stroke = 11, gradient, color = "#9D6BFF", track = "rgba(255,255,255,0.10)", label = "", suffix = "" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(value / 100, 1) * circ;
  const uid = `rg-${size}-${value}`;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {gradient && (
          <defs>
            <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
          </defs>
        )}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={gradient ? `url(#${uid})` : color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
        <span style={{ fontSize: size < 80 ? 14 : size < 100 ? 18 : 22, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-.02em", fontFamily: "Space Grotesk, sans-serif" }}>
          {value}{suffix}
        </span>
        {label && <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(245,242,252,0.5)", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>}
      </div>
    </div>
  );
}

function DonutChart({ segments = [], size = 132, stroke = 20, center, centerSub }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  const slices = segments.map((seg) => {
    const dash = (seg.value / total) * circ;
    const s = { ...seg, dash, offset: circ - offset };
    offset += dash;
    return s;
  });
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {slices.map((s, i) => (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${Math.max(s.dash - 3, 0)} ${circ - Math.max(s.dash - 3, 0)}`}
            strokeDashoffset={s.offset}
          />
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1, fontFamily: "Space Grotesk, sans-serif" }}>{center}</span>
        {centerSub && <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(245,242,252,0.5)", marginTop: 2 }}>{centerSub}</span>}
      </div>
    </div>
  );
}

function SemiGauge({ value = 0, size = 260, label = "", sub = "" }) {
  const cx = size / 2;
  const R = (size - 40) / 2;
  const stroke = 18;
  const cy = R + stroke / 2 + 8;

  const trackD = `M ${cx - R} ${cy} A ${R} ${R} 0 1 0 ${cx + R} ${cy}`;

  const angle = Math.PI * (1 - value / 100);
  const fillX = cx + R * Math.cos(angle);
  const fillY = cy - R * Math.sin(angle);
  const largeArc = value > 50 ? 1 : 0;
  const fillD = value > 0
    ? `M ${cx - R} ${cy} A ${R} ${R} 0 ${largeArc} 0 ${fillX} ${fillY}`
    : null;

  const svgH = cy + stroke / 2 + 12;
  const uid = `sg-${size}`;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={svgH} viewBox={`0 0 ${size} ${svgH}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6D28D9" />
            <stop offset="100%" stopColor="#B68CFF" />
          </linearGradient>
        </defs>
        <path d={trackD} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={stroke} strokeLinecap="round" />
        {fillD && <path d={fillD} fill="none" stroke={`url(#${uid})`} strokeWidth={stroke} strokeLinecap="round" />}
        <text x={cx} y={cy - R * 0.32} textAnchor="middle" fill="#F5F2FC"
          fontSize={Math.round(size * 0.136)} fontWeight="800" letterSpacing="-1"
          fontFamily="Space Grotesk, sans-serif">{value}</text>
        {label && <text x={cx} y={cy - R * 0.06} textAnchor="middle" fill="rgba(245,242,252,0.52)" fontSize={11} fontWeight="700">{label}</text>}
      </svg>
      {sub && <p style={{ margin: "-4px 0 0", fontSize: 12.5, color: "rgba(245,242,252,0.52)", textAlign: "center" }}>{sub}</p>}
    </div>
  );
}

function DarkRadarChart({ axes = [], size = 290 }) {
  if (axes.length < 3) return null;
  const cx = size / 2, cy = size / 2;
  const maxR = size * 0.36;
  const n = axes.length;
  const levels = [0.25, 0.5, 0.75, 1];
  const labelOffset = 18;

  function angleOf(i) { return (2 * Math.PI * i) / n - Math.PI / 2; }
  function pt(i, f) {
    const a = angleOf(i);
    return { x: cx + maxR * f * Math.cos(a), y: cy + maxR * f * Math.sin(a) };
  }
  function poly(fracs) { return fracs.map((f, i) => { const p = pt(i, f); return `${p.x},${p.y}`; }).join(" "); }

  const dataFracs = axes.map((a) => (a.value ?? 0) / (a.max ?? 25));

  function anchor(i) {
    const x = Math.cos(angleOf(i));
    return x > 0.15 ? "start" : x < -0.15 ? "end" : "middle";
  }
  function baseline(i) {
    const y = Math.sin(angleOf(i));
    return y > 0.15 ? "hanging" : y < -0.15 ? "auto" : "middle";
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ overflow: "visible" }}>
      {levels.map((lvl) => (
        <polygon key={lvl} points={poly(axes.map(() => lvl))}
          fill="none" stroke="rgba(255,255,255,0.11)"
          strokeWidth={lvl === 1 ? 1 : 0.75}
          strokeDasharray={lvl < 1 ? "3 3" : undefined}
        />
      ))}
      {axes.map((_, i) => {
        const tip = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="rgba(255,255,255,0.11)" strokeWidth={0.75} />;
      })}
      <polygon points={poly(dataFracs)} fill="#9D6BFF" fillOpacity={0.22} stroke="#B68CFF" strokeWidth={2} strokeLinejoin="round" />
      {axes.map((a, i) => {
        const f = dataFracs[i];
        const p = pt(i, f);
        return <circle key={i} cx={p.x} cy={p.y} r={4} fill="#B68CFF" stroke="#0C0817" strokeWidth={2} />;
      })}
      {axes.map((a, i) => {
        const tip = pt(i, 1 + labelOffset / maxR);
        return (
          <text key={i} x={tip.x} y={tip.y} fontSize={10} fontWeight={700}
            fontFamily="Plus Jakarta Sans, sans-serif"
            fill="rgba(245,242,252,0.52)"
            textAnchor={anchor(i)} dominantBaseline={baseline(i)}
          >{a.short ?? a.label}</text>
        );
      })}
    </svg>
  );
}

function BarList({ rows = [] }) {
  const maxVal = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((row, i) => {
        const pct = (row.value / maxVal) * 100;
        const col = INTEL_LEVEL_COLOR[row.tag] || "#9D6BFF";
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 90, fontSize: 12.5, fontWeight: 700, color: "rgba(245,242,252,0.76)", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.label}</span>
            <div style={{ flex: 1, height: 6, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: col, transition: "width .6s ease" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", width: 24, textAlign: "right", fontFamily: "Space Grotesk, sans-serif" }}>{row.value}</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: col, width: 72, fontSize: 10 }}>{row.tag}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function SCard({ children, style, glow }) {
  return (
    <div className={styles.sCard} style={{
      boxShadow: glow
        ? "0 18px 54px rgba(124,58,237,0.28), inset 0 1px 0 rgba(255,255,255,0.07)"
        : "0 12px 36px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.05)",
      ...style,
    }}>{children}</div>
  );
}

function SChip({ children, tone = "ungu", style: sx }) {
  const map = {
    ungu:     { fg: "#B68CFF", bg: "rgba(157,107,255,0.20)", bd: "rgba(157,107,255,0.34)" },
    aman:     { fg: "#34D399", bg: "rgba(52,211,153,0.15)",  bd: "rgba(52,211,153,0.34)" },
    perhatian:{ fg: "#FBBF24", bg: "rgba(251,191,36,0.15)",  bd: "rgba(251,191,36,0.34)" },
  };
  const c = map[tone] || map.ungu;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700,
      color: c.fg, background: c.bg, border: `1px solid ${c.bd}`, padding: "5px 11px",
      borderRadius: 99, whiteSpace: "nowrap", ...sx }}>{children}</span>
  );
}

function SHeading({ kicker, title, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {kicker && <div style={{ fontSize: 11, fontWeight: 700, color: "#B68CFF", textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 7, fontFamily: "Space Grotesk, sans-serif" }}>{kicker}</div>}
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", color: "#F5F2FC", lineHeight: 1.15 }}>{title}</h2>
      {sub && <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "rgba(245,242,252,0.52)", lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

function SHomeTip({ children }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "16px 17px", background: "rgba(157,107,255,0.12)", borderRadius: 18, border: "1px solid rgba(157,107,255,0.28)" }}>
      <span style={{ width: 34, height: 34, borderRadius: 11, background: "rgba(255,255,255,0.08)", color: "#B68CFF", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <IcSparkle size={17} />
      </span>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#B68CFF", marginBottom: 4 }}>Yang bisa kamu coba</div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "rgba(245,242,252,0.76)" }}>{children}</p>
      </div>
    </div>
  );
}

function STrend({ t, size = 13 }) {
  if (t === "naik")  return <IcArrowUp size={size} style={{ color: "#34D399" }} />;
  if (t === "turun") return <IcArrowDown size={size} style={{ color: "#FB7185" }} />;
  return <IcMinus size={size} style={{ color: "rgba(245,242,252,0.34)" }} />;
}

// ── Inline icons ──────────────────────────────────────────────────────────────
const S = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

function IcHome({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IcHeart({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>; }
function IcShield({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IcSparkle({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z"/></svg>; }
function IcArrowRight({ size = 18 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><polyline points="9 18 15 12 9 6"/></svg>; }
function IcArrowUp({ size = 14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><polyline points="18 15 12 9 6 15"/></svg>; }
function IcArrowDown({ size = 14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><polyline points="6 9 12 15 18 9"/></svg>; }
function IcMinus({ size = 14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IcCheckCircle({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; }
function IcBrain({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M9.5 2A2.5 2.5 0 0 0 7 4.5V5a3 3 0 0 0-3 3v1a3 3 0 0 0 .5 1.66A3.5 3.5 0 0 0 5 14a3.5 3.5 0 0 0 3 3.46V20h8v-2.54A3.5 3.5 0 0 0 19 14a3.5 3.5 0 0 0-.5-3.34A3 3 0 0 0 19 9V8a3 3 0 0 0-3-3v-.5A2.5 2.5 0 0 0 13.5 2z"/></svg>; }
function IcUsers({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IcFlag({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>; }
function IcLogout({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function IcChat({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }

// Intelligence code → first letter icon badge (simple)
function IntelBadge({ code, size = 44 }) {
  return (
    <span style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), background: "linear-gradient(135deg, #B68CFF, #6D28D9)", color: "#fff", display: "grid", placeItems: "center", boxShadow: "0 8px 22px rgba(124,58,237,0.5)", flexShrink: 0, fontWeight: 800, fontSize: Math.round(size * 0.36), fontFamily: "Space Grotesk, sans-serif" }}>
      {code.slice(0, 2)}
    </span>
  );
}

// ── View: Beranda ─────────────────────────────────────────────────────────────
function BerandaView({ student, intel, karakter, aspek, dukungan, setView }) {
  const dom = intel.filter((i) => i.level === "Kuat");
  const perhatian = aspek.filter((a) => a.status === "perhatian");
  const well = calcWellbeing(aspek);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Hero card */}
      <SCard glow style={{ padding: "22px 20px", background: "linear-gradient(150deg, rgba(157,107,255,0.28), rgba(109,40,217,0.10) 60%, rgba(255,255,255,0.02))" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SChip><IcSparkle size={12} /> Semester ini</SChip>
            <h2 style={{ margin: "12px 0 0", fontSize: 23, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.15, color: "#fff" }}>
              Halo, {student.panggilan}!
            </h2>
            <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "rgba(245,242,252,0.76)" }}>
              Kamu berkembang pesat semester ini. Karaktermu makin kuat, bakatmu mulai bersinar, dan perasaanmu lagi cukup cerah.
            </p>
          </div>
          <RingGauge value={student.karakter} size={104} stroke={11} gradient={["#C9B0FF", "#7C3AED"]} label="Karakter" />
        </div>
      </SCard>

      {/* Kekuatan super */}
      {dom.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#B68CFF", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 11, fontFamily: "Space Grotesk, sans-serif" }}>Kekuatan supermu</div>
          <div style={{ display: "flex", gap: 11 }}>
            {dom.map((it) => (
              <SCard key={it.code} style={{ flex: 1, padding: "16px 15px", textAlign: "center" }}>
                <IntelBadge code={it.code} size={44} />
                <div style={{ marginTop: 11, fontSize: 14.5, fontWeight: 800, color: "rgba(245,242,252,1)", letterSpacing: "-.01em" }}>{it.name}</div>
                <div style={{ marginTop: 3, fontSize: 11.5, fontWeight: 700, color: "#B68CFF" }}>{it.score}/100 · {it.level}</div>
              </SCard>
            ))}
          </div>
        </div>
      )}

      {/* Quick tiles */}
      <div style={{ display: "flex", gap: 11 }}>
        <button className={styles.stile} onClick={() => setView("karakter")}>
          <span className={styles.stileIcon}><IcHeart size={16} /></span>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "rgba(245,242,252,1)", letterSpacing: "-.02em" }}>{student.karakter}%</span>
              <STrend t={student.karakterTrend} />
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(245,242,252,0.52)", marginTop: 1 }}>Karakter</div>
          </div>
        </button>
        <button className={styles.stile} onClick={() => setView("perasaan")}>
          <span className={styles.stileIcon} style={{ color: perhatian.length ? "#FBBF24" : "rgba(245,242,252,0.76)" }}><IcShield size={16} /></span>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "rgba(245,242,252,1)", letterSpacing: "-.02em" }}>{well}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(245,242,252,0.52)" }}>/ 100</span>
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(245,242,252,0.52)", marginTop: 1 }}>Perasaan</div>
          </div>
        </button>
        <button className={styles.stile} onClick={() => setView("bakat")}>
          <span className={styles.stileIcon}><IcSparkle size={16} /></span>
          <div>
            <div>
              <span style={{ fontSize: 20, fontWeight: 800, color: "rgba(245,242,252,1)", letterSpacing: "-.02em" }}>{dom.length}</span>
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(245,242,252,0.52)", marginTop: 1 }}>Bakat menonjol</div>
          </div>
        </button>
      </div>

      {/* Kata kamu sendiri */}
      {dukungan && (
        <SCard style={{ padding: "20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(157,107,255,0.20)", color: "#B68CFF", display: "grid", placeItems: "center" }}><IcChat size={16} /></span>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "rgba(245,242,252,1)" }}>Kata kamu sendiri</h3>
          </div>
          <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
            <span style={{ fontSize: 38, lineHeight: .8, color: "#9D6BFF", fontWeight: 800, fontFamily: "Georgia, serif", flexShrink: 0 }}>&ldquo;</span>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "rgba(245,242,252,1)", fontWeight: 500, fontStyle: "italic" }}>{dukungan}</p>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(245,242,252,0.34)" }}>Ini yang kamu sampaikan saat asesmen. Terima kasih sudah jujur.</p>
        </SCard>
      )}

      {/* Jump links */}
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <SJumpLink Icon={IcHeart} title="Karaktermu" note="6 kebiasaan baik yang kamu tumbuhkan" onOpen={() => setView("karakter")} />
        <SJumpLink Icon={IcShield} title="Perasaanmu" note={perhatian.length ? "Ada hal yang bisa kamu rawat" : "Semua terasa baik"} tone={perhatian.length ? "perhatian" : "aman"} onOpen={() => setView("perasaan")} />
        <SJumpLink Icon={IcSparkle} title="Bakatmu" note={"Menonjol: " + dom.map((d) => d.name).join(" & ")} onOpen={() => setView("bakat")} />
      </div>
    </div>
  );
}

function SJumpLink({ Icon, title, note, tone, onOpen }) {
  const col = tone === "perhatian" ? "#FBBF24" : "#B68CFF";
  return (
    <button onClick={onOpen} className={styles.sjump}>
      <span style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(157,107,255,0.20)", color: col, display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon size={21} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: "rgba(245,242,252,1)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "rgba(245,242,252,0.52)", marginTop: 2 }}>{note}</div>
      </div>
      <IcArrowRight size={18} style={{ color: "rgba(245,242,252,0.34)", flexShrink: 0 }} />
    </button>
  );
}

// ── View: Karakter ────────────────────────────────────────────────────────────
function KarakterView({ karakter }) {
  const levels = ["Konsisten", "Sering Muncul", "Kadang Muncul", "Belum Muncul"];
  const counts = levels.map((lv) => ({ lv, n: karakter.filter((k) => k.level === lv).length }));
  const segments = counts.filter((x) => x.n > 0).map((x) => ({ value: x.n, color: KAR_COLOR[x.lv] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <SHeading kicker="Lencana Karakter" title="Karaktermu" sub="Enam kebiasaan baik yang kamu tumbuhkan di sekolah dan di rumah. Kumpulkan terus lencananya!" />

      <SCard style={{ padding: "20px 18px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <DonutChart segments={segments} size={132} stroke={20} center={karakter.length} centerSub="Karakter" />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 9 }}>
            {counts.filter((x) => x.n > 0).map((x) => (
              <div key={x.lv} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: KAR_COLOR[x.lv], flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: "rgba(245,242,252,0.76)", fontWeight: 600, flex: 1 }}>{x.lv}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "rgba(245,242,252,1)" }}>{x.n}</span>
              </div>
            ))}
          </div>
        </div>
      </SCard>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {karakter.map((k) => <BadgeCard key={k.name} k={k} />)}
      </div>

      <SHomeTip>
        Kesantunanmu sedang tumbuh dan sudah makin baik. Coba perhatikan pilihan kata saat sedang kesal — pelan-pelan saja, kamu pasti bisa.
      </SHomeTip>
    </div>
  );
}

function BadgeCard({ k }) {
  const col = KAR_COLOR[k.level];
  const earned = k.level === "Konsisten";
  return (
    <SCard style={{ padding: "15px 16px", display: "flex", alignItems: "center", gap: 15 }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <RingGauge value={k.val} size={68} stroke={7} color={col} track="rgba(255,255,255,0.10)" suffix="%" />
        {earned && (
          <span style={{ position: "absolute", right: -2, bottom: -2, width: 22, height: 22, borderRadius: 99, background: "#9D6BFF", color: "#fff", display: "grid", placeItems: "center", border: "2px solid #0C0817", boxShadow: "0 0 12px rgba(157,107,255,0.7)" }}>
            <IcCheckCircle size={13} />
          </span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "rgba(245,242,252,1)" }}>{k.name}</h3>
          <SChip tone={k.level === "Kadang Muncul" ? "perhatian" : "ungu"} style={{ padding: "3px 9px", fontSize: 10.5 }}>
            {k.level} <STrend t={k.trend} size={11} />
          </SChip>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: "rgba(245,242,252,0.52)" }}>{k.note}</p>
      </div>
    </SCard>
  );
}

// ── View: Perasaan ────────────────────────────────────────────────────────────
function PerasaanView({ aspek }) {
  const perhatian = aspek.filter((a) => a.status === "perhatian");
  const aman = aspek.filter((a) => a.status === "aman");
  const well = calcWellbeing(aspek);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <SHeading kicker="Cuaca Perasaan" title="Perasaanmu" sub="Gambaran lembut tentang perasaan dan pertemananmu. Ini bukan penilaian — cuma cara mengenali diri sendiri." />

      <SCard style={{ padding: "20px 18px 16px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <SemiGauge value={well} size={260} label="Kesejahteraan" sub="Perasaanmu secara umum lagi cerah" />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.11)", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#34D399", letterSpacing: "-.02em", lineHeight: 1, fontFamily: "Space Grotesk, sans-serif" }}>{aman.length}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(245,242,252,0.76)", lineHeight: 1.25 }}>Terasa baik</span>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.11)", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#FBBF24", letterSpacing: "-.02em", lineHeight: 1, fontFamily: "Space Grotesk, sans-serif" }}>{perhatian.length}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(245,242,252,0.76)", lineHeight: 1.25 }}>Bisa dirawat</span>
          </div>
        </div>
      </SCard>

      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {aspek.map((a) => <AspekCard key={a.name} a={a} />)}
      </div>

      {perhatian.map((a) => (
        <SHomeTip key={a.name}>
          Soal {a.name.toLowerCase()}: nggak apa-apa kalau lagi banyak pikiran. Coba tulis perasaanmu atau cerita ke orang yang kamu percaya, sedikit demi sedikit.
        </SHomeTip>
      ))}

      <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "13px 15px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.11)", borderRadius: 14, fontSize: 12, lineHeight: 1.5, color: "rgba(245,242,252,0.34)" }}>
        <IcShield size={15} style={{ color: "rgba(245,242,252,0.34)", flexShrink: 0, marginTop: 1 }} />
        <span>Hasil ini cuma gambaran. Kalau kamu ingin ngobrol lebih jauh, guru BK di sekolah siap mendengarkan.</span>
      </div>
    </div>
  );
}

function AspekCard({ a }) {
  const ok = a.status === "aman";
  const col = ok ? "#34D399" : "#FBBF24";
  const bg  = ok ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.15)";
  return (
    <SCard style={{ padding: "15px 17px", display: "flex", alignItems: "flex-start", gap: 13 }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, background: bg, color: col, display: "grid", placeItems: "center", flexShrink: 0 }}>
        {ok ? <IcCheckCircle size={20} /> : <IcHeart size={20} />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: "rgba(245,242,252,1)" }}>{a.name}</span>
          <SChip tone={ok ? "aman" : "perhatian"} style={{ padding: "4px 9px", fontSize: 10.5 }}>{ok ? "Baik" : "Dirawat"}</SChip>
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "rgba(245,242,252,0.76)" }}>{a.teks}</p>
      </div>
    </SCard>
  );
}

// ── View: Bakat ───────────────────────────────────────────────────────────────
const LEVEL_COLOR = { Kuat: "#B68CFF", Sedang: "#8B5CF6", Berkembang: "rgba(245,242,252,0.34)" };
const LEVEL_BG    = { Kuat: "rgba(182,140,255,0.18)", Sedang: "rgba(139,92,246,0.14)", Berkembang: "rgba(255,255,255,0.06)" };

function TopIntelCard({ td, rank }) {
  const rankLabel = ["TOP 1", "TOP 2", "TOP 3"][rank] || "";
  return (
    <SCard glow style={{ padding: "20px 18px", background: rank === 0 ? "linear-gradient(135deg,rgba(157,107,255,0.22),rgba(255,255,255,0.02))" : "rgba(255,255,255,0.03)", border: rank === 0 ? "1px solid rgba(182,140,255,0.30)" : "1px solid rgba(255,255,255,0.08)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <IntelBadge code={td.code} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#B68CFF", textTransform: "uppercase", letterSpacing: ".1em" }}>{rankLabel}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: LEVEL_COLOR[td.level], background: LEVEL_BG[td.level], padding: "2px 7px", borderRadius: 99 }}>{td.level}</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-.01em" }}>{td.name}</div>
          <div style={{ fontSize: 12, color: "rgba(245,242,252,0.52)", marginTop: 1 }}>{td.score}/100</div>
        </div>
      </div>

      {/* Arti */}
      {td.arti && <p style={{ margin: "0 0 14px", fontSize: 13.5, lineHeight: 1.65, color: "rgba(245,242,252,0.82)" }}>{td.arti}</p>}

      {/* Terlihat */}
      {td.terlihat && td.terlihat.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#B68CFF", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 7 }}>Tandanya pada dirimu</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {td.terlihat.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, lineHeight: 1.5, color: "rgba(245,242,252,0.72)" }}>
                <span style={{ color: "#B68CFF", flexShrink: 0, marginTop: 1 }}>→</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lakukan */}
      {td.lakukan && td.lakukan.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#B68CFF", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 7 }}>Yang bisa kamu lakukan</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {td.lakukan.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, lineHeight: 1.5, color: "rgba(245,242,252,0.72)" }}>
                <span style={{ color: "#9D6BFF", flexShrink: 0, marginTop: 1 }}>•</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profesi */}
      {td.profesi && td.profesi.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#B68CFF", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 7 }}>Profesi yang relevan</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {td.profesi.map((p, i) => (
              <span key={i} style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(245,242,252,0.76)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", padding: "5px 10px", borderRadius: 99 }}>{p}</span>
            ))}
          </div>
        </div>
      )}

      {/* Jaga */}
      {td.jaga && (
        <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.20)", borderRadius: 10, padding: "10px 13px" }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#D69219", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Perlu diperhatikan</div>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "rgba(245,242,252,0.65)" }}>{td.jaga}</p>
        </div>
      )}
    </SCard>
  );
}

function IntelMiniCard({ it }) {
  return (
    <SCard style={{ padding: "14px 15px", display: "flex", gap: 12, alignItems: "flex-start" }}>
      <IntelBadge code={it.code} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>{it.name}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: LEVEL_COLOR[it.level], background: LEVEL_BG[it.level], padding: "2px 7px", borderRadius: 99, flexShrink: 0 }}>{it.level}</span>
        </div>
        <div style={{ fontSize: 11.5, color: "rgba(245,242,252,0.45)", marginBottom: 5 }}>{it.score}/100</div>
        {it.desc && <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: "rgba(245,242,252,0.62)" }}>{it.desc}</p>}
      </div>
    </SCard>
  );
}

function BakatView({ intel, rekom, topNames, topDetails, dukungan, narasiKombinasi, narasiProfil, mapelSulit, mapelNarasiFinal, isSample }) {
  const axes = intel.map((it) => ({ label: it.name, short: it.code, value: it.score, max: 100 }));
  const bars = [...intel].sort((a, b) => b.score - a.score).map((it) => ({ label: it.name, value: it.score, tag: it.level }));
  const nonDominant = intel.filter(it => it.topIdx === -1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Narasi hero + kombinasi */}
      {(dukungan || narasiKombinasi) && !isSample && (
        <SCard style={{ padding: "18px 18px", background: "linear-gradient(135deg,rgba(99,35,218,0.18),rgba(255,255,255,0.01))", border: "1px solid rgba(182,140,255,0.20)" }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#B68CFF", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Cara belajarmu</div>
          {dukungan && <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600, lineHeight: 1.6, color: "rgba(245,242,252,0.90)" }}>{dukungan}</p>}
          {narasiKombinasi && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: "rgba(245,242,252,0.68)" }}>{narasiKombinasi}</p>}
        </SCard>
      )}

      {/* TOP 1/2/3 detail cards */}
      {topDetails && topDetails.length > 0 && (
        <>
          <SHeading kicker="Kecerdasan Unggulan" title="Kekuatan supermu" sub="Kecerdasan ini paling menonjol dan jadi fondasi cara belajarmu." />
          {topDetails.map((td, i) => <TopIntelCard key={td.code || i} td={td} rank={i} />)}
        </>
      )}

      {/* Radar peta 8 kecerdasan */}
      <SCard style={{ padding: "18px 16px 14px" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 14.5, fontWeight: 800, color: "#fff" }}>Peta delapan kecerdasanmu</h3>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "rgba(245,242,252,0.45)" }}>Makin jauh dari pusat, makin menonjol kecerdasan itu.</p>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <DarkRadarChart axes={axes} size={290} />
        </div>
      </SCard>

      {/* Ranking bar */}
      <SCard style={{ padding: "20px 18px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: "#fff" }}>Peringkat kecerdasan</h3>
        <BarList rows={bars} />
      </SCard>

      {/* Kecerdasan non-dominan */}
      {nonDominant.length > 0 && (
        <>
          <SHeading kicker="Kecerdasan Lainnya" title="Yang terus berkembang" sub="Bukan kelemahan — hanya gaya yang belum terbiasa dipakai." />
          {nonDominant.map(it => <IntelMiniCard key={it.code} it={it} />)}
        </>
      )}

      {/* Profesi & ekskul rekomendasi */}
      {rekom.profesi.length > 0 && <RekomCard title="Profesi yang bisa kamu jajaki" Icon={IcSparkle} items={rekom.profesi} />}
      {rekom.ekskul.length > 0 && <RekomCard title="Kegiatan & ekskul buat kamu" Icon={IcUsers} items={rekom.ekskul} />}

      {/* Narasi profil final */}
      {narasiProfil && !isSample && (
        <SCard style={{ padding: "18px 18px", border: "1px solid rgba(182,140,255,0.15)" }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#B68CFF", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Profil lengkap</div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "rgba(245,242,252,0.75)" }}>{narasiProfil}</p>
        </SCard>
      )}

      {/* Mapel sulit */}
      {mapelSulit && mapelSulit.length > 0 && !isSample && (
        <>
          <SHeading kicker="Mapel & Strategi" title="Yang butuh perhatian ekstra" sub="Bukan berarti tidak bisa — butuh strategi belajar yang tepat." />
          {mapelSulit.map((m, i) => (
            <SCard key={i} style={{ padding: "16px 17px", border: "1px solid rgba(214,69,90,0.18)" }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{m.nama}</div>
              {m.desc && <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: "rgba(245,242,252,0.65)" }}>{m.desc}</p>}
            </SCard>
          ))}
          {mapelNarasiFinal && (
            <SCard style={{ padding: "15px 17px", background: "rgba(214,69,90,0.06)", border: "1px solid rgba(214,69,90,0.15)" }}>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: "rgba(245,242,252,0.72)" }}>{mapelNarasiFinal}</p>
            </SCard>
          )}
        </>
      )}
    </div>
  );
}

function RekomCard({ title, Icon, items }) {
  return (
    <SCard style={{ padding: "18px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(157,107,255,0.20)", color: "#B68CFF", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon size={19} />
        </span>
        <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: "rgba(245,242,252,1)" }}>{title}</h3>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((it, i) => (
          <span key={i} style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(245,242,252,0.76)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.11)", padding: "7px 12px", borderRadius: 99 }}>{it}</span>
        ))}
      </div>
    </SCard>
  );
}

// ── Nav + Header ──────────────────────────────────────────────────────────────
// MVP: hanya Bakat view (karakter, perasaan nanti)
const NAV_ITEMS = [
  { id: "bakat", label: "Bakat", Icon: IcSparkle },
];

function SiswaHeader({ student, onLogout }) {
  return (
    <header className={styles.sHeader}>
      <div className={styles.sHeaderTop}>
        <span className={styles.sLogo}>FammiR</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SChip><IcSparkle size={12} /> Mode Siswa</SChip>
          <button className={styles.sLogoutBtn} onClick={onLogout} title="Keluar">
            <IcLogout size={15} />
          </button>
        </div>
      </div>
      <div className={styles.sHeaderProfile}>
        <span className={styles.sAvatar}>{student.panggilan[0]}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#B68CFF", textTransform: "uppercase", letterSpacing: ".12em", fontFamily: "Space Grotesk, sans-serif" }}>Peta Diriku</div>
          <h1 className={styles.sHeaderName}>{student.name}</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(245,242,252,0.52)" }}>{student.kelas} · {student.sekolah}</p>
        </div>
      </div>
    </header>
  );
}

function SiswaBottomNav({ activeView, setView }) {
  return (
    <nav className={styles.sBottomNav}>
      {NAV_ITEMS.map((n) => {
        const active = n.id === activeView;
        const Icon = n.Icon;
        return (
          <button key={n.id} className={`${styles.sNavBtn} ${active ? styles.sNavActive : ""}`} onClick={() => setView(n.id)}>
            <span className={`${styles.sNavPill} ${active ? styles.sNavPillActive : ""}`}>
              <Icon size={20} />
            </span>
            <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 600, letterSpacing: ".01em" }}>{n.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SiswaPage({ session, onLogout }) {
  const [activeView, setActiveView] = useState("bakat");
  const mainRef = useRef(null);

  // Fetch MI data dari GAS
  const { loading, data, error } = useGasRead("mi", null, session);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [activeView]);

  // Transform data dari GAS
  let student, intel, karakter, aspek, dukungan, rekom, topNames, topDetails, narasiKombinasi, narasiProfil, mapelSulit, mapelNarasiFinal;
  let isSample = false;

  if (data && data.output_mi && data.output_mi.length > 0) {
    const transformed = transformMIData(data, session?.nama);
    if (transformed) {
      student = transformed.student;
      intel = transformed.intel;
      karakter = transformed.karakter;
      aspek = transformed.aspek;
      dukungan = transformed.dukungan;
      rekom = transformed.rekom;
      topNames = transformed.topNames;
      topDetails = transformed.topDetails;
      narasiKombinasi = transformed.narasiKombinasi;
      narasiProfil = transformed.narasiProfil;
      mapelSulit = transformed.mapelSulit;
      mapelNarasiFinal = transformed.mapelNarasiFinal;
      isSample = false;
    }
  }

  // Fallback ke sample data jika belum ada data real
  if (!student) {
    student = { ...SAMPLE_STUDENT, name: session?.nama || SAMPLE_STUDENT.name, panggilan: (session?.nama || SAMPLE_STUDENT.name).split(/\s+/)[0] };
    intel = SAMPLE_INTEL;
    karakter = SAMPLE_KARAKTER;
    aspek = SAMPLE_ASPEK;
    dukungan = SAMPLE_DUKUNGAN;
    rekom = SAMPLE_REKOM;
    isSample = true;
  }

  return (
    <div className={styles.siswaRoot}>
      {/* Aurora background */}
      <div className={styles.aurora} />

      <div className={styles.phone}>
        <SiswaHeader student={student} onLogout={onLogout} />

        <main ref={mainRef} className={styles.sMain}>
          <div className={styles.sContent}>
            {loading && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(245,242,252,0.52)" }}>
                <p>Memuat data Multiple Intelligence...</p>
              </div>
            )}
            {error && (
              <div style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.34)", borderRadius: 12, padding: 16, color: "rgba(245,242,252,0.76)", fontSize: 13, lineHeight: 1.5 }}>
                <strong>Tidak bisa memuat data:</strong> {error}
              </div>
            )}
            {!loading && !error && (
              <>
                {isSample && (
                  <div style={{ marginBottom: 4 }}>
                    <SampleTag />
                  </div>
                )}
                {activeView === "beranda"  && <BerandaView student={student} intel={intel} karakter={karakter} aspek={aspek} dukungan={dukungan} setView={setActiveView} />}
                {activeView === "bakat"    && <BakatView intel={intel} rekom={rekom} topNames={topNames} topDetails={topDetails} dukungan={dukungan} narasiKombinasi={narasiKombinasi} narasiProfil={narasiProfil} mapelSulit={mapelSulit} mapelNarasiFinal={mapelNarasiFinal} isSample={isSample} />}
              </>
            )}
          </div>
        </main>

        <SiswaBottomNav activeView={activeView} setView={setActiveView} />
      </div>
    </div>
  );
}

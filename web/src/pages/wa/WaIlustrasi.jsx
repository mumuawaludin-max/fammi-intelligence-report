// Ilustrasi garis beranimasi pengganti gambar di desain acuan (hati di tas kerja, papan klip
// berpita, dua ilustrasi tab Survey, dan ilustrasi sambutan laporan individu). Berkas SVG asli
// dari desainer belum ada; begitu ada, ganti isi komponen di sini saja, ukuran wadahnya tetap.
// Semua garis memakai --wa-garis-ilustrasi; gerak berhenti untuk prefers-reduced-motion lewat
// MotionConfig di cangkang.

import { motion } from "motion/react";

const GARIS = "var(--wa-garis-ilustrasi, #241a35)";
const DASAR = { fill: "#ffffff", stroke: GARIS, strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" };
const LUPA = { fill: "none", stroke: GARIS, strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" };

function Kilau({ x, y, s = 1, tunda = 0 }) {
  return (
    <motion.path
      d={`M${x} ${y - 7 * s} L${x + 2 * s} ${y - 2 * s} L${x + 7 * s} ${y} L${x + 2 * s} ${y + 2 * s} L${x} ${y + 7 * s} L${x - 2 * s} ${y + 2 * s} L${x - 7 * s} ${y} L${x - 2 * s} ${y - 2 * s} Z`}
      {...DASAR}
      strokeWidth={2.5}
      style={{ transformOrigin: `${x}px ${y}px` }}
      animate={{ scale: [1, 1.25, 1], opacity: [1, 0.6, 1] }}
      transition={{ duration: 2.4, repeat: Infinity, delay: tunda, ease: "easeInOut" }}
    />
  );
}

function Titik({ x, y, r = 3.5, tunda = 0 }) {
  return (
    <motion.circle
      cx={x} cy={y} r={r} {...LUPA} strokeWidth={2.5}
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 2, repeat: Infinity, delay: tunda }}
    />
  );
}

function Bayang({ cx = 90, cy = 150, rx = 62 }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={7} fill="#e9e7ef" />;
}

/** Hati tersenyum di dalam tas kerja (kartu skor wellbeing). */
export function IlustrasiHati({ ukuran = 150 }) {
  return (
    <svg viewBox="0 0 180 160" width={ukuran} height={ukuran * 0.89} aria-hidden="true">
      <Bayang />
      <motion.g animate={{ y: [0, -4, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M90 96 C60 76 44 62 44 44 C44 30 55 22 66 22 C76 22 84 28 90 36 C96 28 104 22 114 22 C125 22 136 30 136 44 C136 62 120 76 90 96 Z" {...DASAR} />
        <path d="M72 48 q5 5 10 0 M98 48 q5 5 10 0" {...LUPA} />
        <path d="M82 60 q8 7 16 0" {...LUPA} />
        <path d="M122 34 q7 5 6 14" {...LUPA} strokeWidth={2.5} />
      </motion.g>
      <motion.g style={{ transformOrigin: "132px 84px" }} animate={{ rotate: [0, 6, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M128 84 C136 64 154 62 160 52 C162 70 150 86 130 88 Z" {...DASAR} />
        <path d="M132 84 L152 62" {...LUPA} strokeWidth={2.5} />
      </motion.g>
      <rect x="38" y="84" width="104" height="60" rx="10" {...DASAR} />
      <path d="M38 104 H142" {...LUPA} />
      <rect x="79" y="96" width="22" height="15" rx="4" {...DASAR} />
      <path d="M90 6 v8 M64 10 l4 7 M116 10 l-4 7" {...LUPA} />
      <Kilau x={28} y={40} tunda={0.3} />
      <Kilau x={156} y={100} s={0.8} tunda={1.1} />
      <Titik x={38} y={66} tunda={0.6} />
      <Titik x={152} y={30} tunda={1.4} />
    </svg>
  );
}

/** Papan klip dengan daftar centang dan pita bintang (kartu skor kepuasan). */
export function IlustrasiPapan({ ukuran = 150 }) {
  const baris = [62, 84, 106];
  return (
    <svg viewBox="0 0 180 160" width={ukuran} height={ukuran * 0.89} aria-hidden="true">
      <Bayang />
      <rect x="44" y="28" width="90" height="116" rx="10" {...DASAR} />
      <rect x="54" y="40" width="70" height="94" rx="4" {...DASAR} strokeWidth={2.5} />
      <rect x="71" y="18" width="36" height="18" rx="6" {...DASAR} />
      <circle cx="89" cy="23" r="3.5" {...LUPA} strokeWidth={2.5} />
      {baris.map((y, i) => (
        <g key={y}>
          <circle cx="68" cy={y} r="7" {...DASAR} strokeWidth={2.5} />
          <motion.path
            d={`M64.5 ${y} l2.6 2.8 l4.6 -5`}
            {...LUPA}
            strokeWidth={2.5}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.4 + i * 0.35, ease: "easeOut" }}
          />
          <path d={`M82 ${y - 3} H112 M82 ${y + 4} H102`} {...LUPA} strokeWidth={2.5} />
        </g>
      ))}
      <motion.g style={{ transformOrigin: "128px 112px" }} animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M116 128 l-6 20 l10 -5 l6 9 l4 -20 M140 128 l6 20 l-10 -5 l-6 9 l-4 -20" {...DASAR} strokeWidth={2.5} />
        <circle cx="128" cy="112" r="22" {...DASAR} />
        <circle cx="128" cy="112" r="15" {...DASAR} strokeWidth={2.5} />
        <path d="M128 102 l3 6.5 l7 0.8 l-5.2 4.8 l1.5 7 l-6.3 -3.6 l-6.3 3.6 l1.5 -7 l-5.2 -4.8 l7 -0.8 Z" {...DASAR} strokeWidth={2.2} />
      </motion.g>
      <Kilau x={32} y={22} tunda={0.4} />
      <path d="M152 30 v12 M146 36 h12" {...LUPA} strokeWidth={2.5} />
      <path d="M150 66 l8 -5 M152 76 l9 0" {...LUPA} strokeWidth={2.5} />
      <Titik x={26} y={58} r={3} tunda={1.2} />
    </svg>
  );
}

/** Tiga batang naik dengan bintang dan tunas (Survey, kartu kekuatan lembaga). */
export function IlustrasiKekuatan({ ukuran = 190 }) {
  const batang = [
    { x: 58, h: 40 },
    { x: 88, h: 64 },
    { x: 118, h: 92 },
  ];
  return (
    <svg viewBox="0 0 200 150" width={ukuran} height={ukuran * 0.75} aria-hidden="true">
      <Bayang cx={100} cy={140} rx={78} />
      <path d="M30 134 H170" {...LUPA} />
      {batang.map((b, i) => (
        <motion.rect
          key={b.x}
          x={b.x} y={134 - b.h} width={24} height={b.h} rx={5}
          {...DASAR}
          fill={i === 2 ? "var(--wa-hijau-pucat, #e8f7ee)" : "#ffffff"}
          style={{ transformOrigin: `${b.x + 12}px 134px` }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.7, delay: 0.2 + i * 0.18, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
      <motion.path
        d="M50 92 L82 70 L108 78 L144 34"
        {...LUPA}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
      />
      <motion.path
        d="M144 16 l4 8.5 l9.2 1 l-6.8 6.3 l1.9 9.1 l-8.3 -4.7 l-8.3 4.7 l1.9 -9.1 l-6.8 -6.3 l9.2 -1 Z"
        {...DASAR}
        style={{ transformOrigin: "144px 30px" }}
        animate={{ rotate: [0, 12, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.g style={{ transformOrigin: "36px 134px" }} animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M36 134 V108" {...LUPA} />
        <path d="M36 114 C24 112 20 102 22 96 C32 96 38 104 36 114 Z M36 108 C46 104 52 96 50 88 C40 88 34 98 36 108 Z" {...DASAR} strokeWidth={2.5} />
      </motion.g>
      <Kilau x={176} y={70} s={0.8} tunda={0.8} />
      <Titik x={170} y={104} r={3} tunda={1.5} />
    </svg>
  );
}

/** Segitiga tanda, kunci pas, dan roda gigi berputar (Survey, kartu perbaikan segera). */
export function IlustrasiPerbaikan({ ukuran = 190 }) {
  return (
    <svg viewBox="0 0 200 150" width={ukuran} height={ukuran * 0.75} aria-hidden="true">
      <Bayang cx={100} cy={140} rx={78} />
      <motion.g style={{ transformOrigin: "142px 92px" }} animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }}>
        <path
          d="M142 66 l6 0 l2 8 l7 3 l7 -4 l4 4 l-4 7 l3 7 l8 2 l0 6 l-8 2 l-3 7 l4 7 l-4 4 l-7 -4 l-7 3 l-2 8 l-6 0 l-2 -8 l-7 -3 l-7 4 l-4 -4 l4 -7 l-3 -7 l-8 -2 l0 -6 l8 -2 l3 -7 l-4 -7 l4 -4 l7 4 l7 -3 Z"
          {...DASAR}
          strokeWidth={2.5}
        />
        <circle cx="145" cy="95" r="9" {...DASAR} strokeWidth={2.5} />
      </motion.g>
      <motion.g style={{ transformOrigin: "78px 82px" }} animate={{ y: [0, -3, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M78 28 L122 108 H34 Z" {...DASAR} fill="var(--wa-jingga-pucat, #fff0eb)" />
        <path d="M78 58 V82" {...LUPA} strokeWidth={4} />
        <motion.circle cx="78" cy="94" r="3" fill={GARIS} animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
      </motion.g>
      <motion.g style={{ transformOrigin: "50px 120px" }} animate={{ rotate: [0, -14, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M26 132 L62 98 M58 92 a10 10 0 1 0 12 12 l-6 -2 l-2 -6 Z" {...DASAR} strokeWidth={3} />
      </motion.g>
      <path d="M62 16 l-6 -8 M94 16 l6 -8 M78 12 v-8" {...LUPA} strokeWidth={2.5} />
      <Kilau x={178} y={44} s={0.8} tunda={0.5} />
    </svg>
  );
}

/** Dua tangan menampung hati bercahaya (sambutan laporan individu). */
export function IlustrasiSambutan({ ukuran = 200 }) {
  return (
    <svg viewBox="0 0 220 170" width={ukuran} height={ukuran * 0.77} aria-hidden="true">
      <motion.circle
        cx="110" cy="84" r="70" fill="var(--wa-ungu-pucat, #f3eefe)"
        animate={{ scale: [1, 1.04, 1] }}
        style={{ transformOrigin: "110px 84px" }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.g
        style={{ transformOrigin: "110px 70px" }}
        animate={{ scale: [1, 1.07, 1, 1.05, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" }}
      >
        <path d="M110 102 C82 84 66 70 66 52 C66 38 77 30 88 30 C98 30 106 36 110 44 C114 36 122 30 132 30 C143 30 154 38 154 52 C154 70 138 84 110 102 Z" {...DASAR} fill="var(--wa-ungu-lembut, #c6aff6)" />
        <path d="M140 42 q6 5 5 13" {...LUPA} stroke="#ffffff" strokeWidth={3} />
      </motion.g>
      <path d="M40 120 C58 100 80 104 98 116 C104 120 104 128 96 128 L72 126" {...DASAR} />
      <path d="M180 120 C162 100 140 104 122 116 C116 120 116 128 124 128 L148 126" {...DASAR} />
      <path d="M28 132 C50 128 70 136 96 136 C104 136 108 132 110 128 C112 132 116 136 124 136 C150 136 170 128 192 132" {...LUPA} />
      <Kilau x={52} y={40} tunda={0.2} />
      <Kilau x={170} y={34} s={1.1} tunda={0.9} />
      <Kilau x={186} y={86} s={0.7} tunda={1.6} />
      <Titik x={40} y={78} tunda={0.4} />
      <Titik x={160} y={66} r={3} tunda={1.2} />
      <motion.path d="M110 10 v10 M86 14 l4 8 M134 14 l-4 8" {...LUPA} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
    </svg>
  );
}

import { useId } from "react";
import { HEART, metaStatus } from "./heart";
import s from "./heart.module.css";

/**
 * Komponen kecil HEART yang dipakai semua layar prototipe:
 *   PilStatus   pil status (Baik, Perlu Perhatian, Waspada, Belum diskrining)
 *   HurufHeart  lima huruf H E A R T berwarna status, untuk daftar dan kartu anak
 *   PetaHati    hati lima keping seperti laporan contoh, bisa dipilih per aspek
 *   SkalaSkor   batang skor 0-10 dengan ambang aspek dan penanda skor anak
 */

const WARNA = {
  baik: { isi: "var(--sp-hijau-latar)", bulat: "var(--sp-hijau-batang)", teks: "var(--sp-hijau)" },
  perhatian: { isi: "var(--sp-kuning-latar)", bulat: "var(--sp-kuning)", teks: "var(--sp-kuning)" },
  waspada: { isi: "var(--sp-merah-latar)", bulat: "var(--sp-merah-teks)", teks: "var(--sp-merah)" },
  belum: { isi: "var(--sp-abu-3)", bulat: "var(--sp-tinta-pudar)", teks: "var(--sp-tinta-3)" },
};

function warna(status) {
  return WARNA[status] || WARNA.belum;
}

/** Pil status HEART. `kecil` memakai varian pill sm. */
export function PilStatus({ status, kecil = false, className = "" }) {
  const meta = metaStatus(status);
  return <span className={`pill ${kecil ? "sm " : ""}${meta.nada} ${className}`}>{meta.label}</span>;
}

/**
 * Lima huruf HEART berwarna status. `heart` = { idAspek: status } atau null (belum diskrining).
 * `ukuran`: "sm" (daftar padat) atau "md".
 */
export function HurufHeart({ heart, ukuran = "sm" }) {
  const label = heart
    ? HEART.map((a) => `${a.nama}: ${metaStatus(heart[a.id]).label}`).join(", ")
    : "Belum diskrining";
  return (
    <span className={`${s.huruf} ${ukuran === "md" ? s.hurufMd : ""}`} role="img" aria-label={label} title={label}>
      {HEART.map((a) => {
        const st = heart ? heart[a.id] : "belum";
        const w = warna(st);
        return (
          <span key={a.id} className={s.hurufSel} style={{ background: w.isi, color: w.teks }} aria-hidden="true">
            {a.kode}
          </span>
        );
      })}
    </span>
  );
}

// Geometri hati 200 x 180, dibagi lima keping: dua lengkung atas (H, E), dua tengah (A, R), ujung
// bawah (T). Celah 4 unit di antara keping memberi kesan puzzle seperti laporan contoh; celah, bukan
// garis yang ditimpa di atas, supaya label aspek tidak pernah terpotong. `ly` = garis dasar label.
const JALUR_HATI =
  "M100 172 C 58 140 8 108 8 60 C 8 28 32 8 60 8 C 78 8 92 18 100 32 C 108 18 122 8 140 8 C 168 8 192 28 192 60 C 192 108 142 140 100 172 Z";
const KEPING = {
  hiperaktivitas: { x: 0, y: 0, w: 98, h: 70, cx: 56, cy: 40, ly: 62 },
  emosional: { x: 102, y: 0, w: 98, h: 70, cx: 144, cy: 40, ly: 62 },
  agresi: { x: 0, y: 74, w: 98, h: 46, cx: 58, cy: 92, ly: 115 },
  relasi: { x: 102, y: 74, w: 98, h: 46, cx: 142, cy: 92, ly: 115 },
  tolong: { x: 0, y: 124, w: 200, h: 56, cx: 100, cy: 140, ly: 162 },
};
const LABEL_PENDEK = {
  hiperaktivitas: "Hiperaktivitas",
  emosional: "Emosional",
  agresi: "Agresi",
  relasi: "Relasi",
  tolong: "Tolong menolong",
};

/**
 * Hati lima keping berwarna status. `hasil` = { idAspek: status }. Bila `onPilih` diisi, tiap keping
 * jadi tombol (Enter/Spasi) dan `aktif` diberi cincin ungu. `berlabel` menampilkan nama aspek di
 * bawah hurufnya. `lebar` dalam px.
 */
export function PetaHati({ hasil, aktif, onPilih, berlabel = false, lebar = 220, label = "Peta HEART" }) {
  const id = useId().replace(/:/g, "");
  const potong = `hati-${id}`;
  const bisaPilih = typeof onPilih === "function";
  return (
    <svg
      viewBox="0 0 200 180"
      width={lebar}
      height={(lebar * 180) / 200}
      className={s.hati}
      role={bisaPilih ? "group" : "img"}
      aria-label={
        bisaPilih
          ? label
          : `${label}: ${HEART.map((a) => `${a.nama} ${metaStatus(hasil?.[a.id]).label}`).join(", ")}`
      }
    >
      <defs>
        <clipPath id={potong}>
          <path d={JALUR_HATI} />
        </clipPath>
      </defs>
      {HEART.map((a) => {
        const k = KEPING[a.id];
        const st = hasil?.[a.id] || "belum";
        const w = warna(st);
        const dipilih = aktif === a.id;
        const isi = (
          <>
            <rect x={k.x} y={k.y} width={k.w} height={k.h} clipPath={`url(#${potong})`} style={{ fill: w.isi }} />
            {dipilih && <circle cx={k.cx} cy={k.cy} r="16" className={s.cincin} />}
            <circle cx={k.cx} cy={k.cy} r="12.5" style={{ fill: w.bulat }} />
            <text x={k.cx} y={k.cy + 4.6} textAnchor="middle" className={s.kode}>
              {a.kode}
            </text>
            {berlabel && (
              <text x={k.cx} y={k.ly} textAnchor="middle" className={s.nama} style={{ fill: w.teks }}>
                {LABEL_PENDEK[a.id]}
              </text>
            )}
          </>
        );
        if (!bisaPilih) return <g key={a.id}>{isi}</g>;
        return (
          <g
            key={a.id}
            role="button"
            tabIndex={0}
            className={s.keping}
            aria-label={`${a.nama}: ${metaStatus(st).label}`}
            aria-pressed={aktif === undefined ? undefined : dipilih}
            onClick={() => onPilih(a.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPilih(a.id);
              }
            }}
          >
            {isi}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Batang skor 0-10 seperti laporan contoh: hijau sampai ambang Perlu Perhatian, kuning sampai
 * ambang Waspada, merah sesudahnya, dengan penanda skor anak.
 */
export function SkalaSkor({ aspek, skor }) {
  const { perhatian, waspada } = aspek.ambang;
  const posisi = Math.min(Math.max(skor, 0), 10) * 10;
  return (
    <div
      className={s.skala}
      role="img"
      aria-label={`Skor ${aspek.nama} ${skor} dari 10. Baik di bawah ${perhatian}, Perlu Perhatian ${perhatian} sampai di bawah ${waspada}, Waspada mulai ${waspada}.`}
    >
      <div className={s.batang} aria-hidden="true">
        <span style={{ width: `${perhatian * 10}%`, background: "var(--sp-hijau-batang)" }} />
        <span style={{ width: `${(waspada - perhatian) * 10}%`, background: "var(--sp-jingga)" }} />
        <span style={{ width: `${(10 - waspada) * 10}%`, background: "var(--sp-merah-teks)" }} />
      </div>
      <div className={s.angka} aria-hidden="true">
        <span style={{ left: "0%" }}>0</span>
        <span style={{ left: `${perhatian * 10}%` }}>{perhatian}</span>
        <span style={{ left: `${waspada * 10}%` }}>{waspada}</span>
        <span style={{ left: "100%" }}>10</span>
      </div>
      <div className={s.penanda} style={{ left: `${posisi}%` }} aria-hidden="true">
        <span>Skor {skor}</span>
      </div>
    </div>
  );
}

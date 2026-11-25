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
    : "Belum ikut screening";
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
// bawah (T). Keping dipisah celah 5 unit (bukan garis), dan di dalam hati hanya ada huruf aspek;
// nama aspek tampil di legenda HTML di bawah gambar, jadi teks tidak pernah keluar dari bentuk hati.
// `tx`, `ty` = titik tengah huruf, dipilih di bagian keping yang terlihat.
const JALUR_HATI =
  "M100 174 C 62 146 10 112 10 62 C 10 30 34 10 62 10 C 80 10 93 20 100 33 C 107 20 120 10 138 10 C 166 10 190 30 190 62 C 190 112 138 146 100 174 Z";
const KEPING = {
  hiperaktivitas: { x: 0, y: 0, w: 97.5, h: 69, tx: 56, ty: 44 },
  emosional: { x: 102.5, y: 0, w: 97.5, h: 69, tx: 144, ty: 44 },
  agresi: { x: 0, y: 74, w: 97.5, h: 46, tx: 62, ty: 98 },
  relasi: { x: 102.5, y: 74, w: 97.5, h: 46, tx: 138, ty: 98 },
  tolong: { x: 0, y: 125, w: 200, h: 55, tx: 100, ty: 144 },
};

/**
 * Hati lima keping berwarna status, gaya datar dan minimalis. `hasil` = { idAspek: status }. Bila
 * `onPilih` diisi, tiap keping jadi tombol (Enter/Spasi); keping `aktif` terisi warna pekat dengan
 * huruf putih (tanpa cincin garis). `berlabel` menambah legenda nama aspek (hurufnya berwarna status) di bawah
 * gambar. `lebar` dalam px. Keping muncul berurutan saat pertama tampil (dimatikan bila pengguna
 * memilih gerak dikurangi).
 */
export function PetaHati({ hasil, aktif, onPilih, berlabel = false, lebar = 220, label = "Peta HEART" }) {
  const id = useId().replace(/:/g, "");
  const potong = `hati-${id}`;
  const bisaPilih = typeof onPilih === "function";
  const gambar = (
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
      {HEART.map((a, i) => {
        const k = KEPING[a.id];
        const st = hasil?.[a.id] || "belum";
        const w = warna(st);
        const dipilih = aktif === a.id;
        const gaya = { "--isi": w.isi, "--kuat": w.bulat, "--teks": w.teks, "--urut": i };
        const isi = (
          <>
            <rect x={k.x} y={k.y} width={k.w} height={k.h} rx="3" clipPath={`url(#${potong})`} className={s.potong} />
            <text x={k.tx} y={k.ty + 7} textAnchor="middle" className={s.kode}>
              {a.kode}
            </text>
          </>
        );
        const kelasKeping = `${s.keping} ${dipilih ? s.aktif : ""}`;
        if (!bisaPilih) {
          return (
            <g key={a.id} className={kelasKeping} style={gaya}>
              {isi}
            </g>
          );
        }
        return (
          <g
            key={a.id}
            role="button"
            tabIndex={0}
            className={`${kelasKeping} ${s.bisaPilih}`}
            style={gaya}
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
  if (!berlabel) return gambar;
  return (
    <div className={s.petaBungkus} style={{ maxWidth: Math.max(lebar, 240) }}>
      {gambar}
      <ul className={s.legenda}>
        {HEART.map((a) => {
          const st = hasil?.[a.id] || "belum";
          const w = warna(st);
          return (
            <li key={a.id}>
              <span className={s.legendaHuruf} style={{ background: w.isi, color: w.teks }} aria-hidden="true">
                {a.kode}
              </span>
              <span className={s.legendaNama}>{a.nama}</span>
            </li>
          );
        })}
      </ul>
    </div>
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
      aria-label={`Skor ${aspek.nama} ${skor} dari 10. Aman di bawah ${perhatian}, Perlu Diperhatikan ${perhatian} sampai di bawah ${waspada}, Perlu Perhatian Lebih mulai ${waspada}.`}
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

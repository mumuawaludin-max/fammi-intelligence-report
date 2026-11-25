/**
 * Data halaman Hasil HEART (pemetaan): seluruh sekolah, per kelas, sampai satu anak. Tidak ada data
 * baru di sini; semuanya disusun ulang dari skriningData.js (kelas, anak Waspada dan Perlu
 * Perhatian) dan bersama/heart.js (kelas 2B lengkap, ringkasan sekolah), jadi angkanya selalu sama
 * dengan layar Skrining dan Ringkasan (diuji pemetaanData.test.js).
 *
 * Anak Baik hanya bernama di kelas 2B (kelas wali kelas di prototipe); di kelas lain mereka cukup
 * dihitung. Semua nama dan angka data contoh untuk demonstrasi.
 */
import { ANAK_2B, HEART, RINGKAS_SEKOLAH } from "../bersama/heart.js";
import {
  KELAS,
  KELAS_WALAS,
  PERHATIAN,
  TANDA_BAHAYA,
  WASPADA,
  WASPADA_BELUM,
  aspekMenonjol,
  bacaHeart,
} from "./skriningData.js";

export const SEMUA = "semua";

/** Satu anak dalam bentuk halaman ini: { nama, kelas, status, heart, kode, sumber }. */
function dariSkrining(a, status) {
  return { nama: a.nama, kelas: a.kelas, status, heart: bacaHeart(a.heart), kode: a.heart, data: a };
}

const DITANDAI = [
  ...WASPADA.map((a) => dariSkrining(a, "waspada")),
  ...PERHATIAN.map((a) => dariSkrining(a, "perhatian")),
];

/** Anak kelas 2B lengkap (termasuk Baik dan belum diskrining), dengan data skrining bila ada. */
const ANAK_KELAS_WALAS = ANAK_2B.map((a) => {
  const dariDaftar = DITANDAI.find((x) => x.nama === a.nama);
  if (dariDaftar) return dariDaftar;
  return { nama: a.nama, kelas: KELAS_WALAS, status: a.status, heart: a.heart, kode: null, data: null };
});

/** Anak yang bernama untuk satu cakupan: kelas 2B lengkap, kelas lain hanya yang ditandai. */
export function anakUntuk(kelas) {
  if (kelas === KELAS_WALAS) return ANAK_KELAS_WALAS;
  if (kelas === SEMUA) return [...DITANDAI];
  return DITANDAI.filter((a) => a.kelas === kelas);
}

const URUT = { waspada: 0, perhatian: 1, baik: 2, belum: 3 };
/** Urutan tampil: Waspada, Perlu Perhatian, Baik, belum diskrining; dalam status urut nama. */
export function urutkan(daftar) {
  return [...daftar].sort((p, q) => URUT[p.status] - URUT[q.status] || p.nama.localeCompare(q.nama, "id"));
}

/**
 * Ringkasan satu cakupan (SEMUA atau nama kelas): jumlah anak, sudah diskrining, per status, per
 * aspek ({ baik, perhatian, waspada }), dan kelas yang tercakup.
 */
export function ringkasan(kelas) {
  const daftarKelas = kelas === SEMUA ? KELAS : KELAS.filter((k) => k.kelas === kelas);
  const anak = daftarKelas.reduce((n, k) => n + k.anak, 0);
  const diskrining = daftarKelas.reduce((n, k) => n + k.walas, 0);
  const ditandai = DITANDAI.filter((a) => kelas === SEMUA || a.kelas === kelas);
  const waspada = ditandai.filter((a) => a.status === "waspada").length;
  const perhatian = ditandai.filter((a) => a.status === "perhatian").length;
  const perAspek = Object.fromEntries(
    HEART.map((asp) => {
      const st = ditandai.map((a) => a.heart[asp.id]);
      const w = st.filter((x) => x === "waspada").length;
      const p = st.filter((x) => x === "perhatian").length;
      return [asp.id, { waspada: w, perhatian: p, baik: diskrining - w - p }];
    }),
  );
  return {
    kelas,
    daftarKelas,
    anak,
    diskrining,
    belum: anak - diskrining,
    waspada,
    perhatian,
    baik: diskrining - waspada - perhatian,
    perAspek,
  };
}

/** Sebaran per kelas untuk grafik kolom: anak Waspada dan Perlu Perhatian tiap kelas. */
export const PER_KELAS = KELAS.map((k) => {
  const r = ringkasan(k.kelas);
  return { kelas: k.kelas, wali: k.wali, waspada: r.waspada, perhatian: r.perhatian, baik: r.baik, belum: r.belum };
});

function persen(n, dari) {
  return dari ? Math.round((n / dari) * 100) : 0;
}

/** Aspek urut dari yang paling banyak ditandai (Waspada dihitung lebih berat saat seri). */
export function aspekTeratas(r, n = 2) {
  return HEART.map((a) => ({ aspek: a, ...r.perAspek[a.id], ditandai: r.perAspek[a.id].waspada + r.perAspek[a.id].perhatian }))
    .filter((x) => x.ditandai > 0)
    .sort((p, q) => q.ditandai - p.ditandai || q.waspada - p.waspada)
    .slice(0, n);
}

/**
 * Tiga sampai empat kalimat temuan untuk satu cakupan, dibaca sebelum masuk ke rincian. `nada`:
 * ok, warn, bad, info (warna ikon kecil di depan kalimat). Kalimatnya disusun dari angka di atas.
 */
export function temuan(r) {
  const daftar = [];
  const cakupan = r.kelas === SEMUA ? "sekolah" : `kelas ${r.kelas}`;
  daftar.push({
    nada: "ok",
    teks: `${persen(r.baik, r.diskrining)}% anak di ${cakupan} terindikasi Aman di semua aspek (${r.baik} dari ${r.diskrining} yang sudah ikut screening).`,
  });
  const atas = aspekTeratas(r);
  if (atas.length) {
    daftar.push({
      nada: "warn",
      teks: `Paling banyak terindikasi perlu diperhatikan: ${atas.map((x) => `${x.aspek.nama} (${x.ditandai} anak)`).join(" dan ")}.`,
    });
  }
  if (r.kelas === SEMUA) {
    const kelasTerbanyak = [...PER_KELAS].sort((p, q) => q.waspada - p.waspada || q.perhatian - p.perhatian)[0];
    daftar.push({
      nada: "bad",
      teks: `${r.waspada} anak terindikasi Perlu Perhatian Lebih; terbanyak di kelas ${kelasTerbanyak.kelas} (${kelasTerbanyak.waspada} anak). ${WASPADA_BELUM.length} di antaranya belum punya tindak lanjut.`,
    });
  } else if (r.waspada) {
    const nama = anakUntuk(r.kelas)
      .filter((a) => a.status === "waspada")
      .map((a) => a.nama.split(" ")[0]);
    const belum = WASPADA_BELUM.filter((a) => a.kelas === r.kelas).length;
    daftar.push({
      nada: "bad",
      teks: `${r.waspada} anak terindikasi Perlu Perhatian Lebih: ${nama.join(", ")}.${belum ? ` ${belum} belum punya tindak lanjut.` : " Semua sudah punya tindak lanjut."}`,
    });
  } else {
    daftar.push({ nada: "ok", teks: "Tidak ada anak yang terindikasi Perlu Perhatian Lebih di kelas ini." });
  }
  if (r.belum) {
    daftar.push({ nada: "info", teks: `${r.belum} anak belum ikut screening; hasilnya menyusul setelah formulir wali kelas masuk.` });
  }
  return daftar;
}

/** Hal yang sedang dilakukan untuk satu anak, satu kalimat. Null untuk anak Baik. */
export function tindakAnak(a) {
  const d = a.data;
  if (!d) return null;
  if (a.status === "perhatian") return `Diamati wali kelas, minggu ke-${d.minggu} dari 4.`;
  const t = d.tindak;
  if (t.jenis === "belum") return "Belum punya tindak lanjut. Guru BK menyusunnya.";
  if (t.jenis === "laporan") return `Tindak lanjut berjalan, juga ditangani sebagai kasus ${t.kasus}.`;
  if (t.jenis === "berjalan") return `Tindak lanjut berjalan, dievaluasi ${t.evaluasi}.`;
  return `Ditangani sebagai kasus ${t.kasus} (${t.tingkat}) oleh ${t.oleh}.`;
}

/** Aspek yang menonjol untuk satu anak: [{ aspek, status }], Waspada lebih dulu. */
export function aspekAnak(a) {
  return a.kode ? aspekMenonjol(a.kode) : [];
}

/** Tanda bahaya (jawaban keamanan) milik anak ini, bila ada. */
export function tandaBahaya(nama) {
  return TANDA_BAHAYA.find((t) => t.nama === nama) || null;
}

/** Ringkasan sekolah harus sama dengan bersama/heart.js; dipakai uji. */
export const RINGKAS_SEKOLAH_BERSAMA = RINGKAS_SEKOLAH;

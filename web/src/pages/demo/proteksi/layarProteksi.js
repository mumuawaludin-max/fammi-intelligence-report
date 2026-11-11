/**
 * Registri layar dan peran prototipe Sekolah Proteksi (demo modul Safety & Crisis Management).
 * Berkas JS biasa tanpa JSX supaya bisa diuji di node (demoAturan.test.js memeriksa bahwa `layar`
 * di registri demo selalu id yang ada di sini).
 *
 * Seluruh nama, kelas, dan angka di prototipe ini data contoh untuk demonstrasi.
 */

/** Orang yang tampil di tombol peran header, satu per sudut pandang. */
export const ORANG = {
  kepsek: { inisial: "HW", nama: "Bu Hartini", peran: "Kepala Sekolah" },
  bk: { inisial: "LA", nama: "Bu Laras", peran: "Koordinator BK" },
  walas: { inisial: "RK", nama: "Bu Rina", peran: "Wali kelas 2B" },
  ortu: { inisial: "DL", nama: "Ibu Dewi", peran: "Orang tua" },
};

/**
 * Menu kiri atas. `peran` = sudut pandang yang otomatis dipakai saat layar dibuka (desain: tiap
 * layar punya orangnya sendiri). Peta alur tidak mengubah sudut pandang.
 */
export const LAYAR = [
  { id: "ringkasan", grup: "Sekolah Proteksi", label: "Ringkasan", ikon: "dasbor", peran: "kepsek" },
  { id: "skrining", grup: "Sekolah Proteksi", label: "Skrining & pemetaan", ikon: "skrining", peran: "bk" },
  { id: "kelas", grup: "Sekolah Proteksi", label: "Ruang wali kelas", ikon: "kelompok", peran: "walas" },
  { id: "anak", grup: "Sekolah Proteksi", label: "Profil anak", ikon: "orang", peran: "walas" },
  { id: "kasus", grup: "Sekolah Proteksi", label: "Kasus & SLA", ikon: "tiket", peran: "bk", hitung: 8 },
  { id: "orangtua", grup: "Aplikasi keluarga", label: "Orang tua & anak", ikon: "ponsel", peran: "ortu" },
  { id: "alur", grup: "Panduan", label: "Peta alur & SLA", ikon: "peta", peran: null },
];

/** Pilihan "Lihat sebagai" di kanan atas: tiap peran membuka layar utamanya. */
export const PERAN = [
  { id: "kepsek", label: "Kepala Sekolah", sub: "Ringkasan", layar: "ringkasan" },
  { id: "bk", label: "Koordinator BK", sub: "Kasus & SLA", layar: "kasus" },
  { id: "walas", label: "Wali kelas 2B", sub: "Ruang kelas", layar: "kelas" },
  { id: "ortu", label: "Orang tua", sub: "Aplikasi ponsel", layar: "orangtua" },
];

export const LAYAR_IDS = LAYAR.map((l) => l.id);
export const LAYAR_AWAL = "ringkasan";

const LAYAR_MENURUT_ID = new Map(LAYAR.map((l) => [l.id, l]));

/** Layar untuk id ini, atau null kalau tidak dikenal. */
export function cariLayar(id) {
  return typeof id === "string" && LAYAR_MENURUT_ID.has(id) ? LAYAR_MENURUT_ID.get(id) : null;
}

/** Id layar yang sah, atau layar awal untuk masukan lain. */
export function layarSah(id) {
  return cariLayar(id) ? id : LAYAR_AWAL;
}

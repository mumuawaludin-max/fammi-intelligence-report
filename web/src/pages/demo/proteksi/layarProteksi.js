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
 * Layar prototipe. `peran` = sudut pandang yang otomatis dipakai saat layar dibuka (tiap layar punya
 * orangnya sendiri; Panduan tidak mengubah sudut pandang). `tab` = tab header yang menyala, `alur` =
 * alur yang dijalani layar itu (bilah alur, lihat bersama/alur.js), `grup` = kelompoknya.
 */
export const LAYAR = [
  { id: "ringkasan", grup: "Ringkasan", tab: "ringkasan", alur: null, label: "Ringkasan", ikon: "dasbor", peran: "kepsek" },
  { id: "skrining", grup: "Alur pencegahan", tab: "cegah", alur: "cegah", label: "Skrining HEART", ikon: "skrining", peran: "bk" },
  { id: "anak", grup: "Alur pencegahan", tab: "cegah", alur: "cegah", label: "Laporan anak", ikon: "orang", peran: "walas" },
  { id: "kelas", grup: "Alur pencegahan", tab: "cegah", alur: "cegah", label: "Ruang wali kelas", ikon: "kelompok", peran: "walas" },
  { id: "kasus", grup: "Alur kejadian", tab: "kejadian", alur: "kejadian", label: "Kasus & penugasan", ikon: "tiket", peran: "bk", hitung: 8 },
  { id: "orangtua", grup: "Aplikasi keluarga", tab: "orangtua", alur: null, label: "Aplikasi orang tua", ikon: "ponsel", peran: "ortu" },
  { id: "alur", grup: "Panduan", tab: "panduan", alur: null, label: "Panduan alur & SLA", ikon: "peta", peran: null },
];

/**
 * Tab header, selalu terlihat. Pencegahan membuka langkah pertama alurnya (Skrining HEART); langkah
 * berikutnya ada di bilah alur. `hitung` menampilkan jumlah kasus aktif.
 */
export const TAB = [
  { id: "ringkasan", label: "Ringkasan", layar: "ringkasan" },
  { id: "cegah", label: "Pencegahan", layar: "skrining" },
  { id: "kejadian", label: "Kejadian", layar: "kasus", hitung: true },
  { id: "orangtua", label: "Orang tua", layar: "orangtua" },
  { id: "panduan", label: "Panduan", layar: "alur" },
];

/** Pilihan "Lihat sebagai" di kanan atas: tiap peran membuka layar utamanya. */
export const PERAN = [
  { id: "kepsek", label: "Kepala Sekolah", sub: "Ringkasan", layar: "ringkasan" },
  { id: "bk", label: "Koordinator BK", sub: "Kasus & penugasan", layar: "kasus" },
  { id: "walas", label: "Wali kelas 2B", sub: "Kelas & checklist", layar: "kelas" },
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

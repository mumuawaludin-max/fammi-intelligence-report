/**
 * Tautan WhatsApp untuk tombol "Hubungi orang tua" di prototipe Sekolah Proteksi. Memakai wa.me
 * tanpa nomor (instruksi pemilik produk 2026-11-25): WhatsApp terbuka dengan kalimat pembuka yang
 * sudah terisi, wali kelas memilih kontaknya sendiri lalu melanjutkan pesannya. Arahnya hanya dari
 * sekolah ke keluarga: orang tua dan remaja TIDAK punya tombol untuk menghubungi wali kelas atau
 * Guru BK; semua dari mereka lewat formulir (Lapor Aman, Cerita). Tidak ada nomor telepon, nomor
 * layanan, atau panggilan di prototipe ini.
 */

/** URL wa.me dengan teks terisi, tanpa nomor tujuan. */
export function tautanWa(teks) {
  return `https://wa.me/?text=${encodeURIComponent(teks)}`;
}

/** Kalimat pembuka pesan. Diakhiri spasi supaya pengguna langsung melanjutkan mengetik. */
export const PESAN_WA = {
  /** Wali kelas ke orang tua, dari laporan anak. */
  walasKeOrtu:
    "Halo Ibu Dewi, saya Bu Rina, wali kelas 2B. Saya ingin ngobrol sebentar tentang Raka, terutama hasil screening HEART-nya dan dukungan yang sedang kami jalankan di sekolah. ",
};

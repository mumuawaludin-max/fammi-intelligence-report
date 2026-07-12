/**
 * Ambang batas yang MASIH SEMENTARA, menunggu keputusan pemilik produk. Jangan menebak nilai
 * baru di berkas ini tanpa konfirmasi -- lihat "Parameter yang masih terbuka" di CLAUDE.md
 * (cutoff skor MI ke status, skala maksimum MI, pemetaan ordinal Karakter ke persen).
 *
 * Dipusatkan di satu berkas supaya begitu pemilik produk menetapkan nilai final, cukup diganti
 * di satu tempat -- sebelumnya angka yang sama (80, 80/60, 75/50) tersebar hardcode di
 * beberapa berkas terpisah tanpa saling terhubung.
 */

// Cutoff skor MI (Multiple Intelligence, asumsi skala 0-100) ke label level Kuat/Sedang/
// Berkembang. Dipakai sebagai fallback kalau predikat final dari pipeline hulu tidak tersedia.
export const MI_LEVEL_CUTOFF = { kuat: 75, sedang: 50 };

// Cutoff pencapaian karakter (skala 0-100) ke status baik / perlu_perhatian.
export const KARAKTER_PENCAPAIAN_BAIK = 80;

// Cutoff skor bar 3 tingkat (aman / perhatian / waspada), dipakai untuk skor aspek karakter.
// Murid/indikator dengan skor di bawah KARAKTER_BAR_TONE_CUTOFF.aman juga yang dianggap
// "perlu penguatan" (masuk daftar lemah) di KepsekView/WaliKelasView/YayasanView -- ambang
// yang sama, bukan kebetulan, karena maknanya memang "belum di zona aman".
export const KARAKTER_BAR_TONE_CUTOFF = { aman: 80, perhatian: 60 };

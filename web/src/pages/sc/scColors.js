/**
 * Peta warna per kategori kualitatif 5-tingkat (dipakai bagian_kesejahteraan dan
 * bagian_profil_organisasi), dipakai lintas komponen SC. Sengaja pakai token --cw-nilai-* yang
 * sama dengan modul CW (tokens.css) -- token warna infrastruktur bersama, bukan konten spesifik
 * korporat, jadi tidak perlu duplikasi token baru untuk SC (CLAUDE.md: jangan menambah warna di
 * luar token).
 */
export const KATEGORI_NILAI_COLOR = {
  "Sangat Rendah": "var(--cw-nilai-sangat-rendah)",
  "Rendah": "var(--cw-nilai-rendah)",
  "Sedang": "var(--cw-nilai-sedang)",
  "Tinggi": "var(--cw-nilai-tinggi)",
  "Sangat Tinggi": "var(--cw-nilai-sangat-tinggi)",
};

/**
 * Peta warna per kategori kualitatif 5-tingkat (dipakai bagian_kesejahteraan.kategori dan
 * bagian_kesejahteraan.chart_data[].kategori), dipakai lintas komponen CW supaya tidak
 * didefinisikan ulang di tiap file. Nilai token ada di tokens.css (--cw-nilai-*), lihat catatan
 * "masih proposal" di sana.
 */
export const KATEGORI_KESEJAHTERAAN_COLOR = {
  "Sangat Rendah": "var(--cw-nilai-sangat-rendah)",
  "Rendah": "var(--cw-nilai-rendah)",
  "Sedang": "var(--cw-nilai-sedang)",
  "Tinggi": "var(--cw-nilai-tinggi)",
  "Sangat Tinggi": "var(--cw-nilai-sangat-tinggi)",
};

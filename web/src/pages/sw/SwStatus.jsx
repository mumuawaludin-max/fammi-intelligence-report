// Keadaan peran tidak berhak, memuat, galat, dan kosong untuk titik masuk produksi.

import { KeadaanLayar } from "./SwUi";
import tokens from "./swTokens.module.css";
import styles from "./SwLaporan.module.css";

export function SwStatus({ peran, loading, error, dataset, children }) {
  let isi = children;
  if (!peran) isi = <KeadaanLayar jenis="kosong" judul="Modul ini tidak tersedia untuk peran Anda" pesan="Modul ini untuk yayasan, Human Capital, kepala unit, dan pegawai." />;
  else if (loading) isi = <KeadaanLayar jenis="memuat" judul="Memuat Screening Awal Wellbeing" />;
  else if (error) isi = <KeadaanLayar jenis="galat" judul="Data gagal dimuat" pesan={error} />;
  else if (!dataset) isi = <KeadaanLayar jenis="kosong" judul="Belum ada hasil Screening Awal Wellbeing" pesan="Hasil screening lembaga ini belum diunggah." />;
  if (isi === children) return children;
  return <div className={`${tokens.scope} ${styles.halaman}`}>{isi}</div>;
}

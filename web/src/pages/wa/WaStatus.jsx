// Keadaan peran tidak berhak, memuat, galat, dan kosong untuk titik masuk produksi modul
// Wellbeing Assessment. Isi aslinya (children) baru dirender jika datanya siap.

import { MotionConfig } from "motion/react";
import { HourglassMedium, Info, WarningCircle } from "@phosphor-icons/react";
import { KeadaanKosong } from "./WaUi";
import swTokens from "../sw/swTokens.module.css";
import tokens from "./waTokens.module.css";
import styles from "./WaStatus.module.css";

export function WaStatus({ peran, loading, error, dataset, kosong, children }) {
  let isi = null;
  if (!peran) isi = <KeadaanKosong ikon={Info} judul="Modul ini tidak tersedia untuk peran Anda" pesan="Wellbeing Assessment dibaca oleh Human Capital dan oleh tiap pegawai untuk dirinya sendiri." />;
  else if (loading) isi = <KeadaanKosong ikon={HourglassMedium} judul="Memuat Wellbeing Assessment" />;
  else if (error) isi = <KeadaanKosong ikon={WarningCircle} judul="Data gagal dimuat" pesan={error} />;
  else if (!dataset || kosong) isi = <KeadaanKosong ikon={Info} judul="Belum ada hasil Wellbeing Assessment" pesan="Hasil asesmen lembaga ini belum diunggah, atau belum terbuka untuk akun Anda." />;
  if (!isi) return children;
  return (
    <MotionConfig reducedMotion="user">
      <div className={`${swTokens.scope} ${tokens.scope} ${styles.halaman}`}>
        <div className={styles.kartu}>{isi}</div>
      </div>
    </MotionConfig>
  );
}

import { useMemo, useState } from "react";
import { PaFilterBar } from "./PaFilterBar";
import { PaSectionSelector } from "./PaSectionSelector";
import { PaInfoBanner } from "./PaInfoBanner";
import { PaFooterNote } from "./PaFooterNote";
import { PaStatistikSiswa } from "./PaStatistikSiswa";
import { PaHasilAsesmen } from "./PaHasilAsesmen";
import { PaPerluPerhatian } from "./PaPerluPerhatian";
import { PaSurvey } from "./PaSurvey";
import { PA_PERIODE_OPTIONS, PA_UNIT_OPTIONS, paLaporanContoh } from "./pa.mock";
import styles from "./PaLaporanPage.module.css";

const SECTIONS = [
  { key: "statistik", number: "01", initial: "S", label: "Statistik Siswa", desc: "Cakupan, profil, dan distribusi responden" },
  { key: "asesmen", number: "02", initial: "A", label: "Hasil Asesmen", desc: "Lima domain perilaku dan emosi" },
  { key: "perhatian", number: "03", initial: "P", label: "Perlu Perhatian", desc: "Prioritas kasus dan status tindak lanjut" },
  { key: "survey", number: "04", initial: "V", label: "Survey", desc: "Kebiasaan, dukungan, dan suara siswa" },
];

/**
 * PaLaporanPage -- dashboard Laporan Lembaga modul Perilaku Anak.
 *
 * Susunannya: baris filter global (periode + unit sekolah) yang menempel di atas, empat kartu
 * pemilih bagian, satu pengingat tetap bahwa asesmen ini alat skrining, isi bagian yang sedang
 * dipilih, lalu tiga catatan penutup. Banner dan catatan penutup sengaja di level halaman,
 * bukan di dalam satu bagian, karena keduanya berlaku untuk seluruh angka di laporan ini.
 *
 * Sumber datanya masih pa.mock.js. Ketika pipeline hulunya siap, satu-satunya yang berubah di
 * berkas ini adalah asal `laporan` -- bentuk objeknya sudah dipakai apa adanya tanpa
 * perhitungan tambahan di sisi tampilan.
 */
export default function PaLaporanPage() {
  const [periode, setPeriode] = useState(PA_PERIODE_OPTIONS[0].id);
  const [unit, setUnit] = useState("semua");
  const [sectionAktif, setSectionAktif] = useState("statistik");

  const laporan = useMemo(() => paLaporanContoh(unit), [unit]);
  const unitLabel = laporan.meta.unit_label;

  return (
    <div className={styles.page}>
      <PaFilterBar
        periodeOptions={PA_PERIODE_OPTIONS}
        periode={periode}
        onPeriodeChange={setPeriode}
        unitOptions={PA_UNIT_OPTIONS}
        unit={unit}
        onUnitChange={setUnit}
        unitLabel={unitLabel}
        diperbarui={laporan.meta.diperbarui}
      />

      <PaSectionSelector sections={SECTIONS} active={sectionAktif} onSelect={setSectionAktif} />

      <PaInfoBanner />

      {sectionAktif === "statistik" && (
        <PaStatistikSiswa data={laporan.statistik} unitLabel={unitLabel} />
      )}

      {sectionAktif === "asesmen" && (
        <PaHasilAsesmen data={laporan.asesmen} unitLabel={unitLabel} unitScope={unit} />
      )}

      {sectionAktif === "perhatian" && (
        <PaPerluPerhatian data={laporan.perhatian} unitLabel={unitLabel} />
      )}

      {sectionAktif === "survey" && (
        <PaSurvey data={laporan.survey} esai={laporan.esai} unitLabel={unitLabel} />
      )}

      <PaFooterNote />
    </div>
  );
}

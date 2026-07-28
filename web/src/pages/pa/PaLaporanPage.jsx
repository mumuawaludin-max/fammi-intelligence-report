import { useMemo, useState } from "react";
import { PaFilterBar } from "./PaFilterBar";
import { PaSectionSelector } from "./PaSectionSelector";
import { PaInfoBanner } from "./PaInfoBanner";
import { PaFooterNote } from "./PaFooterNote";
import { PaStatistikSiswa } from "./PaStatistikSiswa";
import { PaHasilAsesmen } from "./PaHasilAsesmen";
import { PaPerluPerhatian } from "./PaPerluPerhatian";
import { PaSurvey } from "./PaSurvey";
import { usePaData } from "./usePaData";
import { rakitLaporanPa, formatPeriodeBulanTahun } from "./paAssembler";
import tokens from "./paTokens.module.css";
import styles from "./PaLaporanPage.module.css";

const SECTIONS = [
  { key: "statistik", number: "01", initial: "S", label: "Statistik Siswa", desc: "Cakupan, profil, dan distribusi responden" },
  { key: "asesmen", number: "02", initial: "A", label: "Hasil Asesmen", desc: "Lima domain perilaku dan emosi" },
  { key: "perhatian", number: "03", initial: "P", label: "Perlu Perhatian", desc: "Prioritas kasus dan status tindak lanjut" },
  { key: "survey", number: "04", initial: "V", label: "Survey", desc: "Kebiasaan, dukungan, dan suara siswa" },
];

function StateBox({ icon, title, msg }) {
  return (
    <div className={`${tokens.scope} ${styles.stateBox}`}>
      <span className={styles.stateIcon}>{icon}</span>
      <p className={styles.stateTitle}>{title}</p>
      {msg && <p className={styles.stateMsg}>{msg}</p>}
    </div>
  );
}

/**
 * PaLaporanPage -- dashboard Laporan Lembaga modul Perilaku Anak, data ASLI dari Supabase lewat
 * usePaData.js + rakitLaporanPa (paAssembler.js), bukan lagi pa.mock.js -- pratinjau lepas-login
 * yang masih memakai data contoh ada di PaLaporanPageMock.jsx (dirender PaAgregatPreview.jsx),
 * pola yang sama dengan sc/ScAgregatPreview.jsx vs sc/ScLaporanAgregatPage.jsx.
 *
 * usePaData mengambil SELURUH baris sekolah ini sekali (semua periode), lalu `unit` dan `periode`
 * cuma memilih ulang dari data yang sudah di memori lewat rakitLaporanPa -- tidak ada fetch ulang
 * saat pembaca mengganti filter, sama seperti pola SC.
 *
 * Kalau sekolah ini belum punya baris pa_lembaga sama sekali untuk periode manapun, tampilkan
 * status kosong yang jelas (BUKAN jatuh balik ke pa.mock.js) -- sesuai aturan CLAUDE.md soal
 * tidak menampilkan angka contoh seolah temuan nyata, dan pola yang sama dipakai ScPage.jsx.
 */
export default function PaLaporanPage({ session }) {
  const [periode, setPeriode] = useState(null);
  const [unit, setUnit] = useState("semua");
  const [sectionAktif, setSectionAktif] = useState("statistik");

  const { loading, error, raw } = usePaData(session, periode);
  const laporan = useMemo(() => rakitLaporanPa(raw, unit), [raw, unit]);

  if (loading) {
    return <StateBox icon="⏳" title="Memuat dashboard…" />;
  }
  if (error) {
    return <StateBox icon="⚠️" title="Gagal memuat dashboard" msg={error} />;
  }
  if (!laporan) {
    return (
      <StateBox
        icon="📋"
        title="Belum ada data Perilaku Anak"
        msg="Import data lewat Upload Data (modul Perilaku Anak) di Admin CMS, lalu periode ini akan tampil di sini."
      />
    );
  }

  const periodeOptions = raw.availablePeriods.map((id) => ({ id, label: formatPeriodeBulanTahun(id) }));
  const unitOptions = [
    { id: "semua", label: "Semua unit sekolah" },
    ...raw.lembagaAtPeriode.filter((r) => r.unit !== null).map((r) => ({ id: r.unit, label: r.unit })),
  ];
  const unitLabel = laporan.meta.unit_label;
  // Scope "semua" pakai nama lembaga sungguhan (session.school_name, dari overview.schoolName
  // di App.jsx) -- unitLabel di scope itu cuma placeholder generik "Semua unit sekolah", bukan
  // nama sekolah. Begitu difilter ke satu unit, ikuti unit itu (sesuai filter yang aktif).
  const namaUntukIntro = unit === "semua" ? (session?.school_name || unitLabel) : unitLabel;

  return (
    <div className={styles.page}>
      <p className={`${tokens.scope} ${styles.introText}`}>
        Hasil screening deteksi dini masalah perilaku dan mental anak {namaUntukIntro}.
      </p>

      <PaFilterBar
        periodeOptions={periodeOptions}
        periode={laporan.meta.periode_id}
        onPeriodeChange={setPeriode}
        unitOptions={unitOptions}
        unit={unit}
        onUnitChange={setUnit}
        unitLabel={unitLabel}
        diperbarui={laporan.meta.diperbarui}
        contoh={false}
      />

      <PaSectionSelector sections={SECTIONS} active={sectionAktif} onSelect={setSectionAktif} />

      <PaInfoBanner />

      {sectionAktif === "statistik" && (
        <PaStatistikSiswa data={laporan.statistik} esai={laporan.esai} unitLabel={unitLabel} />
      )}

      {sectionAktif === "asesmen" && (
        <PaHasilAsesmen data={laporan.asesmen} unitLabel={unitLabel} unitScope={unit} />
      )}

      {sectionAktif === "perhatian" && (
        <PaPerluPerhatian data={laporan.perhatian} unitLabel={unitLabel} />
      )}

      {sectionAktif === "survey" && (
        <PaSurvey data={laporan.survey} unitLabel={unitLabel} />
      )}

      <PaFooterNote />
    </div>
  );
}

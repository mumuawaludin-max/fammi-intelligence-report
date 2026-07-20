import { useState } from "react";
import SampleTag from "../../components/SampleTag";
import CwLaporanAgregatPage from "./CwLaporanAgregatPage";
import CwLaporanIndividuPage from "./CwLaporanIndividuPage";
import CwRespondenListPage from "./CwRespondenListPage";
import { MOCK_LAPORAN_AGREGAT_CW, MOCK_LAPORAN_INDIVIDU_CW } from "./cw.mock";
import styles from "./CwPage.module.css";

/** Sub-tab khusus pimpinan, padanan item sidebar di wireframe (Dashboard / Laporan Individu). */
const PIMPINAN_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "individu", label: "Laporan Individu" },
];

/**
 * Peran yang melihat CW sebagai laporan LEMBAGA (agregat + daftar responden), bukan laporan
 * pribadi. Manajemen adalah peran utama modul ini; Kepsek/Wakil ikut karena cakupannya sama-sama
 * sekolah-wide, AdminFammi karena selalu bisa melihat semua modul (pola sama dengan KarakterPage).
 */
function isPimpinanCw(peran) {
  return peran === "Manajemen" || peran === "KepalaSekolah"
    || peran === "WakilKepalaSekolah" || peran === "AdminFammi";
}

/**
 * CwPage -- pintu masuk modul Corporate Culture & Wellbeing Development.
 * Pola sama dengan KarakterPage: satu switch tipis di sini, semua logic tampilan ada di
 * komponen per-tampilan (CwLaporanAgregatPage / CwLaporanIndividuPage / CwRespondenListPage).
 *
 * Data masih dummy (cw.mock.ts) karena tabel Supabase untuk CW belum ada -- lihat
 * docs/cw-module-design-spec.md bagian 6 untuk proposal skema. SampleTag wajib tetap dipasang
 * selama angkanya masih contoh (CLAUDE.md: jangan menampilkan angka contoh seolah temuan nyata).
 */
export default function CwPage({ session }) {
  const [tab, setTab] = useState("dashboard");

  if (!isPimpinanCw(session?.peran)) {
    // Guru/karyawan: laporan pribadinya sendiri. Peran mana persisnya yang mengisi CW belum
    // final (lihat cw-module-design-spec.md bagian 8 item 1) -- untuk sementara semua peran
    // non-pimpinan yang punya modul cw aktif jatuh ke sini.
    return (
      <div className={styles.page}>
        <div className={styles.heroLabel}>
          <span className={styles.heroPill}>Culture &amp; Wellbeing</span>
          <SampleTag />
        </div>
        <CwLaporanIndividuPage laporan={MOCK_LAPORAN_INDIVIDU_CW[0]} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.heroLabel}>
        <span className={styles.heroPill}>Culture &amp; Wellbeing</span>
        <SampleTag />
      </div>

      <div className={styles.subTabs}>
        {PIMPINAN_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.subTab} ${tab === t.id ? styles.subTabActive : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard"
        ? <CwLaporanAgregatPage laporan={MOCK_LAPORAN_AGREGAT_CW} />
        : <CwRespondenListPage respondenList={MOCK_LAPORAN_INDIVIDU_CW} />}
    </div>
  );
}

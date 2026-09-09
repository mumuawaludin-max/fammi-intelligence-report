import CwLaporanAgregatPage from "./CwLaporanAgregatPage";
import CwLaporanIndividuPage from "./CwLaporanIndividuPage";
import CwRespondenListPage from "./CwRespondenListPage";
import { useCwAgregat, useCwIndividu, useCwRespondenList } from "./useCwData";
import styles from "./CwPage.module.css";

/**
 * Peran yang melihat CW sebagai laporan ORGANISASI (agregat + daftar responden), bukan laporan
 * pribadi. Di korporat cuma ada SATU level pimpinan, yaitu Manajemen; itu padanan Yayasan di
 * konteks sekolah (keputusan pemilik produk 2026-09-09). KepalaSekolah/WakilKepalaSekolah
 * SENGAJA tidak ada di sini, itu sisa dari waktu modul ini masih meniru gerbang peran SC.
 * AdminFammi ikut karena peran internal Fammi selalu bisa melihat semua modul (pola sama dengan
 * KarakterPage), bukan karena dia bagian dari struktur perusahaan klien.
 */
function isPimpinanCw(peran) {
  return peran === "Manajemen" || peran === "AdminFammi";
}

function StateBox({ icon, title, msg }) {
  return (
    <div className={styles.stateBox}>
      <span className={styles.stateIcon}>{icon}</span>
      <p className={styles.stateTitle}>{title}</p>
      {msg && <p className={styles.stateMsg}>{msg}</p>}
    </div>
  );
}

/**
 * CwPage -- pintu masuk modul Corporate Culture & Wellbeing Development.
 * Pola sama dengan ScPage/KarakterPage: satu switch tipis di sini, semua logic tampilan ada di
 * komponen per-tampilan (CwLaporanAgregatPage / CwLaporanIndividuPage / CwRespondenListPage).
 *
 * Sub-tab Dashboard/Laporan Individu BUKAN state internal di sini, sama seperti ScPage: dia
 * diangkat ke App.jsx (prop `tab`, diklik lewat NavBar yang dirender App.jsx sendiri) supaya
 * bisa dirender menyatu di baris Header, sejajar dengan nav modul.
 *
 * Data ASLI dari Supabase lewat useCwData.js (bukan lagi cw.mock.ts). Tabelnya sc_personal/
 * sc_lembaga/sc_hasil yang sama dengan School Culture, lihat catatan lengkapnya di useCwData.js.
 * Kalau belum ada data yang disetujui untuk organisasi ini, tampilkan status kosong yang jelas,
 * BUKAN jatuh balik ke data contoh (CLAUDE.md: jangan menampilkan angka contoh seolah temuan
 * nyata). Data contoh sekarang cuma dipakai halaman preview QA (?preview=cw-agregat dan
 * kawan-kawannya), yang memang menampilkan penanda "Contoh" sendiri.
 */
export default function CwPage({ session, tab = "dashboard" }) {
  const pimpinan = isPimpinanCw(session?.peran);

  const agregat = useCwAgregat(session, null);
  const individu = useCwIndividu(session);
  const respondenList = useCwRespondenList(session, agregat.data?.meta?.periode_id || null);

  if (!pimpinan) {
    // Fallback defensif, dalam praktiknya jalur ini seharusnya tidak pernah tercapai.
    // Karyawan (peran individu utama modul ini) sudah dialihkan App.jsx ke CwKaryawanPage
    // (shell mobile mandiri, di luar Header/NavBar desktop) SEBELUM CwPage ini pernah dirender.
    return (
      <div className={styles.page}>
        <div className={styles.pageInnerNarrow}>
          {individu.loading ? (
            <StateBox icon="⏳" title="Memuat laporan…" />
          ) : individu.error ? (
            <StateBox icon="⚠️" title="Gagal memuat laporan" msg={individu.error} />
          ) : individu.data ? (
            <CwLaporanIndividuPage laporan={individu.data} />
          ) : (
            <StateBox icon="🕊️" title="Belum ada laporan" msg="Laporan Culture & Wellbeing Anda belum tersedia atau belum disetujui untuk periode ini." />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageInner}>
        {tab === "dashboard" ? (
          agregat.loading ? (
            <StateBox icon="⏳" title="Memuat dashboard…" />
          ) : agregat.error ? (
            <StateBox icon="⚠️" title="Gagal memuat dashboard" msg={agregat.error} />
          ) : agregat.data ? (
            <CwLaporanAgregatPage laporan={agregat.data} />
          ) : (
            <StateBox
              icon="📊"
              title="Belum ada data Culture & Wellbeing"
              msg="Import data lewat Upload Data (modul Culture), lalu setujui laporannya di Antrian Persetujuan."
            />
          )
        ) : (
          respondenList.loading ? (
            <StateBox icon="⏳" title="Memuat daftar responden…" />
          ) : respondenList.error ? (
            <StateBox icon="⚠️" title="Gagal memuat daftar responden" msg={respondenList.error} />
          ) : (
            <CwRespondenListPage respondenList={respondenList.respondenList} />
          )
        )}
      </div>
    </div>
  );
}

import ScLaporanAgregatPage from "./ScLaporanAgregatPage";
import ScLaporanIndividuPage from "./ScLaporanIndividuPage";
import ScRespondenListPage from "./ScRespondenListPage";
import { useScAgregat, useScIndividu, useScRespondenList } from "./useScData";
import styles from "./ScPage.module.css";

/**
 * Peran yang melihat SC sebagai laporan LEMBAGA (agregat + daftar responden), bukan laporan
 * pribadi. Sama persis daftar peran modul CW korporat (pages/cw/CwPage.jsx) -- keduanya modul
 * "budaya organisasi", cuma beda entitlement school_modules ("sc" vs "cw") dan data.
 */
function isPimpinanSc(peran) {
  return peran === "Manajemen" || peran === "KepalaSekolah"
    || peran === "WakilKepalaSekolah" || peran === "Yayasan" || peran === "AdminFammi";
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
 * ScPage -- pintu masuk modul School Culture (SC). Modul TERPISAH dari Corporate Culture &
 * Wellbeing (pages/cw/), instruksi eksplisit pemilik produk: "modul terpisah tapi dengan UI/UX
 * yang sama, baik untuk karyawan dan pimpinan" -- lihat catatan arsitektur lengkap di
 * sc.types.ts. Pola sama dengan CwPage.jsx/KarakterPage.jsx: satu switch tipis di sini, semua
 * logic tampilan ada di komponen per-tampilan.
 *
 * Data ASLI dari Supabase lewat useScData.js (bukan lagi sc.mock.ts) -- lihat catatan di
 * useScAgregat/useScIndividu untuk bagaimana LaporanAgregatSC/LaporanIndividuSC dirakit dari
 * sc_lembaga/sc_hasil/tindak_lanjut/briefing. Kalau belum ada data yang disetujui untuk sekolah
 * ini, tampilkan status kosong yang jelas -- BUKAN jatuh balik ke data contoh (CLAUDE.md:
 * jangan menampilkan angka contoh seolah temuan nyata; lihat juga pola sama di modul Karakter/MI
 * yang menampilkan status kosong, bukan mock, saat data belum ada).
 *
 * Sub-tab Dashboard/Laporan Individu SENGAJA bukan state internal di sini -- diangkat ke
 * App.jsx (prop tab, diklik lewat NavBar yang dirender App.jsx sendiri) supaya bisa dirender
 * menyatu di baris Header (inlineNav), sejajar dengan nav modul, bukan lagi di badan halaman ini.
 */
export default function ScPage({ session, tab = "dashboard" }) {
  const pimpinan = isPimpinanSc(session?.peran);

  const agregat = useScAgregat(session, null);
  const individu = useScIndividu(session);
  const respondenList = useScRespondenList(session, agregat.data?.meta?.periode_id || null);

  if (!pimpinan) {
    // Fallback defensif -- dalam praktiknya jalur ini seharusnya tidak pernah tercapai.
    // Karyawan (peran individu utama modul ini) sudah di-alihkan App.jsx ke ScKaryawanPage
    // (shell mobile mandiri) SEBELUM ScPage ini pernah dirender.
    return (
      <div className={styles.page}>
        <div className={styles.pageInnerNarrow}>
          {individu.loading ? (
            <StateBox icon="⏳" title="Memuat laporan…" />
          ) : individu.error ? (
            <StateBox icon="⚠️" title="Gagal memuat laporan" msg={individu.error} />
          ) : individu.data ? (
            <ScLaporanIndividuPage laporan={individu.data} />
          ) : (
            <StateBox icon="🕊️" title="Belum ada laporan" msg="Laporan School Culture Anda belum tersedia atau belum disetujui untuk periode ini." />
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
            <ScLaporanAgregatPage laporan={agregat.data} />
          ) : (
            <StateBox
              icon="📊"
              title="Belum ada data School Culture"
              msg="Import data lewat Upload Data (modul School Culture), lalu generate dan setujui tindak lanjutnya di Trigger & Gemini / Antrian Persetujuan."
            />
          )
        ) : (
          respondenList.loading ? (
            <StateBox icon="⏳" title="Memuat daftar responden…" />
          ) : respondenList.error ? (
            <StateBox icon="⚠️" title="Gagal memuat daftar responden" msg={respondenList.error} />
          ) : (
            <ScRespondenListPage respondenList={respondenList.respondenList} />
          )
        )}
      </div>
    </div>
  );
}

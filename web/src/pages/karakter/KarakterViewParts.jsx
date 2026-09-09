import { useState } from "react";
import { classifyPencapaian } from "./karakterMeta";
import styles from "./KarakterViews.module.css";

/**
 * Potongan tampilan yang dipakai lintas view Kepsek/WaliKelas/Yayasan (satu mesin
 * tampilan, beda cakupan). Dipisah dari KepsekView supaya view lain tidak perlu
 * mengimpor dari file view lain.
 */

/** Kartu statistik mandiri (ikon + angka + delta/subteks + satu visual kecil), satu kartu satu cerita. */
export function StatCardMini({ icon, tone = "default", label, value, unit, sub, subTone, children, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`${styles.statCardMini} ${tone !== "default" ? styles.statCardMiniPerhatian : ""} ${onClick ? styles.statCardMiniClickable : ""}`}
    >
      <div className={styles.statCardMiniTop}>
        <span className={styles.statCardMiniLabel}>{label}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className={styles.statCardMiniIcon}>{icon}</span>
          {onClick && <span className={styles.statCardMiniArrow}>›</span>}
        </span>
      </div>
      <div className={styles.statCardMiniValue}>
        {value}{unit && <span className={styles.statCardMiniUnit}>{unit}</span>}
      </div>
      {sub && (
        <p className={`${styles.statCardMiniSub} ${subTone === "aman" ? styles.statCardMiniSubAman : subTone === "perhatian" ? styles.statCardMiniSubPerhatian : ""}`}>
          {sub}
        </p>
      )}
      {children && <div className={styles.statCardMiniVisual}>{children}</div>}
    </Tag>
  );
}

/** Kartu statistik ringkas orientasi landscape (ikon kiri, teks kanan), untuk kolom samping grafik. */
export function StatCardLandscape({ icon, tone = "default", label, value, sub, subTone, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`${styles.statLandscape} ${tone !== "default" ? styles.statLandscapePerhatian : ""} ${onClick ? styles.statLandscapeClickable : ""}`}
    >
      <span className={styles.statLandscapeIcon}>{icon}</span>
      <div className={styles.statLandscapeBody}>
        <span className={styles.statLandscapeLabel}>{label}</span>
        <span className={styles.statLandscapeValue}>{value}</span>
        {sub && (
          <span className={`${styles.statLandscapeSub} ${subTone === "aman" ? styles.statLandscapeSubAman : subTone === "perhatian" ? styles.statLandscapeSubPerhatian : ""}`}>
            {sub}
          </span>
        )}
      </div>
      {onClick && <span className={styles.statLandscapeArrow}>›</span>}
    </Tag>
  );
}

export function AllGoodBanner({ subject }) {
  return (
    <div className={styles.allGoodBanner}>
      <span className={styles.allGoodBannerIcon}>✓</span>
      <div>
        <p className={styles.allGoodBannerTitle}>Semua {subject} sudah di jalur yang bagus periode ini.</p>
        <p className={styles.allGoodBannerText}>
          Pertahankan kebiasaan yang sudah berjalan. Rapor Karakter terus memantau tiap bulan supaya
          sinyal ini tetap konsisten, bukan sekali baik lalu terlupakan.
        </p>
      </div>
    </div>
  );
}

/** Partisi array item (kelas/aspek/murid/sekolah) jadi baik vs perlu_perhatian berdasar classifyPencapaian(getValue(item)). */
export function splitByClassify(items, getValue) {
  const withData = items.filter((it) => classifyPencapaian(getValue(it)) !== null);
  const baik = withData.filter((it) => classifyPencapaian(getValue(it)) === "baik");
  const perhatian = withData.filter((it) => classifyPencapaian(getValue(it)) === "perlu_perhatian");
  const allGood = withData.length > 0 && perhatian.length === 0;
  return { withData, baik, perhatian, allGood };
}

/** Gulir halus ke satu section berdasarkan id, dipakai supaya kartu statistik ringkasan clickable. */
export function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Daftar siswa satu kelas: lapis kedua dari tiga di halaman Kepala Sekolah (sekolah → kelas →
 * anak). Kepala Sekolah dan Wakil Kepala Sekolah memakainya untuk turun dari angka kelas ke satu
 * anak tanpa harus membuka akun wali kelasnya.
 *
 * `state` = hasil useKarakterKelasMurid. Datanya ditarik saat kelas dibuka, jadi tiga keadaan
 * diurus terang-terangan: sedang dimuat, gagal dimuat, dan memang belum ada. "Belum ada data"
 * untuk sesuatu yang sebenarnya gagal dimuat adalah jawaban yang salah.
 */
export function SiswaKelasList({ state, onSelect }) {
  const [tab, setTab] = useState("semua");
  const split = splitByClassify(state.muridList, (m) => m.rata);
  const rows = tab === "baik" ? split.baik : tab === "perhatian" ? split.perhatian : state.muridList;

  if (state.loading) return <p className={styles.emptyNote}>Memuat siswa kelas ini…</p>;
  if (state.error) return <p className={styles.emptyNote}>Data siswa gagal dimuat: {state.error}</p>;
  if (state.muridList.length === 0) return <p className={styles.emptyNote}>Belum ada data siswa untuk kelas ini pada periode ini.</p>;

  return (
    <>
      <div className={styles.masterListTabs}>
        <button type="button" className={`${styles.masterListTab} ${tab === "semua" ? styles.masterListTabActive : ""}`} onClick={() => setTab("semua")}>
          Semua ({state.muridList.length})
        </button>
        <button type="button" className={`${styles.masterListTab} ${tab === "baik" ? styles.masterListTabActive : ""}`} onClick={() => setTab("baik")}>
          Sudah Baik ({split.baik.length})
        </button>
        <button type="button" className={`${styles.masterListTab} ${tab === "perhatian" ? styles.masterListTabActive : ""}`} onClick={() => setTab("perhatian")}>
          Perlu Perhatian ({split.perhatian.length})
        </button>
      </div>
      <div className={styles.masterListRows}>
        {rows.length === 0 ? (
          <p className={styles.emptyNote}>Tidak ada siswa di kategori ini.</p>
        ) : rows.map((m) => {
          const tone = classifyPencapaian(m.rata);
          return (
            <button
              type="button" key={m.murid_id}
              className={styles.masterListRow}
              onClick={() => onSelect(m.murid_id)}
            >
              <span className={styles.masterListAvatar}>{(m.nama || "?").charAt(0).toUpperCase()}</span>
              <span className={styles.masterListName}>{m.nama}</span>
              <span className={`${styles.masterListTone} ${tone === "baik" ? styles.tonePillAman : tone === "perlu_perhatian" ? styles.tonePillPerhatian : styles.tonePillDefault}`}>
                {tone === "baik" ? "Sudah Baik" : tone === "perlu_perhatian" ? "Perlu Perhatian" : "Belum ada data"}
              </span>
              <span className={styles.masterListScore}>{m.rata != null ? `${m.rata}%` : "—"}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

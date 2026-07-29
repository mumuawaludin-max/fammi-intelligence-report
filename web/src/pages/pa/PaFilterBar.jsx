import SampleTag from "../../components/SampleTag";
import tokens from "./paTokens.module.css";
import styles from "./PaFilterBar.module.css";

/**
 * PaFilterBar -- baris filter yang menempel di paling atas modul Perilaku Anak: periode
 * asesmen dan unit sekolah di kiri, ringkasan cakupan yang sedang tampil di kanan. Dua filter
 * ini berlaku untuk SELURUH bagian di bawahnya (01 sampai 04), bukan per bagian.
 *
 * Penanda "Contoh" sengaja dipasang di sini, bukan di tiap kartu: satu-satunya tempat yang
 * pasti terlihat di semua bagian, dan tetap memenuhi aturan CLAUDE.md soal tidak menampilkan
 * angka contoh seolah temuan nyata. Hapus penanda ini begitu sumbernya diganti data Supabase.
 *
 * `nonaktif` mematikan KEDUA filter sekaligus, dipakai bagian 04 Survey: data survei tertutup
 * cuma ada di baris agregat pa_lembaga (tidak dipecah per unit, lihat catatan kepala
 * paAssembler.js), jadi mengganti filter di bagian itu tidak pernah mengubah angka yang tampil.
 * Lebih jujur dimatikan dengan alasan tertulis daripada dibiarkan bisa diklik tapi tidak
 * berefek.
 */
export function PaFilterBar({
  periodeOptions, periode, onPeriodeChange,
  unitOptions, unit, onUnitChange,
  unitLabel, diperbarui, contoh = true,
  nonaktif = false, alasanNonaktif = "",
}) {
  return (
    <div className={`${tokens.scope} ${styles.bar}`}>
      <div className={styles.filters}>
        <label className={`${styles.field} ${nonaktif ? styles.fieldNonaktif : ""}`}>
          <span className={styles.fieldLabel}>Periode asesmen</span>
          <select
            className={styles.select}
            value={periode}
            disabled={nonaktif}
            onChange={(e) => onPeriodeChange(e.target.value)}
          >
            {periodeOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </label>

        <label className={`${styles.field} ${nonaktif ? styles.fieldNonaktif : ""}`}>
          <span className={styles.fieldLabel}>Unit sekolah</span>
          <select
            className={styles.select}
            value={unit}
            disabled={nonaktif}
            onChange={(e) => onUnitChange(e.target.value)}
          >
            {unitOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </label>

        {nonaktif && alasanNonaktif && (
          <span className={styles.alasanNonaktif}>{alasanNonaktif}</span>
        )}
      </div>

      <div className={styles.meta}>
        <span className={styles.metaScope}>
          {unitLabel}
          {contoh && <SampleTag />}
        </span>
        <span className={styles.metaTime}>Diperbarui {diperbarui}</span>
      </div>
    </div>
  );
}

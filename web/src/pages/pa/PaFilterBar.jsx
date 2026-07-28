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
 */
export function PaFilterBar({
  periodeOptions, periode, onPeriodeChange,
  unitOptions, unit, onUnitChange,
  unitLabel, diperbarui, contoh = true,
}) {
  return (
    <div className={`${tokens.scope} ${styles.bar}`}>
      <div className={styles.filters}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Periode asesmen</span>
          <select
            className={styles.select}
            value={periode}
            onChange={(e) => onPeriodeChange(e.target.value)}
          >
            {periodeOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Unit sekolah</span>
          <select
            className={styles.select}
            value={unit}
            onChange={(e) => onUnitChange(e.target.value)}
          >
            {unitOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </label>
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

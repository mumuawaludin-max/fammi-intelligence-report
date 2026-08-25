import { LwReveal } from "./LwReveal";
import { leadKategoriTone, protekKategoriTone } from "./lwMeta";
import tokens from "./lwTokens.module.css";
import styles from "./LwKandidatTable.module.css";

/**
 * LwKandidatTable -- padanan bagian "B" (perbandingan) untuk section Kesiapan Memimpin, tapi
 * berbentuk tabel N-orang (bukan N-dimensi seperti ScDimensiPerbandingan) -- padanan langsung
 * tabel "Nama / Lembaga / Kesiapan Memimpin / Kondisi Psikologis" di dokumen sumber. Klik satu
 * baris membuka Laporan Individu kandidat tersebut.
 */
export function LwKandidatTable({ sectionIndex, title, subtitle, items, onSelect }) {
  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <LwReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </LwReveal>

      <LwReveal className={styles.tableWrap} delay={0.05}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Unit</th>
              <th>Kesiapan Memimpin</th>
              <th>Kondisi Psikologis</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className={styles.row} onClick={() => onSelect(it.id)} tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") onSelect(it.id); }}>
                <td>
                  <span className={styles.nama}>{it.nama}</span>
                  {it.isKepsek && <span className={styles.kepsekTag}>Kepala Sekolah saat ini</span>}
                </td>
                <td className={styles.unit}>{it.unit}</td>
                <td>
                  <span
                    className={styles.badge}
                    style={{ color: `var(${leadKategoriTone(it.kesiapanKategori)})`, background: `color-mix(in srgb, var(${leadKategoriTone(it.kesiapanKategori)}) 14%, white)` }}
                  >
                    {it.kesiapanSkor} · {it.kesiapanKategori}
                  </span>
                </td>
                <td>
                  <span
                    className={styles.badge}
                    style={{ color: `var(${protekKategoriTone(it.kondisiKategori)})`, background: `color-mix(in srgb, var(${protekKategoriTone(it.kondisiKategori)}) 14%, white)` }}
                  >
                    {it.kondisiSkor} · {it.kondisiKategori}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </LwReveal>
      <p className={styles.hint}>Klik satu baris untuk membuka laporan individu kandidat tersebut.</p>
    </section>
  );
}

import { useState } from "react";
import SectionHeading from "../../components/SectionHeading";
import CwDetailDialog from "./CwDetailDialog";
import CwLaporanIndividuPage from "./CwLaporanIndividuPage";
import { KATEGORI_KESEJAHTERAAN_COLOR } from "./cwColors";
import styles from "./CwRespondenListPage.module.css";

/** Tipe budaya dengan nilai saat_ini tertinggi -- ringkasan satu-kata untuk kolom tabel. */
function budayaDominan(chartData) {
  const top = (chartData || []).reduce(
    (acc, d) => (acc == null || d.saat_ini > acc.saat_ini ? d : acc),
    null
  );
  return top?.tipe ?? "—";
}

/**
 * CwRespondenListPage -- daftar responden (guru/karyawan) yang bisa dibuka pimpinan untuk
 * melihat laporan individu masing-masing. TIDAK ada di wireframe secara literal (dua file SVG
 * yang dibaca cuma menunjukkan sidebar dengan label "Laporan Individu", tanpa isi layarnya) --
 * ini pelengkap yang saya bangun supaya alur navigasi yang tersirat sidebar itu benar-benar bisa
 * dipakai (dari Dashboard -> pilih satu orang -> lihat laporannya), bukan literal dari gambar
 * wireframe. Lihat juga docs/cw-module-design-spec.md bagian 4.4 dan 4.3 (Laporan Kelompok,
 * yang MEMANG tidak ada wireframe-nya sama sekali dan sengaja tidak saya bangun di langkah ini).
 *
 * respondenList: LaporanIndividuCW[] -- dipakai juga sebagai sumber ringkasan tabel (nama,
 * jabatan, budaya dominan, indeks kesejahteraan), bukan tipe data terpisah.
 */
export default function CwRespondenListPage({ respondenList = [] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = respondenList.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      r.meta.nama_responden.toLowerCase().includes(q) ||
      (r.meta.jabatan || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.page}>
      <SectionHeading title="Laporan Individu" subtitle={`${respondenList.length} responden pada periode ini`} />

      <input
        type="text"
        className={styles.search}
        placeholder="Cari nama atau jabatan..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length === 0 ? (
        <p className={styles.empty}>Tidak ada responden yang cocok dengan pencarian.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {["Nama", "Jabatan", "Budaya Dominan", "Kesejahteraan"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const color = KATEGORI_KESEJAHTERAAN_COLOR[r.bagian_kesejahteraan.kategori] || "var(--ink-4)";
                return (
                  <tr
                    key={r.meta.responden_id}
                    className={styles.row}
                    onClick={() => setSelected(r)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => { if (e.key === "Enter") setSelected(r); }}
                  >
                    <td className={styles.tdNama}>{r.meta.nama_responden}</td>
                    <td>{r.meta.jabatan || "—"}</td>
                    <td>{budayaDominan(r.bagian_budaya.chart_data)}</td>
                    <td>
                      <span className={styles.kesejahteraanChip}>
                        <span className={styles.kesejahteraanDot} style={{ background: color }} />
                        {r.bagian_kesejahteraan.indeks} · {r.bagian_kesejahteraan.kategori}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <CwDetailDialog
          icon="🧑‍💼"
          eyebrow="Laporan Individu"
          title={selected.meta.nama_responden}
          subtitle={selected.meta.jabatan || "—"}
          onClose={() => setSelected(null)}
        >
          <CwLaporanIndividuPage laporan={selected} />
        </CwDetailDialog>
      )}
    </div>
  );
}

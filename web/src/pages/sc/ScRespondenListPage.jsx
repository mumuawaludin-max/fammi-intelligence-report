import { useState } from "react";
import SectionHeading from "../../components/SectionHeading";
import ScDetailDialog from "./ScDetailDialog";
import ScLaporanIndividuPage from "./ScLaporanIndividuPage";
import { KATEGORI_NILAI_COLOR } from "./scColors";
import styles from "./ScRespondenListPage.module.css";

/** Tipe budaya dengan nilai saat_ini tertinggi -- ringkasan satu-kata untuk kolom tabel. */
function budayaDominan(chartData) {
  const top = (chartData || []).reduce(
    (acc, d) => (acc == null || d.saat_ini > acc.saat_ini ? d : acc),
    null
  );
  return top?.tipe ?? "—";
}

/**
 * ScRespondenListPage -- daftar responden (staf sekolah) yang bisa dibuka pimpinan untuk melihat
 * laporan individu masing-masing. Salinan lokal dari pages/cw/CwRespondenListPage.jsx dengan
 * kolom "Peran Kerja" menggantikan "Jabatan" -- modul SC sengaja berdiri sendiri (sc.types.ts).
 */
export default function ScRespondenListPage({ respondenList = [] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = respondenList.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      r.meta.nama_responden.toLowerCase().includes(q) ||
      (r.meta.peran_kerja || "").toLowerCase().includes(q) ||
      (r.meta.unit || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.page}>
      <SectionHeading title="Laporan Individu" subtitle={`${respondenList.length} responden pada periode ini`} />

      <input
        type="text"
        className={styles.search}
        placeholder="Cari nama, peran kerja, atau unit..."
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
                {["Nama", "Peran Kerja", "Budaya Dominan", "Kesejahteraan"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const color = KATEGORI_NILAI_COLOR[r.bagian_kesejahteraan.kategori] || "var(--ink-4)";
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
                    <td>{r.meta.peran_kerja || "—"}</td>
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
        <ScDetailDialog
          icon="🧑‍🏫"
          eyebrow="Laporan Individu"
          title={selected.meta.nama_responden}
          subtitle={selected.meta.peran_kerja || "—"}
          onClose={() => setSelected(null)}
        >
          <ScLaporanIndividuPage laporan={selected} viewerIsOwner={false} />
        </ScDetailDialog>
      )}
    </div>
  );
}

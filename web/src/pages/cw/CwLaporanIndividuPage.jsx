import SectionHeading from "../../components/SectionHeading";
import CultureRadarChart from "./CultureRadarChart";
import WellbeingBarChart from "./WellbeingBarChart";
import { KATEGORI_KESEJAHTERAAN_COLOR } from "./cwColors";
import styles from "./CwLaporanIndividuPage.module.css";

const ARAH_ICON = { naik: "↑", turun: "↓", tetap: "→" };

/** Daftar arah gap per tipe budaya (bagian_budaya.tabel_gap) -- lihat TabelGapRow di cw.types.ts. */
function TabelGapList({ rows }) {
  if (!rows || rows.length === 0) return null;
  return (
    <ul className={styles.gapList}>
      {rows.map((r) => (
        <li className={styles.gapRow} key={r.label}>
          <span className={styles.gapIcon} aria-hidden="true">{ARAH_ICON[r.arah] || "•"}</span>
          <span className={styles.gapLabel}>{r.label}</span>
          <span className={styles.gapArah}>{r.arah}</span>
          {r.nilai_gap != null && (
            <span className={styles.gapNilai}>{r.nilai_gap > 0 ? `+${r.nilai_gap}` : r.nilai_gap}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * CwLaporanIndividuPage -- rakitan penuh laporan individu CW, mengikuti persis 6 bagian skema
 * JSON baku: header, bagian_budaya, bagian_kesejahteraan, bagian_cermin, bagian_refleksi,
 * footer (lihat cw.types.ts).
 *
 * CATATAN PERGESERAN: docs/cw-module-design-spec.md bagian 4.1 disusun dari wireframe Figma
 * SEBELUM skema JSON baku ini dikonfirmasi -- struktur section di sana (Kesimpulan Culture
 * dengan gap circle 4-tier predikat, grid 2x2 Kekeluargaan/Inovasi/Orientasi/Aturan, carousel
 * 6-kartu Penilaian Terhadap Lembaga) TIDAK dipakai lagi di sini. Skema JSON yang dikonfirmasi
 * user jadi sumber kebenaran struktur, bukan wireframe. Kalau ternyata kedua struktur itu perlu
 * digabung, itu keputusan produk yang belum diambil -- jangan diasumsikan sendiri.
 *
 * Komponen ini murni presentasional (terima data siap pakai, tidak fetch apa pun), supaya
 * gampang dipakai baik dengan data dummy (lihat cw.mock.ts) maupun data asli nanti.
 */
export default function CwLaporanIndividuPage({ laporan }) {
  const { header, bagian_budaya, bagian_kesejahteraan, bagian_cermin, bagian_refleksi, footer } = laporan;
  const kesejahteraanColor = KATEGORI_KESEJAHTERAAN_COLOR[bagian_kesejahteraan.kategori] || "var(--ink-4)";

  return (
    <div className={styles.page}>
      <div className={styles.headerHero}>
        <p className={styles.hook}>{header.hook}</p>
        <p className={styles.subHook}>{header.sub_hook}</p>
      </div>

      <section className={styles.section}>
        <SectionHeading
          title="Profil Budaya Organisasi"
          subtitle="Persepsi Anda terhadap budaya lembaga saat ini, dibandingkan dengan harapan Anda ke depan"
        />
        <div className={styles.card}>
          <p className={styles.narasi}>{bagian_budaya.narasi}</p>
          <div className={styles.radarWrap}>
            <CultureRadarChart data={bagian_budaya.chart_data} size={280} />
          </div>
        </div>
        <div className={styles.card}>
          <p className={styles.cardTitle}>Ringkasan Gap per Tipe Budaya</p>
          <TabelGapList rows={bagian_budaya.tabel_gap} />
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading
          title="Kesejahteraan"
          subtitle="Kondisi kesejahteraan Anda di lembaga ini, per subdimensi"
        />
        <div className={styles.card}>
          <p className={styles.narasi}>{bagian_kesejahteraan.narasi}</p>
          <div className={styles.indeksRow}>
            <span className={styles.indeksValue}>{bagian_kesejahteraan.indeks}</span>
            <span
              className={styles.indeksKategori}
              style={{ color: kesejahteraanColor, background: `color-mix(in srgb, ${kesejahteraanColor} 14%, transparent)` }}
            >
              {bagian_kesejahteraan.kategori}
            </span>
          </div>
          <WellbeingBarChart items={bagian_kesejahteraan.chart_data} />
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading title="Cermin" subtitle="Bagaimana Anda dipersepsikan rekan kerja" />
        <div className={styles.card}>
          <p className={styles.narasi}>{bagian_cermin}</p>
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading title="Refleksi" subtitle="Bahan renungan untuk langkah berikutnya" />
        <div className={styles.cardAccent}>
          <p className={styles.refleksiText}>{bagian_refleksi}</p>
        </div>
      </section>

      <p className={styles.disclaimer}>{footer.disclaimer}</p>
    </div>
  );
}

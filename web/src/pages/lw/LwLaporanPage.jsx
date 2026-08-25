import { useState } from "react";
import { LwRingkasan } from "./LwRingkasan";
import { LwAnalisisDimensi } from "./LwAnalisisDimensi";
import { LwPrioritas } from "./LwPrioritas";
import { LwLaporanIndividuPage } from "./LwLaporanIndividuPage";
import { labelPeriode } from "./lwMeta";
import tokens from "./lwTokens.module.css";
import styles from "./LwLaporanPage.module.css";

const TAB = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "dimensi", label: "Analisis Dimensi" },
  { id: "prioritas", label: "Prioritas Tindak Lanjut" },
  { id: "guru", label: "Laporan Guru" },
];

/**
 * LwLaporanPage -- kerangka modul Wellbeing Guru: identitas lembaga, pemilih periode, dan
 * empat layar yang mengikuti alur baca pimpinan yayasan:
 *   1 Ringkasan       seberapa sehat tim dan ke mana arahnya
 *   2 Analisis Dimensi di dimensi dan jenjang mana persoalannya
 *   3 Prioritas       siapa yang dibantu lebih dulu, apa langkahnya
 *   4 Laporan Guru    profil satu orang saat akan diajak bicara
 *
 * Pemilih periode hanya tampil di Ringkasan karena hanya layar itu yang punya angka tiga
 * periode; tiga layar lain memuat rincian yang cuma ada untuk periode terakhir. Menampilkan
 * pemilih yang tidak mengubah apa pun cuma bikin bingung.
 */
export default function LwLaporanPage({ laporan }) {
  const { meta } = laporan;
  const [tab, setTab] = useState("ringkasan");
  const [periodeId, setPeriodeId] = useState(meta.periodeTerakhir);
  const [jenjang, setJenjang] = useState("semua");
  const [guruId, setGuruId] = useState(() => laporan.guru[0]?.id || null);

  function bukaGuru(id) {
    setGuruId(id);
    setTab("guru");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const periodeAktif = tab === "ringkasan" ? periodeId : meta.periodeTerakhir;

  return (
    <div className={styles.halaman}>
      <div className={`${tokens.scope} ${styles.topbar}`}>
        <div className={styles.identitas}>
          <span className={styles.logo} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-7-4.35-7-9.5A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 7 3.5C19 16.65 12 21 12 21z" />
            </svg>
          </span>
          <div>
            <p className={styles.namaLembaga}>{meta.organisasiNama}</p>
            <p className={styles.subLembaga}>Laporan Wellbeing Guru &middot; kerangka PROTEK</p>
          </div>
        </div>

        {tab === "ringkasan" ? (
          <div className={styles.periodeRow}>
            <span className={styles.periodeLabel}>Periode</span>
            {meta.periodeList.map((p) => (
              <button
                key={p}
                type="button"
                className={`${styles.periodePil} ${periodeId === p ? styles.periodePilAktif : ""}`}
                aria-pressed={periodeId === p}
                onClick={() => setPeriodeId(p)}
              >
                {labelPeriode(p, true)}
              </button>
            ))}
          </div>
        ) : (
          <span className={styles.periodeTetap}>{labelPeriode(meta.periodeTerakhir, true)}</span>
        )}
      </div>

      <nav className={`${tokens.scope} ${styles.tabBar}`} aria-label="Bagian laporan">
        {TAB.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.tab} ${tab === t.id ? styles.tabAktif : ""}`}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className={styles.isi}>
        {tab === "ringkasan" && (
          <LwRingkasan
            laporan={laporan}
            periodeId={periodeAktif}
            jenjang={jenjang}
            onPilihJenjang={setJenjang}
          />
        )}
        {tab === "dimensi" && <LwAnalisisDimensi laporan={laporan} periodeId={periodeAktif} />}
        {tab === "prioritas" && <LwPrioritas laporan={laporan} onPilihGuru={bukaGuru} />}
        {tab === "guru" && (
          <LwLaporanIndividuPage laporan={laporan} guruId={guruId} onPilihGuru={setGuruId} />
        )}
      </div>
    </div>
  );
}

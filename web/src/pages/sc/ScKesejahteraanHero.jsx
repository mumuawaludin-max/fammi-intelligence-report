import { ScLaporanReveal } from "./ScLaporanReveal";
import { ScIconBadge } from "./scIconBadge";
import { ScScoreRing } from "./ScScoreRing";
import { KESEJAHTERAAN_INFO, interpretasiKesejahteraan } from "./scMeta";
import tokens from "./scBudayaTokens.module.css";
import styles from "./ScKesejahteraanHero.module.css";

function formatScore(value) {
  return (value ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

/**
 * ScKesejahteraanHero -- padanan "02-A" desain baru khusus bagian Kesejahteraan Tim (BEDA dari
 * pola ScDimensiRingkasan yang masih dipakai Profil Organisasi): hero headline+ring+insight di
 * atas, lalu stepper lima aspek + kartu insight aspek di bawahnya. Atas instruksi eksplisit
 * pemilik produk, referensi screenshot terpisah dari wireframe-original.png yang dipakai
 * ScSectionSelector/ScDimensiRingkasan di bagian lain.
 *
 * Ring dan kartu insight SELALU mengikuti aspek yang sedang dipilih di stepper (selectedKey),
 * bukan cuma dominan tetap -- konsisten dengan pola "artinya dinamis" yang sudah dipakai
 * ScDimensiRingkasan di 01-A/03-A.
 */
export function ScKesejahteraanHero({
  headline, narasi, periodLabel, jumlahResponden,
  items, selectedKey, onSelect,
}) {
  const selectedItem = items.find((it) => it.key === selectedKey) || items[0];
  const info = selectedItem ? KESEJAHTERAAN_INFO[selectedItem.key] : null;

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <ScLaporanReveal className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.kicker}>
            <ScIconBadge icon="heart" size="sm" tone="plain" />
            <span>Laporan Kesejahteraan Tim</span>
          </div>
          <h1>{headline}</h1>
          <p className={styles.lead}>{narasi}</p>
          <dl className={styles.meta}>
            <div>
              <ScIconBadge icon="calendar" size="sm" tone="plain" />
              <div>
                <dt>Periode laporan</dt>
                <dd>{periodLabel}</dd>
              </div>
            </div>
            <div>
              <ScIconBadge icon="kesejahteraan" size="sm" tone="plain" />
              <div>
                <dt>Responden</dt>
                <dd>{jumlahResponden} pegawai</dd>
              </div>
            </div>
          </dl>
        </div>

        {selectedItem && (
          <div className={styles.heroScore}>
            <ScScoreRing score={selectedItem.value} eyebrow="Sinyal terkuat" label={selectedItem.label} />
            <div className={styles.callout}>
              <span className={styles.calloutBar} aria-hidden="true" />
              <p>{interpretasiKesejahteraan(selectedItem.kategori) || "Belum ada interpretasi untuk aspek ini pada periode ini."}</p>
            </div>
          </div>
        )}
      </ScLaporanReveal>

      <ScLaporanReveal className={styles.aspekBlock} delay={0.08}>
        <div className={styles.aspekHeading}>
          <h2>Lima aspek kesejahteraan tim</h2>
          <p>Pilih aspek untuk melihat driver dan implikasinya.</p>
        </div>

        <div className={styles.stepperRow}>
          <div className={styles.stepper}>
            <span className={styles.stepperLine} aria-hidden="true" />
            {items.map((item) => {
              const active = item.key === selectedItem?.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.step} ${active ? styles.stepActive : ""}`}
                  aria-pressed={active}
                  onClick={() => onSelect(item.key)}
                >
                  <ScIconBadge icon={item.key} size="md" tone={active ? "purple" : "plain"} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {selectedItem && (
            <div className={styles.insightCard}>
              <div className={styles.insightHeading}>
                <ScIconBadge icon="lightbulb" size="sm" tone="gold" />
                <span>Insight aspek</span>
              </div>
              <h3>{selectedItem.label}</h3>
              <p>{info?.deskripsi || "Belum ada deskripsi untuk aspek ini."}</p>
              <div className={styles.insightScore}>
                <strong>{formatScore(selectedItem.value)}%</strong>
                <span>{selectedItem.kategori}</span>
              </div>
            </div>
          )}
        </div>
      </ScLaporanReveal>
    </section>
  );
}

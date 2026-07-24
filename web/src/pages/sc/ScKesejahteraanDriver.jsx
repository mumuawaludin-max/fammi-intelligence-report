import { ScLaporanReveal } from "./ScLaporanReveal";
import { ScIconBadge } from "./scIconBadge";
import { KESEJAHTERAAN_INFO, interpretasiKesejahteraan, toneKesejahteraan } from "./scMeta";
import tokens from "./scBudayaTokens.module.css";
import styles from "./ScKesejahteraanDriver.module.css";

function formatScore(value) {
  return (value ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

const TONE_LABEL = {
  baik: "Yang perlu dijaga",
  netral: "Yang perlu diperhatikan",
  waspada: "Yang perlu diperbaiki",
};

function Stars({ rating }) {
  const filled = Math.round(Math.max(0, Math.min(5, rating ?? 0)));
  return (
    <span className={styles.stars} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < filled ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </span>
  );
}

/**
 * ScKesejahteraanDriver -- padanan "02-B". Kartu utama menampilkan skor aspek terpilih (bar
 * proporsional + kategori + interpretasi) PLUS breakdown butir mentah nyata (`selected.items`,
 * rata-rata b1-b13 per subdimensi -- lihat driverItemsKesejahteraan di useScData.js) kalau
 * tersedia. Sebelumnya breakdown ini tidak ada sumbernya sama sekali dan sengaja tidak dikarang;
 * sekarang datanya nyata (dari sheet Personal), jadi ditampilkan apa adanya -- laporan lama yang
 * belum punya field ini tetap tampil rapi tanpa blok ini (graceful fallback). Kartu "Yang perlu
 * dijaga/diperbaiki" tetap pakai facets (scMeta.js, teks generik bukan temuan periode ini).
 */
export function ScKesejahteraanDriver({ sectionIndex, items, selectedKey, onSelect }) {
  const selected = items.find((it) => it.key === selectedKey) || items[0];
  const info = selected ? KESEJAHTERAAN_INFO[selected.key] : null;
  const tone = selected ? toneKesejahteraan(selected.kategori) : "netral";

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <ScLaporanReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>Apa yang membentuk pengalaman kerja tim?</h2>
        <p>Telusuri faktor pendorong di balik setiap aspek dan temukan area yang perlu dipertahankan atau diperbaiki.</p>
      </ScLaporanReveal>

      <div className={styles.layout}>
        <ScLaporanReveal className={styles.sidebar} amount={0.2}>
          {items.map((item) => {
            const active = item.key === selected?.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`${styles.sidebarItem} ${active ? styles.sidebarItemActive : ""}`}
                aria-pressed={active}
                onClick={() => onSelect(item.key)}
              >
                <ScIconBadge icon={item.key} size="sm" tone={active ? "purple" : "plain"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </ScLaporanReveal>

        {selected && (
          <ScLaporanReveal className={styles.mainCard} delay={0.05} amount={0.15}>
            <div className={styles.mainHeader}>
              <div>
                <p className={styles.eyebrow}>Aspek aktif</p>
                <h3>{selected.label}</h3>
              </div>
              <strong className={styles.mainScore}>{formatScore(selected.value)}%</strong>
            </div>

            <div className={styles.barTrack} role="img" aria-label={`Skor ${selected.label}: ${formatScore(selected.value)}%`}>
              <div className={styles.barFill} style={{ width: `${Math.max(0, Math.min(100, selected.value ?? 0))}%` }} />
            </div>
            <div className={styles.barFoot}>
              <span className={`${styles.badge} ${styles[`badge_${tone}`]}`}>{selected.kategori}</span>
            </div>

            <div className={styles.interpretationBlock}>
              <p className={styles.blockTitle}>Interpretasi</p>
              <p className={styles.blockText}>
                {interpretasiKesejahteraan(selected.kategori) || "Belum ada interpretasi untuk aspek ini pada periode ini."}
              </p>
            </div>

            {selected.items?.length > 0 && (
              <div className={styles.driverBlock}>
                <p className={styles.blockTitle}>Faktor Pendorong</p>
                <div className={styles.driverList}>
                  {selected.items.map((it, i) => (
                    <div className={styles.driverRow} key={i}>
                      <span className={styles.driverLabel}>{it.label}</span>
                      <span className={styles.driverValue}>
                        <Stars rating={it.nilai} />
                        <span className={styles.driverNumber}>{formatScore(it.nilai)} dari 5</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScLaporanReveal>
        )}

        {selected && (
          <ScLaporanReveal className={styles.sideCard} delay={0.08} amount={0.15}>
            <div className={styles.sideHeading}>
              <ScIconBadge icon="lightbulb" size="sm" tone="gold" />
              <h3>{TONE_LABEL[tone]}</h3>
            </div>

            {info?.facets?.length > 0 ? (
              <ul className={styles.facetList}>
                {info.facets.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            ) : (
              <p className={styles.gapNote}>Belum ada rincian pendorong untuk aspek ini.</p>
            )}
          </ScLaporanReveal>
        )}
      </div>
    </section>
  );
}

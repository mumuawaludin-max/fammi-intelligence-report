import { useState } from "react";
import { PaReveal } from "./PaReveal";
import { PaSectionHeading } from "./PaSectionHeading";
import { PaInsightBanner } from "./PaInsightBanner";
import { PaBar, PaStackBar } from "./PaBar";
import tokens from "./paTokens.module.css";
import styles from "./PaHasilAsesmen.module.css";

// Urutan keparahan data ASLI: Aman < Perlu Perhatian < Perlu Diwaspadai (paling berat).
// `kunci` di sini sengaja PERSIS sama dengan nama field data (aman/perhatian/diwaspadai),
// `tone` yang memetakan ke warna -- supaya token CSS lama (--pa-waspada emas, --pa-perhatian
// merah) tidak perlu diganti nama, cukup ditata ulang mana yang dipakai untuk tingkat mana.
const TINGKAT = [
  { kunci: "aman", label: "Aman", tone: "aman" },
  { kunci: "perhatian", label: "Perlu Perhatian", tone: "waspada" },
  { kunci: "diwaspadai", label: "Perlu Diwaspadai", tone: "perhatian" },
];

/** Tiga baris skor kecil (Aman / Perlu Perhatian / Perlu Diwaspadai) untuk satu dimensi. */
function TingkatList({ dimensi }) {
  return (
    <div className={styles.tingkatList}>
      {TINGKAT.map((t) => (
        <div className={styles.tingkat} key={t.kunci}>
          <span className={`${styles.tingkatLabel} ${styles[`ink_${t.tone}`]}`}>{t.label}</span>
          <span className={`${styles.tingkatValue} ${styles[`ink_${t.tone}`]}`}>{dimensi[t.kunci]}%</span>
          <PaBar
            persen={dimensi[t.kunci]}
            tone={t.tone}
            size="sm"
            className={styles.tingkatBar}
            label={`${dimensi.label} ${t.label} ${dimensi[t.kunci]} persen`}
          />
        </div>
      ))}
    </div>
  );
}

/** Domain default yang dipilih: gabungan perhatian+diwaspadai tertinggi, bukan cuma satu kolom. */
function dominanDari(ringkasan) {
  return ringkasan.reduce((acc, d) => {
    const gab = d.perhatian + d.diwaspadai;
    const accGab = acc ? acc.perhatian + acc.diwaspadai : -1;
    return gab > accGab ? d : acc;
  }, null);
}

/**
 * PaHasilAsesmen -- bagian 02. Empat lapis pembacaan, dari umum ke rinci: satu kalimat insight
 * yang dihitung dari data, kartu inisial HEART yang bisa diklik untuk melihat interpretasinya,
 * blok per unit sekolah, lalu (kalau scope "semua unit") satu perbandingan domain yang sedang
 * dipilih di antara ketiga unit.
 *
 * Kartu HEART bisa diklik -- begitu diklik, panel "Apa artinya" di bawahnya berganti mengikuti
 * kamus istilah domain dan kalimat insight spesifik domain itu.
 */
export function PaHasilAsesmen({ data, unitLabel, unitScope = "semua" }) {
  const { ringkasan, per_unit, insight_utama } = data;
  const [selectedKey, setSelectedKey] = useState(() => dominanDari(ringkasan)?.kode);
  const selected = ringkasan.find((d) => d.kode === selectedKey) || ringkasan[0];

  // Bandingkan domain yang SEDANG DIPILIH di ketiga unit -- pengganti grafik "aman vs perlu
  // perhatian" generik versi pertama. Grafik lama butuh satu angka gabungan holistik yang TIDAK
  // ada di data asli (Excel sumber cuma punya rincian per domain, bukan skor kesehatan
  // menyeluruh siap pakai) -- menghitungnya sendiri di sini akan melanggar aturan "FIR tidak
  // menghitung apa pun". Membandingkan satu domain nyata antarunit tetap berguna dan jujur
  // ke data yang benar-benar ada, dan otomatis ikut kartu yang sedang dipilih pembaca.
  const bisaBandingkanAntarunit = unitScope === "semua" && per_unit.length > 1;

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <PaSectionHeading
        title="Sebaran tiap domain, dari lembaga sampai unit"
        subtitle="Hiperaktivitas, Emosional, Agresi, Relasi, dan Tolong Menolong. Angka menunjukkan porsi siswa pada tiap tingkat."
        aside={unitLabel}
      />

      <PaInsightBanner teks={insight_utama} />

      <PaReveal className={styles.dimensiGrid} delay={0.02}>
        {ringkasan.map((d) => {
          const active = d.kode === selectedKey;
          return (
            <button
              key={d.kode}
              type="button"
              className={`${styles.dimensiCard} ${active ? styles.dimensiCardActive : ""}`}
              aria-pressed={active}
              onClick={() => setSelectedKey(d.kode)}
            >
              <div className={styles.dimensiHead}>
                <span className={styles.huruf}>{d.huruf}</span>
                <p className={styles.dimensiLabel}>{d.label}</p>
              </div>
              <TingkatList dimensi={d} />
            </button>
          );
        })}
      </PaReveal>

      {selected && (
        <PaReveal className={styles.meaningBlock} delay={0.06} amount={0.15}>
          <div className={styles.meaningGrid}>
            <div className={styles.meaningCard}>
              <p className={styles.meaningEyebrow}>Apa itu {selected.label}?</p>
              <p className={styles.meaningDefinisi}>{selected.definisi}</p>
              {selected.ciri_umum?.length > 0 && (
                <ul className={styles.ciriList}>
                  {selected.ciri_umum.map((c) => <li key={c}>{c}</li>)}
                </ul>
              )}
            </div>
            <div className={`${styles.meaningCard} ${styles.meaningCardInsight}`}>
              <p className={styles.meaningEyebrow}>Temuan untuk {unitLabel}</p>
              <p className={styles.meaningInsight}>{selected.insight}</p>
              {selected.catatan && <p className={styles.meaningCatatan}>{selected.catatan}</p>}
            </div>
          </div>
        </PaReveal>
      )}

      {per_unit.map((u, i) => (
        <PaReveal className={styles.unitBlock} delay={0.04 + i * 0.04} amount={0.12} key={u.kode}>
          <p className={styles.unitTitle}>{u.label}</p>
          <div className={styles.unitGrid}>
            {u.dimensi.map((d) => (
              <div className={styles.unitCard} key={d.kode}>
                <p className={styles.unitCardLabel}>
                  <span className={styles.hurufMini}>{d.huruf}</span>
                  {d.label}
                </p>
                <TingkatList dimensi={d} />
              </div>
            ))}
          </div>
        </PaReveal>
      ))}

      {bisaBandingkanAntarunit && selected && (
        <PaReveal className={styles.compareCard} delay={0.06} amount={0.12}>
          <div className={styles.compareHead}>
            <h3>Bandingkan {selected.label} Antarunit</h3>
            <div className={styles.compareKeys}>
              <span className={`${styles.compareKey} ${styles.ink_aman}`}>Aman</span>
              <span className={`${styles.compareKey} ${styles.ink_waspada}`}>Perlu Perhatian</span>
              <span className={`${styles.compareKey} ${styles.ink_perhatian}`}>Perlu Diwaspadai</span>
            </div>
          </div>

          <div className={styles.compareRows}>
            {per_unit.map((u) => {
              const d = u.dimensi.find((x) => x.kode === selectedKey);
              if (!d) return null;
              return (
                <div className={styles.compareRow} key={u.kode}>
                  <div className={styles.compareUnit}>
                    <p className={styles.compareUnitLabel}>{u.label}</p>
                    <p className={styles.compareUnitNote}>{selected.label}</p>
                  </div>
                  <div className={styles.compareBody}>
                    <PaStackBar
                      size="lg"
                      segmen={[
                        { kode: "aman", persen: d.aman, warna: "var(--pa-aman)" },
                        { kode: "perhatian", persen: d.perhatian, warna: "var(--pa-waspada)" },
                        { kode: "diwaspadai", persen: d.diwaspadai, warna: "var(--pa-perhatian)" },
                      ]}
                      label={`${u.label}: aman ${d.aman} persen, perlu perhatian ${d.perhatian} persen, perlu diwaspadai ${d.diwaspadai} persen`}
                    />
                    <div className={styles.compareValues}>
                      <span className={styles.ink_aman}>Aman <strong>{d.aman}%</strong></span>
                      <span className={styles.ink_waspada}>Perhatian <strong>{d.perhatian}%</strong></span>
                      <span className={styles.ink_perhatian}>Diwaspadai <strong>{d.diwaspadai}%</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className={styles.compareNote}>Ketuk salah satu kartu domain di atas untuk mengganti domain yang dibandingkan.</p>
        </PaReveal>
      )}
    </section>
  );
}

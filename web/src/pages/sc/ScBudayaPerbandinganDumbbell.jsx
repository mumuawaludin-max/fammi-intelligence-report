import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ScLaporanReveal } from "./ScLaporanReveal";
import { ScIconBadge } from "./scIconBadge";
import { ScShareDialog } from "./ScShareDialog";
import { TIPE_BUDAYA_INFO, implikasiBudaya } from "./scMeta";
import tokens from "./scBudayaTokens.module.css";
import styles from "./ScBudayaPerbandinganDumbbell.module.css";

function formatScore(value) {
  return (value ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

function statusTone(status) {
  if (status === "Selaras") return "aligned";
  if (status === "Perlu perhatian") return "attention";
  return "light";
}

/** Skala sumbu dinamis dari data (bukan 60-100 tetap) -- lihat catatan sama di
 * ScDimensiPerbandingan.jsx, prinsip yang sama berlaku di sini. */
function hitungSkala(chartData) {
  const semua = (chartData || []).flatMap((d) => [d.saat_ini, d.harapan]).filter(Number.isFinite);
  const minAsli = semua.length > 0 ? Math.min(...semua) : 60;
  const axisMin = Math.max(0, Math.floor(minAsli / 10) * 10 - 10);
  return { axisMin, axisMax: 100 };
}

function scorePosition(score, axisMin, axisMax) {
  return ((Math.max(axisMin, Math.min(axisMax, score ?? axisMin)) - axisMin) / (axisMax - axisMin)) * 100;
}

function nilaiGap(tabelGap, tipe) {
  return (tabelGap || []).find((g) => g.label === tipe)?.nilai_gap;
}

/**
 * Rakit template pesan WhatsApp, POV pimpinan yang membagikan ke timnya sendiri -- fokus SATU
 * dimensi terpilih saja (bukan seluruh laporan). Alur pesan: informasikan fokusnya, jelaskan
 * kenapa (implikasiBudaya, sudah menulis kalimat aksi-nya sendiri per tipe & arah gap), lalu
 * arahkan ke langkah konkret kalau tersedia.
 */
function buatPesanBagikan(selected, selectedGap, selectedInfo, priorityActions) {
  if (!selected) return "";
  const gap = selectedGap != null ? Math.abs(selectedGap) : null;
  const arah = selectedGap == null || selectedGap === 0 ? "tetap" : selectedGap > 0 ? "naik" : "turun";
  const implikasi = implikasiBudaya(selected.tipe, arah) || selectedInfo?.deskripsi || "";

  const baris = [
    `Halo Tim, dari hasil asesmen School Culture periode ini, ada satu fokus yang ingin saya bagikan ke kita semua: *${selected.tipe}* (${selectedInfo?.ringkas || "-"}).`,
    "",
    `Skor kita saat ini di angka ${formatScore(selected.saat_ini)}%, sementara harapan tim ada di ${formatScore(selected.harapan)}%` +
      (gap != null ? ` (selisih ${formatScore(gap)}%).` : "."),
  ];
  if (implikasi) baris.push("", implikasi);

  if (priorityActions?.length > 0) {
    baris.push("", "*Arah fokus kita ke depan:*", priorityActions.map((a, i) => `${i + 1}. ${a}`).join("\n"));
  } else {
    baris.push("", "Langkah konkretnya akan kita bahas bersama di pertemuan berikutnya.");
  }

  baris.push("", "Mohon dukungan dan masukan semua pihak supaya perubahan ini benar-benar terasa. Terima kasih!");
  return baris.join("\n");
}

/**
 * ScBudayaPerbandinganDumbbell -- padanan "01-B" khusus bagian Budaya Kerja, gaya dumbbell chart
 * + panel prioritas sticky (BUKAN grid kartu wireframe seperti ScDimensiPerbandingan yang masih
 * dipakai 02-B/03-B) -- atas instruksi eksplisit pemilik produk untuk bagian Budaya Kerja saja.
 * Gap dibaca dari tabel_gap (angka resmi backend), bukan dihitung ulang dari harapan-saat_ini.
 */
export function ScBudayaPerbandinganDumbbell({ sectionIndex, chartData, tabelGap, selected, onSelect, onPrioritize }) {
  const reduceMotion = useReducedMotion();
  const [shareOpen, setShareOpen] = useState(false);
  const { axisMin, axisMax } = hitungSkala(chartData);
  const ticks = [axisMin, axisMin + (axisMax - axisMin) * 0.25, axisMin + (axisMax - axisMin) * 0.5, axisMin + (axisMax - axisMin) * 0.75, axisMax];

  const sorted = [...chartData].sort((a, b) => Math.abs(nilaiGap(tabelGap, b.tipe) ?? 0) - Math.abs(nilaiGap(tabelGap, a.tipe) ?? 0));
  const largest = sorted[0];
  const closest = sorted[sorted.length - 1];

  const selectedGap = selected ? nilaiGap(tabelGap, selected.tipe) : null;
  const selectedInfo = selected ? TIPE_BUDAYA_INFO[selected.tipe] : null;
  const priorityActions = selected?.priorityActions?.length > 0
    ? selected.priorityActions
    : selected?.focus
    ? [selected.focus]
    : null;
  const pesanBagikan = buatPesanBagikan(selected, selectedGap, selectedInfo, priorityActions);

  return (
    <section className={`${tokens.scope} ${styles.section}`} id="sc-budaya-perbandingan">
      <ScLaporanReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>Kondisi saat ini dan harapan ke depan</h2>
        <p>Bandingkan posisi keempat dimensi pada skala yang sama untuk menemukan prioritas intervensi.</p>
      </ScLaporanReveal>

      <div className={styles.layout}>
        <ScLaporanReveal className={styles.chart} amount={0.1}>
          <div className={styles.chartHeader}>
            <div>
              <h3>Perbandingan 4 dimensi</h3>
              <p>Nilai saat ini, harapan, dan besar gap.</p>
            </div>
            <div className={styles.legend} aria-label="Legenda grafik">
              <span><i className={`${styles.legendDot} ${styles.legendCurrent}`} />Saat ini</span>
              <span><i className={`${styles.legendDot} ${styles.legendTarget}`} />Harapan</span>
            </div>
          </div>

          <div className={styles.scale} aria-hidden="true">
            {ticks.map((t, i) => <span key={i}>{Math.round(t)}%</span>)}
          </div>

          <div className={styles.rows}>
            {chartData.map((dimension, index) => {
              const active = selected?.tipe === dimension.tipe;
              const start = scorePosition(dimension.saat_ini, axisMin, axisMax);
              const end = scorePosition(dimension.harapan, axisMin, axisMax);
              const gap = nilaiGap(tabelGap, dimension.tipe);
              const info = TIPE_BUDAYA_INFO[dimension.tipe];
              return (
                <button
                  key={dimension.tipe}
                  type="button"
                  className={`${styles.row} ${active ? styles.rowActive : ""}`}
                  aria-pressed={active}
                  onClick={() => onSelect(dimension.tipe)}
                >
                  <span className={styles.rowLabel}>
                    <ScIconBadge icon={dimension.tipe} size="sm" />
                    <span>
                      <strong>{dimension.tipe}</strong>
                      <small>{info?.ringkas}</small>
                    </span>
                  </span>

                  <span
                    className={styles.dumbbell}
                    aria-label={`${dimension.tipe}: saat ini ${formatScore(dimension.saat_ini)}%, harapan ${formatScore(dimension.harapan)}%`}
                  >
                    <span className={styles.dumbbellGrid} />
                    <motion.span
                      className={styles.dumbbellLine}
                      style={{ left: `${Math.min(start, end)}%`, width: `${Math.max(Math.abs(end - start), 1)}%` }}
                      initial={reduceMotion ? false : { scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true, amount: 0.8 }}
                      transition={{ duration: 0.7, delay: index * 0.08 }}
                    />
                    <motion.span
                      className={`${styles.dumbbellPoint} ${styles.dumbbellCurrent}`}
                      style={{ left: `${start}%` }}
                      initial={reduceMotion ? false : { scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: 0.2 + index * 0.08 }}
                    >
                      <em>{formatScore(dimension.saat_ini)}%</em>
                    </motion.span>
                    <motion.span
                      className={`${styles.dumbbellPoint} ${styles.dumbbellTarget}`}
                      style={{ left: `${end}%` }}
                      initial={reduceMotion ? false : { scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: 0.42 + index * 0.08 }}
                    >
                      <em>{formatScore(dimension.harapan)}%</em>
                    </motion.span>
                  </span>

                  <span className={styles.rowResult}>
                    <strong>{gap != null ? `${formatScore(Math.abs(gap))}%` : "—"}</strong>
                    {dimension.status && (
                      <small className={`${styles.status} ${styles[`status_${statusTone(dimension.status)}`]}`}>
                        {dimension.status}
                      </small>
                    )}
                  </span>
                  <span className={styles.rowArrow} aria-hidden="true">→</span>
                </button>
              );
            })}
          </div>

          {largest && closest && (
            <div className={styles.insight}>
              <span aria-hidden="true">✨</span>
              <p>
                <strong>{closest.tipe}</strong> paling dekat dengan harapan.{" "}
                <strong>{largest.tipe}</strong> memiliki gap terbesar dan memerlukan intervensi paling kuat.
              </p>
            </div>
          )}
        </ScLaporanReveal>

        <ScLaporanReveal className={styles.priorityPanel} delay={0.08} amount={0.1}>
          <div className={styles.priorityTitle}>
            <ScIconBadge icon="award" size="sm" tone="gold" />
            <span>
              <strong>Prioritas eksekutif</strong>
              <small>Fokus pada dampak terbesar</small>
            </span>
          </div>

          {selected && (
            <motion.div
              className={styles.priorityScore}
              key={selected.tipe}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ScIconBadge icon={selected.tipe} size="lg" />
              <span>
                <small>Dimensi terpilih</small>
                <strong>{selected.tipe}</strong>
                <b>{selectedGap != null ? `${formatScore(Math.abs(selectedGap))}% gap` : "gap belum tersedia"}</b>
              </span>
            </motion.div>
          )}

          <div className={styles.prioritySection}>
            <h3>Interpretasi</h3>
            <p>{selected?.interpretation || selectedInfo?.deskripsi || "Belum ada interpretasi spesifik untuk periode ini."}</p>
          </div>

          <div className={styles.prioritySection}>
            <h3>Arah fokus</h3>
            {priorityActions ? (
              <ul className={styles.focusList}>
                {priorityActions.map((action) => (
                  <li key={action}>
                    <ScIconBadge icon="target" size="sm" tone="plain" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.gapNote}>Belum ada rekomendasi tindak lanjut spesifik untuk dimensi ini pada periode ini.</p>
            )}
          </div>

          <button
            className={styles.buttonPrimary}
            type="button"
            onClick={() => selected && setShareOpen(true)}
            disabled={!selected}
          >
            🏅 Jadikan prioritas intervensi
          </button>
        </ScLaporanReveal>
      </div>

      <ScShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        dimensionLabel={selected?.tipe}
        dimensionIcon={selected?.tipe}
        message={pesanBagikan}
        onShared={() => selected && onPrioritize(selected.tipe)}
      />
    </section>
  );
}

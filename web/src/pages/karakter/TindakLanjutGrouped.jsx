import { useState } from "react";
import { groupTindakLanjut } from "./karakterMeta";
import { TindakLanjutDetailBody } from "./KarakterShared";
import styles from "./KarakterViews.module.css";

const BUCKET_META = {
  baik: {
    title: "Pertahankan yang Sudah Baik",
    why: "Langkah yang sudah berjalan baik, diteruskan supaya hasilnya tidak balik turun.",
    tone: styles.groupTonePositif,
  },
  perlu_perhatian: {
    title: "Perlu Perhatian",
    why: "Langkah yang menyasar area yang sedang berkembang, ke rutinitas kelas dan rumah, bukan ke anak secara individu.",
    tone: styles.groupTonePerhatian,
  },
  lainnya: {
    title: "Langkah untuk Sekolah Secara Keseluruhan",
    why: "Tidak terikat satu kelas atau aspek tertentu, sering kali menyasar hal yang dirasakan orang tua lintas kelas.",
    tone: styles.groupToneNetral,
  },
};

// Rotasi warna pastel khas Fammi untuk kartu, dipilih per nomor kartu supaya "warna warni"
// tapi tetap lembut. Sengaja tanpa merah muda, merah dijaga cuma untuk penanda waspada.
const PASTELS = [styles.tlPastel1, styles.tlPastel2, styles.tlPastel3, styles.tlPastel4, styles.tlPastel5];

const PRIORITAS_LABEL = { tinggi: "Prioritas Tinggi", sedang: "Prioritas Sedang", rendah: "Prioritas Rendah" };

/** Satu kartu tindak lanjut: judul besar bernomor, klik untuk membuka detail dengan animasi. */
function AccordionCard({ n, row, pastelCls, open, onToggle }) {
  const prioLabel = PRIORITAS_LABEL[row.priority] ?? PRIORITAS_LABEL.rendah;
  return (
    <div className={`${styles.tlCard} ${pastelCls} ${open ? styles.tlCardOpen : ""}`}>
      <button type="button" className={styles.tlCardHead} onClick={onToggle} aria-expanded={open}>
        <span className={styles.tlCardNum}>{String(n).padStart(2, "0")}</span>
        <span className={styles.tlCardTitle}>{row.action}</span>
        <span className={styles.tlCardChevron} aria-hidden="true">⌄</span>
      </button>
      <div className={styles.tlCardReveal}>
        <div className={styles.tlCardRevealInner}>
          <div className={styles.tlCardMeta}>
            <span className={styles.tlCardPrio}>{prioLabel}</span>
            {row.trigger_desc && <span className={styles.tlCardTrigger}>{row.trigger_desc}</span>}
          </div>
          <div className={styles.tlCardDetail}>
            <TindakLanjutDetailBody item={row} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Kelompokkan ulang tindak_lanjut yang sudah disetujui jadi bucket tampilan
 * (reklasifikasi client-side, data/Gemini tidak berubah — lihat groupTindakLanjut).
 * `only` membatasi bucket mana yang dirender, supaya komponen yang sama bisa dipakai
 * terpisah di dua kategori besar (kelas-tied "baik"/"perlu_perhatian" masuk kategori
 * Kualitas Layanan Pendidikan; "lainnya" -- sekolah-wide, tidak terikat kelas -- masuk
 * kategori Citra Sekolah di Mata Orang Tua). Default: tampilkan ketiganya.
 *
 * Tiap kartu awalnya cuma judul besar; diklik baru terbuka detailnya dengan animasi.
 */
export default function TindakLanjutGrouped({ tindakLanjut, kelas, only }) {
  const [openIds, setOpenIds] = useState(() => new Set());
  const buckets = groupTindakLanjut(tindakLanjut, kelas);
  const bucketKeys = only || ["baik", "perlu_perhatian", "lainnya"];
  const totalShown = bucketKeys.reduce((sum, k) => sum + buckets[k].length, 0);

  if (!tindakLanjut || totalShown === 0) {
    return <p className={styles.emptyNote}>Belum ada tindak lanjut yang disetujui untuk kategori ini pada periode ini.</p>;
  }

  const toggle = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Nomor kartu berjalan menerus lintas bucket (01, 02, 03 ...), bukan reset per bucket.
  // Hitung offset awal tiap bucket di sini supaya JSX di bawah tidak menyimpan state mutable.
  const groups = [];
  let offset = 0;
  for (const k of bucketKeys) {
    const rows = buckets[k];
    if (!rows.length) continue;
    groups.push({ k, rows, start: offset });
    offset += rows.length;
  }

  return (
    <div className={styles.tlGroupedWrap}>
      {groups.map(({ k, rows, start }) => {
        const meta = BUCKET_META[k];
        return (
          <div className={styles.tlGroup} key={k}>
            <div className={`${styles.tlGroupHeader} ${meta.tone}`}>
              <p className={styles.tlGroupTitle}>{meta.title}</p>
              <p className={styles.tlGroupWhy}>{meta.why}</p>
            </div>
            <div className={styles.tlCardStack}>
              {rows.map((r, i) => {
                const n = start + i + 1;
                return (
                  <AccordionCard
                    key={r.id}
                    n={n}
                    row={r}
                    pastelCls={PASTELS[(n - 1) % PASTELS.length]}
                    open={openIds.has(r.id)}
                    onToggle={() => toggle(r.id)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

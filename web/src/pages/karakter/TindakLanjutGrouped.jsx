import FollowupCard from "../../components/FollowupCard";
import { groupTindakLanjut } from "./karakterMeta";
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

function toCardItem(r) {
  return { id: r.id, action: r.action, trigger: r.trigger_desc, module: "karakter", priority: r.priority, _raw: r };
}

function BucketGroup({ bucketKey, rows, onItemClick }) {
  if (!rows.length) return null;
  const meta = BUCKET_META[bucketKey];
  return (
    <div className={styles.tlGroup}>
      <div className={`${styles.tlGroupHeader} ${meta.tone}`}>
        <p className={styles.tlGroupTitle}>{meta.title}</p>
        <p className={styles.tlGroupWhy}>{meta.why}</p>
      </div>
      <div className={styles.tlGroupGrid}>
        {rows.map((r) => {
          const item = toCardItem(r);
          return (
            <FollowupCard
              key={item.id}
              action={item.action}
              trigger={item.trigger}
              module={item.module}
              priority={item.priority}
              onClick={onItemClick ? () => onItemClick(item) : undefined}
            />
          );
        })}
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
 */
export default function TindakLanjutGrouped({ tindakLanjut, kelas, onItemClick, only }) {
  const buckets = groupTindakLanjut(tindakLanjut, kelas);
  const bucketKeys = only || ["baik", "perlu_perhatian", "lainnya"];
  const totalShown = bucketKeys.reduce((sum, k) => sum + buckets[k].length, 0);

  if (!tindakLanjut || totalShown === 0) {
    return <p className={styles.emptyNote}>Belum ada tindak lanjut yang disetujui untuk kategori ini pada periode ini.</p>;
  }

  return (
    <div className={styles.tlGroupedWrap}>
      {bucketKeys.map((k) => (
        <BucketGroup key={k} bucketKey={k} rows={buckets[k]} onItemClick={onItemClick} />
      ))}
    </div>
  );
}

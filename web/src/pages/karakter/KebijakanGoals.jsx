import { useEffect } from "react";
import { useState } from "react";
import styles from "./KebijakanGoals.module.css";
import { KEBIJAKAN_KEPSEK } from "./dummyKebijakan";

const TERM_META = {
  short: { label: "Short-Term Goals", range: "1–3 Bulan ke Depan", who: "untuk Kepala Sekolah" },
  long: { label: "Long-Term Goals", range: "6 Bulan ke Depan", who: "untuk Pimpinan Sekolah" },
};

// Label audiens default (Kepsek). View lain (Wali Kelas/Yayasan) bisa menimpanya lewat prop `who`.
const DEFAULT_WHO = { short: TERM_META.short.who, long: TERM_META.long.who };

const TYPE_META = {
  perlu_perhatian: { label: "Perlu Perhatian", cardCls: "cardPerhatian", modalCls: "modalPerhatian" },
  pertahankan: { label: "Pertahankan", cardCls: "cardPertahankan", modalCls: "modalPertahankan" },
};

// Fokus kebijakan: sebagian tindak lanjut menyasar mutu layanan pendidikan,
// sebagian menyasar citra sekolah di mata orang tua.
const FOKUS_META = {
  mutu: { label: "Mutu Layanan", icon: "📈" },
  citra: { label: "Citra Sekolah", icon: "💬" },
};

// Satu tag gabungan dari tipe + fokus (bukan dua chip terpisah).
function comboLabel(type, fokus) {
  const f = FOKUS_META[fokus].label;
  return type === "pertahankan" ? `Pertahankan ${f}` : `${f} Perlu Perhatian`;
}

// perlu_perhatian selalu tampil lebih dulu (permintaan: prioritaskan yang perlu perhatian).
const TYPE_ORDER = { perlu_perhatian: 0, pertahankan: 1 };

/** manfaat bisa string lama atau objek anak/orang_tua/sekolah baru -- ratakan jadi baris teks. */
function formatManfaat(manfaat) {
  if (typeof manfaat === "string") return [manfaat];
  return [
    manfaat?.anak && `Untuk anak: ${manfaat.anak}`,
    manfaat?.orang_tua && `Untuk orang tua: ${manfaat.orang_tua}`,
    manfaat?.sekolah && `Untuk sekolah: ${manfaat.sekolah}`,
  ].filter(Boolean);
}

/** Satu langkah konkret bisa string lama atau objek aksi/waktu/kenapa baru -- jadi satu baris. */
function formatKonkretStep(s) {
  if (typeof s === "string") return s;
  return [s.aksi, s.waktu && `(${s.waktu})`, s.kenapa && `Kenapa: ${s.kenapa}`].filter(Boolean).join(" ");
}

/** Susun teks ringkas kartu untuk dibagikan ke WhatsApp lewat wa.me (jalan di desktop & HP). */
function shareToWhatsApp(k) {
  const teks = [
    `*${k.title}*`,
    `${comboLabel(k.type, k.fokus)} · ${TERM_META[k.term].range}`,
    ``,
    `*Mengapa ini perlu*`,
    `Dari data: ${k.mengapa_data}`,
    `Dari sisi anak & kebijakan: ${k.mengapa_perspektif}`,
    ``,
    `*Manfaat*`,
    ...formatManfaat(k.manfaat),
    ``,
    `*Langkah konkret*`,
    ...k.konkret.map((s, i) => `${i + 1}. ${formatKonkretStep(s)}`),
    ``,
    `— Rapor Karakter, Fammi Intelligence Report`,
  ].join("\n");
  window.open(`https://wa.me/?text=${encodeURIComponent(teks)}`, "_blank", "noopener,noreferrer");
}

/**
 * Kartu goal: warna tipe dipakai sebagai bidang penuh yang eye-catchy (kuning = perlu perhatian,
 * hijau = pertahankan), tanpa garis tepi tipis atau badge bulat. Chip kedua menandai fokusnya
 * (mutu layanan / citra sekolah). Bagian atas diklik untuk membuka detail, tombol share WhatsApp
 * berdiri sendiri di bawah tiap kartu.
 */
function GoalCard({ k, onOpen }) {
  return (
    <div className={`${styles.card} ${styles[TYPE_META[k.type].cardCls]}`}>
      <div className={styles.cardMain}>
        <span className={styles.cardIcon} aria-hidden="true">{k.icon}</span>
        <span className={styles.cardTag}>{comboLabel(k.type, k.fokus)}</span>
        <span className={styles.cardTitle}>{k.title}</span>
        {k.teaser && <span className={styles.cardTeaser}>{k.teaser}</span>}
      </div>
      <div className={styles.cardActions}>
        <button type="button" className={styles.cardDetailBtn} onClick={() => onOpen(k)}>
          <span className={styles.cardBtnIcon} aria-hidden="true">🔍</span>
          Lihat Detail
        </button>
        <button type="button" className={styles.cardShare} onClick={() => shareToWhatsApp(k)}>
          <span className={styles.cardBtnIcon} aria-hidden="true">↗</span>
          Share ke WhatsApp
        </button>
      </div>
    </div>
  );
}

/** Satu baris term: label besar di kiri (ala lampiran) + grid kartu putih di kanan. */
function TermRow({ term, items, who, onOpen }) {
  const meta = TERM_META[term];
  return (
    <div className={`${styles.termRow} ${styles[`term_${term}`]}`}>
      <div className={styles.termLabel}>
        <h3 className={styles.termTitle}>{meta.label}</h3>
        <span className={styles.termRange}>{meta.range}</span>
        <span className={styles.termWho}>{who}</span>
      </div>
      {items.length > 0 ? (
        <div className={styles.termGrid}>
          {items.map((k) => (
            <GoalCard key={k.id} k={k} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <p className={styles.termEmpty}>
          Belum ada rekomendasi {meta.label.toLowerCase()} untuk periode ini.
        </p>
      )}
    </div>
  );
}

/** Modal detail: membesar + berputar saat muncul, dengan tombol bagikan ke WhatsApp. */
function KebijakanDialog({ k, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${styles[TYPE_META[k.type].modalCls]}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className={styles.modalClose} onClick={onClose} aria-label="Tutup">✕</button>
        <div className={styles.modalHead}>
          <span className={styles.modalIcon} aria-hidden="true">{k.icon}</span>
          <span className={styles.modalKicker}>
            {comboLabel(k.type, k.fokus)} · {TERM_META[k.term].range}
          </span>
          <h3 className={styles.modalTitle}>{k.title}</h3>
        </div>
        <div className={styles.modalBody}>
          <section className={styles.modalSection}>
            <p className={styles.modalLabel}>Mengapa ini perlu</p>
            <div className={styles.modalWhyBlock}>
              <p className={styles.modalWhyTag}>📊 Dari data periode ini</p>
              <p className={styles.modalText}>{k.mengapa_data}</p>
            </div>
            <div className={styles.modalWhyBlock}>
              <p className={styles.modalWhyTag}>🌱 Dari sisi perkembangan anak & kebijakan sekolah</p>
              <p className={styles.modalText}>{k.mengapa_perspektif}</p>
            </div>
          </section>
          <section className={styles.modalSection}>
            <p className={styles.modalLabel}>Manfaatnya</p>
            {typeof k.manfaat === "string" ? (
              <p className={styles.modalText}>{k.manfaat}</p>
            ) : (
              <div className={styles.manfaatGrid}>
                {k.manfaat?.anak && (
                  <div className={styles.manfaatItem}>
                    <span className={styles.manfaatTag}>Untuk anak</span>
                    <p className={styles.modalText}>{k.manfaat.anak}</p>
                  </div>
                )}
                {k.manfaat?.orang_tua && (
                  <div className={styles.manfaatItem}>
                    <span className={styles.manfaatTag}>Untuk orang tua</span>
                    <p className={styles.modalText}>{k.manfaat.orang_tua}</p>
                  </div>
                )}
                {k.manfaat?.sekolah && (
                  <div className={styles.manfaatItem}>
                    <span className={styles.manfaatTag}>Untuk sekolah</span>
                    <p className={styles.modalText}>{k.manfaat.sekolah}</p>
                  </div>
                )}
              </div>
            )}
          </section>
          <section className={styles.modalSection}>
            <p className={styles.modalLabel}>Langkah konkret</p>
            <ol className={styles.modalSteps}>
              {k.konkret.map((s, i) => (
                <li key={i}>
                  {typeof s === "string" ? s : (
                    <div className={styles.konkretStep}>
                      <p className={styles.konkretAksi}>{s.aksi}</p>
                      {s.waktu && <p className={styles.konkretWaktu}>🕒 {s.waktu}</p>}
                      {s.kenapa && <p className={styles.konkretKenapa}>Kenapa: {s.kenapa}</p>}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>
        <button className={styles.shareBtn} onClick={() => shareToWhatsApp(k)}>
          <span className={styles.shareIcon} aria-hidden="true">↗</span>
          Bagikan ke WhatsApp
        </button>
      </div>
    </div>
  );
}

export default function KebijakanGoals({ data = KEBIJAKAN_KEPSEK, who = DEFAULT_WHO }) {
  const [active, setActive] = useState(null);
  const byTerm = (t) =>
    data.filter((k) => k.term === t).sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);

  return (
    <div className={styles.goals}>
      <TermRow term="short" items={byTerm("short")} who={who.short} onOpen={setActive} />
      <TermRow term="long" items={byTerm("long")} who={who.long} onOpen={setActive} />
      {active && <KebijakanDialog k={active} onClose={() => setActive(null)} />}
    </div>
  );
}

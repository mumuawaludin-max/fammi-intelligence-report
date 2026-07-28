import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { PaReveal } from "./PaReveal";
import { PaIconBadge } from "./paIconBadge";
import { PaDialog } from "./PaDialog";
import { PA_DOMAIN_META, PA_ESAI_PERTANYAAN } from "./paAssembler";
import tokens from "./paTokens.module.css";
import styles from "./PaRuangBacaEsai.module.css";

const DOMAIN_BY_KODE = new Map(PA_DOMAIN_META.map((d) => [d.kode, d]));

/** Tiga tingkat sinyal pembacaan dari sheet NARASI, dipetakan ke skala warna yang sama dengan
 * bagian 02 dan 03. `null` (belum dianotasi) sengaja dapat tone terpisah, bukan jatuh ke salah
 * satu dari tiga tingkat -- supaya jelas beda antara "sudah ditelaah, ternyata ringan" dan
 * "belum sempat ditelaah sama sekali". */
const SINYAL_TONE = {
  Prioritas: "perhatian",
  Pantau: "waspada",
  Pencegahan: "aman",
};

function teksPertanyaan(kode) {
  return PA_ESAI_PERTANYAAN[kode] || kode;
}

function labelDomain(kode) {
  return DOMAIN_BY_KODE.get(kode)?.label || kode || "Domain lain";
}

function hurufDomain(kode) {
  return DOMAIN_BY_KODE.get(kode)?.huruf || "?";
}

function jumlahKata(teks) {
  const bersih = String(teks || "").trim();
  return bersih ? bersih.split(/\s+/).length : 0;
}

/** Inisial pendek untuk avatar entri, urutan tampil saja (bukan identitas), A1, A2, ... */
function inisial(index) {
  return `A${index + 1}`;
}

/**
 * PaRuangBacaEsai -- ruang baca jawaban esai modul Perilaku Anak.
 *
 * Data asli (`pa_esai`) cuma menyimpan kode anonim, domain, kode pertanyaan, jawaban, dan
 * anotasi (tema/sinyal/saran/prioritas) -- TIDAK ada unit sekolah, kelas, atau jumlah kata siap
 * pakai seperti versi contoh awal. Jumlah kata dihitung ringan di sini dari teks jawabannya
 * sendiri (pemformatan tampilan, bukan penghitungan skor/status yang dilarang CLAUDE.md).
 * Anotasi bisa null kalau sheet NARASI belum diisi untuk baris itu -- ditampilkan jujur sebagai
 * "belum dianotasi", bukan disembunyikan atau dikosongkan diam-diam.
 *
 * Filter sengaja berdasarkan DOMAIN HEART (bukan tema bebas dari narasi) supaya daftarnya stabil
 * dan tidak bergantung ke konsistensi pengetikan tim narasi; tag tema tetap tampil di panel baca
 * untuk konteks tambahan.
 */
export function PaRuangBacaEsai({ data }) {
  const reduceMotion = useReducedMotion();
  const { statistik, entri } = data;

  const [cari, setCari] = useState("");
  const [domainAktif, setDomainAktif] = useState("semua");
  const [aktif, setAktif] = useState(0);
  const [panduanTerbuka, setPanduanTerbuka] = useState(false);

  const domainTersedia = useMemo(() => {
    const kode = [...new Set(entri.map((e) => e.domain).filter(Boolean))];
    return [{ id: "semua", label: "Semua" }, ...kode.map((k) => ({ id: k, label: labelDomain(k) }))];
  }, [entri]);

  const hasil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return entri.filter((e) => {
      const cocokDomain = domainAktif === "semua" || e.domain === domainAktif;
      if (!cocokDomain) return false;
      if (!q) return true;
      const kolam = [e.id, teksPertanyaan(e.pertanyaan_kode), e.jawaban, labelDomain(e.domain), ...(e.tema || [])];
      return kolam.join(" ").toLowerCase().includes(q);
    });
  }, [entri, cari, domainAktif]);

  const indeksAman = hasil.length ? Math.min(aktif, hasil.length - 1) : 0;
  const terpilih = hasil[indeksAman] || null;

  function pindah(delta) {
    if (!hasil.length) return;
    setAktif((prev) => {
      const dasar = Math.min(prev, hasil.length - 1);
      return (dasar + delta + hasil.length) % hasil.length;
    });
  }

  function pilihDomain(id) {
    setDomainAktif(id);
    setAktif(0);
  }

  return (
    <div className={`${tokens.scope} ${styles.wrap}`}>
      <PaReveal className={styles.head}>
        <div>
          <h3>Ruang baca jawaban esai</h3>
          <p>Baca suara siswa dalam konteksnya, lalu lihat tema, sinyal, dan saran tindak lanjut tanpa membuka identitas aslinya.</p>
        </div>
        <button type="button" className={styles.guideBtn} onClick={() => setPanduanTerbuka(true)}>
          Panduan membaca esai
        </button>
      </PaReveal>

      <PaReveal className={styles.statGrid} delay={0.04}>
        {statistik.map((s) => (
          <div className={styles.statCard} key={s.kode}>
            <p className={styles.statLabel}>{s.label}</p>
            <strong className={styles.statValue}>{s.nilai}</strong>
            <p className={styles.statDetail}>{s.detail}</p>
          </div>
        ))}
      </PaReveal>

      <PaReveal className={styles.layout} delay={0.06} amount={0.1}>
        <aside className={styles.sidebar}>
          <p className={styles.sidebarTitle}>Cari dalam jawaban</p>

          <label className={styles.searchField}>
            <PaIconBadge icon="cari" size="xs" tone="plain" className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Ketik kata kunci atau kode anonim"
              value={cari}
              onChange={(e) => { setCari(e.target.value); setAktif(0); }}
            />
          </label>

          <p className={styles.filterLabel}>Filter berdasarkan domain</p>
          <div className={styles.chips}>
            {domainTersedia.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`${styles.chip} ${domainAktif === d.id ? styles.chipActive : ""}`}
                aria-pressed={domainAktif === d.id}
                onClick={() => pilihDomain(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>

          <p className={styles.hasilCount}>
            {hasil.length > 0 ? `${hasil.length} jawaban ditemukan` : "Tidak ada jawaban yang cocok"}
          </p>

          <div className={styles.entriList}>
            {hasil.map((e, i) => {
              const active = i === indeksAman;
              const tone = e.prioritas ? (SINYAL_TONE[e.prioritas] || "waspada") : "muted";
              return (
                <button
                  key={`${e.id}-${e.pertanyaan_kode}`}
                  type="button"
                  className={`${styles.entri} ${active ? styles.entriActive : ""}`}
                  aria-pressed={active}
                  onClick={() => setAktif(i)}
                >
                  <span className={styles.entriTop}>
                    <span className={styles.entriId}>
                      {e.id} <span className={styles.entriDomain}>· {hurufDomain(e.domain)}</span>
                    </span>
                    <span className={`${styles.status} ${styles[`status_${tone}`]}`}>
                      {e.prioritas || "Belum dianotasi"}
                    </span>
                  </span>
                  <strong className={styles.entriJudul}>{teksPertanyaan(e.pertanyaan_kode)}</strong>
                  <span className={styles.entriCuplik}>{e.jawaban}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className={styles.reader}>
          {terpilih ? (
            /* Ganti jawaban = remount berkunci (key={id}) dengan initial/animate, BUKAN
               AnimatePresence mode="wait". Pola yang sama dipakai ScDimensiRingkasan saat
               mengganti panel "artinya". mode="wait" menahan mount jawaban baru sampai animasi
               keluar jawaban lama selesai; kalau tab sedang di latar belakang animasinya tidak
               pernah jalan dan pembaca terjebak melihat jawaban lama. */
            <motion.article
              key={`${terpilih.id}-${terpilih.pertanyaan_kode}`}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.readerHead}>
                <span className={styles.avatar}>{inisial(indeksAman)}</span>
                <div className={styles.readerIdent}>
                  <strong>Kode Anonim {terpilih.id}</strong>
                  <p>{labelDomain(terpilih.domain)} · {jumlahKata(terpilih.jawaban)} kata</p>
                </div>
                <div className={styles.navBtns}>
                  <button type="button" className={styles.navBtn} onClick={() => pindah(-1)} aria-label="Jawaban sebelumnya">←</button>
                  <button type="button" className={styles.navBtn} onClick={() => pindah(1)} aria-label="Jawaban berikutnya">→</button>
                </div>
              </div>

              <p className={styles.pertanyaan}>Pertanyaan: {teksPertanyaan(terpilih.pertanyaan_kode)}</p>
              <p className={styles.jawaban}>{terpilih.jawaban}</p>

              <div className={styles.insightGrid}>
                <div className={styles.insightCard}>
                  <p className={styles.insightLabel}>Tema yang teridentifikasi</p>
                  {terpilih.tema.length > 0 ? (
                    <div className={styles.temaTags}>
                      {terpilih.tema.map((t) => (
                        <span className={styles.temaTag} key={t}>{t}</span>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.insightText}>Belum dianotasi.</p>
                  )}
                </div>

                <div className={styles.insightCard}>
                  <p className={styles.insightLabel}>Sinyal pembacaan</p>
                  <p className={styles.insightText}>{terpilih.sinyal || "Sinyal pembacaan belum ditulis untuk jawaban ini."}</p>
                </div>
              </div>

              <div className={`${styles.insightCard} ${styles.saranCard}`}>
                <p className={styles.insightLabel}>Saran tindak lanjut</p>
                <p className={styles.saranText}>{terpilih.saran || "Saran tindak lanjut belum ditulis untuk jawaban ini."}</p>
              </div>

              <p className={styles.readerFoot}>
                Identitas asli siswa tidak ditampilkan. Sinyal dan saran di atas bahan diskusi wali
                kelas, bukan diagnosis.
              </p>
            </motion.article>
          ) : (
            <div className={styles.kosong}>
              <PaIconBadge icon="esai" size="md" tone="purple" />
              <p className={styles.kosongJudul}>Belum ada jawaban yang cocok</p>
              <p className={styles.kosongPesan}>Ubah kata kunci pencarian atau pilih domain lain.</p>
            </div>
          )}
        </div>
      </PaReveal>

      {panduanTerbuka && (
        <PaDialog
          eyebrow="Ruang baca jawaban esai"
          title="Panduan membaca esai"
          subtitle="Empat hal yang perlu dipegang sebelum menyimpulkan apa pun dari jawaban terbuka siswa."
          onClose={() => setPanduanTerbuka(false)}
        >
          <ol className={styles.panduanList}>
            <li>
              <strong>Baca utuh, jangan potongan.</strong> Satu kalimat yang dicuplik hampir selalu
              kehilangan konteksnya. Jawaban di ruang ini sengaja ditampilkan penuh.
            </li>
            <li>
              <strong>Pisahkan cerita dari kesimpulan.</strong> Tema dan sinyal adalah pembacaan atas
              teks, bukan penilaian atas anaknya.
            </li>
            <li>
              <strong>Jangan mencari identitas.</strong> Kode anonim dipakai supaya isi cerita bisa
              dibahas terbuka tanpa membuat siswa menyesal sudah jujur.
            </li>
            <li>
              <strong>Tindak lanjuti polanya, bukan satu kasus.</strong> Kalau tema yang sama muncul
              berulang di banyak jawaban, itu sinyal untuk kebijakan kelas atau sekolah.
            </li>
          </ol>
        </PaDialog>
      )}
    </div>
  );
}

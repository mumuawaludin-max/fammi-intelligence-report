import { useState } from "react";
import { PaReveal } from "./PaReveal";
import { PaSectionHeading } from "./PaSectionHeading";
import { PaInsightBanner } from "./PaInsightBanner";
import { PaIconBadge } from "./paIconBadge";
import { PaDialog } from "./PaDialog";
import { PaRichText } from "./PaRichText";
import tokens from "./paTokens.module.css";
import styles from "./PaPerluPerhatian.module.css";

function angka(n) {
  return (n ?? 0).toLocaleString("id-ID");
}

function angkaSatuDesimal(n) {
  return (n ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

/** Skor 1-10 gabungan (rata-rata lintas domain, "Intensitas rata-rata") dipetakan ke tiga
 * tingkat secara kasar untuk mewarnai kartu ringkas -- INI SATU-SATUNYA tempat ambang skor
 * universal dipakai, karena kartu ini murni rata-rata gabungan, bukan skor satu domain
 * tertentu yang punya ambang sendiri. Jangan pakai fungsi ini untuk skor per-siswa per-domain
 * (lihat toneStatus di bawah, dan catatan panjang kenapa keduanya beda). */
function toneSkorRataRata(skor) {
  if (skor >= 8) return "perhatian";
  if (skor >= 6) return "waspada";
  return "aman";
}

/** status "Aman"/"Perlu Perhatian"/"Perlu Diwaspadai" (SUDAH final dari data, per domain) ->
 * tone warna badge. Ambang skor yang membedakan "Perlu Perhatian" dari "Perlu Diwaspadai"
 * TERNYATA beda-beda tiap domain (mis. Hiperaktivitas: perhatian=skor 6, diwaspadai=skor 7-10;
 * Tolong Menolong: perhatian=skor 5, diwaspadai=skor 6-8) -- masing-masing subskala SDQ punya
 * distribusi skornya sendiri. Karena itu badge skor per siswa di dialog "Lihat daftar nama"
 * HARUS memakai `status` yang sudah final, BUKAN menebak ulang dari angka skor mentah lewat
 * satu ambang yang sama untuk semua domain (itu bug versi sebelumnya -- pernah mewarnai siswa
 * Tolong Menolong skor 8 sebagai "aman" padahal status aslinya "Perlu Diwaspadai"). */
function toneStatus(status) {
  if (status === "Perlu Diwaspadai") return "perhatian";
  if (status === "Perlu Perhatian") return "waspada";
  return "aman";
}

/** `nilai` indikator = skor rata-rata mentah (skala 0-2, konvensi SDQ per-item: 0 "Tidak Benar",
 * 1 "Agak Benar", 2 "Benar"), BUKAN persentase 0-100 -- diverifikasi dari data asli (rentang
 * nyata 0,32 sampai 1,18 di seluruh 25 indikator). Sengaja TIDAK diberi label "rendah/tinggi":
 * beberapa indikator berupa perilaku positif ("Berpikir Sebelum Bertindak", "Disukai Teman") di
 * mana skor RENDAH yang jadi perhatian, sementara indikator lain negatif ("Gelisah", "Cemas") di
 * mana skor TINGGI yang jadi perhatian -- arahnya berbeda per indikator dan tidak bisa ditebak
 * dari labelnya saja tanpa data arah skala tiap item, jadi ditampilkan apa adanya (angka + skala)
 * daripada menebak kata sifat yang bisa salah arah. */
function angkaDuaDesimal(n) {
  return (n ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function NilaiRingkas({ s }) {
  if (s.tipe === "skor") {
    const tone = toneSkorRataRata(s.nilai);
    return (
      <span className={styles[`skor_${tone}`]}>
        {angkaSatuDesimal(s.nilai)}
        <span className={styles.statSkala}>/10</span>
      </span>
    );
  }
  if (s.tipe === "persen") {
    return <>{angkaSatuDesimal(s.nilai)}%</>;
  }
  return <>{angka(s.nilai)}</>;
}

/** Blok satu bagian narasi, dengan teks jujur kalau isinya belum ditulis -- daripada
 * mengosongkan diam-diam saat tim narasi belum sempat mengisi sheet NARASI. */
function BlokAnalisis({ title, isi, kosongTeks }) {
  const daftar = Array.isArray(isi) ? isi.filter(Boolean) : [];
  return (
    <div className={styles.analisisBlock}>
      <p className={styles.blockTitle}>{title}</p>
      {typeof isi === "string" && isi ? (
        <p className={styles.blockText}><PaRichText text={isi} /></p>
      ) : daftar.length > 0 ? (
        <ul className={styles.blockList}>
          {daftar.map((x) => <li key={x}><PaRichText text={x} /></li>)}
        </ul>
      ) : (
        <p className={styles.blockGapNote}>{kosongTeks}</p>
      )}
    </div>
  );
}

/**
 * PaPerluPerhatian -- bagian 03. Lima kartu domain (termasuk Tolong Menolong, dengan status
 * "butuh penguatan" yang tetap -- lihat catatan panjang di paAssembler.js soal kenapa domain
 * ini sekarang ikut ditampilkan di sini, beda dari rancangan pertama modul ini yang
 * mengecualikannya sepenuhnya).
 *
 * Daftar 5 indikator teratas per domain, `nilai`, dan daftar nama semuanya angka nyata dari
 * pa_lembaga/pa_siswa. Kalau scope sudah difilter ke satu unit, daftar indikatornya TETAP dari
 * data seluruh sekolah (file sumber tidak memecah indikator per unit) -- itu ditandai jelas
 * lewat catatan kecil di bawah daftarnya, bukan disembunyikan diam-diam.
 */
export function PaPerluPerhatian({ data, unitLabel }) {
  const [dialogNama, setDialogNama] = useState(null);
  const [dialogAnalisis, setDialogAnalisis] = useState(null);

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <PaSectionHeading
        title="Prioritas dan tindak lanjut"
        subtitle="Bagian ini mengubah hasil asesmen menjadi antrean kerja yang dapat dipantau oleh yayasan dan unit sekolah."
        aside={unitLabel}
      />

      <PaInsightBanner teks={data.insight_utama} />

      <PaReveal className={styles.statGrid} delay={0.02}>
        {data.ringkas.map((s) => (
          <div className={`${styles.statCard} ${s.sorot ? styles.statCardSorot : ""}`} key={s.kode}>
            <p className={styles.statLabel}>{s.label}</p>
            <strong className={styles.statValue}><NilaiRingkas s={s} /></strong>
            <p className={styles.statDetail}>{s.detail}</p>
          </div>
        ))}
      </PaReveal>

      <div className={styles.list}>
        {data.domain.map((d, i) => (
          <PaReveal className={styles.card} delay={i * 0.04} amount={0.12} key={d.kode}>
            <div className={styles.cardTop}>
              <div className={styles.identitas}>
                <span className={styles.huruf}>{d.huruf}</span>
                <div>
                  <p className={styles.domainLabel}>{d.label}</p>
                  <p className={styles.domainStatus}>{d.status}</p>
                </div>
              </div>

              {d.perilaku.length > 0 ? (
                <ol className={styles.perilakuList}>
                  {d.perilaku.map((p) => (
                    <li className={styles.perilaku} key={p.label}>
                      <div className={styles.perilakuTop}>
                        <span className={styles.rank}>{p.rank}</span>
                        <span className={styles.perilakuLabel}>{p.label}</span>
                      </div>

                      {/* Dua angka BEDA, dilabeli eksplisit dan TIDAK dicampur jadi satu baris
                          seperti sebelumnya. "Siswa perlu perhatian" (jumlah+persen dari total
                          sekolah) jadi angka utama karena paling langsung ditindaklanjuti. "Skor
                          rata-rata indikator" (nilai) ditampilkan apa adanya sebagai info sekunder
                          TANPA kata sifat rendah/tinggi -- lihat catatan panjang di atas kenapa. */}
                      <div className={styles.perilakuStats}>
                        <div className={styles.perilakuStatBlock}>
                          <span className={styles.perilakuStatLabel}>Siswa perlu perhatian</span>
                          <span className={styles.perilakuStatValue}>
                            {angka(p.jumlah)} siswa
                            {p.persen != null && (
                              <span className={styles.perilakuStatQual}>sekitar {angkaSatuDesimal(p.persen)}% dari total siswa</span>
                            )}
                          </span>
                        </div>
                        {p.nilai != null && (
                          <div className={styles.perilakuStatBlock}>
                            <span className={styles.perilakuStatLabel}>Skor rata-rata indikator</span>
                            <span className={`${styles.perilakuStatValue} ${styles.perilakuStatValueMuted}`}>
                              {angkaDuaDesimal(p.nilai)}
                              <span className={styles.perilakuStatQual}>skala 0–2</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={styles.gapNote}>Rincian indikator belum tersedia untuk domain ini periode ini.</p>
              )}

              <div className={styles.total}>
                <strong className={styles.totalValue}>{angka(d.jumlah)} siswa</strong>
                <p className={styles.totalPersen}>{d.persen}% responden</p>
              </div>
            </div>

            {d.indikatorLintasUnit && (
              <p className={styles.lintasUnitNote}>
                Rincian indikator di atas mencakup seluruh sekolah (belum dipecah per unit); jumlah dan persentase siswa tetap khusus {unitLabel}.
              </p>
            )}

            {d.definisi && <p className={styles.cardDefinisi}><PaRichText text={d.definisi} /></p>}

            <div className={styles.cardActions}>
              <button type="button" className={styles.analisisBtn} onClick={() => setDialogAnalisis(d)}>
                Baca analisis lengkap
              </button>
              <button type="button" className={styles.daftarBtn} onClick={() => setDialogNama(d)}>
                Lihat daftar nama
              </button>
            </div>
          </PaReveal>
        ))}
      </div>

      {dialogNama && (
        <PaDialog
          eyebrow={`Domain ${dialogNama.label}`}
          title="Daftar nama untuk ditelaah"
          subtitle={`${angka(dialogNama.jumlah)} siswa masuk antrean domain ini. Daftar menampilkan skor tertinggi lebih dulu.`}
          onClose={() => setDialogNama(null)}
          size="lg"
        >
          <div className={styles.dialogHead}>
            <span>Nama siswa</span>
            <span>Unit</span>
            <span>Kelas</span>
            <span className={styles.dialogSkorHead}>Skor</span>
          </div>

          {dialogNama.siswa.length > 0 ? (
            <ol className={styles.siswaList}>
              {dialogNama.siswa.map((s, i) => {
                const tone = toneStatus(s.status);
                return (
                  <li className={styles.siswaRow} key={`${s.nama}-${i}`}>
                    <span className={styles.siswaNama}>
                      <span className={styles.siswaIndex}>{i + 1}.</span>
                      {s.nama}
                    </span>
                    <span className={styles.siswaMeta}>{s.unit}</span>
                    <span className={styles.siswaMeta}>{s.kelas}</span>
                    <span className={`${styles.siswaSkor} ${styles[`skor_${tone}`]}`}>
                      <PaIconBadge icon="peringatan" size="xs" tone={tone} />
                      {s.skor}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className={styles.gapNote}>Tidak ada siswa tercatat untuk domain dan cakupan ini.</p>
          )}

          <p className={styles.dialogNote}>
            Daftar ini hanya terbuka untuk peran yang berhak menindaklanjuti. Skor tinggi berarti
            perilaku muncul lebih sering, bukan diagnosis.
          </p>
        </PaDialog>
      )}

      {dialogAnalisis && (
        <PaDialog
          eyebrow={`Domain ${dialogAnalisis.label}`}
          title="Analisis dan rekomendasi lengkap"
          subtitle={`Interpretasi data dan langkah tindak lanjut untuk domain ${dialogAnalisis.label} periode ini.`}
          onClose={() => setDialogAnalisis(null)}
          size="lg"
        >
          <div className={styles.analisisIntro}>
            <p className={styles.analisisEyebrow}>Apa itu {dialogAnalisis.label}?</p>
            <p className={styles.analisisDefinisi}><PaRichText text={dialogAnalisis.definisi} /></p>
            {dialogAnalisis.ciri_umum?.length > 0 && (
              <ul className={styles.analisisCiri}>
                {dialogAnalisis.ciri_umum.map((c) => <li key={c}><PaRichText text={c} /></li>)}
              </ul>
            )}
          </div>

          <div className={styles.analisisGrid}>
            <BlokAnalisis
              title="Interpretasi Data"
              isi={dialogAnalisis.analisis?.interpretasi}
              kosongTeks="Interpretasi belum ditulis untuk domain ini periode ini."
            />
            <BlokAnalisis
              title="Kemungkinan Penyebab"
              isi={dialogAnalisis.analisis?.kemungkinan_penyebab}
              kosongTeks="Kemungkinan penyebab belum ditulis untuk domain ini periode ini."
            />
            <BlokAnalisis
              title="Rekomendasi Bertahap"
              isi={dialogAnalisis.analisis?.rekomendasi}
              kosongTeks="Rekomendasi belum ditulis untuk domain ini periode ini."
            />
            <BlokAnalisis
              title="Tanda Keberhasilan"
              isi={dialogAnalisis.analisis?.tanda_keberhasilan}
              kosongTeks="Tanda keberhasilan belum ditulis untuk domain ini periode ini."
            />
          </div>

          <p className={styles.dialogNote}>
            Interpretasi dan rekomendasi di atas bahan diskusi bersama guru BK, wali kelas, dan
            psikolog Fammi, bukan diagnosis atau vonis atas seorang siswa.
          </p>
        </PaDialog>
      )}
    </section>
  );
}

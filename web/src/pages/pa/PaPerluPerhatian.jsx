import { useState } from "react";
import { PaReveal } from "./PaReveal";
import { PaSectionHeading } from "./PaSectionHeading";
import { PaBar } from "./PaBar";
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

// CATATAN soal `nilai` indikator (pa_lembaga.indikator[].nilai): field itu SENGAJA tidak lagi
// ditampilkan. Skalanya tidak konsisten antar-unggahan (satu berkas memakai rata-rata mentah
// 0-2 ala SDQ per-item, unggahan lain memakai 0-100), dan arah bacanya berbeda-beda per
// indikator tergantung apakah nama indikatornya dibingkai positif ("Disukai Teman") atau negatif
// ("Tidak Disukai Teman") -- jadi angka itu tidak bisa dibaca pimpinan tanpa penjelasan panjang,
// dan menampilkannya justru membingungkan. Yang ditampilkan sekarang cuma jumlah + persen siswa,
// dua angka yang arah bacanya selalu sama. paAssembler.js masih menyalurkan `nilai`/`skalaLabel`
// kalau suatu saat dibutuhkan lagi.

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

      <div className={styles.list}>
        {data.domain.map((d, i) => (
          <PaReveal className={styles.card} delay={i * 0.04} amount={0.12} key={d.kode}>
            {/* Kepala kartu: identitas domain + total, satu baris ringkas. Rincian indikator
                turun ke bloknya sendiri di bawah, bukan disejajarkan di kolom tengah seperti
                versi sebelumnya -- itu yang bikin kartunya tinggi dan sulit dipindai. */}
            <div className={styles.cardTop}>
              <div className={styles.identitas}>
                <span className={styles.huruf}>{d.huruf}</span>
                <div>
                  <p className={styles.domainLabel}>{d.label}</p>
                  <p className={styles.domainStatus}>{d.status}</p>
                </div>
              </div>

              <div className={styles.total}>
                <strong className={styles.totalValue}>{angka(d.jumlah)} siswa perlu perhatian</strong>
                <p className={styles.totalPersen}>{d.persen}% dari total siswa dinilai</p>
              </div>
            </div>

            {d.perilaku.length > 0 ? (
              <div className={styles.perilakuBlok}>
                {/* Judul eksplisit -- sebelumnya lima indikator ini muncul tanpa kepala apa pun,
                    jadi tidak jelas hubungannya dengan domain di sebelahnya. */}
                <p className={styles.perilakuJudul}>
                  Indikator penyebab masalah {d.label}
                </p>
                <p className={styles.perilakuSubjudul}>
                  {d.perilaku.length} perilaku yang paling banyak tercatat dan membuat siswa masuk kategori {d.label}. Angka di kanan = berapa siswa yang menunjukkan perilaku itu.
                </p>

                <ol className={styles.perilakuList}>
                  {d.perilaku.map((p) => (
                    <li className={styles.perilaku} key={p.label}>
                      <span className={styles.rank}>{p.rank}</span>
                      <span className={styles.perilakuLabel}>{p.label}</span>
                      <PaBar
                        persen={p.persen}
                        tone="perhatian"
                        size="sm"
                        className={styles.perilakuBar}
                        label={`${p.label}: ${p.jumlah} siswa, ${p.persen} persen dari total`}
                      />
                      <span className={styles.perilakuAngka}>
                        <strong>{angka(p.jumlah)} siswa</strong>
                        {p.persen != null && <span>{angkaSatuDesimal(p.persen)}%</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <p className={styles.gapNote}>Rincian indikator belum tersedia untuk domain ini periode ini.</p>
            )}

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
                Lihat Daftar Nama Prioritas Perlu Perhatian
              </button>
            </div>
          </PaReveal>
        ))}
      </div>

      {dialogNama && (
        <PaDialog
          eyebrow={`Domain ${dialogNama.label}`}
          title="Daftar Nama Prioritas Perlu Perhatian"
          subtitle={`${angka(dialogNama.jumlah)} siswa perlu perhatian domain ini, sama dengan angka di kartu. Daftar menampilkan skor tertinggi lebih dulu.`}
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
          subtitle={`Kemungkinan penyebab dan langkah tindak lanjut untuk domain ${dialogAnalisis.label} periode ini.`}
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
            Penjelasan dan rekomendasi di atas bahan diskusi bersama guru BK, wali kelas, dan
            psikolog Fammi, bukan diagnosis atau vonis atas seorang siswa.
          </p>
        </PaDialog>
      )}
    </section>
  );
}

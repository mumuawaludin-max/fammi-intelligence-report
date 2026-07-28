import { Smiley, SmileySad } from "@phosphor-icons/react";
import { PaReveal } from "./PaReveal";
import { PaSectionHeading } from "./PaSectionHeading";
import { PaIconBadge } from "./paIconBadge";
import { PaBar, PaStackBar } from "./PaBar";
import { PaRuangBacaEsai } from "./PaRuangBacaEsai";
import tokens from "./paTokens.module.css";
import styles from "./PaStatistikSiswa.module.css";

/** Warna tiap tingkat emosi diambil dari token PA, urutannya positif -> negatif, ditutup abu-abu
 * netral untuk siswa yang tidak menjawab pertanyaan emosi sama sekali. */
const WARNA_EMOSI = {
  sangat_positif: "var(--pa-emosi-1)",
  positif: "var(--pa-emosi-2)",
  netral: "var(--pa-emosi-3)",
  negatif: "var(--pa-emosi-4)",
  sangat_negatif: "var(--pa-emosi-5)",
  kosong: "var(--pa-muted-2)",
};

function angka(n) {
  return (n ?? 0).toLocaleString("id-ID");
}

/**
 * PaStatistikSiswa -- bagian 01. Menjawab satu pertanyaan sebelum pembaca masuk ke hasil:
 * siapa saja yang datanya terkumpul, dan bagaimana suasana hati mereka secara garis besar.
 * Ruang baca jawaban esai (PaRuangBacaEsai) ditutup di paling bawah bagian ini -- dipindah dari
 * bagian 04 Survey atas permintaan pemilik produk, supaya pembaca sudah dapat gambaran siapa
 * respondennya sebelum masuk ke suara mereka sendiri.
 */
export function PaStatistikSiswa({ data, esai, unitLabel }) {
  const { total, laki, perempuan, sebaran, emosi } = data;

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <PaSectionHeading
        title="Siapa yang datanya terkumpul"
        subtitle="Siapa saja yang datanya terkumpul pada periode ini, dan bagaimana suasana emosi yang mereka laporkan."
        aside={unitLabel}
      />

      <div className={`${styles.topRow} ${!laki || !perempuan ? styles.topRowSolo : ""}`}>
        <PaReveal className={styles.totalCard}>
          <PaIconBadge icon="siswa" size="md" tone="dark" />
          <div>
            <strong className={styles.totalValue}>{angka(total)} Siswa</strong>
            <p className={styles.totalLabel}>Total input data</p>
          </div>
        </PaReveal>

        {/* Sebaran jenis kelamin cuma ada di baris agregat lembaga (lihat catatan kepala
            paAssembler.js) -- saat scope sudah difilter ke satu unit, datanya tidak tersedia dan
            kartu ini disembunyikan sepenuhnya, bukan ditampilkan kosong. */}
        {laki && perempuan && (
          /* Dua sisi cermin dengan blok teks berlebar TETAP dan sama (--gender-text di CSS).
              Kalau lebar blok teks dibiarkan ikut isinya, "38% 184 Laki-Laki" dan "Perempuan 300
              62%" beda panjang, sisa ruang untuk batang jadi tidak sama kiri-kanan, dan proporsi
              38:62 terbaca miring. */
          <PaReveal className={styles.genderCard} delay={0.06}>
            <div className={`${styles.genderSide} ${styles.genderSideLeft}`}>
              <PaBar
                persen={laki.persen}
                tone="laki"
                align="right"
                className={styles.genderTrack}
                label={`Laki-laki ${laki.persen} persen`}
              />
              <span className={styles.genderText}>
                <strong className={styles.pctLaki}>{laki.persen}%</strong>
                <span className={styles.genderCount}>{angka(laki.jumlah)}</span>
                <span className={styles.genderLabel}>Laki-Laki</span>
              </span>
            </div>

            <div className={styles.genderIcons}>
              <PaIconBadge icon="laki" size="sm" tone="laki" />
              <PaIconBadge icon="perempuan" size="sm" tone="perempuan" />
            </div>

            <div className={`${styles.genderSide} ${styles.genderSideRight}`}>
              <span className={styles.genderText}>
                <span className={styles.genderLabel}>Perempuan</span>
                <span className={styles.genderCount}>{angka(perempuan.jumlah)}</span>
                <strong className={styles.pctPerempuan}>{perempuan.persen}%</strong>
              </span>
              <PaBar
                persen={perempuan.persen}
                tone="perempuan"
                className={styles.genderTrack}
                label={`Perempuan ${perempuan.persen} persen`}
              />
            </div>
          </PaReveal>
        )}
      </div>

      {/* Sebaran per unit hanya berarti saat scope "semua unit" -- saat sudah difilter ke satu
          unit, daftar ini akan berisi satu baris 100% yang tidak menambah informasi. */}
      {sebaran && sebaran.length > 0 && (
        <PaReveal className={styles.card} delay={0.04}>
          <div className={styles.cardHead}>
            <h3>Data Siswa</h3>
            <span className={styles.headMeta}>Persentase</span>
            <span className={styles.headMeta}>Total</span>
          </div>

          <div className={styles.rows}>
            {sebaran.map((s) => (
              <div className={styles.row} key={s.kode}>
                <span className={styles.rowLabel}>{s.label}</span>
                <PaBar persen={s.persen} tone="primary" className={styles.rowBar} label={`${s.label} ${s.persen} persen`} />
                <span className={styles.rowPct}>{s.persen}%</span>
                <span className={styles.rowTotal}>{angka(s.total)} Siswa</span>
              </div>
            ))}
          </div>
        </PaReveal>
      )}

      <PaReveal className={styles.card} delay={0.06}>
        {/* Dua pill ekspresif untuk kutub ujung skala emosi (Sangat Positif/Sangat Negatif) --
            pengganti legenda lima titik warna yang sebelumnya di sini. Tiga tingkat tengah
            (Positif/Netral/Negatif) tidak perlu pill sendiri, sudah terbaca dari teks berwarna
            di tiap baris di bawah; dua kutub inilah yang butuh penanda paling jelas dan "lucu"
            sesuai instruksi pemilik produk, meniru wireframe-original.png. */}
        {/* Grid dua kolom PERSIS sama dengan .emosiRow di bawah (label unit | area batang) --
            supaya pill Positif jatuh tepat di atas ujung kiri batang dan pill Negatif tepat di
            atas ujung kanannya, bukan sekadar ujung kiri/kanan KARTU (posisi itu meleset karena
            kolom label unit ikut mengambil ruang di kiri). */}
        <div className={styles.emosiHead}>
          <h3>Emosi Siswa</h3>
          <div className={styles.emosiPoles}>
            <span className={`${styles.emosiPill} ${styles.emosiPillPositif}`}>
              <span className={styles.emosiPillIcon} aria-hidden="true">
                <Smiley weight="bold" />
              </span>
              Sangat Positif
            </span>
            <span className={`${styles.emosiPill} ${styles.emosiPillNegatif}`}>
              Sangat Negatif
              <span className={styles.emosiPillIcon} aria-hidden="true">
                <SmileySad weight="fill" />
              </span>
            </span>
          </div>
        </div>

        <div className={styles.emosiRows}>
          {emosi.map((e) => (
            <div className={styles.emosiRow} key={e.kode}>
              <div className={styles.emosiUnit}>
                <p className={styles.emosiUnitLabel}>{e.label}</p>
                <p className={styles.emosiUnitNote}>Persentase emosi</p>
              </div>
              <div className={styles.emosiBody}>
                <PaStackBar
                  size="lg"
                  segmen={e.segmen.map((s) => ({ ...s, warna: WARNA_EMOSI[s.kode] }))}
                  label={`Sebaran emosi ${e.label}`}
                />
                <div className={styles.emosiValues}>
                  {e.segmen.map((s) => (
                    <span className={styles.emosiValue} key={s.kode} style={{ color: WARNA_EMOSI[s.kode] }}>
                      {s.label} <strong>{s.persen}%</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </PaReveal>

      <PaRuangBacaEsai data={esai} />
    </section>
  );
}

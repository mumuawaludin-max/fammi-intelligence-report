import { useState } from "react";
import { LwReveal } from "./LwReveal";
import { warnaKategori, latarKategori } from "./lwMeta";
import tokens from "./lwTokens.module.css";
import styles from "./LwPrioritas.module.css";

const TINGKAT = {
  segera: {
    judul: "Dukungan segera",
    warna: "var(--lw-protek-waspada)",
    latar: "var(--lw-protek-waspada-bg)",
    ket: "Skor total di bawah kategori Baik, atau ada dimensi yang masuk Waspada. Perlu percakapan pribadi dalam dua pekan ini.",
    daftarSub: "Tangani lebih dulu. Percakapan dilakukan kepala sekolah, bukan lewat pengumuman umum.",
  },
  pendampingan: {
    judul: "Perlu pendampingan",
    warna: "var(--lw-protek-perlu-perhatian)",
    latar: "var(--lw-protek-perlu-perhatian-bg)",
    ket: "Skor total masih Baik, tetapi ada satu atau lebih dimensi yang berada di bawah kategori Baik.",
    daftarSub: "Bisa ditangani lewat program kelompok, tidak harus percakapan satu per satu.",
  },
  stabil: {
    judul: "Stabil",
    warna: "var(--lw-protek-baik)",
    latar: "var(--lw-protek-baik-bg)",
    ket: "Seluruh dimensi berada pada kategori Baik. Yang dibutuhkan menjaga kondisi, bukan intervensi.",
    daftarSub: "Kelompok ini sumber praktik baik. Sebagian bisa diminta jadi mentor bagi rekan yang perlu pendampingan.",
  },
};
const URUTAN_TINGKAT = ["segera", "pendampingan", "stabil"];

function inisial(nama) {
  return nama.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

/**
 * LwPrioritas -- layar ketiga: siapa yang perlu dibantu lebih dulu dan apa langkahnya.
 * Guru dikelompokkan tiga tingkat berdasarkan mendesaknya dukungan, bukan sekadar diurutkan
 * skornya, supaya pimpinan tahu mana yang butuh percakapan pribadi dan mana yang cukup lewat
 * program kelompok.
 */
export function LwPrioritas({ laporan, onPilihGuru }) {
  const { guru, tindakLanjut, meta } = laporan;
  const [tingkat, setTingkat] = useState("segera");
  const [unit, setUnit] = useState("semua");

  const unitList = Array.from(new Set(guru.map((g) => g.unit)));
  const meta_ = TINGKAT[tingkat];

  const terpilih = guru
    .filter((g) => g.tingkat === tingkat)
    .filter((g) => unit === "semua" || g.unit === unit);

  return (
    <div className={`${tokens.scope} ${styles.layar}`}>
      <div className={styles.judulBlok}>
        <h1 className={styles.judul}>Siapa yang perlu dibantu, dan apa langkahnya</h1>
        <p className={styles.subjudul}>
          Guru dikelompokkan berdasarkan seberapa mendesak dukungannya. Kelompok paling mendesak
          ditangani lebih dulu, tanpa menunggu periode asesmen berikutnya.
        </p>
      </div>

      <div className={styles.tierGrid}>
        {URUTAN_TINGKAT.map((id) => {
          const t = TINGKAT[id];
          const jumlah = guru.filter((g) => g.tingkat === id).length;
          const persen = Math.round((jumlah / (guru.length || 1)) * 100);
          const aktif = id === tingkat;
          return (
            <LwReveal key={id} delay={0.02}>
              <button
                type="button"
                className={`${styles.tierKartu} ${aktif ? styles.tierKartuAktif : ""}`}
                aria-pressed={aktif}
                onClick={() => setTingkat(id)}
                style={aktif ? { borderColor: t.warna, background: t.latar } : undefined}
              >
                <div className={styles.tierHead}>
                  <span className={styles.tierNama}>
                    <span className={styles.tierTitik} style={{ background: t.warna }} />
                    {t.judul}
                  </span>
                  <span className={styles.tierPersen}>{persen}% dari {guru.length} guru</span>
                </div>
                <p className={styles.tierAngka} style={{ color: aktif ? t.warna : "var(--lw-heading)" }}>
                  {jumlah} <span>guru</span>
                </p>
                <p className={styles.tierKet}>{t.ket}</p>
                <div className={styles.tierTrack}>
                  <span style={{ width: `${persen}%`, background: t.warna }} />
                </div>
              </button>
            </LwReveal>
          );
        })}
      </div>

      <LwReveal className={styles.tabelKartu} delay={0.04}>
        <div className={styles.tabelHead}>
          <div>
            <h2 className={styles.tabelJudul}>{meta_.judul}: {terpilih.length} guru</h2>
            <p className={styles.tabelSub}>{meta_.daftarSub}</p>
          </div>
          <div className={styles.filterUnit}>
            {["semua", ...unitList].map((u) => (
              <button
                key={u}
                type="button"
                className={`${styles.filterChip} ${unit === u ? styles.filterChipAktif : ""}`}
                aria-pressed={unit === u}
                onClick={() => setUnit(u)}
              >
                {u === "semua" ? "Semua" : u.replace(" Fammi", "")}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.tabelWrap}>
          <div className={`${styles.baris} ${styles.barisHead}`}>
            <span>Nama guru</span>
            <span>Jenjang</span>
            <span>Dimensi di bawah Baik</span>
            <span className={styles.kanan}>Skor total</span>
            <span className={styles.kanan}>Arah {meta.periodeList.length} periode</span>
          </div>

          {terpilih.map((g) => {
            const t = TINGKAT[g.tingkat];
            const naik = g.selisih > 0;
            const datar = g.selisih === 0;
            const warnaTren = naik ? "var(--lw-protek-baik)" : datar ? "var(--lw-muted-2)" : "var(--lw-protek-waspada)";
            const nilaiTren = g.tren.map((x) => x.total);
            const lo = Math.min(...nilaiTren) - 3;
            const hi = Math.max(...nilaiTren) + 3;
            const sy = (v) => 20 - ((v - lo) / (hi - lo || 1)) * 16;
            const lebar = 50 / Math.max(1, g.tren.length - 1);
            return (
              <button
                key={g.id}
                type="button"
                className={styles.baris}
                onClick={() => onPilihGuru(g.id)}
              >
                <span className={styles.namaSel}>
                  <span className={styles.avatar} style={{ background: t.latar, color: t.warna }}>{inisial(g.nama)}</span>
                  <span>
                    <span className={styles.nama}>{g.nama}</span>
                    <span className={styles.tierLabel} style={{ color: t.warna }}>{t.judul}</span>
                  </span>
                </span>
                <span className={styles.unitSel}>{g.unit}</span>
                <span className={styles.chipWrap}>
                  {g.lemah.length > 0 ? g.lemah.map((d) => (
                    <span key={d.kode} className={styles.dimChip} style={{
                      background: latarKategori(d.kategori),
                      color: warnaKategori(d.kategori),
                    }}>
                      {d.label} <span className={styles.dimChipNilai}>{d.nilai}</span>
                    </span>
                  )) : (
                    <span className={styles.dimChip} style={{
                      background: "var(--lw-protek-baik-bg)",
                      color: "var(--lw-status-aligned-ink)",
                    }}>Seluruh dimensi Baik</span>
                  )}
                </span>
                <span className={`${styles.totalSel} ${styles.kanan}`}>
                  <span className={styles.totalAngka} style={{
                    color: g.kategoriTotal === "Baik" ? "var(--lw-protek-baik)" : "var(--lw-protek-waspada)",
                  }}>{g.total}</span>
                  <span className={styles.totalKat} style={{
                    color: g.kategoriTotal === "Baik" ? "var(--lw-protek-baik)" : "var(--lw-protek-waspada)",
                  }}>{g.kategoriTotal}</span>
                </span>
                <span className={`${styles.trenSel} ${styles.kanan}`}>
                  <svg width="54" height="24" viewBox="0 0 54 24" aria-hidden="true">
                    <polyline
                      points={g.tren.map((x, i) => `${i * lebar},${sy(x.total)}`).join(" ")}
                      fill="none" stroke={warnaTren} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    />
                    <circle cx="50" cy={sy(nilaiTren[nilaiTren.length - 1])} r="3" fill={warnaTren} />
                  </svg>
                  <span className={styles.trenAngka} style={{ color: warnaTren }}>
                    {g.selisih > 0 ? "+" : ""}{g.selisih}
                  </span>
                </span>
              </button>
            );
          })}

          {terpilih.length === 0 && (
            <p className={styles.kosong}>Tidak ada guru pada kelompok dan jenjang ini.</p>
          )}
        </div>
        <p className={styles.tabelNota}>Klik satu baris untuk membuka laporan individu guru tersebut.</p>
      </LwReveal>

      {tindakLanjut.length > 0 && (
        <div>
          <h2 className={styles.seksiJudul}>Rencana tindak lanjut yang disarankan</h2>
          <p className={styles.seksiSub}>
            Disusun psikolog Fammi dari temuan periode ini, sudah melewati gerbang persetujuan sebelum tayang.
          </p>
          <div className={styles.aksiGrid}>
            {tindakLanjut.map((a, i) => (
              <LwReveal className={styles.aksiKartu} delay={i * 0.04} key={a.id}>
                <div className={styles.aksiHead}>
                  <span className={styles.aksiTag} style={{
                    background: a.tipe === "pertahankan" ? "var(--lw-protek-baik-bg)" : "var(--lw-protek-perlu-perhatian-bg)",
                    color: a.tipe === "pertahankan" ? "var(--lw-status-aligned-ink)" : "var(--lw-protek-perlu-perhatian)",
                  }}>{a.dimensi}</span>
                  {a.waktu && <span className={styles.aksiWaktu}>{a.waktu}</span>}
                </div>
                <h3 className={styles.aksiJudul}>{a.judul}</h3>
                {a.teaser && <p className={styles.aksiTeks}>{a.teaser}</p>}
                {a.mengapa && (
                  <div className={styles.aksiBlok}>
                    <p className={styles.aksiBlokJudul}>Mengapa prioritas ini</p>
                    <p className={styles.aksiBlokTeks}>{a.mengapa}</p>
                  </div>
                )}
                <div className={styles.aksiKaki}>
                  {a.ukuran ? (
                    <>
                      <p className={styles.aksiBlokJudul}>Ukuran keberhasilan</p>
                      <p className={styles.aksiUkuran}>{a.ukuran}</p>
                    </>
                  ) : (
                    <p className={styles.aksiKosong}>Ukuran keberhasilan belum ditetapkan untuk program ini.</p>
                  )}
                  {a.sasaran && (
                    <span className={styles.aksiSasaran}>Menyasar <strong>{a.sasaran}</strong></span>
                  )}
                </div>
                {a.catatan && <p className={styles.aksiCatatan}>{a.catatan}</p>}
              </LwReveal>
            ))}
          </div>
        </div>
      )}

      <p className={styles.catatanKaki}>
        Daftar nama di halaman ini hanya terbuka untuk pimpinan yayasan dan kepala sekolah yang berwenang
        menindaklanjuti. Kategori berasal dari asesmen yang sudah diskoring psikolog Fammi dan bukan diagnosis klinis.
      </p>
    </div>
  );
}

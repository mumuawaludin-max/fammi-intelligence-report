import { useEffect, useState } from "react";
import { useCsData } from "./useCsData";
import { statusPanel, ProgressBar, SectionTitle } from "../components/Bits";
import { CS_EMOSI_WARNA } from "../yptMeta";
import EsaiBlok from "./EsaiBlok";
import TestimoniTab from "./TestimoniTab";
import styles from "./Citra.module.css";

export default function CitraSekolahPage({ session, periode, tab }) {
  // Testimoni cuma ditarik saat tabnya dibuka. Tiga tab lain tidak memakainya sama sekali, dan
  // ikut menunggu 14 ribuan baris beserta teksnya adalah penyebab utama tab ini terasa lambat.
  const { loading, error, loadingTestimoni, errorTestimoni, data, ambilEsai } = useCsData(
    session, periode, tab === "testimoni",
  );
  const [kategoriEsai, setKategoriEsai] = useState({});

  // Kategori esai default per tab = kategori terbanyak, dipasang begitu datanya siap.
  // "keberhasilan" TIDAK ikut -- tab itu tidak punya blok esai (hal_disyukuri tidak punya kolom
  // teks bebas terpisah, dan Figma 2a memang tidak menggambar blok esai untuk tab ini).
  useEffect(() => {
    if (!data) return;
    setKategoriEsai((prev) => ({
      dukungan: prev.dukungan || data.dukungan[0]?.nama || null,
      emosi: prev.emosi || data.emosi[0]?.nama || null,
    }));
  }, [data]);

  // Tab Testimoni SENGAJA tidak ikut pemeriksaan kosong bersama di bawah. Sumbernya tabel lain
  // yang ditarik terpisah dan belakangan, jadi memakai ukuran yang sama akan menampilkan "belum
  // ada data" selagi testimoninya justru masih dalam perjalanan. Tab itu mengurus status
  // memuat/kosong/galatnya sendiri di dalam TestimoniTab.
  if (tab !== "testimoni") {
    const status = statusPanel({
      loading,
      error,
      kosong: !loading && !error && data && data.keberhasilan.length === 0
        && data.dukungan.length === 0 && data.emosi.length === 0,
      judul: "Belum ada data Citra Sekolah",
      pesan: "Refleksi orang tua untuk periode ini belum diimpor lewat modul Karakter.",
    });
    if (status) return status;
  }

  if (tab === "keberhasilan") {
    return (
      <>
        <SectionTitle>Keberhasilan Sekolah di Mata Orangtua</SectionTitle>
        <div className={styles.grid3}>
          {data.keberhasilan.map((k) => (
            <div key={k.nama} className={styles.kartu}>
              {/* TODO pixel-perfect: ganti dengan ikon ilustratif per kategori yang diekspor dari
                  Figma node 84-525 (download_assets) begitu kuota Figma tersedia. */}
              <div className={styles.kartuIkon} aria-hidden="true">◈</div>
              <p className={styles.kartuNama}>{k.nama}</p>
              <p className={styles.kartuAngka}>
                <span className={styles.kartuPersen}>{k.persen == null ? "—" : `${k.persen}%`}</span>
                <span className={styles.kartuDot}>•</span>
                {k.jumlah.toLocaleString("id-ID")} siswa
              </p>
              {k.perJenjang.map((j) => (
                <div key={j.id} className={styles.jenjangBaris}>
                  <div className={styles.jenjangBarisTop}>
                    <span>{j.label}</span>
                    <span className={styles.jenjangBarisNilai}>
                      {j.persen == null ? "—" : `${j.persen}%`}
                    </span>
                  </div>
                  <ProgressBar value={j.persen} varian="red" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </>
    );
  }

  if (tab === "dukungan") {
    return (
      <>
        <SectionTitle>Bentuk Dukungan</SectionTitle>
        <div className={styles.grid4}>
          {data.dukungan.map((d) => (
            <button
              key={d.nama}
              type="button"
              className={`${styles.ringKartu} ${kategoriEsai.dukungan === d.nama ? styles.ringKartuActive : ""}`}
              onClick={() => setKategoriEsai((p) => ({ ...p, dukungan: d.nama }))}
            >
              <span className={styles.ringTop}>
                <span className={styles.kartuIkon} style={{ margin: 0 }} aria-hidden="true">◕</span>
                <span>
                  <span className={styles.ringNilai}>{d.persen == null ? "—" : `${d.persen}%`}</span>
                  <br />
                  <span className={styles.ringSub}>{d.jumlah.toLocaleString("id-ID")} siswa</span>
                </span>
              </span>
              <p className={styles.ringNama}>{d.nama}</p>
            </button>
          ))}
        </div>

        <EsaiBlok
          judul="Top Essay Orangtua"
          topik="dukungan"
          kategoriList={data.dukungan}
          kategoriAktif={kategoriEsai.dukungan}
          onGantiKategori={(v) => setKategoriEsai((p) => ({ ...p, dukungan: v }))}
          ambilEsai={ambilEsai}
        />
      </>
    );
  }

  if (tab === "emosi") {
    return (
      <>
        <SectionTitle>Total Responden Penilaian Kualitatif</SectionTitle>
        <div className={styles.grid5}>
          {data.emosi.map((row) => {
            const warna = CS_EMOSI_WARNA[row.nama] || "var(--ypt-ink-3)";
            return (
              <div key={row.nama} className={styles.sentimenKartu}>
                <div className={styles.sentimenHead} style={{ background: warna }}>
                  <span aria-hidden="true">{row.icon || "☺"}</span>
                  {row.nama}
                </div>
                <div className={styles.sentimenBody}>
                  <p className={styles.sentimenTotal} style={{ color: warna }}>
                    {row.persen == null ? "—" : `${row.persen}%`}
                  </p>
                  <p className={styles.sentimenSub}>
                    {row.jumlah.toLocaleString("id-ID")} siswa
                  </p>
                  {row.perJenjang.map((j) => (
                    <div key={j.id} className={styles.jenjangBaris}>
                      <div className={styles.jenjangBarisTop}>
                        <span>{j.label}</span>
                        <span style={{ color: warna }}>{j.persen == null ? "—" : `${j.persen}%`}</span>
                      </div>
                      <div style={{ height: 6, background: "var(--ypt-track)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${j.persen || 0}%`, background: warna, borderRadius: 999 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <EsaiBlok
          judul="Top Essay Perasaan"
          topik="emosi"
          kategoriList={data.emosi}
          kategoriAktif={kategoriEsai.emosi}
          onGantiKategori={(v) => setKategoriEsai((p) => ({ ...p, emosi: v }))}
          ambilEsai={ambilEsai}
          aksen={CS_EMOSI_WARNA[kategoriEsai.emosi]}
        />
      </>
    );
  }

  // ── Tab Testimoni ────────────────────────────────────────────────────────────────────────
  // Isinya cukup besar dan punya state saringannya sendiri, jadi tinggal di berkas terpisah.
  if (loadingTestimoni) return statusPanel({ loading: true });

  return (
    <TestimoniTab
      data={data}
      galat={errorTestimoni}
      jumlahSekolahNaungan={(session?.schools || []).length}
    />
  );
}

import { useEffect, useMemo, useState } from "react";
import { ProgressBar, SectionTitle, Persen } from "../components/Bits";
import PetaProvinsi from "../components/PetaProvinsi";
import { agregatProvinsi, kotaTanpaProvinsi } from "../yptMeta";
import JenjangCards from "./JenjangCards";
import styles from "./Rapor.module.css";

/**
 * Tab Rangkuman menu Rapor Karakter (Figma 84-287).
 * Susunan: hero nilai total + insight, kartu per jenjang, peta wilayah + detail provinsi,
 * lalu Top 3 sekolah per jenjang.
 */
export default function RangkumanTab({ data, onLihatSekolah }) {
  const [provinsiAktif, setProvinsiAktif] = useState(null);

  // Data per kota digabung jadi per provinsi di sini, bukan di dalam komponen peta. Panel Detail
  // Sekolah di sebelahnya membaca objek yang sama persis, jadi keduanya dijamin tidak pernah
  // menampilkan angka yang berbeda untuk wilayah yang sama.
  const provinsi = useMemo(() => agregatProvinsi(data.kota), [data.kota]);
  const kotaBelumDipetakan = useMemo(() => kotaTanpaProvinsi(data.kota), [data.kota]);

  // Provinsi aktif default = yang pertama punya data. Dipasang lewat effect (bukan nilai awal
  // useState) karena daftarnya baru terisi setelah data periode ini selesai dirakit, dan berubah
  // setiap kali pengguna ganti periode.
  useEffect(() => {
    if (provinsi.length === 0) { setProvinsiAktif(null); return; }
    setProvinsiAktif((prev) => (
      prev && provinsi.some((p) => p.nama === prev) ? prev : provinsi[0].nama
    ));
  }, [provinsi]);

  const wilayahTerpilih = provinsi.find((p) => p.nama === provinsiAktif) || null;

  // Insight hero: dua aspek dengan nilai tertinggi se-yayasan, dirangkai jadi kalimat.
  // Ini penyajian, bukan analisis -- tidak ada Gemini di jalur baca (butir CLAUDE.md).
  const aspekTeratas = [...data.aspekYayasan]
    .filter((a) => a.nilai != null)
    .sort((a, b) => b.nilai - a.nilai)
    .slice(0, 2);

  return (
    <>
      <div className={styles.heroRow}>
        <div className={styles.heroTotal}>
          <p className={styles.heroTotalLabel}>Nilai Rata-rata Total<br />Pencapaian Karakter</p>
          <p className={styles.heroTotalValue}>
            {data.totalYayasan == null ? "—" : `${data.totalYayasan}%`}
          </p>
        </div>

        <div className={styles.heroInsight}>
          <span className={styles.heroBadge} aria-hidden="true">👍</span>
          {aspekTeratas.length >= 2 ? (
            <p className={styles.heroInsightText}>
              Karakter Telkom terbaik diseluruh jenjang adalah{" "}
              <strong>{aspekTeratas[0].nama}</strong> dan <strong>{aspekTeratas[1].nama}</strong>
            </p>
          ) : aspekTeratas.length === 1 ? (
            <p className={styles.heroInsightText}>
              Karakter Telkom terbaik diseluruh jenjang adalah{" "}
              <strong>{aspekTeratas[0].nama}</strong>
            </p>
          ) : (
            <p className={styles.heroInsightText}>
              Belum ada data karakter untuk periode ini
            </p>
          )}
        </div>
      </div>

      <SectionTitle>Pencapaian Karakter per Jenjang</SectionTitle>
      <JenjangCards jenjang={data.jenjang} />

      <div className={styles.mapRow}>
        <div>
          <SectionTitle>Pencapaian Karakter per Provinsi</SectionTitle>
          <PetaProvinsi
            provinsi={provinsi}
            aktif={provinsiAktif}
            onPilih={setProvinsiAktif}
            kotaTanpaProvinsi={kotaBelumDipetakan}
          />
        </div>

        <div>
          <SectionTitle>Detail Sekolah</SectionTitle>
          <div className={styles.detailCard}>
            {wilayahTerpilih ? (
              <>
                <p className={styles.detailLabel}>Pencapaian di Provinsi</p>
                <p className={styles.detailKota}>{wilayahTerpilih.label}</p>
                <p className={styles.detailNilai}>
                  {wilayahTerpilih.nilai == null ? "—" : `${wilayahTerpilih.nilai}%`}
                </p>
                <p className={styles.detailLabel}>
                  {wilayahTerpilih.jumlahSekolah} sekolah di {wilayahTerpilih.kotaList.join(", ")}
                </p>

                {/* Maksimal tiga sekolah di panel; sisanya lewat "Lihat selengkapnya" yang
                    memindahkan pengguna ke tabel lengkap tab Penilaian per Sekolah. */}
                {wilayahTerpilih.sekolah.slice(0, 3).map((s) => (
                  <div key={s.sekolah_id} className={styles.detailItem}>
                    <p className={styles.detailItemNama}>{s.nama}</p>
                    <div className={styles.detailItemRow}>
                      <span className={styles.detailItemNilai}>
                        <Persen value={s.rata_total} />
                      </span>
                      <ProgressBar value={s.rata_total} />
                    </div>
                  </div>
                ))}

                {wilayahTerpilih.sekolah.length > 3 && (
                  <button type="button" className={styles.detailLink} onClick={onLihatSekolah}>
                    Lihat selengkapnya <span aria-hidden="true">›</span>
                  </button>
                )}
              </>
            ) : (
              <p className={styles.detailLabel}>
                Belum ada sekolah yang kotanya terisi. Isi kolom kota lewat Admin CMS supaya
                sebarannya muncul di peta.
              </p>
            )}
          </div>
        </div>
      </div>

      <SectionTitle>Sekolah dengan Pencapaian Terbaik</SectionTitle>
      <div className={styles.topRow}>
        {data.jenjang.map((g) => {
          const top3 = data.sekolah
            .filter((s) => s.grup === g.id && s.rata_total != null)
            .sort((a, b) => b.rata_total - a.rata_total)
            .slice(0, 3);
          return (
            <div key={g.id} className={styles.topCard}>
              <div className={styles.topHead}>
                <span className={styles.topHeadLeft}>Top 3</span>
                <span className={styles.topHeadRight}>{g.label}</span>
              </div>
              {top3.length === 0 ? (
                <p className={styles.jenjangMeta}>Belum ada data periode ini.</p>
              ) : (
                top3.map((s) => (
                  <div key={s.sekolah_id} className={styles.topItem}>
                    <p className={styles.topItemNama}>{s.nama}</p>
                    <div className={styles.topItemRow}>
                      <span className={styles.topItemNilai}>{s.rata_total}%</span>
                      <ProgressBar value={s.rata_total} varian="red" />
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

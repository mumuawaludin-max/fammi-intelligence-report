import { useEffect, useState } from "react";
import { useKpData } from "./useKpData";
import { statusPanel, ProgressBar, SectionTitle } from "../components/Bits";
import { KP_PERAN } from "../yptMeta";
import styles from "./Kepuasan.module.css";

/** Baris bintang. skalaMax menentukan berapa bintang penuh (10 untuk skor total, 5 untuk metrik). */
function Bintang({ nilai, skalaMax }) {
  if (nilai == null) return <span className={styles.kosong}>—</span>;
  const penuh = Math.round(nilai);
  return (
    <span className={styles.bintangBaris} aria-label={`${nilai.toFixed(2)} dari ${skalaMax}`}>
      {Array.from({ length: skalaMax }, (_, i) => (
        <span key={i} className={i < penuh ? styles.bintangIsi : styles.bintangKosong}>★</span>
      ))}
    </span>
  );
}

/** 8.666 -> "8,67". Koma desimal sesuai format Indonesia, seperti di Figma. */
function angka(n, desimal = 2) {
  if (n == null) return "—";
  return n.toFixed(desimal).replace(".", ",");
}

export default function SurveyKepuasanPage({ session, periode, tab }) {
  const { loading, error, data } = useKpData(session, periode);
  const [peranAktif, setPeranAktif] = useState(KP_PERAN[0].id);
  const [sekolahAktif, setSekolahAktif] = useState(null);

  const sekolahList = data ? data.sekolahUntukPeran(peranAktif) : [];

  useEffect(() => {
    setSekolahAktif((prev) => {
      if (prev && sekolahList.some((s) => s.sekolah_id === prev)) return prev;
      return sekolahList[0]?.sekolah_id || null;
    });
  }, [peranAktif, data]);

  const status = statusPanel({
    loading,
    error,
    kosong: !loading && !error && data && data.totalResponden === 0,
    judul: "Belum ada respons survei",
    pesan: "Data survei ditarik dari spreadsheet respons form. Jalankan sinkronisasi di Admin CMS, atau pilih periode lain.",
  });
  if (status) return status;

  const ringkasanPeran = data.perPeran.find((p) => p.id === peranAktif);
  const labelPeran = KP_PERAN.find((p) => p.id === peranAktif)?.label || "";

  // Kutipan insight: peran dengan skor tertinggi. Kalimatnya template di frontend, bukan Gemini --
  // jalur baca FIR tidak pernah memanggil Gemini (CLAUDE.md).
  const peranTerpuas = [...data.perPeran]
    .filter((p) => p.skorTotal != null && p.jumlah > 0)
    .sort((a, b) => b.skorTotal - a.skorTotal)[0];

  if (tab === "kualitatif") {
    const detail = sekolahList.find((s) => s.sekolah_id === sekolahAktif) || null;

    return (
      <>
        <SectionTitle>Total Responden Penilaian Kualitatif</SectionTitle>
        <div className={styles.respondenRow}>
          {data.perPeran.map((p) => (
            <div key={p.id} className={styles.respondenKartu}>
              <div className={styles.respondenIkon} aria-hidden="true">👤</div>
              <p className={styles.respondenPeran}>{p.label}</p>
              <p className={styles.respondenJumlah}>{p.jumlah} orang</p>
            </div>
          ))}
        </div>

        <div className={styles.duaKolom}>
          <div>
            <SectionTitle>Pilih Sekolah</SectionTitle>
            <div className={styles.panel}>
              <div className={styles.chipRow}>
                {KP_PERAN.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`${styles.chip} ${peranAktif === p.id ? styles.chipActive : ""}`}
                    onClick={() => setPeranAktif(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {sekolahList.length === 0 ? (
                <p className={styles.kosong}>Belum ada responden dengan peran ini pada periode terpilih.</p>
              ) : sekolahList.map((s) => (
                <button
                  key={s.sekolah_id}
                  type="button"
                  className={`${styles.sekolahItem} ${sekolahAktif === s.sekolah_id ? styles.sekolahItemActive : ""}`}
                  onClick={() => setSekolahAktif(s.sekolah_id)}
                >
                  <span className={styles.sekolahMain}>
                    <span className={styles.sekolahNama}>{s.nama}</span>
                    <span className={styles.sekolahRow}>
                      <span className={styles.sekolahSkor}>{angka(s.skorTotal)} dari 10</span>
                      <ProgressBar value={s.skorTotal == null ? null : s.skorTotal * 10} varian="red" />
                    </span>
                  </span>
                  <span className={styles.sekolahGo} aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle>Detail Penilaian</SectionTitle>

            {!detail ? (
              <div className={styles.panel}>
                <p className={styles.kosong}>Pilih satu sekolah untuk melihat detailnya.</p>
              </div>
            ) : (
              <>
                <div className={styles.detailStatRow}>
                  <div className={styles.detailStat}>
                    <p className={styles.detailStatLabel}>Total Kepuasan</p>
                    <p className={styles.detailStatValue}>
                      {angka(detail.skorTotal)}
                      <span className={styles.detailStatSuffix}>dari 10</span>
                    </p>
                  </div>
                  <div className={styles.detailStat}>
                    <p className={styles.detailStatLabel}>Rata-rata Penilaian</p>
                    <p className={styles.detailStatValue}>
                      {angka(rataMetrik(detail))}
                      <span className={styles.detailStatSuffix}>dari 5</span>
                    </p>
                  </div>
                </div>

                {detail.statusBaca.length > 0 && (
                  <div className={styles.blok}>
                    <p className={styles.blokJudul}><span aria-hidden="true">📖</span> Sudah membaca laporan</p>
                    {detail.statusBaca.map((s) => (
                      <span key={s.nama} className={styles.pill}>
                        {s.nama} <span className={styles.pillJumlah}>{s.jumlah}</span>
                      </span>
                    ))}
                  </div>
                )}

                {detail.tindakLanjut.length > 0 && (
                  <div className={styles.blok}>
                    <p className={styles.blokJudul}><span aria-hidden="true">✅</span> Tindak lanjut setelah membaca</p>
                    {detail.tindakLanjut.map((s) => (
                      <span key={s.nama} className={styles.pill}>
                        {s.nama} <span className={styles.pillJumlah}>{s.jumlah}</span>
                      </span>
                    ))}
                  </div>
                )}

                <div className={styles.blok}>
                  <p className={styles.blokJudul}><span aria-hidden="true">👍</span> Hal yang paling disukai dari Rapor Karakter Fammi</p>
                  {detail.esaiDisukai.length === 0 ? (
                    <p className={styles.kosong}>Belum ada jawaban terisi.</p>
                  ) : detail.esaiDisukai.map((t, i) => (
                    <p key={i} className={styles.blokTeks}>{t}</p>
                  ))}
                </div>

                <div className={styles.blok}>
                  <p className={styles.blokJudul}><span aria-hidden="true">💡</span> Saran atau kritik untuk peningkatan kualitas</p>
                  {detail.esaiSaran.length === 0 ? (
                    <p className={styles.kosong}>Belum ada jawaban terisi.</p>
                  ) : detail.esaiSaran.map((t, i) => (
                    <p key={i} className={styles.blokTeks}>{t}</p>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Tab Rangkuman ────────────────────────────────────────────────────────────────────────
  return (
    <>
      <SectionTitle>Skala Kepuasan</SectionTitle>

      <div className={styles.chipRow}>
        {KP_PERAN.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`${styles.chip} ${peranAktif === p.id ? styles.chipActive : ""}`}
            onClick={() => setPeranAktif(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className={styles.rangkumanRow}>
        <div className={styles.skorKartu}>
          {/* TODO pixel-perfect: ganti kotak ini dengan ilustrasi yang diekspor dari Figma
              node 84-1718 (download_assets) begitu kuota Figma tersedia. */}
          <div className={styles.skorIlustrasi} aria-hidden="true">📊</div>
          <p className={styles.skorJudul}>Skala Kepuasan {labelPeran}</p>
          <p className={styles.skorSub}>terhadap Rapor Karakter Fammi</p>

          {ringkasanPeran.jumlah === 0 ? (
            <p className={styles.kosong}>Belum ada responden dengan peran ini pada periode terpilih.</p>
          ) : (
            <>
              <div className={styles.skorAngka}>
                <span className={styles.skorAngkaBesar}>{angka(ringkasanPeran.skorTotal)}</span>
                <span className={styles.skorAngkaKecil}>dari 10</span>
              </div>
              <Bintang nilai={ringkasanPeran.skorTotal} skalaMax={10} />
            </>
          )}
        </div>

        <div className={styles.metrikList}>
          {ringkasanPeran.metrik.map((m) => (
            <div key={m.id} className={styles.metrikItem}>
              {/* TODO pixel-perfect: ikon per metrik diekspor dari Figma node 84-1718. */}
              <span className={styles.metrikIkon} aria-hidden="true">◈</span>
              <span className={styles.metrikLabel}>{m.label}</span>
              <span className={styles.metrikNilai}>{angka(m.nilai)}</span>
              <span className={styles.metrikDari}>/ 5.0</span>
              <span className={styles.metrikBintang}>
                <Bintang nilai={m.nilai} skalaMax={5} />
              </span>
            </div>
          ))}
        </div>
      </div>

      <SectionTitle>Perbandingan Skala Kepuasan Keseluruhan</SectionTitle>
      <div className={styles.bandingKartu}>
        {data.perPeran.map((p) => (
          <div key={p.id} className={styles.bandingBaris}>
            <span className={styles.bandingPeran}>{p.label}</span>
            <span className={styles.bandingOrang}>{p.jumlah} orang</span>
            <span>
              <span className={styles.bandingSkor}>{angka(p.skorTotal)}</span>
              <span className={styles.bandingSuffix}>dari 10 merasa puas</span>
            </span>
            <span className={styles.bandingBar}>
              <ProgressBar value={p.skorTotal == null ? null : p.skorTotal * 10} />
            </span>
          </div>
        ))}
      </div>

      {peranTerpuas && (
        <div className={styles.kutipan}>
          <span className={styles.kutipanMark} aria-hidden="true">❝</span>
          <p className={styles.kutipanTeks}>
            <strong>{peranTerpuas.label}</strong> adalah pihak yang paling mendapatkan manfaat dari
            Rapor Karakter Fammi, dengan skor <strong>{angka(peranTerpuas.skorTotal)} dari 10</strong>{" "}
            dari {peranTerpuas.jumlah} responden pada periode ini.
          </p>
        </div>
      )}
    </>
  );
}

/** Rata-rata seluruh metrik satu kelompok, skala 5. */
function rataMetrik(ringkasan) {
  const nilai = ringkasan.metrik.map((m) => m.nilai).filter((n) => n != null);
  if (nilai.length === 0) return null;
  return nilai.reduce((a, b) => a + b, 0) / nilai.length;
}

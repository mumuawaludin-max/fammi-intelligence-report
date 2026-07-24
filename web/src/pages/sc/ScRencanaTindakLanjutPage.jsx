import { KESEJAHTERAAN_INFO } from "./scMeta";
import styles from "./ScRencanaTindakLanjutPage.module.css";

function formatScore(value) {
  return value == null ? null : Math.round(value);
}

/**
 * Cari data skor untuk `terkait` (rencana_aksi[].terkait, teks bebas) di ketiga bagian laporan.
 * Budaya punya pasangan saat_ini/harapan/gap lengkap (RadarBudayaPoint) -- gap-nya vs HARAPAN
 * staf sendiri. Kesejahteraan tidak punya konsep "harapan staf" di data (cuma nilai + kategori,
 * lihat catatan sama di useScData.js), jadi gap-nya di sini dihitung vs INDEKS gabungan orang itu
 * sendiri (nilai - indeks) -- bukan skor baru, cuma selisih dua angka final yang sudah ada,
 * pola sama dengan "vs indeks Anda" yang sudah dipakai versi laporan individu sebelumnya. Profil
 * organisasi harapan/gap-nya OPSIONAL (hanya terisi kalau importer sempat menghitungnya).
 */
function cariFokusData(terkait, bagianBudaya, bagianKesejahteraan, bagianProfilOrganisasi) {
  if (!terkait) return null;

  const budaya = (bagianBudaya?.chart_data || []).find((d) => d.tipe === terkait);
  if (budaya) {
    const gapRow = (bagianBudaya?.tabel_gap || []).find((g) => g.label === terkait);
    return { label: terkait, saatIni: budaya.saat_ini, harapan: budaya.harapan, gap: gapRow?.nilai_gap, sumber: "budaya" };
  }

  const kes = (bagianKesejahteraan?.chart_data || []).find((k) => k.label === terkait || KESEJAHTERAAN_INFO[k.kode]?.label === terkait);
  if (kes) {
    const indeks = bagianKesejahteraan?.indeks;
    const gap = indeks != null ? Math.round(kes.nilai - indeks) : undefined;
    return { label: KESEJAHTERAAN_INFO[kes.kode]?.label || kes.label, saatIni: kes.nilai, harapan: undefined, gap, gapVsIndeks: true, sumber: "kesejahteraan" };
  }

  const org = (bagianProfilOrganisasi?.chart_data || []).find((d) => d.label === terkait);
  if (org) {
    return { label: terkait, saatIni: org.nilai, harapan: org.harapan, gap: org.gap, sumber: "organisasi" };
  }

  return null;
}

/** Predikat gap 3-tingkat (Perlu perhatian/Ringan/Selaras), ranking gap ABSOLUT yang sudah final
 * -- bukan ambang baru (pola sama statusBudayaPerTipe() di useScData.js). Untuk budaya, gap-nya
 * vs harapan (tabelGap); untuk kesejahteraan, gap-nya vs indeks gabungan orang itu sendiri
 * (dihitung di cariFokusData di atas) -- di-ranking lintas 5 subdimensi yang sebanding. */
function predikatGap(daftarGap, terkait) {
  const sorted = [...(daftarGap || [])]
    .map((g) => ({ label: g.label, abs: Math.abs(g.nilai_gap ?? 0) }))
    .sort((a, b) => b.abs - a.abs);
  const idx = sorted.findIndex((g) => g.label === terkait);
  if (idx === -1) return null;
  if (idx === 0) return "Perlu perhatian";
  if (idx === sorted.length - 1) return "Selaras";
  return "Ringan";
}

/**
 * ScRencanaTindakLanjutPage -- halaman detail "Rencana Tindak Lanjut" laporan individu, dibuka
 * lewat tombol mengambang di beranda (ScLaporanIndividuPage.jsx). Isinya rencana_aksi (AksiPribadi[])
 * yang SUDAH ADA di data (dipakai CMS approval), sebelumnya dirender inline di beranda lalu
 * dipindah ke sini atas instruksi eksplisit pemilik produk supaya beranda tetap ringkas.
 *
 * BEDA dari referensi screenshot: tiap langkah cuma menampilkan judul + alasan (real, dari
 * rencana_aksi), BUKAN instruksi tersetruktur ("Setiap awal pekan, tuliskan: ...") atau kalimat
 * "Tujuan" terpisah per langkah -- struktur sedetail itu tidak ada di skema rencana_aksi manapun
 * sekarang (cuma judul/alasan/terkait/jangka/ikon), jadi sengaja tidak dikarang.
 */
export default function ScRencanaTindakLanjutPage({ laporan, onBack }) {
  const { bagian_budaya, bagian_kesejahteraan, bagian_profil_organisasi, rencana_aksi } = laporan;
  const fokus = rencana_aksi?.[0] || null;
  const fokusData = fokus ? cariFokusData(fokus.terkait, bagian_budaya, bagian_kesejahteraan, bagian_profil_organisasi) : null;

  // Daftar gap sebanding untuk ranking predikat -- budaya dibandingkan vs tabel_gap (harapan),
  // kesejahteraan dibandingkan vs indeks gabungan (dihitung ulang per subdimensi, sumber sama
  // dengan gap yang dipakai fokusData di atas).
  let daftarGapUntukRanking = [];
  if (fokusData?.sumber === "budaya") {
    daftarGapUntukRanking = bagian_budaya?.tabel_gap || [];
  } else if (fokusData?.sumber === "kesejahteraan" && bagian_kesejahteraan?.indeks != null) {
    daftarGapUntukRanking = (bagian_kesejahteraan.chart_data || []).map((k) => ({
      label: KESEJAHTERAAN_INFO[k.kode]?.label || k.label,
      nilai_gap: Math.round(k.nilai - bagian_kesejahteraan.indeks),
    }));
  }
  const predikat = fokusData ? predikatGap(daftarGapUntukRanking, fokusData.label) : null;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Kembali">‹</button>
        <h1 className={styles.topTitle}>Rencana Tindak Lanjut</h1>
      </div>

      {fokusData && (
        <div className={styles.fokusCard}>
          <p className={styles.fokusTitle}>Fokus Anda: {fokusData.label}</p>

          {fokusData.harapan != null ? (
            <div className={styles.compare}>
              <div className={styles.compareSide}>
                <div className={styles.compareTop}>
                  <span>Saat Ini</span>
                  <strong>{formatScore(fokusData.saatIni)}%</strong>
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${Math.max(0, Math.min(100, fokusData.saatIni ?? 0))}%` }} />
                </div>
              </div>

              <span className={styles.compareSep} aria-hidden="true">›</span>

              <div className={styles.compareSide}>
                <div className={styles.compareTop}>
                  <span>Harapan ke Depan</span>
                  <strong>{formatScore(fokusData.harapan)}%</strong>
                </div>
                <div className={styles.barTrack}>
                  <div className={`${styles.barFill} ${styles.barFillHarapan}`} style={{ width: `${Math.max(0, Math.min(100, fokusData.harapan ?? 0))}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.skorTunggal}>
              <span>Skor Anda saat ini</span>
              <strong>{formatScore(fokusData.saatIni)}%</strong>
            </div>
          )}

          {(fokusData.gap != null || predikat) && (
            <div className={styles.gapRow}>
              {fokusData.gap != null && (
                <div className={styles.gapBlock}>
                  <span className={styles.gapLabel}>
                    Nilai Gap{fokusData.gapVsIndeks ? " (vs indeks Anda)" : ""}
                  </span>
                  <span className={styles.gapBadgeDark}>{fokusData.gap > 0 ? "+" : ""}{fokusData.gap}%</span>
                </div>
              )}
              {predikat && (
                <div className={styles.gapBlock}>
                  <span className={styles.gapLabel}>Predikat Gap</span>
                  <span className={styles.gapBadgeOutline}>{predikat}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {fokus?.alasan && (
        <div className={styles.mengapaCard}>
          <p className={styles.mengapaTitle}>Mengapa Ini Menjadi Fokus Anda</p>
          <p className={styles.mengapaText}>{fokus.alasan}</p>
        </div>
      )}

      {rencana_aksi?.length > 0 ? (
        <div className={styles.langkahCard}>
          <p className={styles.langkahTitle}>
            {rencana_aksi.length === 1 ? "Satu Hal yang Bisa Anda Lakukan" : `${rencana_aksi.length} Hal yang Bisa Anda Lakukan`}
          </p>
          <div className={styles.langkahList}>
            {rencana_aksi.map((a, i) => (
              <div className={styles.langkahItem} key={a.id}>
                <span className={styles.langkahNumber}>{i + 1}</span>
                <div className={styles.langkahBody}>
                  <p className={styles.langkahJudul}>{a.judul}</p>
                  <p className={styles.langkahAlasan}>{a.alasan}</p>
                  <span className={styles.langkahJangka}>{a.jangka}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className={styles.gapNote}>Rencana tindak lanjut belum tersedia untuk periode ini.</p>
      )}
    </div>
  );
}

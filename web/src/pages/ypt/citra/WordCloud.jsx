import styles from "./Citra.module.css";

/**
 * Daftar kata kunci per kategori: satu kata per BARIS, bukan gumpalan kata mengalir.
 *
 * Sebelumnya ini benar-benar word cloud, kata-kata mengalir kiri ke kanan dengan ukuran font
 * mengikuti bobot. Diganti per baris atas permintaan pemilik produk (2026-08-28), dan alasannya
 * masuk akal: gumpalan cuma menyampaikan "kata ini lebih besar dari itu" secara kira-kira,
 * sedangkan satu baris per kata memberi tiga hal sekaligus dalam ruang yang sama -- peringkat
 * (urutan atas ke bawah), besaran (panjang bar), dan angka sebenarnya. Perbandingan antar kata
 * jadi bisa dibaca, bukan cuma dirasakan.
 *
 * Tiap baris tetap sebuah tombol: mengekliknya menyaring daftar detail di bawah, jadi daftar ini
 * pintu masuk ke kalimat aslinya, bukan hiasan.
 */
export default function WordCloud({
  kata, warna, kataAktif, onPilihKata, kosongPesan, terlihat = true, tundaAwal = 0,
}) {
  if (!kata || kata.length === 0) {
    return (
      <p className={styles.kosong}>
        {kosongPesan || "Belum cukup teks untuk membentuk daftar kata pada saringan ini."}
      </p>
    );
  }

  return (
    <ol className={styles.kataList}>
      {kata.map((k, i) => {
        const aktif = kataAktif === k.kata;
        return (
          <li key={k.kata}>
            <button
              type="button"
              className={`${styles.kataBaris} ${aktif ? styles.kataBarisAktif : ""} `
                + `${terlihat ? styles.kataBarisMasuk : ""}`}
              style={{
                // Baris muncul berurutan dari peringkat teratas. Tundanya dipendekkan pada ekor
                // daftar, kalau tidak baris ke-20 baru muncul hampir satu detik setelah yang
                // pertama dan daftarnya terasa menetes.
                transitionDelay: `${tundaAwal + Math.min(i, 12) * 26}ms`,
              }}
              title={`"${k.kata}" disebut di ${k.testimoni.toLocaleString("id-ID")} testimoni `
                + `(${k.kemunculan.toLocaleString("id-ID")} kemunculan)`
                + (k.angkat ? `, ${k.angkat.toFixed(1)}x lebih sering daripada di testimoni lain` : "")
                + ". Klik untuk membaca testimoninya."}
              aria-pressed={aktif}
              onClick={() => onPilihKata(aktif ? null : k.kata)}
            >
              <span className={styles.kataTeks}>{k.kata}</span>

              {/* Bar proporsional menggantikan ukuran font sebagai penyampai bobot. Lebarnya
                  memakai `bobot` yang sama persis dengan yang dulu mengatur ukuran huruf, jadi
                  urutan dan perbandingannya tidak berubah, cuma jadi bisa dibaca. */}
              <span className={styles.kataTrack}>
                <span
                  className={styles.kataFill}
                  style={{ width: terlihat ? `${Math.max(3, k.bobot * 100)}%` : 0, background: warna }}
                />
              </span>

              <span className={styles.kataNilai}>{k.testimoni.toLocaleString("id-ID")}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

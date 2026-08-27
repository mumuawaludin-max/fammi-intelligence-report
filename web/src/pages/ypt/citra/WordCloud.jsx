import styles from "./Citra.module.css";

/**
 * Word cloud testimoni. Tiap kata adalah tombol: mengekliknya menyaring daftar detail di bawah,
 * jadi cloud ini pintu masuk ke kalimat aslinya, bukan hiasan.
 *
 * Sengaja TIDAK memakai tata letak spiral acak seperti wordcloud2 dan kawan-kawan. Dua alasan:
 * susunan acak membuat posisi kata berubah tiap render sehingga sulit dilacak mata, dan ukuran
 * font yang berdesakan membuat kata kecil praktis tidak bisa diklik. Susunan mengalir dari kiri
 * ke kanan, urut dari kata yang paling banyak disebut, tetap terbaca dan tetap bisa dipakai.
 */

/** Ukuran font kata, px. Akar kuadrat, bukan linier: satu kata yang jauh di atas yang lain akan
 *  menyisakan semua kata lain berukuran nyaris sama kalau skalanya linier. */
function ukuran(bobot, [min, maks]) {
  return Math.round(min + (maks - min) * Math.sqrt(bobot));
}

export default function WordCloud({
  kata, warna, kataAktif, onPilihKata, kosongPesan, skala = [13, 40],
  terlihat = true, tundaAwal = 0,
}) {
  if (!kata || kata.length === 0) {
    return (
      <p className={styles.kosong}>
        {kosongPesan || "Belum cukup teks untuk membentuk word cloud pada saringan ini."}
      </p>
    );
  }

  return (
    <div className={styles.cloud}>
      {kata.map((k, i) => {
        const aktif = kataAktif === k.kata;
        return (
          <button
            key={k.kata}
            type="button"
            className={`${styles.cloudKata} ${aktif ? styles.cloudKataAktif : ""} `
              + `${terlihat ? styles.cloudKataMasuk : ""}`}
            style={{
              fontSize: ukuran(k.bobot, skala),
              color: warna,
              // Kata yang lebih jarang disebut ditipiskan, bukan cuma dikecilkan. Ukuran saja
              // tidak cukup membedakan ekor daftar yang panjangnya puluhan kata.
              "--kata-opacity": aktif ? 1 : 0.45 + 0.55 * k.bobot,
              fontWeight: 500 + Math.round(k.bobot * 3) * 100,
              // Kata muncul berurutan dari yang terbesar. Tundanya dipendekkan pada ekor daftar,
              // kalau tidak kata ke-20 baru muncul hampir satu detik setelah yang pertama.
              transitionDelay: `${tundaAwal + Math.min(i, 14) * 28}ms`,
            }}
            title={`"${k.kata}" disebut di ${k.testimoni.toLocaleString("id-ID")} testimoni `
              + `(${k.kemunculan.toLocaleString("id-ID")} kemunculan)`
              + (k.angkat ? `, ${k.angkat.toFixed(1)}x lebih sering daripada di testimoni lain` : "")
              + ". Klik untuk membaca testimoninya."}
            aria-pressed={aktif}
            onClick={() => onPilihKata(aktif ? null : k.kata)}
          >
            {k.kata}
          </button>
        );
      })}
    </div>
  );
}

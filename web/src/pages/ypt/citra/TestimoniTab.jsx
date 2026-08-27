import { useEffect, useMemo, useState, useTransition } from "react";
import { SectionTitle, statusPanel } from "../components/Bits";
import { useReveal, useCountUp } from "../components/useReveal";
import { CS_SUMBER } from "../yptMeta";
import { statistikTestimoni } from "./useCsData";
import { hitungKata, hitungKataKhas, statistikKata } from "./analisaKata";
import WordCloud from "./WordCloud";
import styles from "./Citra.module.css";

/**
 * Tab Testimoni menu Citra Sekolah.
 *
 * Sumbernya spreadsheet testimoni YPT lewat cs_testimoni, bukan refleksi Karakter seperti tiga tab
 * lain. Isinya belasan ribu kalimat bebas per periode, jadi susunannya sengaja berupa corong:
 * angka kunci, lalu grafik untuk menemukan DI MANA yang perlu dilihat, lalu peta kata untuk
 * menemukan TENTANG APA, lalu daftar kalimat aslinya. Tiap lapisan menyaring lapisan berikutnya,
 * sehingga pembaca tidak pernah dihadapkan pada 13 ribu kartu sekaligus.
 *
 * Dua hal yang WAJIB diingat kalau menyentuh berkas ini:
 *
 * 1. Kategori testimoni TUMPANG TINDIH. Satu testimoni bisa membawa dua sampai empat label
 *    (39% baris begitu di data produksi), jadi jumlah seluruh kategori lebih besar dari jumlah
 *    testimoni. Jangan pernah menggambarkannya sebagai pie atau donut; potongan yang saling
 *    meniadakan akan berbohong tentang datanya.
 * 2. Seluruh grafik DIHITUNG ULANG mengikuti saringan penulis dan sekolah lewat
 *    statistikTestimoni(), bukan memakai angka periode penuh dari useCsData. Grafik yang tidak
 *    ikut menyaring akan menjawab pertanyaan yang berbeda dari daftar di bawahnya.
 */
export default function TestimoniTab({ data, galat, jumlahSekolahNaungan }) {
  const [kategoriAktif, setKategoriAktif] = useState(null);
  const [kataAktif, setKataAktif] = useState(null);
  const [sekolahAktif, setSekolahAktif] = useState("");
  const [sumberAktif, setSumberAktif] = useState("");
  const [cari, setCari] = useState("");
  const [kataUmum, setKataUmum] = useState(false);
  const [modeKata, setModeKata] = useState("khas");
  const [urutSekolah, setUrutSekolah] = useState("total");
  const [batasDetail, setBatasDetail] = useState(12);

  /**
   * `sekolahAktif`, `sumberAktif`, `kataUmum`, dan `modeKata` masing-masing memicu ulang seluruh
   * rantai statistikTestimoni + hitungKataKhas/hitungKata di atas 13 ribu testimoni. Diukur di
   * komentar `statSemua` dan `kartuKata` di bawah: sampai ~1.000 ms sekali hitung. Kalau setter
   * itu dipanggil langsung, React merender ulang SEMUA blok ini secara sinkron di dalam satu
   * commit, dan selama itu browser tidak bisa mengecat frame baru maupun memproses klik lain --
   * layar terasa membeku persis sepanjang durasi hitungnya.
   *
   * `startTransition` menandai update itu sebagai berprioritas rendah: React tetap merender ulang
   * blok yang sama, tapi boleh menyelanya untuk mengecat frame lain dulu (termasuk membalas klik
   * berikutnya), dan `isPending` dipakai untuk menandai visual "sedang menghitung" di bagian yang
   * terdampak. Ini tidak mempercepat perhitungannya sendiri -- itu perbaikan terpisah kalau nanti
   * dibutuhkan (Web Worker) -- tapi mencegah satu klik terasa mengunci seluruh halaman.
   *
   * `kategoriAktif`/`kataAktif`/`cari` SENGAJA tidak ikut ditransisikan: ketiganya cuma menyaring
   * `detail` lewat `.filter()` biasa, bukan menghitung ulang word cloud, jadi tetap murah dan
   * harus terasa instan seperti mengetik biasa.
   */
  const [sedangMenghitung, mulaiTransisi] = useTransition();

  const semua = data.testimoni || [];
  const totalPeriode = data.totalTestimoni || 0;

  /**
   * Disaring per SEKOLAH saja. Dua hal dihitung dari sini, dan keduanya akan salah kalau memakai
   * korpus yang sudah tersaring penulis: angka di tombol "Ditulis oleh" (sisi yang tidak dipilih
   * akan selalu nol, sehingga pembaca tidak pernah tahu ada berapa banyak di sisi seberang), dan
   * grafik perbandingan orangtua versus siswa, yang memang tugasnya membandingkan keduanya.
   */
  const basisSekolah = useMemo(
    () => semua.filter((t) => !sekolahAktif || t.sekolahId === sekolahAktif),
    [semua, sekolahAktif],
  );

  const hitungSumber = useMemo(() => {
    const h = {};
    CS_SUMBER.forEach((s) => { h[s.id] = 0; });
    basisSekolah.forEach((t) => { if (h[t.sumber] != null) h[t.sumber] += 1; });
    return h;
  }, [basisSekolah]);

  const statPenulis = useMemo(
    () => statistikTestimoni(basisSekolah, data.urutanKategori),
    [basisSekolah, data.urutanKategori],
  );

  /**
   * Korpus dasar seluruh tampilan lain: disaring per penulis dan sekolah, TIDAK per kategori.
   * Kategori tidak boleh ikut menyaring di sini karena kelima kartu peta kata harus dihitung
   * terhadap korpus yang sama; kalau tidak, tiap kartu membandingkan dirinya dengan dirinya
   * sendiri dan kata khasnya kehilangan arti.
   */
  const basis = useMemo(
    () => basisSekolah.filter((t) => !sumberAktif || t.sumber === sumberAktif),
    [basisSekolah, sumberAktif],
  );

  // Urutan kategori dikunci ke urutan periode penuh supaya bar tidak melompat-lompat posisi
  // setiap kali saringan berubah.
  const stat = useMemo(
    () => statistikTestimoni(basis, data.urutanKategori),
    [basis, data.urutanKategori],
  );

  const kategoriStat = stat.testimoniKategori;
  const perSekolah = stat.testimoniPerSekolah;
  const perJenjang = stat.testimoniPerJenjang;
  const total = stat.totalTestimoni;

  // Statistik korpus dihitung SEKALI lalu dipakai ulang kelima kartu peta kata. Menyapu korpus
  // terpisah per kartu berarti lima kali kerja yang sama; diukur pada 13.013 testimoni, itu
  // selisih sekitar 1.000 ms versus 280 ms setiap kali saringan berubah.
  const statSemua = useMemo(
    () => statistikKata(basis.map((t) => t.token), kataUmum),
    [basis, kataUmum],
  );

  /** Satu kartu peta kata per kategori. Inilah pandangan sekali lihat untuk pengurus yayasan. */
  const kartuKata = useMemo(() => kategoriStat.map((k) => {
    const token = basis.filter((t) => t.kategori.includes(k.id)).map((t) => t.token);
    const kata = modeKata === "khas"
      ? hitungKataKhas(token, statSemua, { batas: 20, sertakanKataUmum: kataUmum })
      : hitungKata(token, {
        batas: 20,
        sertakanKataUmum: kataUmum,
        // Ambang ikut besar kecilnya kelompok. Pada satu sekolah kecil, ambang tetap memangkas
        // cloud sampai habis; pada seluruh yayasan, ambang kecil meloloskan kata yang cuma
        // disebut sekali per seribu testimoni dan tidak berarti apa-apa.
        minTestimoni: Math.max(2, Math.round(token.length * 0.01)),
      });

    // Mode khas butuh PEMBANDING: seberapa sering satu kata muncul di luar kategori ini. Kalau
    // seluruh korpus yang tersaring membawa label ini, pembandingnya kosong dan rasio angkat
    // tidak terdefinisi, jadi hasilnya kosong. Itu sama sekali bukan soal sedikitnya testimoni,
    // dan pesan "terlalu sedikit" akan menyesatkan; nyata terjadi saat menyaring satu sekolah
    // yang semua testimoninya berlabel Ucapan Terimakasih.
    const tanpaPembanding = modeKata === "khas" && token.length > 0 && token.length === basis.length;

    return { ...k, kata, tanpaPembanding };
  }), [kategoriStat, basis, statSemua, modeKata, kataUmum]);

  const cariBersih = cari.trim().toLowerCase();
  const detail = useMemo(() => basis.filter((t) => (
    (!kategoriAktif || t.kategori.includes(kategoriAktif))
    && (!kataAktif || t.token.includes(kataAktif))
    && (!cariBersih
      || t.teks.toLowerCase().includes(cariBersih)
      || (t.nama || "").toLowerCase().includes(cariBersih)
      || (t.kelas || "").toLowerCase().includes(cariBersih))
  )), [basis, kategoriAktif, kataAktif, cariBersih]);

  // Ganti saringan berarti mulai membaca dari atas lagi. Tanpa ini, pembaca yang sudah menekan
  // "muat lebih banyak" sampai 200 kartu akan mendapat 200 kartu lagi pada kategori berikutnya.
  useEffect(() => {
    setBatasDetail(12);
  }, [kategoriAktif, sekolahAktif, sumberAktif, kataAktif, cariBersih]);

  // Query yang GAGAL tidak boleh tampil sebagai periode yang kosong. Pesan kosong menyuruh
  // operator mengisi spreadsheet dan menjalankan sinkronisasi, dan itu justru salah arah kalau
  // yang terjadi sebenarnya query-nya yang tidak sampai.
  if (galat) {
    return statusPanel({ error: galat });
  }

  if (totalPeriode === 0) {
    return statusPanel({
      kosong: true,
      judul: "Belum ada testimoni",
      pesan: "Testimoni ditarik dari spreadsheet YPT. Isi spreadsheetnya, tandai kolom Tampilkan "
        + "dengan Ya, lalu jalankan sinkronisasi di Admin CMS.",
    });
  }

  const adaSaringan = kategoriAktif || kataAktif || sekolahAktif || sumberAktif || cariBersih;
  function resetSaringan() {
    setKategoriAktif(null);
    setKataAktif(null);
    setCari("");
    // Cuma dua setter mahal ini yang perlu ditransisikan; tiga di atas murah (lihat catatan di
    // deklarasi useTransition).
    mulaiTransisi(() => {
      setSekolahAktif("");
      setSumberAktif("");
    });
  }

  /** Ganti sekolah aktif, dari mana pun sumbernya (kartu Suara per Sekolah atau dropdown Detail). */
  function gantiSekolah(id) {
    mulaiTransisi(() => setSekolahAktif(id));
  }

  /** Ganti penulis aktif dari tombol "Ditulis oleh". */
  function gantiSumber(id) {
    mulaiTransisi(() => setSumberAktif(id));
  }

  const dominan = [...kategoriStat].sort((a, b) => b.jumlah - a.jumlah)[0];
  const persenPerlu = total > 0 ? Math.round((stat.testimoniPerluRespons / total) * 100) : 0;
  const warnaAktif = kategoriStat.find((k) => k.id === kategoriAktif)?.warnaTeks || "var(--ypt-navy)";
  const labelSumberAktif = CS_SUMBER.find((s) => s.id === sumberAktif)?.label;

  return (
    <>
      <div className={styles.tabHead}>
        <SectionTitle>Testimoni Orangtua &amp; Siswa</SectionTitle>

        {/* Saringan penulis dipasang paling atas karena mengubah SEMUA yang ada di bawahnya. */}
        <div className={styles.sumberBar}>
          <span className={styles.sumberLabel}>Ditulis oleh</span>
          <span className={styles.togglePair}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${!sumberAktif ? styles.toggleBtnAktif : ""}`}
              onClick={() => gantiSumber("")}
            >
              Semua
            </button>
            {CS_SUMBER.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`${styles.toggleBtn} ${sumberAktif === s.id ? styles.toggleBtnAktif : ""}`}
                style={sumberAktif === s.id ? { color: s.warna } : undefined}
                onClick={() => gantiSumber(sumberAktif === s.id ? "" : s.id)}
                disabled={hitungSumber[s.id] === 0}
              >
                {s.label}
                <span className={styles.toggleHitung}>
                  {hitungSumber[s.id].toLocaleString("id-ID")}
                </span>
              </button>
            ))}
          </span>
          {adaSaringan && (
            <button type="button" className={styles.resetBtn} onClick={resetSaringan}>
              Hapus semua saringan
            </button>
          )}
        </div>
      </div>

      <BlokAngka
        total={total}
        totalPeriode={totalPeriode}
        sekolahTerwakili={perSekolah.length}
        jumlahSekolahNaungan={jumlahSekolahNaungan}
        perlu={stat.testimoniPerluRespons}
        persenPerlu={persenPerlu}
        dominan={dominan}
        labelSumberAktif={labelSumberAktif}
      />

      <BlokKategori
        kategoriStat={kategoriStat}
        kategoriAktif={kategoriAktif}
        onPilih={(id) => setKategoriAktif(kategoriAktif === id ? null : id)}
      />

      {/* Sengaja memakai statistik yang BELUM tersaring penulis: ini grafik pembanding, dan
          membandingkan satu kelompok dengan dirinya sendiri tidak ada gunanya. */}
      <BlokPenulis
        perSumber={statPenulis.testimoniPerSumber}
        kategoriStat={statPenulis.testimoniKategori}
        total={statPenulis.totalTestimoni}
      />

      <BlokJenjang perJenjang={perJenjang} kategoriStat={kategoriStat} />

      <BlokSekolah
        perSekolah={perSekolah}
        sekolahAktif={sekolahAktif}
        urutSekolah={urutSekolah}
        onGantiUrut={setUrutSekolah}
        onPilih={(id) => gantiSekolah(sekolahAktif === id ? "" : id)}
      />

      <BlokPetaKata
        kartuKata={kartuKata}
        sedangMenghitung={sedangMenghitung}
        modeKata={modeKata}
        onGantiMode={(v) => mulaiTransisi(() => setModeKata(v))}
        kataUmum={kataUmum}
        onGantiKataUmum={(v) => mulaiTransisi(() => setKataUmum(v))}
        kategoriAktif={kategoriAktif}
        kataAktif={kataAktif}
        onPilihKata={(idKategori, kata) => {
          if (!kata) { setKataAktif(null); return; }
          // Kategori ikut disetel, bukan cuma kata. Kata yang sama bisa muncul di beberapa kartu,
          // dan tanpa ini pembaca yang mengeklik "panas" di kartu Keluhan akan mendapat daftar
          // berisi Saran & Masukan juga, yang bukan yang dia tunjuk.
          setKategoriAktif(idKategori);
          setKataAktif(kata);
        }}
        onBacaKategori={(id) => {
          setKataAktif(null);
          setKategoriAktif(kategoriAktif === id ? null : id);
        }}
      />

      <BlokDetail
        detail={detail}
        total={total}
        perSekolah={perSekolah}
        kategoriStat={kategoriStat}
        sekolahAktif={sekolahAktif}
        onGantiSekolah={gantiSekolah}
        cari={cari}
        onGantiCari={setCari}
        kategoriAktif={kategoriAktif}
        onHapusKategori={() => setKategoriAktif(null)}
        kataAktif={kataAktif}
        onHapusKata={() => setKataAktif(null)}
        warnaAktif={warnaAktif}
        batasDetail={batasDetail}
        onMuatLagi={() => setBatasDetail((n) => n + 24)}
      />
    </>
  );
}

/* ══ Angka kunci ═══════════════════════════════════════════════════════════════════════════ */

function BlokAngka({
  total, totalPeriode, sekolahTerwakili, jumlahSekolahNaungan, perlu, persenPerlu, dominan,
  labelSumberAktif,
}) {
  const [ref, terlihat] = useReveal();
  const disaring = total !== totalPeriode;

  return (
    <div className={styles.angkaGrid} ref={ref}>
      <AngkaKunci
        urut={0}
        terlihat={terlihat}
        label={labelSumberAktif ? `Testimoni ${labelSumberAktif}` : "Total testimoni"}
        nilai={total}
        catatan={disaring
          ? `dari ${totalPeriode.toLocaleString("id-ID")} testimoni periode ini`
          : "terkurasi, kolom Tampilkan = Ya"}
      />
      <AngkaKunci
        urut={1}
        terlihat={terlihat}
        label="Sekolah terwakili"
        nilai={sekolahTerwakili}
        catatan={jumlahSekolahNaungan
          ? `dari ${jumlahSekolahNaungan} sekolah di bawah yayasan`
          : "punya testimoni pada saringan ini"}
      />
      <AngkaKunci
        urut={2}
        terlihat={terlihat}
        label="Menuntut respons"
        nilai={perlu}
        catatan={`${persenPerlu}% berlabel Keluhan atau Kritik`}
        aksen="var(--ypt-sentimen-sangat-negatif)"
      />
      <AngkaKunci
        urut={3}
        terlihat={terlihat}
        label="Label terbanyak"
        nilai={dominan?.persen ?? 0}
        satuan="%"
        catatan={dominan ? dominan.label : "belum ada label"}
        aksen={dominan?.warnaTeks}
      />
    </div>
  );
}

/** Satu kartu angka kunci. Angkanya berjalan naik begitu strip masuk layar. */
function AngkaKunci({ label, nilai, satuan, catatan, aksen, terlihat, urut }) {
  const berjalan = useCountUp(nilai, terlihat, 800 + urut * 90);

  return (
    <div
      className={`${styles.angkaKartu} ${styles.reveal} ${terlihat ? styles.revealAktif : ""}`}
      style={{ transitionDelay: `${urut * 70}ms` }}
    >
      <p className={styles.angkaLabel}>{label}</p>
      <p className={styles.angkaNilai} style={aksen ? { color: aksen } : undefined}>
        {berjalan.toLocaleString("id-ID")}{satuan}
      </p>
      <p className={styles.angkaCatatan}>{catatan}</p>
    </div>
  );
}

/* ══ Sebaran kategori ══════════════════════════════════════════════════════════════════════ */

function BlokKategori({ kategoriStat, kategoriAktif, onPilih }) {
  const [ref, terlihat] = useReveal();
  const puncak = Math.max(1, ...kategoriStat.map((k) => k.jumlah));

  return (
    <>
      <SectionTitle>Sebaran Kategori</SectionTitle>
      {/* Catatan sengaja satu kalimat. Yang tidak boleh hilang cuma peringatan bahwa jumlahnya
          melebihi 100%, karena tanpa itu angkanya terbaca sebagai salah hitung. */}
      <p className={styles.catatanBlok}>
        Satu testimoni bisa berlabel lebih dari satu, jadi totalnya melebihi 100%. Klik untuk
        menyaring.
      </p>

      <div className={styles.kartuBlok} ref={ref}>
        {kategoriStat.map((k, i) => {
          const aktif = kategoriAktif === k.id;
          return (
            <button
              key={k.id}
              type="button"
              className={`${styles.barBaris} ${aktif ? styles.barBarisAktif : ""}`}
              aria-pressed={aktif}
              onClick={() => onPilih(k.id)}
            >
              <span className={styles.barLabel}>
                <span className={styles.barTitik} style={{ background: k.warna }} aria-hidden="true" />
                {k.label}
                {!k.dikenal && (
                  <span className={styles.barBaru} title="Label ini belum dikenali dashboard. Kemungkinan opsi baru di form.">
                    baru
                  </span>
                )}
              </span>
              <span className={styles.barTrack}>
                <span
                  className={styles.barFill}
                  style={{
                    width: terlihat ? `${(k.jumlah / puncak) * 100}%` : 0,
                    background: k.warna,
                    transitionDelay: `${i * 80}ms`,
                  }}
                />
              </span>
              <span className={styles.barNilai}>
                <b style={{ color: k.warnaTeks }}>{k.persen}%</b>
                <span className={styles.barJumlah}>{k.jumlah.toLocaleString("id-ID")}</span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ══ Orangtua versus siswa ═════════════════════════════════════════════════════════════════ */

/**
 * Perbandingan nada antara suara orang tua dan suara siswa.
 *
 * Ini yang membuat kolom Nama berguna. Diperiksa pada data produksi: seluruh TK dan SD murni
 * suara orang tua sedangkan SMP dan SMK sebagian besar suara siswa, jadi angka keluhan gabungan
 * sebenarnya mencampur dua populasi yang berbeda. Yang dibandingkan di sini PORSI di dalam
 * masing-masing kelompok, bukan jumlahnya, karena kedua kelompok berbeda besar.
 */
function BlokPenulis({ perSumber, kategoriStat, total }) {
  const [ref, terlihat] = useReveal();
  const adaKeduanya = perSumber.filter((s) => s.total > 0).length > 1;

  if (!adaKeduanya) return null;

  return (
    <>
      <SectionTitle>Orangtua Berbicara Apa, Siswa Berbicara Apa</SectionTitle>
      <p className={styles.catatanBlok}>
        Porsi label di dalam tiap kelompok, bukan jumlahnya.
      </p>

      <div className={styles.penulisGrid} ref={ref}>
        {perSumber.filter((s) => s.total > 0).map((s, iS) => (
          <section
            key={s.id}
            className={`${styles.penulisKartu} ${styles.reveal} ${terlihat ? styles.revealAktif : ""}`}
            style={{ transitionDelay: `${iS * 100}ms` }}
          >
            <header className={styles.penulisHead}>
              <span className={styles.penulisJudul} style={{ color: s.warna }}>{s.label}</span>
              <span className={styles.penulisMeta}>
                {s.total.toLocaleString("id-ID")} testimoni
                {total > 0 && ` · ${Math.round((s.total / total) * 100)}% dari semua`}
              </span>
            </header>

            {kategoriStat.map((k, i) => {
              const n = s.perKategori[k.id] || 0;
              const persen = s.total > 0 ? Math.round((n / s.total) * 100) : 0;
              return (
                <div key={k.id} className={styles.penulisBaris}>
                  <span className={styles.penulisNama}>
                    <span className={styles.barTitik} style={{ background: k.warna }} aria-hidden="true" />
                    {k.label}
                  </span>
                  <span className={styles.barTrack}>
                    <span
                      className={styles.barFill}
                      style={{
                        width: terlihat ? `${persen}%` : 0,
                        background: k.warna,
                        transitionDelay: `${iS * 100 + i * 70}ms`,
                      }}
                    />
                  </span>
                  <span className={styles.penulisNilai}>{persen}%</span>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </>
  );
}

/* ══ Komposisi per jenjang ═════════════════════════════════════════════════════════════════ */

function BlokJenjang({ perJenjang, kategoriStat }) {
  const [ref, terlihat] = useReveal();

  if (perJenjang.length === 0) return null;

  return (
    <>
      <SectionTitle>Komposisi Label per Jenjang</SectionTitle>
      <p className={styles.catatanBlok}>
        Perbandingan nada antar jenjang, bukan jumlah testimoni.
      </p>

      <div className={styles.kartuBlok} ref={ref}>
        {perJenjang.map((g, iG) => {
          const totalLabel = Object.values(g.perKategori).reduce((a, b) => a + b, 0) || 1;
          return (
            <div key={g.id} className={styles.jenjangRow}>
              <span className={styles.jenjangNama}>
                {g.label}
                <span className={styles.jenjangTotal}>{g.total.toLocaleString("id-ID")} testimoni</span>
              </span>
              <span className={styles.stack}>
                {kategoriStat.map((k, i) => {
                  const n = g.perKategori[k.id] || 0;
                  if (n === 0) return null;
                  const persen = (n / totalLabel) * 100;
                  return (
                    <span
                      key={k.id}
                      className={styles.stackSeg}
                      // role="img" WAJIB ada bersama aria-label. Pada <span> polos yang perannya
                      // generic, aria-label diabaikan pembaca layar, jadi angka di segmen ini
                      // hanya akan tersedia lewat tooltip yang butuh tetikus.
                      role="img"
                      aria-label={`${k.label}: ${n.toLocaleString("id-ID")} label (${Math.round(persen)}%)`}
                      style={{
                        width: terlihat ? `${persen}%` : 0,
                        background: k.warna,
                        transitionDelay: `${iG * 90 + i * 60}ms`,
                      }}
                      title={`${g.label} · ${k.label}: ${n.toLocaleString("id-ID")} label (${Math.round(persen)}%)`}
                    >
                      {persen >= 9 && terlihat && (
                        // Warna teksnya mengikuti isian di belakangnya, bukan selalu putih. Putih
                        // di atas kuning cuma mencapai rasio 1,8:1 dan praktis tidak terbaca.
                        <span className={styles.stackTeks} style={{ color: k.warnaIsi }}>
                          {Math.round(persen)}%
                        </span>
                      )}
                    </span>
                  );
                })}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.legenda}>
        {kategoriStat.map((k) => (
          <span key={k.id} className={styles.legendaItem}>
            <span className={styles.barTitik} style={{ background: k.warna }} aria-hidden="true" />
            {k.label}
          </span>
        ))}
      </div>
    </>
  );
}

/* ══ Suara per sekolah ═════════════════════════════════════════════════════════════════════ */

// Ambang untuk pengurutan berbasis proporsi. Tanpa ini, sekolah dengan 3 testimoni yang satu di
// antaranya keluhan duduk di puncak dengan 33% dan menutupi sekolah yang benar-benar bermasalah.
const MIN_UNTUK_PROPORSI = 20;

function BlokSekolah({ perSekolah, sekolahAktif, urutSekolah, onGantiUrut, onPilih }) {
  const [ref, terlihat] = useReveal();

  const daftar = useMemo(() => {
    if (urutSekolah === "total") return perSekolah.slice(0, 12);
    return perSekolah
      .filter((s) => s.total >= MIN_UNTUK_PROPORSI)
      .sort((a, b) => b.persenPerlu - a.persenPerlu)
      .slice(0, 12);
  }, [perSekolah, urutSekolah]);

  const puncak = Math.max(1, ...daftar.map((s) => s.total));

  return (
    <>
      <SectionTitle
        aksi={(
          <span className={styles.togglePair}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${urutSekolah === "total" ? styles.toggleBtnAktif : ""}`}
              onClick={() => onGantiUrut("total")}
            >
              Testimoni terbanyak
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${urutSekolah === "perlu" ? styles.toggleBtnAktif : ""}`}
              onClick={() => onGantiUrut("perlu")}
            >
              Proporsi keluhan tertinggi
            </button>
          </span>
        )}
      >
        Suara per Sekolah
      </SectionTitle>

      <p className={styles.catatanBlok}>
        {urutSekolah === "total"
          ? "Bagian merah = Keluhan atau Kritik. Klik untuk menyaring."
          // Ambangnya tetap disebut walau ringkas: tanpa itu, pembaca yang mencari sekolahnya
          // sendiri di daftar ini tidak punya cara tahu kenapa sekolahnya tidak muncul.
          : `Minimal ${MIN_UNTUK_PROPORSI} testimoni. Klik untuk menyaring.`}
      </p>

      <div className={styles.kartuBlok} ref={ref}>
        {daftar.length === 0 && (
          <p className={styles.kosong}>
            Belum ada sekolah yang memenuhi ambang {MIN_UNTUK_PROPORSI} testimoni pada saringan ini.
          </p>
        )}
        {daftar.map((s, i) => {
          const aktif = sekolahAktif === s.id;
          return (
            <button
              key={s.id}
              type="button"
              className={`${styles.barBaris} ${aktif ? styles.barBarisAktif : ""}`}
              aria-pressed={aktif}
              onClick={() => onPilih(s.id)}
            >
              <span className={`${styles.barLabel} ${styles.barLabelSekolah}`}>{s.nama}</span>
              <span className={styles.barTrack}>
                <span
                  className={styles.barFill}
                  style={{
                    width: terlihat ? `${(s.total / puncak) * 100}%` : 0,
                    background: "var(--ypt-navy)",
                    transitionDelay: `${i * 55}ms`,
                  }}
                />
                <span
                  className={styles.barFillPerlu}
                  style={{
                    width: terlihat ? `${(s.perlu / puncak) * 100}%` : 0,
                    transitionDelay: `${i * 55 + 160}ms`,
                  }}
                  title={`${s.perlu.toLocaleString("id-ID")} testimoni berlabel Keluhan atau Kritik`}
                />
              </span>
              <span className={styles.barNilai}>
                <b>{s.total.toLocaleString("id-ID")}</b>
                <span className={styles.barJumlah} style={{ color: "var(--ypt-sentimen-sangat-negatif)" }}>
                  {s.persenPerlu}% keluhan
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ══ Peta kata per kategori ════════════════════════════════════════════════════════════════ */

function BlokPetaKata({
  kartuKata, sedangMenghitung, modeKata, onGantiMode, kataUmum, onGantiKataUmum,
  kategoriAktif, kataAktif, onPilihKata, onBacaKategori,
}) {
  const [ref, terlihat] = useReveal();

  return (
    <>
      <SectionTitle
        aksi={(
          <span className={styles.aksiGrup}>
            {/* Muncul selama transisi dari useTransition masih berjalan -- lihat catatan di
                TestimoniTab soal kenapa perhitungan kata sengaja tidak langsung menutup layar,
                tapi tetap butuh penanda supaya pembaca tahu klik tadi diproses, bukan diabaikan. */}
            {sedangMenghitung && (
              <span className={styles.sedangHitung} role="status" aria-live="polite">
                Menghitung ulang…
              </span>
            )}
            <span className={styles.togglePair}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${modeKata === "khas" ? styles.toggleBtnAktif : ""}`}
                onClick={() => onGantiMode("khas")}
              >
                Kata paling khas
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${modeKata === "sering" ? styles.toggleBtnAktif : ""}`}
                onClick={() => onGantiMode("sering")}
              >
                Kata paling sering
              </button>
            </span>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={kataUmum}
                onChange={(e) => onGantiKataUmum(e.target.checked)}
              />
              Tampilkan kata umum
            </label>
          </span>
        )}
      >
        Peta Kata per Kategori
      </SectionTitle>

      <p className={styles.catatanBlok}>
        {modeKata === "khas"
          ? <>Kata yang <b>membedakan</b> tiap kategori, bukan yang terbanyak.</>
          : "Kata yang paling banyak disebut di tiap kategori."}
        {" Angka = jumlah testimoni yang menyebutnya. Klik untuk membacanya."}
      </p>

      <div
        className={`${styles.cloudGrid} ${sedangMenghitung ? styles.cloudGridHitung : ""}`}
        ref={ref}
      >
        {kartuKata.map((k, i) => (
          <section
            key={k.id}
            className={`${styles.cloudKartu} ${styles.reveal} ${terlihat ? styles.revealAktif : ""}`}
            style={{ transitionDelay: `${i * 85}ms` }}
          >
            <header className={styles.cloudHead}>
              <span className={styles.cloudJudul}>
                <span className={styles.barTitik} style={{ background: k.warna }} aria-hidden="true" />
                {k.label}
              </span>
              <span className={styles.cloudMeta}>
                {k.jumlah.toLocaleString("id-ID")} testimoni
              </span>
            </header>

            <WordCloud
              kata={k.kata}
              warna={k.warna}
              kataAktif={kategoriAktif === k.id ? kataAktif : null}
              terlihat={terlihat}
              tundaAwal={i * 85}
              onPilihKata={(kata) => onPilihKata(k.id, kata)}
              kosongPesan={k.jumlah === 0
                ? "Tidak ada testimoni berlabel ini pada saringan aktif."
                : k.tanpaPembanding
                  ? "Semua testimoni pada saringan ini berlabel sama, jadi tidak ada pembanding "
                    + "untuk menentukan kata khasnya. Pakai mode “kata paling sering”."
                  : `Hanya ${k.jumlah} testimoni berlabel ini, terlalu sedikit untuk membentuk pola kata.`}
            />

            <button
              type="button"
              className={styles.cloudAksi}
              style={{ color: k.warnaTeks }}
              onClick={() => onBacaKategori(k.id)}
            >
              {kategoriAktif === k.id && !kataAktif
                ? "Hapus saringan kategori ini"
                : `Baca semua testimoni ${k.label}`}
            </button>
          </section>
        ))}
      </div>
    </>
  );
}

/* ══ Detail ════════════════════════════════════════════════════════════════════════════════ */

function BlokDetail({
  detail, total, perSekolah, kategoriStat, sekolahAktif, onGantiSekolah, cari, onGantiCari,
  kategoriAktif, onHapusKategori, kataAktif, onHapusKata, warnaAktif, batasDetail, onMuatLagi,
}) {
  const [ref, terlihat] = useReveal();

  return (
    <>
      <SectionTitle>Detail Testimoni</SectionTitle>

      <div className={styles.filterBar}>
        <input
          type="search"
          className={styles.cariInput}
          placeholder="Cari kata, nama, atau kelas di dalam testimoni"
          value={cari}
          onChange={(e) => onGantiCari(e.target.value)}
          aria-label="Cari di dalam testimoni"
        />
        <select
          className={styles.filterSelect}
          value={sekolahAktif}
          onChange={(e) => onGantiSekolah(e.target.value)}
          aria-label="Saring per sekolah"
        >
          <option value="">Semua sekolah</option>
          {perSekolah.map((s) => (
            <option key={s.id} value={s.id}>{s.nama} ({s.total})</option>
          ))}
        </select>
        <span className={styles.hitungHasil}>
          {detail.length.toLocaleString("id-ID")} dari {total.toLocaleString("id-ID")} testimoni
        </span>
      </div>

      {(kategoriAktif || kataAktif) && (
        <div className={styles.chipBar}>
          {kategoriAktif && (
            <button
              type="button"
              className={styles.chip}
              style={{ borderColor: warnaAktif, color: warnaAktif }}
              onClick={onHapusKategori}
            >
              {kategoriStat.find((k) => k.id === kategoriAktif)?.label} <span aria-hidden="true">✕</span>
            </button>
          )}
          {kataAktif && (
            <button type="button" className={styles.chip} onClick={onHapusKata}>
              kata &quot;{kataAktif}&quot; <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>
      )}

      {detail.length === 0 ? (
        <p className={styles.kosong}>
          Tidak ada testimoni yang cocok dengan saringan ini. Coba hapus salah satu saringan di atas.
        </p>
      ) : (
        <>
          <div className={styles.esaiGrid} ref={ref}>
            {detail.slice(0, batasDetail).map((t, i) => (
              <article
                key={t.id}
                className={`${styles.testiKartu} ${styles.reveal} ${terlihat ? styles.revealAktif : ""}`}
                // Tunda dibatasi 12 kartu pertama. Tanpa batas, kartu ke-200 menunggu belasan
                // detik sebelum muncul dan terbaca seperti halaman yang menggantung.
                style={{ transitionDelay: `${Math.min(i, 11) * 45}ms` }}
              >
                <div className={styles.esaiTop}>
                  <span className={styles.esaiNama}>
                    {t.nama || "Tanpa nama"}
                    <span
                      className={styles.sumberTag}
                      style={{ color: t.sumber === "siswa" ? "var(--ypt-red-dark)" : "var(--ypt-navy)" }}
                    >
                      {t.sumber === "siswa" ? "siswa" : "orangtua"}
                    </span>
                  </span>
                  <span className={styles.esaiBadge}>
                    {t.kelas} · <span className={styles.esaiBadgeSekolah}>{t.sekolahNama}</span>
                  </span>
                </div>
                <p className={styles.esaiTeks}>{t.teks}</p>
                <div className={styles.testiLabelBar}>
                  {t.kategori.map((id) => {
                    const k = kategoriStat.find((x) => x.id === id);
                    return (
                      <span
                        key={id}
                        className={styles.testiLabel}
                        style={{ color: k?.warnaTeks, borderColor: k?.warnaTeks }}
                      >
                        {k?.label || id}
                      </span>
                    );
                  })}
                  {t.kategori.length === 0 && (
                    <span className={styles.testiLabelKosong}>tanpa label kategori</span>
                  )}
                </div>
              </article>
            ))}
          </div>

          {batasDetail < detail.length && (
            <div className={styles.muatLagiWrap}>
              <button type="button" className={styles.muatLagi} onClick={onMuatLagi}>
                Muat 24 testimoni lagi
                <span className={styles.muatSisa}>
                  {(detail.length - batasDetail).toLocaleString("id-ID")} belum ditampilkan
                </span>
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

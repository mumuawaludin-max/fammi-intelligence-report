import { useCallback, useEffect, useRef, useState } from "react";
import { Ikon } from "../komponen";
import dasar from "../proteksi.module.css";
import css from "./OrangTua.module.css";
import {
  ASPEK,
  DI_RUMAH,
  DILAKUKAN_SEKOLAH,
  GAMBAR_KEJADIAN,
  ISIAN_AWAL,
  JAM_LAPORAN_BARU,
  JANJI_RESPON,
  JENIS_KEJADIAN,
  JUDUL_BILAH,
  JUMLAH_SOAL,
  KEJADIAN_BAIK,
  KODE_LACAK,
  LANGKAH_KS015,
  LANJUTAN_SKRINING,
  NAMA_LANGKAH,
  ORANG_DIPERCAYA,
  ORANG_TUA_SENDIRI,
  PENGIRIM_BALASAN,
  PESAN_AWAL,
  PILIHAN_ANAK,
  PILIHAN_BAHAYA,
  PILIHAN_KAPAN,
  PILIHAN_KEAMANAN,
  PILIHAN_TEMPAT,
  PILIHAN_UMUM,
  SOAL,
  SOAL_KEAMANAN_AWAL,
  TAB,
  WAJAH,
} from "./orangTuaData";

const SOAL_TERAKHIR = JUMLAH_SOAL - 1;
const JUMLAH_LANGKAH = 3;
const LAMA_TOAST = 3000;
// Layar yang memakai tab bawah, dan layar yang punya tombol kanan di bilah atas (desain).
const LAYAR_BERTAB = ["beranda", "hasil", "lacak"];
const LAYAR_BERAKSI = ["pertanyaan", "anak1", "anak2", "anak3"];

/** Gabungkan nama kelas, buang yang kosong. */
function kelas(...daftar) {
  return daftar.filter(Boolean).join(" ");
}

/**
 * Orang tua & anak: aplikasi ponsel Ibu Dewi (artboard 390x844 di kanvas desain pemilik produk
 * 2026-11-11). Satu bingkai ponsel dengan layar-layar sendiri di dalamnya: beranda, skrining Nara,
 * ringkasan hasil Raka yang dimulai dari kekuatannya, Lapor Aman tiga langkah dengan kode lacak,
 * laporan saya beserta pesan dari sekolah, dan mode cerita anak (wajah perasaan, pilihan gambar,
 * rekam suara). Tab bawah dan toast hidup di dalam ponsel, jadi toast bersama prototipe tidak
 * dipakai di sini. Tombol dengar dan rekam hanya mengubah tampilan: tidak ada mikrofon atau suara
 * yang dinyalakan, dan tidak ada data yang dikirim ke mana pun.
 */
export default function OrangTua() {
  const [halaman, setHalaman] = useState("beranda");
  // skrining Nara
  const [soal, setSoal] = useState(0);
  const [jawaban, setJawaban] = useState({});
  const [setuju, setSetuju] = useState(false);
  const [skriningTerkirim, setSkriningTerkirim] = useState(false);
  const [tandaKeamanan, setTandaKeamanan] = useState(false);
  // Lapor Aman dan laporan saya
  const [langkah, setLangkah] = useState(1);
  const [isian, setIsian] = useState(ISIAN_AWAL);
  const [laporanBaru, setLaporanBaru] = useState(null);
  const [pesan, setPesan] = useState(PESAN_AWAL);
  const [balasan, setBalasan] = useState("");
  // mode cerita anak
  const [rasa, setRasa] = useState(null);
  const [kejadian, setKejadian] = useState(null);
  const [tujuan, setTujuan] = useState(null);
  const [merekam, setMerekam] = useState(false);
  const [rekamanAda, setRekamanAda] = useState(false);
  const [toast, setToast] = useState(null);

  const ponselRef = useRef(null);
  const gulirRef = useRef(null);
  const timerRef = useRef(null);
  const nomorToastRef = useRef(0);

  // Toast milik ponsel: tampil 3 detik di atas tab bawah, pesan baru menggantikan yang lama.
  const tampilkanToast = useCallback((teks) => {
    window.clearTimeout(timerRef.current);
    nomorToastRef.current += 1;
    setToast({ teks, n: nomorToastRef.current });
    timerRef.current = window.setTimeout(() => setToast(null), LAMA_TOAST);
  }, []);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  // Saat layar ponsel (atau langkah Lapor Aman) berganti, tombol yang ditekan sering ikut hilang.
  // Fokus dipindah ke judul layar baru supaya papan ketik dan pembaca layar tidak tersesat:
  // judul langkah saat langkah Lapor Aman berganti, [data-fokus] kalau layarnya punya, selain itu
  // h1 pertama (bilah atas, atau sapaan di beranda). Pembukaan pertama diurus akar prototipe.
  const kunciFokus = halaman === "lapor" ? `lapor:${langkah}` : halaman;
  const kunciFokusRef = useRef(kunciFokus);
  useEffect(() => {
    const sebelumnya = kunciFokusRef.current;
    if (sebelumnya === kunciFokus) return;
    kunciFokusRef.current = kunciFokus;
    const ponsel = ponselRef.current;
    if (!ponsel) return;
    const gantiLangkah = sebelumnya.startsWith("lapor:") && kunciFokus.startsWith("lapor:");
    const sasaran =
      (gantiLangkah && ponsel.querySelector("[data-fokus-langkah]")) ||
      ponsel.querySelector("[data-fokus]") ||
      ponsel.querySelector("h1");
    sasaran?.focus({ preventScroll: true });
  }, [kunciFokus]);

  /** Pindah layar ponsel dan mulai dari atas, seperti go() di desain. */
  function buka(id) {
    setHalaman(id);
    if (gulirRef.current) gulirRef.current.scrollTop = 0;
  }

  // ---------- skrining Nara ----------
  const keamanan = soal >= SOAL_KEAMANAN_AWAL;
  const pilihanSoal = keamanan ? PILIHAN_KEAMANAN : PILIHAN_UMUM;
  const sudahDijawab = jawaban[soal] != null;
  const jumlahDijawab = Object.keys(jawaban).length;

  function mulaiSkrining() {
    buka(jumlahDijawab > 0 ? "pertanyaan" : "pengantar");
  }

  function mulaiPertanyaan() {
    if (!setuju) {
      tampilkanToast("Centang persetujuan dulu untuk mulai");
      return;
    }
    buka("pertanyaan");
  }

  // Memilih jawaban langsung membuka soal berikutnya, kecuali di soal terakhir.
  function pilihJawaban(j) {
    setJawaban({ ...jawaban, [soal]: j });
    if (soal < SOAL_TERAKHIR) setSoal(soal + 1);
  }

  function kirimSkrining() {
    let tanda = false;
    for (let i = SOAL_KEAMANAN_AWAL; i < JUMLAH_SOAL; i += 1) {
      if (jawaban[i] === 2) tanda = true;
    }
    setSkriningTerkirim(true);
    setTandaKeamanan(tanda);
    buka("terkirim");
  }

  function soalBerikutnya() {
    if (!sudahDijawab) {
      tampilkanToast("Pilih salah satu jawaban dulu");
      return;
    }
    if (soal < SOAL_TERAKHIR) setSoal(soal + 1);
    else if (jumlahDijawab < JUMLAH_SOAL) tampilkanToast(`Masih ada ${JUMLAH_SOAL - jumlahDijawab} pertanyaan yang terlewat`);
    else kirimSkrining();
  }

  function soalSebelumnya() {
    if (soal > 0) setSoal(soal - 1);
    else buka("pengantar");
  }

  // ---------- Lapor Aman ----------
  const jenisTerpilih = JENIS_KEJADIAN.find((j) => j.label === isian.jenis);
  const tingkat = isian.bahaya === 2 ? "Darurat" : jenisTerpilih ? jenisTerpilih.tingkat : "Sedang";
  const bisaLanjut = langkah === 1 ? Boolean(isian.jenis) : true;
  const ceritaRingkas = isian.cerita.trim();
  const ringkasanLaporan =
    `${isian.jenis || "Kejadian"} · ${isian.anak} · ${isian.tempat.toLowerCase()}, ${isian.kapan.toLowerCase()}. ` +
    (ceritaRingkas ? `"${ceritaRingkas}"` : "Tanpa cerita tambahan.") +
    (isian.tanpaNama ? " Dikirim tanpa nama." : " Atas nama Ibu Dewi.");
  const janjiBaru = laporanBaru
    ? `Sekolah merespons ${JANJI_RESPON[laporanBaru.tingkat]}. Ibu akan menerima pesan di aplikasi ini.`
    : "";

  function ubahIsian(perubahan) {
    setIsian((lama) => ({ ...lama, ...perubahan }));
  }

  // Lapor Aman selalu dibuka dari langkah 1 dengan isian kosong.
  function mulaiLapor() {
    setLangkah(1);
    setIsian(ISIAN_AWAL);
    buka("lapor");
  }

  function laporLanjut() {
    if (langkah === 1 && !isian.jenis) {
      tampilkanToast("Pilih dulu apa yang terjadi");
      return;
    }
    if (langkah < JUMLAH_LANGKAH) {
      setLangkah(langkah + 1);
      if (gulirRef.current) gulirRef.current.scrollTop = 0;
      return;
    }
    setLaporanBaru({
      kode: KODE_LACAK[laporanBaru ? 1 : 0],
      jenis: isian.jenis + (isian.anak !== "Anak lain" ? ` · ${isian.anak}` : ""),
      jam: JAM_LAPORAN_BARU,
      tingkat,
    });
    buka("diterima");
  }

  // ---------- laporan saya ----------
  function kirimBalasan() {
    const teks = balasan.trim();
    if (!teks) {
      tampilkanToast("Tulis balasannya dulu");
      return;
    }
    setPesan([...pesan, { saya: true, dari: PENGIRIM_BALASAN, teks }]);
    setBalasan("");
    tampilkanToast("Balasan terkirim ke Bu Laras.");
  }

  // ---------- mode cerita anak ----------
  const orangTujuan = ORANG_DIPERCAYA.find((o) => o.label === tujuan);
  const sapaanTujuan = orangTujuan ? orangTujuan.sapaan : "Bu Laras";
  const keOrangTua = tujuan === ORANG_TUA_SENDIRI;

  function mulaiCeritaAnak() {
    setRasa(null);
    setKejadian(null);
    setTujuan(null);
    setMerekam(false);
    setRekamanAda(false);
    buka("anak1");
  }

  function dengarkan() {
    tampilkanToast("Suara membacakan pertanyaan dan pilihan untuk anak yang belum lancar membaca.");
  }

  function anakLanjut1() {
    if (!rasa) {
      tampilkanToast("Pilih satu wajah dulu, ya");
      return;
    }
    buka("anak2");
  }

  function anakLanjut2() {
    if (!kejadian) {
      tampilkanToast("Pilih satu gambar dulu, ya");
      return;
    }
    if (kejadian === KEJADIAN_BAIK) {
      buka("beranda");
      tampilkanToast("Senang mendengarnya! Mode anak ditutup.");
      return;
    }
    buka("anak3");
  }

  // Rekaman hanya tiruan: berhenti merekam berarti ada rekaman tersimpan.
  function ubahRekaman() {
    if (merekam) setRekamanAda(true);
    setMerekam(!merekam);
  }

  function anakKirim() {
    if (!tujuan) {
      tampilkanToast("Pilih orang yang kamu percaya dulu, ya");
      return;
    }
    buka("anak4");
  }

  function anakSelesai() {
    buka("beranda");
    tampilkanToast(
      keOrangTua
        ? "Cerita anak tersimpan untuk Anda baca bersama."
        : `Cerita anak terkirim ke sekolah sebagai laporan. Isinya hanya dibaca ${sapaanTujuan} dan tim BK.`,
    );
  }

  // ---------- navigasi ponsel ----------
  function kembali() {
    if (halaman === "pertanyaan") {
      if (soal > 0) setSoal(soal - 1);
      else buka("pengantar");
      return;
    }
    if (halaman === "lapor" && langkah > 1) {
      setLangkah(langkah - 1);
      return;
    }
    if (halaman === "anak2") {
      buka("anak1");
      return;
    }
    if (halaman === "anak3") {
      buka("anak2");
      return;
    }
    buka("beranda");
  }

  function aksiBilah() {
    buka("beranda");
    if (halaman === "pertanyaan") tampilkanToast("Jawaban tersimpan. Lanjutkan kapan saja dari beranda.");
  }

  function pilihTab(id) {
    if (id === "skrining") buka(skriningTerkirim ? "hasil" : "pengantar");
    else if (id === "lapor") mulaiLapor();
    else buka(id);
  }

  function tabAktif(id) {
    return (
      (id === "beranda" && halaman === "beranda") ||
      (id === "skrining" && halaman === "hasil") ||
      (id === "lacak" && halaman === "lacak")
    );
  }

  return (
    <div className={`isi ${css.layar}`}>
      <div className="hp-panggung">
        <div className="hp-cap">
          <p className="lead" data-judul-layar>
            Aplikasi Fammi untuk orang tua, dibuka dari tautan WhatsApp
          </p>
        </div>

        <section ref={ponselRef} className="hp-phone" aria-label="Aplikasi orang tua di ponsel">
          <div className="hp-bg" aria-hidden="true" />
          <div ref={gulirRef} className="hp-scr">
            {halaman !== "beranda" && (
              <header className="hp-bar">
                <button type="button" className="hp-back" aria-label="Kembali" onClick={kembali}>
                  <Ikon nama="kembali" size={24} />
                </button>
                <h1 className="hp-bart" tabIndex={-1}>
                  {JUDUL_BILAH[halaman] || ""}
                </h1>
                {LAYAR_BERAKSI.includes(halaman) && (
                  <button type="button" className="hp-baract" onClick={aksiBilah}>
                    {halaman === "pertanyaan" ? "Simpan, lanjut nanti" : "Tutup"}
                  </button>
                )}
              </header>
            )}

            {halaman === "beranda" && (
              <div className="hp-pad">
                <div className="hp-hello">
                  <div>
                    <p className="hp-sm">Your School · Sekolah Proteksi</p>
                    <h1 className="hp-h" tabIndex={-1}>
                      Halo, Ibu Dewi
                    </h1>
                  </div>
                  <span className="hp-avatar" aria-hidden="true">
                    DL
                  </span>
                </div>

                {skriningTerkirim ? (
                  <section className="hp-card">
                    <div className="hp-row">
                      <span className="hp-ic hp-g">
                        <Ikon nama="centang" size={22} />
                      </span>
                      <div>
                        <h2 className="hp-ct">Skrining Nara terkirim</h2>
                        <p className="hp-cm">Ringkasan hasil dikirim ke aplikasi ini paling lambat 3 hari sekolah.</p>
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="hp-card hp-hero">
                    <div className="hp-row">
                      <span className="hp-ic hp-w">
                        <Ikon nama="skrining" size={22} />
                      </span>
                      <div>
                        <h2 className="hp-ct">Skrining Nara belum diisi</h2>
                        <p className="hp-cm">TK B1 · 31 pertanyaan · sekitar 8 menit</p>
                      </div>
                    </div>
                    <p className="hp-cd">
                      Ceritakan keseharian Nara di rumah agar sekolah bisa mendampinginya dengan tepat. Batas Jumat, 13
                      November.
                    </p>
                    <button type="button" className="hp-btnp" onClick={mulaiSkrining}>
                      {jumlahDijawab > 0 ? `Lanjutkan (${jumlahDijawab} dari 31)` : "Isi skrining Nara"}
                    </button>
                  </section>
                )}

                <section className="hp-card">
                  <div className="hp-row">
                    <span className="hp-ic hp-r">
                      <Ikon nama="lapor" size={22} />
                    </span>
                    <div className="hp-fleks">
                      <h2 className="hp-ct">Laporan Anda tentang Raka</h2>
                      <p className="hp-cm">KS-015 · dikirim hari ini 08.12</p>
                    </div>
                    <span className="hp-pill hp-mid">Ditangani</span>
                  </div>
                  <div className="hp-mini" aria-hidden="true">
                    {[true, true, true, false, false].map((jalan, i) => (
                      <span key={i} className={jalan ? "hp-on" : undefined} />
                    ))}
                  </div>
                  <p className="hp-cd">
                    Bu Rina dan Bu Laras menangani laporan ini. Sekolah menemui Raka paling lambat pukul 12.12 hari ini.
                  </p>
                  <button type="button" className="hp-ghost" onClick={() => buka("lacak")}>
                    Lihat perkembangan
                  </button>
                </section>

                <div className="hp-tiles">
                  <button type="button" className="hp-tileb hp-red" onClick={mulaiLapor}>
                    <span className="hp-ic hp-r hp-icputih">
                      <Ikon nama="perisaiCentang" size={22} />
                    </span>
                    <b>Lapor Aman</b>
                    <span className="hp-t">Ada yang membuat anak tidak aman? Bisa tanpa nama.</span>
                  </button>
                  <button type="button" className="hp-tileb hp-pur" onClick={mulaiCeritaAnak}>
                    <span className="hp-ic hp-p">
                      <Ikon nama="senyum" size={22} />
                    </span>
                    <b>Ajak anak bercerita</b>
                    <span className="hp-t">Mode anak: cukup sentuh gambar, ada suara.</span>
                  </button>
                </div>

                <section className="hp-card">
                  <div className="hp-row">
                    <span className="hp-ic hp-g">
                      <Ikon nama="bintang" size={22} />
                    </span>
                    <div>
                      <h2 className="hp-ct">Hasil skrining Raka</h2>
                      <p className="hp-cm">Dibaca bersama wali kelas dan Guru BK · 5 Nov</p>
                    </div>
                  </div>
                  <p className="hp-cd">
                    <b>Kekuatan:</b> peduli pada teman. <b>Sedang didukung bersama:</b> pertemanan dan perasaan.
                  </p>
                  <button type="button" className="hp-ghost" onClick={() => buka("hasil")}>
                    Baca ringkasan
                  </button>
                </section>

                <section className="hp-card">
                  <div className="hp-row">
                    <span className="hp-ic hp-a">
                      <Ikon nama="buku" size={22} />
                    </span>
                    <div>
                      <h2 className="hp-ct">Besok di kelas 2B</h2>
                      <p className="hp-cm">Kelas kesadaran sesi 3</p>
                    </div>
                  </div>
                  <p className="hp-cd">
                    Raka belajar &quot;Rahasia Aman dan Rahasia Tidak Aman&quot;. Malamnya, tanyakan: rahasia apa yang boleh
                    disimpan, dan rahasia apa yang harus diceritakan?
                  </p>
                </section>
              </div>
            )}

            {halaman === "pengantar" && (
              <div className="hp-pad hp-flow">
                <section className="hp-card hp-hero">
                  <div className="hp-row">
                    <span className="hp-avatar hp-av48" aria-hidden="true">
                      NA
                    </span>
                    <div>
                      <p className="hp-ct">Nara Ayudia</p>
                      <p className="hp-cm">TK B1 · 5 tahun · wali kelas Bu Dian</p>
                    </div>
                  </div>
                </section>
                <section className="hp-card">
                  <h2 className="hp-ct">Apa ini?</h2>
                  <p className="hp-cd">
                    31 pernyataan tentang keseharian Nara di rumah selama sebulan terakhir. Tidak ada jawaban benar atau
                    salah. Jawaban bisa disimpan dan dilanjutkan nanti.
                  </p>
                  <h2 className="hp-ct">Siapa yang membaca hasilnya?</h2>
                  <p className="hp-cd">Wali kelas dan Guru BK. Hasilnya bukan diagnosis dan tidak masuk rapor.</p>
                  <h2 className="hp-ct">Kalau ada yang mengkhawatirkan?</h2>
                  <p className="hp-cd">Guru BK menghubungi Anda untuk ngobrol bersama, paling lambat 3 hari sekolah.</p>
                </section>
                <label className="hp-chk">
                  <input type="checkbox" checked={setuju} onChange={() => setSetuju(!setuju)} />
                  <span>
                    Saya setuju jawaban ini dipakai sekolah untuk mendampingi Nara, dan hanya dibaca pihak yang ditunjuk
                    sekolah.
                  </span>
                </label>
                <button
                  type="button"
                  className={kelas("hp-btnp", !setuju && "hp-off")}
                  aria-disabled={!setuju || undefined}
                  onClick={mulaiPertanyaan}
                >
                  Mulai
                </button>
              </div>
            )}

            {halaman === "pertanyaan" && (
              <div className="hp-pad hp-flow">
                <div className="hp-qhead">
                  <span>Pertanyaan {soal + 1} dari 31</span>
                  <span className="hp-pill hp-mid">{ASPEK[Math.min(5, Math.floor(soal / 5))]}</span>
                </div>
                <div className="hp-prog" aria-hidden="true">
                  <span style={{ width: `${Math.round(((soal + 1) / JUMLAH_SOAL) * 100)}%` }} />
                </div>
                {soal === SOAL_KEAMANAN_AWAL && (
                  <Catatan nada="warn" ikon="perisai" warna="#B86A00">
                    Bagian terakhir tentang keamanan anak. Jawaban Ya langsung dibaca Guru BK dan dijaga kerahasiaannya.
                  </Catatan>
                )}
                {/* Memilih jawaban langsung mengganti soal, jadi soal baru dibacakan pembaca layar. */}
                <section className="hp-card" aria-live="polite" aria-atomic="true">
                  <p className="hp-qlead">Dalam sebulan terakhir, Nara...</p>
                  <p className="hp-qtext">{SOAL[soal]}</p>
                </section>
                <div className="hp-opts" role="group" aria-label="Pilihan jawaban">
                  {pilihanSoal.map((label, j) => {
                    const dipilih = jawaban[soal] === j;
                    return (
                      <button
                        key={j}
                        type="button"
                        className={kelas("hp-opt", dipilih && "hp-on", dipilih && keamanan && j === 2 && "hp-y")}
                        aria-pressed={dipilih}
                        onClick={() => pilihJawaban(j)}
                      >
                        {label}
                        {dipilih && <Ikon nama="centang" size={22} />}
                      </button>
                    );
                  })}
                </div>
                <div className="hp-navbtns">
                  <button type="button" className="hp-ghost" onClick={soalSebelumnya}>
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    className={kelas("hp-btnp", !sudahDijawab && "hp-off")}
                    aria-disabled={!sudahDijawab || undefined}
                    onClick={soalBerikutnya}
                  >
                    {soal === SOAL_TERAKHIR ? "Kirim jawaban" : "Berikutnya"}
                  </button>
                </div>
                <p className="hp-cm hp-tengah">Jawaban tersimpan otomatis</p>
              </div>
            )}

            {halaman === "terkirim" && (
              <div className="hp-pad hp-flow">
                <div className="hp-big">
                  <span className="hp-ic hp-g hp-icbesar">
                    <Ikon nama="centang" size={36} />
                  </span>
                  <h2 className="hp-h" tabIndex={-1} data-fokus>
                    Terima kasih, Ibu Dewi
                  </h2>
                  <p className="hp-cd">31 pernyataan tentang Nara terkirim ke sekolah.</p>
                </div>
                {tandaKeamanan && (
                  <Catatan nada="bad" ikon="peringatan" warna="var(--sp-merah)">
                    Anda menjawab Ya pada pertanyaan keamanan. Guru BK akan menghubungi Anda hari ini, paling lambat 4 jam.
                    Jika Nara dalam bahaya sekarang, hubungi 112.
                  </Catatan>
                )}
                <section className="hp-card">
                  <h2 className="hp-ct">Yang terjadi selanjutnya</h2>
                  <DaftarBernomor butir={LANJUTAN_SKRINING} />
                </section>
                <button type="button" className="hp-btnp" onClick={() => buka("beranda")}>
                  Kembali ke beranda
                </button>
              </div>
            )}

            {halaman === "hasil" && (
              <div className="hp-pad">
                <section className="hp-card hp-hero">
                  <div className="hp-row">
                    <span className="hp-avatar hp-av48" aria-hidden="true">
                      RP
                    </span>
                    <div>
                      <p className="hp-ct">Raka Pratama</p>
                      <p className="hp-cm">Kelas 2B · dibaca Bu Rina dan Bu Laras · 5 Nov</p>
                    </div>
                  </div>
                </section>
                <section className="hp-card">
                  <div className="hp-row">
                    <span className="hp-ic hp-g">
                      <Ikon nama="bintang" size={22} />
                    </span>
                    <h2 className="hp-ct">Kekuatan Raka</h2>
                  </div>
                  <p className="hp-cd">
                    Peduli pada teman. Raka suka membantu merapikan kelas dan menghibur teman yang sedih. Kekuatan ini kami
                    pakai sebagai pintu masuk pendampingan.
                  </p>
                </section>
                <section className="hp-card">
                  <div className="hp-row">
                    <span className="hp-ic hp-a">
                      <Ikon nama="kelompok" size={22} />
                    </span>
                    <h2 className="hp-ct">Yang sedang kita dukung</h2>
                  </div>
                  <p className="hp-cd">
                    <b>Pertemanan.</b> Raka sering bermain sendiri saat istirahat.
                  </p>
                  <p className="hp-cd">
                    <b>Perasaan.</b> Keluhan sakit perut di pagi hari, lebih sering di rumah.
                  </p>
                </section>
                <section className="hp-card">
                  <h2 className="hp-ct">Yang dilakukan sekolah</h2>
                  <DaftarBernomor butir={DILAKUKAN_SEKOLAH} />
                </section>
                <section className="hp-card">
                  <h2 className="hp-ct">Yang bisa Ibu lakukan di rumah</h2>
                  <DaftarBernomor butir={DI_RUMAH} />
                </section>
                <Catatan nada="info" ikon="info" warna="var(--sp-ungu)">
                  Hasil skrining bukan diagnosis. Evaluasi bersama Ibu dijadwalkan Kamis, 3 Desember.
                </Catatan>
                <button
                  type="button"
                  className="hp-btnp"
                  onClick={() =>
                    tampilkanToast(
                      "Permintaan terkirim. Bu Rina menawarkan Jumat 13 Nov pukul 13.00 atau Senin 16 Nov pukul 12.30.",
                    )
                  }
                >
                  Jadwalkan obrolan dengan wali kelas
                </button>
              </div>
            )}

            {halaman === "lapor" && (
              <div className="hp-pad hp-flow">
                <div className="hp-qhead">
                  <span>
                    Langkah {langkah} dari {JUMLAH_LANGKAH}
                  </span>
                  <span>{NAMA_LANGKAH[langkah - 1]}</span>
                </div>
                <div className="hp-prog" aria-hidden="true">
                  <span style={{ width: `${Math.round((langkah / JUMLAH_LANGKAH) * 100)}%` }} />
                </div>

                {langkah === 1 && (
                  <>
                    <h2 className="hp-qtext hp-langkah" tabIndex={-1} data-fokus-langkah>
                      Apa yang terjadi?
                    </h2>
                    <div className="hp-cats" role="group" aria-label="Jenis kejadian">
                      {JENIS_KEJADIAN.map((j) => {
                        const dipilih = isian.jenis === j.label;
                        return (
                          <button
                            key={j.label}
                            type="button"
                            className={kelas("hp-catb", dipilih && "hp-on")}
                            aria-pressed={dipilih}
                            onClick={() => ubahIsian({ jenis: j.label })}
                          >
                            <span className={kelas("hp-ic", dipilih ? "hp-p" : "hp-r")}>
                              <Ikon nama={j.nama} d={j.d} size={22} />
                            </span>
                            {j.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="hp-fl">Apakah anak dalam bahaya sekarang?</p>
                    <GrupChip
                      label="Anak dalam bahaya sekarang"
                      tataLetak="hp-seg3"
                      pilihan={PILIHAN_BAHAYA}
                      terpilih={isian.bahaya}
                      indeksMerah={2}
                      onPilih={(i) => ubahIsian({ bahaya: i })}
                    />
                    {isian.bahaya === 2 && (
                      <Catatan nada="bad" ikon="telepon" warna="var(--sp-merah)">
                        Amankan anak dulu. Hubungi piket sekolah, 112, atau layanan SAPA 129. Laporan ini tetap dikirim dan
                        langsung diterima Kepala Sekolah.
                      </Catatan>
                    )}
                  </>
                )}

                {langkah === 2 && (
                  <>
                    <h2 className="hp-qtext hp-langkah" tabIndex={-1} data-fokus-langkah>
                      Ceritakan yang Ibu ketahui
                    </h2>
                    <p className="hp-fl">Anak yang mengalami</p>
                    <GrupChip
                      label="Anak yang mengalami"
                      tataLetak="hp-seg3"
                      pilihan={PILIHAN_ANAK}
                      terpilih={PILIHAN_ANAK.indexOf(isian.anak)}
                      onPilih={(i) => ubahIsian({ anak: PILIHAN_ANAK[i] })}
                    />
                    <p className="hp-fl">Kapan</p>
                    <GrupChip
                      label="Kapan terjadi"
                      tataLetak="hp-chips"
                      pilihan={PILIHAN_KAPAN}
                      terpilih={PILIHAN_KAPAN.indexOf(isian.kapan)}
                      onPilih={(i) => ubahIsian({ kapan: PILIHAN_KAPAN[i] })}
                    />
                    <p className="hp-fl">Di mana</p>
                    <GrupChip
                      label="Tempat kejadian"
                      tataLetak="hp-chips"
                      pilihan={PILIHAN_TEMPAT}
                      terpilih={PILIHAN_TEMPAT.indexOf(isian.tempat)}
                      onPilih={(i) => ubahIsian({ tempat: PILIHAN_TEMPAT[i] })}
                    />
                    <label className="hp-fl" htmlFor="ortu-cerita">
                      Cerita singkat
                    </label>
                    <textarea
                      id="ortu-cerita"
                      className="hp-inp"
                      rows={4}
                      placeholder="Tulis kata-kata anak apa adanya. Contoh: Aku didorong kakak kelas pas antre jajan."
                      value={isian.cerita}
                      onChange={(e) => ubahIsian({ cerita: e.target.value })}
                    />
                    <button
                      type="button"
                      className="hp-ghost"
                      onClick={() =>
                        tampilkanToast("Rekaman suara atau foto bisa dilampirkan. Berkas hanya dibuka tim penanganan.")
                      }
                    >
                      <Ikon nama="mik" size={20} />
                      Tambah rekaman suara atau foto
                    </button>
                  </>
                )}

                {langkah === 3 && (
                  <>
                    <h2 className="hp-qtext hp-langkah" tabIndex={-1} data-fokus-langkah>
                      Bagaimana identitas Ibu ditampilkan?
                    </h2>
                    <button
                      type="button"
                      className={kelas("hp-radio", !isian.tanpaNama && "hp-on")}
                      aria-pressed={!isian.tanpaNama}
                      onClick={() => ubahIsian({ tanpaNama: false })}
                    >
                      <span className="hp-rdot" />
                      <span>
                        <b>Tampilkan nama saya ke tim penanganan</b>
                        <span className="hp-t">Disarankan. Sekolah bisa langsung mengabari perkembangan.</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={kelas("hp-radio", isian.tanpaNama && "hp-on")}
                      aria-pressed={isian.tanpaNama}
                      onClick={() => ubahIsian({ tanpaNama: true })}
                    >
                      <span className="hp-rdot" />
                      <span>
                        <b>Kirim tanpa nama</b>
                        <span className="hp-t">Ibu tetap bisa memantau lewat kode lacak.</span>
                      </span>
                    </button>
                    <section className="hp-card">
                      <h3 className="hp-ct">Ringkasan laporan</h3>
                      <p className="hp-cd">{ringkasanLaporan}</p>
                      <p className="hp-cm">Perkiraan respon sekolah: {JANJI_RESPON[tingkat]}</p>
                    </section>
                    <Catatan nada="info" ikon="gembok" warna="var(--sp-ungu)">
                      Laporan hanya dibaca tim penanganan sekolah. Pihak yang dilaporkan tidak diberi tahu siapa pelapornya.
                    </Catatan>
                  </>
                )}

                <button
                  type="button"
                  className={kelas("hp-btnp", !bisaLanjut && "hp-off")}
                  aria-disabled={!bisaLanjut || undefined}
                  onClick={laporLanjut}
                >
                  {langkah === JUMLAH_LANGKAH ? "Kirim laporan" : "Lanjut"}
                </button>
              </div>
            )}

            {halaman === "diterima" && (
              <div className="hp-pad hp-flow">
                <div className="hp-big">
                  <span className="hp-ic hp-g hp-icbesar">
                    <Ikon nama="centang" size={36} />
                  </span>
                  <h2 className="hp-h" tabIndex={-1} data-fokus>
                    Laporan diterima
                  </h2>
                  <p className="hp-cd">Terima kasih sudah melapor. Ibu sudah melakukan hal yang benar.</p>
                </div>
                <section className="hp-card hp-tengah">
                  <p className="hp-cm">Kode lacak</p>
                  <p className="hp-code">{laporanBaru ? laporanBaru.kode : ""}</p>
                  <p className="hp-cm">Simpan kode ini bila Ibu melapor tanpa nama.</p>
                </section>
                <section className="hp-card">
                  <h2 className="hp-ct">Yang terjadi selanjutnya</h2>
                  <p className="hp-cd">{janjiBaru}</p>
                </section>
                <button type="button" className="hp-btnp" onClick={() => buka("lacak")}>
                  Lihat perkembangan
                </button>
                <button type="button" className="hp-ghost" onClick={() => buka("beranda")}>
                  Kembali ke beranda
                </button>
              </div>
            )}

            {halaman === "lacak" && (
              <div className="hp-pad">
                {laporanBaru && (
                  <section className="hp-card">
                    <div className="hp-row">
                      <div className="hp-fleks">
                        <h2 className="hp-ct">{laporanBaru.jenis}</h2>
                        <p className="hp-cm">
                          {laporanBaru.kode} · dikirim hari ini {laporanBaru.jam}
                        </p>
                      </div>
                      <span className="hp-pill hp-warn">Dinilai</span>
                    </div>
                    <DaftarLangkah
                      daftar={[
                        { status: "done", judul: "Diterima", ket: `Hari ini ${laporanBaru.jam}` },
                        { status: "now", judul: "Sedang dinilai", ket: `Koordinator BK menilai tingkat keseriusan. ${janjiBaru}` },
                        { status: "next", judul: "Diteruskan ke penanggung jawab" },
                        { status: "next", judul: "Ditangani lalu dipantau" },
                      ]}
                    />
                  </section>
                )}
                <section className="hp-card">
                  <div className="hp-row">
                    <div className="hp-fleks">
                      <h2 className="hp-ct">Raka didorong dan dipukul</h2>
                      <p className="hp-cm">KS-015 · dikirim hari ini 08.12</p>
                    </div>
                    <span className="hp-pill hp-mid">Ditangani</span>
                  </div>
                  <DaftarLangkah daftar={LANGKAH_KS015} />
                </section>
                <section className="hp-card">
                  <h2 className="hp-ct">Pesan dari sekolah</h2>
                  <div className="hp-msgs">
                    {pesan.map((m, i) => (
                      <div key={i} className={kelas("hp-msg", m.saya ? "hp-out" : "hp-in")}>
                        <b>{m.dari}</b>
                        {m.teks}
                      </div>
                    ))}
                  </div>
                  <div className="hp-reply">
                    <label htmlFor="ortu-balasan" className="hp-sr">
                      Balas pesan
                    </label>
                    <input
                      id="ortu-balasan"
                      className="hp-inp"
                      placeholder="Balas pesan"
                      value={balasan}
                      onChange={(e) => setBalasan(e.target.value)}
                    />
                    <button type="button" className="hp-send" aria-label="Kirim balasan" onClick={kirimBalasan}>
                      <Ikon nama="kirim" size={22} />
                    </button>
                  </div>
                  <p className="hp-cm">Ibu melihat tahap dan pesan dari sekolah. Catatan internal tim tidak ditampilkan.</p>
                </section>
              </div>
            )}

            {halaman === "anak1" && (
              <div className="hp-kid">
                <h2 className="hp-kq" tabIndex={-1} data-fokus>
                  Halo! Bagaimana perasaanmu hari ini?
                </h2>
                <TombolDengar onClick={dengarkan} />
                <div className="hp-faces" role="group" aria-label="Pilih perasaan">
                  {WAJAH.map((w) => {
                    const dipilih = rasa === w.label;
                    return (
                      <button
                        key={w.label}
                        type="button"
                        className={kelas("hp-face", dipilih && "hp-on")}
                        aria-pressed={dipilih}
                        onClick={() => setRasa(w.label)}
                      >
                        <Wajah isi={w.isi} mulut={w.mulut} ukuran={64} />
                        {w.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className={kelas("hp-btnp", !rasa && "hp-off")}
                  aria-disabled={!rasa || undefined}
                  onClick={anakLanjut1}
                >
                  Lanjut
                </button>
              </div>
            )}

            {halaman === "anak2" && (
              <div className="hp-kid">
                <h2 className="hp-kq" tabIndex={-1} data-fokus>
                  Ada yang membuatmu tidak nyaman?
                </h2>
                <TombolDengar onClick={dengarkan} />
                <div className="hp-pics" role="group" aria-label="Pilih yang terjadi">
                  {GAMBAR_KEJADIAN.map((g) => (
                    <TombolGambar
                      key={g.label}
                      pilihan={g}
                      dipilih={kejadian === g.label}
                      onPilih={() => setKejadian(g.label)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className={kelas("hp-btnp", !kejadian && "hp-off")}
                  aria-disabled={!kejadian || undefined}
                  onClick={anakLanjut2}
                >
                  Lanjut
                </button>
              </div>
            )}

            {halaman === "anak3" && (
              <div className="hp-kid">
                <h2 className="hp-kq" tabIndex={-1} data-fokus>
                  Kamu mau cerita ke siapa?
                </h2>
                <div className="hp-pics" role="group" aria-label="Pilih orang dewasa">
                  {ORANG_DIPERCAYA.map((o) => (
                    <TombolGambar
                      key={o.label}
                      pilihan={o}
                      dipilih={tujuan === o.label}
                      onPilih={() => setTujuan(o.label)}
                    />
                  ))}
                </div>
                <h2 className="hp-kq hp-kqkecil">Mau cerita pakai suaramu?</h2>
                <button
                  type="button"
                  className={kelas("hp-mic", merekam && "hp-rec")}
                  aria-label={merekam ? "Hentikan rekaman" : "Mulai rekam suara"}
                  onClick={ubahRekaman}
                >
                  <Ikon nama="mik" size={44} />
                </button>
                <p className="hp-cm hp-tengah" aria-live="polite">
                  {merekam
                    ? "Sedang merekam... tekan lagi untuk berhenti"
                    : rekamanAda
                      ? "Rekaman tersimpan, 0:24"
                      : "Tekan tombol untuk merekam"}
                </p>
                <button
                  type="button"
                  className={kelas("hp-btnp", !tujuan && "hp-off")}
                  aria-disabled={!tujuan || undefined}
                  onClick={anakKirim}
                >
                  Kirim ceritaku
                </button>
              </div>
            )}

            {halaman === "anak4" && (
              <div className="hp-kid">
                <div className="hp-big">
                  <Wajah isi={WAJAH[0].isi} mulut={WAJAH[0].mulut} ukuran={120} />
                  <h2 className="hp-kq" tabIndex={-1} data-fokus>
                    Terima kasih sudah berani bercerita!
                  </h2>
                  <p className="hp-cd hp-cdbesar">
                    Kamu tidak salah. {sapaanTujuan} akan menemuimu{" "}
                    {keOrangTua ? "untuk mendengarkan ceritamu" : "besok pagi di sekolah"}.
                  </p>
                </div>
                <button type="button" className="hp-btnp" onClick={anakSelesai}>
                  Selesai
                </button>
              </div>
            )}
          </div>

          {LAYAR_BERTAB.includes(halaman) && (
            <nav className="hp-tabs" aria-label="Menu utama">
              {TAB.map((t) => {
                const aktif = tabAktif(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={kelas("hp-tab", aktif && "hp-on")}
                    aria-current={aktif ? "page" : "false"}
                    onClick={() => pilihTab(t.id)}
                  >
                    <Ikon nama={t.nama} d={t.d} size={24} />
                    {t.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Wadah status selalu ada supaya pesan baru dibacakan pembaca layar. */}
          <div className="hp-toastwadah" role="status">
            {toast && (
              <div key={toast.n} className={`hp-toast ${dasar.toastMasuk}`}>
                <Ikon nama="sukses" size={18} warna="var(--sp-toast-ikon)" />
                <span>{toast.teks}</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/** Catatan berwarna dengan ikon di kiri. nada: info, bad, warn. */
function Catatan({ nada, ikon, warna, children }) {
  return (
    <div className={`hp-note hp-${nada}`}>
      <Ikon nama={ikon} size={18} warna={warna} />
      <span>{children}</span>
    </div>
  );
}

/** Daftar bernomor dalam lingkaran ungu. */
function DaftarBernomor({ butir }) {
  return (
    <ol className="hp-list">
      {butir.map((teks, i) => (
        <li key={teks} className="hp-li">
          <span className="hp-num">{i + 1}</span>
          <span>{teks}</span>
        </li>
      ))}
    </ol>
  );
}

/** Tahap laporan. Tahap yang sedang berjalan ditandai aria-current="step". */
function DaftarLangkah({ daftar }) {
  return (
    <ol className="hp-steps">
      {daftar.map((l, i) => (
        <li key={l.judul} className="hp-step" aria-current={l.status === "now" ? "step" : undefined}>
          <span className={`hp-sdot hp-${l.status}`}>{i + 1}</span>
          <div>
            <div className={kelas("hp-st", l.status === "next" && "hp-next")}>{l.judul}</div>
            {l.ket ? <div className="hp-sd">{l.ket}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * Deret tombol pilihan tunggal (Lapor Aman). `terpilih` dan `onPilih` memakai indeks pilihan;
 * `indeksMerah` diberi warna merah saat terpilih (jawaban Ya untuk anak dalam bahaya).
 */
function GrupChip({ label, tataLetak, pilihan, terpilih, onPilih, indeksMerah = -1 }) {
  return (
    <div className={tataLetak} role="group" aria-label={label}>
      {pilihan.map((teks, i) => {
        const dipilih = i === terpilih;
        return (
          <button
            key={teks}
            type="button"
            className={kelas("hp-chipb", dipilih && "hp-on", dipilih && i === indeksMerah && "hp-y")}
            aria-pressed={dipilih}
            onClick={() => onPilih(i)}
          >
            {teks}
          </button>
        );
      })}
    </div>
  );
}

/** Tombol bergambar besar di mode anak: ubin ikon berwarna + kalimat. */
function TombolGambar({ pilihan, dipilih, onPilih }) {
  return (
    <button type="button" className={kelas("hp-pic", dipilih && "hp-on")} aria-pressed={dipilih} onClick={onPilih}>
      <span className={`hp-ic hp-${pilihan.nada}`}>
        <Ikon nama={pilihan.nama} d={pilihan.d} size={28} />
      </span>
      {pilihan.label}
    </button>
  );
}

/** Tombol Dengarkan: di prototipe hanya memberi tahu bahwa pertanyaan akan dibacakan. */
function TombolDengar({ onClick }) {
  return (
    <button type="button" className="hp-listen" onClick={onClick}>
      <Ikon nama="suara" size={20} />
      Dengarkan
    </button>
  );
}

/** Wajah perasaan: lingkaran berwarna, dua mata, dan mulut. Mata dan mulut memakai warna teks kelas hp-wajah. */
function Wajah({ isi, mulut, ukuran }) {
  return (
    <svg className="hp-wajah" viewBox="0 0 24 24" width={ukuran} height={ukuran} aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill={isi} />
      <circle cx="9" cy="10" r="1.3" fill="currentColor" />
      <circle cx="15" cy="10" r="1.3" fill="currentColor" />
      <path d={mulut} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

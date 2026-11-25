import { useCallback, useEffect, useRef, useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon } from "../komponen";
import { cariAspek } from "../bersama/heart";
import { PEMILIK } from "../bersama/tindakLanjut";
import dasar from "../proteksi.module.css";
import css from "./OrangTua.module.css";
import OrangTuaBeranda from "./OrangTuaBeranda";
import { DetailAspek, HasilHeart, PendampingRaka } from "./OrangTuaHeart";
import OrangTuaChecklist from "./OrangTuaChecklist";
import { LaporAman, Laporanku } from "./OrangTuaLaporan";
import OrangTuaAnak from "./OrangTuaAnak";
import OrangTuaScreening from "./OrangTuaScreening";
import { BilahKembali } from "./OrangTuaBagian";
import NavMelayang from "../bersama/NavMelayang";
import DialogVideo from "../bersama/DialogVideo";

/** Video Fammi untuk orang tua: inti skrining HEART. */
const VIDEO_ORTU = "hDmkFaquRso";
import { awalKecil, kelas, useFokusBerganti } from "./OrangTuaAlat";

/**
 * Jawaban penilaian awal untuk antrean sekolah menurut tingkat laporan orang tua, sehingga usulan
 * tingkat di layar Kasus (tingkatDari di kasusData.js) sama: Darurat = ada bahaya saat ini, Tinggi =
 * kekerasan fisik, Sedang = berulang.
 */
const JAWABAN_TINGKAT = {
  Darurat: [2, 0, 0, 0, 0, 0],
  Tinggi: [0, 0, 2, 0, 0, 0],
  Sedang: [0, 0, 0, 2, 0, 0],
  Rendah: [0, 0, 0, 0, 0, 0],
};
import {
  ANAK,
  ASPEK_UTAMA,
  JAM_LAPORAN_BARU,
  JUDUL_TAB,
  KODE_LACAK,
  PENGIRIM_BALASAN,
  PESAN_AWAL,
  TAB,
  TUGAS_RUMAH,
  TUGAS_SEKOLAH,
  TAB_IDS,
  LAMA_SCREENING,
  SCREENING_ORTU,
  laporanBaru as buatLaporan,
  rutinOrtu,
} from "./orangTuaData";

/** Ponsel ini selalu milik Ibu Dewi, apa pun sudut pandang yang dipilih di header. */
const PERAN_PONSEL = "ortu";
const LAMA_TOAST = 3200;
/** Halaman turunan tab Hasil HEART: detail aspek dan daftar pendamping. */
const TURUNAN_HEART = ["aspek", "pendamping"];
/** Halaman yang memakai tab bawah. */
const HALAMAN_BERTAB = [...TAB_IDS, ...TURUNAN_HEART];
const WALI = PEMILIK.walas.orang;
/** Halaman alur yang dibuka di atas tab dan kembali ke tab asal. */
const ALUR_PONSEL = ["lapor", "anak", "screening"];

/**
 * Orang tua & anak: aplikasi ponsel Ibu Dewi, ibu Raka Pratama kelas 2B (kanvas desain pemilik
 * produk 2026-11-11, versi ringkas HEART). Tampil seperti aplikasi sungguhan, tanpa bingkai ponsel
 * tiruan dan tanpa keterangan di luar layarnya (instruksi pemilik produk 2026-11-15): di ponsel
 * Android dan iPhone aplikasinya memenuhi layar (isi menggulir, tab bawah menempel dan menghormati
 * area aman); di layar lebar ia tampil sebagai kolom selebar ponsel di tengah.
 *
 * Beranda adalah menu (masukan pemilik produk 2026-11-25, "less is more"): Lapor Aman paling atas,
 * lalu yang dicek tiap hari, lalu yang dibuka sesekali; rincian ada di halaman masing-masing dan
 * bagian yang jarang dibaca dilipat. Tab bawah: Beranda, Checklist (tugas rumah yang dicentang Ibu
 * Dewi lewat konteks, plus kemajuan sekolah), Laporanku (KS-015, pesan sekolah, riwayat), dan Hasil
 * HEART (ringkasan, lima aspek, lalu halaman detail aspek dan halaman pendamping). Lapor Aman dan
 * mode cerita anak dibuka dari Beranda. Lonceng di kepala aplikasi membaca notifikasi
 * peran "ortu" dari konteks; aksi { jenis: "buka", id } (dari lonceng header atau layar lain)
 * membuka tab itu.
 *
 * Toast hidup di dalam ponsel, jadi toast bersama prototipe tidak dipakai di sini. Semua data contoh:
 * tidak ada suara, mikrofon, atau data yang dikirim ke mana pun.
 */
export default function OrangTua() {
  const {
    aksi,
    aksiSelesai,
    notifikasi,
    bacaNotifikasi,
    bacaSemua,
    beriTahu,
    centang,
    ubahCentang,
    buatLaporan: masukkanKeAntrean,
    checklistTambahan,
    pantauRaka,
    cekRaka,
    jawabPantauRaka,
    heartOrtu,
    selesaikanHeartOrtu,
    tutupPopupHeart,
  } = useProteksi();
  const [halaman, setHalaman] = useState("beranda");
  const [aspek, setAspek] = useState(ASPEK_UTAMA);
  const [asalAlur, setAsalAlur] = useState("beranda");
  const [kunjungan, setKunjungan] = useState(0);
  const [notifBuka, setNotifBuka] = useState(false);
  const [laporanBaru, setLaporanBaru] = useState([]);
  const [pesan, setPesan] = useState(PESAN_AWAL);
  const [toast, setToast] = useState(null);
  // Dialog skrining terkunci. Cek mingguan (perkembangan Raka) hidup di konteks prototipe supaya
  // ikut terbaca di Laporan anak sisi sekolah.
  const [infoSkrining, setInfoSkrining] = useState(false);

  const ponselRef = useRef(null);
  const gulirRef = useRef(null);
  const loncengRef = useRef(null);
  const timerRef = useRef(null);
  const nomorToastRef = useRef(0);

  // Setiap perpindahan halaman (termasuk membuka tab yang sama lagi) memindah fokus ke judulnya.
  useFokusBerganti(ponselRef, kunjungan, "[data-fokus]");

  // Toast milik ponsel: tampil sebentar di atas tab bawah, pesan baru menggantikan yang lama.
  const tampilkanToast = useCallback((teks) => {
    window.clearTimeout(timerRef.current);
    nomorToastRef.current += 1;
    setToast({ teks, n: nomorToastRef.current });
    timerRef.current = window.setTimeout(() => setToast(null), LAMA_TOAST);
  }, []);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const keAtas = useCallback(() => {
    if (gulirRef.current) gulirRef.current.scrollTop = 0;
  }, []);

  /** Pindah halaman ponsel dan mulai dari atas. */
  const buka = useCallback(
    (id) => {
      setNotifBuka(false);
      setHalaman(id);
      setKunjungan((k) => k + 1);
      keAtas();
    },
    [keAtas],
  );

  /** Lapor Aman ("lapor"), mode cerita anak ("anak"), dan Screening HEART ("screening"); tombol kembalinya pulang ke tab asal. */
  const mulaiAlur = useCallback(
    (id) => {
      setAsalAlur(TURUNAN_HEART.includes(halaman) ? "heart" : TAB_IDS.includes(halaman) ? halaman : "beranda");
      buka(id);
    },
    [buka, halaman],
  );

  /** Buka tab ("beranda", "heart", "checklist", "laporanku") atau alur ("lapor", "anak", "screening"). */
  const bukaTab = useCallback(
    (id) => {
      if (TAB_IDS.includes(id)) buka(id);
      else if (ALUR_PONSEL.includes(id)) mulaiAlur(id);
    },
    [buka, mulaiAlur],
  );

  function bukaAspek(id) {
    setAspek(id);
    buka("aspek");
  }

  function pilihAspek(id) {
    setAspek(id);
    keAtas();
  }

  // Permintaan dari lonceng header atau layar lain: { jenis: "buka", id }. Jenis lain bukan milik
  // layar ini (mis. "gulir" ditangani akar prototipe), jadi dibiarkan. Mengubah state di efek di
  // sini disengaja: permintaannya sekali pakai dan datang dari luar layar.
  useEffect(() => {
    if (aksi?.jenis !== "buka") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    bukaTab(aksi.id);
    aksiSelesai();
  }, [aksi, aksiSelesai, bukaTab]);

  // ---------- lonceng ----------
  const milikSaya = notifikasi.filter((n) => n.peran === PERAN_PONSEL);
  const belumDibaca = milikSaya.filter((n) => !n.dibaca).length;

  function tutupNotif() {
    setNotifBuka(false);
    loncengRef.current?.focus();
  }

  function bukaNotif(n) {
    bacaNotifikasi(n.id);
    const tujuan = n.tujuan;
    if (tujuan?.layar === "orangtua" && tujuan.aksi?.jenis === "buka") bukaTab(tujuan.aksi.id);
    else tutupNotif();
  }

  // ---------- checklist ----------
  function centangTugas(butir, selesai) {
    ubahCentang(butir.id, selesai);
    if (!selesai) {
      tampilkanToast("Tanda selesai dibatalkan.");
      return;
    }
    tampilkanToast(`Tercatat. ${WALI} ikut diberi tahu.`);
    beriTahu({
      peran: "walas",
      ikon: "sukses",
      nada: "ok",
      judul: "Ibu Dewi menyelesaikan checklist rumah",
      isi: butir.judul,
      tujuan: { layar: "anak", aksi: { jenis: "gulir", id: "tindak" } },
    });
  }


  // ---------- laporan ----------
  /**
   * Laporan baru selalu mulai di Triage; Guru BK (dan Kepala Sekolah bila Darurat) diberi tahu.
   * Orang tua melihat kode lacak; sekolah menerima laporan yang sama sebagai kasus di antrean triage
   * layar Kasus (nomornya dibagi konteks). `jenis` dan `anak` dari isian Lapor Aman.
   */
  function kirimLaporan({ judul, jenis, anak, tingkat, sumber, tanpaNama = false, judulNotif, isiNotif, peran }) {
    // Kode contoh dipakai berurutan; sesudah habis dibuat kode berurut supaya tetap unik.
    const kode = KODE_LACAK[laporanBaru.length] || `LA-${7101 + laporanBaru.length}`;
    const laporan = buatLaporan({ kode, judul, tingkat, sumber, jam: JAM_LAPORAN_BARU });
    setLaporanBaru((d) => [laporan, ...d]);
    const idKasus = masukkanKeAntrean({
      lapor: {
        jenis: jenis || judul,
        nama: anak === "Anak lain" ? "" : ANAK.nama,
        kelas: "2B",
        lokasi: "Sekolah",
        kapan: "Hari ini",
        cerita: `${judul}. Dikirim lewat ${sumber} dengan kode lacak ${kode}${tanpaNama ? ", tanpa nama pelapor" : ""}.`,
        jawaban: JAWABAN_TINGKAT[tingkat] || JAWABAN_TINGKAT.Rendah,
      },
      sumber:
        sumber === "mode cerita anak"
          ? "Raka lewat mode cerita anak · aplikasi orang tua"
          : tanpaNama
            ? "Orang tua tanpa nama · Lapor Aman"
            : "Ibu Dewi (orang tua) · Lapor Aman",
    });
    const penerima = peran || "bk";
    beriTahu({
      peran: tingkat === "Darurat" ? [...new Set([...[penerima].flat(), "kepsek"])] : penerima,
      ikon: "peringatan",
      nada: "red",
      judul: judulNotif || `Laporan ${sumber} ${kode} · ${tingkat}`,
      isi: isiNotif || `${judul}. Dari orang tua${tanpaNama ? ", tanpa nama" : ""}. Menunggu dicek.`,
      tujuan: { layar: "kasus", aksi: { jenis: "kasus", id: idKasus } },
    });
    return laporan;
  }

  function kirimCeritaAnak({ kejadian, orang }) {
    if (!orang.peran) return null;
    return kirimLaporan({
      judul: `Cerita Raka: ${awalKecil(kejadian.label)}`,
      jenis: `Cerita anak: ${awalKecil(kejadian.label)}`,
      anak: "Raka",
      tingkat: kejadian.tingkat,
      sumber: "mode cerita anak",
      peran: orang.peran,
      judulNotif: `Cerita anak lewat aplikasi orang tua · ${kejadian.tingkat}`,
      isiNotif: `${ANAK.nama}: "${kejadian.label}". Ingin bercerita ke ${orang.sapaan}. Menunggu dicek.`,
    });
  }

  /** Screening HEART dari Ibu Dewi terkirim: hasil Raka lengkap, wali kelas dan Guru BK diberi tahu. */
  function kirimScreening() {
    selesaikanHeartOrtu();
    beriTahu({
      peran: ["walas", "bk"],
      ikon: "hati",
      nada: "p",
      judul: "Ibu Dewi mengisi Screening HEART Raka",
      isi: "Hasil HEART Raka sekarang memakai isian wali kelas dan orang tua.",
      tujuan: { layar: "anak", aksi: { jenis: "gulir", id: "hasil" } },
    });
  }

  function jawabPantau(idAspek, jawaban) {
    jawabPantauRaka(idAspek, jawaban);
    tampilkanToast(`Tercatat. ${WALI} dan Guru BK ikut melihat perkembangannya.`);
    beriTahu({
      peran: "walas",
      ikon: "grafik",
      nada: "p",
      judul: "Ibu Dewi mengisi cek mingguan Raka",
      isi: "Grafik perkembangan sesudah screening diperbarui.",
      tujuan: { layar: "anak", aksi: { jenis: "gulir", id: "hasil" } },
    });
  }

  // Tugas rumah dan sekolah: rekomendasi Fammi ditambah butir yang ditambahkan sekolah selama demo.
  const tambahanRaka = checklistTambahan.filter((c) => c.anak === ANAK.nama);
  const tugasRumah = [...TUGAS_RUMAH, ...tambahanRaka.filter((c) => c.oleh === "ortu")];
  const tugasSekolah = [...TUGAS_SEKOLAH, ...tambahanRaka.filter((c) => c.oleh !== "ortu")];
  const rutin = rutinOrtu(tugasRumah);
  const pantau = pantauRaka;
  const sudahCek = cekRaka;

  function keluarAlur(pesanToast) {
    buka(asalAlur);
    if (pesanToast) tampilkanToast(pesanToast);
  }

  function balasPesan(teks) {
    setPesan((d) => [...d, { saya: true, dari: PENGIRIM_BALASAN, teks }]);
    tampilkanToast("Balasan terkirim ke Bu Laras.");
  }

  const bertab = HALAMAN_BERTAB.includes(halaman);
  const tabAktif = TURUNAN_HEART.includes(halaman) ? "heart" : halaman;

  return (
    <div className={css.layar}>
      <h1 className="sr" data-judul-layar>
        Aplikasi orang tua
      </h1>
      <div className="hp-panggung">
        <section ref={ponselRef} className="hp-phone" aria-label="Aplikasi orang tua">
          <div className="hp-bg" aria-hidden="true" />
          <div ref={gulirRef} className={kelas("hp-scr", bertab && "hp-bertab")}>
            {TAB_IDS.includes(halaman) && (
              <BilahAtas
                halaman={halaman}
                belumDibaca={belumDibaca}
                notifBuka={notifBuka}
                loncengRef={loncengRef}
                onLonceng={() => setNotifBuka(!notifBuka)}
              />
            )}

            {halaman === "beranda" && (
              <OrangTuaBeranda
                centang={centang}
                onCentang={centangTugas}
                laporanBaru={laporanBaru}
                onBukaTab={bukaTab}
                onLapor={() => mulaiAlur("lapor")}
                onCeritaAnak={() => mulaiAlur("anak")}
                onScreening={() => mulaiAlur("screening")}
                rutin={rutin}
                heartSelesai={heartOrtu.selesai}
              />
            )}
            {halaman === "heart" && (
              <HasilHeart
                onBukaAspek={bukaAspek}
                onBukaPendamping={() => buka("pendamping")}
                onInfoSkrining={() => setInfoSkrining(true)}
                onScreening={() => mulaiAlur("screening")}
                heartSelesai={heartOrtu.selesai}
              />
            )}
            {halaman === "aspek" && (
              <>
                <BilahKembali judul={cariAspek(aspek)?.nama || "Hasil HEART"} onKembali={() => buka("heart")} />
                <DetailAspek
                  aspekId={aspek}
                  onPilihAspek={pilihAspek}
                  centang={centang}
                  onCentang={centangTugas}
                  pantau={pantau}
                  sudahCek={sudahCek}
                  onJawabPantau={jawabPantau}
                  tugasRumah={tugasRumah}
                  tugasSekolah={tugasSekolah}
                />
              </>
            )}
            {halaman === "pendamping" && (
              <>
                <BilahKembali judul="Yang mendampingi Raka" onKembali={() => buka("heart")} />
                <PendampingRaka />
              </>
            )}
            {halaman === "checklist" && (
              <OrangTuaChecklist
                centang={centang}
                onCentang={centangTugas}
                onBukaAspek={bukaAspek}
                pantau={pantau}
                sudahCek={sudahCek}
                onJawabPantau={jawabPantau}
                rutin={rutin}
                tugasSekolah={tugasSekolah}
              />
            )}
            {halaman === "laporanku" && (
              <Laporanku
                laporanBaru={laporanBaru}
                pesan={pesan}
                onBalas={balasPesan}
                onLapor={() => mulaiAlur("lapor")}
                tampilkanToast={tampilkanToast}
              />
            )}
            {/* key: setiap kali dibuka, alur mulai lagi dari langkah pertama dengan isian kosong. */}
            {halaman === "lapor" && (
              <LaporAman
                key={kunjungan}
                onKeluar={() => keluarAlur()}
                onKirim={kirimLaporan}
                onBukaTab={bukaTab}
                tampilkanToast={tampilkanToast}
                keAtas={keAtas}
              />
            )}
            {halaman === "screening" && (
              <OrangTuaScreening
                key={kunjungan}
                onSelesai={kirimScreening}
                onLihatHasil={() => buka("heart")}
                onKeluar={() => keluarAlur()}
                keAtas={keAtas}
              />
            )}
            {halaman === "anak" && (
              <OrangTuaAnak
                key={kunjungan}
                onKirim={kirimCeritaAnak}
                onKeluar={keluarAlur}
                tampilkanToast={tampilkanToast}
                keAtas={keAtas}
              />
            )}
          </div>

          {bertab && <NavMelayang tab={TAB} aktif={tabAktif} onPilih={buka} />}

          {infoSkrining && (
            <DialogVideo
              judul="Screening Raka sudah diisi"
              isi="Screening berikutnya dibuka tim Fammi. Sekarang, baca hasilnya dan praktikkan sarannya."
              idVideo={VIDEO_ORTU}
              labelVideo="Video Fammi: apa itu screening HEART"
              aksi="Baca saran untuk Raka"
              onAksi={() => {
                setInfoSkrining(false);
                bukaAspek(ASPEK_UTAMA);
              }}
              onTutup={() => setInfoSkrining(false)}
            />
          )}

          {/* Ajakan Screening HEART saat aplikasi dibuka, selama Ibu Dewi belum mengisinya. */}
          {heartOrtu.popup && !heartOrtu.selesai && halaman === "beranda" && !notifBuka && (
            <DialogVideo
              ikon="hati"
              judul="Isi Screening HEART Raka"
              isi={`${SCREENING_ORTU.length} pernyataan, ${LAMA_SCREENING}. Hasilnya membantu Ibu dan sekolah mendampingi Raka.`}
              aksi="Mulai screening"
              onAksi={() => {
                tutupPopupHeart();
                mulaiAlur("screening");
              }}
              kedua={{ label: "Nanti saja", onClick: tutupPopupHeart }}
              onTutup={tutupPopupHeart}
            />
          )}

          {notifBuka && (
            <PanelNotifikasi
              daftar={milikSaya}
              belumDibaca={belumDibaca}
              onBuka={bukaNotif}
              onBacaSemua={() => bacaSemua(PERAN_PONSEL)}
              onTutup={tutupNotif}
            />
          )}

          {/* Wadah status selalu ada supaya pesan baru dibacakan pembaca layar. */}
          <div className={kelas("hp-toastwadah", !bertab && "hp-tanpatab")} role="status">
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

/** Kepala aplikasi di halaman bertab: sapaan atau judul tab, dan lonceng notifikasi Ibu Dewi. */
function BilahAtas({ halaman, belumDibaca, notifBuka, loncengRef, onLonceng }) {
  const beranda = halaman === "beranda";
  return (
    <header className={kelas("hp-appbar", beranda && "hp-appberanda")}>
      <div className="hp-fleks">
        {beranda ? <p className="hp-appsub">Sekolah Proteksi · Raka, kelas {ANAK.kelas}</p> : null}
        <h2 className="hp-appjudul" tabIndex={-1} data-fokus>
          {JUDUL_TAB[halaman]}
        </h2>
      </div>
      <button
        ref={loncengRef}
        type="button"
        className="hp-lonceng"
        aria-expanded={notifBuka}
        aria-controls={notifBuka ? "hp-notif" : undefined}
        aria-label={belumDibaca ? `Notifikasi Ibu Dewi, ${belumDibaca} belum dibaca` : "Notifikasi Ibu Dewi"}
        onClick={onLonceng}
      >
        <Ikon nama="lonceng" size={22} />
        {belumDibaca > 0 && (
          <span className="hp-lencana" aria-hidden="true">
            {belumDibaca}
          </span>
        )}
      </button>
    </header>
  );
}

const BISA_FOKUS = "button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex='-1'])";

/**
 * Panel notifikasi di dalam ponsel (dialog). Fokus masuk ke panel, Tab berputar di dalamnya, Escape
 * dan ketukan di luar panel menutup lalu mengembalikan fokus ke lonceng.
 */
function PanelNotifikasi({ daftar, belumDibaca, onBuka, onBacaSemua, onTutup }) {
  const panelRef = useRef(null);

  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, []);

  function saatTombol(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onTutup();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    const semua = [...panelRef.current.querySelectorAll(BISA_FOKUS)];
    if (semua.length === 0) return;
    const pertama = semua[0];
    const terakhir = semua[semua.length - 1];
    if (e.shiftKey && (document.activeElement === pertama || document.activeElement === panelRef.current)) {
      e.preventDefault();
      terakhir.focus();
    } else if (!e.shiftKey && document.activeElement === terakhir) {
      e.preventDefault();
      pertama.focus();
    }
  }

  return (
    <>
      {/* Tanpa animasi masuk: animasi opacity bawaan berakhir di 1 dan akan menimpa redupnya lapisan. */}
      <button type="button" className="hp-nlapis" aria-label="Tutup notifikasi" tabIndex={-1} onClick={onTutup} />
      <div
        id="hp-notif"
        ref={panelRef}
        className={`hp-npanel ${dasar.menuMasuk}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hp-notif-judul"
        tabIndex={-1}
        onKeyDown={saatTombol}
      >
        <div className="hp-nhead">
          <h2 id="hp-notif-judul" className="hp-ntitle">
            Notifikasi
          </h2>
          <span className="hp-cm">{belumDibaca ? `${belumDibaca} belum dibaca` : "Semua sudah dibaca"}</span>
          {belumDibaca > 0 && (
            <button type="button" className="hp-nsemua" onClick={onBacaSemua}>
              Tandai dibaca
            </button>
          )}
          <button type="button" className="hp-ntutup" aria-label="Tutup notifikasi" onClick={onTutup}>
            <Ikon nama="tutup" size={18} />
          </button>
        </div>
        {daftar.length === 0 ? (
          <p className="hp-nkosong">Belum ada notifikasi.</p>
        ) : (
          <ul className="hp-nlist">
            {daftar.map((n) => (
              <li key={n.id}>
                <button type="button" className={kelas("hp-nitem", !n.dibaca && "hp-baru")} onClick={() => onBuka(n)}>
                  <span className={`tile ${n.nada} hp-nikon`}>
                    <Ikon nama={n.ikon} size={16} />
                  </span>
                  <span className="hp-nteks">
                    <b>{n.judul}</b>
                    <span>{n.isi}</span>
                    <span className="hp-nwaktu">
                      {n.waktu}
                      {n.dibaca ? "" : " · belum dibaca"}
                    </span>
                  </span>
                  {!n.dibaca && <span className="hp-ntitik" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

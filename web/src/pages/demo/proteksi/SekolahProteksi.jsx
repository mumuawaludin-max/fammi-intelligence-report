import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProteksiKonteks, useProteksi } from "./konteks";
import { Ikon } from "./komponen";
import { PERAN, cariLayar, layarSah } from "./layarProteksi";
import { NOTIFIKASI_AWAL } from "./bersama/notifikasi";
import { CENTANG_AWAL } from "./bersama/tindakLanjut";
import { PANTAU_RAKA, titikBaru } from "./bersama/pantau";
import ProteksiHeader from "./ProteksiHeader";

/** Nomor kasus pertama yang dibuat selama demo (data contoh berhenti di KS-016). */
const NOMOR_KASUS_PERTAMA = 17;
import Ringkasan from "./layar/Ringkasan";
import Skrining from "./layar/Skrining";
import Pemetaan from "./layar/Pemetaan";
import RuangKelas from "./layar/RuangKelas";
import ProfilAnak from "./layar/ProfilAnak";
import Kasus from "./layar/Kasus";
import OrangTua from "./layar/OrangTua";
import Remaja from "./layar/Remaja";
import PetaAlur from "./layar/PetaAlur";
import dasar from "./proteksi.module.css";

const KOMPONEN = {
  ringkasan: Ringkasan,
  skrining: Skrining,
  pemetaan: Pemetaan,
  kelas: RuangKelas,
  anak: ProfilAnak,
  kasus: Kasus,
  orangtua: OrangTua,
  remaja: Remaja,
  alur: PetaAlur,
};

/**
 * Sekolah Proteksi: prototipe klik demo modul Safety & Crisis Management (kanvas desain pemilik
 * produk 2026-11-11, versi ringkas 2026-11-11). Dua alur yang selalu terlihat di header dan bilah
 * alur: pencegahan (skrining HEART -> hasil per anak -> tindak lanjut -> checklist) dan kejadian
 * (lapor -> triage -> penugasan -> penanganan -> pantau dan tutup), plus lonceng notifikasi.
 *
 * Semuanya data contoh di sisi browser: tidak ada panggilan ke Supabase, tidak ada yang disimpan.
 * Dibuka dari penampil demo (DemoReportViewer, tampilan berjenis "prototipe") dan dimuat terpisah
 * (lazy) supaya tidak membebani halaman masuk.
 *
 * layarAwal: id layar pembuka dari registri demo (Kepala Sekolah -> ringkasan, dst).
 */
export default function SekolahProteksi({ layarAwal }) {
  const awal = layarSah(layarAwal);
  const [layar, setLayar] = useState(awal);
  const [peran, setPeran] = useState(() => cariLayar(awal).peran || "kepsek");
  const [aksi, setAksi] = useState(null);
  const [pesan, setPesan] = useState(null);
  // Jumlah kasus aktif di lencana menu. Layar Kasus mengirim angka hidupnya selama terbuka; di luar
  // itu lencana memakai angka registri (data contoh kembali ke awal saat layar Kasus ditutup).
  const [hitungKasus, setHitungKasus] = useState(null);
  const [notifikasi, setNotifikasi] = useState(() => NOTIFIKASI_AWAL.map((n) => ({ ...n, dibaca: Boolean(n.dibaca) })));
  const [centang, setCentang] = useState(CENTANG_AWAL);
  // Tindak lanjut yang disusun selama demo (layar Skrining) dan butir checklist yang lahir darinya,
  // supaya alur pencegahan bersambung: rencana di Skrining muncul di checklist Ruang wali kelas.
  const [rencanaBaru, setRencanaBaru] = useState({});
  const [checklistTambahan, setChecklistTambahan] = useState([]);
  // Laporan kejadian yang dibuat selama demo dari layar mana pun (Kasus, skrining wali kelas, Lapor
  // Aman di ponsel), satu urutan nomor, supaya semuanya masuk antrean triage di layar Kasus.
  const [laporanBaru, setLaporanBaru] = useState([]);
  // Cek mingguan orang tua sesudah skrining (perkembangan Raka): diisi di aplikasi orang tua,
  // dibaca juga di Laporan anak, jadi wali kelas dan Guru BK melihat delta yang sama.
  const [pantauRaka, setPantauRaka] = useState(() =>
    Object.fromEntries(Object.entries(PANTAU_RAKA).map(([k, v]) => [k, v.riwayat])),
  );
  const [cekRaka, setCekRaka] = useState({});
  // Screening HEART dari orang tua. Demo dibuka sebelum Ibu Dewi mengisinya, jadi ajakannya tampil
  // sebagai popup saat aplikasi orang tua pertama dibuka (masukan pemilik produk 2026-11-25).
  const [heartOrtu, setHeartOrtu] = useState({ selesai: false, popup: true });
  const nomorKasusRef = useRef(NOMOR_KASUS_PERTAMA);
  const nomorRef = useRef(0);
  const timerRef = useRef(null);
  const akarRef = useRef(null);
  const sudahPindahRef = useRef(false);

  const pindah = useCallback((id, aksiBaru = null) => {
    const tujuan = cariLayar(id);
    if (!tujuan) return;
    nomorRef.current += 1;
    sudahPindahRef.current = true;
    setAksi(aksiBaru ? { ...aksiBaru, n: nomorRef.current } : null);
    setLayar(id);
    if (tujuan.peran) setPeran(tujuan.peran);
  }, []);

  const aksiSelesai = useCallback(() => setAksi(null), []);

  const toast = useCallback((teks) => {
    window.clearTimeout(timerRef.current);
    nomorRef.current += 1;
    setPesan({ teks, n: nomorRef.current });
    timerRef.current = window.setTimeout(() => setPesan(null), 3000);
  }, []);

  const beriTahu = useCallback((n) => {
    const daftarPeran = Array.isArray(n.peran) ? n.peran : [n.peran];
    const baru = daftarPeran.map((p) => {
      nomorRef.current += 1;
      return { waktu: "Baru saja", nada: "p", ikon: "lonceng", ...n, peran: p, id: `baru-${nomorRef.current}`, dibaca: false };
    });
    setNotifikasi((d) => [...baru, ...d]);
  }, []);

  const bacaNotifikasi = useCallback((id) => {
    setNotifikasi((d) => d.map((n) => (n.id === id ? { ...n, dibaca: true } : n)));
  }, []);

  const bacaSemua = useCallback((p) => {
    setNotifikasi((d) => d.map((n) => (n.peran === p ? { ...n, dibaca: true } : n)));
  }, []);

  const ubahCentang = useCallback((id, selesai) => {
    setCentang((c) => ({ ...c, [id]: selesai }));
  }, []);

  /**
   * Laporan kejadian baru: { lapor, sumber, tambahan? }. `lapor` berbentuk isian formulir Lapor
   * kejadian di layar Kasus (laporKosong di kasusData.js), `tambahan` digabung ke kasusnya (mis.
   * { dariSkrining: true }). Mengembalikan nomor kasus baru (KS-017, KS-018, ...).
   */
  const buatLaporan = useCallback(({ lapor, sumber, tambahan = null }) => {
    const id = `KS-${String(nomorKasusRef.current).padStart(3, "0")}`;
    nomorKasusRef.current += 1;
    setLaporanBaru((d) => [{ id, lapor, sumber, tambahan }, ...d]);
    return id;
  }, []);

  const simpanRencana = useCallback((nama, rencana) => {
    setRencanaBaru((r) => ({ ...r, [nama]: rencana }));
  }, []);

  // Butir baru berbentuk sama dengan CHECKLIST (bersama/tindakLanjut.js). Id yang sudah ada diganti,
  // jadi menyimpan ulang rencana yang sama tidak menggandakan butir.
  const tambahChecklist = useCallback((daftar) => {
    const id = new Set(daftar.map((b) => b.id));
    setChecklistTambahan((d) => [...d.filter((b) => !id.has(b.id)), ...daftar]);
    setCentang((c) => ({ ...c, ...Object.fromEntries(daftar.map((b) => [b.id, Boolean(b.selesai)])) }));
  }, []);

  const jawabPantauRaka = useCallback((idAspek, jawaban) => {
    setPantauRaka((p) => ({ ...p, [idAspek]: [...p[idAspek], titikBaru(p[idAspek], jawaban)] }));
    setCekRaka((c) => ({ ...c, [idAspek]: true }));
  }, []);

  const selesaikanHeartOrtu = useCallback(() => setHeartOrtu({ selesai: true, popup: false }), []);
  const tutupPopupHeart = useCallback(() => setHeartOrtu((h) => ({ ...h, popup: false })), []);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  // Layar baru mulai dari atas, dan fokus pindah ke judulnya supaya pembaca layar tahu isinya
  // berganti. Pembukaan pertama tidak memindahkan fokus (tombol Kembali di bilah demo yang fokus).
  useEffect(() => {
    const akar = akarRef.current;
    if (!akar) return;
    akar.scrollIntoView({ block: "start" });
    if (!sudahPindahRef.current) return;
    const judul = akar.querySelector("[data-judul-layar]") || akar.querySelector("h1");
    if (judul) {
      if (!judul.hasAttribute("tabindex")) judul.setAttribute("tabindex", "-1");
      judul.focus({ preventScroll: true });
    }
  }, [layar]);

  // Aksi gulir dari bilah alur dan notifikasi: berjalan sesudah efek layar di atas, jadi bagian yang
  // dituju menang atas "mulai dari atas". Aksinya sengaja tidak dihapus (layar mengabaikan jenis
  // yang bukan miliknya); permintaan berikutnya selalu membawa `n` baru sehingga tetap terbaca.
  useEffect(() => {
    if (aksi?.jenis !== "gulir") return;
    const bagian = akarRef.current?.querySelector(`[data-bagian="${aksi.id}"]`);
    if (!bagian) return;
    bagian.scrollIntoView({ block: "start" });
    if (!bagian.hasAttribute("tabindex")) bagian.setAttribute("tabindex", "-1");
    bagian.focus({ preventScroll: true });
  }, [aksi]);

  const nilai = useMemo(
    () => ({
      layar,
      peran,
      pindah,
      aksi,
      aksiSelesai,
      toast,
      hitungKasus,
      setHitungKasus,
      notifikasi,
      beriTahu,
      bacaNotifikasi,
      bacaSemua,
      centang,
      ubahCentang,
      rencanaBaru,
      simpanRencana,
      checklistTambahan,
      tambahChecklist,
      laporanBaru,
      buatLaporan,
      pantauRaka,
      cekRaka,
      jawabPantauRaka,
      heartOrtu,
      selesaikanHeartOrtu,
      tutupPopupHeart,
    }),
    [
      layar,
      peran,
      pindah,
      aksi,
      aksiSelesai,
      toast,
      hitungKasus,
      notifikasi,
      beriTahu,
      bacaNotifikasi,
      bacaSemua,
      centang,
      ubahCentang,
      rencanaBaru,
      simpanRencana,
      checklistTambahan,
      tambahChecklist,
      laporanBaru,
      buatLaporan,
      pantauRaka,
      cekRaka,
      jawabPantauRaka,
      heartOrtu,
      selesaikanHeartOrtu,
      tutupPopupHeart,
    ],
  );

  const Layar = KOMPONEN[layar];
  const aplikasi = layar === "orangtua" || layar === "remaja";

  return (
    <ProteksiKonteks.Provider value={nilai}>
      <div ref={akarRef} className={dasar.scope} data-sp-akar="">
        {aplikasi ? (
          // Aplikasi orang tua dan remaja tampil sendiri seperti aplikasi sungguhan: tanpa header dashboard.
          <>
            <Layar key={layar} />
            <PeganganPeran />
          </>
        ) : (
          <>
            <div className="bg" aria-hidden="true" />
            <div className="wrap">
              <ProteksiHeader />
              <Layar key={layar} />
            </div>
          </>
        )}

        <div className="sr" role="status" aria-live="polite">{pesan?.teks || ""}</div>
        {pesan && (
          <div key={pesan.n} className={`toast ${dasar.toastMasuk}`} aria-hidden="true">
            <Ikon nama="sukses" size={18} warna="var(--sp-toast-ikon)" />
            {pesan.teks}
          </div>
        )}
      </div>
    </ProteksiKonteks.Provider>
  );
}

/**
 * Pegangan kecil di tepi kanan aplikasi orang tua untuk pindah ke sudut pandang sekolah selama demo.
 * Sengaja tanpa label di luar layar aplikasi; menunya baru terbuka saat ditekan.
 */
function PeganganPeran() {
  const { pindah, peran } = useProteksi();
  const [buka, setBuka] = useState(false);
  return (
    <>
      {buka && (
        <>
          <div className="sp-tirai" onMouseDown={() => setBuka(false)} aria-hidden="true" />
          <nav className={`sp-tepi-menu ${dasar.menuMasuk}`} aria-label="Lihat sebagai">
            <p className="sp-tepi-judul">Lihat sebagai</p>
            {PERAN.filter((p) => p.id !== peran).map((p) => (
              <button key={p.id} type="button" className="sp-tepi-butir" onClick={() => pindah(p.layar)}>
                <b>{p.label}</b>
                <span>{p.sub}</span>
              </button>
            ))}
          </nav>
        </>
      )}
      <button type="button" className="sp-tepi" aria-expanded={buka} aria-label="Lihat sebagai peran lain" title="Lihat sebagai" onClick={() => setBuka((b) => !b)}>
        <Ikon nama="kelompok" size={16} />
      </button>
    </>
  );
}


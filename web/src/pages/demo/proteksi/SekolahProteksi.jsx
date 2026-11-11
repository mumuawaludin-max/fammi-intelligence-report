import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProteksiKonteks } from "./konteks";
import { Ikon } from "./komponen";
import { cariLayar, layarSah } from "./layarProteksi";
import ProteksiHeader from "./ProteksiHeader";
import Ringkasan from "./layar/Ringkasan";
import Skrining from "./layar/Skrining";
import RuangKelas from "./layar/RuangKelas";
import ProfilAnak from "./layar/ProfilAnak";
import Kasus from "./layar/Kasus";
import OrangTua from "./layar/OrangTua";
import PetaAlur from "./layar/PetaAlur";
import dasar from "./proteksi.module.css";

const KOMPONEN = {
  ringkasan: Ringkasan,
  skrining: Skrining,
  kelas: RuangKelas,
  anak: ProfilAnak,
  kasus: Kasus,
  orangtua: OrangTua,
  alur: PetaAlur,
};

/**
 * Sekolah Proteksi: prototipe klik demo modul Safety & Crisis Management (kanvas desain pemilik
 * produk 2026-11-11). Skrining perilaku dan mental anak 4-10 tahun hanya satu bagiannya; sisanya
 * kelas kesadaran, kanal Lapor Aman, penanganan kasus dengan SLA, dan pemantauan pimpinan.
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

  const nilai = useMemo(
    () => ({ layar, peran, pindah, aksi, aksiSelesai, toast, hitungKasus, setHitungKasus }),
    [layar, peran, pindah, aksi, aksiSelesai, toast, hitungKasus],
  );

  const Layar = KOMPONEN[layar];

  return (
    <ProteksiKonteks.Provider value={nilai}>
      <div ref={akarRef} className={dasar.scope} data-sp-akar="">
        <div className="bg" aria-hidden="true" />
        <div className="wrap">
          <ProteksiHeader />
          <Layar key={layar} />
        </div>

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

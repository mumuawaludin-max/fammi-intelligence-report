import { Ikon } from "../komponen";
import { PetaHati } from "../bersama/HeartKecil";
import { Cincin } from "../bersama/Grafik";
import { hitungSelesai } from "./OrangTuaAlat";
import { MiniLangkah } from "./OrangTuaBagian";
import { ASPEK_PER_STATUS, HASIL_RAKA, KS015, STATUS_TAHAP, TUGAS_RUMAH } from "./orangTuaData";

// Aspek yang disebut di kartu HEART: Waspada lebih dulu, kalau tidak ada baru Perlu Perhatian.
const SOROT = ASPEK_PER_STATUS.waspada[0]
  ? { teks: `${ASPEK_PER_STATUS.waspada[0].nama} terindikasi perlu didampingi`, nada: "bad" }
  : ASPEK_PER_STATUS.perhatian[0]
    ? { teks: `${ASPEK_PER_STATUS.perhatian[0].nama} terindikasi perlu diperhatikan`, nada: "warn" }
    : { teks: "Semua aspek baik", nada: "ok" };

/**
 * Beranda aplikasi orang tua sebagai bento kartu (masukan pemilik produk 2026-11-25): Lapor Aman
 * selebar layar paling atas karena paling mendesak, lalu kartu yang dicek tiap hari (checklist
 * dengan cincin kemajuan, laporan berjalan), lalu hasil HEART dengan peta hati kecil, dan ajak anak
 * bercerita. Tidak ada tombol menghubungi wali kelas: semua dari orang tua lewat formulir (instruksi
 * pemilik produk 2026-11-25). Tiap kartu satu angka atau satu status; rinciannya di halamannya.
 */
export default function OrangTuaBeranda({ centang, laporanBaru, onBukaTab, onLapor, onCeritaAnak, tugasRumah = TUGAS_RUMAH }) {
  const nRumah = hitungSelesai(tugasRumah, centang);
  const berikutnya = tugasRumah.find((c) => !centang[c.id]);
  const laporan = laporanBaru[0] || KS015;
  const jumlahAktif = laporanBaru.length + 1;

  return (
    <div className="hp-pad">
      <div className="hp-bento">
        <button type="button" className="hp-bk hp-bk-lapor hp-lebar" style={{ "--urut": 0 }} onClick={onLapor}>
          <span className="hp-bk-ikon">
            <Ikon nama="perisaiCentang" size={26} />
          </span>
          <span className="hp-fleks">
            <b>Lapor Aman</b>
            <span>Anak tidak aman? Lapor sekarang, bisa tanpa nama.</span>
          </span>
          <Ikon nama="kanan" size={22} />
        </button>

        <button type="button" className="hp-bk hp-bk-putih" style={{ "--urut": 1 }} onClick={() => onBukaTab("checklist")}>
          <span className="hp-bk-label">Checklist</span>
          <Cincin
            nilai={nRumah}
            dari={tugasRumah.length}
            warna="var(--sp-hijau-batang)"
            ukuran={74}
            tebal={11}
            label={`${nRumah} dari ${tugasRumah.length} tugas rumah selesai`}
          />
          <span className="hp-bk-ket">
            {berikutnya ? `Berikutnya: ${berikutnya.judul}` : "Semua tugas rumah selesai"}
          </span>
        </button>

        <button type="button" className="hp-bk hp-bk-putih" style={{ "--urut": 2 }} onClick={() => onBukaTab("laporanku")}>
          <span className="hp-bk-label">Laporanku</span>
          <span className="hp-bk-angka">
            {jumlahAktif}
            <small>aktif</small>
          </span>
          <span className={`pill sm ${laporan.tahap === "triage" ? "warn" : "mid"}`}>{STATUS_TAHAP[laporan.tahap]}</span>
          <MiniLangkah tahap={laporan.tahap} />
          <span className="hp-bk-ket">{laporan.kode}</span>
        </button>

        <button type="button" className="hp-bk hp-bk-heart hp-lebar" style={{ "--urut": 3 }} onClick={() => onBukaTab("heart")}>
          <span className="hp-bk-hati" aria-hidden="true">
            <PetaHati hasil={HASIL_RAKA} lebar={96} label="Peta HEART Raka" />
          </span>
          <span className="hp-fleks">
            <span className="hp-bk-label">Hasil screening HEART</span>
            <b className="hp-bk-judul">Raka, 3 Nov</b>
            <span className={`hp-bk-sorot hp-st-${SOROT.nada}`}>
              <span className="hp-sorotdot" aria-hidden="true" />
              {SOROT.teks}
            </span>
          </span>
          <Ikon nama="kanan" size={20} className="hp-chev" />
        </button>

        <button type="button" className="hp-bk hp-bk-cerita hp-lebar" style={{ "--urut": 4 }} onClick={onCeritaAnak}>
          <span className="hp-bk-ikonkecil">
            <Ikon nama="senyum" size={22} />
          </span>
          <span className="hp-fleks">
            <b>Ajak Raka bercerita</b>
            <span className="hp-bk-ket">Raka cukup menyentuh gambar, ada suara.</span>
          </span>
          <Ikon nama="kanan" size={20} className="hp-chev" />
        </button>
      </div>
    </div>
  );
}

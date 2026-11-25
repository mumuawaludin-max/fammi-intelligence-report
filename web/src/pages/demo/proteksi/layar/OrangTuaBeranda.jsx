import { useId, useState } from "react";
import { Ikon } from "../komponen";
import { PetaHati } from "../bersama/HeartKecil";
import { hitungSelesai, kelas } from "./OrangTuaAlat";
import { MiniLangkah } from "./OrangTuaBagian";
import {
  ANAK,
  ASPEK_PER_STATUS,
  HASIL_RAKA,
  KS015,
  LAMA_SCREENING,
  RITME,
  SCREENING_ORTU,
  STATUS_TAHAP,
  cuplikanRutin,
} from "./orangTuaData";

const NAMA = ANAK.nama.split(" ")[0];

// Aspek yang disebut di kartu HEART: Perlu Perhatian Lebih lebih dulu, lalu Perlu Diperhatikan.
const SOROT = ASPEK_PER_STATUS.waspada[0]
  ? { teks: `${ASPEK_PER_STATUS.waspada[0].nama} terindikasi perlu didampingi`, nada: "bad" }
  : ASPEK_PER_STATUS.perhatian[0]
    ? { teks: `${ASPEK_PER_STATUS.perhatian[0].nama} terindikasi perlu diperhatikan`, nada: "warn" }
    : { teks: "Semua aspek Aman", nada: "ok" };

/**
 * Beranda aplikasi orang tua, urut menurut prioritas (masukan pemilik produk 2026-11-25):
 * 1. Lapor Aman, inti sistem krisis.
 * 2. Keadaan laporan yang sedang berjalan.
 * 3. Cuplikan tiga butir checklist, supaya langsung terbayang yang perlu dilakukan.
 * 4. Ajak anak bercerita: pilihan, tidak wajib.
 * 5. Hasil Screening HEART.
 * Selama orang tua belum mengisi screening, ajakan screening naik ke paling atas (di atas Lapor
 * Aman) dan juga tampil sebagai popup saat aplikasi dibuka (di OrangTua.jsx). Tidak ada tombol
 * menghubungi wali kelas: semua dari orang tua lewat formulir.
 */
export default function OrangTuaBeranda({ centang, onCentang, laporanBaru, onBukaTab, onLapor, onCeritaAnak, onScreening, rutin, heartSelesai }) {
  const laporan = laporanBaru[0] || KS015;
  const jumlahAktif = laporanBaru.length + 1;
  const nSelesai = hitungSelesai(rutin, centang);
  // Butir cuplikan dipilih sekali saat Beranda dibuka, supaya butir yang baru dicentang tetap di
  // tempatnya (tercoret) dan tidak langsung diganti butir lain.
  const [idCuplikan] = useState(() => cuplikanRutin(rutin, centang).map((b) => b.id));
  const cuplikan = idCuplikan.map((id) => rutin.find((b) => b.id === id)).filter(Boolean);
  // Urutan animasi masuk: kartu screening yang belum diisi menggeser kartu lain satu langkah.
  const geser = heartSelesai ? 0 : 1;

  const kartuScreening = (
    <button type="button" className="hp-bk hp-bk-heart hp-lebar" style={{ "--urut": 0 }} onClick={onScreening}>
      <span className="hp-bk-ikon hp-bk-ikonungu">
        <Ikon nama="hati" size={26} />
      </span>
      <span className="hp-fleks">
        <b className="hp-bk-judul">{`Isi Screening HEART ${NAMA}`}</b>
        <span className="hp-bk-ket">{`${SCREENING_ORTU.length} pernyataan, ${LAMA_SCREENING}`}</span>
      </span>
      <Ikon nama="kanan" size={20} className="hp-chev" />
    </button>
  );

  return (
    <div className="hp-pad">
      <div className="hp-bento">
        {!heartSelesai && kartuScreening}

        <button type="button" className="hp-bk hp-bk-lapor hp-lebar" style={{ "--urut": geser }} onClick={onLapor}>
          <span className="hp-bk-ikon">
            <Ikon nama="perisaiCentang" size={26} />
          </span>
          <span className="hp-fleks">
            <b>Lapor Aman</b>
            <span>Anak tidak aman? Lapor sekarang.</span>
          </span>
          <Ikon nama="kanan" size={22} />
        </button>

        <button type="button" className="hp-bk hp-bk-putih hp-lebar hp-bk-laporan" style={{ "--urut": geser + 1 }} onClick={() => onBukaTab("laporanku")}>
          <span className="hp-fleks">
            <span className="hp-bk-label">{`Laporanku · ${jumlahAktif} aktif`}</span>
            <span className="hp-bk-baris">
              <b className="hp-bk-judul">{laporan.kode}</b>
              <span className={`pill sm ${laporan.tahap === "triage" ? "warn" : "mid"}`}>{STATUS_TAHAP[laporan.tahap]}</span>
            </span>
            <MiniLangkah tahap={laporan.tahap} />
          </span>
          <Ikon nama="kanan" size={20} className="hp-chev" />
        </button>

        <section className="hp-bk hp-bk-putih hp-lebar hp-bk-cek" style={{ "--urut": geser + 2 }} aria-labelledby="ortu-b-cek">
          <div className="hp-bk-baris">
            <h3 id="ortu-b-cek" className="hp-bk-label">
              Checklist
            </h3>
            <span className="hp-bk-label">{`${nSelesai} dari ${rutin.length} selesai`}</span>
          </div>
          {cuplikan.length > 0 ? (
            <ul className="hp-cuplik">
              {cuplikan.map((b) => (
                <BarisCuplikan key={b.id} butir={b} selesai={Boolean(centang[b.id])} onCentang={onCentang} />
              ))}
            </ul>
          ) : (
            <p className="hp-bk-ket">Semua checklist selesai. Terima kasih, Ibu.</p>
          )}
          <button type="button" className="hp-tautan" onClick={() => onBukaTab("checklist")}>
            Lihat semua
            <Ikon nama="kanan" size={16} />
          </button>
        </section>

        <button type="button" className="hp-bk hp-bk-cerita hp-lebar" style={{ "--urut": geser + 3 }} onClick={onCeritaAnak}>
          <span className="hp-bk-ikonkecil">
            <Ikon nama="senyum" size={22} />
          </span>
          <span className="hp-fleks">
            <b>{`Ajak ${NAMA} bercerita`}</b>
            <span className="hp-bk-ket">Pilihan, kapan saja.</span>
          </span>
          <Ikon nama="kanan" size={20} className="hp-chev" />
        </button>

        {heartSelesai && (
          <button type="button" className="hp-bk hp-bk-heart hp-lebar" style={{ "--urut": 4 }} onClick={() => onBukaTab("heart")}>
            <span className="hp-bk-hati" aria-hidden="true">
              <PetaHati hasil={HASIL_RAKA} lebar={72} label={`Peta HEART ${NAMA}`} />
            </span>
            <span className="hp-fleks">
              <span className="hp-bk-label">Hasil Screening HEART</span>
              <span className={`hp-bk-sorot hp-st-${SOROT.nada}`}>
                <span className="hp-sorotdot" aria-hidden="true" />
                {SOROT.teks}
              </span>
            </span>
            <Ikon nama="kanan" size={20} className="hp-chev" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Satu butir cuplikan checklist: kotak centang, judul, dan ritmenya. */
function BarisCuplikan({ butir, selesai, onCentang }) {
  const id = useId();
  return (
    <li className={kelas("hp-cuplikb", selesai && "hp-selesai")}>
      <input id={id} type="checkbox" className="hp-tgcek" checked={selesai} onChange={(e) => onCentang(butir, e.target.checked)} />
      <label htmlFor={id} className="hp-fleks">
        <span className="hp-cuplikjudul">{butir.judul}</span>
        <span className={`hp-ritme hp-ritme-${butir.ritme}`}>{RITME[butir.ritme]}</span>
      </label>
    </li>
  );
}

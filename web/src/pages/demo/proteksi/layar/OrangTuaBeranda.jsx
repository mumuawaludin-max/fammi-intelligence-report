import { Ikon } from "../komponen";
import { HurufHeart } from "../bersama/HeartKecil";
import { LAPORAN_RAKA } from "../bersama/heart";
import { Kemajuan, MiniLangkah } from "./OrangTuaBagian";
import { gabungNama, hitungSelesai } from "./OrangTuaAlat";
import { ASPEK_PER_STATUS, HASIL_RAKA, KS015, TUGAS_RUMAH, TUGAS_SEKOLAH } from "./orangTuaData";

const nama = (daftar) => gabungNama(daftar.map((a) => a.nama));

// Aspek yang disorot di kartu HEART: Waspada lebih dulu, kalau tidak ada baru Perlu Perhatian.
const SOROT = ASPEK_PER_STATUS.waspada.length
  ? { aspek: ASPEK_PER_STATUS.waspada, teks: "perlu didampingi", nada: "hp-bad" }
  : { aspek: ASPEK_PER_STATUS.perhatian, teks: "perlu perhatian", nada: "hp-warn" };

// Kalimat untuk aspek lain, mis. "Emosional perlu perhatian. Hiperaktivitas, Agresi, dan Tolong Menolong baik."
const SISA = [
  ASPEK_PER_STATUS.waspada.length && ASPEK_PER_STATUS.perhatian.length
    ? `${nama(ASPEK_PER_STATUS.perhatian)} perlu perhatian.`
    : "",
  ASPEK_PER_STATUS.baik.length ? `${nama(ASPEK_PER_STATUS.baik)} baik.` : "",
]
  .filter(Boolean)
  .join(" ");

/**
 * Beranda aplikasi orang tua, ringkas: status HEART Raka, checklist minggu ini, laporan aktif, dan
 * pintasan Lapor Aman serta mode cerita anak.
 */
export default function OrangTuaBeranda({ centang, laporanBaru, onBukaTab, onBukaAspek, onLapor, onCeritaAnak }) {
  const nRumah = hitungSelesai(TUGAS_RUMAH, centang);
  const nSekolah = hitungSelesai(TUGAS_SEKOLAH, centang);
  const berikutnya = TUGAS_RUMAH.find((c) => !centang[c.id]);

  return (
    <div className="hp-pad">
      <section className="hp-card" aria-labelledby="ortu-b-heart">
        <div className="hp-row">
          <span className="hp-ic hp-p">
            <Ikon nama="hati" size={22} />
          </span>
          <div className="hp-fleks">
            <h3 id="ortu-b-heart" className="hp-ct">
              Hasil skrining HEART Raka
            </h3>
            <p className="hp-cm">{LAPORAN_RAKA.tanggal} · bukan diagnosis</p>
          </div>
        </div>
        <div className="hp-row hp-antara">
          <HurufHeart heart={HASIL_RAKA} ukuran="md" />
          <button type="button" className="hp-tautan" onClick={() => onBukaTab("heart")}>
            Lihat hasil
            <Ikon nama="kanan" size={18} />
          </button>
        </div>
        {SOROT.aspek.map((a) => (
          <button key={a.id} type="button" className={`hp-sorotan ${SOROT.nada}`} onClick={() => onBukaAspek(a.id)}>
            <span className="hp-sorotdot" aria-hidden="true" />
            <span className="hp-fleks">
              {a.nama} {SOROT.teks}
            </span>
            <Ikon nama="kanan" size={18} />
          </button>
        ))}
        {SISA ? <p className="hp-cd">{SISA}</p> : null}
      </section>

      <section className="hp-card" aria-labelledby="ortu-b-cek">
        <div className="hp-row">
          <span className="hp-ic hp-g">
            <Ikon nama="ceklis" size={22} />
          </span>
          <div className="hp-fleks">
            <h3 id="ortu-b-cek" className="hp-ct">
              Checklist minggu ini
            </h3>
            <p className="hp-cm">Tindak lanjut hasil HEART, dikerjakan bersama</p>
          </div>
        </div>
        <div className="hp-kemrow">
          <span>Di rumah</span>
          <Kemajuan n={nRumah} m={TUGAS_RUMAH.length} label="Tugas di rumah" />
          <b>
            {nRumah} dari {TUGAS_RUMAH.length}
          </b>
        </div>
        <div className="hp-kemrow">
          <span>Sekolah</span>
          <Kemajuan n={nSekolah} m={TUGAS_SEKOLAH.length} label="Tugas sekolah" />
          <b>
            {nSekolah} dari {TUGAS_SEKOLAH.length}
          </b>
        </div>
        <p className="hp-cd">
          {berikutnya ? (
            <>
              <b>Berikutnya untuk Ibu:</b> {berikutnya.judul} · {berikutnya.waktu}
            </>
          ) : (
            "Semua tugas rumah minggu ini sudah selesai. Terima kasih, Bu."
          )}
        </p>
        <button type="button" className="hp-ghost" onClick={() => onBukaTab("checklist")}>
          Buka checklist
        </button>
      </section>

      <section className="hp-card" aria-labelledby="ortu-b-lapor">
        <div className="hp-row">
          <span className="hp-ic hp-r">
            <Ikon nama="lapor" size={22} />
          </span>
          <div className="hp-fleks">
            <h3 id="ortu-b-lapor" className="hp-ct">
              Laporan Anda {KS015.kode}
            </h3>
            <p className="hp-cm">{KS015.judul}</p>
          </div>
        </div>
        <MiniLangkah tahap={KS015.tahap} />
        <p className="hp-cd">
          Bu Rina dan Bu Laras menangani. <b>{KS015.sla.judul}.</b>
        </p>
        {laporanBaru.length > 0 && (
          <p className="hp-cm">
            {laporanBaru.length === 1
              ? `Laporan baru ${laporanBaru[0].kode} sedang dinilai Guru BK.`
              : `${laporanBaru.length} laporan baru sedang dinilai Guru BK.`}
          </p>
        )}
        <button type="button" className="hp-ghost" onClick={() => onBukaTab("laporanku")}>
          Lihat perkembangan
        </button>
      </section>

      <div className="hp-tiles">
        <button type="button" className="hp-tileb hp-red" onClick={onLapor}>
          <span className="hp-ic hp-r hp-icputih">
            <Ikon nama="perisaiCentang" size={22} />
          </span>
          <b>Lapor Aman</b>
          <span className="hp-t">Ada yang membuat anak tidak aman? Bisa tanpa nama.</span>
        </button>
        <button type="button" className="hp-tileb hp-pur" onClick={onCeritaAnak}>
          <span className="hp-ic hp-p">
            <Ikon nama="senyum" size={22} />
          </span>
          <b>Ajak anak bercerita</b>
          <span className="hp-t">Mode anak: cukup sentuh gambar, ada suara.</span>
        </button>
      </div>
    </div>
  );
}

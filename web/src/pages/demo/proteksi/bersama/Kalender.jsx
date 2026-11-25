import { useState } from "react";
import { Ikon } from "../komponen";
import { iso, labelTanggal } from "./tanggal";
import s from "./kalender.module.css";

const HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

/**
 * Kalender pilih tanggal yang menyatu dengan desain prototipe (pengganti kalender bawaan browser):
 * kisi bulan dengan hari Senin di depan, tombol bulan sebelumnya/berikutnya, hari ini ditandai, dan
 * tanggal terpilih terisi ungu. `nilai` dan `onPilih` memakai format ISO ("2026-11-25"). `maks`
 * dan `min` (ISO, opsional) membatasi pilihan, mis. kejadian tidak boleh di masa depan.
 */
export default function Kalender({ nilai, onPilih, maks, min, label = "Pilih tanggal" }) {
  const hariIni = iso(new Date());
  const awal = nilai ? new Date(`${nilai}T00:00:00`) : new Date();
  const [bulan, setBulan] = useState({ th: awal.getFullYear(), bl: awal.getMonth() });

  const pertama = new Date(bulan.th, bulan.bl, 1);
  const geser = (pertama.getDay() + 6) % 7; // Senin = 0
  const jumlahHari = new Date(bulan.th, bulan.bl + 1, 0).getDate();
  const sel = [...Array(geser).fill(null), ...Array.from({ length: jumlahHari }, (_, i) => i + 1)];

  const isoHari = (h) => iso(new Date(bulan.th, bulan.bl, h));
  const bolehSebelum = !min || isoHari(1) > min;
  const bolehSesudah = !maks || iso(new Date(bulan.th, bulan.bl + 1, 1)) <= maks;

  function pindahBulan(n) {
    setBulan((b) => {
      const d = new Date(b.th, b.bl + n, 1);
      return { th: d.getFullYear(), bl: d.getMonth() };
    });
  }

  return (
    <div className={s.kalender} role="group" aria-label={label}>
      <div className={s.kepala}>
        <button type="button" className={s.panah} aria-label="Bulan sebelumnya" disabled={!bolehSebelum} onClick={() => pindahBulan(-1)}>
          <Ikon nama="kembali" size={18} />
        </button>
        <b aria-live="polite">{`${BULAN[bulan.bl]} ${bulan.th}`}</b>
        <button type="button" className={s.panah} aria-label="Bulan berikutnya" disabled={!bolehSesudah} onClick={() => pindahBulan(1)}>
          <Ikon nama="sebelah" size={18} />
        </button>
      </div>
      <div className={s.kisi}>
        {HARI.map((h) => (
          <span key={h} className={s.namaHari} aria-hidden="true">
            {h}
          </span>
        ))}
        {sel.map((h, i) => {
          if (!h) return <span key={`k${i}`} />;
          const t = isoHari(h);
          const mati = (maks && t > maks) || (min && t < min);
          const dipilih = t === nilai;
          return (
            <button
              key={t}
              type="button"
              className={`${s.tgl} ${dipilih ? s.dipilih : ""} ${t === hariIni ? s.hariIni : ""}`}
              disabled={mati}
              aria-pressed={dipilih}
              aria-label={labelTanggal(t)}
              onClick={() => onPilih(t)}
            >
              {h}
            </button>
          );
        })}
      </div>
      <div className={s.kaki}>
        <span>{nilai ? labelTanggal(nilai) : "Belum dipilih"}</span>
        <button type="button" className={s.hariIniBtn} disabled={(maks && hariIni > maks) || (min && hariIni < min)} onClick={() => onPilih(hariIni)}>
          Hari ini
        </button>
      </div>
    </div>
  );
}

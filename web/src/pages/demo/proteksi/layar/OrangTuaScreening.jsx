import { useRef, useState } from "react";
import { Ikon } from "../komponen";
import { cariAspek } from "../bersama/heart";
import { BilahKembali } from "./OrangTuaBagian";
import { kelas, useFokusBerganti } from "./OrangTuaAlat";
import { ANAK, JAWABAN_SCREENING, LAMA_SCREENING, SCREENING_ORTU } from "./orangTuaData";

const JUMLAH = SCREENING_ORTU.length;
const NAMA = ANAK.nama.split(" ")[0];

/**
 * Screening HEART dari orang tua: pembuka singkat, satu pernyataan per layar (jawaban langsung
 * lanjut), lalu layar terima kasih. Prototipe tidak menilai jawaban; sesudah dikirim, hasil Raka
 * dibaca dari data contoh seperti biasa. `onSelesai` dipanggil saat jawaban dikirim, `onLihatHasil`
 * dan `onKeluar` membawa pulang.
 */
export default function OrangTuaScreening({ onSelesai, onLihatHasil, onKeluar, keAtas }) {
  // -1 = pembuka, 0..JUMLAH-1 = pernyataan, JUMLAH = terkirim.
  const [nomor, setNomor] = useState(-1);
  const [jawaban, setJawaban] = useState({});
  const akarRef = useRef(null);
  useFokusBerganti(akarRef, nomor, "[data-fokus-langkah]");

  function ke(n) {
    setNomor(n);
    keAtas();
  }

  function jawab(i) {
    const butir = SCREENING_ORTU[nomor];
    setJawaban((j) => ({ ...j, [butir.id]: i }));
    if (nomor === JUMLAH - 1) {
      onSelesai();
      ke(JUMLAH);
    } else {
      ke(nomor + 1);
    }
  }

  function kembali() {
    if (nomor > -1 && nomor < JUMLAH) ke(nomor - 1);
    else onKeluar();
  }

  if (nomor === JUMLAH) {
    return (
      <div ref={akarRef}>
        <BilahKembali judul="Screening HEART" onKembali={onKeluar} />
        <div className="hp-pad hp-alur">
          <div className="hp-big">
            <span className="hp-ic hp-g hp-icbesar">
              <Ikon nama="centang" size={36} />
            </span>
            <h3 className="hp-h" tabIndex={-1} data-fokus-langkah>
              Terima kasih, Ibu Dewi
            </h3>
            <p className="hp-cd">{`Hasil HEART ${NAMA} sudah siap.`}</p>
          </div>
          <button type="button" className="hp-btnp" onClick={onLihatHasil}>
            Lihat hasil
          </button>
          <button type="button" className="hp-ghost" onClick={onKeluar}>
            Ke Beranda
          </button>
        </div>
      </div>
    );
  }

  if (nomor === -1) {
    return (
      <div ref={akarRef}>
        <BilahKembali judul="Screening HEART" onKembali={onKeluar} />
        <div className="hp-pad hp-alur">
          <div className="hp-big">
            <span className="hp-ic hp-p hp-icbesar">
              <Ikon nama="hati" size={34} />
            </span>
            <h3 className="hp-h" tabIndex={-1} data-fokus-langkah>
              {`Screening HEART ${NAMA}`}
            </h3>
            <p className="hp-cd">{`${JUMLAH} pernyataan, ${LAMA_SCREENING}. Jawab sesuai keseharian ${NAMA} sebulan terakhir.`}</p>
          </div>
          <button type="button" className="hp-btnp" onClick={() => ke(0)}>
            Mulai
          </button>
        </div>
      </div>
    );
  }

  const butir = SCREENING_ORTU[nomor];
  const aspek = cariAspek(butir.aspek);
  return (
    <div ref={akarRef}>
      <BilahKembali judul="Screening HEART" onKembali={kembali} />
      <div className="hp-pad hp-alur">
        <div className="hp-qhead">
          <span>{`${nomor + 1} dari ${JUMLAH}`}</span>
          <span>{aspek.nama}</span>
        </div>
        <div className="hp-prog" aria-hidden="true">
          <span style={{ width: `${Math.round(((nomor + 1) / JUMLAH) * 100)}%` }} />
        </div>
        <h3 className="hp-qtext hp-pernyataan" tabIndex={-1} data-fokus-langkah key={butir.id}>
          {butir.teks}
        </h3>
        <div className="hp-jawab" role="group" aria-label="Seberapa sering">
          {JAWABAN_SCREENING.map((j, i) => (
            <button
              key={j}
              type="button"
              className={kelas("hp-jawabb", jawaban[butir.id] === i && "hp-on")}
              aria-pressed={jawaban[butir.id] === i}
              onClick={() => jawab(i)}
            >
              {j}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

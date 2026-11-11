import { PEMILIK } from "../bersama/tindakLanjut";
import { BarisTugas, Kemajuan } from "./OrangTuaBagian";
import { gabungNama, hitungSelesai } from "./OrangTuaAlat";
import { EVALUASI, TUGAS_RUMAH, TUGAS_SEKOLAH } from "./orangTuaData";

const PENGERJA_SEKOLAH = gabungNama([...new Set(TUGAS_SEKOLAH.map((c) => PEMILIK[c.oleh].orang))]);

/**
 * Checklist Raka: tugas rumah dicentang Ibu Dewi lewat konteks (centang di sini ikut terlihat di
 * layar wali kelas dan laporan anak), lalu kemajuan sekolah yang hanya dibaca.
 */
export default function OrangTuaChecklist({ centang, onCentang, onBukaAspek }) {
  const nRumah = hitungSelesai(TUGAS_RUMAH, centang);
  const nSekolah = hitungSelesai(TUGAS_SEKOLAH, centang);
  // Tugas sekolah yang belum selesai di atas, supaya langkah berikutnya terlihat lebih dulu.
  const sekolah = [...TUGAS_SEKOLAH].sort((a, b) => Number(Boolean(centang[a.id])) - Number(Boolean(centang[b.id])));

  return (
    <div className="hp-pad">
      <p className="hp-cm hp-pengantar">
        Tindak lanjut dari hasil HEART Raka, dikerjakan bersama sekolah. Dievaluasi bersama Ibu pada {EVALUASI}.
      </p>

      <section className="hp-card" aria-labelledby="ortu-c-rumah">
        <div className="hp-row hp-antara">
          <h3 id="ortu-c-rumah" className="hp-ct">
            Tugas di rumah
          </h3>
          <span className="hp-hitung">
            {nRumah} dari {TUGAS_RUMAH.length} selesai
          </span>
        </div>
        <Kemajuan n={nRumah} m={TUGAS_RUMAH.length} label="Kemajuan tugas di rumah" />
        <ul className="hp-tugaslist">
          {TUGAS_RUMAH.map((c) => (
            <BarisTugas
              key={c.id}
              butir={c}
              selesai={Boolean(centang[c.id])}
              bisaCentang
              onCentang={onCentang}
              onBukaAspek={onBukaAspek}
            />
          ))}
        </ul>
      </section>

      <section className="hp-card" aria-labelledby="ortu-c-sekolah">
        <div>
          <h3 id="ortu-c-sekolah" className="hp-ct">
            Sekolah: {nSekolah} dari {TUGAS_SEKOLAH.length} selesai
          </h3>
          <p className="hp-cm">Dikerjakan {PENGERJA_SEKOLAH}. Ibu cukup memantau.</p>
        </div>
        <Kemajuan n={nSekolah} m={TUGAS_SEKOLAH.length} label="Kemajuan tugas sekolah" />
        <ul className="hp-tugaslist">
          {sekolah.map((c) => (
            <BarisTugas key={c.id} butir={c} selesai={Boolean(centang[c.id])} />
          ))}
        </ul>
      </section>
    </div>
  );
}

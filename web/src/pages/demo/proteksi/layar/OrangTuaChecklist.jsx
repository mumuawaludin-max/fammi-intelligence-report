import { PEMILIK } from "../bersama/tindakLanjut";
import { HEART, MANFAAT } from "../bersama/heart";
import { KartuPantau } from "../bersama/KartuPantau";
import { PANTAU_RAKA } from "../bersama/pantau";
import { BarisTugas, Kemajuan, Lipat } from "./OrangTuaBagian";
import { gabungNama, hitungSelesai } from "./OrangTuaAlat";
import { ASPEK_PER_STATUS, EVALUASI, RITME, TUGAS_SEKOLAH, rutinOrtu } from "./orangTuaData";

const PENGERJA_SEKOLAH = gabungNama([...new Set(TUGAS_SEKOLAH.map((c) => PEMILIK[c.oleh].orang))]);
/** Aspek yang belum Aman, Perlu Perhatian Lebih lebih dulu: masing-masing punya grafik perkembangan. */
const ASPEK_DIJAGA = [...ASPEK_PER_STATUS.waspada, ...ASPEK_PER_STATUS.perhatian];
const ID_DIJAGA = new Set(ASPEK_DIJAGA.map((a) => a.id));
const ASPEK_AMAN = HEART.filter((a) => !ID_DIJAGA.has(a.id));

/**
 * Checklist Raka sebagai rutinitas orang tua (masukan pemilik produk 2026-11-25): dibagi "Setiap
 * hari" dan "Minggu ini", karena tiap tugas rumah paling jarang dikerjakan seminggu sekali. Isinya
 * tugas rumah per aspek HEART (rekomendasi Fammi dan tambahan sekolah) dan kebiasaan menjaga aspek
 * yang sudah Aman. Di bawahnya grafik perkembangan aspek yang belum Aman beserta cek mingguan,
 * lalu tugas sekolah dan manfaat aspek Aman yang dilipat. Centang lewat konteks prototipe.
 */
export default function OrangTuaChecklist({ centang, onCentang, onBukaAspek, pantau, sudahCek, onJawabPantau, rutin, tugasSekolah = TUGAS_SEKOLAH }) {
  const semua = rutin || rutinOrtu();
  const nSekolah = hitungSelesai(tugasSekolah, centang);
  const sekolah = [...tugasSekolah].sort((a, b) => Number(Boolean(centang[a.id])) - Number(Boolean(centang[b.id])));

  return (
    <div className="hp-pad">
      {Object.entries(RITME).map(([ritme, judul]) => {
        const daftar = semua.filter((b) => b.ritme === ritme);
        if (daftar.length === 0) return null;
        const n = hitungSelesai(daftar, centang);
        return (
          <section key={ritme} className="hp-card" aria-labelledby={`ortu-c-${ritme}`}>
            <div className="hp-row hp-antara">
              <h3 id={`ortu-c-${ritme}`} className="hp-ct">
                {judul}
              </h3>
              <span className="hp-hitung">{`${n} dari ${daftar.length}`}</span>
            </div>
            <ul className="hp-tugaslist">
              {daftar.map((c) => (
                <BarisTugas
                  key={c.id}
                  butir={c}
                  selesai={Boolean(centang[c.id])}
                  bisaCentang
                  tanpaWaktu={!c.sumber}
                  onCentang={onCentang}
                  onBukaAspek={onBukaAspek}
                />
              ))}
            </ul>
          </section>
        );
      })}

      <h3 className="hp-sub">Perkembangan Raka</h3>
      {ASPEK_DIJAGA.map((a) =>
        pantau[a.id] ? (
          <KartuPantau
            key={a.id}
            idAspek={a.id}
            tanya={PANTAU_RAKA[a.id].tanya}
            riwayat={pantau[a.id]}
            sudahCek={sudahCek[a.id]}
            onJawab={(j) => onJawabPantau(a.id, j)}
          />
        ) : null,
      )}

      <Lipat judul={`Tugas sekolah: ${nSekolah} dari ${tugasSekolah.length} selesai`} ket={`Oleh ${PENGERJA_SEKOLAH}. Dievaluasi ${EVALUASI}.`}>
        <Kemajuan n={nSekolah} m={tugasSekolah.length} label="Kemajuan tugas sekolah" />
        <ul className="hp-tugaslist">
          {sekolah.map((c) => (
            <BarisTugas key={c.id} butir={c} selesai={Boolean(centang[c.id])} />
          ))}
        </ul>
      </Lipat>

      <Lipat judul="Kenapa yang Aman tetap dijaga" ket={ASPEK_AMAN.map((a) => a.nama).join(", ")}>
        <ul className="hp-pertahankan">
          {ASPEK_AMAN.map((a) => (
            <li key={a.id}>
              <span className="hp-huruf hp-baik" aria-hidden="true">
                {a.kode}
              </span>
              <span className="hp-fleks">
                <b>{a.nama}</b>
                <span>{MANFAAT[a.id]}</span>
              </span>
            </li>
          ))}
        </ul>
      </Lipat>
    </div>
  );
}

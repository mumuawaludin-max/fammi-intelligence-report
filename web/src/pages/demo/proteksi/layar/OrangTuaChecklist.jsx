import { PEMILIK } from "../bersama/tindakLanjut";
import { HEART, MANFAAT } from "../bersama/heart";
import { KartuPantau } from "../bersama/KartuPantau";
import { PANTAU_RAKA } from "../bersama/pantau";
import { BarisTugas, Kemajuan, Lipat } from "./OrangTuaBagian";
import { gabungNama, hitungSelesai } from "./OrangTuaAlat";
import { ASPEK_PER_STATUS, EVALUASI, PERTAHANKAN, TUGAS_RUMAH, TUGAS_SEKOLAH } from "./orangTuaData";

const PENGERJA_SEKOLAH = gabungNama([...new Set(TUGAS_SEKOLAH.map((c) => PEMILIK[c.oleh].orang))]);
/** Aspek yang belum Baik, Waspada lebih dulu: tiap aspek jadi satu kelompok checklist. */
const ASPEK_DIJAGA = [...ASPEK_PER_STATUS.waspada, ...ASPEK_PER_STATUS.perhatian];
const ID_DIJAGA = new Set(ASPEK_DIJAGA.map((a) => a.id));

/**
 * Checklist Raka dikelompokkan per aspek HEART yang belum Baik (masukan pemilik produk 2026-11-25):
 * tiap kelompok berisi grafik perkembangan sejak skrining, cek mingguan, dan tugas rumah untuk
 * aspek itu, jadi terlihat apakah tindak lanjutnya berdampak (delta skor). Tugas rumah lain di
 * bawahnya, lalu tugas sekolah (dilipat, cukup dipantau), lalu aspek yang sudah Baik beserta
 * manfaatnya bila dipertahankan. Centang tugas rumah lewat konteks prototipe.
 */
export default function OrangTuaChecklist({
  centang,
  onCentang,
  onBukaAspek,
  pantau,
  sudahCek,
  onJawabPantau,
  tugasRumah = TUGAS_RUMAH,
  tugasSekolah = TUGAS_SEKOLAH,
}) {
  const nRumah = hitungSelesai(tugasRumah, centang);
  const nSekolah = hitungSelesai(tugasSekolah, centang);
  const sekolah = [...tugasSekolah].sort((a, b) => Number(Boolean(centang[a.id])) - Number(Boolean(centang[b.id])));
  const rumahLain = tugasRumah.filter((c) => !ID_DIJAGA.has(c.aspek));
  const aspekBaik = HEART.filter((a) => !ID_DIJAGA.has(a.id));

  return (
    <div className="hp-pad">
      <div className="hp-row hp-antara hp-pengantar">
        <p className="hp-cm">{`Dievaluasi bersama sekolah ${EVALUASI}.`}</p>
        <span className="hp-hitung">{`${nRumah} dari ${tugasRumah.length} tugas rumah`}</span>
      </div>

      {ASPEK_DIJAGA.map((a) => {
        const tugas = tugasRumah.filter((c) => c.aspek === a.id);
        const sekolahAspek = tugasSekolah.filter((c) => c.aspek === a.id);
        const nSekolahAspek = hitungSelesai(sekolahAspek, centang);
        if (!pantau[a.id]) return null;
        return (
          <KartuPantau
            key={a.id}
            idAspek={a.id}
            tanya={PANTAU_RAKA[a.id].tanya}
            riwayat={pantau[a.id]}
            sudahCek={sudahCek[a.id]}
            onJawab={(j) => onJawabPantau(a.id, j)}
          >
            {tugas.length > 0 && (
              <ul className="hp-tugaslist">
                {tugas.map((c) => (
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
            )}
            {sekolahAspek.length > 0 && (
              <p className="hp-cm">{`Di sekolah: ${nSekolahAspek} dari ${sekolahAspek.length} tugas untuk ${a.nama} selesai.`}</p>
            )}
          </KartuPantau>
        );
      })}

      {rumahLain.length > 0 && (
        <section className="hp-card" aria-labelledby="ortu-c-lain">
          <h3 id="ortu-c-lain" className="hp-ct">
            Tugas rumah lainnya
          </h3>
          <ul className="hp-tugaslist">
            {rumahLain.map((c) => (
              <BarisTugas key={c.id} butir={c} selesai={Boolean(centang[c.id])} bisaCentang onCentang={onCentang} onBukaAspek={onBukaAspek} />
            ))}
          </ul>
        </section>
      )}

      <Lipat
        judul={`Tugas sekolah: ${nSekolah} dari ${tugasSekolah.length} selesai`}
        ket={`Dikerjakan ${PENGERJA_SEKOLAH}. Ibu cukup memantau.`}
      >
        <Kemajuan n={nSekolah} m={tugasSekolah.length} label="Kemajuan tugas sekolah" />
        <ul className="hp-tugaslist">
          {sekolah.map((c) => (
            <BarisTugas key={c.id} butir={c} selesai={Boolean(centang[c.id])} />
          ))}
        </ul>
      </Lipat>

      <section className="hp-card hp-manfaat" aria-labelledby="ortu-c-baik">
        <h3 id="ortu-c-baik" className="hp-ct">
          Sudah Aman, pertahankan
        </h3>
        <p className="hp-cd">Aspek ini terindikasi Aman. Tetap jaga lewat satu kebiasaan kecil.</p>
        <ul className="hp-pertahankan">
          {aspekBaik.map((a) => {
            const jaga = PERTAHANKAN.find((p) => p.aspek === a.id);
            return (
              <li key={a.id}>
                <span className="hp-huruf hp-baik" aria-hidden="true">
                  {a.kode}
                </span>
                <span className="hp-fleks">
                  <b>{a.nama}</b>
                  <span>{MANFAAT[a.id]}</span>
                  {jaga && (
                    <ul className="hp-tugaslist hp-jaga">
                      <BarisTugas butir={jaga} selesai={Boolean(centang[jaga.id])} bisaCentang onCentang={onCentang} />
                    </ul>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

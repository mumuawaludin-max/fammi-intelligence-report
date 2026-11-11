import { useState } from "react";
import { Ikon, KepalaKartu, KepalaLaci, Laci } from "../komponen";
import { inisial } from "../alat";
import { ANAK_2B } from "../bersama/heart";
import { BELUM_BUDDY_2B, BUDDY_2B, DUKUNGAN_RAKA } from "../bersama/dukungan";
import { HARI_INI } from "./profilAnakData";

const NAMA_ANAK = DUKUNGAN_RAKA.anak;
const PANGGILAN = NAMA_ANAK.split(" ")[0];

/** Teman sebaya Raka di peta dukungan (kelompok yang memuat buddy). */
const TEMAN_RAKA = new Set(
  (DUKUNGAN_RAKA.kelompok.find((k) => k.orang.some((o) => o.buddy))?.orang ?? []).map((o) => o.nama),
);

/** Buddy anak lain di kelas 2B: tidak bisa sekaligus menjadi buddy Raka. */
const BUDDY_ANAK_LAIN = new Set(BUDDY_2B.filter((b) => b.anak !== NAMA_ANAK).map((b) => b.buddy));

/** Calon buddy yang sudah diusulkan untuk anak lain, ditandai supaya tidak dipilih dua kali. */
const CALON_ANAK_LAIN = new Map(
  BELUM_BUDDY_2B.flatMap((x) => x.calon.map((c) => [c, x.anak.split(" ")[0]])),
);

/**
 * Calon buddy: teman sekelas berstatus Baik yang belum mendampingi anak lain. Teman yang sudah dekat
 * dengan Raka tampil paling atas.
 */
const CALON_BUDDY = ANAK_2B.filter(
  (a) => a.status === "baik" && a.nama !== NAMA_ANAK && !BUDDY_ANAK_LAIN.has(a.nama),
).sort((a, b) => Number(TEMAN_RAKA.has(b.nama)) - Number(TEMAN_RAKA.has(a.nama)));

/**
 * Kelompok peta dukungan dengan buddy yang sedang berlaku. Kalau buddy diganti di layar ini, buddy
 * lama tetap tercatat sebagai teman dekat.
 */
function susunKelompok(buddy) {
  return DUKUNGAN_RAKA.kelompok.map((k) => {
    const lama = k.orang.find((o) => o.buddy);
    if (!lama || lama.nama === buddy) return k;
    return {
      ...k,
      orang: [
        { nama: buddy, inisial: inisial(buddy), peran: "Buddy", ket: `Ditetapkan ${HARI_INI}.`, buddy: true },
        { ...lama, peran: "Teman dekat", ket: `Buddy sampai ${HARI_INI}.`, buddy: false },
        ...k.orang.filter((o) => !o.buddy && o.nama !== buddy),
      ],
    };
  });
}

/** Baris kedua kartu orang: peran dan keterangan, tanpa mengulang yang sudah tampil sebagai label. */
function keterangan(o) {
  return [o.buddy ? null : o.peran, o.utama ? null : o.ket].filter(Boolean).join(" · ");
}

/**
 * Peta dukungan Raka: siapa saja yang mendampinginya selain orang tua (keluarga, teman sebaya
 * termasuk buddy, orang dewasa di sekolah), tempat aman, dan titik rawan. Buddy dan orang yang
 * paling dipercaya Raka ditonjolkan. Wali kelas bisa mengganti buddy lewat laci kecil.
 */
export default function ProfilAnakDukungan({ buddy, onGanti }) {
  const [laci, setLaci] = useState(false);
  const [pilihan, setPilihan] = useState(buddy);
  const kelompok = susunKelompok(buddy);

  function bukaLaci() {
    setPilihan(buddy);
    setLaci(true);
  }

  function simpan() {
    setLaci(false);
    onGanti(pilihan);
  }

  return (
    <section className="card tcard dk" data-bagian="dukungan" aria-label="Peta dukungan Raka">
      <div className="tophead">
        <KepalaKartu ikon="kelompok" judul="Peta dukungan" />
        <div className="dkkanan">
          <span className="mut dkdisusun">{DUKUNGAN_RAKA.diperbarui}</span>
          <button type="button" className="ghost sm" onClick={bukaLaci}>
            <Ikon nama="tugaskan" size={16} />
            Ganti buddy
          </button>
        </div>
      </div>

      <div className="dkgrid">
        {kelompok.map((k) => (
          <div key={k.id} className={`dkkel ${k.id}`}>
            <h3 className="dkjudul">{k.label}</h3>
            <ul className="dkorang">
              {k.orang.map((o) => (
                <li key={o.nama} className={`dkitem${o.buddy ? " buddy" : ""}${o.utama ? " utama" : ""}`}>
                  <span className="dkav" aria-hidden="true">
                    {o.inisial}
                  </span>
                  <div className="dkteks">
                    <span className="dknama">
                      <b>{o.nama}</b>
                      {o.buddy && <span className="dktag buddy">Buddy</span>}
                      {o.utama && <span className="dktag utama">Paling dipercaya</span>}
                    </span>
                    <span className="dkket">{keterangan(o)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="dktempat">
        <div className="dktempatgrup">
          <span className="dktempatlabel aman">
            <Ikon nama="perisaiCentang" size={15} />
            Tempat aman
          </span>
          <ul className="dkcips">
            {DUKUNGAN_RAKA.tempatAman.map((t) => (
              <li key={t} className="dkcip aman">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="dktempatgrup">
          <span className="dktempatlabel rawan">
            <Ikon nama="peringatan" size={15} />
            Titik rawan
          </span>
          <ul className="dkcips">
            {DUKUNGAN_RAKA.titikRawan.map((t) => (
              <li key={t} className="dkcip rawan">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {laci && (
        <Laci label={`Ganti buddy ${PANGGILAN}`} labelTutup="Tutup ganti buddy" lebar={440} className="lacibuddy" onTutup={() => setLaci(false)}>
          <KepalaLaci
            awal={
              <div className="tile ok">
                <Ikon nama="kelompok" size={22} />
              </div>
            }
            judul={`Ganti buddy ${PANGGILAN}`}
            sub="Pilih teman sekelas berstatus Baik yang belum mendampingi anak lain."
            onTutup={() => setLaci(false)}
          />
          <fieldset className="dkcalon">
            <legend className="sr">Calon buddy</legend>
            {CALON_BUDDY.map((a) => {
              let tanda = null;
              if (a.nama === buddy) tanda = "Buddy sekarang";
              else if (TEMAN_RAKA.has(a.nama)) tanda = `Teman dekat ${PANGGILAN}`;
              else if (CALON_ANAK_LAIN.has(a.nama)) tanda = `Calon buddy ${CALON_ANAK_LAIN.get(a.nama)}`;
              return (
                <label key={a.nama} className={`dkopsi${pilihan === a.nama ? " on" : ""}`}>
                  <input
                    type="radio"
                    name="buddy-raka"
                    value={a.nama}
                    checked={pilihan === a.nama}
                    onChange={() => setPilihan(a.nama)}
                  />
                  <span className="av">{a.inisial}</span>
                  <span className="dkopsinama">{a.nama}</span>
                  {tanda && <span className="dkopsitanda">{tanda}</span>}
                </label>
              );
            })}
          </fieldset>
          <p className="reco info">
            Bicarakan dulu dengan {PANGGILAN} dan calon buddy-nya. Pergantian tercatat di riwayat {PANGGILAN}.
          </p>
          <div className="dacts">
            <button type="button" className="ghost" onClick={() => setLaci(false)}>
              Batal
            </button>
            <button type="button" className="btnp" onClick={simpan}>
              Simpan buddy
            </button>
          </div>
        </Laci>
      )}
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { Ikon, KepalaLaci, Laci } from "../komponen";
import { inisial } from "../alat";
import { ANAK_2B } from "../bersama/heart";
import { BELUM_BUDDY_2B, BUDDY_2B, DUKUNGAN_RAKA } from "../bersama/dukungan";
import { HARI_INI } from "./profilAnakData";

const NAMA_ANAK = DUKUNGAN_RAKA.anak;
const PANGGILAN = NAMA_ANAK.split(" ")[0];

/** Teman sebaya Raka di peta dukungan (kelompok yang memuat teman pendamping). */
const TEMAN_RAKA = new Set(
  (DUKUNGAN_RAKA.kelompok.find((k) => k.orang.some((o) => o.buddy))?.orang ?? []).map((o) => o.nama),
);

/** Teman pendamping anak lain di kelas 2B: tidak bisa sekaligus mendampingi Raka. */
const BUDDY_ANAK_LAIN = new Set(BUDDY_2B.filter((b) => b.anak !== NAMA_ANAK).map((b) => b.buddy));

/** Calon teman pendamping yang sudah diusulkan untuk anak lain, ditandai supaya tidak dipilih dua kali. */
const CALON_ANAK_LAIN = new Map(
  BELUM_BUDDY_2B.flatMap((x) => x.calon.map((c) => [c, x.anak.split(" ")[0]])),
);

/**
 * Calon teman pendamping: teman sekelas berstatus Baik yang belum mendampingi anak lain. Teman yang
 * sudah dekat dengan Raka tampil paling atas.
 */
const CALON_BUDDY = ANAK_2B.filter(
  (a) => a.status === "baik" && a.nama !== NAMA_ANAK && !BUDDY_ANAK_LAIN.has(a.nama),
).sort((a, b) => Number(TEMAN_RAKA.has(b.nama)) - Number(TEMAN_RAKA.has(a.nama)));

/** Orang yang paling dipercaya Raka (dari isian skrining). */
const PALING_DIPERCAYA = DUKUNGAN_RAKA.kelompok.flatMap((k) => k.orang).find((o) => o.utama)?.nama;

/**
 * Kelompok peta dukungan dengan teman pendamping yang sedang berlaku. Kalau diganti di layar ini,
 * pendamping lama tetap tercatat sebagai teman dekat.
 */
function susunKelompok(buddy) {
  return DUKUNGAN_RAKA.kelompok.map((k) => {
    const lama = k.orang.find((o) => o.buddy);
    if (!lama || lama.nama === buddy) return k;
    return {
      ...k,
      orang: [
        { nama: buddy, inisial: inisial(buddy), peran: "Teman pendamping", ket: `Ditetapkan ${HARI_INI}.`, buddy: true },
        { ...lama, peran: "Teman dekat", ket: `Teman pendamping sampai ${HARI_INI}.`, buddy: false },
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
 * Baris "Peta dukungan" di menu bawah Laporan anak: teman pendamping dan orang yang paling dipercaya
 * sebagai cuplikan. Peta lengkap (keluarga, teman sebaya, orang dewasa di sekolah, tempat aman, titik
 * rawan) terbuka di laci. Di laci yang sama wali kelas bisa mengganti teman pendamping.
 */
export default function ProfilAnakDukungan({ buddy, onGanti }) {
  const [laci, setLaci] = useState(false);
  const [tampilan, setTampilan] = useState("peta");
  const [pilihan, setPilihan] = useState(buddy);
  const isiRef = useRef(null);
  const sudahBukaRef = useRef(false);
  const kelompok = susunKelompok(buddy);

  // Pindah tampilan di dalam laci: tombol yang ditekan hilang, jadi fokus pindah ke awal isinya.
  useEffect(() => {
    if (!sudahBukaRef.current) {
      sudahBukaRef.current = true;
      return;
    }
    isiRef.current?.focus({ preventScroll: true });
  }, [tampilan]);

  function buka() {
    setTampilan("peta");
    setLaci(true);
  }

  function mulaiGanti() {
    setPilihan(buddy);
    setTampilan("ganti");
  }

  function simpan() {
    onGanti(pilihan);
    setTampilan("peta");
  }

  return (
    <li data-bagian="dukungan">
      <button type="button" className="pmbaris" aria-haspopup="dialog" onClick={buka}>
        <span className="tile ok" aria-hidden="true">
          <Ikon nama="kelompok" size={19} />
        </span>
        <span className="pmteks">
          <b>Peta dukungan</b>
          <span>
            Teman pendamping {buddy} · Paling dipercaya {PALING_DIPERCAYA}
          </span>
        </span>
        <Ikon nama="kanan" size={18} className="pmpanah" />
      </button>

      {laci && (
        <Laci label={`Peta dukungan ${PANGGILAN}`} labelTutup="Tutup peta dukungan" lebar={560} className="lacidk" onTutup={() => setLaci(false)}>
          <div ref={isiRef} tabIndex={-1} className="dkisi">
            {tampilan === "peta" ? (
              <>
                <KepalaLaci
                  awal={
                    <div className="tile ok">
                      <Ikon nama="kelompok" size={22} />
                    </div>
                  }
                  judul={`Peta dukungan ${PANGGILAN}`}
                  sub={DUKUNGAN_RAKA.diperbarui}
                  onTutup={() => setLaci(false)}
                />

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
                              {o.buddy && <span className="dktag buddy">Teman pendamping</span>}
                              {o.utama && <span className="dktag utama">Paling dipercaya</span>}
                            </span>
                            <span className="dkket">{keterangan(o)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

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

                <div className="dacts">
                  <button type="button" className="ghost" onClick={mulaiGanti}>
                    <Ikon nama="tugaskan" size={16} />
                    Ganti teman pendamping
                  </button>
                </div>
              </>
            ) : (
              <>
                <KepalaLaci
                  awal={
                    <div className="tile ok">
                      <Ikon nama="kelompok" size={22} />
                    </div>
                  }
                  judul="Ganti teman pendamping"
                  sub="Pilih teman sekelas berstatus Aman yang belum mendampingi anak lain."
                  onTutup={() => setLaci(false)}
                />
                <fieldset className="dkcalon">
                  <legend className="sr">Calon teman pendamping</legend>
                  {CALON_BUDDY.map((a) => {
                    let tanda = null;
                    if (a.nama === buddy) tanda = "Pendamping sekarang";
                    else if (TEMAN_RAKA.has(a.nama)) tanda = `Teman dekat ${PANGGILAN}`;
                    else if (CALON_ANAK_LAIN.has(a.nama)) tanda = `Diusulkan untuk ${CALON_ANAK_LAIN.get(a.nama)}`;
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
                <p className="reco info">Bicarakan dulu dengan {PANGGILAN} dan calon pendampingnya.</p>
                <div className="dacts">
                  <button type="button" className="ghost" onClick={() => setTampilan("peta")}>
                    Batal
                  </button>
                  <button type="button" className="btnp" onClick={simpan}>
                    Simpan pendamping
                  </button>
                </div>
              </>
            )}
          </div>
        </Laci>
      )}
    </li>
  );
}

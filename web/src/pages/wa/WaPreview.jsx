// Pratinjau lepas-login modul Wellbeing Assessment (?preview=wa). Bukan bagian alur produk.
// Memakai data CONTOH (data/wa.contoh.json). Saat `npm run dev`, berkas hasil `npm run wa:baca`
// di web/wa-data-lokal/ ikut bisa dipilih; build produksi tidak pernah mengemasnya.
//
// Sakelar "Narasi" meniru keadaan sebelum narasi disetujui admin: semua narasi disembunyikan,
// sehingga setiap kartu narasi harus menampilkan keadaan kosong, bukan kartu kosong.

import { useCallback, useEffect, useMemo, useState } from "react";
import contoh from "./data/wa.contoh.json";
import { PERAN_WA } from "./lib/waAturan";
import WaLaporan from "./WaLaporan";
import WaPegawaiLaporan from "./WaPegawaiLaporan";
import { lupakanSemua } from "./waSimpanan";
import swTokens from "../sw/swTokens.module.css";
import tokens from "./waTokens.module.css";
import styles from "./WaPreview.module.css";

const BERKAS_LOKAL = import.meta.env.DEV ? import.meta.glob("../../../wa-data-lokal/*.json", { import: "default" }) : {};

const LABEL = { hc: "Human Capital", pegawai: "Pegawai" };

// Umpan balik di pratinjau hanya tersimpan di memori halaman, tidak ke mana pun.
function usePratinjauUmpanBalik() {
  const [isian, setIsian] = useState(null);
  const kirim = useCallback(async (jawaban) => {
    const kini = new Date().toISOString();
    setIsian((lama) => ({ jawaban, dikirimPada: lama?.dikirimPada || kini, diperbaruiPada: kini }));
  }, []);
  return { tersedia: true, memuat: false, galat: null, jawaban: isian?.jawaban || null, dikirimPada: isian?.dikirimPada || null, diperbaruiPada: isian?.diperbaruiPada || null, kirim };
}

export default function WaPreview() {
  const [sumber, setSumber] = useState("contoh");
  const [dataset, setDataset] = useState(contoh);
  const [muat, setMuat] = useState({ status: "siap", pesan: "" });
  const [peran, setPeran] = useState("hc");
  const [individuId, setIndividuId] = useState(contoh.individu[0]?.id || "");
  const [narasiTampil, setNarasiTampil] = useState(true);
  const [ulang, setUlang] = useState(0);
  const umpanPegawai = usePratinjauUmpanBalik();

  useEffect(() => {
    if (sumber === "contoh") return undefined;
    let hidup = true;
    BERKAS_LOKAL[sumber]()
      .then((d) => {
        if (!hidup) return;
        setDataset(d);
        setIndividuId(d.individu[0]?.id || "");
        setMuat({ status: "siap", pesan: "" });
      })
      .catch((e) => hidup && setMuat({ status: "galat", pesan: e.message }));
    return () => { hidup = false; };
  }, [sumber]);

  const datasetTampil = useMemo(() => (narasiTampil ? dataset : { ...dataset, narasi: [] }), [dataset, narasiTampil]);
  const akses = useMemo(() => ({ peran, individuId, nama: `${LABEL[peran]} (pratinjau)` }), [peran, individuId]);
  const rekapUmpan = useMemo(() => ({ memuat: false, galat: null, data: dataset.umpanBalikContoh || { n: 0, peserta: dataset.individu.length, ambang: 3, terbuka: false }, muatUlang: () => {} }), [dataset]);

  function gantiSumber(nilai) {
    if (nilai === "contoh") {
      setDataset(contoh);
      setIndividuId(contoh.individu[0]?.id || "");
    } else {
      setMuat({ status: "memuat", pesan: "" });
    }
    setSumber(nilai);
  }

  return (
    <div className={`${swTokens.scope} ${tokens.scope}`}>
      <div className={styles.panel}>
        <strong>Pratinjau Wellbeing Assessment</strong>
        <label>
          Data
          <select value={sumber} onChange={(e) => gantiSumber(e.target.value)}>
            <option value="contoh">Data contoh</option>
            {Object.keys(BERKAS_LOKAL).map((p) => <option key={p} value={p}>Lokal: {p.split("/").pop()}</option>)}
          </select>
        </label>
        <div className={styles.peran} role="radiogroup" aria-label="Peran">
          {PERAN_WA.map((p) => (
            <button key={p} type="button" role="radio" aria-checked={peran === p} className={peran === p ? styles.aktif : ""} onClick={() => setPeran(p)}>
              {LABEL[p]}
            </button>
          ))}
        </div>
        {peran === "pegawai" && (
          <>
            <label>
              Pegawai
              <select value={individuId} onChange={(e) => setIndividuId(e.target.value)}>
                {dataset.individu.map((o) => <option key={o.id} value={o.id}>{o.id} · {o.nama}</option>)}
              </select>
            </label>
            <button type="button" className={styles.tombol} onClick={() => setUlang((v) => v + 1)}>Ulangi sambutan</button>
          </>
        )}
        <button type="button" className={styles.tombol} onClick={() => { lupakanSemua(); setUlang((v) => v + 1); }}>Ulangi panduan</button>
        <label className={styles.sakelar}>
          <input type="checkbox" checked={narasiTampil} onChange={(e) => setNarasiTampil(e.target.checked)} />
          Narasi sudah disetujui
        </label>
        {muat.status !== "siap" && <span>{muat.status === "memuat" ? "Memuat berkas…" : `Gagal: ${muat.pesan}`}</span>}
      </div>

      {muat.status === "siap" && peran === "hc" && (
        <WaLaporan key={`${sumber}-${ulang}-${narasiTampil}`} dataset={datasetTampil} akses={akses} umpanBalik={rekapUmpan} />
      )}
      {muat.status === "siap" && peran === "pegawai" && (
        <div className={styles.ponsel}>
          <WaPegawaiLaporan key={`${sumber}-${individuId}-${ulang}-${narasiTampil}`} dataset={datasetTampil} akses={akses} umpanBalik={umpanPegawai} />
        </div>
      )}
    </div>
  );
}

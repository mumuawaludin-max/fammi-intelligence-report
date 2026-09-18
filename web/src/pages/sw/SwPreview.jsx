// Pratinjau lepas-login modul Screening Awal Wellbeing (?preview=sw). Bukan bagian alur produk.
// Memakai data CONTOH (data/sw.contoh.json) dan penyimpanan memori. Saat `npm run dev`, berkas
// hasil `npm run sw:baca` di web/sw-data-lokal/ ikut bisa dipilih; build produksi tidak pernah
// mengemasnya.

import { useEffect, useMemo, useState } from "react";
import contoh from "./data/sw.contoh.json";
import { buatStoreMemori } from "./data/swStore";
import { PERAN_SW } from "./lib/swAturan";
import SwLaporan from "./SwLaporan";
import SwPegawaiLaporan from "./SwPegawaiLaporan";
import tokens from "./swTokens.module.css";
import styles from "./SwPreview.module.css";

const BERKAS_LOKAL = import.meta.env.DEV ? import.meta.glob("../../../sw-data-lokal/*.json", { import: "default" }) : {};

const LABEL = { yayasan: "Yayasan", kepalaUnit: "Kepala unit", hc: "Human Capital", pegawai: "Pegawai" };

export default function SwPreview() {
  const [sumber, setSumber] = useState("contoh");
  const [dataset, setDataset] = useState(contoh);
  const [muat, setMuat] = useState({ status: "siap", pesan: "" });
  const [peran, setPeran] = useState("hc");
  const [unitId, setUnitId] = useState(contoh.unit[0]?.id || "");
  const [individuId, setIndividuId] = useState(contoh.individu[0]?.id || "");
  const [versiStore, setVersiStore] = useState(0);

  useEffect(() => {
    if (sumber === "contoh") return;
    let hidup = true;
    BERKAS_LOKAL[sumber]()
      .then((d) => {
        if (!hidup) return;
        setDataset(d);
        setUnitId(d.unit[0]?.id || "");
        setIndividuId(d.individu[0]?.id || "");
        setMuat({ status: "siap", pesan: "" });
      })
      .catch((e) => hidup && setMuat({ status: "galat", pesan: e.message }));
    return () => { hidup = false; };
  }, [sumber]);

  const namaPengguna = `${LABEL[peran]} (pratinjau)`;
  // Catatan tindak lanjut di pratinjau hanya hidup di memori; dibuat ulang saat sumber berganti.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const store = useMemo(() => buatStoreMemori(), [versiStore]);
  // Nilai "binaan:<kunci>" meniru akun pimpinan (Direktur/Wakil Direktur) dengan beberapa unit binaan.
  const akses = useMemo(() => {
    const unitIds = unitId.startsWith("binaan:")
      ? dataset.meta?.cakupanPimpinan?.find((c) => c.kunci === unitId.slice(7))?.unitIds || []
      : null;
    return { peran, unitId, unitIds, individuId, nama: namaPengguna };
  }, [dataset, peran, unitId, individuId, namaPengguna]);

  function gantiSumber(nilai) {
    if (nilai === "contoh") {
      setDataset(contoh);
      setUnitId(contoh.unit[0]?.id || "");
      setIndividuId(contoh.individu[0]?.id || "");
    } else {
      setMuat({ status: "memuat", pesan: "" });
    }
    setSumber(nilai);
    setVersiStore((v) => v + 1);
  }

  return (
    <div className={tokens.scope}>
      <div className={styles.panel}>
        <strong>Pratinjau Screening Awal Wellbeing</strong>
        <label>
          Data
          <select value={sumber} onChange={(e) => gantiSumber(e.target.value)}>
            <option value="contoh">Data contoh</option>
            {Object.keys(BERKAS_LOKAL).map((p) => <option key={p} value={p}>Lokal: {p.split("/").pop()}</option>)}
          </select>
        </label>
        <div className={styles.peran} role="radiogroup" aria-label="Peran">
          {PERAN_SW.map((p) => (
            <button key={p} type="button" role="radio" aria-checked={peran === p} className={peran === p ? styles.aktif : ""} onClick={() => setPeran(p)}>
              {LABEL[p]}
            </button>
          ))}
        </div>
        {peran === "kepalaUnit" && (
          <label>
            Unit
            <select value={unitId} onChange={(e) => setUnitId(e.target.value)}>
              {(dataset.meta?.cakupanPimpinan || []).map((c) => (
                <option key={c.kunci} value={`binaan:${c.kunci}`}>Pimpinan: {c.penilai?.nama || c.kunci} ({c.unitIds.length} unit)</option>
              ))}
              {dataset.unit.map((u) => <option key={u.id} value={u.id}>{u.nama} ({u.nPengisi})</option>)}
            </select>
          </label>
        )}
        {peran === "pegawai" && (
          <label>
            Pegawai
            <select value={individuId} onChange={(e) => setIndividuId(e.target.value)}>
              {dataset.individu.slice(0, 400).map((o) => <option key={o.id} value={o.id}>{o.nama}</option>)}
            </select>
          </label>
        )}
        {muat.status !== "siap" && <span>{muat.status === "memuat" ? "Memuat berkas…" : `Gagal: ${muat.pesan}`}</span>}
      </div>
      {muat.status === "siap" && peran === "pegawai" && (
        <div className={styles.ponsel}>
          <SwPegawaiLaporan key={`${sumber}-${individuId}`} dataset={dataset} akses={akses} />
        </div>
      )}
      {muat.status === "siap" && peran !== "pegawai" && (
        <SwLaporan
          key={`${sumber}-${peran}-${unitId}`}
          dataset={dataset}
          akses={akses}
          store={store}
        />
      )}
    </div>
  );
}

import { ALUR } from "../bersama/alur";
import { BatangTumpuk, Donat, Legenda } from "../bersama/Grafik";
import { WARNA_TINGKAT } from "../bersama/grafikAlat";

const URUT_TINGKAT = ["Darurat", "Tinggi", "Sedang", "Rendah"];
const TAHAP_AKTIF = ALUR.kejadian.langkah.filter((l) => l.id !== "lapor");

/**
 * Dua grafik kasus aktif: donat per tingkat dan batang per langkah alur kejadian (panjang sebanding
 * antarlangkah, warna menurut tingkat). `daftar` = kasus (bentuk KASUS_AWAL di kasusData.js); kasus
 * selesai tidak dihitung. `onTahap(id)` opsional membuat baris bisa diklik (layar Kasus menyaring).
 */
export default function GrafikKasus({ daftar, onTahap, terpilih }) {
  const aktif = daftar.filter((c) => c.tahap !== "selesai");
  const dataTingkat = URUT_TINGKAT.map((t) => ({
    id: t,
    label: t,
    nilai: aktif.filter((c) => c.tingkat === t).length,
    warna: WARNA_TINGKAT[t],
  }));
  const baris = TAHAP_AKTIF.map((l) => {
    const bagian = URUT_TINGKAT.map((t) => ({
      id: t,
      label: t,
      nilai: aktif.filter((c) => c.tahap === l.id && c.tingkat === t).length,
      warna: WARNA_TINGKAT[t],
    }));
    return { id: l.id, label: l.label, kanan: `${bagian.reduce((n, x) => n + x.nilai, 0)} kasus`, bagian };
  });
  const maks = Math.max(1, ...baris.map((b) => b.bagian.reduce((n, x) => n + x.nilai, 0)));
  return (
    <div className="gkasusbungkus">
      <div className="gkasus">
        <div className="gkasusdonat">
          <Donat
            data={dataTingkat}
            sub="kasus aktif"
            ukuran={124}
            tebal={15}
            label={`${aktif.length} kasus aktif per tingkat`}
          />
          <Legenda data={dataTingkat} kolom />
        </div>
        <div className="gkasuskolom">
          <BatangTumpuk baris={baris} ringkas maks={maks} onPilih={onTahap} terpilih={terpilih} />
        </div>
      </div>
    </div>
  );
}

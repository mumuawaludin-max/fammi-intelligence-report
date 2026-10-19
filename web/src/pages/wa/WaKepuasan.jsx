// Tab Kepuasan Kerja (desain D3): resume tiga kategori, enam kartu dimensi berbintang, kartu
// plus/minus, sebaran lima tingkat per dimensi, dan TOP 5 pegawai per kategori.

import { useMemo, useState } from "react";
import { DIMENSI_KEPUASAN, KATEGORI_KEPUASAN_3, infoKepuasan5 } from "./lib/waMeta";
import { formatAngka, kunciTerendahTampil, pegawaiKategoriKepuasan, segmenKepuasan3, segmenKepuasan5 } from "./lib/waAturan";
import { IKON_DIMENSI } from "./waIkon";
import { BarisRincian, DialogDaftarPegawai, DuaPlusMinus, KartuKategori, KolomTopPegawai } from "./WaBagian";
import { IlustrasiPapan } from "./WaIlustrasi";
import { AngkaHitung, BarTumpuk, Bertahap, Bintang, Grid, JudulBagian, Kartu, Legenda, Lencana, Petunjuk } from "./WaUi";
import t from "./WaTab.module.css";

const KOSONG = {
  puas: "Belum ada pegawai di kategori ini pada cakupan yang dipilih.",
  netral: "Tidak ada pegawai yang menjawab netral.",
  tidakPuas: "Tidak ada pegawai di kategori ini.",
};

export default function WaKepuasan({ kelompok, individu, narasi, bukaProfil }) {
  const [daftar, setDaftar] = useState(null);
  const segmen = segmenKepuasan3(kelompok.kepuasan.n);
  // Ikon jingga untuk bidang yang angkanya paling rendah di layar (bisa lebih dari satu, atau tidak ada).
  const dimensiRendah = kunciTerendahTampil(Object.fromEntries(Object.entries(kelompok.kepuasan.dimensi).map(([k, v]) => [k, v.rata])), 1);
  const perKategori = useMemo(
    () => Object.fromEntries(KATEGORI_KEPUASAN_3.map((k) => [k.kunci, pegawaiKategoriKepuasan(individu, k.kunci)])),
    [individu],
  );
  const nilai = (o) => ({ pct: (o.kepuasan.rata / 5) * 100, teks: formatAngka(o.kepuasan.rata, 2) });
  const katDialog = KATEGORI_KEPUASAN_3.find((k) => k.kunci === daftar);

  return (
    <Bertahap className={t.halaman}>
      <Kartu className={t.resume} data-tur="resume">
        <div className={t.resumeGambar}><IlustrasiPapan ukuran={190} /></div>
        <div className={t.resumeIsi}>
          <h2 className={t.resumeJudul}>Resume Kepuasan Pegawai</h2>
          <BarTumpuk segmen={segmen} total={kelompok.nResponden} tebal={14} label="Sebaran kepuasan" />
          <Grid kolom={3} className={t.resumeKartu}>
            {KATEGORI_KEPUASAN_3.map((k) => (
              <KartuKategori
                key={k.kunci}
                label={k.label}
                warna={k.warna}
                pct={kelompok.kepuasan.pctKategori[k.kunci]}
                n={kelompok.kepuasan.n[k.kunci]}
                arti={k.arti}
                onClick={() => setDaftar(k.kunci)}
              />
            ))}
          </Grid>
        </div>
      </Kartu>

      <Grid kolom={6} data-tur="dimensi-bintang">
        {DIMENSI_KEPUASAN.map((d) => {
          const Ikon = IKON_DIMENSI[d.kunci];
          const v = kelompok.kepuasan.dimensi[d.kunci];
          const kat = infoKepuasan5(v.kategori);
          const rendah = dimensiRendah.has(d.kunci);
          return (
            <Kartu key={d.kunci} className={t.dimensiBintang} naik>
              <Ikon size={34} weight="fill" className={t.dimensiIkon} style={rendah ? { color: "var(--fm-jingga)" } : undefined} aria-hidden="true" />
              <Petunjuk teks={`${d.arti}${kat ? ` Kategori: ${kat.label}.` : ""}${rendah ? " Dimensi terendah di cakupan ini." : ""}`} blok>
                <span className={t.dimensiNama}>{d.baris[0]}<br />{d.baris[1]}</span>
              </Petunjuk>
              <Bintang nilai={v.rata} ukuran={22} />
              <span className={t.dimensiNilai}><AngkaHitung nilai={v.rata} digit={1} /> / 5,0</span>
            </Kartu>
          );
        })}
      </Grid>

      <DuaPlusMinus tur="catatan-kepuasan" plus={narasi?.kepuasan?.hal_baik} minus={narasi?.kepuasan?.hal_ditingkatkan} />

      <section data-tur="rincian">
        <JudulBagian keterangan={`Tiap baris berisi ${kelompok.nResponden} pegawai yang sama, dilihat dari satu dimensi. Arahkan kursor ke bar untuk jumlahnya.`}>Detail Kepuasan Pegawai</JudulBagian>
        <Bertahap className={t.daftarRincian} jeda={0.07}>
          {DIMENSI_KEPUASAN.map((d) => {
            const Ikon = IKON_DIMENSI[d.kunci];
            const seg = segmenKepuasan5(kelompok.kepuasan.dimensi[d.kunci].n);
            return (
              <BarisRincian key={d.kunci} lencana={<Lencana><Ikon size={20} weight="fill" /></Lencana>} label={d.label}>
                <BarTumpuk segmen={seg} total={kelompok.nResponden} tebal={10} label={d.label} />
                <Legenda segmen={seg} total={kelompok.nResponden} kecil />
              </BarisRincian>
            );
          })}
        </Bertahap>
      </section>

      <section data-tur="top-pegawai">
        <JudulBagian keterangan="Diurutkan dari rata-rata kepuasan tertinggi (Puas) atau terendah (Netral, Tidak Puas).">TOP 5 Kepuasan Pegawai</JudulBagian>
        <Grid kolom={3}>
          {KATEGORI_KEPUASAN_3.map((k) => (
            <KolomTopPegawai
              key={k.kunci}
              label={k.label}
              warna={k.warnaBar || k.warna}
              warnaTeks={k.kunci === "netral" ? "var(--wa-netral-gelap)" : k.warna}
              daftar={perKategori[k.kunci]}
              nilai={nilai}
              onPilih={bukaProfil}
              onLihatSemua={() => setDaftar(k.kunci)}
              kosong={KOSONG[k.kunci]}
            />
          ))}
        </Grid>
      </section>

      <DialogDaftarPegawai
        buka={Boolean(daftar)}
        onTutup={() => setDaftar(null)}
        judul={katDialog ? `Pegawai kategori ${katDialog.label}` : ""}
        keterangan={katDialog ? `${perKategori[daftar]?.length || 0} pegawai. Angka di kanan adalah rata-rata kepuasan, skala 1 sampai 5.` : ""}
        daftar={perKategori[daftar] || []}
        nilai={nilai}
        warna={katDialog?.warna}
        onPilih={bukaProfil}
      />
    </Bertahap>
  );
}

// Tab Kesehatan Mental (desain D2): resume tiga kategori, kartu plus/minus, sebaran per aspek,
// dan TOP 5 pegawai per kategori. Kategori Baik diurutkan dari skor tertinggi; dua kategori lain
// dari skor terendah, supaya yang paling perlu didekati muncul lebih dulu.

import { useMemo, useState } from "react";
import { ASPEK, JUDUL_TAB_WELLBEING, KATEGORI_PROTEK } from "./lib/waMeta";
import { formatPersen, pegawaiKategoriProtek, segmenProtek } from "./lib/waAturan";
import { BarisRincian, DialogDaftarPegawai, DuaPlusMinus, KartuKategori, KolomTopPegawai } from "./WaBagian";
import { IlustrasiHati } from "./WaIlustrasi";
import { BarTumpuk, Bertahap, Grid, JudulBagian, Kartu, Legenda, Lencana } from "./WaUi";
import t from "./WaTab.module.css";

const KOSONG = {
  baik: "Belum ada pegawai di kategori ini pada cakupan yang dipilih.",
  perluPerhatian: "Tidak ada pegawai di kategori ini.",
  pendampingan: "Tidak ada pegawai di kategori ini.",
};

export default function WaWellbeing({ kelompok, individu, narasi, bukaProfil }) {
  const [daftar, setDaftar] = useState(null);
  const segmen = segmenProtek(kelompok.protek.n);
  const perKategori = useMemo(
    () => Object.fromEntries(KATEGORI_PROTEK.map((k) => [k.kunci, pegawaiKategoriProtek(individu, k.kunci)])),
    [individu],
  );
  const nilai = (o) => ({ pct: o.protek.pct, teks: formatPersen(o.protek.pct) });
  const katDialog = KATEGORI_PROTEK.find((k) => k.kunci === daftar);

  return (
    <Bertahap className={t.halaman}>
      <Kartu className={t.resume} data-tur="resume">
        <div className={t.resumeGambar}><IlustrasiHati ukuran={190} /></div>
        <div className={t.resumeIsi}>
          <h2 className={t.resumeJudul}>Resume {JUDUL_TAB_WELLBEING} Pegawai</h2>
          <BarTumpuk segmen={segmen} total={kelompok.nResponden} tebal={14} label="Sebaran kategori" />
          <Grid kolom={3} className={t.resumeKartu}>
            {KATEGORI_PROTEK.map((k) => (
              <KartuKategori
                key={k.kunci}
                label={k.label}
                warna={k.warna}
                warnaTeks={k.warnaTeks}
                pct={kelompok.protek.pctKategori[k.kunci]}
                n={kelompok.protek.n[k.kunci]}
                arti={k.arti}
                onClick={() => setDaftar(k.kunci)}
              />
            ))}
          </Grid>
        </div>
      </Kartu>

      <DuaPlusMinus tur="resume-catatan" plus={narasi?.wellbeing?.resume_kuat} minus={narasi?.wellbeing?.resume_lemah} />

      <section data-tur="rincian">
        <JudulBagian keterangan={`Tiap baris berisi ${kelompok.nResponden} pegawai yang sama, dilihat dari satu aspek. Arahkan kursor ke bar untuk jumlahnya.`}>Detail {JUDUL_TAB_WELLBEING} Pegawai</JudulBagian>
        <Bertahap className={t.daftarRincian} jeda={0.07}>
          {ASPEK.map((a) => {
            const seg = segmenProtek(kelompok.protek.aspek[a.kunci].n);
            return (
              <BarisRincian key={a.kunci} lencana={<Lencana>{a.huruf}</Lencana>} label={a.label}>
                <BarTumpuk segmen={seg} total={kelompok.nResponden} tebal={10} label={a.label} />
                <Legenda segmen={seg} total={kelompok.nResponden} kecil />
              </BarisRincian>
            );
          })}
        </Bertahap>
      </section>

      <section data-tur="top-pegawai">
        <JudulBagian keterangan="Klik nama untuk melihat profil singkat. Daftar lengkap ada di tautan bawah tiap kolom.">TOP 5 Pegawai Sesuai Kondisi</JudulBagian>
        <Grid kolom={3}>
          {KATEGORI_PROTEK.map((k) => (
            <KolomTopPegawai
              key={k.kunci}
              label={k.label}
              warna={k.warna}
              warnaTeks={k.warnaTeks}
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
        keterangan={katDialog ? `${perKategori[daftar]?.length || 0} pegawai, ${daftar === "baik" ? "urut dari skor tertinggi" : "urut dari skor terendah"}. Klik nama untuk profil singkat.` : ""}
        daftar={perKategori[daftar] || []}
        nilai={nilai}
        warna={katDialog?.warna}
        onPilih={bukaProfil}
      />
    </Bertahap>
  );
}

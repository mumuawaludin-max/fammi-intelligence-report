// Tab Ringkasan (desain D1): dua kartu skor hero, enam huruf PROTEK, kartu plus/minus, enam donat
// kepuasan, dan TOP 3 pernyataan terkuat dan yang perlu penguatan. Kartu huruf dan donat bisa
// diklik untuk pindah ke tab rinciannya.

import { useMemo, useState } from "react";
import { ASPEK, DIMENSI_KEPUASAN, JUDUL_TAB_WELLBEING } from "./lib/waMeta";
import { formatAngka, formatPersen, itemKategori, lengkapiItem, urutItem } from "./lib/waAturan";
import { ambangDariTeks } from "./lib/waPembaca";

// Batas kategori dibaca dari sheet PARAMETER berkas olahan (bisa berbeda antar-dataset), bukan
// ditulis mati. Kosong jika berkas tidak memuatnya; keterangan batas lalu tidak ditampilkan.
function batasBaik(parameter) {
  const a = ambangDariTeks(parameter?.kategori_total).find((x) => x.kunci === "baik");
  return a ? ` (skor ${a.min} ke atas dari ${a.max})` : "";
}
function batasPuas(parameter) {
  const m = String(parameter?.kategori_kepuasan_3 || "").match(/(\d+[.,]\d+)\s*Puas/);
  return m ? ` (rata-rata ${formatAngka(Number(m[1].replace(",", ".")), 2)} ke atas, termasuk Sangat Puas)` : "";
}
import {
  DialogSemuaItem, DuaPlusMinus, KartuDimensi, KartuHuruf, KartuSkorKepuasan, KartuSkorWellbeing, KartuTopItem,
} from "./WaBagian";
import { Bertahap, Grid, JudulBagian } from "./WaUi";
import t from "./WaTab.module.css";

export default function WaRingkasan({ dataset, kelompok, narasi, keTab }) {
  const [semua, setSemua] = useState(null);
  const items = useMemo(() => lengkapiItem(kelompok.protek.item, dataset.item), [kelompok, dataset]);
  const kuat = useMemo(() => itemKategori(items, "kuat"), [items]);
  const perlu = useMemo(() => itemKategori(items, "perlu"), [items]);
  const lemah = perlu.length ? perlu : itemKategori(items, "cukup");
  const tinggi = kuat.length ? kuat : itemKategori(items, "cukup");
  const { nItem } = kelompok.protek;
  // Rata-rata skor dan sebaran kategori adalah dua ukuran berbeda (77% rata-rata bisa berarti 95%
  // pegawai berkategori Baik). Keduanya disebut di kartu supaya tidak terbaca bertentangan dengan narasi.
  const n = kelompok.nResponden;
  const catatanWellbeing = (
    <>Rata-rata dari {n} pegawai. <b>{kelompok.protek.n?.baik ?? 0} pegawai ({formatPersen(kelompok.protek.pctKategori?.baik)})</b> berkategori Baik{batasBaik(dataset.parameter)}.</>
  );
  const catatanKepuasan = (
    <>Rata-rata dari {n} pegawai. <b>{kelompok.kepuasan.n?.puas ?? 0} pegawai ({formatPersen(kelompok.kepuasan.pctKategori?.puas)})</b> puas{batasPuas(dataset.parameter)}.</>
  );

  return (
    <Bertahap className={t.halaman}>
      <div className={t.duaHero}>
        <KartuSkorWellbeing
          judul={`Rata-rata Skor ${JUDUL_TAB_WELLBEING} Pegawai`}
          pct={kelompok.protek.pct}
          kategori={kelompok.protek.kategoriRata}
          narasi={narasi?.ringkasan?.wellbeing}
          catatan={catatanWellbeing}
        />
        <KartuSkorKepuasan
          judul="Skor Rata-rata Kepuasan Kerja"
          rata={kelompok.kepuasan.rata}
          kategori5={kelompok.kepuasan.kategori5}
          bintang={kelompok.kepuasan.bintang}
          narasi={narasi?.ringkasan?.kepuasan}
          catatan={catatanKepuasan}
        />
      </div>

      <section>
        <JudulBagian keterangan="Persen adalah rata-rata skor tiap aspek. Bar jingga menandai aspek dengan rata-rata terendah. Klik huruf untuk melihat berapa pegawai di tiap kategori.">{JUDUL_TAB_WELLBEING} Pegawai</JudulBagian>
        <Grid kolom={6} data-tur="aspek">
          {ASPEK.map((a, i) => (
            <KartuHuruf
              key={a.kunci}
              kunci={a.kunci}
              pct={kelompok.protek.aspek[a.kunci].pct}
              sorot={a.kunci === kelompok.protek.aspekTerendah}
              tunda={0.15 + i * 0.06}
              onClick={() => keTab("wellbeing")}
            />
          ))}
        </Grid>
        <div className={t.jarak}>
          <DuaPlusMinus tur="catatan-wellbeing" plus={narasi?.wellbeing?.hal_baik} minus={narasi?.wellbeing?.hal_ditingkatkan} />
        </div>
      </section>

      <section>
        <JudulBagian keterangan="Rata-rata kepuasan per bidang, skala 1 sampai 5. Lingkaran jingga menandai bidang dengan rata-rata terendah. Klik untuk melihat sebaran pegawainya.">Kepuasan Kerja</JudulBagian>
        <Grid kolom={6} data-tur="dimensi">
          {DIMENSI_KEPUASAN.map((d, i) => (
            <KartuDimensi
              key={d.kunci}
              kunci={d.kunci}
              rata={kelompok.kepuasan.dimensi[d.kunci].rata}
              sorot={d.kunci === kelompok.kepuasan.dimensiTerendah}
              tunda={0.15 + i * 0.06}
              onClick={() => keTab("kepuasan")}
            />
          ))}
        </Grid>
      </section>

      <div className={t.duaKolom} data-tur="top-item">
        <KartuTopItem
          jenis="kuat"
          judul={`TOP 3 Aspek ${JUDUL_TAB_WELLBEING} yang Sudah Kuat`}
          items={urutItem(items, "turun", 3)}
          total={kuat.length ? `Total ${nItem.kuat ?? kuat.length} pernyataan sudah kuat` : "Belum ada yang mencapai ambang kuat; ini tiga tertinggi"}
          onLihatSemua={() => setSemua("kuat")}
        />
        <KartuTopItem
          jenis="perlu"
          judul={`TOP 3 Aspek ${JUDUL_TAB_WELLBEING} yang Perlu Penguatan`}
          items={urutItem(items, "naik", 3)}
          total={perlu.length ? `Total ${nItem.perlu ?? perlu.length} pernyataan perlu penguatan` : "Belum ada yang di bawah ambang; ini tiga terendah"}
          onLihatSemua={() => setSemua("perlu")}
        />
      </div>

      <DialogSemuaItem
        buka={semua === "kuat"}
        onTutup={() => setSemua(null)}
        judul={kuat.length ? "Pernyataan yang sudah kuat" : "Pernyataan yang sudah cukup"}
        keterangan={kuat.length ? "Rata-rata kelompok 5 ke atas pada skala 1 sampai 6, dikelompokkan per aspek." : "Belum ada pernyataan dengan rata-rata 5 ke atas; ini yang berada di rentang 4 sampai 5."}
        items={tinggi}
        warna="var(--fm-ungu-sedang)"
      />
      <DialogSemuaItem
        buka={semua === "perlu"}
        onTutup={() => setSemua(null)}
        judul={perlu.length ? "Pernyataan yang perlu penguatan" : "Pernyataan yang masih cukup"}
        keterangan={perlu.length ? "Rata-rata kelompok di bawah 4 pada skala 1 sampai 6." : "Belum ada pernyataan di bawah 4; ini yang berada di rentang 4 sampai 5."}
        items={lemah}
        warna="var(--fm-jingga)"
      />
    </Bertahap>
  );
}

import { useMemo, useState } from "react";
import { LwSectionSelector } from "./LwSectionSelector";
import { LwDimensiRingkasan } from "./LwDimensiRingkasan";
import { LwKandidatTable } from "./LwKandidatTable";
import { LwTopSkill } from "./LwTopSkill";
import { LwProtekPerbandingan } from "./LwProtekPerbandingan";
import { LwTemuanSpesifik } from "./LwTemuanSpesifik";
import { LwPelatihanList } from "./LwPelatihanList";
import { LwCeritaInspiratif } from "./LwCeritaInspiratif";
import { LEAD_ASPEK_INFO, PROTEK_DIMENSI_INFO } from "./lwMeta";
import styles from "./LwLaporanPage.module.css";

const SECTIONS = [
  { key: "kesiapan", number: "01", icon: "kesiapan", label: "Kesiapan Memimpin" },
  { key: "kesehatan", number: "02", icon: "kesehatan", label: "Kesehatan Mental & Wellbeing" },
  { key: "pengembangan", number: "03", icon: "pengembangan", label: "Tindak Lanjut & Pengembangan" },
];

function tertinggiDari(items) {
  return (items || []).reduce((acc, d) => (acc == null || (d.value ?? 0) > (acc.value ?? 0) ? d : acc), null);
}

/**
 * LwLaporanPage -- dashboard "Laporan Lembaga" Leadership & Wellbeing Assessment, mengikuti
 * struktur wireframe SC/PA: tiga kartu gelap (01/02/03) sebagai filter, tiap bagian berstruktur
 * A (ringkasan+skor) / B (perbandingan) / C (tindak lanjut atau temuan). Section Tindak Lanjut
 * & Pengembangan hanya punya A/B (pelatihan + cerita) karena tidak ada konsep "perbandingan"
 * untuk bagian ini.
 */
export default function LwLaporanPage({ laporan, onSelectKandidat }) {
  const { meta, kesiapan, kesehatan, pengembangan } = laporan;
  const [sectionAktif, setSectionAktif] = useState("kesiapan");

  // ── Kesiapan Memimpin (4 aspek LEAD) ──────────────────────────────────────────────────
  const kesiapanItems = useMemo(
    () => kesiapan.aspek.map((a) => ({ key: a.kode, label: a.label, value: a.nilai })),
    [kesiapan.aspek]
  );
  const kesiapanDominan = useMemo(() => tertinggiDari(kesiapanItems), [kesiapanItems]);
  const [kesiapanKey, setKesiapanKey] = useState(() => kesiapanDominan?.key || null);
  const kesiapanSelectedKey = kesiapanKey || kesiapanDominan?.key;
  const kesiapanMeaningFacets = useMemo(() => {
    const info = LEAD_ASPEK_INFO[kesiapanSelectedKey];
    if (!info) return [];
    return [{ detail: info.deskripsi }, ...info.indikator.map((label) => ({ detail: label }))];
  }, [kesiapanSelectedKey]);

  // ── Kesehatan Mental & Wellbeing (6 dimensi PROTEK) ───────────────────────────────────
  const kesehatanItems = useMemo(
    () => kesehatan.dimensi.map((d) => ({ key: d.kode, label: d.label, value: d.nilai })),
    [kesehatan.dimensi]
  );
  const kesehatanDominan = useMemo(() => tertinggiDari(kesehatanItems), [kesehatanItems]);
  const [kesehatanKey, setKesehatanKey] = useState(() => kesehatanDominan?.key || null);
  const kesehatanSelectedKey = kesehatanKey || kesehatanDominan?.key;
  const kesehatanMeaningFacets = useMemo(() => {
    const info = PROTEK_DIMENSI_INFO[kesehatanSelectedKey];
    if (!info) return [];
    const perbandingan = kesehatan.perbandingan.find((p) => p.key === kesehatanSelectedKey);
    const facets = [{ detail: info.deskripsi }];
    if (perbandingan?.perluPerhatianJumlah > 0) {
      facets.push({ detail: `${perbandingan.perluPerhatianJumlah} dari ${meta.jumlahKandidat} kandidat berkategori Perlu Perhatian pada dimensi ini.` });
    }
    return facets;
  }, [kesehatanSelectedKey, kesehatan.perbandingan, meta.jumlahKandidat]);

  return (
    <div className={styles.page}>
      <LwSectionSelector sections={SECTIONS} active={sectionAktif} onSelect={setSectionAktif} namaLembaga={meta.organisasiNama} />

      {sectionAktif === "kesiapan" && (
        <>
          <LwDimensiRingkasan
            sectionIndex="01-A"
            sectionTitle="Kesiapan Memimpin (LEAD)"
            subtitle="Rata-rata skor empat aspek LEAD seluruh kandidat di lembaga ini"
            dominantPrefix="Aspek Terkuat:"
            dominant={kesiapanDominan}
            items={kesiapanItems}
            selectedKey={kesiapanKey}
            onSelect={setKesiapanKey}
            namaLembaga={meta.organisasiNama}
            meaningFacets={kesiapanMeaningFacets}
            distribusi={kesiapan.distribusi}
          />
          <LwKandidatTable
            sectionIndex="01-B"
            title="Perbandingan Antar Kandidat"
            subtitle="Kesiapan memimpin dan kondisi psikologis tiap kandidat di seluruh unit"
            items={kesiapan.kandidat}
            onSelect={onSelectKandidat}
          />
          <LwTopSkill
            sectionIndex="01-C"
            title="Kekuatan dan Prioritas Pengembangan"
            subtitle="Indikator LEAD dengan skor tertinggi dan terendah di lembaga ini"
            topSkill={kesiapan.topSkill}
            skillGap={kesiapan.skillGap}
          />
        </>
      )}

      {sectionAktif === "kesehatan" && (
        <>
          <LwDimensiRingkasan
            sectionIndex="02-A"
            sectionTitle="Kesehatan Mental & Wellbeing (PROTEK)"
            subtitle="Rata-rata skor enam dimensi PROTEK seluruh kandidat di lembaga ini"
            dominantPrefix="Dimensi Terkuat:"
            dominant={kesehatanDominan}
            items={kesehatanItems}
            selectedKey={kesehatanKey}
            onSelect={setKesehatanKey}
            namaLembaga={meta.organisasiNama}
            meaningFacets={kesehatanMeaningFacets}
            distribusi={kesehatan.distribusi}
          />
          <LwProtekPerbandingan
            sectionIndex="02-B"
            title="Sebaran Kategori per Dimensi"
            subtitle="Area utama yang perlu perhatian lebih, dilihat dari sebaran kategori tiap dimensi"
            items={kesehatan.perbandingan}
          />
          <LwTemuanSpesifik
            sectionIndex="02-C"
            title="Temuan Spesifik yang Perlu Diwaspadai"
            subtitle="Pernyataan spesifik yang mengindikasikan kerentanan, per dimensi"
            items={kesehatan.temuanSpesifik}
          />
        </>
      )}

      {sectionAktif === "pengembangan" && (
        <>
          <LwPelatihanList
            sectionIndex="03-A"
            title="Rekomendasi Aksi Tindak Lanjut Prioritas"
            subtitle="Program pengembangan yang menjawab celah kompetensi lembaga ini"
            items={pengembangan.pelatihan}
          />
          <LwCeritaInspiratif
            sectionIndex="03-B"
            title="Cerita Pengalaman Terbaik Leadership dari Para Guru"
            subtitle="Praktik baik kepemimpinan yang sudah terjadi di lembaga ini"
            items={pengembangan.cerita}
          />
        </>
      )}
    </div>
  );
}

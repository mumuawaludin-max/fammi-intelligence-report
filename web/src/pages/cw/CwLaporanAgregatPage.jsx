import { useMemo, useState } from "react";
import { CwSectionSelector } from "./CwSectionSelector";
import { CwDimensiRingkasan } from "./CwDimensiRingkasan";
import { CwDimensiTindakLanjut } from "./CwDimensiTindakLanjut";
import { CwBudayaPerbandinganDumbbell } from "./CwBudayaPerbandinganDumbbell";
import { CwBudayaDetailAspek } from "./CwBudayaDetailAspek";
import { CwBudayaCeritaKaryawan } from "./CwBudayaCeritaKaryawan";
import { CwKesejahteraanDriver } from "./CwKesejahteraanDriver";
import { CwKesejahteraanSuaraKaryawan } from "./CwKesejahteraanSuaraKaryawan";
import { CwOrganisasiDetailAspek } from "./CwOrganisasiDetailAspek";
import { TIPE_BUDAYA_INFO, KESEJAHTERAAN_INFO, DIMENSI_PROFIL_INFO } from "./cwMeta";
import styles from "./CwLaporanAgregatPage.module.css";

const BUDAYA_TINDAK_LANJUT_ID = "cw-budaya-tindak-lanjut";

/** Item dengan value tertinggi dari daftar {key,value}. */
function tertinggiDari(items) {
  return (items || []).reduce((acc, d) => (acc == null || (d.value ?? 0) > (acc.value ?? 0) ? d : acc), null);
}

const SECTIONS = [
  { key: "budaya", number: "01", icon: "budaya", label: "Laporan Budaya Kerja" },
  { key: "kesejahteraan", number: "02", icon: "kesejahteraan", label: "Laporan Kesejahteraan Karyawan" },
  { key: "organisasi", number: "03", icon: "organisasi", label: "Laporan Profil Organisasi" },
];

/** Ambil facet singkat tentang SATU tipe/kode yang sedang dipilih (bukan satu per tipe),
 * dipetakan ke bentuk {icon,title,detail} yang diharapkan CwDimensiRingkasan. */
function facetsUntuk(info, icon) {
  return (info?.facets || []).map((detail) => ({ icon, title: "", detail }));
}

/**
 * CwLaporanAgregatPage -- dashboard "Laporan Organisasi" Corporate Culture & Wellbeing, disamakan
 * strukturnya dengan modul School Culture (pages/sc/ScLaporanAgregatPage.jsx) atas instruksi
 * pemilik produk: SC adalah versi paling mutakhir, CW mengikuti. Tiga kartu gelap (01/02/03) di
 * atas jadi filter tampilan di bawahnya, tiap bagian punya struktur A (ringkasan+skor) / B
 * (perbandingan atau pendalaman) / C (tindak lanjut).
 *
 * Susunan dashboard LAMA (hero gelap, Angka Kunci, Perbandingan Antarunit, Prioritas Perbaikan
 * lintas-fokus, radar + bar chart) SENGAJA DIHAPUS dari halaman ini, sejalan dengan yang sudah
 * lebih dulu dilakukan di SC. Datanya sendiri masih ada di cw.mock.ts dan tidak dibuang, jadi
 * bisa dipanggil balik kalau memang diminta lagi.
 *
 * Laporan individu karyawan (CwLaporanIndividuPage/CwKaryawanPage/CwRespondenListPage) TIDAK
 * termasuk penyamaan ini, sama seperti di SC.
 *
 * Angka masih data contoh (cw.mock.ts). SampleTag di CwPage.jsx wajib tetap tampil selama itu
 * yang dipakai.
 */
export default function CwLaporanAgregatPage({ laporan }) {
  const { meta, bagian_budaya, bagian_kesejahteraan, bagian_profil_organisasi, analisis, cerita_karyawan, tema_esai } = laporan;

  const [sectionAktif, setSectionAktif] = useState("budaya");

  // ── Budaya Kerja (4 tipe OCAI) ────────────────────────────────────────────────────────
  const budayaItems = useMemo(
    () => bagian_budaya.chart_data.map((d) => ({ key: d.tipe, label: d.tipe, icon: d.tipe, value: d.saat_ini })),
    [bagian_budaya.chart_data]
  );
  const budayaDominan = useMemo(() => tertinggiDari(budayaItems), [budayaItems]);
  const [budayaKey, setBudayaKey] = useState(() => budayaDominan?.key || null);
  const budayaTerpilih = useMemo(
    () => bagian_budaya.chart_data.find((d) => d.tipe === budayaKey) || bagian_budaya.chart_data[0] || null,
    [bagian_budaya.chart_data, budayaKey]
  );
  function prioritaskanBudaya(tipe) {
    setBudayaKey(tipe);
    setSectionAktif("budaya");
    document.getElementById(BUDAYA_TINDAK_LANJUT_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const budayaSelectedKey = budayaKey || budayaDominan?.key;
  const budayaMeaningFacets = useMemo(
    () => facetsUntuk(TIPE_BUDAYA_INFO[budayaSelectedKey], budayaSelectedKey),
    [budayaSelectedKey]
  );
  const budayaTindakLanjut = useMemo(() => bagian_budaya.chart_data.map((d) => ({
    key: d.tipe, label: d.tipe,
    focus: d.focus || d.interpretation || TIPE_BUDAYA_INFO[d.tipe]?.deskripsi,
    steps: d.phases, indicators: d.indicators, warnings: d.warnings,
  })), [bagian_budaya.chart_data]);

  // ── Kesejahteraan Karyawan (5 subdimensi) ─────────────────────────────────────────────
  // Label tampilan ikut KESEJAHTERAAN_INFO (cwMeta.js) kalau kodenya dikenal, jatuh balik ke
  // label mentah dari data kalau tidak. Ini relabeling tampilan, bukan menghitung ulang skor.
  const kesejahteraanItems = useMemo(
    () => bagian_kesejahteraan.chart_data.map((k) => ({
      key: k.kode, label: KESEJAHTERAAN_INFO[k.kode]?.label || k.label, icon: k.kode, value: k.nilai,
      kategori: k.kategori, items: k.items,
    })),
    [bagian_kesejahteraan.chart_data]
  );
  const kesejahteraanDominan = useMemo(() => tertinggiDari(kesejahteraanItems), [kesejahteraanItems]);
  const [kesejahteraanKey, setKesejahteraanKey] = useState(() => kesejahteraanDominan?.key || null);
  const kesejahteraanSelectedKey = kesejahteraanKey || kesejahteraanDominan?.key;
  const kesejahteraanTindakLanjut = useMemo(() => bagian_kesejahteraan.chart_data.map((k) => ({
    key: k.kode, label: KESEJAHTERAAN_INFO[k.kode]?.label || k.label,
    focus: k.focus || KESEJAHTERAAN_INFO[k.kode]?.deskripsi,
    steps: k.phases, indicators: k.indicators, warnings: k.warnings,
  })), [bagian_kesejahteraan.chart_data]);
  const kesejahteraanSelected = kesejahteraanItems.find((it) => it.key === kesejahteraanSelectedKey);
  const kesejahteraanAksiTerpilih = kesejahteraanTindakLanjut.find((t) => t.key === kesejahteraanSelectedKey)?.steps || [];
  const kesejahteraanMeaningFacets = useMemo(
    () => facetsUntuk(KESEJAHTERAAN_INFO[kesejahteraanSelectedKey], kesejahteraanSelectedKey),
    [kesejahteraanSelectedKey]
  );

  // ── Profil Organisasi (6 dimensi) ─────────────────────────────────────────────────────
  const organisasiItems = useMemo(
    () => bagian_profil_organisasi.chart_data.map((d) => ({
      key: d.kode, label: DIMENSI_PROFIL_INFO[d.kode]?.label || d.label, icon: d.kode, value: d.nilai,
    })),
    [bagian_profil_organisasi.chart_data]
  );
  const organisasiDominan = useMemo(() => tertinggiDari(organisasiItems), [organisasiItems]);
  const [organisasiKey, setOrganisasiKey] = useState(() => organisasiDominan?.key || null);
  const organisasiSelectedKey = organisasiKey || organisasiDominan?.key;
  const organisasiMeaningFacets = useMemo(
    () => facetsUntuk(DIMENSI_PROFIL_INFO[organisasiSelectedKey], organisasiSelectedKey),
    [organisasiSelectedKey]
  );
  // steps/indicators/warnings biasanya kosong: pipeline tindak lanjut CW baru mengenal fokus
  // budaya dan kesejahteraan, belum organisasi. Bagian C-nya tampil sebagai catatan data gap,
  // bukan teks karangan. Pola sama dengan SC.
  const organisasiTindakLanjut = useMemo(() => bagian_profil_organisasi.chart_data.map((d) => ({
    key: d.kode, label: DIMENSI_PROFIL_INFO[d.kode]?.label || d.label,
    focus: DIMENSI_PROFIL_INFO[d.kode]?.deskripsi,
    steps: d.phases, indicators: d.indicators, warnings: d.warnings,
  })), [bagian_profil_organisasi.chart_data]);

  return (
    <div className={styles.page}>
      <CwSectionSelector sections={SECTIONS} active={sectionAktif} onSelect={setSectionAktif} namaOrganisasi={meta.organisasi_nama} />

      {sectionAktif === "budaya" && (
        <>
          <CwDimensiRingkasan
            sectionIndex="01-A"
            sectionTitle="Laporan Budaya Kerja"
            subtitle="Kesimpulan Budaya Kerja yang Paling Dominan di Perusahaan Anda"
            dominantPrefix="Budaya:"
            dominant={budayaDominan}
            items={budayaItems}
            selectedKey={budayaKey}
            onSelect={setBudayaKey}
            namaOrganisasi={meta.organisasi_nama}
            meaningFacets={budayaMeaningFacets}
          />
          <CwBudayaPerbandinganDumbbell
            sectionIndex="01-B"
            chartData={bagian_budaya.chart_data}
            tabelGap={bagian_budaya.tabel_gap}
            selected={budayaTerpilih}
            onSelect={setBudayaKey}
            onPrioritize={prioritaskanBudaya}
          />
          <CwDimensiTindakLanjut
            sectionIndex="01-C"
            title="Tindak Lanjut yang Perlu Dilakukan"
            subtitle="Melihat hasil setiap tipe budaya, berikut ini hal yang bisa dilakukan"
            items={budayaTindakLanjut}
            id={BUDAYA_TINDAK_LANJUT_ID}
          />
          <CwBudayaDetailAspek sectionIndex="01-D" heatmapCells={analisis?.heatmap || []} />
          <CwBudayaCeritaKaryawan sectionIndex="01-E" ceritaKaryawan={cerita_karyawan} />
        </>
      )}

      {sectionAktif === "kesejahteraan" && (
        <>
          <CwDimensiRingkasan
            sectionIndex="02-A"
            sectionTitle="Laporan Kesejahteraan Karyawan"
            subtitle="Kondisi Kesejahteraan di Perusahaan Anda bisa dilihat dari 5 Aspek"
            dominantPrefix="Nilai Tertinggi:"
            dominant={kesejahteraanDominan}
            items={kesejahteraanItems}
            selectedKey={kesejahteraanKey}
            onSelect={setKesejahteraanKey}
            namaOrganisasi={meta.organisasi_nama}
            meaningFacets={kesejahteraanMeaningFacets}
          />
          <CwKesejahteraanDriver
            sectionIndex="02-B"
            items={kesejahteraanItems}
            selectedKey={kesejahteraanSelectedKey}
            onSelect={setKesejahteraanKey}
          />
          <CwKesejahteraanSuaraKaryawan
            sectionIndex="02-C"
            temaEsai={tema_esai}
            aspekLabel={kesejahteraanSelected?.label}
            actionSteps={kesejahteraanAksiTerpilih}
          />
        </>
      )}

      {sectionAktif === "organisasi" && (
        <>
          <CwDimensiRingkasan
            sectionIndex="03-A"
            sectionTitle="Laporan Profil Organisasi"
            subtitle="Kesimpulan Dimensi Profil Organisasi yang Paling Menonjol di Perusahaan Anda"
            dominantPrefix="Terkuat:"
            dominant={organisasiDominan}
            items={organisasiItems}
            selectedKey={organisasiKey}
            onSelect={setOrganisasiKey}
            namaOrganisasi={meta.organisasi_nama}
            meaningFacets={organisasiMeaningFacets}
          />
          <CwOrganisasiDetailAspek
            sectionIndex="03-B"
            items={bagian_profil_organisasi.chart_data}
            heatmapCells={analisis?.heatmap || []}
          />
          <CwDimensiTindakLanjut
            sectionIndex="03-C"
            title="Tindak Lanjut yang Perlu Dilakukan"
            subtitle="Melihat hasil tiap dimensi, berikut ini hal yang bisa dilakukan"
            items={organisasiTindakLanjut}
          />
        </>
      )}
    </div>
  );
}

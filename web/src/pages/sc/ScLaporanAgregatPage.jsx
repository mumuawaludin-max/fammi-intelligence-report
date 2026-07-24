import { useMemo, useState } from "react";
import { ScDimensiRingkasan } from "./ScDimensiRingkasan";
import { ScDimensiPerbandingan } from "./ScDimensiPerbandingan";
import { ScDimensiTindakLanjut } from "./ScDimensiTindakLanjut";
import { ScBudayaPerbandinganDumbbell } from "./ScBudayaPerbandinganDumbbell";
import { ScBudayaDetailAspek } from "./ScBudayaDetailAspek";
import { ScBudayaCeritaPegawai } from "./ScBudayaCeritaPegawai";
import { TIPE_BUDAYA_INFO, KESEJAHTERAAN_INFO, DIMENSI_PROFIL_INFO, METODOLOGI_NOTE } from "./scMeta";
import styles from "./ScLaporanAgregatPage.module.css";

const BUDAYA_TINDAK_LANJUT_ID = "sc-budaya-tindak-lanjut";

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function periodeLabel(periodeId) {
  if (!periodeId) return "";
  const [y, m] = String(periodeId).split("-").map(Number);
  return `${BULAN[m - 1] || ""} ${y}`.trim();
}

/** Item dengan value tertinggi dari daftar {key,value}. */
function tertinggiDari(items) {
  return (items || []).reduce((acc, d) => (acc == null || (d.value ?? 0) > (acc.value ?? 0) ? d : acc), null);
}

/**
 * ScLaporanAgregatPage -- dashboard "Laporan Lembaga" School Culture, RESTART TOTAL mengikuti
 * design-references/wireframe-original.png (bukan lagi versi polished nav-strip+dumbbell+tab)
 * atas instruksi eksplisit pemilik produk: tiga kartu gelap (01/02/03) di atas jadi filter
 * tampilan di bawahnya, masing-masing bagian punya struktur identik A (ringkasan+skor) / B
 * (perbandingan saat ini vs harapan) / C (tindak lanjut per dimensi).
 *
 * SEMUA section lama (Angka Kunci, Prioritas Perbaikan lintas-fokus, Perbandingan Antarunit,
 * dan seluruh insight Fase B-D-E: pie dominan, distribusi arah, strip plot, donut, heatmap,
 * scatter, tema esai, tren antarperiode) SENGAJA DIHAPUS dari halaman ini -- tidak match dengan
 * struktur wireframe yang direstart. Data & fungsi hulu (useScData.js, migrations, Edge
 * Functions) TIDAK disentuh, murni pembongkaran tampilan.
 *
 * Laporan individu staf (ScLaporanIndividuPage.jsx/ScKaryawanPage.jsx/ScRespondenListPage.jsx)
 * TIDAK termasuk restart ini -- reference tidak pernah mendesain laporan individu sama sekali.
 */
export default function ScLaporanAgregatPage({ laporan, sectionAktif: sectionAktifProp, onSectionChange }) {
  const { meta, bagian_budaya, bagian_kesejahteraan, bagian_profil_organisasi, footer, analisis, cerita_pegawai } = laporan;
  const periodLabelTeks = periodeLabel(meta.periode_id);

  // Terkontrol dari ScPage (filter di nav bar) kalau prop dikirim; fallback state lokal untuk
  // pemanggil lama yang belum diupdate (mis. ScAgregatPreview.jsx, QA visual lepas-login).
  const [sectionAktifLokal, setSectionAktifLokal] = useState("budaya");
  const sectionAktif = sectionAktifProp ?? sectionAktifLokal;
  const setSectionAktif = onSectionChange ?? setSectionAktifLokal;

  // ── Budaya Kerja (4 tipe) ──────────────────────────────────────────────────────────────
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
  const budayaMeaningItems = useMemo(
    () => bagian_budaya.chart_data.map((d) => ({ key: d.tipe, icon: d.tipe, detail: TIPE_BUDAYA_INFO[d.tipe]?.deskripsi })).filter((m) => m.detail),
    [bagian_budaya.chart_data]
  );
  const budayaTindakLanjut = useMemo(() => bagian_budaya.chart_data.map((d) => ({
    key: d.tipe, label: d.tipe,
    focus: d.focus || d.interpretation || TIPE_BUDAYA_INFO[d.tipe]?.deskripsi,
    steps: d.phases, indicators: d.indicators, warnings: d.warnings,
  })), [bagian_budaya.chart_data]);

  // ── Kesejahteraan Tim (5 subdimensi) ──────────────────────────────────────────────────
  const kesejahteraanItems = useMemo(
    () => bagian_kesejahteraan.chart_data.map((k) => ({ key: k.kode, label: k.label, icon: k.kode, value: k.nilai })),
    [bagian_kesejahteraan.chart_data]
  );
  const kesejahteraanDominan = useMemo(() => tertinggiDari(kesejahteraanItems), [kesejahteraanItems]);
  const [kesejahteraanKey, setKesejahteraanKey] = useState(() => kesejahteraanDominan?.key || null);
  const kesejahteraanMeaningItems = useMemo(
    () => bagian_kesejahteraan.chart_data.map((k) => ({ key: k.kode, icon: k.kode, detail: KESEJAHTERAAN_INFO[k.kode]?.deskripsi })).filter((m) => m.detail),
    [bagian_kesejahteraan.chart_data]
  );
  // target/gapValue SENGAJA tidak diisi -- kesejahteraan tidak punya konsep "harapan staf" di
  // data (cuma nilai + kategori), beda dari budaya yang punya pasangan mean_gambaran/harapan.
  const kesejahteraanPerbandingan = useMemo(() => bagian_kesejahteraan.chart_data.map((k) => ({
    key: k.kode, label: k.label, current: k.nilai, target: undefined, gapValue: undefined, status: k.status || k.kategori,
  })), [bagian_kesejahteraan.chart_data]);
  const kesejahteraanTindakLanjut = useMemo(() => bagian_kesejahteraan.chart_data.map((k) => ({
    key: k.kode, label: k.label,
    focus: KESEJAHTERAAN_INFO[k.kode]?.deskripsi,
    steps: k.phases, indicators: k.indicators, warnings: k.warnings,
  })), [bagian_kesejahteraan.chart_data]);

  // ── Profil Organisasi (6 dimensi) ─────────────────────────────────────────────────────
  const organisasiItems = useMemo(
    () => bagian_profil_organisasi.chart_data.map((d) => ({ key: d.kode, label: d.label, icon: d.kode, value: d.nilai })),
    [bagian_profil_organisasi.chart_data]
  );
  const organisasiDominan = useMemo(() => tertinggiDari(organisasiItems), [organisasiItems]);
  const [organisasiKey, setOrganisasiKey] = useState(() => organisasiDominan?.key || null);
  const organisasiMeaningItems = useMemo(
    () => bagian_profil_organisasi.chart_data.map((d) => ({ key: d.kode, icon: d.kode, detail: DIMENSI_PROFIL_INFO[d.kode]?.deskripsi })).filter((m) => m.detail),
    [bagian_profil_organisasi.chart_data]
  );
  const organisasiPerbandingan = useMemo(() => bagian_profil_organisasi.chart_data.map((d) => ({
    key: d.kode, label: d.label, current: d.nilai, target: d.harapan, gapValue: d.gap, status: d.status || d.kategori,
  })), [bagian_profil_organisasi.chart_data]);
  // steps/indicators/warnings SELALU undefined -- tidak ada fokus='organisasi' di tindak_lanjut
  // manapun sekarang, lihat catatan di useScData.js.
  const organisasiTindakLanjut = useMemo(() => bagian_profil_organisasi.chart_data.map((d) => ({
    key: d.kode, label: d.label,
    focus: DIMENSI_PROFIL_INFO[d.kode]?.deskripsi,
    steps: d.phases, indicators: d.indicators, warnings: d.warnings,
  })), [bagian_profil_organisasi.chart_data]);

  return (
    <div className={styles.page}>
      {sectionAktif === "budaya" && (
        <>
          <ScDimensiRingkasan
            sectionIndex="01-A"
            sectionTitle="Laporan Budaya Kerja"
            subtitle="Kesimpulan Budaya Kerja yang Paling Dominan di Lembaga Anda"
            dominantPrefix="Budaya:"
            dominant={budayaDominan}
            items={budayaItems}
            selectedKey={budayaKey}
            onSelect={setBudayaKey}
            meaningTitle="Itu artinya lembaga Anda:"
            meaningItems={budayaMeaningItems}
          />
          <ScBudayaPerbandinganDumbbell
            sectionIndex="01-B"
            chartData={bagian_budaya.chart_data}
            tabelGap={bagian_budaya.tabel_gap}
            selected={budayaTerpilih}
            onSelect={setBudayaKey}
            onPrioritize={prioritaskanBudaya}
          />
          <ScDimensiTindakLanjut
            sectionIndex="01-C"
            title="Tindak Lanjut yang Perlu Dilakukan"
            subtitle="Melihat hasil setiap tipe budaya, berikut ini hal yang bisa dilakukan"
            items={budayaTindakLanjut}
            id={BUDAYA_TINDAK_LANJUT_ID}
          />
          <ScBudayaDetailAspek sectionIndex="01-D" heatmapCells={analisis?.heatmap || []} />
          <ScBudayaCeritaPegawai sectionIndex="01-E" ceritaPegawai={cerita_pegawai} />
        </>
      )}

      {sectionAktif === "kesejahteraan" && (
        <>
          <ScDimensiRingkasan
            sectionIndex="02-A"
            sectionTitle="Laporan Kesejahteraan Tim"
            subtitle="Kesimpulan Subdimensi Kesejahteraan yang Paling Menonjol di Lembaga Anda"
            dominantPrefix="Terkuat:"
            dominant={kesejahteraanDominan}
            items={kesejahteraanItems}
            selectedKey={kesejahteraanKey}
            onSelect={setKesejahteraanKey}
            meaningTitle="Itu artinya untuk tim Anda:"
            meaningItems={kesejahteraanMeaningItems}
          />
          <ScDimensiPerbandingan
            sectionIndex="02-B"
            title="Kondisi Kesejahteraan Tim Saat Ini"
            subtitle="Skor tiap subdimensi kesejahteraan staf pada periode ini"
            items={kesejahteraanPerbandingan}
          />
          <ScDimensiTindakLanjut
            sectionIndex="02-C"
            title="Tindak Lanjut yang Perlu Dilakukan"
            subtitle="Melihat hasil tiap subdimensi, berikut ini hal yang bisa dilakukan"
            items={kesejahteraanTindakLanjut}
          />
        </>
      )}

      {sectionAktif === "organisasi" && (
        <>
          <ScDimensiRingkasan
            sectionIndex="03-A"
            sectionTitle="Laporan Profil Organisasi"
            subtitle="Kesimpulan Dimensi Profil Organisasi yang Paling Menonjol di Lembaga Anda"
            dominantPrefix="Terkuat:"
            dominant={organisasiDominan}
            items={organisasiItems}
            selectedKey={organisasiKey}
            onSelect={setOrganisasiKey}
            meaningTitle="Itu artinya lembaga Anda:"
            meaningItems={organisasiMeaningItems}
          />
          <ScDimensiPerbandingan
            sectionIndex="03-B"
            title="Perbandingan Kondisi Saat ini & Harapan ke Depan"
            subtitle="Penilaian staf atas kondisi saat ini dibandingkan dengan harapan ke depan, kalau tersedia"
            items={organisasiPerbandingan}
          />
          <ScDimensiTindakLanjut
            sectionIndex="03-C"
            title="Tindak Lanjut yang Perlu Dilakukan"
            subtitle="Melihat hasil tiap dimensi, berikut ini hal yang bisa dilakukan"
            items={organisasiTindakLanjut}
          />
        </>
      )}

      <p className={styles.disclaimer}>{footer.disclaimer}</p>
      <p className={styles.metodologi}>{METODOLOGI_NOTE}</p>
      <p className={styles.periodeNote}>Periode: {periodLabelTeks} · {meta.jumlah_responden} responden</p>
    </div>
  );
}

import { useMemo, useState } from "react";
import { LwSectionSelector } from "./LwSectionSelector";
import { LwDimensiRingkasan } from "./LwDimensiRingkasan";
import { LwKandidatTable } from "./LwKandidatTable";
import { LwTopSkill } from "./LwTopSkill";
import { LwProtekPerbandingan } from "./LwProtekPerbandingan";
import { LwTemuanSpesifik } from "./LwTemuanSpesifik";
import { LwPelatihanList } from "./LwPelatihanList";
import { LwCeritaInspiratif } from "./LwCeritaInspiratif";
import { LwWellbeingHasil } from "./LwWellbeingHasil";
import { LwInsightBanner } from "./LwInsightBanner";
import { LwReveal } from "./LwReveal";
import { LEAD_ASPEK_INFO, PROTEK_CUTOFF } from "./lwMeta";
import tokens from "./lwTokens.module.css";
import styles from "./LwLaporanPage.module.css";

/**
 * Rilis pertama modul ini HANYA laporan Wellbeing (Kesehatan Mental/PROTEK) -- keputusan
 * pemilik produk 2026-08-25. Seluruh section lama (selector 3 kartu + Kesiapan Memimpin +
 * Tindak Lanjut & Pengembangan) SENGAJA dipertahankan utuh di blok bawah, digerbang flag ini,
 * supaya rilis berikutnya tinggal menyalakannya kembali tanpa menggali ulang kode.
 */
const TAMPILKAN_SECTION_LEGACY = false;

const SECTIONS = [
  { key: "kesiapan", number: "01", icon: "kesiapan", label: "Kesiapan Memimpin" },
  { key: "kesehatan", number: "02", icon: "kesehatan", label: "Kesehatan Mental & Wellbeing" },
  { key: "pengembangan", number: "03", icon: "pengembangan", label: "Tindak Lanjut & Pengembangan" },
];

function tertinggiDari(items) {
  return (items || []).reduce((acc, d) => (acc == null || (d.value ?? 0) > (acc.value ?? 0) ? d : acc), null);
}

/**
 * LwLaporanPage -- dashboard "Laporan Lembaga" Leadership & Wellbeing Assessment. Tampilan
 * aktif: laporan Wellbeing satu-scroll, gabungan gaya School Culture (heading index pill) dan
 * pola HEART Perilaku Anak (LwWellbeingHasil). Struktur: hero, insight banner, distribusi
 * kategori organisasi, hasil per dimensi PROTEK (01), temuan spesifik (02), footer skala.
 */
export default function LwLaporanPage({ laporan, onSelectKandidat }) {
  const { meta, briefing, kesiapan, kesehatan, pengembangan } = laporan;
  const [sectionAktif, setSectionAktif] = useState("kesiapan");

  // ── State/derivasi milik blok legacy (Kesiapan Memimpin) -- tetap hidup untuk rilis
  //    berikutnya, murah dihitung, lihat catatan TAMPILKAN_SECTION_LEGACY di atas. ─────────
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

  return (
    <div className={styles.page}>
      {/* ── Laporan Wellbeing (rilis aktif) ─────────────────────────────────────────────── */}
      <section className={`${tokens.scope} ${styles.hero}`}>
        <LwReveal>
          <h1>Laporan Wellbeing Guru</h1>
          <p className={styles.heroSub}>
            {meta.organisasiNama} · Periode Juli 2025 · {meta.jumlahKandidat} guru di {kesehatan.perUnit?.length || 0} jenjang
          </p>
        </LwReveal>
      </section>

      <div className={styles.bannerWrap}>
        <LwInsightBanner teks={briefing?.teks} />
      </div>

      {kesehatan.distribusi?.length > 0 && (
        <LwReveal className={`${tokens.scope} ${styles.distribusiRow}`} delay={0.04}>
          {kesehatan.distribusi.map((d) => (
            <span
              key={d.kategori}
              className={styles.distribusiPill}
              style={{ color: `var(${d.toneVar})`, background: `color-mix(in srgb, var(${d.toneVar}) 12%, white)` }}
            >
              <strong>{d.kategori}</strong>
              <span>{d.persen}% ({d.jumlah} orang)</span>
            </span>
          ))}
        </LwReveal>
      )}

      <LwWellbeingHasil
        sectionIndex="01"
        ringkasan={kesehatan.ringkasan}
        perUnit={kesehatan.perUnit}
        daftarPerhatian={kesehatan.daftarPerhatian}
        namaLembaga={meta.organisasiNama}
        onSelectKandidat={onSelectKandidat}
      />

      <LwTemuanSpesifik
        sectionIndex="02"
        title="Temuan Spesifik yang Perlu Diwaspadai"
        subtitle="Pernyataan spesifik yang mengindikasikan kerentanan, per dimensi"
        items={kesehatan.temuanSpesifik}
      />

      <section className={`${tokens.scope} ${styles.cutoffStrip}`}>
        <p className={styles.cutoffTitle}>Skala penilaian kondisi kesehatan mental (skor total PROTEK, 6 dimensi x 7 item)</p>
        <div className={styles.cutoffRow}>
          {PROTEK_CUTOFF.map((c) => (
            <span key={c.kategori} className={styles.cutoffItem} style={{ color: `var(${c.toneVar})` }}>
              <strong>{c.kategori}</strong> {c.min}-{c.max}
            </span>
          ))}
        </div>
        <p className={styles.cutoffNote}>
          Seluruh skor dan kategori berasal langsung dari laporan asesmen yang sudah dianalisis ahli dan psikolog Fammi; dashboard ini menampilkan, bukan menghitung ulang.
        </p>
      </section>

      {/* ── Blok legacy: 3 section lengkap, dinonaktifkan sementara ─────────────────────── */}
      {TAMPILKAN_SECTION_LEGACY && (
        <>
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
            <LwProtekPerbandingan
              sectionIndex="02-B"
              title="Sebaran Kategori per Dimensi"
              subtitle="Area utama yang perlu perhatian lebih, dilihat dari sebaran kategori tiap dimensi"
              items={kesehatan.perbandingan}
            />
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
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import SectionHeading from "../../components/SectionHeading";
import {
  KarakterStateBox, AskMascot, AspekBarList, ScoreBarList, GoodEmptyState, Donut,
  VoiceBento, SourceSwitch, TrendChart, TrendModeSwitch, useSummaryTrend, useKarakterPekanTrend, labelTitikPekan,
} from "./KarakterShared";
import { StatCardMini, StatCardLandscape, AllGoodBanner, splitByClassify, scrollToId } from "./KarakterViewParts";
import KebijakanGoals from "./KebijakanGoals";
import { KEBIJAKAN_KEPSEK } from "./dummyKebijakan";
import DetailDialog from "./DetailDialog";
import SampleTag from "../../components/SampleTag";
import FollowupRibbon from "../../components/FollowupRibbon";
import { useKarakterKepsek, kelasKey } from "./useKarakterData";
import {
  pct, ringkasanAspekValue, parseTop5Pair, parseTop5Indikator, deltaVsPrevious,
  classifyPencapaian, periodeLabel, aspekIcon, avgAspek, persen, isKebijakanReady, SECTION_ICON,
  judulSectionSuara, REFLEKSI_META, REFLEKSI_SUMBER_URUTAN, resolveSummaryKey, titikSetahunAjaran,
} from "./karakterMeta";
import { KARAKTER_BAR_TONE_CUTOFF } from "../../lib/cutoffs";
import styles from "./KarakterViews.module.css";

/**
 * Label kepala kartu penilai (JenjangPieGrid) dan label pendek untuk subtitle dialog jenjang.
 * Teks guru dan orang tua disalin persis dari yang sudah tampil sekarang. Teks siswa sengaja
 * "Penilaian Diri Siswa" (bukan sekadar "Penilaian Siswa") karena siswa melaporkan dirinya
 * sendiri, beda dari guru/orang tua yang menilai pihak ketiga.
 */
const PENILAI_HEAD_LABEL = {
  guru: "👨‍🏫 Penilaian Guru",
  orangtua: "👪 Penilaian Orang Tua",
  siswa: "🧑‍🎓 Penilaian Diri Siswa",
};
const PENILAI_SHORT_LABEL = { guru: "guru", orangtua: "orang tua", siswa: "siswa" };

/** Sumber refleksi dianggap punya data jenjang kalau salah satu kandidat summaryKeys pencapaian
 * atau rataPencapaian-nya benar-benar ada di ringkasan jenjang ini (lewat resolveSummaryKey). */
function sumberAdaDiRingkasanJenjang(rk, sumber) {
  const meta = REFLEKSI_META[sumber];
  if (!meta) return false;
  return resolveSummaryKey(rk, meta.summaryKeys.pencapaian) !== null
    || resolveSummaryKey(rk, meta.summaryKeys.rataPencapaian) !== null;
}

/**
 * Daftar penilai satu jenjang: guru selalu pertama (skema lama, tak berubah), lalu tiap sumber
 * refleksi urut REFLEKSI_SUMBER_URUTAN yang datanya benar-benar ada di ringkasan jenjang ini.
 * Sumber yang kuncinya tidak ada di ringkasan sama sekali tidak masuk daftar -- sekolah varian A
 * (cuma refleksi orang tua) selalu dapat persis dua penilai seperti sebelum perubahan ini.
 */
function penilaiJenjangList(rk, aspek) {
  const list = [{
    key: "guru",
    headLabel: PENILAI_HEAD_LABEL.guru,
    shortLabel: PENILAI_SHORT_LABEL.guru,
    bagian: pct(rk?.pencapaian_guru),
    // Pakai angka rata-rata jenjang yang SUDAH final dari ringkasan (kalau sheet-nya
    // menyediakan field itu langsung, sama seperti level sekolah), baru fallback ke
    // avgAspek (rata-rata dari skor per aspek yang masing-masing sudah dibulatkan
    // sendiri-sendiri). Dua rute ini bisa beda 1pp karena pembulatan bertingkat --
    // FIR tidak boleh menghitung ulang kalau angka finalnya sudah tersedia (CLAUDE.md).
    rata: pct(rk?.rata_pencapaian_guru) ?? avgAspek(rk, aspek, "rata_input_guru_"),
  }];
  REFLEKSI_SUMBER_URUTAN.forEach((sumber) => {
    if (!sumberAdaDiRingkasanJenjang(rk, sumber)) return;
    const meta = REFLEKSI_META[sumber];
    list.push({
      key: sumber,
      headLabel: PENILAI_HEAD_LABEL[sumber] || `${meta.icon} Penilaian ${meta.label}`,
      shortLabel: PENILAI_SHORT_LABEL[sumber] || meta.satuan,
      bagian: pct(resolveSummaryKey(rk, meta.summaryKeys.pencapaian)),
      rata: pct(resolveSummaryKey(rk, meta.summaryKeys.rataPencapaian)) ?? avgAspek(rk, aspek, meta.summaryKeys.rataAspekPrefix),
    });
  });
  return list;
}

/** Satu pie/donut per jenjang: berapa persen dinilai + rata-rata karakter, per penilai yang tersedia. */
function JenjangPieGrid({ rows, aspekUntukJenjang, onSelect }) {
  if (!rows.length) return null;
  return (
    <div className={styles.jenjangGrid}>
      {rows.map((r) => {
        // Kerangka karakter diambil per jenjang, bukan satu daftar sekolah-wide: di sekolah yang
        // tiap jenjangnya berbeda, satu daftar berarti rata-rata jenjang dihitung dari kode aspek
        // milik jenjang lain.
        const penilaiList = penilaiJenjangList(r.ringkasan, aspekUntukJenjang(r.scope_id));
        const donutVal = penilaiList.find((p) => p.rata != null)?.rata ?? null;
        return (
          <button type="button" key={r.scope_id} className={styles.jenjangCard} onClick={() => onSelect(r)}>
            <p className={styles.jenjangName}>{r.scope_id}</p>
            <Donut value={donutVal} label="Rata-rata karakter" />
            <div className={styles.jenjangStats}>
              {penilaiList.map((p) => (
                <div className={styles.jenjangAssessor} key={p.key}>
                  <p className={styles.jenjangAssessorHead}>{p.headLabel}</p>
                  <div className={styles.jenjangMetricRow}>
                    <span className={styles.jenjangMetricLabel}>Jumlah murid yang dinilai</span>
                    <span className={styles.jenjangMetricVal}>{persen(p.bagian)}</span>
                  </div>
                  <div className={styles.jenjangMetricRow}>
                    <span className={styles.jenjangMetricLabel}>Rata-rata karakter</span>
                    <span className={styles.jenjangMetricVal}>{persen(p.rata)}</span>
                  </div>
                </div>
              ))}
            </div>
            <span className={styles.jenjangDetailHint}>Klik untuk detail ›</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * "guru dan orang tua" / "guru, orang tua, dan siswa" dst, dipakai di subtitle section
 * "Perkembangan Karakter per Jenjang". Guru selalu disebut (skema lama, tak berubah); sumber
 * refleksi lain menyusul sesuai sumberRefleksi periode ini. Untuk sumberRefleksi ['orangtua']
 * hasilnya WAJIB "guru dan orang tua" persis seperti string lama.
 */
function frasaPenilaiJenjang(sumberRefleksi = []) {
  const labelSumber = REFLEKSI_SUMBER_URUTAN
    .filter((s) => sumberRefleksi.includes(s))
    .map((s) => PENILAI_SHORT_LABEL[s] || REFLEKSI_META[s]?.satuan)
    .filter(Boolean);
  const semua = ["guru", ...labelSumber];
  if (semua.length <= 2) return semua.join(" dan ");
  return `${semua.slice(0, -1).join(", ")}, dan ${semua[semua.length - 1]}`;
}

/**
 * "orang tua" / "orang tua dan siswa" / "siswa", dipakai di kalimat narasi (bukan judul) yang
 * menyebut sumber refleksi. Untuk sumberRefleksi ['orangtua'] WAJIB "orang tua" persis seperti
 * string lama.
 */
function frasaSumberRefleksi(sumberRefleksi = []) {
  return REFLEKSI_SUMBER_URUTAN
    .filter((s) => sumberRefleksi.includes(s))
    .map((s) => REFLEKSI_META[s]?.satuan)
    .filter(Boolean)
    .join(" dan ");
}

export default function KepsekView({ session, periodeId }) {
  const { loading, error, data } = useKarakterKepsek(session, periodeId);
  const { points: trendPoints } = useSummaryTrend({
    sekolahId: session.school_id, scope: "sekolah", scopeId: session.school_id,
  });
  const { points: pekanPoints } = useKarakterPekanTrend({ sekolahId: session.school_id });
  // Tampilan grafik tren: per bulan (bawaan) atau per pekan.
  const [trenMode, setTrenMode] = useState("bulan");
  const [activeCategory, setActiveCategory] = useState("kualitas");
  const [filterJenjang, setFilterJenjang] = useState(null);
  const [filterKelas, setFilterKelas] = useState(null);
  const [kelasTab, setKelasTab] = useState("semua");
  const [selectedKelasId, setSelectedKelasId] = useState(null);
  const [selectedJenjangDialog, setSelectedJenjangDialog] = useState(null);
  // Sumber refleksi dipilih lewat SourceSwitch di section Suara. null di awal, nilai efektif
  // dihitung saat render (sumberEfektif di bawah) supaya selalu jatuh ke elemen pertama
  // sumberRefleksi kalau sumberAktif belum dipilih atau sudah tidak ada lagi di periode ini.
  const [sumberAktif, setSumberAktif] = useState(null);

  // Filter kelas/jenjang dan kelas terpilih di panel detail jadi tidak relevan lagi begitu
  // periode berganti (kelas yang sama belum tentu ada/cocok di periode lain).
  useEffect(() => {
    setFilterJenjang(null);
    setFilterKelas(null);
    setSelectedKelasId(null);
    setKelasTab("semua");
  }, [periodeId]);

  if (loading || error) return <KarakterStateBox loading={loading} error={error} />;

  const { periode, aspek, aspekUntukJenjang, perJenjang, indeksSekolah, indeksTrend, indikatorByKelas, indikatorError, sekolah, jenjang, kelas, pernyataanBySumber, sumberRefleksi, tindakLanjut } = data;

  // Grafik tren dibatasi ke tahun ajaran periode yang sedang dibuka. Tanpa ini, Oktober 2025
  // tersambung langsung ke Agustus 2026 sebagai satu garis perkembangan, padahal itu dua tahun
  // ajaran dengan kerangka karakter yang bisa berbeda dan murid yang sudah naik kelas.
  // Kalau ringkasan sekolah dari berkas kosong, garis trennya diambil dari Indeks Karakter
  // Sekolah supaya grafiknya tidak kosong sama sekali.
  const trenSumber = trendPoints.length > 0 ? trendPoints : (indeksTrend || []);
  const trenTA = titikSetahunAjaran(trenSumber, periode);
  const pekanTA = titikSetahunAjaran(pekanPoints, periode);
  const adaPekananTA = pekanTA.some((p) => p.pekan > 0);
  const ringkasan = sekolah?.ringkasan || null;

  // Jatuh kembali ke elemen pertama sumberRefleksi kalau sumberAktif belum dipilih, atau sudah
  // tidak ada lagi (mis. pindah ke periode yang cuma punya refleksi orang tua).
  const sumberEfektif = sumberRefleksi.includes(sumberAktif) ? sumberAktif : sumberRefleksi[0];
  const judulSuara = judulSectionSuara(sumberRefleksi);
  const frasaSumber = frasaSumberRefleksi(sumberRefleksi);

  // Rekomendasi sekolah-wide Kepsek: baris nyata (scope='sekolah', sudah disetujui) kalau ada,
  // fallback ke contoh sampai Gemini mengisi tabelnya. kebijakanLegacy menampung baris yang
  // sudah disetujui tapi berskema lama (tidak lolos isKebijakanReady, mis. belum punya
  // title/konkret) -- dulu baris ini hilang sama sekali (tertimpa sample), sekarang tetap
  // ditampilkan sebagai kartu sederhana lewat FollowupRibbon.
  const kebijakanReal = (tindakLanjut || []).filter((r) => r.scope === "sekolah" && isKebijakanReady(r));
  const kebijakanLegacy = (tindakLanjut || []).filter((r) => r.scope === "sekolah" && !isKebijakanReady(r));
  const kebijakanData = kebijakanReal.length > 0 ? kebijakanReal : KEBIJAKAN_KEPSEK;
  const kebijakanIsSample = kebijakanReal.length === 0 && kebijakanLegacy.length === 0;
  const showKebijakanGoals = kebijakanReal.length > 0 || kebijakanIsSample;

  const kelasSorted = [...kelas].sort(
    (a, b) => (pct(b.ringkasan?.rata_rata_pencapaian_guru) ?? 0) - (pct(a.ringkasan?.rata_rata_pencapaian_guru) ?? 0)
  );
  const kelasTerkuat = kelasSorted[0]?.scope_id ?? "—";
  const kelasTerkuatNilai = kelasSorted[0] ? pct(kelasSorted[0].ringkasan?.rata_rata_pencapaian_guru) : null;
  const kelasPerhatianLabel = kelasSorted[kelasSorted.length - 1]?.scope_id ?? "—";

  // Angka hero SELALU dari ringkasan periode yang sedang dipilih (bukan selalu titik terbaru
  // di grafik tren), supaya filter periode di header benar-benar mengubah angka yang tampil.
  // Angka hero: ringkasan sekolah dari berkas kalau ada, kalau tidak Indeks Karakter Sekolah
  // yang dihitung database dari skornya sendiri. Sekolah berkerangka per jenjang SELALU jatuh ke
  // cadangan, karena ringkasan tingkat sekolah dari berkasnya sengaja tidak diimpor -- keenam
  // sheetnya sebenarnya ringkasan per jenjang dan akan saling menimpa.
  const nilaiRingkasan = pct(ringkasan?.rata_pencapaian_guru ?? ringkasan?.pencapaian_guru);
  const pakaiIndeks = nilaiRingkasan == null && indeksSekolah?.indeks != null;
  const latestValue = nilaiRingkasan ?? (indeksSekolah?.indeks ?? null);
  const latestLabel = periodeLabel(periode);
  // Delta dihitung relatif ke periode yang SEDANG DIPILIH, bukan selalu titik terbaru di grafik
  // tren -- kalau periode terpilih ada di jendela tren dan punya titik sebelumnya, hitung selisihnya.
  const periodeIndexInTrend = trendPoints.findIndex((p) => p.periode === periode);
  const heroDelta = periodeIndexInTrend > 0 ? deltaVsPrevious(trendPoints.slice(0, periodeIndexInTrend + 1)) : null;

  // Sekolah-wide, TIDAK terpengaruh filter jenjang/kelas di bawah (kartu statistik atas selalu gambaran utuh sekolah).
  const kelasSplitAll = splitByClassify(kelas, (k) => k.ringkasan?.rata_rata_pencapaian_guru);
  const aspekSplit = splitByClassify(aspek, (a) => ringkasanAspekValue(ringkasan, a.aspek_kode, "rata_input_guru_"));

  // Filter jenjang + kelas: HANYA mempersempit daftar kelas yang ditampilkan di panel bawah, tidak pernah
  // menghitung ulang rata-rata baru dari subset hasil filter (angka itu belum pernah dihitung backend).
  const jenjangOptions = Array.from(new Set(kelas.map((k) => k.ringkasan?.jenjang).filter(Boolean)));
  const kelasOptionsForFilter = kelas.filter((k) => !filterJenjang || k.ringkasan?.jenjang === filterJenjang);
  const kelasFiltered = kelas.filter((k) => {
    if (filterJenjang && k.ringkasan?.jenjang !== filterJenjang) return false;
    if (filterKelas && k.scope_id !== filterKelas) return false;
    return true;
  });
  const activeFilterCount = (filterJenjang ? 1 : 0) + (filterKelas ? 1 : 0);

  const kelasSplit = splitByClassify(kelasFiltered, (k) => k.ringkasan?.rata_rata_pencapaian_guru);

  // Master-detail kelas: daftar kiri mengikuti tab (Semua/Sudah Baik/Perlu Perhatian) + filter di atas,
  // panel kanan menampilkan detail kelas yang sedang dipilih (default baris pertama yang tampil).
  const kelasTabRows = (
    kelasTab === "baik" ? kelasSplit.baik :
    kelasTab === "perhatian" ? kelasSplit.perhatian :
    kelasFiltered
  )
    .map((k) => ({ ...k, nilai: pct(k.ringkasan?.rata_rata_pencapaian_guru) }))
    .sort((a, b) => (b.nilai ?? -1) - (a.nilai ?? -1));
  const activeKelasRow = kelasTabRows.find((k) => k.scope_id === selectedKelasId) || kelasTabRows[0] || null;

  return (
    <div className={`${styles.page} ${styles.pageFullBleed}`}>
      <AskMascot activeCategory={activeCategory} onSelect={setActiveCategory} />

      {/* ── Kategori 1: Perkembangan Kualitas dan Mutu Layanan Pendidikan ── */}
      {activeCategory === "kualitas" && (
      <div className={styles.megaCategory}>
        <div className={styles.megaCategoryHeader}>
          <h2 className={styles.megaCategoryTitle}>Perkembangan Kualitas dan Mutu Layanan Pendidikan</h2>
          <p className={styles.megaCategorySub}>
            Bagaimana perkembangan karakter anak di tiap kelas: kelas mana yang sudah baik, mana yang
            butuh dukungan tambahan, dan langkah konkret yang mengikutinya.
          </p>
        </div>

      <section className={styles.section}>
        <SectionHeading
          icon={SECTION_ICON.tren}
          eyebrow="Perjalanan sekolah · kenapa ini penting"
          title="Rata-Rata Pencapaian dan Peta Kelas"
          subtitle="Angka ini bukan rapor akhir, ini titik sekarang yang terus dipantau tiap bulan. Satu bulan turun bukan berarti mundur, yang penting arah beberapa bulan terakhir."
        />
        <div className={styles.statHeroRow}>
          <StatCardMini
            icon="📈" label={pakaiIndeks ? "Indeks Karakter Sekolah" : "Rata-rata Perkembangan Karakter Sekolah"}
            value={latestValue != null ? latestValue : "—"} unit={latestValue != null ? "%" : ""}
            sub={heroDelta
              ? `${heroDelta.direction === "up" ? "↑" : heroDelta.direction === "down" ? "↓" : "→"} ${heroDelta.value > 0 ? "+" : ""}${heroDelta.value}pp dari bulan lalu`
              : `Periode ${latestLabel || "ini"}`}
            subTone={heroDelta ? (heroDelta.direction === "up" ? "aman" : heroDelta.direction === "down" ? "perhatian" : "default") : "default"}
          >
            <TrendModeSwitch value={trenMode} onChange={setTrenMode} adaPekanan={adaPekananTA} />
            {trenMode === "pekan" && adaPekananTA
              ? <TrendChart points={pekanTA} labelOf={labelTitikPekan} keyOf={(p) => p.periode + "|" + p.pekanUrut} satuanDelta="pekan" />
              : <TrendChart points={trenTA} aspek={aspek} aspekPrefix="rata_input_guru_" />}
          </StatCardMini>

          <div className={styles.statHeroSide}>
            <StatCardLandscape
              icon="🏫" label="Kelas Dipetakan" value={kelas.length}
              sub={`${kelasSplitAll.baik.length} sudah baik · ${kelasSplitAll.perhatian.length} perlu perhatian`}
              onClick={() => scrollToId("kelas-detail")}
            />
            <StatCardLandscape
              icon="🌟" label="Kelas Terkuat" value={kelasTerkuat}
              sub={kelasTerkuatNilai != null ? `Perkembangan karakter ${kelasTerkuatNilai}%` : "Belum ada data"}
              onClick={kelasTerkuat !== "—" ? () => {
                setKelasTab("baik");
                setSelectedKelasId(kelasTerkuat);
                scrollToId("kelas-detail");
              } : undefined}
            />
            <StatCardLandscape
              icon="🌱" tone="perhatian" label="Perlu Perhatian" value={kelasPerhatianLabel}
              sub={kelasPerhatianLabel !== "—"
                ? (aspekSplit.perhatian.length > 0 ? `${aspekSplit.perhatian.length} aspek turut perlu perhatian` : "Aspek karakter sekolah sudah baik")
                : "Semua kelas sudah baik"}
              subTone="perhatian"
              onClick={kelasPerhatianLabel !== "—" ? () => {
                setKelasTab("perhatian");
                setSelectedKelasId(kelasPerhatianLabel);
                scrollToId("kelas-detail");
              } : undefined}
            />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading
          icon={SECTION_ICON.jenjang}
          eyebrow="Rincian per jenjang"
          title="Perkembangan Karakter per Jenjang"
          subtitle={`Tiap jenjang punya satu diagram. "Jumlah murid yang dinilai" = berapa persen murid sudah dinilai; "Rata-rata karakter" = tingkat perkembangan karakternya (0-100%), dari sisi ${frasaPenilaiJenjang(sumberRefleksi)}. Ini bukan nilai akademik. Klik satu jenjang untuk rinciannya per aspek.`}
        />
        {aspek.length === 0 && jenjang.length > 0 && (
          <p className={styles.emptyNote} style={{ marginBottom: 10 }}>
            "Rata-rata karakter" tampil "—" karena konfigurasi aspek (karakter_aspek_config) untuk sekolah ini belum diatur,
            padahal jumlah murid yang dinilai sudah terbaca. Perlu ditambahkan lewat Admin CMS sebelum angka ini bisa muncul.
          </p>
        )}
        {/* Sekolah berkerangka per jenjang: nama karakter sengaja tidak disebut di tingkat
            sekolah, karena karakter dengan nomor yang sama berbeda isinya antar jenjang. Nama
            aslinya muncul begitu satu jenjang dibuka. */}
        {perJenjang && (
          <p className={styles.emptyNote} style={{ marginBottom: 10 }}>
            Sekolah ini memakai kerangka karakter yang berbeda di tiap jenjang, jadi karakter tidak
            bisa dibandingkan lurus antar jenjang. Di tingkat sekolah karakter ditulis sebagai
            &ldquo;Karakter 1&rdquo;, &ldquo;Karakter 2&rdquo;, dan seterusnya; nama sebenarnya muncul
            saat satu jenjang dibuka.
          </p>
        )}
        <JenjangPieGrid rows={jenjang} aspekUntukJenjang={aspekUntukJenjang} onSelect={setSelectedJenjangDialog} />
      </section>

      <section className={styles.section} id="kelas-detail">
        <SectionHeading
          icon={SECTION_ICON.perbandinganKelas}
          eyebrow="Kelas mana yang perlu perhatian"
          title="Kelas: Sudah Baik vs Perlu Perhatian"
          subtitle="Kelas yang sudah baik layak dipertahankan, bukan titik berhenti. Kelas yang perlu perhatian bukan kelas yang lemah, butuh dukungan tambahan sekarang, bisa berubah periode berikutnya."
        />
        {kelasSplit.allGood && <div style={{ marginBottom: 14 }}><AllGoodBanner subject="kelas" /></div>}
        {kelasFiltered.length === 0 ? (
          <p className={styles.emptyNote}>Tidak ada kelas pada filter saat ini.</p>
        ) : (
          <div className={styles.masterDetail}>
            <div className={styles.masterList}>
              <div className={styles.masterListFilter}>
                <span className={styles.filterActiveBadge}>Filter aktif ({activeFilterCount})</span>
                <select
                  className={styles.filterSelect}
                  value={filterJenjang || ""}
                  onChange={(e) => { setFilterJenjang(e.target.value || null); setFilterKelas(null); }}
                >
                  <option value="">Semua Jenjang</option>
                  {jenjangOptions.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
                <select
                  className={styles.filterSelect}
                  value={filterKelas || ""}
                  onChange={(e) => setFilterKelas(e.target.value || null)}
                >
                  <option value="">Semua Kelas</option>
                  {kelasOptionsForFilter.map((k) => <option key={k.scope_id} value={k.scope_id}>{k.scope_id}</option>)}
                </select>
              </div>
              <div className={styles.masterListTabs}>
                <button type="button" className={`${styles.masterListTab} ${kelasTab === "semua" ? styles.masterListTabActive : ""}`} onClick={() => setKelasTab("semua")}>
                  Semua ({kelasFiltered.length})
                </button>
                <button type="button" className={`${styles.masterListTab} ${kelasTab === "baik" ? styles.masterListTabActive : ""}`} onClick={() => setKelasTab("baik")}>
                  Sudah Baik ({kelasSplit.baik.length})
                </button>
                <button type="button" className={`${styles.masterListTab} ${kelasTab === "perhatian" ? styles.masterListTabActive : ""}`} onClick={() => setKelasTab("perhatian")}>
                  Perlu Perhatian ({kelasSplit.perhatian.length})
                </button>
              </div>
              <div className={styles.masterListRows}>
                {kelasTabRows.length === 0 ? (
                  <p className={styles.emptyNote}>Tidak ada kelas di kategori ini.</p>
                ) : kelasTabRows.map((k) => {
                  const tone = classifyPencapaian(k.nilai);
                  const active = activeKelasRow?.scope_id === k.scope_id;
                  return (
                    <button
                      type="button" key={k.scope_id}
                      className={`${styles.masterListRow} ${active ? styles.masterListRowActive : ""}`}
                      onClick={() => setSelectedKelasId(k.scope_id)}
                    >
                      <span className={styles.masterListAvatar}>{k.scope_id.charAt(0)}</span>
                      <span className={styles.masterListName}>{k.scope_id}</span>
                      <span className={`${styles.masterListTone} ${tone === "baik" ? styles.tonePillAman : tone === "perlu_perhatian" ? styles.tonePillPerhatian : styles.tonePillDefault}`}>
                        {tone === "baik" ? "Sudah Baik" : tone === "perlu_perhatian" ? "Perlu Perhatian" : "Belum ada data"}
                      </span>
                      <span className={styles.masterListScore}>{k.nilai != null ? `${k.nilai}%` : "—"}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.masterDetailPanel}>
              {activeKelasRow ? (
                <>
                  <div className={styles.masterDetailHeader}>
                    <span className={styles.eyebrow}>Detail Kelas</span>
                    <h3 className={styles.masterDetailTitle}>{activeKelasRow.scope_id}</h3>
                    <p className={styles.cardSub}>Rata-rata pencapaian {activeKelasRow.nilai != null ? `${activeKelasRow.nilai}%` : "—"}</p>
                  </div>
                  {(() => {
                    const rk = activeKelasRow.ringkasan;
                    // Nama karakter diambil dari kerangka JENJANG kelas ini, bukan daftar
                    // sekolah-wide. Satu kelas selalu milik satu jenjang, jadi di sini nama
                    // aslinya memang sudah bisa dipastikan -- beda dari tingkat sekolah yang
                    // sengaja generik karena mencampur enam kerangka berbeda.
                    //
                    // Tanpa ini, panel Detail Kelas sekolah berkerangka per jenjang menulis
                    // "Karakter 1..4" padahal sekolahnya sudah mengisi namanya, dan admin
                    // mengira namanya belum tersimpan.
                    //
                    // Jenjang kelas ini dibaca dari kolom "jenjang" di sheet summary_kelas, yang
                    // ikut tersimpan apa adanya ke karakter_summary.ringkasan.
                    const jenjangKelasIni = rk?.jenjang || rk?.Jenjang || null;
                    const aspekKelasIni = aspekUntukJenjang(jenjangKelasIni);
                    const aspekItems = aspekKelasIni.map((a) => ({
                      label: a.aspek_label, icon: aspekIcon(a.aspek_label),
                      value: ringkasanAspekValue(rk, a.aspek_kode),
                    }));
                    const siswaTerbaik = parseTop5Pair(rk?.top5_siswa_tertinggi, rk?.top5_nilai_siswa_tertinggi)
                      .map((p) => ({ label: p.nama, value: pct(p.nilai) }));
                    const siswaLemah = parseTop5Pair(rk?.top5_siswa_terendah, rk?.top5_nilai_siswa_terendah)
                      .map((p) => ({ label: p.nama, value: pct(p.nilai) }))
                      .filter((p) => p.value != null && p.value < KARAKTER_BAR_TONE_CUTOFF.aman);
                    // Indikator punya dua sumber. Yang diutamakan tetap ringkasan kelas dari
                    // hulu (kolom top5_indikator_* di sheet summary_kelas), supaya sekolah yang
                    // berkasnya memuat kolom itu tampil persis seperti sebelumnya. Sekolah yang
                    // berkasnya TIDAK memuatnya dulu kosong total di sini padahal kelas yang sama
                    // tampil normal di Wali Kelas; sekarang jatuh ke rata-rata per kelas yang
                    // sudah diagregasi database (view karakter_indikator_kelas_avg), bukan
                    // dihitung di sini.
                    const indRingkasanAtas = parseTop5Indikator(rk?.top5_indikator_terbaik)
                      .map((it) => ({ label: it.label, value: pct(it.nilai) }));
                    const indRingkasanBawah = parseTop5Indikator(rk?.top5_indikator_terendah)
                      .map((it) => ({ label: it.label, value: pct(it.nilai) }));

                    // Satu indikator TIDAK MUNGKIN sekaligus masuk lima tertinggi dan lima
                    // terendah. Kalau itu terjadi, kedua daftar di berkas tidak berada pada skala
                    // yang sama dan tidak boleh dipercaya berdampingan.
                    //
                    // Nyata, bukan pengandaian: di berkas SD Amal Mulia (Agustus 2026), 14 dari 18
                    // kelas punya indikator yang muncul di dua daftar sekaligus -- "Meminta maaf
                    // dan memaafkan saat berselisih" tertulis 95% di daftar terbaik dan 5% di
                    // daftar terendah pada kelas yang sama. Angka di kolom terendah tampaknya
                    // porsi murid yang BELUM tercapai, bukan tingkat pencapaian. Dibaca sebagai
                    // pencapaian, 5% jatuh jauh di bawah ambang dan kelas yang seluruh indikatornya
                    // di atas 90% tetap tampil punya lima indikator "perlu penguatan".
                    //
                    // Begitu bentrokan terdeteksi, kedua daftar diambil dari rata-rata indikator
                    // per kelas yang dihitung database (view karakter_indikator_kelas_avg). Itu
                    // satu-satunya sumber yang pasti sekala-nya sama dengan angka lain di halaman
                    // ini, karena berasal dari baris skor yang sama.
                    const labelAtas = new Set(indRingkasanAtas.map((it) => String(it.label || "").trim().toLowerCase()));
                    const ringkasanBentrok = indRingkasanBawah.some(
                      (it) => labelAtas.has(String(it.label || "").trim().toLowerCase())
                    );

                    const indKelas = [...(indikatorByKelas?.[kelasKey(activeKelasRow.scope_id)] || [])]
                      .sort((a, b) => b.value - a.value);
                    const pakaiRingkasan = indRingkasanAtas.length > 0 && !ringkasanBentrok;
                    const indRingkasan = pakaiRingkasan ? indRingkasanAtas : [];
                    const adaIndikator = indRingkasan.length > 0 || indKelas.length > 0;
                    // Kalau query rata-rata indikator gagal (mis. view-nya belum dibuat di
                    // database), sebut kegagalannya. "Belum ada data" untuk sesuatu yang
                    // sebenarnya gagal dimuat adalah jawaban yang salah.
                    const indikatorEmptyText = indikatorError
                      ? `Data indikator gagal dimuat: ${indikatorError}`
                      : "Belum ada data indikator.";
                    const indTerbaik = indRingkasan.length > 0 ? indRingkasan : indKelas.slice(0, 5);
                    const indLemahSemua = indRingkasan.length > 0
                      ? indRingkasanBawah
                      : [...indKelas].reverse();
                    const indLemah = indLemahSemua
                      .filter((it) => it.value != null && it.value < KARAKTER_BAR_TONE_CUTOFF.aman)
                      .slice(0, 5);
                    return (
                      <div className={styles.detailRows}>
                        {/* Baris 1: skor per aspek, diurutkan dari tertinggi, semua tampil */}
                        <section>
                          <p className={styles.dialogSectionTitle}>📊 Skor per aspek (urut tertinggi)</p>
                          <ScoreBarList items={aspekItems} />
                        </section>

                        {/* Baris 2: dua kolom siswa */}
                        <div className={styles.detail2col}>
                          <section>
                            <p className={styles.dialogSectionTitle}>🏆 Top 5 siswa terbaik</p>
                            <ScoreBarList items={siswaTerbaik} rankByNumber emptyText="Belum ada data siswa." />
                          </section>
                          <section>
                            <p className={styles.dialogSectionTitle}>🌱 Top 5 siswa perlu penguatan</p>
                            {/* Kabar baik cuma boleh muncul kalau datanya memang ada. Kalau
                                daftar siswa kelas ini kosong, "semua sudah di atas 80%" adalah
                                klaim yang lahir dari data kosong, bukan dari temuan. */}
                            {siswaLemah.length > 0 ? (
                              <ScoreBarList items={siswaLemah} rankByNumber />
                            ) : siswaTerbaik.length > 0 ? (
                              <GoodEmptyState
                                title="Semua siswa sudah di atas 80%"
                                text="Tidak ada siswa yang perlu penguatan khusus di kelas ini periode ini."
                              />
                            ) : (
                              <ScoreBarList items={[]} emptyText="Belum ada data siswa." />
                            )}
                          </section>
                        </div>

                        {/* Baris 3: dua kolom indikator */}
                        {/* Kalau daftar indikator dari berkas ditolak karena saling bertentangan,
                            sebutkan. Angka yang tampil jadi berbeda dari isi berkas, dan admin
                            berhak tahu kenapa alih-alih mengira sistemnya yang salah hitung. */}
                        {ringkasanBentrok && (
                          <p className={styles.emptyNote} style={{ marginBottom: 8 }}>
                            Daftar indikator diambil dari rata-rata skor kelas ini, bukan dari kolom
                            ringkasan di berkas. Di berkas, indikator yang sama tertulis di daftar
                            terbaik sekaligus di daftar terendah dengan angka yang jauh berbeda, jadi
                            kedua kolom itu tidak berada pada skala yang sama dan tidak bisa dipakai
                            berdampingan. Perbaikannya ada di berkas sumber.
                          </p>
                        )}
                        <div className={styles.detail2col}>
                          <section>
                            <p className={styles.dialogSectionTitle}>⭐ Top 5 indikator terbaik</p>
                            <ScoreBarList items={indTerbaik} emptyText={indikatorEmptyText} />
                          </section>
                          <section>
                            <p className={styles.dialogSectionTitle}>🔧 Top 5 indikator perlu penguatan</p>
                            {/* Sama seperti kolom siswa: tanpa data indikator sama sekali, yang
                                tampil sebelumnya adalah "Semua indikator sudah di atas 80%" di
                                sebelah "Belum ada data indikator" -- dua pesan yang saling
                                bertentangan, dan yang hijau itu yang menyesatkan. */}
                            {indLemah.length > 0 ? (
                              <ScoreBarList items={indLemah} />
                            ) : adaIndikator ? (
                              <GoodEmptyState
                                title="Semua indikator sudah di atas 80%"
                                text="Tidak ada indikator di bawah 80% di kelas ini periode ini."
                              />
                            ) : (
                              <ScoreBarList items={[]} emptyText={indikatorEmptyText} />
                            )}
                          </section>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <p className={styles.emptyNote}>Pilih kelas di daftar sebelah kiri.</p>
              )}
            </div>
          </div>
        )}
      </section>

      </div>
      )}

      {/* ── Kategori 2: Perkembangan Citra Sekolah di Mata Orang Tua ── */}
      {activeCategory === "citra" && (
      <div className={`${styles.megaCategory} ${styles.megaCategoryB}`}>
        <div className={styles.megaCategoryHeader}>
          <h2 className={styles.megaCategoryTitle}>{judulSuara.mega}</h2>
          <p className={styles.megaCategorySub}>
            Sinyal dari rumah tentang bagaimana karakter anak terlihat di luar sekolah, dan langkah
            sekolah-wide yang mengikutinya untuk memperkuat kepercayaan {frasaSumber}.
          </p>
        </div>

        <section className={styles.section}>
          <SectionHeading
            icon={SECTION_ICON.suaraOrtu}
            eyebrow="Sinyal dari luar sekolah"
            title={judulSuara.section}
            subtitle={`Ini bukan testimoni, ini sinyal dari lingkungan rumah tentang bagaimana karakter anak terlihat di luar sekolah. Kalau banyak ${frasaSumber} menyebut hal yang sama, itu sinyal kuat untuk sekolah, bukan sekadar kumpulan pendapat pribadi.`}
          />
          <SourceSwitch sumberList={sumberRefleksi} value={sumberEfektif} onChange={setSumberAktif} />
          <VoiceBento
            sumber={sumberEfektif}
            pernyataan={pernyataanBySumber[sumberEfektif] || []}
            aspek={aspek}
            sekolahId={session.school_id}
            periodeId={periode}
          />
        </section>

      </div>
      )}

      {/* ── Kategori 3: Tindak Lanjut Sekolah di Periode Ini ── */}
      {activeCategory === "tindaklanjut" && (
      <div className={styles.megaCategory}>
        <div className={styles.megaCategoryHeader}>
          <h2 className={styles.megaCategoryTitle}>Tindak Lanjut Sekolah di Periode Ini</h2>
          <p className={styles.megaCategorySub}>
            Dari Fammi berdasarkan data periode ini, bukan keputusan final. Sebagian menyasar mutu
            layanan, sebagian menyasar citra sekolah di mata {frasaSumber}; yang perlu perhatian
            didahulukan, lalu yang tinggal dipertahankan. Tiap kartu bisa dibuka dan dibagikan ke WhatsApp.
          </p>
        </div>

        <section className={styles.section}>
          {kebijakanIsSample && (
            <p className={styles.sampleNote}>
              <SampleTag /> Isi rekomendasi masih contoh, menunggu perumusan otomatis. Strukturnya sudah final.
            </p>
          )}
          {showKebijakanGoals && <KebijakanGoals data={kebijakanData} />}
          {kebijakanLegacy.length > 0 && (
            <FollowupRibbon
              items={kebijakanLegacy.map((r) => ({ id: r.id, action: r.action, trigger: r.trigger_desc, module: "karakter", priority: r.priority }))}
            />
          )}
        </section>
      </div>
      )}

      {selectedJenjangDialog && (
        <DetailDialog
          icon={SECTION_ICON.jenjang}
          eyebrow="Detail Jenjang"
          title={selectedJenjangDialog.scope_id}
          subtitle={[
            { prefix: "rata_input_guru_", label: PENILAI_SHORT_LABEL.guru },
            ...REFLEKSI_SUMBER_URUTAN
              .filter((s) => sumberAdaDiRingkasanJenjang(selectedJenjangDialog.ringkasan, s))
              .map((s) => ({ prefix: REFLEKSI_META[s].summaryKeys.rataAspekPrefix, label: PENILAI_SHORT_LABEL[s] || REFLEKSI_META[s].satuan })),
          ]
            .map(({ prefix, label }) => `Rata-rata karakter ${persen(avgAspek(selectedJenjangDialog.ringkasan, aspekUntukJenjang(selectedJenjangDialog.scope_id), prefix))} (${label})`)
            .join(" · ")}
          onClose={() => setSelectedJenjangDialog(null)}
        >
          <section>
            <p className={styles.dialogSectionTitle}>Skor per aspek (dinilai guru)</p>
            <AspekBarList
              aspek={aspekUntukJenjang(selectedJenjangDialog.scope_id)}
              skorByAspek={Object.fromEntries(
                aspekUntukJenjang(selectedJenjangDialog.scope_id).map((a) => [a.aspek_kode, ringkasanAspekValue(selectedJenjangDialog.ringkasan, a.aspek_kode, "rata_input_guru_")])
              )}
            />
          </section>
        </DetailDialog>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import SectionHeading from "../../components/SectionHeading";
import {
  KarakterStateBox, AskMascot, AspekBarList, ScoreBarList, GoodEmptyState, Donut,
  ParentVoiceBento, TrendChart, useSummaryTrend,
} from "./KarakterShared";
import { StatCardMini, StatCardLandscape, AllGoodBanner, splitByClassify, scrollToId } from "./KarakterViewParts";
import KebijakanGoals from "./KebijakanGoals";
import { KEBIJAKAN_KEPSEK } from "./dummyKebijakan";
import DetailDialog from "./DetailDialog";
import SampleTag from "../../components/SampleTag";
import { useKarakterKepsek } from "./useKarakterData";
import {
  pct, ringkasanAspekValue, parseTop5Pair, parseTop5Indikator, deltaVsPrevious,
  classifyPencapaian, periodeLabel, aspekIcon, avgAspek, persen, isKebijakanReady, SECTION_ICON,
} from "./karakterMeta";
import styles from "./KarakterViews.module.css";

/** Satu pie/donut per jenjang: berapa persen dinilai + rata-rata karakter, dari guru & orang tua. */
function JenjangPieGrid({ rows, aspek, onSelect }) {
  if (!rows.length) return null;
  return (
    <div className={styles.jenjangGrid}>
      {rows.map((r) => {
        const rk = r.ringkasan;
        const guruPart = pct(rk?.pencapaian_guru);
        // Pakai angka rata-rata jenjang yang SUDAH final dari ringkasan (kalau sheet-nya
        // menyediakan field itu langsung, sama seperti level sekolah), baru fallback ke
        // avgAspek (rata-rata dari skor per aspek yang masing-masing sudah dibulatkan
        // sendiri-sendiri). Dua rute ini bisa beda 1pp karena pembulatan bertingkat --
        // FIR tidak boleh menghitung ulang kalau angka finalnya sudah tersedia (CLAUDE.md).
        const guruAch = pct(rk?.rata_pencapaian_guru) ?? avgAspek(rk, aspek, "rata_input_guru_");
        const ortuPart = pct(rk?.pencapaian_orangtua);
        const ortuAch = pct(rk?.rata_pencapaian_orangtua) ?? avgAspek(rk, aspek, "rata_input_orangtua_");
        const donutVal = guruAch ?? ortuAch;
        return (
          <button type="button" key={r.scope_id} className={styles.jenjangCard} onClick={() => onSelect(r)}>
            <p className={styles.jenjangName}>{r.scope_id}</p>
            <Donut value={donutVal} label="Rata-rata karakter" />
            <div className={styles.jenjangStats}>
              <div className={styles.jenjangAssessor}>
                <p className={styles.jenjangAssessorHead}>👨‍🏫 Penilaian Guru</p>
                <div className={styles.jenjangMetricRow}>
                  <span className={styles.jenjangMetricLabel}>Jumlah murid yang dinilai</span>
                  <span className={styles.jenjangMetricVal}>{persen(guruPart)}</span>
                </div>
                <div className={styles.jenjangMetricRow}>
                  <span className={styles.jenjangMetricLabel}>Rata-rata karakter</span>
                  <span className={styles.jenjangMetricVal}>{persen(guruAch)}</span>
                </div>
              </div>
              <div className={styles.jenjangAssessor}>
                <p className={styles.jenjangAssessorHead}>👪 Penilaian Orang Tua</p>
                <div className={styles.jenjangMetricRow}>
                  <span className={styles.jenjangMetricLabel}>Jumlah murid yang dinilai</span>
                  <span className={styles.jenjangMetricVal}>{persen(ortuPart)}</span>
                </div>
                <div className={styles.jenjangMetricRow}>
                  <span className={styles.jenjangMetricLabel}>Rata-rata karakter</span>
                  <span className={styles.jenjangMetricVal}>{persen(ortuAch)}</span>
                </div>
              </div>
            </div>
            <span className={styles.jenjangDetailHint}>Klik untuk detail ›</span>
          </button>
        );
      })}
    </div>
  );
}

export default function KepsekView({ session, periodeId }) {
  const { loading, error, data } = useKarakterKepsek(session, periodeId);
  const { points: trendPoints } = useSummaryTrend({
    sekolahId: session.school_id, scope: "sekolah", scopeId: session.school_id,
  });
  const [activeCategory, setActiveCategory] = useState("kualitas");
  const [filterJenjang, setFilterJenjang] = useState(null);
  const [filterKelas, setFilterKelas] = useState(null);
  const [kelasTab, setKelasTab] = useState("semua");
  const [selectedKelasId, setSelectedKelasId] = useState(null);
  const [selectedJenjangDialog, setSelectedJenjangDialog] = useState(null);

  // Filter kelas/jenjang dan kelas terpilih di panel detail jadi tidak relevan lagi begitu
  // periode berganti (kelas yang sama belum tentu ada/cocok di periode lain).
  useEffect(() => {
    setFilterJenjang(null);
    setFilterKelas(null);
    setSelectedKelasId(null);
    setKelasTab("semua");
  }, [periodeId]);

  if (loading || error) return <KarakterStateBox loading={loading} error={error} />;

  const { periode, aspek, sekolah, jenjang, kelas, pernyataan, tindakLanjut } = data;
  const ringkasan = sekolah?.ringkasan || null;

  // Rekomendasi sekolah-wide Kepsek: baris nyata (scope='sekolah', sudah disetujui) kalau ada,
  // fallback ke contoh sampai Gemini mengisi tabelnya.
  const kebijakanReal = (tindakLanjut || []).filter((r) => r.scope === "sekolah" && isKebijakanReady(r));
  const kebijakanData = kebijakanReal.length > 0 ? kebijakanReal : KEBIJAKAN_KEPSEK;
  const kebijakanIsSample = kebijakanReal.length === 0;

  const kelasSorted = [...kelas].sort(
    (a, b) => (pct(b.ringkasan?.rata_rata_pencapaian_guru) ?? 0) - (pct(a.ringkasan?.rata_rata_pencapaian_guru) ?? 0)
  );
  const kelasTerkuat = kelasSorted[0]?.scope_id ?? "—";
  const kelasTerkuatNilai = kelasSorted[0] ? pct(kelasSorted[0].ringkasan?.rata_rata_pencapaian_guru) : null;
  const kelasPerhatianLabel = kelasSorted[kelasSorted.length - 1]?.scope_id ?? "—";

  // Angka hero SELALU dari ringkasan periode yang sedang dipilih (bukan selalu titik terbaru
  // di grafik tren), supaya filter periode di header benar-benar mengubah angka yang tampil.
  const latestValue = pct(ringkasan?.rata_pencapaian_guru ?? ringkasan?.pencapaian_guru);
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
            icon="📈" label="Rata-rata Perkembangan Karakter Sekolah"
            value={latestValue != null ? latestValue : "—"} unit={latestValue != null ? "%" : ""}
            sub={heroDelta
              ? `${heroDelta.direction === "up" ? "↑" : heroDelta.direction === "down" ? "↓" : "→"} ${heroDelta.value > 0 ? "+" : ""}${heroDelta.value}pp dari bulan lalu`
              : `Periode ${latestLabel || "ini"}`}
            subTone={heroDelta ? (heroDelta.direction === "up" ? "aman" : heroDelta.direction === "down" ? "perhatian" : "default") : "default"}
          >
            {trendPoints.length >= 2
              ? <TrendChart points={trendPoints} aspek={aspek} aspekPrefix="rata_input_guru_" />
              : trendPoints.length === 1 && <TrendChart points={trendPoints} />}
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
          subtitle={`Tiap jenjang punya satu diagram. "Jumlah murid yang dinilai" = berapa persen murid sudah dinilai; "Rata-rata karakter" = tingkat perkembangan karakternya (0-100%), dari sisi guru dan orang tua. Ini bukan nilai akademik. Klik satu jenjang untuk rinciannya per aspek.`}
        />
        {aspek.length === 0 && jenjang.length > 0 && (
          <p className={styles.emptyNote} style={{ marginBottom: 10 }}>
            "Rata-rata karakter" tampil "—" karena konfigurasi aspek (karakter_aspek_config) untuk sekolah ini belum diatur,
            padahal jumlah murid yang dinilai sudah terbaca. Perlu ditambahkan lewat Admin CMS sebelum angka ini bisa muncul.
          </p>
        )}
        <JenjangPieGrid rows={jenjang} aspek={aspek} onSelect={setSelectedJenjangDialog} />
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
                    const aspekItems = aspek.map((a) => ({
                      label: a.aspek_label, icon: aspekIcon(a.aspek_label),
                      value: ringkasanAspekValue(rk, a.aspek_kode),
                    }));
                    const siswaTerbaik = parseTop5Pair(rk?.top5_siswa_tertinggi, rk?.top5_nilai_siswa_tertinggi)
                      .map((p) => ({ label: p.nama, value: pct(p.nilai) }));
                    const siswaLemah = parseTop5Pair(rk?.top5_siswa_terendah, rk?.top5_nilai_siswa_terendah)
                      .map((p) => ({ label: p.nama, value: pct(p.nilai) }))
                      .filter((p) => p.value != null && p.value < 80);
                    const indTerbaik = parseTop5Indikator(rk?.top5_indikator_terbaik)
                      .map((it) => ({ label: it.label, value: pct(it.nilai) }));
                    const indLemah = parseTop5Indikator(rk?.top5_indikator_terendah)
                      .map((it) => ({ label: it.label, value: pct(it.nilai) }))
                      .filter((it) => it.value != null && it.value < 80);
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
                            {siswaLemah.length > 0 ? (
                              <ScoreBarList items={siswaLemah} rankByNumber />
                            ) : (
                              <GoodEmptyState
                                title="Semua siswa sudah di atas 80%"
                                text="Tidak ada siswa yang perlu penguatan khusus di kelas ini periode ini."
                              />
                            )}
                          </section>
                        </div>

                        {/* Baris 3: dua kolom indikator */}
                        <div className={styles.detail2col}>
                          <section>
                            <p className={styles.dialogSectionTitle}>⭐ Top 5 indikator terbaik</p>
                            <ScoreBarList items={indTerbaik} emptyText="Belum ada data indikator." />
                          </section>
                          <section>
                            <p className={styles.dialogSectionTitle}>🔧 Top 5 indikator perlu penguatan</p>
                            {indLemah.length > 0 ? (
                              <ScoreBarList items={indLemah} />
                            ) : (
                              <GoodEmptyState
                                title="Semua indikator sudah di atas 80%"
                                text="Tidak ada indikator di bawah 80% di kelas ini periode ini."
                              />
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
          <h2 className={styles.megaCategoryTitle}>Perkembangan Citra Sekolah di Mata Orang Tua</h2>
          <p className={styles.megaCategorySub}>
            Sinyal dari rumah tentang bagaimana karakter anak terlihat di luar sekolah, dan langkah
            sekolah-wide yang mengikutinya untuk memperkuat kepercayaan orang tua.
          </p>
        </div>

        <section className={styles.section}>
          <SectionHeading
            icon={SECTION_ICON.suaraOrtu}
            eyebrow="Sinyal dari luar sekolah"
            title="Suara Orang Tua"
            subtitle="Ini bukan testimoni, ini sinyal dari lingkungan rumah tentang bagaimana karakter anak terlihat di luar sekolah. Kalau banyak orang tua menyebut hal yang sama, itu sinyal kuat untuk sekolah, bukan sekadar kumpulan pendapat pribadi."
          />
          <ParentVoiceBento pernyataan={pernyataan} aspek={aspek} sekolahId={session.school_id} periodeId={periode} />
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
            layanan, sebagian menyasar citra sekolah di mata orang tua; yang perlu perhatian
            didahulukan, lalu yang tinggal dipertahankan. Tiap kartu bisa dibuka dan dibagikan ke WhatsApp.
          </p>
        </div>

        <section className={styles.section}>
          {kebijakanIsSample && (
            <p className={styles.sampleNote}>
              <SampleTag /> Isi rekomendasi masih contoh, menunggu perumusan otomatis. Strukturnya sudah final.
            </p>
          )}
          <KebijakanGoals data={kebijakanData} />
        </section>
      </div>
      )}

      {selectedJenjangDialog && (
        <DetailDialog
          icon={SECTION_ICON.jenjang}
          eyebrow="Detail Jenjang"
          title={selectedJenjangDialog.scope_id}
          subtitle={`Rata-rata karakter ${persen(avgAspek(selectedJenjangDialog.ringkasan, aspek, "rata_input_guru_"))} (guru) · ${persen(avgAspek(selectedJenjangDialog.ringkasan, aspek, "rata_input_orangtua_"))} (orang tua)`}
          onClose={() => setSelectedJenjangDialog(null)}
        >
          <section>
            <p className={styles.dialogSectionTitle}>Skor per aspek (dinilai guru)</p>
            <AspekBarList
              aspek={aspek}
              skorByAspek={Object.fromEntries(
                aspek.map((a) => [a.aspek_kode, ringkasanAspekValue(selectedJenjangDialog.ringkasan, a.aspek_kode, "rata_input_guru_")])
              )}
            />
          </section>
        </DetailDialog>
      )}
    </div>
  );
}

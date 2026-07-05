import { useMemo, useState } from "react";
import SectionHeading from "../../components/SectionHeading";
import SampleTag from "../../components/SampleTag";
import {
  KarakterStateBox, AskMascot, ScoreBarList, GoodEmptyState,
  ParentVoiceBento, TrendChart, useSummaryTrend, useMuridTrend,
} from "./KarakterShared";
import { StatCardMini, StatCardLandscape, AllGoodBanner, splitByClassify, scrollToId } from "./KarakterViewParts";
import KebijakanGoals from "./KebijakanGoals";
import { KEBIJAKAN_WALIKELAS } from "./dummyKebijakan";
import { useKarakterWaliKelas } from "./useKarakterData";
import {
  pct, deltaVsPrevious, classifyPencapaian, periodeLabel, aspekIcon,
  extractPlainText, isBlankEssay, matchedCategoryTags, isKebijakanReady, SECTION_ICON,
} from "./karakterMeta";
import styles from "./KarakterViews.module.css";

const WHO_WALIKELAS = { short: "untuk Wali Kelas", long: "untuk Wali Kelas & Kepala Sekolah" };

/** Tren rata-rata satu anak antar periode; dipisah jadi komponen supaya hook-nya per murid terpilih. */
function MuridTrendBlock({ sekolahId, muridId }) {
  const { points } = useMuridTrend(sekolahId, muridId);
  return <TrendChart points={points} />;
}

export default function WaliKelasView({ session, periodeId }) {
  const { loading, error, data } = useKarakterWaliKelas(session, periodeId);
  const kelasList = Array.isArray(session.cakupan) ? session.cakupan.filter(Boolean) : [];
  const { points: trendPoints } = useSummaryTrend({
    sekolahId: session.school_id, scope: "kelas", scopeId: kelasList,
  });
  const [activeCategory, setActiveCategory] = useState("kualitas");
  const [muridTab, setMuridTab] = useState("semua");
  const [filterKelas, setFilterKelas] = useState(null);
  const [selectedMuridId, setSelectedMuridId] = useState(null);

  // Listing progres seluruh murid: gabungkan skor per aspek jadi satu baris per anak.
  const muridList = useMemo(() => {
    if (!data) return [];
    const byMurid = {};
    data.skor.forEach((r) => {
      if (!byMurid[r.murid_id]) {
        byMurid[r.murid_id] = { murid_id: r.murid_id, nama: r.nama_murid, kelas_id: r.kelas_id, skorByAspek: {}, sum: 0, n: 0 };
      }
      byMurid[r.murid_id].skorByAspek[r.aspek_kode] = r.skor;
      if (r.skor != null) { byMurid[r.murid_id].sum += r.skor; byMurid[r.murid_id].n += 1; }
    });
    return Object.values(byMurid)
      .map((m) => ({ ...m, rata: m.n ? Math.round(m.sum / m.n) : null }))
      .sort((a, b) => (b.rata ?? -1) - (a.rata ?? -1));
  }, [data]);

  if (loading || error) return <KarakterStateBox loading={loading} error={error} />;

  const { periode, aspek, indikator, summary, skorIndikator, pernyataan, tindakLanjut } = data;

  // Baris nyata (sudah disetujui) kalau ada, fallback ke contoh sampai Gemini mengisi tabelnya.
  const kebijakanReal = (tindakLanjut || []).filter(isKebijakanReady);
  const kebijakanData = kebijakanReal.length > 0 ? kebijakanReal : KEBIJAKAN_WALIKELAS;
  const kebijakanIsSample = kebijakanReal.length === 0;

  const indikatorLabel = Object.fromEntries(
    indikator.map((it) => [`${it.aspek_kode}_${it.indikator_kode}`, it.indikator_label])
  );

  // Rata-rata kelas resmi dari ringkasan (bukan hitung ulang); multi-kelas dirata-ratakan.
  const kelasRataVals = summary.map((r) => pct(r.ringkasan?.rata_rata_pencapaian_guru)).filter((v) => v != null);
  const rataKelas = kelasRataVals.length
    ? Math.round(kelasRataVals.reduce((s, v) => s + v, 0) / kelasRataVals.length)
    : null;
  const heroDelta = deltaVsPrevious(trendPoints);

  const muridSplitAll = splitByClassify(muridList, (m) => m.rata);
  const muridTerbaik = muridList[0] || null;
  const muridPerhatianCount = muridSplitAll.perhatian.length;

  // Filter kelas hanya relevan kalau wali kelas memegang lebih dari satu kelas.
  const muridFiltered = filterKelas ? muridList.filter((m) => m.kelas_id === filterKelas) : muridList;
  const muridSplit = splitByClassify(muridFiltered, (m) => m.rata);
  const muridTabRows =
    muridTab === "baik" ? muridSplit.baik :
    muridTab === "perhatian" ? muridSplit.perhatian :
    muridFiltered;
  const activeMurid = muridTabRows.find((m) => m.murid_id === selectedMuridId) || muridTabRows[0] || null;

  // Detail per anak: refleksi orang tuanya + skor indikator.
  const activeRefleksi = activeMurid ? pernyataan.find((p) => p.murid_id === activeMurid.murid_id) || null : null;
  const activeIndikator = activeMurid
    ? skorIndikator
        .filter((r) => r.murid_id === activeMurid.murid_id)
        .map((r) => ({
          label: indikatorLabel[`${r.aspek_kode}_${r.indikator_kode}`] || r.indikator_kode,
          value: pct(r.skor),
        }))
        .filter((r) => r.value != null)
    : [];
  const indTerbaik = [...activeIndikator].sort((a, b) => b.value - a.value).slice(0, 5);
  const indLemah = activeIndikator.filter((r) => r.value < 80).sort((a, b) => a.value - b.value).slice(0, 5);

  const aspekItems = activeMurid
    ? aspek.map((a) => ({
        label: a.aspek_label, icon: aspekIcon(a.aspek_label),
        value: pct(activeMurid.skorByAspek[a.aspek_kode]),
      }))
    : [];

  const quoteText = activeRefleksi ? extractPlainText(activeRefleksi.pernyataan) : "";
  const showQuote = activeRefleksi && !isBlankEssay(activeRefleksi.pernyataan);
  const quoteTags = activeRefleksi ? matchedCategoryTags(activeRefleksi.kategori_pernyataan) : [];

  return (
    <div className={`${styles.page} ${styles.pageFullBleed}`}>
      <AskMascot activeCategory={activeCategory} onSelect={setActiveCategory} />

      {/* ── Kategori 1: Perkembangan Kualitas dan Mutu Layanan Pendidikan (scope: kelas) ── */}
      {activeCategory === "kualitas" && (
      <div className={styles.megaCategory}>
        <div className={styles.megaCategoryHeader}>
          <h2 className={styles.megaCategoryTitle}>Perkembangan Kualitas dan Mutu Layanan Pendidikan</h2>
          <p className={styles.megaCategorySub}>
            Bagaimana perkembangan karakter anak-anak di kelas {kelasList.join(", ")}: siapa yang sudah
            baik, siapa yang butuh dukungan tambahan, dan langkah konkret yang mengikutinya.
          </p>
        </div>

        <section className={styles.section}>
          <SectionHeading
            icon={SECTION_ICON.tren}
            eyebrow="Perjalanan kelas · kenapa ini penting"
            title="Rata-Rata Perkembangan dan Peta Siswa"
            subtitle="Angka ini bukan rapor akhir, ini titik sekarang yang terus dipantau tiap bulan. Satu bulan turun bukan berarti mundur, yang penting arah beberapa bulan terakhir."
          />
          <div className={styles.statHeroRow}>
            <StatCardMini
              icon="📈" label="Rata-rata Perkembangan Karakter Kelas"
              value={rataKelas != null ? rataKelas : "—"} unit={rataKelas != null ? "%" : ""}
              sub={heroDelta
                ? `${heroDelta.direction === "up" ? "↑" : heroDelta.direction === "down" ? "↓" : "→"} ${heroDelta.value > 0 ? "+" : ""}${heroDelta.value}pp dari bulan lalu`
                : `Periode ${periodeLabel(periode) || "ini"}`}
              subTone={heroDelta ? (heroDelta.direction === "up" ? "aman" : heroDelta.direction === "down" ? "perhatian" : "default") : "default"}
            >
              <TrendChart
                points={trendPoints}
                aspek={kelasList.length === 1 ? aspek : undefined}
                aspekPrefix="input_guru_"
              />
            </StatCardMini>

            <div className={styles.statHeroSide}>
              <StatCardLandscape
                icon="👥" label="Siswa Terpetakan" value={muridList.length}
                sub={`${muridSplitAll.baik.length} sudah baik · ${muridSplitAll.perhatian.length} perlu perhatian`}
                onClick={() => scrollToId("siswa-detail")}
              />
              <StatCardLandscape
                icon="🏆" label="Siswa Terbaik" value={muridTerbaik?.nama ?? "—"}
                sub={muridTerbaik?.rata != null ? `Perkembangan karakter ${muridTerbaik.rata}%` : "Belum ada data"}
                onClick={muridTerbaik ? () => {
                  setMuridTab("baik");
                  setSelectedMuridId(muridTerbaik.murid_id);
                  scrollToId("siswa-detail");
                } : undefined}
              />
              <StatCardLandscape
                icon="🌱" tone="perhatian" label="Perlu Perhatian"
                value={muridPerhatianCount > 0 ? `${muridPerhatianCount} siswa` : "—"}
                sub={muridPerhatianCount > 0 ? "Di bawah 80%, butuh dukungan sekarang" : "Semua siswa sudah baik"}
                subTone="perhatian"
                onClick={muridPerhatianCount > 0 ? () => {
                  setMuridTab("perhatian");
                  setSelectedMuridId(null);
                  scrollToId("siswa-detail");
                } : undefined}
              />
            </div>
          </div>
        </section>

        <section className={styles.section} id="siswa-detail">
          <SectionHeading
            icon={SECTION_ICON.skorSiswa}
            eyebrow="Siswa mana yang perlu perhatian"
            title="Siswa: Sudah Baik vs Perlu Perhatian"
            subtitle="Siswa yang perlu perhatian bukan siswa yang lemah; butuh dukungan tambahan sekarang, bisa berubah periode berikutnya. Klik satu nama untuk melihat progres per anak."
          />
          {muridSplit.allGood && <div style={{ marginBottom: 14 }}><AllGoodBanner subject="siswa" /></div>}
          {muridFiltered.length === 0 ? (
            <p className={styles.emptyNote}>Belum ada data siswa pada periode ini.</p>
          ) : (
            <div className={styles.masterDetail}>
              <div className={styles.masterList}>
                {kelasList.length > 1 && (
                  <div className={styles.masterListFilter}>
                    <span className={styles.filterActiveBadge}>Filter aktif ({filterKelas ? 1 : 0})</span>
                    <select
                      className={styles.filterSelect}
                      value={filterKelas || ""}
                      onChange={(e) => setFilterKelas(e.target.value || null)}
                    >
                      <option value="">Semua Kelas</option>
                      {kelasList.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                )}
                <div className={styles.masterListTabs}>
                  <button type="button" className={`${styles.masterListTab} ${muridTab === "semua" ? styles.masterListTabActive : ""}`} onClick={() => setMuridTab("semua")}>
                    Semua ({muridFiltered.length})
                  </button>
                  <button type="button" className={`${styles.masterListTab} ${muridTab === "baik" ? styles.masterListTabActive : ""}`} onClick={() => setMuridTab("baik")}>
                    Sudah Baik ({muridSplit.baik.length})
                  </button>
                  <button type="button" className={`${styles.masterListTab} ${muridTab === "perhatian" ? styles.masterListTabActive : ""}`} onClick={() => setMuridTab("perhatian")}>
                    Perlu Perhatian ({muridSplit.perhatian.length})
                  </button>
                </div>
                <div className={styles.masterListRows}>
                  {muridTabRows.length === 0 ? (
                    <p className={styles.emptyNote}>Tidak ada siswa di kategori ini.</p>
                  ) : muridTabRows.map((m) => {
                    const tone = classifyPencapaian(m.rata);
                    const active = activeMurid?.murid_id === m.murid_id;
                    return (
                      <button
                        type="button" key={m.murid_id}
                        className={`${styles.masterListRow} ${active ? styles.masterListRowActive : ""}`}
                        onClick={() => setSelectedMuridId(m.murid_id)}
                      >
                        <span className={styles.masterListAvatar}>{(m.nama || "?").charAt(0).toUpperCase()}</span>
                        <span className={styles.masterListName}>{m.nama}</span>
                        <span className={`${styles.masterListTone} ${tone === "baik" ? styles.tonePillAman : tone === "perlu_perhatian" ? styles.tonePillPerhatian : styles.tonePillDefault}`}>
                          {tone === "baik" ? "Sudah Baik" : tone === "perlu_perhatian" ? "Perlu Perhatian" : "Belum ada data"}
                        </span>
                        <span className={styles.masterListScore}>{m.rata != null ? `${m.rata}%` : "—"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.masterDetailPanel}>
                {activeMurid ? (
                  <>
                    <div className={styles.masterDetailHeader}>
                      <span className={styles.eyebrow}>Progres per Anak</span>
                      <h3 className={styles.masterDetailTitle}>{activeMurid.nama}</h3>
                      <p className={styles.cardSub}>
                        {activeMurid.kelas_id} · rata-rata perkembangan {activeMurid.rata != null ? `${activeMurid.rata}%` : "—"}
                      </p>
                    </div>

                    <div className={styles.detailRows}>
                      {/* Baris 1: progres anak antar bulan */}
                      <section>
                        <p className={styles.dialogSectionTitle}>📈 Progres antar bulan</p>
                        <MuridTrendBlock sekolahId={session.school_id} muridId={activeMurid.murid_id} />
                      </section>

                      {/* Baris 2: skor per aspek, urut tertinggi */}
                      <section>
                        <p className={styles.dialogSectionTitle}>📊 Skor per aspek (urut tertinggi)</p>
                        <ScoreBarList items={aspekItems} emptyText="Belum ada skor aspek untuk anak ini." />
                      </section>

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
                              text="Tidak ada indikator di bawah 80% untuk anak ini periode ini."
                            />
                          )}
                        </section>
                      </div>

                      {/* Baris 4: suara orang tuanya sendiri */}
                      <section>
                        <p className={styles.dialogSectionTitle}>💬 Refleksi orang tua anak ini</p>
                        {showQuote ? (
                          <>
                            {quoteTags.length > 0 && (
                              <div className={styles.quoteTagsRow}>
                                {quoteTags.map((t) => <span key={t.label} className={styles.quoteTagChip}>{t.icon} {t.label}</span>)}
                              </div>
                            )}
                            <p className={styles.detailQuote}>“{quoteText}”</p>
                          </>
                        ) : (
                          <p className={styles.emptyNote}>Orang tua anak ini belum menulis refleksi pada periode ini.</p>
                        )}
                      </section>
                    </div>
                  </>
                ) : (
                  <p className={styles.emptyNote}>Pilih siswa di daftar sebelah kiri.</p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
      )}

      {/* ── Kategori 2: Perkembangan Citra Sekolah di Mata Orang Tua (scope: orang tua kelas ini) ── */}
      {activeCategory === "citra" && (
      <div className={`${styles.megaCategory} ${styles.megaCategoryB}`}>
        <div className={styles.megaCategoryHeader}>
          <h2 className={styles.megaCategoryTitle}>Perkembangan Citra Sekolah di Mata Orang Tua</h2>
          <p className={styles.megaCategorySub}>
            Sinyal dari rumah tentang bagaimana karakter anak-anak kelas {kelasList.join(", ")} terlihat
            di luar sekolah, langsung dari refleksi orang tuanya.
          </p>
        </div>

        <section className={styles.section}>
          <SectionHeading
            icon={SECTION_ICON.suaraOrtu}
            eyebrow="Sinyal dari luar sekolah"
            title="Suara Orang Tua"
            subtitle="Ini bukan testimoni, ini sinyal dari lingkungan rumah tentang bagaimana karakter anak terlihat di luar sekolah. Kalau banyak orang tua menyebut hal yang sama, itu sinyal kuat untuk kelas."
          />
          <ParentVoiceBento pernyataan={pernyataan} aspek={aspek} sekolahId={session.school_id} periodeId={periode} />
        </section>
      </div>
      )}

      {/* ── Kategori 3: Tindak Lanjut Kelas di Periode Ini ── */}
      {activeCategory === "tindaklanjut" && (
      <div className={styles.megaCategory}>
        <div className={styles.megaCategoryHeader}>
          <h2 className={styles.megaCategoryTitle}>Tindak Lanjut Kelas di Periode Ini</h2>
          <p className={styles.megaCategorySub}>
            Dari Fammi berdasarkan data kelas periode ini, bukan keputusan final. Sebagian menyasar
            mutu pembinaan di kelas, sebagian menyasar hubungan dengan orang tua; yang perlu perhatian
            didahulukan. Tiap kartu bisa dibuka dan dibagikan ke WhatsApp.
          </p>
        </div>

        <section className={styles.section}>
          {kebijakanIsSample && (
            <p className={styles.sampleNote}>
              <SampleTag /> Isi rekomendasi masih contoh, menunggu perumusan otomatis. Strukturnya sudah final.
            </p>
          )}
          <KebijakanGoals data={kebijakanData} who={WHO_WALIKELAS} />
        </section>
      </div>
      )}
    </div>
  );
}

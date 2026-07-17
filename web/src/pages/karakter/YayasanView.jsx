import { useMemo, useState } from "react";
import SectionHeading from "../../components/SectionHeading";
import SampleTag from "../../components/SampleTag";
import FollowupRibbon from "../../components/FollowupRibbon";
import {
  KarakterStateBox, AskMascot, ScoreBarList, GoodEmptyState, Donut,
  ParentVoiceBento, TrendChart, useSummaryTrend,
} from "./KarakterShared";
import { StatCardMini, StatCardLandscape, AllGoodBanner, splitByClassify, scrollToId } from "./KarakterViewParts";
import KebijakanGoals from "./KebijakanGoals";
import { KEBIJAKAN_YAYASAN } from "./dummyKebijakan";
import { useKarakterYayasan } from "./useKarakterData";
import {
  pct, deltaVsPrevious, classifyPencapaian, periodeLabel, aspekIcon,
  avgAspek, ringkasanAspekValue, isKebijakanReady, SECTION_ICON,
} from "./karakterMeta";
import { KARAKTER_BAR_TONE_CUTOFF } from "../../lib/cutoffs";
import styles from "./KarakterViews.module.css";

const WHO_YAYASAN = { short: "untuk Pengurus Yayasan", long: "untuk Yayasan" };
// Yayasan: short 6 bulan, long 12 bulan (skalanya kebijakan lintas sekolah, bukan aksi harian).
const RANGES_YAYASAN = { short: "6 Bulan ke Depan", long: "12 Bulan ke Depan" };

export default function YayasanView({ session, periodeId }) {
  const { loading, error, data } = useKarakterYayasan(session, periodeId);
  const [activeCategory, setActiveCategory] = useState("kualitas");
  const [sekolahTab, setSekolahTab] = useState("semua");
  const [selectedSekolahId, setSelectedSekolahId] = useState(null);

  // Satu baris per sekolah: identitas + ringkasan resmi periode berjalan.
  const sekolahRows = useMemo(() => {
    if (!data) return [];
    const ringkasanById = Object.fromEntries((data.summary || []).map((r) => [r.sekolah_id, r.ringkasan]));
    return (data.sekolahList || [])
      .map((s) => {
        const rk = ringkasanById[s.id] || null;
        return { id: s.id, nama: s.nama, ringkasan: rk, rata: pct(rk?.rata_pencapaian_guru ?? rk?.pencapaian_guru) };
      })
      .sort((a, b) => (b.rata ?? -1) - (a.rata ?? -1));
  }, [data]);

  const sekolahIds = useMemo(() => sekolahRows.map((s) => s.id), [sekolahRows]);
  const { points: trendPoints } = useSummaryTrend({
    sekolahId: sekolahIds.length ? sekolahIds : null,
    scope: "sekolah",
    scopeId: sekolahIds.length ? sekolahIds : null,
  });

  if (loading || error) return <KarakterStateBox loading={loading} error={error} />;

  const { periode, aspekBySekolah, indikatorBySekolah, pernyataan, tindakLanjut } = data;

  // Baris nyata (sudah disetujui) kalau ada, fallback ke contoh sampai Gemini mengisi tabelnya.
  // kebijakanLegacy: sudah disetujui tapi berskema lama (belum lolos isKebijakanReady) --
  // dulu hilang sama sekali (tertimpa sample), sekarang tetap tampil sebagai kartu sederhana.
  const kebijakanReal = (tindakLanjut || []).filter(isKebijakanReady);
  const kebijakanLegacy = (tindakLanjut || []).filter((r) => !isKebijakanReady(r));
  const kebijakanData = kebijakanReal.length > 0 ? kebijakanReal : KEBIJAKAN_YAYASAN;
  const kebijakanIsSample = kebijakanReal.length === 0 && kebijakanLegacy.length === 0;
  const showKebijakanGoals = kebijakanReal.length > 0 || kebijakanIsSample;
  const singleSekolah = sekolahRows.length === 1 ? sekolahRows[0] : null;

  const rataVals = sekolahRows.map((s) => s.rata).filter((v) => v != null);
  const rataYayasan = rataVals.length ? Math.round(rataVals.reduce((a, b) => a + b, 0) / rataVals.length) : null;
  const heroDelta = deltaVsPrevious(trendPoints);

  const sekolahSplitAll = splitByClassify(sekolahRows, (s) => s.rata);
  const sekolahTerkuat = sekolahRows[0] || null;
  const sekolahPerhatian = sekolahSplitAll.perhatian[0] || null;

  const sekolahSplit = splitByClassify(sekolahRows, (s) => s.rata);
  const sekolahTabRows =
    sekolahTab === "baik" ? sekolahSplit.baik :
    sekolahTab === "perhatian" ? sekolahSplit.perhatian :
    sekolahRows;
  const activeSekolah = sekolahTabRows.find((s) => s.id === selectedSekolahId) || sekolahTabRows[0] || null;

  const activeAspek = activeSekolah ? (aspekBySekolah[activeSekolah.id] || []) : [];
  // ringkasan sekolah memakai prefix rata_input_guru_ (bukan input_guru_ milik kelas)
  const activeAspekItems = activeAspek.map((a) => ({
    label: a.aspek_label, icon: aspekIcon(a.aspek_label),
    value: ringkasanAspekValue(activeSekolah?.ringkasan, a.aspek_kode, "rata_input_guru_"),
  }));
  const guruAch = activeSekolah ? avgAspek(activeSekolah.ringkasan, activeAspek, "rata_input_guru_") : null;
  const ortuAch = activeSekolah ? avgAspek(activeSekolah.ringkasan, activeAspek, "rata_input_orangtua_") : null;
  // Indikator diagregat dari skor murid tiap sekolah (bukan dari summary sekolah yang tak punya top5 indikator).
  const activeIndikator = activeSekolah ? (indikatorBySekolah[activeSekolah.id] || []) : [];
  const adaIndikator = activeIndikator.length > 0;
  const indTerbaik = [...activeIndikator].sort((a, b) => b.value - a.value).slice(0, 5);
  const indLemah = activeIndikator.filter((it) => it.value < KARAKTER_BAR_TONE_CUTOFF.aman).sort((a, b) => a.value - b.value).slice(0, 5);

  return (
    <div className={`${styles.page} ${styles.pageFullBleed}`}>
      <AskMascot activeCategory={activeCategory} onSelect={setActiveCategory} />

      {/* ── Kategori 1: Perkembangan Kualitas dan Mutu Layanan Pendidikan (lintas sekolah) ── */}
      {activeCategory === "kualitas" && (
      <div className={styles.megaCategory}>
        <div className={styles.megaCategoryHeader}>
          <h2 className={styles.megaCategoryTitle}>Perkembangan Kualitas dan Mutu Layanan Pendidikan</h2>
          <p className={styles.megaCategorySub}>
            Bagaimana perkembangan karakter anak di tiap sekolah di bawah yayasan: sekolah mana yang
            sudah baik, mana yang butuh dukungan tambahan, dan langkah konkret yang mengikutinya.
          </p>
        </div>

        <section className={styles.section}>
          <SectionHeading
            icon={SECTION_ICON.tren}
            eyebrow="Perjalanan yayasan · kenapa ini penting"
            title="Rata-Rata Perkembangan dan Peta Sekolah"
            subtitle="Angka ini bukan rapor akhir, ini titik sekarang yang terus dipantau tiap bulan. Satu bulan turun bukan berarti mundur, yang penting arah beberapa bulan terakhir."
          />
          <div className={styles.statHeroRow}>
            <StatCardMini
              icon="📈" label="Rata-rata Perkembangan Karakter Yayasan"
              value={rataYayasan != null ? rataYayasan : "—"} unit={rataYayasan != null ? "%" : ""}
              sub={heroDelta
                ? `${heroDelta.direction === "up" ? "↑" : heroDelta.direction === "down" ? "↓" : "→"} ${heroDelta.value > 0 ? "+" : ""}${heroDelta.value}pp dari bulan lalu`
                : `Periode ${periodeLabel(periode) || "ini"}`}
              subTone={heroDelta ? (heroDelta.direction === "up" ? "aman" : heroDelta.direction === "down" ? "perhatian" : "default") : "default"}
            >
              <TrendChart
                points={trendPoints}
                aspek={singleSekolah ? (aspekBySekolah[singleSekolah.id] || undefined) : undefined}
                aspekPrefix="rata_input_guru_"
              />
            </StatCardMini>

            <div className={styles.statHeroSide}>
              <StatCardLandscape
                icon="🏫" label="Sekolah Dipetakan" value={sekolahRows.length}
                sub={`${sekolahSplitAll.baik.length} sudah baik · ${sekolahSplitAll.perhatian.length} perlu perhatian`}
                onClick={() => scrollToId("sekolah-detail")}
              />
              <StatCardLandscape
                icon="🌟" label="Sekolah Terkuat" value={sekolahTerkuat?.nama ?? "—"}
                sub={sekolahTerkuat?.rata != null ? `Perkembangan karakter ${sekolahTerkuat.rata}%` : "Belum ada data"}
                onClick={sekolahTerkuat ? () => {
                  setSekolahTab("baik");
                  setSelectedSekolahId(sekolahTerkuat.id);
                  scrollToId("sekolah-detail");
                } : undefined}
              />
              <StatCardLandscape
                icon="🌱" tone="perhatian" label="Perlu Perhatian"
                value={sekolahPerhatian?.nama ?? "—"}
                sub={sekolahPerhatian
                  ? `Perkembangan karakter ${sekolahPerhatian.rata}%`
                  : "Semua sekolah sudah baik"}
                subTone="perhatian"
                onClick={sekolahPerhatian ? () => {
                  setSekolahTab("perhatian");
                  setSelectedSekolahId(sekolahPerhatian.id);
                  scrollToId("sekolah-detail");
                } : undefined}
              />
            </div>
          </div>
        </section>

        <section className={styles.section} id="sekolah-detail">
          <SectionHeading
            icon={SECTION_ICON.perbandinganSekolah}
            eyebrow="Sekolah mana yang perlu perhatian"
            title="Sekolah: Sudah Baik vs Perlu Perhatian"
            subtitle="Sekolah yang sudah baik layak dipertahankan, bukan titik berhenti. Sekolah yang perlu perhatian butuh dukungan yayasan sekarang, bisa berubah periode berikutnya."
          />
          {sekolahSplit.allGood && <div style={{ marginBottom: 14 }}><AllGoodBanner subject="sekolah" /></div>}
          {sekolahRows.length === 0 ? (
            <p className={styles.emptyNote}>Belum ada sekolah dengan data Rapor Karakter pada periode ini.</p>
          ) : (
            <div className={styles.masterDetail}>
              <div className={styles.masterList}>
                <div className={styles.masterListTabs}>
                  <button type="button" className={`${styles.masterListTab} ${sekolahTab === "semua" ? styles.masterListTabActive : ""}`} onClick={() => setSekolahTab("semua")}>
                    Semua ({sekolahRows.length})
                  </button>
                  <button type="button" className={`${styles.masterListTab} ${sekolahTab === "baik" ? styles.masterListTabActive : ""}`} onClick={() => setSekolahTab("baik")}>
                    Sudah Baik ({sekolahSplit.baik.length})
                  </button>
                  <button type="button" className={`${styles.masterListTab} ${sekolahTab === "perhatian" ? styles.masterListTabActive : ""}`} onClick={() => setSekolahTab("perhatian")}>
                    Perlu Perhatian ({sekolahSplit.perhatian.length})
                  </button>
                </div>
                <div className={styles.masterListRows}>
                  {sekolahTabRows.length === 0 ? (
                    <p className={styles.emptyNote}>Tidak ada sekolah di kategori ini.</p>
                  ) : sekolahTabRows.map((s) => {
                    const tone = classifyPencapaian(s.rata);
                    const active = activeSekolah?.id === s.id;
                    return (
                      <button
                        type="button" key={s.id}
                        className={`${styles.masterListRow} ${active ? styles.masterListRowActive : ""}`}
                        onClick={() => setSelectedSekolahId(s.id)}
                      >
                        <span className={styles.masterListAvatar}>🏫</span>
                        <span className={styles.masterListName}>{s.nama}</span>
                        <span className={`${styles.masterListTone} ${tone === "baik" ? styles.tonePillAman : tone === "perlu_perhatian" ? styles.tonePillPerhatian : styles.tonePillDefault}`}>
                          {tone === "baik" ? "Sudah Baik" : tone === "perlu_perhatian" ? "Perlu Perhatian" : "Belum ada data"}
                        </span>
                        <span className={styles.masterListScore}>{s.rata != null ? `${s.rata}%` : "—"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.masterDetailPanel}>
                {activeSekolah ? (
                  <>
                    <div className={styles.masterDetailHeader}>
                      <span className={styles.eyebrow}>Detail Sekolah</span>
                      <h3 className={styles.masterDetailTitle}>{activeSekolah.nama}</h3>
                      <p className={styles.cardSub}>
                        Rata-rata perkembangan karakter {activeSekolah.rata != null ? `${activeSekolah.rata}%` : "—"}
                      </p>
                    </div>

                    <div className={styles.detailRows}>
                      {/* Baris 1: dua sisi penilaian */}
                      <section>
                        <p className={styles.dialogSectionTitle}>🧭 Dua sisi penilaian</p>
                        <div className={styles.detail2col}>
                          <Donut value={guruAch} label="Rata-rata karakter (guru)" />
                          <Donut value={ortuAch} label="Rata-rata karakter (orang tua)" />
                        </div>
                      </section>

                      {/* Baris 2: skor per aspek, urut tertinggi */}
                      <section>
                        <p className={styles.dialogSectionTitle}>📊 Skor per aspek (urut tertinggi)</p>
                        <ScoreBarList items={activeAspekItems} emptyText="Konfigurasi aspek/skor belum tersedia untuk sekolah ini." />
                      </section>

                      {/* Baris 3: dua kolom indikator */}
                      <div className={styles.detail2col}>
                        <section>
                          <p className={styles.dialogSectionTitle}>⭐ Top 5 indikator terbaik</p>
                          <ScoreBarList items={indTerbaik} emptyText="Belum ada data indikator level sekolah." />
                        </section>
                        <section>
                          <p className={styles.dialogSectionTitle}>🔧 Top 5 indikator perlu penguatan</p>
                          {indLemah.length > 0 ? (
                            <ScoreBarList items={indLemah} />
                          ) : adaIndikator ? (
                            <GoodEmptyState
                              title="Semua indikator sudah di atas 80%"
                              text="Tidak ada indikator di bawah 80% di sekolah ini periode ini."
                            />
                          ) : (
                            <p className={styles.emptyNote}>Belum ada data indikator level sekolah.</p>
                          )}
                        </section>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className={styles.emptyNote}>Pilih sekolah di daftar sebelah kiri.</p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
      )}

      {/* ── Kategori 2: Perkembangan Citra Sekolah di Mata Orang Tua (lintas sekolah) ── */}
      {activeCategory === "citra" && (
      <div className={`${styles.megaCategory} ${styles.megaCategoryB}`}>
        <div className={styles.megaCategoryHeader}>
          <h2 className={styles.megaCategoryTitle}>Perkembangan Citra Sekolah di Mata Orang Tua</h2>
          <p className={styles.megaCategorySub}>
            Sinyal dari rumah lintas sekolah yayasan: bagaimana karakter anak terlihat di luar sekolah,
            dan kepercayaan seperti apa yang sedang terbentuk di mata orang tua.
          </p>
        </div>

        <section className={styles.section}>
          <SectionHeading
            icon={SECTION_ICON.suaraOrtu}
            eyebrow="Sinyal dari luar sekolah"
            title="Suara Orang Tua"
            subtitle="Ini bukan testimoni, ini sinyal dari lingkungan rumah. Kalau banyak orang tua lintas sekolah menyebut hal yang sama, itu sinyal kuat untuk yayasan. Saring per sekolah untuk fokus ke satu sekolah."
          />
          <ParentVoiceBento
            pernyataan={pernyataan}
            aspekBySekolah={aspekBySekolah}
            sekolahOptions={sekolahRows.map((s) => ({ id: s.id, nama: s.nama }))}
            periodeId={periode}
          />
        </section>
      </div>
      )}

      {/* ── Kategori 3: Tindak Lanjut Yayasan di Periode Ini ── */}
      {activeCategory === "tindaklanjut" && (
      <div className={styles.megaCategory}>
        <div className={styles.megaCategoryHeader}>
          <h2 className={styles.megaCategoryTitle}>Tindak Lanjut Yayasan di Periode Ini</h2>
          <p className={styles.megaCategorySub}>
            Dari Fammi berdasarkan data lintas sekolah periode ini, bukan keputusan final. Sebagian
            menyasar mutu pembinaan, sebagian menyasar citra yayasan di mata orang tua; yang perlu
            perhatian didahulukan. Tiap kartu bisa dibuka dan dibagikan ke WhatsApp.
          </p>
        </div>

        <section className={styles.section}>
          {kebijakanIsSample && (
            <p className={styles.sampleNote}>
              <SampleTag /> Isi rekomendasi masih contoh, menunggu perumusan otomatis. Strukturnya sudah final.
            </p>
          )}
          {showKebijakanGoals && <KebijakanGoals data={kebijakanData} who={WHO_YAYASAN} ranges={RANGES_YAYASAN} />}
          {kebijakanLegacy.length > 0 && (
            <FollowupRibbon
              items={kebijakanLegacy.map((r) => ({ id: r.id, action: r.action, trigger: r.trigger_desc, module: "karakter", priority: r.priority }))}
            />
          )}
        </section>
      </div>
      )}
    </div>
  );
}

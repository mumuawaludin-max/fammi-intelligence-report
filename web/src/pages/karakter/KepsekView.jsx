import { useEffect, useState } from "react";
import SectionHeading from "../../components/SectionHeading";
import {
  KarakterStateBox, BriefingOrEmpty, AspekRadarCard, AspekBarList,
  ParentVoiceBento, TindakLanjutDetailBody, TrendChart, useSummaryTrend,
} from "./KarakterShared";
import TindakLanjutGrouped from "./TindakLanjutGrouped";
import DetailDialog from "./DetailDialog";
import { useKarakterKepsek } from "./useKarakterData";
import {
  pct, ringkasanAspekValue, parseTop5Pair, parseTop5Indikator, deltaVsPrevious,
  classifyPencapaian, periodeLabel, SECTION_ICON,
} from "./karakterMeta";
import styles from "./KarakterViews.module.css";

function JenjangTable({ rows, onSelect }) {
  if (!rows.length) return null;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Jenjang</th>
            <th className={styles.thCenter}>Pencapaian Guru</th>
            <th className={styles.thCenter}>Pencapaian Orang Tua</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.scope_id} className={styles.rowClickable} onClick={() => onSelect(r)}>
              <td className={styles.tdNama}>{r.scope_id} <span className={styles.rowArrow}>›</span></td>
              <td className={styles.tdCenter}>{r.ringkasan?.pencapaian_guru ?? "—"}</td>
              <td className={styles.tdCenter}>{r.ringkasan?.pencapaian_orangtua ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Kartu statistik mandiri (ikon + angka + delta/subteks + satu visual kecil), satu kartu satu cerita. */
function StatCardMini({ icon, tone = "default", label, value, unit, sub, subTone, children, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`${styles.statCardMini} ${tone !== "default" ? styles.statCardMiniPerhatian : ""} ${onClick ? styles.statCardMiniClickable : ""}`}
    >
      <div className={styles.statCardMiniTop}>
        <span className={styles.statCardMiniLabel}>{label}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className={styles.statCardMiniIcon}>{icon}</span>
          {onClick && <span className={styles.statCardMiniArrow}>›</span>}
        </span>
      </div>
      <div className={styles.statCardMiniValue}>
        {value}{unit && <span className={styles.statCardMiniUnit}>{unit}</span>}
      </div>
      {sub && (
        <p className={`${styles.statCardMiniSub} ${subTone === "aman" ? styles.statCardMiniSubAman : subTone === "perhatian" ? styles.statCardMiniSubPerhatian : ""}`}>
          {sub}
        </p>
      )}
      {children && <div className={styles.statCardMiniVisual}>{children}</div>}
    </Tag>
  );
}

/** Gulir halus ke satu section berdasarkan id, dipakai supaya kartu statistik ringkasan clickable. */
function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function AllGoodBanner({ subject }) {
  return (
    <div className={styles.allGoodBanner}>
      <span className={styles.allGoodBannerIcon}>✓</span>
      <div>
        <p className={styles.allGoodBannerTitle}>Semua {subject} sudah di jalur yang bagus periode ini.</p>
        <p className={styles.allGoodBannerText}>
          Pertahankan kebiasaan yang sudah berjalan. Rapor Karakter terus memantau tiap bulan supaya
          sinyal ini tetap konsisten, bukan sekali baik lalu terlupakan.
        </p>
      </div>
    </div>
  );
}

/** Partisi array item (kelas atau aspek) jadi baik/perlu_perhatian berdasar classifyPencapaian(getValue(item)). */
function splitByClassify(items, getValue) {
  const withData = items.filter((it) => classifyPencapaian(getValue(it)) !== null);
  const baik = withData.filter((it) => classifyPencapaian(getValue(it)) === "baik");
  const perhatian = withData.filter((it) => classifyPencapaian(getValue(it)) === "perlu_perhatian");
  const allGood = withData.length > 0 && perhatian.length === 0;
  return { withData, baik, perhatian, allGood };
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
  const [selectedTindakLanjut, setSelectedTindakLanjut] = useState(null);

  // Filter kelas/jenjang dan kelas terpilih di panel detail jadi tidak relevan lagi begitu
  // periode berganti (kelas yang sama belum tentu ada/cocok di periode lain).
  useEffect(() => {
    setFilterJenjang(null);
    setFilterKelas(null);
    setSelectedKelasId(null);
    setKelasTab("semua");
  }, [periodeId]);

  if (loading || error) return <KarakterStateBox loading={loading} error={error} />;

  const { periode, aspek, sekolah, jenjang, kelas, briefing, tindakLanjut, pernyataan } = data;
  const ringkasan = sekolah?.ringkasan || null;

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

  const aspekBaikSkorMap = Object.fromEntries(
    aspekSplit.baik.map((a) => [a.aspek_kode, ringkasanAspekValue(ringkasan, a.aspek_kode, "rata_input_guru_")])
  );
  const aspekPerhatianSkorMap = Object.fromEntries(
    aspekSplit.perhatian.map((a) => [a.aspek_kode, ringkasanAspekValue(ringkasan, a.aspek_kode, "rata_input_guru_")])
  );

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
      <div className={styles.heroLabel}>
        <p className={styles.eyebrow}>Rapor Karakter</p>
        <h1 className={styles.heroPill}>Ringkasan Sekolah</h1>
      </div>

      <BriefingOrEmpty briefing={briefing} periode={periode} label="Rapor Karakter Sekolah" />

      <div className={styles.categoryNav}>
        <button
          type="button"
          className={`${styles.categoryNavTab} ${activeCategory === "kualitas" ? styles.categoryNavTabActive : ""}`}
          onClick={() => setActiveCategory("kualitas")}
        >
          Kategori 1 · Kualitas Layanan Pendidikan
        </button>
        <button
          type="button"
          className={`${styles.categoryNavTab} ${activeCategory === "citra" ? styles.categoryNavTabActive : ""}`}
          onClick={() => setActiveCategory("citra")}
        >
          Kategori 2 · Citra Sekolah
        </button>
      </div>

      {/* ── Kategori 1: Peningkatan Kualitas dan Mutu Layanan Pendidikan ── */}
      {activeCategory === "kualitas" && (
      <div className={styles.megaCategory}>
        <div className={styles.megaCategoryHeader}>
          <span className={styles.megaCategoryBadge}>Kategori 1</span>
          <h2 className={styles.megaCategoryTitle}>Peningkatan Kualitas dan Mutu Layanan Pendidikan</h2>
          <p className={styles.megaCategorySub}>
            Bagaimana pencapaian akademik dan karakter di tiap kelas berkembang: kelas mana yang sudah
            baik, mana yang butuh dukungan tambahan, dan langkah konkret yang mengikutinya.
          </p>
        </div>

      <section className={styles.section}>
        <SectionHeading
          icon={SECTION_ICON.tren}
          eyebrow="Perjalanan sekolah · kenapa ini penting"
          title="Rata-Rata Pencapaian dan Peta Kelas"
          subtitle="Angka ini bukan rapor akhir, ini titik sekarang yang terus dipantau tiap bulan. Satu bulan turun bukan berarti mundur, yang penting arah beberapa bulan terakhir."
        />
        <div className={styles.statCardsRow}>
          <StatCardMini
            icon="📈" label="Rata-rata Sekolah"
            value={latestValue != null ? latestValue : "—"} unit={latestValue != null ? "%" : ""}
            sub={heroDelta
              ? `${heroDelta.direction === "up" ? "↑" : heroDelta.direction === "down" ? "↓" : "→"} ${heroDelta.value > 0 ? "+" : ""}${heroDelta.value}pp dari bulan lalu`
              : `Periode ${latestLabel || "ini"}`}
            subTone={heroDelta ? (heroDelta.direction === "up" ? "aman" : heroDelta.direction === "down" ? "perhatian" : "default") : "default"}
            onClick={() => scrollToId("aspek-detail")}
          >
            {trendPoints.length >= 2 && <TrendChart points={trendPoints} />}
          </StatCardMini>

          <StatCardMini
            icon="🏫" label="Kelas Dipetakan" value={kelas.length}
            sub={`${kelasSplitAll.baik.length} sudah baik · ${kelasSplitAll.perhatian.length} perlu perhatian`}
            onClick={() => scrollToId("kelas-detail")}
          >
            <div className={styles.miniStackBar}>
              <div className={styles.miniStackBarBaik} style={{ width: `${kelas.length ? (kelasSplitAll.baik.length / kelas.length) * 100 : 0}%` }} />
              <div className={styles.miniStackBarPerhatian} style={{ width: `${kelas.length ? (kelasSplitAll.perhatian.length / kelas.length) * 100 : 0}%` }} />
            </div>
          </StatCardMini>

          <StatCardMini
            icon="🌟" label="Kelas Terkuat" value={kelasTerkuat}
            sub={kelasTerkuatNilai != null ? `Pencapaian ${kelasTerkuatNilai}%` : "Belum ada data"}
            onClick={kelasTerkuat !== "—" ? () => {
              setKelasTab("baik");
              setSelectedKelasId(kelasTerkuat);
              scrollToId("kelas-detail");
            } : undefined}
          >
            {kelasTerkuatNilai != null && (
              <div className={styles.miniProgressTrack}>
                <div className={styles.miniProgressFill} style={{ width: `${kelasTerkuatNilai}%` }} />
              </div>
            )}
          </StatCardMini>

          <StatCardMini
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
          >
            {aspekSplit.perhatian.length > 0 && (
              <div className={styles.miniChipRow}>
                {aspekSplit.perhatian.slice(0, 3).map((a) => (
                  <span key={a.aspek_kode} className={styles.miniChip}>{a.aspek_label}</span>
                ))}
              </div>
            )}
          </StatCardMini>
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading
          icon={SECTION_ICON.jenjang}
          eyebrow="Saring tampilan"
          title="Filter Jenjang & Kelas"
          subtitle="Mempersempit kelas yang ditampilkan di panel bawah. Angka sekolah dan aspek karakter di atas tetap sekolah-wide."
        />
        <div className={styles.filterBarRow}>
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
        <div className={styles.card} style={{ marginTop: 14 }}>
          <p className={styles.cardTitle}>{SECTION_ICON.jenjang} Breakdown per jenjang</p>
          <p className={styles.cardSub}>Ringkasan resmi per jenjang, sebagai referensi di samping filter kelas di atas.</p>
          <JenjangTable rows={jenjang} onSelect={setSelectedJenjangDialog} />
        </div>
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
                  <section>
                    <p className={styles.dialogSectionTitle}>Skor per aspek</p>
                    <AspekBarList
                      aspek={aspek}
                      skorByAspek={Object.fromEntries(
                        aspek.map((a) => [a.aspek_kode, ringkasanAspekValue(activeKelasRow.ringkasan, a.aspek_kode)])
                      )}
                    />
                  </section>
                  {(() => {
                    const top5 = parseTop5Pair(
                      activeKelasRow.ringkasan?.top5_siswa_tertinggi,
                      activeKelasRow.ringkasan?.top5_nilai_siswa_tertinggi
                    );
                    return top5.length > 0 ? (
                      <section>
                        <p className={styles.dialogSectionTitle}>🏆 Top 5 pencapaian siswa</p>
                        <div className={styles.top5List}>
                          {top5.map((p, i) => (
                            <div className={styles.top5Row} key={i}>
                              <span className={styles.rankBadge}>{i + 1}</span>
                              <span className={styles.top5Nama}>{p.nama}</span>
                              <span className={styles.top5Nilai}>{p.nilai}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    ) : null;
                  })()}
                  {(() => {
                    const ind = parseTop5Indikator(activeKelasRow.ringkasan?.top5_indikator_terbaik);
                    return ind.length > 0 ? (
                      <section>
                        <p className={styles.dialogSectionTitle}>⭐ Indikator paling kuat</p>
                        <div className={styles.indikatorList}>
                          {ind.map((it, i) => (
                            <div className={styles.indikatorRow} key={i} style={{ cursor: "default" }}>
                              <span>{it.label}</span>
                              <strong>{it.nilai}</strong>
                            </div>
                          ))}
                        </div>
                      </section>
                    ) : null;
                  })()}
                </>
              ) : (
                <p className={styles.emptyNote}>Pilih kelas di daftar sebelah kiri.</p>
              )}
            </div>
          </div>
        )}
      </section>

      <section className={styles.section} id="aspek-detail">
        <SectionHeading
          icon={SECTION_ICON.profilSekolah}
          eyebrow="Karakter mana yang perlu perhatian"
          title="Aspek Karakter: Sudah Baik vs Perlu Perhatian"
          subtitle="Aspek yang sudah baik adalah kekuatan yang sedang tumbuh, bukan yang sudah selesai. Aspek yang perlu perhatian mengarah ke rutinitas kelas dan rumah, bukan ke anak secara individu."
        />
        <div style={{ marginBottom: 16 }}>
          <AspekRadarCard
            title="Profil rata-rata sekolah"
            subtitle="Index 0-100 per aspek karakter"
            aspek={aspek}
            ringkasan={ringkasan}
            prefix="rata_input_guru_"
          />
        </div>
        {aspekSplit.allGood ? (
          <AllGoodBanner subject="aspek karakter" />
        ) : (
          <div className={styles.splitGrid}>
            <div className={`${styles.splitCol} ${styles.splitColBaik}`}>
              <div className={styles.splitColHeader}>
                <span className={styles.splitColIcon}>✓</span>
                <span className={styles.splitColTitle}>Sudah Baik ({aspekSplit.baik.length})</span>
              </div>
              <div className={styles.card}>
                {aspekSplit.baik.length > 0
                  ? <AspekBarList aspek={aspekSplit.baik} skorByAspek={aspekBaikSkorMap} colorByThreshold />
                  : <p className={styles.emptyNote}>Belum ada aspek di kategori ini.</p>}
              </div>
            </div>
            <div className={`${styles.splitCol} ${styles.splitColPerhatian}`}>
              <div className={styles.splitColHeader}>
                <span className={styles.splitColIcon}>◔</span>
                <span className={styles.splitColTitle}>Perlu Perhatian ({aspekSplit.perhatian.length})</span>
              </div>
              <div className={styles.card}>
                {aspekSplit.perhatian.length > 0
                  ? <AspekBarList aspek={aspekSplit.perhatian} skorByAspek={aspekPerhatianSkorMap} colorByThreshold />
                  : <p className={styles.emptyNote}>Tidak ada aspek yang perlu perhatian saat ini.</p>}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <SectionHeading
          icon={SECTION_ICON.tindakLanjut}
          eyebrow="Tindak lanjut"
          title="Tindak Lanjut Kualitas Layanan Pendidikan"
          subtitle="Dikelompokkan supaya jelas mana yang tinggal dipertahankan dan mana yang butuh perhatian ekstra, per kelas."
        />
        <TindakLanjutGrouped
          tindakLanjut={tindakLanjut}
          kelas={kelas}
          onItemClick={(item) => setSelectedTindakLanjut(item._raw)}
          only={["baik", "perlu_perhatian"]}
        />
      </section>
      </div>
      )}

      {/* ── Kategori 2: Peningkatan Citra Sekolah di Mata Orang Tua ── */}
      {activeCategory === "citra" && (
      <div className={`${styles.megaCategory} ${styles.megaCategoryB}`}>
        <div className={styles.megaCategoryHeader}>
          <span className={styles.megaCategoryBadge}>Kategori 2</span>
          <h2 className={styles.megaCategoryTitle}>Peningkatan Citra Sekolah di Mata Orang Tua</h2>
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
          <ParentVoiceBento pernyataan={pernyataan} />
        </section>

        <section className={styles.section}>
          <SectionHeading
            icon={SECTION_ICON.tindakLanjut}
            eyebrow="Tindak lanjut"
            title="Tindak Lanjut Citra Sekolah"
            subtitle="Langkah sekolah-wide, tidak terikat satu kelas tertentu."
          />
          <TindakLanjutGrouped
            tindakLanjut={tindakLanjut}
            kelas={kelas}
            onItemClick={(item) => setSelectedTindakLanjut(item._raw)}
            only={["lainnya"]}
          />
        </section>
      </div>
      )}

      {selectedJenjangDialog && (
        <DetailDialog
          icon={SECTION_ICON.jenjang}
          eyebrow="Detail Jenjang"
          title={selectedJenjangDialog.scope_id}
          subtitle={`Pencapaian guru ${selectedJenjangDialog.ringkasan?.pencapaian_guru ?? "—"} · orang tua ${selectedJenjangDialog.ringkasan?.pencapaian_orangtua ?? "—"}`}
          onClose={() => setSelectedJenjangDialog(null)}
        >
          <section>
            <p className={styles.dialogSectionTitle}>Skor per aspek</p>
            <AspekBarList
              aspek={aspek}
              skorByAspek={Object.fromEntries(
                aspek.map((a) => [a.aspek_kode, ringkasanAspekValue(selectedJenjangDialog.ringkasan, a.aspek_kode, "rata_input_guru_")])
              )}
            />
          </section>
        </DetailDialog>
      )}

      {selectedTindakLanjut && (
        <DetailDialog
          icon={SECTION_ICON.tindakLanjut}
          eyebrow="Tindak Lanjut"
          title={selectedTindakLanjut.action}
          onClose={() => setSelectedTindakLanjut(null)}
        >
          <TindakLanjutDetailBody item={selectedTindakLanjut} />
        </DetailDialog>
      )}
    </div>
  );
}

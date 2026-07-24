import { useEffect, useMemo, useState } from "react";
import { DIMENSI_PROFIL_INFO, KESEJAHTERAAN_INFO, METODOLOGI_NOTE, TIPE_BUDAYA_INFO, implikasiBudaya, toneKesejahteraan } from "./scMeta";
import { useReveal } from "./scHooks";
import { useScKomitmen } from "./useScData";
import styles from "./ScLaporanIndividuPage.module.css";

/** Label TAMPILAN subdimensi kesejahteraan, selalu ikut KESEJAHTERAAN_INFO (scMeta.js) --
 * beberapa baris sc_personal lama masih menyimpan label istilah sebelum wording diperbarui
 * (mis. "Keseimbangan Kerja-Hidup"). HANYA dipakai untuk teks yang dibaca pengguna. */
function labelKesejahteraan(kode, labelAsli) {
  return KESEJAHTERAAN_INFO[kode]?.label || labelAsli;
}

/** Reveal halus saat elemen masuk viewport -- animasi "benchmark Fammi" yang sama dipakai
 * seluruh laporan individu FIR (Karakter/MI), cuma salinan lokal SC (lihat scHooks.js).
 * SENGAJA tetap CSS transition + useReveal, BUKAN framer-motion/@phosphor-icons -- dua library
 * itu dikunci CLAUDE.md khusus untuk dashboard "Laporan Lembaga" pimpinan, bukan laporan individu. */
function Reveal({ children, delay = 0, className = "" }) {
  const [ref, shown] = useReveal();
  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${shown ? styles.revealShown : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionHead({ index, title, lead }) {
  return (
    <div className={styles.sectionHead}>
      <p className={styles.sectionIndex}>{index}</p>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {lead && <p className={styles.sectionLead}>{lead}</p>}
    </div>
  );
}

function formatScore(v) {
  return v == null ? "--" : Math.round(v);
}

/** Padanan signalLabel referensi (strength/attention/steady), dipetakan dari `kategori` yang
 * sudah final lewat toneKesejahteraan (scMeta.js) -- BUKAN ambang baru, cuma relabel kategori
 * kualitatif yang sudah ada supaya konsisten dengan bahasa "sinyal" di seluruh halaman ini. */
const SIGNAL_LABEL = { baik: "Kekuatan", netral: "Cukup terjaga", waspada: "Perlu diamati" };

const WELLBEING_ICON = {
  kepuasan_kepemimpinan: "🛡️",
  kenyamanan_bekerja: "💗",
  pengembangan_diri: "📖",
  ekspektasi: "🚩",
  work_life_balance: "⚖️",
};

/** Tiga langkah kontribusi peran -- copy STATIS (padanan TIPE_BUDAYA_INFO/KESEJAHTERAAN_INFO),
 * bukan dihitung per laporan. Skema data tidak punya field granular per-langkah untuk ini. */
const ROLE_CONTRIBUTION_STEPS = [
  { icon: "🚩", title: "Fokus strategi", detail: "Arah utama sekolah yang menjadi panduan bersama." },
  { icon: "📋", title: "Prioritas unit", detail: "Pilihan kerja unit Anda yang paling mendukung arah itu." },
  { icon: "🗓️", title: "Kebiasaan kerja", detail: "Keputusan harian yang benar-benar ada di tangan Anda." },
];

/** Lingkar kontribusi -- penjelas KONSEP statis (kendali/pengaruh/sistem), bukan kategorisasi
 * rencana_aksi asli. Skema AksiPribadi (sc.types.ts) tidak punya field locus, jadi memaksa tiap
 * rencana_aksi masuk salah satu dari tiga kelompok ini berarti FIR mengarang klasifikasi yang
 * tidak ada di data -- dihindari sesuai CLAUDE.md ("FIR tidak menghitung apa pun"). Rencana aksi
 * asli tetap tampil apa adanya di bagian "Komitmen 30 hari" tepat di bawah penjelas ini. */
const AGENCY_TERRITORIES = [
  { key: "control", title: "Dalam kendali saya", desc: "Langkah yang bisa langsung Anda putuskan dan jalankan sendiri, tanpa menunggu orang lain." },
  { key: "influence", title: "Bisa saya pengaruhi", desc: "Butuh percakapan atau kerja sama dengan rekan/pimpinan, tapi Anda bisa mendorongnya." },
  { key: "system", title: "Membutuhkan dukungan sistem", desc: "Perubahan yang perlu dibawa ke ruang keputusan lembaga, bukan tanggung jawab satu orang." },
];

const BULAN_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
function formatTanggalID(date) {
  return `${date.getDate()} ${BULAN_ID[date.getMonth()]} ${date.getFullYear()}`;
}
function tambahHari(dariIso, jumlahHari) {
  const dari = dariIso ? new Date(dariIso) : new Date();
  return new Date(dari.getTime() + jumlahHari * 86400000);
}

/** Dua wawasan pribadi untuk carousel pembuka -- DIDERIVASI dari data final yang sudah ada,
 * bukan field baru: "kekuatan" = subdimensi kesejahteraan bernilai tertinggi (skor asli, cuma
 * diranking), "fokus 30 hari" = rencana_aksi[0] yang sudah jadi rekomendasi utama di tempat lain
 * (ScRencanaTindakLanjutPage lama memakai indeks 0 yang sama sebagai "fokus"). Referensi desain
 * punya slot ketiga "dukungan yang dibutuhkan" -- SENGAJA tidak diisi, tidak ada field yang bisa
 * dipetakan tanpa mengarang teks baru (lihat audit redesign, poin data gap). */
function buildSignals(kesejahteraanItems, aksiList) {
  const signals = [];

  const top = kesejahteraanItems.reduce(
    (acc, it) => (acc == null || (it.nilai ?? -1) > (acc.nilai ?? -1) ? it : acc), null,
  );
  if (top) {
    signals.push({
      key: "strength",
      icon: "💪",
      eyebrow: "Kekuatan yang dijaga",
      value: labelKesejahteraan(top.kode, top.label),
      detail: KESEJAHTERAAN_INFO[top.kode]?.deskripsi || "",
    });
  }

  const fokus = aksiList[0];
  if (fokus) {
    signals.push({
      key: "focus",
      icon: "🎯",
      eyebrow: "Fokus 30 hari",
      value: fokus.judul,
      detail: fokus.alasan || "",
    });
  }

  return signals;
}

/** Satu kartu tipe budaya: dumbbell chart (Persepsi Anda -> Harapan Anda), progressive disclosure
 * per dimensi -- ganti tampilan dua-bar lama, sumber angka SAMA PERSIS (saat_ini/harapan/tabel_gap
 * yang sudah final dari upstream). Interpretasi pakai implikasiBudaya() (scMeta.js), template statis
 * per tipe+arah yang sudah ada, bukan narasi baru per laporan. */
function BudayaGapRow({ dim, gapRow, expanded, onToggle, delay }) {
  const info = TIPE_BUDAYA_INFO[dim.tipe];
  const cur = Math.max(0, Math.min(100, dim.saat_ini ?? 0));
  const tgt = Math.max(0, Math.min(100, dim.harapan ?? 0));
  const gap = gapRow?.nilai_gap;
  const interpretasi = implikasiBudaya(dim.tipe, gapRow?.arah);

  return (
    <Reveal delay={delay} className={styles.gapItem}>
      <button type="button" className={styles.gapHead} onClick={onToggle} aria-expanded={expanded}>
        <span className={styles.gapIcon} aria-hidden="true">{info?.icon || "🔹"}</span>
        <span className={styles.gapHeading}>
          <strong>{dim.tipe}</strong>
          {gap != null && <small>Gap {Math.abs(gap)} poin</small>}
        </span>
        <span className={`${styles.chevron} ${expanded ? styles.chevronUp : ""}`} aria-hidden="true">⌄</span>
      </button>

      <span className={styles.gapValues}>
        <span><strong>{formatScore(dim.saat_ini)}%</strong> Persepsi Anda</span>
        <span><strong>{formatScore(dim.harapan)}%</strong> Harapan Anda</span>
      </span>

      <svg className={styles.dumbbell} viewBox="0 0 100 14" role="img" aria-label={`${dim.tipe}: persepsi Anda ${formatScore(dim.saat_ini)} persen, harapan Anda ${formatScore(dim.harapan)} persen`}>
        <line x1="0" y1="7" x2="100" y2="7" className={styles.dumbbellTrack} />
        <line x1={cur} y1="7" x2={tgt} y2="7" className={styles.dumbbellGapLine} />
        <circle cx={cur} cy="7" r="4.4" className={styles.dumbbellCurrent} />
        <circle cx={tgt} cy="7" r="4.4" className={styles.dumbbellTarget} />
      </svg>

      {expanded && interpretasi && (
        <p className={styles.gapInsight}>{interpretasi}</p>
      )}
    </Reveal>
  );
}

/** Satu baris subdimensi kesejahteraan -- skor + badge sinyal (dari kategori final, bukan
 * bintang), label "Respons Anda" eksplisit. Facet generik (KESEJAHTERAAN_INFO) sebagai penjelas
 * saat dibuka, BUKAN rincian butir 1-5 per pertanyaan seperti referensi visual -- itu sudah
 * tersedia terpisah di dashboard Laporan Lembaga (ScKesejahteraanDriver.jsx, rata-rata lintas
 * responden), tapi untuk SATU orang butir mentahnya tidak disimpan granular di sc_personal.
 * "Gambaran lembaga" (organizationScore referensi) SENGAJA tidak ditampilkan -- RLS sc_lembaga
 * sengaja membatasi baca agregat sekolah hanya ke peran pimpinan, staf (Karyawan) tidak berhak
 * baca tabel itu sama sekali (lihat audit redesign). Bukan data belum lengkap, tapi memang
 * diblokir arsitektur privasi yang sudah ada -- FIR tidak melonggarkannya lewat redesign ini. */
function KesejahteraanRow({ item, expanded, onToggle, delay }) {
  const info = KESEJAHTERAAN_INFO[item.kode];
  const tone = toneKesejahteraan(item.kategori);
  const label = labelKesejahteraan(item.kode, item.label);

  return (
    <Reveal delay={delay} className={styles.wbItem}>
      <button type="button" className={styles.wbHead} onClick={onToggle} aria-expanded={expanded}>
        <span className={styles.wbIcon} aria-hidden="true">{WELLBEING_ICON[item.kode] || "🔹"}</span>
        <span className={styles.wbBody}>
          <span className={styles.wbTop}>
            <strong>{label}</strong>
            <em className={`${styles.wbSignal} ${tone === "waspada" ? styles.wbSignalWarn : ""}`}>{SIGNAL_LABEL[tone]}</em>
          </span>
          <span className={styles.wbScoreRow}>
            <span className={styles.wbScore}>{formatScore(item.nilai)}%</span>
            <span className={styles.wbScoreLabel}>Respons Anda</span>
          </span>
          <div className={styles.barTrackSlim}>
            <div className={styles.barFillSlim} style={{ width: `${Math.max(0, Math.min(100, item.nilai ?? 0))}%` }} />
          </div>
        </span>
        <span className={`${styles.chevron} ${expanded ? styles.chevronUp : ""}`} aria-hidden="true">⌄</span>
      </button>

      {expanded && (
        <div className={styles.wbDetail}>
          <p>{info?.deskripsi}</p>
          {info?.facets?.length > 0 && (
            <ul className={styles.facetList}>
              {info.facets.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          )}
        </div>
      )}
    </Reveal>
  );
}

/** Satu kartu jawaban esai verbatim -- kutipan asli staf sendiri, bukan sintesis Gemini. */
function SurveyCard({ heading, teks, delay }) {
  if (!teks) return null;
  return (
    <Reveal delay={delay} className={styles.surveyCard}>
      <span className={styles.quoteMark} aria-hidden="true">&ldquo;</span>
      <p className={styles.surveyHeading}>{heading}</p>
      <p className={styles.surveyText}>{teks}</p>
    </Reveal>
  );
}

/**
 * ScLaporanIndividuPage -- laporan School Culture untuk satu staf sekolah, MOBILE-ONLY (maksimum
 * 480px, lihat ScLaporanIndividuPage.module.css), REDESIGN TOTAL kedua atas instruksi eksplisit
 * pemilik produk (CLAUDE_CODE_HANDOFF_INDIVIDUAL.md + design-references/10..13). Alur satu scroll:
 * pahami (hero+wawasan) -> refleksikan (celah budaya, energi, kontribusi peran, refleksi privat)
 * -> pilih+berkomitmen (lingkar kontribusi -> pilih tindakan -> komposer -> simpan) -> pantau
 * (check-in 30 hari). Section "Rencana Tindak Lanjut" yang tadinya halaman terpisah (FAB) sudah
 * dilebur ke sini sebagai bagian "Komitmen 30 hari" -- referensi desain memang satu alur menerus,
 * bukan berpindah halaman.
 *
 * `viewerIsOwner`: true kalau yang membuka adalah staf pemilik laporan sendiri (ScKaryawanPage),
 * false kalau pimpinan sedang drill-down ke laporan staf lain (ScRespondenListPage/ScDetailDialog)
 * -- lapis UI kedua di atas RLS sc_komitmen_rw (yang sebenarnya menegakkan privasi): komposer
 * komitmen jadi read-only dan tidak mem-fetch/menulis sc_komitmen sama sekali kalau bukan pemilik.
 * Refleksi (jawaban_survey) TETAP terlihat untuk kedua konteks -- itu bukan regresi, pimpinan
 * sudah lama berhak baca lewat RLS sc_hasil_baca yang sudah ada sebelum redesign ini.
 */
export default function ScLaporanIndividuPage({ laporan, viewerIsOwner = false }) {
  const {
    meta, header, bagian_budaya, bagian_kesejahteraan, bagian_profil_organisasi,
    jawaban_survey, rencana_aksi, footer,
  } = laporan;

  const budayaItems = bagian_budaya?.chart_data || [];
  const tabelGap = bagian_budaya?.tabel_gap || [];
  const kesejahteraanItems = bagian_kesejahteraan?.chart_data || [];
  const aksiList = rencana_aksi || [];

  const signals = buildSignals(kesejahteraanItems, aksiList);
  const [signalIdx, setSignalIdx] = useState(0);
  const signal = signals[signalIdx];
  function gerakSignal(arah) {
    if (signals.length === 0) return;
    setSignalIdx((cur) => (cur + arah + signals.length) % signals.length);
  }

  const [expandedBudaya, setExpandedBudaya] = useState(budayaItems[0]?.tipe || null);
  const [expandedKes, setExpandedKes] = useState(kesejahteraanItems[0]?.kode || null);
  const [expandedAgency, setExpandedAgency] = useState("control");
  const [showReflections, setShowReflections] = useState(false);

  const adaJawabanSurvey = jawaban_survey && (
    jawaban_survey.betah || jawaban_survey.hal_menguras_energi || jawaban_survey.yang_ingin_disampaikan
  );

  // ── Komitmen 30 hari: hook cuma dipanggil (fetch+RLS) kalau viewerIsOwner, supaya pimpinan
  // yang drill-down tidak memicu request yang toh akan ditolak RLS.
  const { komitmen, simpan: simpanKomitmen, error: komitmenError } = useScKomitmen(
    viewerIsOwner ? meta.responden_id : undefined,
    viewerIsOwner ? meta.periode_id : undefined,
  );

  const [selectedAksiId, setSelectedAksiId] = useState(aksiList[0]?.id ?? null);
  const [langkahPertama, setLangkahPertama] = useState("");
  const [frekuensi, setFrekuensi] = useState(aksiList[0]?.jangka || "");
  const [buktiKemajuan, setBuktiKemajuan] = useState("");
  const [dukungan, setDukungan] = useState("");
  const [savedForLater, setSavedForLater] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Sinkron sekali setelah draf tersimpan berhasil dimuat -- useState awal di atas tidak bisa
  // menunggu hasil query async, jadi field composer diisi ulang begitu `komitmen` datang.
  useEffect(() => {
    if (!komitmen) return;
    setSelectedAksiId(komitmen.aksi_id);
    setLangkahPertama(komitmen.langkah_pertama || "");
    setFrekuensi(komitmen.frekuensi || "");
    setBuktiKemajuan(komitmen.bukti_kemajuan || "");
    setDukungan(komitmen.dukungan || "");
  }, [komitmen]);

  const selectedAksi = aksiList.find((a) => a.id === selectedAksiId) || aksiList[0] || null;
  const committed = komitmen?.status === "committed";
  const canCommit = Boolean(langkahPertama.trim() && frekuensi.trim() && buktiKemajuan.trim());

  function pilihAksi(id) {
    const next = aksiList.find((a) => a.id === id);
    if (!next) return;
    setSelectedAksiId(id);
    setLangkahPertama("");
    setFrekuensi(next.jangka || "");
    setBuktiKemajuan("");
    setDukungan("");
    setSavedForLater(false);
    setSaveError(null);
  }

  async function simpanDraf() {
    if (!selectedAksi) return;
    setSaving(true);
    setSaveError(null);
    try {
      await simpanKomitmen({
        aksi_id: selectedAksi.id, aksi_judul: selectedAksi.judul,
        langkah_pertama: langkahPertama, frekuensi, bukti_kemajuan: buktiKemajuan, dukungan,
      }, { commit: false });
      setSavedForLater(true);
    } catch (e) {
      setSaveError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  async function kunciKomitmen() {
    if (!selectedAksi || !canCommit) return;
    setSaving(true);
    setSaveError(null);
    try {
      await simpanKomitmen({
        aksi_id: selectedAksi.id, aksi_judul: selectedAksi.judul,
        langkah_pertama: langkahPertama.trim(), frekuensi: frekuensi.trim(),
        bukti_kemajuan: buktiKemajuan.trim(), dukungan: dukungan.trim(),
      }, { commit: true });
      setSavedForLater(false);
    } catch (e) {
      setSaveError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  const checkIns = useMemo(() => {
    const base = komitmen?.committed_at || null;
    const judul = ["Refleksi dan penyesuaian awal", "Evaluasi pertengahan", "Refleksi akhir dan langkah berikutnya"];
    return [10, 20, 30].map((hari, i) => ({
      sequence: i + 1,
      date: formatTanggalID(tambahHari(base, hari)),
      title: judul[i],
    }));
  }, [komitmen?.committed_at]);

  return (
    <div className={styles.page}>
      {/* ── 00 Pembuka personal ─────────────────────────────────────────────────────── */}
      <Reveal className={styles.hero}>
        <p className={styles.heroGreet}>Halo, <strong>{meta.nama_responden}</strong></p>
        <h1 className={styles.heroHook}>{header.hook}</h1>
        <p className={styles.notScore}>Ini bukan nilai akhir tentang diri Anda.</p>

        <div className={styles.chips}>
          {meta.peran_kerja && <span className={styles.chip}>{meta.peran_kerja}</span>}
          {meta.unit && <span className={styles.chip}>{meta.unit}</span>}
        </div>

        {signals.length > 0 && (
          <div className={styles.signalCard}>
            <div className={styles.signalTopline}>
              <span>Wawasan pribadi Anda</span>
              <span>{signalIdx + 1} / {signals.length}</span>
            </div>
            <div className={styles.signalContent}>
              <span className={styles.signalIcon} aria-hidden="true">{signal.icon}</span>
              <p className={styles.signalEyebrow}>{signal.eyebrow}</p>
              <h3 className={styles.signalValue}>{signal.value}</h3>
              {signal.detail && <p className={styles.signalDetail}>{signal.detail}</p>}
            </div>
            {signals.length > 1 && (
              <div className={styles.signalControls}>
                <button type="button" onClick={() => gerakSignal(-1)} aria-label="Wawasan sebelumnya">‹</button>
                <div className={styles.signalDots} aria-hidden="true">
                  {signals.map((s, i) => (
                    <span key={s.key} className={i === signalIdx ? styles.dotActive : ""} />
                  ))}
                </div>
                <button type="button" onClick={() => gerakSignal(1)} aria-label="Wawasan berikutnya">›</button>
              </div>
            )}
          </div>
        )}

        {jawaban_survey?.yang_ingin_diubah && (
          <div className={styles.heroQuote}>
            <span className={styles.quoteMark} aria-hidden="true">&ldquo;</span>
            <p className={styles.heroQuoteHeading}>Perubahan yang Anda harapkan</p>
            <p className={styles.heroQuoteText}>{jawaban_survey.yang_ingin_diubah}</p>
          </div>
        )}
      </Reveal>

      {/* ── 01 Celah budaya ─────────────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <SectionHead index="01" title="Celah budaya yang Anda rasakan" lead="Bandingkan persepsi Anda saat ini dengan harapan Anda tentang budaya sekolah." />

        <div className={styles.legend} aria-label="Legenda celah budaya">
          <span><i className={styles.legendCurrent} /> Persepsi Anda</span>
          <span><i className={styles.legendTarget} /> Harapan Anda</span>
        </div>

        <div className={styles.gapList}>
          {budayaItems.map((dim, i) => (
            <BudayaGapRow
              key={dim.tipe}
              dim={dim}
              gapRow={tabelGap.find((g) => g.label === dim.tipe)}
              expanded={expandedBudaya === dim.tipe}
              onToggle={() => setExpandedBudaya((cur) => (cur === dim.tipe ? null : dim.tipe))}
              delay={i * 40}
            />
          ))}
        </div>

        <div className={styles.note}>
          <span aria-hidden="true">ℹ️</span>
          <p>Gap tidak sepenuhnya menjadi tanggung jawab Anda. Bagian berikutnya membantu memisahkan kontribusi pribadi dari kebutuhan dukungan sistem.</p>
        </div>
      </section>

      {/* ── 02 Energi dan kesejahteraan ─────────────────────────────────────────────── */}
      <section className={styles.section}>
        <SectionHead index="02" title="Apa yang menjaga dan menguras energi Anda" lead="Ini menggambarkan pengalaman Anda, bukan penilaian kinerja." />
        <div className={styles.wbList}>
          {kesejahteraanItems.map((item, i) => (
            <KesejahteraanRow
              key={item.kode}
              item={item}
              expanded={expandedKes === item.kode}
              onToggle={() => setExpandedKes((cur) => (cur === item.kode ? null : item.kode))}
              delay={i * 35}
            />
          ))}
        </div>
      </section>

      {/* ── 03 Kontribusi peran (statis) ────────────────────────────────────────────── */}
      <section className={styles.section}>
        <SectionHead index="03" title="Kontribusi peran Anda" lead="Peran Anda paling berdampak saat tiga hal ini saling terhubung." />
        <div className={styles.roleList}>
          {ROLE_CONTRIBUTION_STEPS.map((step, i) => (
            <Reveal delay={i * 60} className={styles.roleStep} key={step.title}>
              <span className={styles.roleNumber}>{i + 1}</span>
              <span className={styles.roleIcon} aria-hidden="true">{step.icon}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* ── Refleksi privat: tersembunyi default, toggle eksplisit ───────────────── */}
        {adaJawabanSurvey && (
          <>
            <button
              type="button"
              className={styles.reflectionToggle}
              onClick={() => setShowReflections((v) => !v)}
              aria-expanded={showReflections}
            >
              <span aria-hidden="true">🔒</span>
              <span>
                <strong>Refleksi pribadi {viewerIsOwner ? "Anda" : meta.nama_responden}</strong>
                <small>{viewerIsOwner ? "Hanya dapat dilihat oleh Anda" : "Jawaban asli staf ini"}</small>
              </span>
              <span className={`${styles.chevron} ${showReflections ? styles.chevronUp : ""}`} aria-hidden="true">⌄</span>
            </button>

            {showReflections && (
              <div className={styles.surveyList}>
                <SurveyCard heading="Sumber energi Anda" teks={jawaban_survey.betah} delay={0} />
                <SurveyCard heading="Hal yang menguras energi Anda" teks={jawaban_survey.hal_menguras_energi} delay={50} />
                <SurveyCard heading="Hal yang ingin Anda sampaikan" teks={jawaban_survey.yang_ingin_disampaikan} delay={100} />
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Profil organisasi (dipertahankan dari versi sebelumnya) ─────────────────── */}
      {(bagian_profil_organisasi?.chart_data?.length > 0) && (
        <section className={styles.section}>
          <SectionHead index="04" title="Profil organisasi" />
          <Reveal className={styles.orgGrid}>
            {bagian_profil_organisasi.chart_data.map((d) => (
              <div className={styles.orgCard} key={d.kode}>
                <span className={styles.orgIcon} aria-hidden="true">{DIMENSI_PROFIL_INFO[d.kode]?.icon}</span>
                <span className={styles.orgBody}>
                  <span className={styles.orgLabel}>Nilai {d.label}</span>
                  <strong className={styles.orgNilai}>{formatScore(d.nilai)}%</strong>
                </span>
              </div>
            ))}
          </Reveal>
        </section>
      )}

      {/* ── 05 Lingkar kontribusi (statis) + 06 Komitmen 30 hari ────────────────────── */}
      <section className={styles.section}>
        <SectionHead index="05" title="Mulai dari yang paling dekat dengan kendali Anda" lead="Kontribusi Anda penting, tetapi perubahan tidak dibebankan kepada Anda sendiri." />

        <div className={styles.agencyList}>
          {AGENCY_TERRITORIES.map((t, i) => {
            const expanded = expandedAgency === t.key;
            return (
              <div className={`${styles.agencyItem} ${expanded ? styles.agencyItemOpen : ""}`} key={t.key}>
                <button type="button" onClick={() => setExpandedAgency(expanded ? null : t.key)} aria-expanded={expanded}>
                  <span className={styles.agencyNumber}>{i + 1}</span>
                  <span>
                    <strong>{t.title}</strong>
                  </span>
                  <span className={`${styles.chevron} ${expanded ? styles.chevronUp : ""}`} aria-hidden="true">⌄</span>
                </button>
                {expanded && <p className={styles.agencyDesc}>{t.desc}</p>}
              </div>
            );
          })}
        </div>

        {aksiList.length > 0 && (
          <div className={styles.actionBlock}>
            <h3 className={styles.actionTitle}>Pilih satu perubahan kecil untuk 30 hari</h3>
            <p className={styles.actionLead}>Fokus pada tindakan yang bisa Anda kendalikan atau pengaruhi langsung.</p>

            <fieldset className={styles.actionOptions}>
              <legend className={styles.srOnly}>Pilih fokus Anda</legend>
              {aksiList.map((aksi, i) => {
                const isSelected = aksi.id === selectedAksiId;
                return (
                  <label className={`${styles.actionOption} ${isSelected ? styles.actionOptionSelected : ""}`} key={aksi.id}>
                    <input
                      type="radio"
                      name="sc-individu-aksi"
                      value={aksi.id}
                      checked={isSelected}
                      onChange={() => pilihAksi(aksi.id)}
                      disabled={!viewerIsOwner}
                    />
                    <span className={styles.radioDot} aria-hidden="true" />
                    <span>
                      <strong>{aksi.judul}</strong>
                      {aksi.jangka && <small>{aksi.jangka}</small>}
                      {aksi.alasan && <em>{aksi.alasan}</em>}
                    </span>
                    {i === 0 && <span className={styles.recommendedMarker}>⭐ Disarankan</span>}
                  </label>
                );
              })}
            </fieldset>

            {!viewerIsOwner ? (
              <p className={styles.gapNote}>Komitmen 30 hari hanya dapat diedit dan disimpan oleh staf pemilik laporan ini.</p>
            ) : (
              <>
                <div className={styles.composer}>
                  <h3>Rancang komitmen Anda</h3>
                  <p>Anda dapat menyesuaikan langkah ini dengan konteks kerja Anda sendiri.</p>

                  <label>
                    <span>Langkah pertama</span>
                    <textarea
                      value={langkahPertama}
                      maxLength={180}
                      placeholder="Apa langkah pertama yang akan Anda lakukan?"
                      onChange={(e) => { setLangkahPertama(e.target.value); setSavedForLater(false); }}
                    />
                    <small>{langkahPertama.length}/180</small>
                  </label>

                  <label>
                    <span>Frekuensi</span>
                    <input
                      type="text"
                      value={frekuensi}
                      maxLength={60}
                      placeholder="Seberapa sering Anda akan melakukannya?"
                      onChange={(e) => { setFrekuensi(e.target.value); setSavedForLater(false); }}
                    />
                  </label>

                  <label>
                    <span>Bukti kemajuan</span>
                    <textarea
                      value={buktiKemajuan}
                      maxLength={180}
                      placeholder="Apa yang menandakan langkah ini berjalan?"
                      onChange={(e) => { setBuktiKemajuan(e.target.value); setSavedForLater(false); }}
                    />
                  </label>

                  <label>
                    <span>Dukungan yang saya perlukan</span>
                    <textarea
                      value={dukungan}
                      maxLength={180}
                      placeholder="Dukungan apa yang ingin Anda minta? (opsional)"
                      onChange={(e) => { setDukungan(e.target.value); setSavedForLater(false); }}
                    />
                  </label>
                </div>

                <div className={styles.checkins}>
                  <h3>Perjalanan 30 hari Anda</h3>
                  {checkIns.map((c) => (
                    <article key={c.sequence} className={styles.checkinItem}>
                      <span>{c.sequence}</span>
                      <div>
                        <strong>{c.date}</strong>
                        <p>{c.title}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className={styles.privacyNote}>
                  <span aria-hidden="true">🔒</span>
                  <p>Refleksi dan komitmen pribadi Anda hanya dapat dilihat oleh Anda.</p>
                </div>

                {saveError && <p className={styles.errorNote}>Gagal menyimpan: {saveError}</p>}
                {komitmenError && <p className={styles.errorNote}>Gagal memuat komitmen tersimpan: {komitmenError}</p>}

                {committed && (
                  <div className={styles.commitSuccess} role="status">
                    <span aria-hidden="true">✅</span>
                    <div>
                      <strong>Komitmen 30 hari tersimpan</strong>
                      <p>Check-in pertama dijadwalkan pada {checkIns[0].date}.</p>
                    </div>
                  </div>
                )}

                <div className={styles.commitmentBar}>
                  <button
                    type="button"
                    className={styles.commitBtn}
                    onClick={kunciKomitmen}
                    disabled={!canCommit || saving}
                  >
                    {saving ? "Menyimpan…" : committed ? "✓ Komitmen tersimpan" : "Saya memilih fokus ini →"}
                  </button>
                  <button type="button" className={styles.saveLaterBtn} onClick={simpanDraf} disabled={saving}>
                    {savedForLater ? "Tersimpan untuk nanti" : "Simpan untuk nanti"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      <p className={styles.disclaimer}>{footer?.disclaimer}</p>
      <p className={styles.metodologi}>{METODOLOGI_NOTE}</p>
    </div>
  );
}

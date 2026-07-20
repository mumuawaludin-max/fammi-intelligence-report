import { useState } from "react";
import CultureRadarChart from "./CultureRadarChart";
import WellbeingBarChart from "./WellbeingBarChart";
import CwDetailDialog from "./CwDetailDialog";
import { KATEGORI_KESEJAHTERAAN_COLOR } from "./cwColors";
import { TIPE_BUDAYA_INFO, arahTeks, ARAH_ICON } from "./cwMeta";
import { useReveal, useCountUp } from "./cwHooks";
import styles from "./CwLaporanAgregatPage.module.css";

/**
 * Palet kartu pastel dari token pastel kategori yang sudah ada di tokens.css
 * (--lilac/--sun/--mint/--sky) -- padanan FIR untuk kartu lavender/peach/lime di benchmark.
 */
const CULTURE_CARD_STYLE = [
  { bg: "var(--lilac-soft)", ink: "var(--lilac-ink)" },
  { bg: "var(--sun-soft)", ink: "var(--sun-ink)" },
  { bg: "var(--mint-soft)", ink: "var(--mint-ink)" },
  { bg: "var(--sky-soft)", ink: "var(--sky-ink)" },
];

const PRIORITAS_STYLE = [
  { bg: "var(--lilac-soft)", ink: "var(--lilac-ink)", icon: "🔥" },
  { bg: "var(--sun-soft)", ink: "var(--sun-ink)", icon: "💡" },
  { bg: "var(--sky-soft)", ink: "var(--sky-ink)", icon: "🧭" },
];

const PRIORITAS_LABEL = { 1: "Prioritas tinggi", 2: "Prioritas sedang", 3: "Prioritas rendah" };

function periodeLabel(periodeId) {
  if (!periodeId) return "";
  const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const [y, m] = periodeId.split("-").map(Number);
  return `${BULAN[m - 1] || ""} ${y}`.trim();
}

/** Pembungkus reveal: fade + naik halus begitu masuk viewport, dengan jeda bertahap. */
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

/** Sparkline mungil dari deretan nilai, meniru grafik kecil di kartu statistik benchmark. */
function Sparkline({ values = [], width = 96, height = 36 }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / span) * (height - 6) - 3;
    return [x, y];
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className={styles.spark}>
      <path d={area} fill="var(--purple-100)" opacity="0.7" />
      <path d={line} fill="none" stroke="var(--purple-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Kartu statistik dengan angka yang menghitung naik begitu masuk viewport. */
function StatCard({ value, label, badge, badgeColor, spark, wide }) {
  const [ref, shown] = useReveal();
  const isNumber = typeof value === "number";
  const counted = useCountUp(isNumber ? value : 0, shown);

  return (
    <div
      ref={ref}
      className={`${styles.statCard} ${wide ? styles.statCardWide : ""} ${styles.reveal} ${shown ? styles.revealShown : ""}`}
    >
      <div>
        <p className={styles.statValue}>{isNumber ? counted : value}</p>
        <p className={styles.statLabel}>
          {label}
          {badge && (
            <span
              className={styles.statBadge}
              style={{ color: badgeColor, background: `color-mix(in srgb, ${badgeColor} 14%, transparent)` }}
            >
              {badge}
            </span>
          )}
        </p>
      </div>
      {spark}
    </div>
  );
}

/** Hero gelap: narasi kiri, empat kartu budaya pastel bernomor kanan (bisa diklik). */
function CwDashboardHero({ meta, header, chartData, tabelGap, onSelectBudaya }) {
  const gapByLabel = Object.fromEntries((tabelGap || []).map((g) => [g.label, g]));

  return (
    <Reveal className={styles.heroWrap}>
      <div className={styles.hero}>
        <div className={styles.heroMain}>
          <p className={styles.heroGreeting}>{meta.organisasi_nama} · {periodeLabel(meta.periode_id)}</p>
          <h2 className={styles.heroTitle}>{header.hook}</h2>
          <p className={styles.heroSub}>{header.sub_hook}</p>
          <span className={styles.heroSumber}>Data dari Culture &amp; Wellbeing</span>
        </div>

        <div className={styles.cultureCards}>
          {(chartData || []).map((c, i) => {
            const s = CULTURE_CARD_STYLE[i % CULTURE_CARD_STYLE.length];
            const gap = gapByLabel[c.tipe];
            const info = TIPE_BUDAYA_INFO[c.tipe] || {};
            return (
              <button
                type="button"
                className={styles.cultureCard}
                key={c.tipe}
                style={{ background: s.bg, animationDelay: `${120 + i * 90}ms` }}
                onClick={() => onSelectBudaya({ ...c, gap, info })}
                aria-label={`Lihat detail budaya ${c.tipe}`}
              >
                <div className={styles.cultureCardTop}>
                  <span className={styles.cultureCardNum} style={{ color: s.ink }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.cultureCardGap} style={{ color: s.ink }}>
                    {gap?.nilai_gap != null ? `${gap.nilai_gap > 0 ? "+" : ""}${gap.nilai_gap}` : ""}
                  </span>
                </div>

                <span className={styles.cultureCardIcon} aria-hidden="true">{info.icon}</span>
                <p className={styles.cultureCardTitle} style={{ color: s.ink }}>{c.tipe}</p>
                <p className={styles.cultureCardCaption} style={{ color: s.ink }}>
                  Saat ini {c.saat_ini}% <span aria-hidden="true">|</span> Harapan {c.harapan}%
                </p>

                <div className={styles.cultureBarTrack}>
                  <div className={styles.cultureBarFill} style={{ width: `${c.saat_ini}%`, background: s.ink }} />
                  <span className={styles.cultureBarTarget} style={{ left: `${c.harapan}%`, background: s.ink }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Reveal>
  );
}

/** Baris daftar ber-icon-badge yang bisa diklik, pola "My Assignments" di benchmark. */
function RowButton({ icon, iconBg, title, sub, meta, metaStyle, onClick, delay }) {
  const [ref, shown] = useReveal();
  return (
    <button
      type="button"
      ref={ref}
      className={`${styles.row} ${styles.reveal} ${shown ? styles.revealShown : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <span className={styles.rowIcon} style={{ background: iconBg }} aria-hidden="true">{icon}</span>
      <div className={styles.rowBody}>
        <p className={styles.rowTitle}>{title}</p>
        <p className={styles.rowSub}>{sub}</p>
      </div>
      <span className={styles.rowMeta} style={metaStyle}>{meta}</span>
      <span className={styles.rowChevron} aria-hidden="true">›</span>
    </button>
  );
}

/**
 * CwLaporanAgregatPage -- dashboard pimpinan modul CW (konteks korporat).
 *
 * Tata letak, bentuk kartu, dan radius mengikuti benchmark dashboard di
 * design-reference/.../corporate culture benchmark. Warna seluruhnya token FIR.
 *
 * Interaksi: kartu budaya, baris prioritas, dan baris unit semuanya membuka dialog detail.
 * Animasi reveal + count-up mengikuti kontrak CLAUDE.md ("animasi reveal dan count-up halus"),
 * dan otomatis dilewati kalau sistem user menyetel prefers-reduced-motion.
 */
export default function CwLaporanAgregatPage({ laporan }) {
  const { meta, header, bagian_budaya, bagian_kesejahteraan, perbandingan_antarunit, prioritas_perbaikan, footer } = laporan;
  const kesejahteraanColor = KATEGORI_KESEJAHTERAAN_COLOR[bagian_kesejahteraan.kategori] || "var(--ink-4)";
  const unitRows = perbandingan_antarunit?.rows || [];

  const [budayaDipilih, setBudayaDipilih] = useState(null);
  const [prioritasDipilih, setPrioritasDipilih] = useState(null);
  const [unitDipilih, setUnitDipilih] = useState(null);

  return (
    <div className={styles.page}>
      <CwDashboardHero
        meta={meta}
        header={header}
        chartData={bagian_budaya.chart_data}
        tabelGap={bagian_budaya.tabel_gap}
        onSelectBudaya={setBudayaDipilih}
      />

      <section>
        <h3 className={styles.sectionTitle}>Statistik</h3>
        <div className={styles.statRow}>
          <StatCard value={meta.jumlah_responden} label={<>Karyawan<br />terpetakan</>} />
          <StatCard value={unitRows.length} label={<>Unit<br />dipetakan</>} />
          <StatCard
            wide
            value={bagian_kesejahteraan.indeks}
            label="Indeks kesejahteraan"
            badge={bagian_kesejahteraan.kategori}
            badgeColor={kesejahteraanColor}
            spark={<Sparkline values={bagian_kesejahteraan.chart_data.map((d) => d.nilai)} />}
          />
        </div>
      </section>

      <div className={styles.twoCol}>
        <div className={styles.colStack}>
          <section>
            <h3 className={styles.sectionTitle}>Prioritas Perbaikan</h3>
            <div className={styles.rowList}>
              {(prioritas_perbaikan || []).map((p, i) => {
                const s = PRIORITAS_STYLE[i % PRIORITAS_STYLE.length];
                return (
                  <RowButton
                    key={p.peringkat}
                    delay={i * 70}
                    icon={s.icon}
                    iconBg={s.bg}
                    title={p.action}
                    sub={p.area}
                    meta={PRIORITAS_LABEL[p.peringkat] || `Prioritas ${p.peringkat}`}
                    metaStyle={{ color: s.ink, background: s.bg }}
                    onClick={() => setPrioritasDipilih(p)}
                  />
                );
              })}
            </div>
          </section>

          <section>
            <h3 className={styles.sectionTitle}>Kesejahteraan</h3>
            <Reveal>
              <div className={styles.card}>
                <WellbeingBarChart items={bagian_kesejahteraan.chart_data} />
                <p className={styles.narasi}>{bagian_kesejahteraan.narasi}</p>
              </div>
            </Reveal>
          </section>
        </div>

        <div className={styles.colStack}>
          <section>
            <h3 className={styles.sectionTitle}>Profil Budaya</h3>
            <Reveal>
              <div className={styles.card}>
                <div className={styles.radarWrap}>
                  <CultureRadarChart data={bagian_budaya.chart_data} size={232} />
                </div>
                <p className={styles.narasi}>{bagian_budaya.narasi}</p>
              </div>
            </Reveal>
          </section>

          <section>
            <h3 className={styles.sectionTitle}>Perbandingan Antarunit</h3>
            <div className={styles.rowList}>
              {unitRows.map((r, i) => {
                const color = KATEGORI_KESEJAHTERAAN_COLOR[r.kategori_kesejahteraan] || "var(--ink-4)";
                return (
                  <RowButton
                    key={r.unit}
                    delay={i * 70}
                    icon="🏢"
                    iconBg="var(--purple-050)"
                    title={r.unit}
                    sub={`${r.jumlah_responden} karyawan · budaya ${r.budaya_dominan}`}
                    meta={r.indeks_kesejahteraan}
                    metaStyle={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
                    onClick={() => setUnitDipilih(r)}
                  />
                );
              })}
            </div>
            <p className={styles.narasiPlain}>{perbandingan_antarunit?.narasi}</p>
          </section>
        </div>
      </div>

      <p className={styles.disclaimer}>{footer.disclaimer}</p>

      {budayaDipilih && (
        <CwDetailDialog
          icon={budayaDipilih.info?.icon}
          eyebrow="Tipe Budaya"
          title={budayaDipilih.tipe}
          subtitle={budayaDipilih.info?.ringkas}
          onClose={() => setBudayaDipilih(null)}
        >
          <section>
            <p className={styles.dialogSectionTitle}>Apa artinya</p>
            <p className={styles.dialogText}>{budayaDipilih.info?.deskripsi}</p>
          </section>

          <section>
            <p className={styles.dialogSectionTitle}>Angka periode ini</p>
            <div className={styles.dialogStats}>
              <div className={styles.dialogStat}>
                <span className={styles.dialogStatValue}>{budayaDipilih.saat_ini}%</span>
                <span className={styles.dialogStatLabel}>Saat ini</span>
              </div>
              <div className={styles.dialogStat}>
                <span className={styles.dialogStatValue}>{budayaDipilih.harapan}%</span>
                <span className={styles.dialogStatLabel}>Harapan</span>
              </div>
              <div className={styles.dialogStat}>
                <span className={styles.dialogStatValue}>
                  {budayaDipilih.gap?.nilai_gap != null
                    ? `${budayaDipilih.gap.nilai_gap > 0 ? "+" : ""}${budayaDipilih.gap.nilai_gap}`
                    : "—"}
                </span>
                <span className={styles.dialogStatLabel}>
                  Gap {ARAH_ICON[budayaDipilih.gap?.arah] || ""}
                </span>
              </div>
            </div>
            <p className={styles.dialogText}>{arahTeks(budayaDipilih.gap?.arah)}</p>
          </section>
        </CwDetailDialog>
      )}

      {prioritasDipilih && (
        <CwDetailDialog
          icon="🎯"
          eyebrow={PRIORITAS_LABEL[prioritasDipilih.peringkat] || "Prioritas"}
          title={prioritasDipilih.action}
          subtitle={prioritasDipilih.area}
          onClose={() => setPrioritasDipilih(null)}
        >
          <section>
            <p className={styles.dialogSectionTitle}>Kenapa ini muncul</p>
            <p className={styles.dialogText}>{prioritasDipilih.trigger_desc}</p>
          </section>
        </CwDetailDialog>
      )}

      {unitDipilih && (
        <CwDetailDialog
          icon="🏢"
          eyebrow="Unit"
          title={unitDipilih.unit}
          subtitle={`${unitDipilih.jumlah_responden} karyawan mengisi asesmen`}
          onClose={() => setUnitDipilih(null)}
        >
          <section>
            <p className={styles.dialogSectionTitle}>Ringkasan unit</p>
            <div className={styles.dialogStats}>
              <div className={styles.dialogStat}>
                <span className={styles.dialogStatValue}>{unitDipilih.indeks_kesejahteraan}</span>
                <span className={styles.dialogStatLabel}>Indeks kesejahteraan</span>
              </div>
              <div className={styles.dialogStat}>
                <span className={styles.dialogStatValue}>{unitDipilih.budaya_dominan}</span>
                <span className={styles.dialogStatLabel}>Budaya dominan</span>
              </div>
              <div className={styles.dialogStat}>
                <span className={styles.dialogStatValue}>{unitDipilih.kategori_kesejahteraan}</span>
                <span className={styles.dialogStatLabel}>Kategori</span>
              </div>
            </div>
          </section>
          <section>
            <p className={styles.dialogSectionTitle}>Catatan</p>
            <p className={styles.dialogText}>
              Rincian per karyawan tidak ditampilkan di sini. Buka tab Laporan Individu untuk
              melihat laporan per orang.
            </p>
          </section>
        </CwDetailDialog>
      )}
    </div>
  );
}

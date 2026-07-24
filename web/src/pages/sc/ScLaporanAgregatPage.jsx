import { useState } from "react";
import ScRadarChart from "./ScRadarChart";
import ScBarList from "./ScBarList";
import ScDetailDialog from "./ScDetailDialog";
import { ScPieBudayaDominan, ScDistribusiArahChart, ScStripPlot, ScDonutKategoriWellbeing, ScHeatmapGrid, ScScatterChart, ScTemaEsaiList, ScTrenLineChart } from "./ScAnalisisCharts";
import { KATEGORI_NILAI_COLOR } from "./scColors";
import {
  TIPE_BUDAYA_INFO, DIMENSI_PROFIL_INFO, arahTeks, implikasiBudaya, ARAH_ICON,
  interpretasiKesejahteraan, toneKesejahteraan, METODOLOGI_NOTE,
} from "./scMeta";
import { useReveal, useCountUp } from "./scHooks";
import styles from "./ScLaporanAgregatPage.module.css";

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

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function periodeLabel(periodeId) {
  if (!periodeId) return "";
  const [y, m] = String(periodeId).split("-").map(Number);
  return `${BULAN[m - 1] || ""} ${y}`.trim();
}

function fmtGap(nilai) {
  if (nilai == null) return "—";
  return `${nilai > 0 ? "+" : ""}${nilai}`;
}

/** Tipe budaya dengan nilai saat_ini tertinggi. */
function budayaDominan(chartData) {
  return (chartData || []).reduce((acc, d) => (acc == null || d.saat_ini > acc.saat_ini ? d : acc), null);
}

/** Gap dengan selisih absolut terbesar -- fokus perbaikan budaya paling mendesak. */
function gapTerbesar(tabelGap) {
  return [...(tabelGap || [])].sort((a, b) => Math.abs(b.nilai_gap ?? 0) - Math.abs(a.nilai_gap ?? 0))[0] || null;
}

/** Item dengan nilai terendah/tertinggi dari daftar {nilai}. */
function ekstrem(items) {
  const list = items || [];
  if (list.length === 0) return { terendah: null, tertinggi: null };
  const sorted = [...list].sort((a, b) => a.nilai - b.nilai);
  return { terendah: sorted[0], tertinggi: sorted[sorted.length - 1] };
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

/** Kartu statistik: angka menghitung naik, seluruh kartu bisa diklik. */
function StatCard({ value, unit, label, badge, badgeColor, hint, spark, wide, onClick }) {
  const [ref, shown] = useReveal();
  const isNumber = typeof value === "number";
  const counted = useCountUp(isNumber ? value : 0, shown);

  return (
    <button
      type="button"
      ref={ref}
      onClick={onClick}
      className={`${styles.statCard} ${wide ? styles.statCardWide : ""} ${styles.reveal} ${shown ? styles.revealShown : ""}`}
    >
      <div className={styles.statBody}>
        <p className={styles.statValue}>
          {isNumber ? counted : value}
          {unit && <span className={styles.statUnit}>{unit}</span>}
        </p>
        <p className={styles.statLabel}>{label}</p>
        {badge && (
          <span
            className={styles.statBadge}
            style={{ color: badgeColor, background: `color-mix(in srgb, ${badgeColor} 14%, transparent)` }}
          >
            {badge}
          </span>
        )}
        {hint && <p className={styles.statHint}>{hint}</p>}
      </div>
      {spark}
      <span className={styles.statChevron} aria-hidden="true">›</span>
    </button>
  );
}

/** Hero gelap: ringkasan eksekutif kiri, empat kartu budaya pastel bernomor kanan. */
function ScDashboardHero({ meta, header, chartData, tabelGap, onSelectBudaya, onOpenRingkasan }) {
  const gapByLabel = Object.fromEntries((tabelGap || []).map((g) => [g.label, g]));

  return (
    <Reveal className={styles.heroWrap}>
      <div className={styles.hero}>
        <div className={styles.heroMain}>
          <p className={styles.heroGreeting}>
            {meta.organisasi_nama} · {periodeLabel(meta.periode_id)} · {meta.jumlah_responden} responden
          </p>
          <h2 className={styles.heroTitle}>{header.hook}</h2>
          <p className={styles.heroSub}>{header.sub_hook}</p>
          <button type="button" className={styles.heroCta} onClick={onOpenRingkasan}>
            Baca ringkasan eksekutif <span aria-hidden="true">↗</span>
          </button>
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
              >
                <div className={styles.cultureCardTop}>
                  <span className={styles.cultureCardNum} style={{ color: s.ink }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.cultureCardGap} style={{ color: s.ink }}>
                    {ARAH_ICON[gap?.arah] || ""} {fmtGap(gap?.nilai_gap)}
                  </span>
                </div>

                <span className={styles.cultureCardIcon} aria-hidden="true">{info.icon}</span>
                <p className={styles.cultureCardTitle} style={{ color: s.ink }}>{c.tipe}</p>
                <p className={styles.cultureCardRingkas} style={{ color: s.ink }}>{info.ringkas}</p>
                <p className={styles.cultureCardCaption} style={{ color: s.ink }}>
                  Kini {c.saat_ini}% <span aria-hidden="true">→</span> Harapan {c.harapan}%
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

/** Judul section dengan hint kecil "klik untuk detail" -- memberi tahu konten ini interaktif. */
function SectionTitle({ children, hint }) {
  return (
    <div className={styles.sectionHead}>
      <h3 className={styles.sectionTitle}>{children}</h3>
      {hint && <span className={styles.sectionHint}>{hint}</span>}
    </div>
  );
}

/** Blok angka besar dipakai berulang di berbagai dialog. */
function DialogStats({ items }) {
  return (
    <div className={styles.dialogStats}>
      {items.map((s) => (
        <div className={styles.dialogStat} key={s.label}>
          <span className={styles.dialogStatValue} style={s.color ? { color: s.color } : undefined}>{s.value}</span>
          <span className={styles.dialogStatLabel}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function DialogSection({ title, children }) {
  return (
    <section>
      <p className={styles.dialogSectionTitle}>{title}</p>
      {children}
    </section>
  );
}

/** Kotak sorotan berwarna untuk "apa artinya buat Anda" di dialog. */
function DialogCallout({ tone = "netral", icon, children }) {
  return (
    <div className={`${styles.callout} ${styles[`callout_${tone}`]}`}>
      {icon && <span className={styles.calloutIcon} aria-hidden="true">{icon}</span>}
      <p className={styles.calloutText}>{children}</p>
    </div>
  );
}

/**
 * LangkahTimeline -- Fase E item 13: visual garis waktu untuk langkah konkret satu prioritas
 * perbaikan (bukan daftar bernomor datar seperti sebelumnya). Tiap titik dilabeli jangka
 * waktunya (mis. "Minggu ini"/"Bulan ini"/"3 bulan", apa adanya dari data Gemini -- bukan
 * angka hari 30/60/90 yang dikarang, karena field aslinya teks bebas per periode/role, lihat
 * termWindow di geminiPromptSc.ts).
 */
function LangkahTimeline({ langkah = [] }) {
  return (
    <ol className={styles.timelineList}>
      {langkah.map((l, i) => (
        <li className={styles.timelineItem} key={i}>
          <div className={styles.timelineMarkerCol}>
            <span className={styles.timelineNum}>{i + 1}</span>
            {i < langkah.length - 1 && <span className={styles.timelineLine} />}
          </div>
          <div className={styles.timelineBody}>
            {l.waktu && <span className={styles.timelineBadge}>{l.waktu}</span>}
            <span className={styles.timelineText}>{l.aksi}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * ScLaporanAgregatPage -- dashboard pimpinan modul School Culture (konteks sekolah/yayasan).
 * UI/UX identik dengan pages/cw/CwLaporanAgregatPage.jsx atas instruksi eksplisit pemilik
 * produk, kontennya disesuaikan (tipe budaya, unit sekolah), plus section BARU "Profil
 * Organisasi (6 Dimensi)" yang tidak ada di modul CW korporat.
 */
export default function ScLaporanAgregatPage({ laporan }) {
  const {
    meta, header, bagian_budaya, bagian_kesejahteraan, bagian_profil_organisasi,
    perbandingan_antarunit, prioritas_perbaikan, footer, analisis, tema_esai, tren_kesejahteraan,
  } = laporan;
  const kesejahteraanColor = KATEGORI_NILAI_COLOR[bagian_kesejahteraan.kategori] || "var(--ink-4)";
  const unitRows = perbandingan_antarunit?.rows || [];
  const dimensiProfil = bagian_profil_organisasi?.chart_data || [];

  const [budayaDipilih, setBudayaDipilih] = useState(null);
  const [prioritasDipilih, setPrioritasDipilih] = useState(null);
  const [unitDipilih, setUnitDipilih] = useState(null);
  const [subdimensiDipilih, setSubdimensiDipilih] = useState(null);
  const [dimensiDipilih, setDimensiDipilih] = useState(null);
  const [infoDipilih, setInfoDipilih] = useState(null);

  const dominan = budayaDominan(bagian_budaya.chart_data);
  const gapTop = gapTerbesar(bagian_budaya.tabel_gap);
  const { terendah, tertinggi } = ekstrem(bagian_kesejahteraan.chart_data);
  const { terendah: dimensiTerendah, tertinggi: dimensiTertinggi } = ekstrem(dimensiProfil);
  const unitTerendah = [...unitRows].sort((a, b) => a.indeks_kesejahteraan - b.indeks_kesejahteraan)[0];
  const unitTertinggi = [...unitRows].sort((a, b) => b.indeks_kesejahteraan - a.indeks_kesejahteraan)[0];

  return (
    <div className={styles.page}>
      <ScDashboardHero
        meta={meta}
        header={header}
        chartData={bagian_budaya.chart_data}
        tabelGap={bagian_budaya.tabel_gap}
        onSelectBudaya={setBudayaDipilih}
        onOpenRingkasan={() => setInfoDipilih("ringkasan")}
      />

      <section>
        <SectionTitle hint="Klik kartu untuk penjelasan">Angka Kunci</SectionTitle>
        <div className={styles.statRow}>
          <StatCard
            value={meta.jumlah_responden}
            label="Staf mengisi asesmen"
            hint={`${unitRows.length} unit kerja`}
            onClick={() => setInfoDipilih("responden")}
          />
          <StatCard
            value={dominan?.saat_ini ?? 0}
            unit="%"
            label={`Budaya dominan: ${dominan?.tipe ?? "—"}`}
            hint={TIPE_BUDAYA_INFO[dominan?.tipe]?.ringkas}
            onClick={() => dominan && setBudayaDipilih({
              ...dominan,
              gap: (bagian_budaya.tabel_gap || []).find((g) => g.label === dominan.tipe),
              info: TIPE_BUDAYA_INFO[dominan.tipe] || {},
            })}
          />
          <StatCard
            value={Math.abs(gapTop?.nilai_gap ?? 0)}
            unit=" poin"
            label={`Gap terbesar: ${gapTop?.label ?? "—"}`}
            hint={arahTeks(gapTop?.arah)}
            onClick={() => {
              const c = (bagian_budaya.chart_data || []).find((x) => x.tipe === gapTop?.label);
              if (c) setBudayaDipilih({ ...c, gap: gapTop, info: TIPE_BUDAYA_INFO[c.tipe] || {} });
            }}
          />
          <StatCard
            wide
            value={bagian_kesejahteraan.indeks}
            label="Indeks kesejahteraan"
            badge={bagian_kesejahteraan.kategori}
            badgeColor={kesejahteraanColor}
            spark={<Sparkline values={bagian_kesejahteraan.chart_data.map((d) => d.nilai)} />}
            onClick={() => setInfoDipilih("indeks")}
          />
        </div>
      </section>

      <div className={styles.twoCol}>
        <div className={styles.colStack}>
          <section>
            <SectionTitle hint="Klik untuk langkah konkret">Prioritas Perbaikan</SectionTitle>
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
            <SectionTitle hint="Klik baris untuk detail">Kesejahteraan per Subdimensi</SectionTitle>
            <Reveal>
              <div className={styles.card}>
                <ScBarList
                  items={bagian_kesejahteraan.chart_data}
                  onSelectItem={setSubdimensiDipilih}
                />
                <div className={styles.cardFootNote}>
                  <span className={styles.cardFootStrong}>Terkuat:</span> {tertinggi?.label} ({tertinggi?.nilai}%)
                  <span className={styles.cardFootSep}>·</span>
                  <span className={styles.cardFootStrong}>Perlu perhatian:</span> {terendah?.label} ({terendah?.nilai}%)
                </div>
              </div>
            </Reveal>
          </section>
        </div>

        <div className={styles.colStack}>
          <section>
            <SectionTitle hint="Klik grafik untuk penjelasan">Profil Budaya</SectionTitle>
            <Reveal>
              <button type="button" className={styles.cardButton} onClick={() => setInfoDipilih("radar")}>
                <div className={styles.radarWrap}>
                  <ScRadarChart data={bagian_budaya.chart_data} size={236} />
                </div>
                <p className={styles.cardHintLine}>
                  Garis penuh = kondisi sekarang, garis putus-putus = harapan staf.
                  <span className={styles.cardHintCta}> Pelajari cara membacanya ›</span>
                </p>
              </button>
            </Reveal>
          </section>

          <section>
            <SectionTitle hint="Klik unit untuk detail">Perbandingan Antarunit</SectionTitle>
            <div className={styles.rowList}>
              {unitRows.map((r, i) => {
                const color = KATEGORI_NILAI_COLOR[r.kategori_kesejahteraan] || "var(--ink-4)";
                return (
                  <RowButton
                    key={r.unit}
                    delay={i * 70}
                    icon="🏫"
                    iconBg="var(--purple-050)"
                    title={r.unit}
                    sub={`${r.jumlah_responden} staf · budaya ${r.budaya_dominan}`}
                    meta={r.indeks_kesejahteraan}
                    metaStyle={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
                    onClick={() => setUnitDipilih(r)}
                  />
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* ── Profil Organisasi (6 dimensi) -- BARU, tidak ada di modul CW ────── */}
      {dimensiProfil.length > 0 && (
        <section>
          <SectionTitle hint="Klik baris untuk detail">Profil Organisasi · 6 Dimensi</SectionTitle>
          <Reveal>
            <div className={styles.card}>
              <ScBarList items={dimensiProfil} onSelectItem={setDimensiDipilih} />
              {bagian_profil_organisasi?.narasi && (
                <div className={styles.cardFootNote}>{bagian_profil_organisasi.narasi}</div>
              )}
            </div>
          </Reveal>
        </section>
      )}

      {/* ── Insight baru: sebaran dari sc_personal (Blueprint School Culture v2 bagian 3) ──
          Bukan bagian skema LaporanAgregatSC asli -- dilewati kalau `analisis` tidak ada
          (mis. data mock lama), tidak pernah membuat halaman rusak/kosong-tanpa-alasan. */}
      {analisis && (
        <div className={styles.twoCol}>
          <div className={styles.colStack}>
            <section>
              <SectionTitle hint="Seragam atau terbelah?">Distribusi Budaya Staf</SectionTitle>
              <Reveal>
                <div className={styles.card}>
                  <ScPieBudayaDominan pieDominan={analisis.pie_dominan} jumlahResponden={analisis.jumlah_responden_dianalisis} />
                  <div className={styles.cardFootNote}>Persen staf yang tipe budaya dominannya tiap kolom di atas -- rata-rata sekolah bisa menyembunyikan kalau ternyata staf terbelah ke beberapa arah berbeda.</div>
                </div>
              </Reveal>
            </section>

            <section>
              <SectionTitle hint="Membongkar polarisasi">Arah Aspirasi per Tipe</SectionTitle>
              <Reveal>
                <div className={styles.card}>
                  <ScDistribusiArahChart rows={analisis.distribusi_arah} />
                </div>
              </Reveal>
            </section>
          </div>

          <div className={styles.colStack}>
            <section>
              <SectionTitle hint="Tiap titik satu staf">Sebaran Kesejahteraan</SectionTitle>
              <Reveal>
                <div className={styles.card}>
                  <ScStripPlot items={analisis.sebaran_wellbeing} />
                </div>
              </Reveal>
            </section>

            <section>
              <SectionTitle hint="Distribusi kategori indeks">Kategori Kesejahteraan Staf</SectionTitle>
              <Reveal>
                <div className={styles.card}>
                  <ScDonutKategoriWellbeing donutKategori={analisis.donut_kategori_wellbeing} />
                </div>
              </Reveal>
            </section>
          </div>
        </div>
      )}

      {analisis && (
        <section>
          <SectionTitle hint="Dimensi mana kuat di tipe budaya mana">Peta Dimensi × Tipe Budaya</SectionTitle>
          <Reveal>
            <div className={styles.card}>
              <ScHeatmapGrid cells={analisis.heatmap} />
            </div>
          </Reveal>
        </section>
      )}

      {analisis && (
        <section>
          <SectionTitle hint="Budaya dominan vs kesejahteraan per staf">Sebaran Budaya × Kesejahteraan</SectionTitle>
          <Reveal>
            <div className={styles.card}>
              <ScScatterChart points={analisis.scatter_budaya_wellbeing} />
            </div>
          </Reveal>
        </section>
      )}

      {tema_esai && tema_esai.length > 0 && (
        <section>
          <SectionTitle hint="Pola berulang dari jawaban esai staf">Tema dari Suara Staf</SectionTitle>
          <Reveal>
            <div className={styles.card}>
              <ScTemaEsaiList tema={tema_esai} />
            </div>
          </Reveal>
        </section>
      )}

      {tren_kesejahteraan && tren_kesejahteraan.length > 0 && (
        <section>
          <SectionTitle hint="Indeks kesejahteraan lintas periode">Tren Antarperiode</SectionTitle>
          <Reveal>
            <div className={styles.card}>
              <ScTrenLineChart points={tren_kesejahteraan} periodeLabel={periodeLabel} />
            </div>
          </Reveal>
        </section>
      )}

      <p className={styles.disclaimer}>{footer.disclaimer}</p>
      <p className={styles.metodologi}>{METODOLOGI_NOTE}</p>

      {/* ── Dialog: tipe budaya ───────────────────────────────────────────────────────── */}
      {budayaDipilih && (
        <ScDetailDialog
          icon={budayaDipilih.info?.icon}
          eyebrow="Tipe Budaya"
          title={budayaDipilih.tipe}
          subtitle={budayaDipilih.info?.ringkas}
          onClose={() => setBudayaDipilih(null)}
        >
          <DialogSection title="Apa artinya tipe budaya ini">
            <p className={styles.dialogText}>{budayaDipilih.info?.deskripsi}</p>
          </DialogSection>

          <DialogSection title="Angka periode ini">
            <DialogStats
              items={[
                { value: `${budayaDipilih.saat_ini}%`, label: "Dirasakan sekarang" },
                { value: `${budayaDipilih.harapan}%`, label: "Diharapkan staf" },
                {
                  value: `${ARAH_ICON[budayaDipilih.gap?.arah] || ""} ${fmtGap(budayaDipilih.gap?.nilai_gap)}`,
                  label: "Selisih (gap)",
                },
              ]}
            />
            <p className={styles.dialogText}>{arahTeks(budayaDipilih.gap?.arah)}</p>
          </DialogSection>

          <DialogSection title="Apa artinya buat Anda sebagai pimpinan">
            <DialogCallout tone="aksi" icon="🎯">
              {implikasiBudaya(budayaDipilih.tipe, budayaDipilih.gap?.arah)}
            </DialogCallout>
          </DialogSection>

          <p className={styles.dialogFootnote}>
            Angka 0-100 menunjukkan seberapa kuat tipe budaya ini dirasakan, bukan nilai baik/buruk.
            Keempat tipe selalu ada di setiap sekolah, yang berbeda hanya porsinya.
          </p>
        </ScDetailDialog>
      )}

      {/* ── Dialog: prioritas perbaikan ───────────────────────────────────────────────── */}
      {prioritasDipilih && (
        <ScDetailDialog
          icon="🎯"
          eyebrow={PRIORITAS_LABEL[prioritasDipilih.peringkat] || "Prioritas"}
          title={prioritasDipilih.action}
          subtitle={prioritasDipilih.area}
          onClose={() => setPrioritasDipilih(null)}
        >
          <DialogSection title="Kenapa ini muncul">
            <p className={styles.dialogText}>{prioritasDipilih.trigger_desc}</p>
          </DialogSection>

          {prioritasDipilih.langkah?.length > 0 && (
            <DialogSection title="Langkah yang bisa diambil">
              <LangkahTimeline langkah={prioritasDipilih.langkah} />
            </DialogSection>
          )}

          {prioritasDipilih.dampak && (
            <DialogSection title="Dampak yang diharapkan">
              <DialogCallout tone="baik" icon="✓">{prioritasDipilih.dampak}</DialogCallout>
            </DialogSection>
          )}

          <p className={styles.dialogFootnote}>
            Urutan prioritas disusun dari temuan periode ini. Langkah di atas adalah saran awal,
            bukan instruksi baku, sesuaikan dengan konteks dan kapasitas sekolah Anda.
          </p>
        </ScDetailDialog>
      )}

      {/* ── Dialog: unit ──────────────────────────────────────────────────────────────── */}
      {unitDipilih && (() => {
        const color = KATEGORI_NILAI_COLOR[unitDipilih.kategori_kesejahteraan] || "var(--ink-4)";
        const selisih = unitDipilih.indeks_kesejahteraan - bagian_kesejahteraan.indeks;
        const info = TIPE_BUDAYA_INFO[unitDipilih.budaya_dominan] || {};
        return (
          <ScDetailDialog
            icon="🏫"
            eyebrow="Unit Kerja"
            title={unitDipilih.unit}
            subtitle={`${unitDipilih.jumlah_responden} staf mengisi asesmen`}
            onClose={() => setUnitDipilih(null)}
          >
            <DialogSection title="Ringkasan unit">
              <DialogStats
                items={[
                  { value: unitDipilih.indeks_kesejahteraan, label: "Indeks kesejahteraan", color },
                  { value: unitDipilih.kategori_kesejahteraan, label: "Kategori", color },
                  { value: `${selisih > 0 ? "+" : ""}${selisih}`, label: "vs rata-rata sekolah" },
                ]}
              />
              <p className={styles.dialogText}>
                Indeks sekolah secara keseluruhan {bagian_kesejahteraan.indeks}, jadi unit ini{" "}
                {selisih > 0
                  ? `berada ${selisih} poin DI ATAS rata-rata.`
                  : selisih < 0
                    ? `berada ${Math.abs(selisih)} poin DI BAWAH rata-rata.`
                    : "persis di rata-rata sekolah."}
              </p>
            </DialogSection>

            <DialogSection title={`Budaya dominan: ${unitDipilih.budaya_dominan}`}>
              <p className={styles.dialogText}>{info.deskripsi}</p>
            </DialogSection>

            <DialogSection title="Apa artinya buat Anda sebagai pimpinan">
              <DialogCallout
                tone={selisih < -8 ? "waspada" : selisih > 8 ? "baik" : "netral"}
                icon={selisih < -8 ? "⚠️" : selisih > 8 ? "✓" : "•"}
              >
                {interpretasiKesejahteraan(unitDipilih.kategori_kesejahteraan)}
                {unitTerendah && unitDipilih.unit === unitTerendah.unit
                  ? " Ini unit dengan kesejahteraan terendah di sekolah, jadikan fokus utama periode ini."
                  : ""}
                {unitTertinggi && unitDipilih.unit === unitTertinggi.unit
                  ? " Ini unit dengan kesejahteraan tertinggi, praktik baiknya layak ditularkan ke unit lain."
                  : ""}
              </DialogCallout>
            </DialogSection>

            <p className={styles.dialogFootnote}>
              Rincian per staf tidak ditampilkan di sini. Buka tab Laporan Individu untuk melihat
              laporan per orang.
            </p>
          </ScDetailDialog>
        );
      })()}

      {/* ── Dialog: subdimensi kesejahteraan ──────────────────────────────────────────── */}
      {subdimensiDipilih && (() => {
        const color = KATEGORI_NILAI_COLOR[subdimensiDipilih.kategori] || "var(--ink-4)";
        const selisih = subdimensiDipilih.nilai - bagian_kesejahteraan.indeks;
        const tone = ["Sangat Rendah", "Rendah"].includes(subdimensiDipilih.kategori)
          ? "waspada"
          : subdimensiDipilih.kategori === "Sedang" ? "netral" : "baik";
        return (
          <ScDetailDialog
            icon="💚"
            eyebrow="Subdimensi Kesejahteraan"
            title={subdimensiDipilih.label}
            subtitle={`${subdimensiDipilih.nilai}% · ${subdimensiDipilih.kategori}`}
            onClose={() => setSubdimensiDipilih(null)}
          >
            <DialogSection title="Angka periode ini">
              <DialogStats
                items={[
                  { value: `${subdimensiDipilih.nilai}%`, label: "Skor subdimensi", color },
                  { value: subdimensiDipilih.kategori, label: "Kategori", color },
                  { value: `${selisih > 0 ? "+" : ""}${selisih}`, label: "vs indeks keseluruhan" },
                ]}
              />
            </DialogSection>

            <DialogSection title="Apa artinya buat Anda sebagai pimpinan">
              <DialogCallout tone={tone} icon={tone === "waspada" ? "⚠️" : tone === "baik" ? "✓" : "•"}>
                {interpretasiKesejahteraan(subdimensiDipilih.kategori)}
              </DialogCallout>
            </DialogSection>

            <p className={styles.dialogFootnote}>
              Skor 0-100 adalah rata-rata seluruh {meta.jumlah_responden} responden. Angka rendah
              di satu subdimensi tidak otomatis berarti masalah besar, lihat bersama subdimensi
              lain dan pola antarunit.
            </p>
          </ScDetailDialog>
        );
      })()}

      {/* ── Dialog: dimensi profil organisasi ──────────────────────────────────────────── */}
      {dimensiDipilih && (() => {
        const info = DIMENSI_PROFIL_INFO[dimensiDipilih.kode] || {};
        return (
          <ScDetailDialog
            icon={info.icon || "🏫"}
            eyebrow="Profil Organisasi"
            title={dimensiDipilih.label}
            subtitle={`${dimensiDipilih.nilai}% · ${dimensiDipilih.kategori}`}
            onClose={() => setDimensiDipilih(null)}
          >
            <DialogSection title="Apa artinya">
              <p className={styles.dialogText}>{info.deskripsi}</p>
            </DialogSection>

            <DialogSection title="Apa artinya buat Anda sebagai pimpinan">
              <DialogCallout tone={toneKesejahteraan(dimensiDipilih.kategori)} icon="•">
                {interpretasiKesejahteraan(dimensiDipilih.kategori)}
                {dimensiTerendah && dimensiDipilih.kode === dimensiTerendah.kode
                  ? " Ini dimensi paling rendah dari keenam dimensi, jadikan fokus perbaikan."
                  : ""}
                {dimensiTertinggi && dimensiDipilih.kode === dimensiTertinggi.kode
                  ? " Ini dimensi paling kuat, jadikan contoh praktik baik."
                  : ""}
              </DialogCallout>
            </DialogSection>

            <p className={styles.dialogFootnote}>
              Angka ini rata-rata dari keempat tipe budaya khusus untuk dimensi {dimensiDipilih.label},
              bukan skor terpisah dari radar budaya.
            </p>
          </ScDetailDialog>
        );
      })()}

      {/* ── Dialog: penjelasan umum (ringkasan, angka kunci, cara baca radar) ─────────── */}
      {infoDipilih === "ringkasan" && (
        <ScDetailDialog
          icon="📋"
          eyebrow="Ringkasan Eksekutif"
          title={`${meta.organisasi_nama}`}
          subtitle={`${periodeLabel(meta.periode_id)} · ${meta.jumlah_responden} responden · ${unitRows.length} unit`}
          onClose={() => setInfoDipilih(null)}
        >
          <DialogSection title="Kesimpulan utama">
            <p className={styles.dialogText}>{header.hook} {header.sub_hook}</p>
          </DialogSection>

          <DialogSection title="Budaya kerja">
            <p className={styles.dialogText}>{bagian_budaya.narasi}</p>
          </DialogSection>

          <DialogSection title="Kesejahteraan">
            <p className={styles.dialogText}>{bagian_kesejahteraan.narasi}</p>
          </DialogSection>

          <DialogSection title="Perbedaan antarunit">
            <p className={styles.dialogText}>{perbandingan_antarunit?.narasi}</p>
          </DialogSection>

          <DialogSection title="Tiga hal yang paling perlu ditindaklanjuti">
            <ol className={styles.langkahList}>
              {(prioritas_perbaikan || []).map((p) => (
                <li className={styles.langkahItem} key={p.peringkat}>
                  <span className={styles.langkahNum}>{p.peringkat}</span>
                  <span className={styles.langkahText}>
                    <strong>{p.action}</strong>
                    <span className={styles.langkahArea}> {p.area}</span>
                  </span>
                </li>
              ))}
            </ol>
          </DialogSection>
        </ScDetailDialog>
      )}

      {infoDipilih === "responden" && (
        <ScDetailDialog
          icon="👥"
          eyebrow="Angka Kunci"
          title="Staf yang mengisi asesmen"
          subtitle={`${meta.jumlah_responden} responden dari ${unitRows.length} unit`}
          onClose={() => setInfoDipilih(null)}
        >
          <DialogSection title="Sebaran per unit">
            <div className={styles.rowListPlain}>
              {unitRows.map((r) => {
                const pct = Math.round((r.jumlah_responden / meta.jumlah_responden) * 100);
                return (
                  <div className={styles.miniRow} key={r.unit}>
                    <span className={styles.miniRowLabel}>{r.unit}</span>
                    <div className={styles.miniRowTrack}>
                      <div className={styles.miniRowFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.miniRowVal}>{r.jumlah_responden}</span>
                    <span className={styles.miniRowPct}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </DialogSection>

          <DialogSection title="Kenapa jumlah responden penting">
            <p className={styles.dialogText}>
              Makin banyak staf yang mengisi, makin dapat dipercaya gambaran yang muncul. Unit
              dengan responden sedikit perlu dibaca lebih hati-hati: satu-dua jawaban ekstrem
              bisa menggeser angkanya cukup jauh.
            </p>
          </DialogSection>
        </ScDetailDialog>
      )}

      {infoDipilih === "indeks" && (
        <ScDetailDialog
          icon="💚"
          eyebrow="Angka Kunci"
          title="Indeks Kesejahteraan"
          subtitle={`${bagian_kesejahteraan.indeks} · ${bagian_kesejahteraan.kategori}`}
          onClose={() => setInfoDipilih(null)}
        >
          <DialogSection title="Cara membacanya">
            <p className={styles.dialogText}>
              Indeks ini gabungan dari {bagian_kesejahteraan.chart_data.length} subdimensi di skala
              0-100. Makin tinggi makin baik. Angka gabungan berguna untuk melihat arah umum, tapi
              keputusan sebaiknya diambil dari subdimensi dan unit mana yang menariknya turun.
            </p>
          </DialogSection>

          <DialogSection title="Yang menopang dan yang menekan">
            <DialogStats
              items={[
                { value: `${tertinggi?.nilai}%`, label: `Terkuat: ${tertinggi?.label}`, color: "var(--cw-nilai-sangat-tinggi)" },
                { value: `${terendah?.nilai}%`, label: `Terlemah: ${terendah?.label}`, color: "var(--cw-nilai-rendah)" },
                { value: bagian_kesejahteraan.indeks, label: "Indeks gabungan", color: kesejahteraanColor },
              ]}
            />
          </DialogSection>

          <DialogSection title="Apa artinya buat Anda sebagai pimpinan">
            <DialogCallout tone="netral" icon="•">
              {interpretasiKesejahteraan(bagian_kesejahteraan.kategori)}
              {terendah ? ` Titik masuk paling logis: ${terendah.label}, subdimensi terlemah saat ini.` : ""}
            </DialogCallout>
          </DialogSection>
        </ScDetailDialog>
      )}

      {infoDipilih === "radar" && (
        <ScDetailDialog
          icon="🧭"
          eyebrow="Profil Budaya"
          title="Cara membaca grafik ini"
          subtitle="Empat tipe budaya sekolah (kerangka OCAI)"
          onClose={() => setInfoDipilih(null)}
        >
          <DialogSection title="Dua garis, dua makna">
            <p className={styles.dialogText}>
              <strong>Garis penuh</strong> menggambarkan budaya yang staf RASAKAN sekarang.{" "}
              <strong>Garis putus-putus</strong> menggambarkan budaya yang mereka HARAPKAN. Jarak
              antara keduanya di satu sumbu itulah yang disebut gap.
            </p>
          </DialogSection>

          <DialogSection title="Empat sumbu">
            <div className={styles.rowListPlain}>
              {(bagian_budaya.chart_data || []).map((c) => {
                const info = TIPE_BUDAYA_INFO[c.tipe] || {};
                const g = (bagian_budaya.tabel_gap || []).find((x) => x.label === c.tipe);
                return (
                  <div className={styles.axisRow} key={c.tipe}>
                    <span className={styles.axisIcon} aria-hidden="true">{info.icon}</span>
                    <div>
                      <p className={styles.axisTitle}>{c.tipe} <span className={styles.axisRingkas}>{info.ringkas}</span></p>
                      <p className={styles.axisMeta}>
                        Kini {c.saat_ini}% → harapan {c.harapan}% ({ARAH_ICON[g?.arah] || ""} {fmtGap(g?.nilai_gap)})
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogSection>

          <DialogSection title="Yang perlu diingat">
            <DialogCallout tone="netral" icon="•">
              Tidak ada tipe budaya yang "paling benar". Bentuk ideal berbeda tiap sekolah dan
              tiap unit. Yang lebih berguna dibaca adalah selisih antara kondisi sekarang dan
              harapan staf, bukan tinggi-rendahnya satu sumbu.
            </DialogCallout>
          </DialogSection>
        </ScDetailDialog>
      )}
    </div>
  );
}

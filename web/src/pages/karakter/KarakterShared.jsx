import { useEffect, useId, useState } from "react";
import BriefingHero from "../../components/BriefingHero";
import RadarChart from "../../components/charts/RadarChart";
import GroupedBarChart from "../../components/charts/GroupedBarChart";
import { supabase } from "../../lib/supabase";
import styles from "./KarakterShared.module.css";
import {
  ringkasanAspekValue, aspekIcon, periodeLabel, pct, classifyPencapaian,
  extractPlainText, isBlankEssay, KATEGORI_PERNYATAAN_OPTIONS, DUKUNGAN_OPTIONS, HAL_DISYUKURI_OPTIONS,
  countMultiValue, matchedCategoryTags, matchedOptions, countEmosi,
} from "./karakterMeta";

const ENTITY_COLOR_VARS = ["--dv-1", "--dv-2", "--dv-3", "--dv-4", "--dv-5", "--dv-6", "--dv-7", "--dv-8"];

/** Tempel warna pembeda entitas (kelas/sekolah) ke daftar, dipakai khusus perbandingan, beda dari warna aspek. */
export function withEntityColor(items = []) {
  return items.map((it, i) => ({ ...it, color: `var(${ENTITY_COLOR_VARS[i % ENTITY_COLOR_VARS.length]})` }));
}

/** Loading / error state, gaya sama dengan MIPage. */
export function KarakterStateBox({ loading, error, onRetry, loadingLabel }) {
  if (loading) {
    return (
      <div className={styles.stateBox}>
        <div className={styles.spinner} />
        <p className={styles.stateMsg}>{loadingLabel || "Memuat data Rapor Karakter…"}</p>
      </div>
    );
  }
  return (
    <div className={styles.stateBox}>
      <div className={styles.stateIcon}>!</div>
      <h3 className={styles.stateTitle}>Gagal memuat data</h3>
      <p className={styles.stateMsg}>{error}</p>
      {onRetry && <button className={styles.retryBtn} onClick={onRetry}>Coba lagi</button>}
    </div>
  );
}

/**
 * BriefingHero kalau ada baris briefing yang disetujui, kalau belum ada
 * tampilkan catatan tenang, BUKAN angka contoh yang seolah temuan nyata.
 *
 * Trigger Gemini SENGAJA tidak ada di sini -- itu wewenang AdminFammi lewat layar Gemini di
 * Admin CMS (generate lalu masuk Antrian Persetujuan), bukan tombol yang bisa dipencet sekolah.
 */
export function BriefingOrEmpty({ briefing, periode, tipePeriode = "Bulanan", label }) {
  if (briefing) {
    return (
      <BriefingHero
        teks={briefing.teks}
        periode={periode}
        tipePeriode={tipePeriode}
        sumber={briefing.sumber || ["Rapor Karakter"]}
      />
    );
  }

  return (
    <div className={styles.briefingEmpty}>
      <span className={styles.briefingEmptyIcon}>💬</span>
      <div>
        <span className={styles.briefingEmptyLabel}>{label || "Rapor Karakter"}</span>
        <p className={styles.briefingEmptyText}>
          Briefing naratif untuk periode ini belum tersedia. Data di bawah sudah final dan bisa dibaca,
          ringkasan naratifnya menyusul setelah ditinjau.
        </p>
      </div>
    </div>
  );
}

/** Radar 6 (atau berapa pun) aspek karakter, nilainya dibaca langsung dari ringkasan karakter_summary. */
export function AspekRadarCard({ title, subtitle, aspek, ringkasan, prefix = "input_guru_", size = 260 }) {
  if (!aspek || aspek.length === 0) {
    return (
      <div className={styles.card}>
        <p className={styles.cardTitle}>{title}</p>
        {subtitle && <p className={styles.cardSub}>{subtitle}</p>}
        <p className={styles.briefingEmptyText}>Konfigurasi aspek karakter belum tersedia untuk sekolah ini.</p>
      </div>
    );
  }

  const axes = aspek.map((a) => ({
    label: a.aspek_label,
    short: a.aspek_label.split(" ")[0],
    value: ringkasanAspekValue(ringkasan, a.aspek_kode, prefix) || 0,
    max: 100,
    color: a.color,
  }));

  return (
    <div className={styles.card}>
      <p className={styles.cardTitle}>{title}</p>
      {subtitle && <p className={styles.cardSub}>{subtitle}</p>}
      <div className={styles.radarWrap}>
        <RadarChart axes={axes} size={size} />
      </div>
      <div className={styles.legend}>
        {aspek.map((a) => (
          <span
            key={a.aspek_kode}
            className={styles.legendItem}
            style={{ background: `color-mix(in srgb, ${a.color} 14%, transparent)`, color: a.color }}
          >
            <span aria-hidden="true">{aspekIcon(a.aspek_label)}</span>
            {a.aspek_label}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Radar overlay untuk bandingkan beberapa kelas/sekolah sekaligus di satu grafik.
 * entities: [{ id, nama, ringkasan, prefix, color }] — prefix beda tergantung level
 * data (input_guru_ untuk kelas, rata_input_guru_ untuk jenjang/sekolah).
 */
export function CompareRadarCard({ title, subtitle, aspek, entities, size = 280 }) {
  if (!aspek || aspek.length === 0 || !entities || entities.length === 0) {
    return (
      <div className={styles.card}>
        <p className={styles.cardTitle}>{title}</p>
        {subtitle && <p className={styles.cardSub}>{subtitle}</p>}
        <p className={styles.briefingEmptyText}>Belum cukup data untuk perbandingan.</p>
      </div>
    );
  }

  const series = entities.map((e) => ({
    name: e.nama,
    color: e.color,
    axes: aspek.map((a) => ({
      label: a.aspek_label,
      short: a.aspek_label.split(" ")[0],
      value: ringkasanAspekValue(e.ringkasan, a.aspek_kode, e.prefix) || 0,
      max: 100,
    })),
  }));

  return (
    <div className={styles.card}>
      <p className={styles.cardTitle}>{title}</p>
      {subtitle && <p className={styles.cardSub}>{subtitle}</p>}
      <div className={styles.radarWrap}>
        <RadarChart series={series} size={size} />
      </div>
    </div>
  );
}

/**
 * Bar chart dikelompokkan per aspek, dipakai kalau entitas yang dibandingkan
 * lebih dari 3-4 (radar overlay mulai sulit dibaca).
 */
export function CompareBarSection({ title, subtitle, aspek, entities }) {
  if (!aspek || aspek.length === 0 || !entities || entities.length === 0) {
    return (
      <div className={styles.card}>
        <p className={styles.cardTitle}>{title}</p>
        {subtitle && <p className={styles.cardSub}>{subtitle}</p>}
        <p className={styles.briefingEmptyText}>Belum cukup data untuk perbandingan.</p>
      </div>
    );
  }

  const categories = aspek.map((a) => ({ key: a.aspek_kode, label: a.aspek_label }));
  const series = entities.map((e) => ({
    name: e.nama,
    color: e.color,
    values: Object.fromEntries(aspek.map((a) => [a.aspek_kode, ringkasanAspekValue(e.ringkasan, a.aspek_kode, e.prefix) || 0])),
  }));

  return (
    <div className={styles.card}>
      <p className={styles.cardTitle}>{title}</p>
      {subtitle && <p className={styles.cardSub}>{subtitle}</p>}
      <GroupedBarChart categories={categories} series={series} />
    </div>
  );
}

/**
 * Satu kartu perbandingan lengkap: bento chip untuk pilih entitas yang mau ditumpuk
 * di radar, plus rincian angka per aspek yang bisa dibuka/tutup (default tertutup
 * supaya tidak langsung penuh angka). Full-width, bukan disempitkan di grid 2 kolom,
 * supaya tidak berantakan waktu entitasnya banyak.
 *
 * allEntities: [{ id, nama, ringkasan, prefix, color }] — semua opsi yang bisa dipilih.
 * defaultActiveIds: id yang tercentang begitu kartu dibuka.
 */
export function CompareSection({ title, subtitle, aspek, allEntities, defaultActiveIds }) {
  const [activeIds, setActiveIds] = useState(() => new Set(defaultActiveIds || allEntities.slice(0, 4).map((e) => e.id)));
  const [showDetail, setShowDetail] = useState(false);

  if (!aspek || aspek.length === 0 || !allEntities || allEntities.length === 0) {
    return (
      <div className={styles.card}>
        <p className={styles.cardTitle}>{title}</p>
        {subtitle && <p className={styles.cardSub}>{subtitle}</p>}
        <p className={styles.briefingEmptyText}>Belum cukup data untuk perbandingan.</p>
      </div>
    );
  }

  function toggle(id) {
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id); // minimal 1 entitas tetap tampil
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const activeEntities = allEntities.filter((e) => activeIds.has(e.id));

  return (
    <div className={styles.card}>
      <p className={styles.cardTitle}>{title}</p>
      {subtitle && <p className={styles.cardSub}>{subtitle}</p>}

      <div className={styles.entityChipRow}>
        {allEntities.map((e) => {
          const active = activeIds.has(e.id);
          const skorRata = Math.round(
            aspek.reduce((sum, a) => sum + (ringkasanAspekValue(e.ringkasan, a.aspek_kode, e.prefix) || 0), 0) / aspek.length
          );
          return (
            <button
              key={e.id}
              type="button"
              className={`${styles.entityChip} ${active ? styles.entityChipActive : ""}`}
              onClick={() => toggle(e.id)}
            >
              <span className={styles.entityChipDot} style={{ background: e.color }} />
              {e.nama}
              <span className={styles.entityChipVal}>{skorRata}%</span>
            </button>
          );
        })}
      </div>

      <CompareRadarCardInner aspek={aspek} entities={activeEntities} />

      <button type="button" className={styles.detailToggle} onClick={() => setShowDetail((v) => !v)}>
        {showDetail ? "▾ Sembunyikan rincian angka" : "▸ Lihat rincian angka per aspek"}
      </button>

      {showDetail && (
        <div style={{ marginTop: 14 }}>
          <GroupedBarChart
            categories={aspek.map((a) => ({ key: a.aspek_kode, label: a.aspek_label }))}
            series={activeEntities.map((e) => ({
              name: e.nama,
              color: e.color,
              values: Object.fromEntries(aspek.map((a) => [a.aspek_kode, ringkasanAspekValue(e.ringkasan, a.aspek_kode, e.prefix) || 0])),
            }))}
          />
        </div>
      )}
    </div>
  );
}

/** Radar polos tanpa bungkus card, dipakai di dalam CompareSection yang sudah punya card sendiri. */
function CompareRadarCardInner({ aspek, entities }) {
  if (entities.length === 0) return <p className={styles.briefingEmptyText}>Pilih minimal satu entitas untuk dibandingkan.</p>;
  const series = entities.map((e) => ({
    name: e.nama,
    color: e.color,
    axes: aspek.map((a) => ({
      label: a.aspek_label,
      short: a.aspek_label.split(" ")[0],
      value: ringkasanAspekValue(e.ringkasan, a.aspek_kode, e.prefix) || 0,
      max: 100,
    })),
  }));
  return (
    <div className={styles.radarWrap}>
      <RadarChart series={series} size={300} />
    </div>
  );
}

/** Kartu penutup ala CTA, menonjolkan satu tindak lanjut prioritas tertinggi yang sudah ada. */
export function NextStepCTA({ tindakLanjut }) {
  if (!tindakLanjut || tindakLanjut.length === 0) return null;
  const priorityRank = { tinggi: 0, sedang: 1, rendah: 2 };
  const top = [...tindakLanjut].sort((a, b) => (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3))[0];
  if (!top) return null;

  return (
    <div className={styles.ctaCard}>
      <p className={styles.ctaEyebrow}>🎯 Langkah berikutnya</p>
      <p className={styles.ctaTitle}>{top.action}</p>
      <p className={styles.ctaText}>{top.trigger_desc}</p>
    </div>
  );
}

/** Satu item checklist ber-ikon ✓ dengan aksi (WHAT), kenapa (WHY), cara (HOW). */
function ChecklistBaris({ item }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{
        width: 18, height: 18, borderRadius: 6, flexShrink: 0, marginTop: 1,
        background: "var(--status-safe-bg)", color: "var(--status-safe)",
        display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800,
      }}>✓</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.45 }}>{item.aksi}</div>
        {item.kenapa && (
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.45, marginTop: 2 }}>
            <strong style={{ color: "var(--ink-2)" }}>Kenapa:</strong> {item.kenapa}
          </div>
        )}
        {item.cara && (
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.45, marginTop: 2 }}>
            <strong style={{ color: "var(--ink-2)" }}>Cara:</strong> {item.cara}
          </div>
        )}
      </div>
    </div>
  );
}

/** Satu opsi tindak lanjut terpilih: label + kartu fase 7/30/66 hari berisi checklist. */
function OpsiTerpilihBlok({ opsi }) {
  const fase = Array.isArray(opsi.fase) ? opsi.fase : null;
  const langkahLama = Array.isArray(opsi.langkah) ? opsi.langkah : null;

  return (
    <div style={{ marginBottom: 14 }}>
      {opsi.label && (
        <p style={{ margin: "0 0 8px", fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{opsi.label}</p>
      )}
      {fase ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {fase.map((f, i) => (
            <div key={i} style={{ background: "var(--surface-soft)", borderRadius: 14, padding: "12px 14px" }}>
              <span style={{
                display: "inline-block", marginBottom: 9, padding: "3px 10px", borderRadius: 999,
                fontSize: 11, fontWeight: 800, background: "var(--purple-050)", color: "var(--purple-700)",
              }}>📅 {f.jangka}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {(f.checklist || []).map((c, ci) => <ChecklistBaris key={ci} item={c} />)}
              </div>
            </div>
          ))}
        </div>
      ) : langkahLama ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {langkahLama.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{
                flexShrink: 0, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800,
                background: "var(--purple-050)", color: "var(--purple-700)", whiteSpace: "nowrap",
              }}>{l.jangka}</span>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>{l.aksi}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Isi dialog detail satu tindak lanjut: gambaran situasi + langkah yang dipilih reviewer.
 * langkah_terpilih bisa berupa: array opsi (multi/semua, skema baru), satu objek opsi
 * (skema lama), atau kosong (draf lama sekali, cuma action teks). Semua bentuk dirender.
 */
export function TindakLanjutDetailBody({ item }) {
  const lt = item.langkah_terpilih;
  const opsiList = Array.isArray(lt) ? lt : lt ? [lt] : [];

  return (
    <>
      {item.gambaran && (
        <section>
          <p className={styles.dialogSectionTitle}>Gambaran situasi</p>
          <p className={styles.briefingEmptyText}>{item.gambaran}</p>
        </section>
      )}
      {opsiList.length > 0 ? (
        <section>
          <p className={styles.dialogSectionTitle}>Langkah</p>
          {opsiList.map((opsi, i) => <OpsiTerpilihBlok key={i} opsi={opsi} />)}
        </section>
      ) : (
        <section>
          <p className={styles.dialogSectionTitle}>Aksi</p>
          <p className={styles.briefingEmptyText}>{item.action}</p>
        </section>
      )}
    </>
  );
}

/**
 * Baris bar kecil untuk hitungan kategori (dipakai ParentVoiceBento). Bisa jadi tombol filter
 * (onItemClick diisi) atau murni tampilan (dukungan_dibutuhkan, belum diminta jadi filter).
 */
function StatBarMiniList({ items, emptyText, onItemClick, activeLabel }) {
  const filtered = items.filter((it) => it.count > 0).sort((a, b) => b.count - a.count);
  if (filtered.length === 0) return <p className={styles.briefingEmptyText}>{emptyText || "Belum ada data."}</p>;
  const max = Math.max(...filtered.map((it) => it.count), 1);
  return (
    <div className={styles.pvBarList}>
      {filtered.map((it) => {
        const active = activeLabel === it.label;
        const Tag = onItemClick ? "button" : "div";
        return (
          <Tag
            key={it.label}
            type={onItemClick ? "button" : undefined}
            className={`${styles.pvBarRow} ${onItemClick ? styles.pvBarRowClickable : ""} ${active ? styles.pvBarRowActive : ""}`}
            onClick={onItemClick ? () => onItemClick(it.label) : undefined}
          >
            <span className={styles.pvBarLabel} title={it.label}>{it.icon ? `${it.icon} ` : ""}{it.label}</span>
            <div className={styles.pvBarTrack}>
              <div className={styles.pvBarFill} style={{ width: `${(it.count / max) * 100}%` }} />
            </div>
            <span className={styles.pvBarCount}>{it.count}</span>
          </Tag>
        );
      })}
    </div>
  );
}

const QUOTE_LOAD_STEP = 10;
const KATEGORI_MATCH_BY_LABEL = Object.fromEntries(KATEGORI_PERNYATAAN_OPTIONS.map((o) => [o.label, o.match]));
const DUKUNGAN_MATCH_BY_LABEL = Object.fromEntries(DUKUNGAN_OPTIONS.map((o) => [o.label, o.match]));
const HAL_DISYUKURI_MATCH_BY_LABEL = Object.fromEntries(HAL_DISYUKURI_OPTIONS.map((o) => [o.label, o.match]));
const HAL_DISYUKURI_FULL_BY_LABEL = Object.fromEntries(HAL_DISYUKURI_OPTIONS.map((o) => [o.label, o.full]));
const QUOTE_TONE_CLASS = {
  "Apresiasi": "quoteCardApresiasi",
  "Harapan": "quoteCardHarapan",
  "Saran & Masukan": "quoteCardMasukan",
  "Kritik": "quoteCardKritik",
};
const VOICE_TABS = [
  { id: "testimoni", label: "Testimoni", icon: "💬" },
  { id: "emosi", label: "Emosi Anak", icon: "🙂" },
  { id: "dukungan", label: "Dukungan Dibutuhkan", icon: "🤲" },
  { id: "halDisyukuri", label: "Hal Disyukuri", icon: "🙏" },
];

/** Kolom esai mentah per tab -- tiap dimensi punya sumber teksnya sendiri, bukan berbagi satu kolom. */
function essayFieldForTab(tabId) {
  if (tabId === "testimoni") return "pernyataan";
  if (tabId === "emosi") return "alasan_emosi";
  if (tabId === "dukungan") return "dukungan_lainnya";
  return null; // halDisyukuri: tidak ada kolom esai bebas terpisah, teks diambil dari opsi yang cocok
}

function toneClassForQuote(q) {
  const tags = matchedCategoryTags(q.kategori_pernyataan);
  return styles[QUOTE_TONE_CLASS[tags[0]?.label]] || styles.quoteCardDefault;
}

/**
 * Tag pada kartu HARUS ikut dimensi tab yang sedang aktif -- kalau sedang di tab Emosi/Dukungan,
 * jangan tampilkan tag Testimoni (Apresiasi/Harapan/dll), itu dimensi lain dan bikin esai
 * kelihatan "salah kategori". Tiap tab tampilkan tag dari field yang benar-benar jadi filter.
 */
function tagsForActiveTab(quote, activeTab, emosiItems) {
  if (activeTab === "testimoni") return matchedCategoryTags(quote.kategori_pernyataan);
  if (activeTab === "dukungan") return matchedOptions(quote.dukungan_dibutuhkan, DUKUNGAN_OPTIONS);
  if (activeTab === "halDisyukuri") return matchedOptions(quote.hal_disyukuri, HAL_DISYUKURI_OPTIONS);
  if (activeTab === "emosi") {
    const match = emosiItems.find((e) => e.label === (quote.emosi_anak || "").trim());
    return match ? [{ label: match.label, icon: match.icon }] : [];
  }
  return [];
}

function VoiceCardFooter({ quote, size }) {
  const avatarClass = size === "lg" ? styles.voiceAvatarLg : styles.voiceAvatarSm;
  const nameClass = size === "lg" ? styles.voiceCardNameLg : styles.voiceCardNameSm;
  return (
    <div className={styles.voiceCardFooter}>
      <span className={avatarClass}>{(quote.nama_murid || "?").charAt(0).toUpperCase()}</span>
      <div>
        <p className={nameClass}>{quote.nama_murid || "Orang tua"}</p>
        <p className={styles.voiceCardRole}>{quote.kelas_id || "—"}</p>
      </div>
    </div>
  );
}

/** Kartu besar (paling menonjol), berisi kutipan terpanjang/paling substantif untuk pilihan yang aktif. */
function FeaturedQuoteCard({ quote, badgeIcon, badgeLabel, activeTab, emosiItems }) {
  const extraTags = tagsForActiveTab(quote, activeTab, emosiItems).filter((t) => t.label !== badgeLabel);
  return (
    <div className={`${styles.voiceFeaturedCard} ${toneClassForQuote(quote)}`}>
      <span className={styles.voiceFeaturedBadge}>{badgeIcon} {badgeLabel}</span>
      {extraTags.length > 0 && (
        <div className={styles.quoteBentoTags} style={{ marginTop: 8 }}>
          {extraTags.map((t) => <span key={t.label} className={styles.quoteBentoTag}>{t.icon} {t.label}</span>)}
        </div>
      )}
      <span className={styles.voiceFeaturedMark} aria-hidden="true">”</span>
      <p className={styles.voiceFeaturedText}>{quote.text}</p>
      <VoiceCardFooter quote={quote} size="lg" />
    </div>
  );
}

/** Kartu grid pendukung, satu kutipan per kartu, tag mengikuti dimensi tab yang sedang aktif. */
function VoiceGridCard({ quote, activeTab, emosiItems }) {
  const tags = tagsForActiveTab(quote, activeTab, emosiItems);
  return (
    <div className={`${styles.quoteBentoCard} ${toneClassForQuote(quote)}`}>
      {tags.length > 0 && (
        <div className={styles.quoteBentoTags}>
          {tags.map((t) => <span key={t.label} className={styles.quoteBentoTag}>{t.icon} {t.label}</span>)}
        </div>
      )}
      <p className={styles.quoteBentoText}>“{quote.text}”</p>
      <VoiceCardFooter quote={quote} size="sm" />
    </div>
  );
}

/**
 * Ringkasan kualitatif suara orang tua, gaya bento, dipakai di level Kepsek/Yayasan (agregat
 * lintas kelas/sekolah). Empat sub-menu terpisah, satu dimensi aktif dalam satu waktu, tiap
 * dimensi punya kolom esai sendiri (bukan berbagi satu kolom `pernyataan` untuk semuanya):
 * Testimoni (kategori_pernyataan, esai dari pernyataan), Emosi Anak (emosi_anak, esai dari
 * alasan_emosi), Dukungan Dibutuhkan (dukungan_dibutuhkan, esai dari dukungan_lainnya -- baris
 * tanpa esai nyata di kolom ini tidak ditampilkan), Hal Disyukuri (hal_disyukuri, esai berupa
 * teks lengkap opsi yang dipilih karena tidak ada kolom esai bebas terpisah untuk dimensi ini).
 * Pilih satu nilai di dalam sub-menu yang aktif untuk melihat esai aslinya -- kutipan terpanjang/
 * paling substantif jadi kartu besar, sisanya jadi grid pendukung, tampil 10 dulu lalu bisa
 * dimuat semua. Tidak pernah menampilkan baris kosong/placeholder seolah ada isinya.
 */
export function ParentVoiceBento({ pernyataan }) {
  const [activeTab, setActiveTab] = useState("testimoni");
  const [selectedValue, setSelectedValue] = useState(null);
  const [showAllQuotes, setShowAllQuotes] = useState(false);

  if (!pernyataan || pernyataan.length === 0) {
    return <p className={styles.briefingEmptyText}>Belum ada refleksi orang tua untuk periode ini.</p>;
  }

  const emosi = countEmosi(pernyataan);
  const dukungan = countMultiValue(pernyataan, "dukungan_dibutuhkan", DUKUNGAN_OPTIONS);
  const testimoni = countMultiValue(pernyataan, "kategori_pernyataan", KATEGORI_PERNYATAAN_OPTIONS);
  const halDisyukuri = countMultiValue(pernyataan, "hal_disyukuri", HAL_DISYUKURI_OPTIONS);

  const hasAnyData = emosi.total > 0 || dukungan.totalWithAnswer > 0 || testimoni.totalWithAnswer > 0 || halDisyukuri.totalWithAnswer > 0;
  if (!hasAnyData) {
    return <p className={styles.briefingEmptyText}>Belum ada refleksi orang tua yang bisa ditampilkan untuk periode ini.</p>;
  }

  function selectTab(tabId) {
    setActiveTab(tabId);
    setSelectedValue(null);
    setShowAllQuotes(false);
  }
  function toggleValue(label) {
    setSelectedValue((prev) => (prev === label ? null : label));
    setShowAllQuotes(false);
  }

  let filteredQuotes = [];
  if (selectedValue) {
    if (activeTab === "halDisyukuri") {
      const match = HAL_DISYUKURI_MATCH_BY_LABEL[selectedValue];
      const full = HAL_DISYUKURI_FULL_BY_LABEL[selectedValue];
      filteredQuotes = pernyataan
        .filter((p) => (p.hal_disyukuri || "").includes(match))
        .map((p) => ({ ...p, text: full }));
    } else {
      const field = essayFieldForTab(activeTab);
      let base = pernyataan
        .map((p) => ({ ...p, text: extractPlainText(p[field]) }))
        .filter((p) => !isBlankEssay(p[field]));
      if (activeTab === "emosi") {
        base = base.filter((q) => (q.emosi_anak || "").trim() === selectedValue);
      } else if (activeTab === "dukungan") {
        const match = DUKUNGAN_MATCH_BY_LABEL[selectedValue];
        base = base.filter((q) => (q.dukungan_dibutuhkan || "").includes(match));
      } else {
        const match = KATEGORI_MATCH_BY_LABEL[selectedValue];
        base = base.filter((q) => (q.kategori_pernyataan || "").includes(match));
      }
      filteredQuotes = base.sort((a, b) => b.text.length - a.text.length);
    }
  }

  const [featured, ...rest] = filteredQuotes;
  const visibleRest = showAllQuotes ? rest : rest.slice(0, QUOTE_LOAD_STEP - 1);
  const remainingCount = rest.length - visibleRest.length;

  const activeItems = activeTab === "emosi" ? emosi.items
    : activeTab === "dukungan" ? dukungan.items
    : activeTab === "halDisyukuri" ? halDisyukuri.items
    : testimoni.items;
  const badgeIcon = activeItems.find((it) => it.label === selectedValue)?.icon || "";

  return (
    <div className={styles.parentVoiceWrap}>
      <div className={styles.voiceTabs}>
        {VOICE_TABS.map((t) => (
          <button
            key={t.id} type="button"
            className={`${styles.voiceTab} ${activeTab === t.id ? styles.voiceTabActive : ""}`}
            onClick={() => selectTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className={styles.pvChartCard}>
        {activeTab === "emosi" && (
          emosi.total > 0 ? (
            <div className={styles.pvEmosiRow}>
              {emosi.items.map((e) => {
                const active = selectedValue === e.label;
                return (
                  <button
                    type="button" key={e.label}
                    className={`${styles.pvEmosiChip} ${styles[`pvEmosi_${e.tone}`]} ${active ? styles.pvEmosiChipActive : ""}`}
                    onClick={() => toggleValue(e.label)}
                  >
                    {e.icon} {e.label} <strong>{e.count}</strong>
                  </button>
                );
              })}
            </div>
          ) : <p className={styles.briefingEmptyText}>Belum ada data emosi anak untuk periode ini.</p>
        )}

        {activeTab === "dukungan" && (
          <StatBarMiniList
            items={dukungan.items}
            emptyText="Belum ada data kebutuhan dukungan untuk periode ini."
            onItemClick={toggleValue}
            activeLabel={selectedValue}
          />
        )}

        {activeTab === "testimoni" && (
          <StatBarMiniList
            items={testimoni.items}
            emptyText="Belum ada refleksi berkategori untuk periode ini."
            onItemClick={toggleValue}
            activeLabel={selectedValue}
          />
        )}

        {activeTab === "halDisyukuri" && (
          <StatBarMiniList
            items={halDisyukuri.items}
            emptyText="Belum ada data hal yang disyukuri untuk periode ini."
            onItemClick={toggleValue}
            activeLabel={selectedValue}
          />
        )}
      </div>

      {selectedValue ? (
        filteredQuotes.length > 0 ? (
          <div className={styles.voiceLayout}>
            <FeaturedQuoteCard quote={featured} badgeIcon={badgeIcon} badgeLabel={selectedValue} activeTab={activeTab} emosiItems={emosi.items} />
            <div className={styles.voiceGridWrap}>
              <div className={styles.quoteBentoGrid}>
                {visibleRest.map((q, i) => <VoiceGridCard key={q.murid_id ? `${q.murid_id}-${i}` : i} quote={q} activeTab={activeTab} emosiItems={emosi.items} />)}
              </div>
              {remainingCount > 0 && (
                <button type="button" className={styles.quoteLoadMoreBtn} onClick={() => setShowAllQuotes(true)}>
                  Muat semua ({remainingCount} lagi)
                </button>
              )}
              {showAllQuotes && rest.length > QUOTE_LOAD_STEP - 1 && (
                <button type="button" className={styles.quoteLoadMoreBtn} onClick={() => setShowAllQuotes(false)}>
                  Tampilkan lebih sedikit
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className={styles.briefingEmptyText}>Belum ada esai tertulis untuk pilihan ini.</p>
        )
      ) : (
        <p className={styles.briefingEmptyText}>Pilih salah satu di atas untuk lihat esainya.</p>
      )}
    </div>
  );
}

const THRESHOLD_COLOR = { baik: "var(--status-ok)", perlu_perhatian: "var(--status-caution)" };

/**
 * Baris bar per aspek (dipakai di dialog detail siswa/kelas/jenjang/sekolah).
 * colorByThreshold: kalau true, warna bar mengikuti klasifikasi 80% (classifyPencapaian)
 * bukan warna spoke aspek — dipakai di split "aspek sudah baik / perlu perhatian" Kepsek.
 */
export function AspekBarList({ aspek, skorByAspek, colorByThreshold = false }) {
  return (
    <div className={styles.aspekBarList}>
      {aspek.map((a) => {
        const skor = skorByAspek[a.aspek_kode];
        const tone = colorByThreshold ? classifyPencapaian(skor) : null;
        const barColor = tone ? THRESHOLD_COLOR[tone] : a.color;
        return (
          <div className={styles.aspekBarRow} key={a.aspek_kode}>
            <span className={styles.aspekBarIcon}>{aspekIcon(a.aspek_label)}</span>
            <span className={styles.aspekBarLabel}>{a.aspek_label}</span>
            <div className={styles.aspekBarTrack}>
              <div className={styles.aspekBarFill} style={{ width: `${skor ?? 0}%`, background: barColor }} />
            </div>
            <span className={styles.aspekBarVal}>{skor != null ? `${skor}%` : "—"}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Grid kotak kecil skor per indikator. */
export function IndikatorGrid({ items, onSelect }) {
  if (!items.length) return null;
  return (
    <div className={styles.indikatorGrid}>
      {items.map((it) => (
        <button
          key={it.aspek_kode + it.indikator_kode}
          type="button"
          className={styles.indikatorChip}
          onClick={onSelect ? () => onSelect(it) : undefined}
          style={{ cursor: onSelect ? "pointer" : "default" }}
        >
          <span>{it.label}</span>
          <strong>{it.skor != null ? `${it.skor}%` : "—"}</strong>
        </button>
      ))}
    </div>
  );
}

/** Kartu refleksi orang tua untuk satu murid. */
export function ReflectionBlock({ pernyataan, namaMurid }) {
  if (!pernyataan) {
    return <p className={styles.briefingEmptyText}>Belum ada refleksi dari orang tua {namaMurid} periode ini.</p>;
  }
  return (
    <div className={styles.reflectionCard}>
      {pernyataan.kategori_pernyataan && (
        <span className={styles.reflectionTag}>{pernyataan.kategori_pernyataan}</span>
      )}
      {pernyataan.pernyataan && <blockquote className={styles.reflectionQuote}>“{pernyataan.pernyataan}”</blockquote>}
      <div className={styles.reflectionMetaGrid}>
        {pernyataan.emosi_anak && (
          <div>
            <span className={styles.metaLabel}>Perasaan anak menurut orang tua</span>
            <span className={styles.metaVal}>{pernyataan.emosi_anak}</span>
          </div>
        )}
        {pernyataan.dukungan_dibutuhkan && (
          <div>
            <span className={styles.metaLabel}>Dukungan yang dibutuhkan</span>
            <span className={styles.metaVal}>{pernyataan.dukungan_dibutuhkan}</span>
          </div>
        )}
        {pernyataan.hal_disyukuri && (
          <div>
            <span className={styles.metaLabel}>Hal yang disyukuri</span>
            <span className={styles.metaVal}>{pernyataan.hal_disyukuri}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Ranking sederhana (dipakai untuk detail satu indikator: siapa saja skornya berapa). */
export function MiniLeaderboard({ items }) {
  if (!items.length) return <p className={styles.briefingEmptyText}>Belum ada data.</p>;
  const sorted = [...items].sort((a, b) => (b.skor ?? 0) - (a.skor ?? 0));
  return (
    <div className={styles.miniLeaderboard}>
      {sorted.map((it, i) => (
        <div className={styles.miniLeaderboardRow} key={it.nama}>
          <span className={styles.miniRank}>{i + 1}</span>
          <span className={styles.miniNama}>{it.nama}</span>
          <span className={styles.miniVal}>{it.skor != null ? `${it.skor}%` : "—"}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Grafik tren rata-rata skor seorang murid antar periode. Fetch mandiri (lazy) begitu
 * muridId berubah, supaya WaliKelasView tidak perlu narik histori semua siswa di muka.
 */
export function useMuridTrend(sekolahId, muridId) {
  const [state, setState] = useState({ loading: true, points: [] });

  useEffect(() => {
    if (!muridId) return;
    let alive = true;
    setState({ loading: true, points: [] });

    supabase
      .from("karakter_skor")
      .select("periode_id, aspek_kode, skor")
      .eq("sekolah_id", sekolahId)
      .eq("murid_id", muridId)
      .then(({ data }) => {
        if (!alive) return;
        const byPeriode = {};
        (data || []).forEach((r) => {
          if (!byPeriode[r.periode_id]) byPeriode[r.periode_id] = { sum: 0, n: 0 };
          byPeriode[r.periode_id].sum += r.skor ?? 0;
          byPeriode[r.periode_id].n += 1;
        });
        const points = Object.entries(byPeriode)
          .map(([periode, v]) => ({ periode, rata: Math.round(v.sum / v.n) }))
          .sort((a, b) => (a.periode > b.periode ? 1 : -1));
        setState({ loading: false, points });
      });

    return () => { alive = false; };
  }, [sekolahId, muridId]);

  return state;
}

export function TrendChart({ points }) {
  const gradientId = useId();

  if (points.length === 0) return <p className={styles.briefingEmptyText}>Memuat riwayat…</p>;

  if (points.length < 2) {
    return (
      <div className={styles.trendSingle}>
        <div className={styles.trendSingleVal}>{points[0].rata}%</div>
        <p className={styles.briefingEmptyText}>
          Baru ada data {periodeLabel(points[0].periode)}. Grafik perkembangan antar bulan
          akan muncul otomatis begitu periode berikutnya masuk.
        </p>
      </div>
    );
  }

  const w = 460, h = 120, pad = 20;
  const maxV = 100, minV = 0;
  const stepX = (w - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => ({
    x: pad + i * stepX,
    y: pad + (1 - (p.rata - minV) / (maxV - minV)) * (h - pad * 2),
    ...p,
  }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${path} L ${coords[coords.length - 1].x} ${h - pad} L ${coords[0].x} ${h - pad} Z`;
  const gridLevels = [0.25, 0.5, 0.75];

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--purple-600)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--purple-600)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridLevels.map((lvl) => (
          <line
            key={lvl}
            x1={pad} x2={w - pad}
            y1={pad + lvl * (h - pad * 2)} y2={pad + lvl * (h - pad * 2)}
            stroke="var(--line)" strokeWidth={1} strokeDasharray="3 4"
          />
        ))}
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={path} fill="none" stroke="var(--purple-600)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c) => (
          <g key={c.periode}>
            <circle cx={c.x} cy={c.y} r={4} fill="var(--purple-600)" stroke="#EDEDF0" strokeWidth={2} />
            <text x={c.x} y={c.y - 12} textAnchor="middle" fontSize={11} fontWeight={800} fill="var(--purple-700)" fontFamily="Montserrat, sans-serif">
              {c.rata}%
            </text>
            <text x={c.x} y={h - 2} textAnchor="middle" fontSize={9.5} fill="var(--ink-4)" fontFamily="Montserrat, sans-serif">
              {periodeLabel(c.periode)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * Tren pencapaian keseluruhan antar periode untuk satu scope ("sekolah" atau "kelas"),
 * digeneralisasi dari useMuridTrend. scopeId boleh satu id atau array id (WaliKelas bisa
 * punya beberapa kelas di cakupan). Baca angka ringkasan yang sudah dihitung (bukan
 * hitung ulang dari karakter_skor) supaya konsisten dengan yang ditampilkan di stat tile.
 */
export function useSummaryTrend({ sekolahId, scope, scopeId, limit = 6 }) {
  const [state, setState] = useState({ loading: true, points: [] });

  useEffect(() => {
    if (!sekolahId || !scope || !scopeId) return;
    let alive = true;
    setState({ loading: true, points: [] });

    const scopeIds = Array.isArray(scopeId) ? scopeId : [scopeId];
    const field = scope === "sekolah" ? "rata_pencapaian_guru" : "rata_rata_pencapaian_guru";

    supabase
      .from("karakter_summary")
      .select("periode_id, ringkasan")
      .eq("sekolah_id", sekolahId)
      .eq("scope", scope)
      .in("scope_id", scopeIds)
      .then(({ data }) => {
        if (!alive) return;
        const byPeriode = {};
        (data || []).forEach((r) => {
          const v = pct(r.ringkasan?.[field]);
          if (v === null) return;
          if (!byPeriode[r.periode_id]) byPeriode[r.periode_id] = { sum: 0, n: 0 };
          byPeriode[r.periode_id].sum += v;
          byPeriode[r.periode_id].n += 1;
        });
        const points = Object.entries(byPeriode)
          .map(([periode, v]) => ({ periode, rata: Math.round(v.sum / v.n) }))
          .sort((a, b) => (a.periode > b.periode ? 1 : -1))
          .slice(-limit);
        setState({ loading: false, points });
      });

    return () => { alive = false; };
  }, [sekolahId, scope, JSON.stringify(scopeId), limit]);

  return state;
}

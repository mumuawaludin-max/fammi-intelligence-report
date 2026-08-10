import { useEffect, useId, useMemo, useRef, useState } from "react";
import BriefingHero from "../../components/BriefingHero";
import RadarChart from "../../components/charts/RadarChart";
import GroupedBarChart from "../../components/charts/GroupedBarChart";
import DetailDialog from "./DetailDialog";
import { supabase } from "../../lib/supabase";
import styles from "./KarakterShared.module.css";
import {
  ringkasanAspekValue, aspekIcon, periodeLabel, pct, classifyBarTone,
  extractPlainText, isBlankEssay, REFLEKSI_META,
  countMultiValue, matchedOptions, countEmosi,
} from "./karakterMeta";

/**
 * Meta sumber refleksi yang aman dipakai: sumber tak dikenal jatuh ke 'orangtua', satu-satunya
 * sumber yang pasti ada sejak dulu. Dipanggil di beberapa komponen, jadi dijadikan satu tempat.
 */
function refleksiMeta(sumber) {
  return REFLEKSI_META[sumber] || REFLEKSI_META.orangtua;
}

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

/**
 * Pengganti "Ringkasan Sekolah" + kotak briefing kosong: logo Fammi dengan animasi halus
 * mengajukan pertanyaan, lalu tiga pilihan langsung memetakan ke kategori (activeCategory:
 * kualitas / citra / tindaklanjut). Dipakai sebagai satu-satunya navigasi kategori di Kepsek/Wakil.
 */
const ASK_CHOICES = [
  { id: "kualitas", icon: "📈", label: "Lihat mutu layanan" },
  { id: "citra", icon: "💬", label: "Citra sekolah" },
  { id: "tindaklanjut", icon: "🎯", label: "Tindak lanjut sekolah di periode ini" },
];

export function AskMascot({ activeCategory, onSelect }) {
  return (
    <div className={styles.heroAsk}>
      <div className={styles.heroAskLogo}>
        <span className={styles.heroAskPulse} />
        <img className={styles.heroAskLogoImg} src="/favicon-512.png" alt="Fammi" />
      </div>
      <div className={styles.heroAskBody}>
        <p className={styles.heroAskQuestion}>Mana yang ingin Anda ketahui?</p>
        <div className={styles.heroAskChoices}>
          {ASK_CHOICES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`${styles.heroAskChoice} ${activeCategory === c.id ? styles.heroAskChoiceActive : ""}`}
              onClick={() => onSelect(c.id)}
            >
              <span className={styles.heroAskChoiceIcon}>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>
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
    // Biarkan null apa adanya (bukan 0) kalau aspek ini belum ada datanya -- RadarChart sendiri
    // sudah aman menerima null (lihat fractionsFor di dalamnya), jangan bohongi jadi skor 0.
    value: ringkasanAspekValue(ringkasan, a.aspek_kode, prefix),
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
      value: ringkasanAspekValue(e.ringkasan, a.aspek_kode, e.prefix),
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
    values: Object.fromEntries(aspek.map((a) => [a.aspek_kode, ringkasanAspekValue(e.ringkasan, a.aspek_kode, e.prefix)])),
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
          // Rata-rata HANYA dari aspek yang benar-benar punya angka -- aspek yang belum ada
          // datanya tidak ikut menyeret skor turun seolah nilainya 0.
          const aspekVals = aspek
            .map((a) => ringkasanAspekValue(e.ringkasan, a.aspek_kode, e.prefix))
            .filter((v) => v != null);
          const skorRata = aspekVals.length > 0
            ? Math.round(aspekVals.reduce((sum, v) => sum + v, 0) / aspekVals.length)
            : null;
          return (
            <button
              key={e.id}
              type="button"
              className={`${styles.entityChip} ${active ? styles.entityChipActive : ""}`}
              onClick={() => toggle(e.id)}
            >
              <span className={styles.entityChipDot} style={{ background: e.color }} />
              {e.nama}
              <span className={styles.entityChipVal}>{skorRata != null ? `${skorRata}%` : "—"}</span>
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
              values: Object.fromEntries(aspek.map((a) => [a.aspek_kode, ringkasanAspekValue(e.ringkasan, a.aspek_kode, e.prefix)])),
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
      value: ringkasanAspekValue(e.ringkasan, a.aspek_kode, e.prefix),
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
  const [wrapRef, shown] = useReveal();
  const filtered = items.filter((it) => it.count > 0).sort((a, b) => b.count - a.count);
  if (filtered.length === 0) return <p className={styles.briefingEmptyText}>{emptyText || "Belum ada data."}</p>;
  const max = Math.max(...filtered.map((it) => it.count), 1);
  return (
    <div ref={wrapRef} className={styles.pvBarList}>
      {filtered.map((it, i) => {
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
              <div
                className={styles.pvBarFill}
                style={{ width: shown ? `${(it.count / max) * 100}%` : 0, transitionDelay: `${i * 55}ms` }}
              />
            </div>
            <span className={styles.pvBarCount}>{it.count}</span>
          </Tag>
        );
      })}
    </div>
  );
}

const QUOTE_LOAD_STEP = 10;

/**
 * Peta label bucket -> DAFTAR teks `match` milik bucket itu. Array, bukan string tunggal, dan
 * ini bukan gaya-gayaan: sejak KATEGORI_PERNYATAAN_OPTIONS punya dua entri berlabel sama
 * ("Kritik" untuk data orang tua dan "Keluhan" untuk data siswa, dua-duanya masuk bucket
 * "Kritik & Keluhan"), Object.fromEntries yang dipakai versi sebelumnya diam-diam membuang entri
 * pertama karena kunci yang sama ditimpa entri terakhir. Akibatnya filter kutipan bucket itu
 * cuma menangkap baris berisi "Keluhan" dan MELEWATKAN seluruh baris "Kritik" milik sekolah
 * lama (SDIP, KB TK) -- regresi diam tanpa error. Dengan array, satu label bisa membawa semua
 * varian teksnya sekaligus.
 *
 * Dibangun per sumber (dari REFLEKSI_META[sumber].kategoriOptions/dukunganOptions/
 * disyukuriOptions), bukan konstanta level modul dari opsi orang tua, karena opsi dukungan dan
 * hal disyukuri milik siswa punya diksi sendiri.
 */
function matchMapByLabel(options = []) {
  const map = {};
  options.forEach((o) => {
    if (!map[o.label]) map[o.label] = [];
    map[o.label].push(o.match);
  });
  return map;
}

/** Baris cocok dengan satu bucket kalau SALAH SATU teks match bucket itu ada di nilai mentahnya. */
function matchesLabel(rawValue, matches) {
  if (!matches || matches.length === 0) return false;
  const value = rawValue || "";
  return matches.some((m) => value.includes(m));
}

/**
 * Dua opsi boleh berbagi satu label bucket, jadi matchedOptions bisa mengembalikan dua entri
 * berlabel sama untuk satu baris. Buang kembarannya supaya key React tidak duplikat dan tag
 * yang sama tidak tampil dua kali.
 */
function dedupByLabel(tags = []) {
  const seen = new Set();
  return tags.filter((t) => {
    if (seen.has(t.label)) return false;
    seen.add(t.label);
    return true;
  });
}

// Kuncinya adalah LABEL bucket, bukan teks match-nya. Label "Kritik" sudah berganti jadi
// "Kritik & Keluhan" saat bucket Keluhan digabung; kunci lama bikin kartu kritik diam-diam
// jatuh ke gaya default tanpa ada yang error.
const QUOTE_TONE_CLASS = {
  "Apresiasi": "quoteCardApresiasi",
  "Harapan": "quoteCardHarapan",
  "Saran & Masukan": "quoteCardMasukan",
  "Kritik & Keluhan": "quoteCardKritik",
};

/** Kolom esai mentah per tab -- tiap dimensi punya sumber teksnya sendiri, bukan berbagi satu kolom. */
function essayFieldForTab(tabId) {
  if (tabId === "testimoni") return "pernyataan";
  if (tabId === "emosi") return "alasan_emosi";
  if (tabId === "dukungan") return "dukungan_lainnya";
  return null; // halDisyukuri: tidak ada kolom esai bebas terpisah, teks diambil dari opsi yang cocok
}

function toneClassForQuote(q, meta) {
  const tags = matchedOptions(q.kategori_pernyataan, meta.kategoriOptions);
  return styles[QUOTE_TONE_CLASS[tags[0]?.label]] || styles.quoteCardDefault;
}

/**
 * Tag pada kartu HARUS ikut dimensi tab yang sedang aktif -- kalau sedang di tab Emosi/Dukungan,
 * jangan tampilkan tag Testimoni (Apresiasi/Harapan/dll), itu dimensi lain dan bikin esai
 * kelihatan "salah kategori". Tiap tab tampilkan tag dari field yang benar-benar jadi filter.
 */
function tagsForActiveTab(quote, activeTab, emosiItems, meta) {
  if (activeTab === "testimoni") return dedupByLabel(matchedOptions(quote.kategori_pernyataan, meta.kategoriOptions));
  if (activeTab === "dukungan") return dedupByLabel(matchedOptions(quote.dukungan_dibutuhkan, meta.dukunganOptions));
  if (activeTab === "halDisyukuri") return dedupByLabel(matchedOptions(quote.hal_disyukuri, meta.disyukuriOptions));
  if (activeTab === "emosi") {
    const match = emosiItems.find((e) => e.label === (quote.emosi_anak || "").trim());
    return match ? [{ label: match.label, icon: match.icon }] : [];
  }
  return [];
}

function VoiceCardFooter({ quote, size, meta }) {
  const avatarClass = size === "lg" ? styles.voiceAvatarLg : styles.voiceAvatarSm;
  const nameClass = size === "lg" ? styles.voiceCardNameLg : styles.voiceCardNameSm;
  return (
    <div className={styles.voiceCardFooter}>
      <span className={avatarClass}>{(quote.nama_murid || "?").charAt(0).toUpperCase()}</span>
      <div>
        <p className={nameClass}>{quote.nama_murid || meta.namaFallback}</p>
        <p className={styles.voiceCardRole}>{quote.kelas_id || "—"}</p>
      </div>
    </div>
  );
}

/** Kartu kutipan, satu narasi per kartu, tag mengikuti dimensi tab yang sedang aktif. */
function VoiceGridCard({ quote, activeTab, emosiItems, onShare, meta }) {
  const tags = tagsForActiveTab(quote, activeTab, emosiItems, meta);
  return (
    <div className={`${styles.quoteBentoCard} ${toneClassForQuote(quote, meta)}`}>
      {tags.length > 0 && (
        <div className={styles.quoteBentoTags}>
          {tags.map((t) => <span key={t.label} className={styles.quoteBentoTag}>{t.icon} {t.label}</span>)}
        </div>
      )}
      <p className={styles.quoteBentoText}>“{quote.text}”</p>
      <div className={styles.voiceCardBottom}>
        <VoiceCardFooter quote={quote} size="sm" meta={meta} />
        {onShare && (
          <button type="button" className={styles.voiceShareBtn} onClick={() => onShare(quote)}>
            <span aria-hidden="true">↗</span> Teruskan
          </button>
        )}
      </div>
    </div>
  );
}

/** Teks WhatsApp untuk kartu suara responden: bingkai sebagai pengingat, bukan sekadar forward. */
function voiceReminderText(quote, meta) {
  const kelas = quote.kelas_id || "—";
  return [
    `*Diteruskan lewat Rapor Karakter Fammi*`,
    `Kelas: ${kelas}`,
    // waLabel sendiri sudah punya fallback nama huruf kecil ("orang tua"/"siswa"), sama persis
    // dengan fallback yang dulu ditulis inline di sini.
    meta.waLabel(quote.nama_murid),
    ``,
    `"${quote.text}"`,
    ``,
    `Mohon jadi perhatian pihak yang berkepentingan.`,
  ].join("\n");
}

/**
 * Dialog konfirmasi sebelum share ke WhatsApp: pimpinan lihat dulu isinya, dengan pengingat
 * bahwa ini untuk mengingatkan wali kelas/guru terkait, bukan untuk disebar sembarangan.
 */
function VoiceShareDialog({ quote, onClose, sumber = "orangtua" }) {
  const meta = refleksiMeta(sumber);
  function kirim() {
    window.open(`https://wa.me/?text=${encodeURIComponent(voiceReminderText(quote, meta))}`, "_blank", "noopener,noreferrer");
    onClose();
  }
  return (
    <DetailDialog
      icon="↗"
      eyebrow="Teruskan kepada yang berkepentingan"
      title={meta.dialogTeruskanTitle}
      subtitle={`${quote.nama_murid || meta.namaFallback} · ${quote.kelas_id || "—"}`}
      onClose={onClose}
    >
      <section>
        <p className={styles.dialogSectionTitle}>Yang akan diteruskan</p>
        <p className={styles.resumeQuote}>“{quote.text}”</p>
      </section>
      <div className={styles.shareNote}>
        <span className={styles.shareNoteIcon} aria-hidden="true">🔒</span>
        <p className={styles.shareNoteText}>
          Bagikan hanya kepada pihak yang memang perlu tahu dan bisa menindaklanjuti, sesuai
          pertimbangan Anda. Mohon tidak disebarkan ke pihak lain.
        </p>
      </div>
      <button type="button" className={styles.shareWaBtn} onClick={kirim}>
        <span aria-hidden="true">↗</span> Kirim ke WhatsApp
      </button>
    </DetailDialog>
  );
}

/**
 * Untuk Hal Disyukuri: "esai" cuma teks opsi yang sama diulang-ulang, jadi tidak berguna
 * ditampilkan. Ganti dengan daftar nama murid yang memilih kategori itu, biar kelihatan
 * siapa saja. Tiap nama bisa diklik untuk membuka resume karakter anak + refleksi orang tuanya.
 */
function NamesGrid({ rows, onSelect, meta }) {
  return (
    <div className={styles.pvNamesGrid}>
      {rows.map((r, i) => {
        const Tag = onSelect ? "button" : "div";
        return (
          <Tag
            type={onSelect ? "button" : undefined}
            key={r.murid_id ? `${r.murid_id}-${i}` : i}
            className={`${styles.pvNameCard} ${onSelect ? styles.pvNameCardClickable : ""}`}
            onClick={onSelect ? () => onSelect(r) : undefined}
          >
            <span className={styles.pvNameAvatar}>{(r.nama_murid || "?").charAt(0).toUpperCase()}</span>
            <div className={styles.pvNameMeta}>
              <span className={styles.pvNameText}>{r.nama_murid || meta.namaFallback}</span>
              <span className={styles.pvNameKelas}>{r.kelas_id || "—"}</span>
            </div>
            {onSelect && <span className={styles.pvNameArrow}>›</span>}
          </Tag>
        );
      })}
    </div>
  );
}

/** Ambil skor per aspek satu murid untuk periode berjalan (buat resume di dialog). */
function useMuridAspek(sekolahId, muridId, periodeId) {
  const [state, setState] = useState({ loading: true, skorByAspek: {} });

  useEffect(() => {
    if (!sekolahId || !muridId) { setState({ loading: false, skorByAspek: {} }); return; }
    let alive = true;
    setState({ loading: true, skorByAspek: {} });

    let q = supabase.from("karakter_skor").select("aspek_kode, skor, periode_id")
      .eq("sekolah_id", sekolahId).eq("murid_id", muridId);
    if (periodeId) q = q.eq("periode_id", periodeId);

    q.then(({ data }) => {
      if (!alive) return;
      const map = {};
      (data || []).forEach((r) => { map[r.aspek_kode] = r.skor; });
      setState({ loading: false, skorByAspek: map });
    });

    return () => { alive = false; };
  }, [sekolahId, muridId, periodeId]);

  return state;
}

/** Satu baris refleksi di dialog resume (label + isi), disembunyikan kalau kosong. */
function ReflectionRow({ label, children }) {
  return (
    <div className={styles.resumeRow}>
      <p className={styles.resumeRowLabel}>{label}</p>
      {children}
    </div>
  );
}

/**
 * Dialog resume satu anak: hasil karakter per aspek (kalau data & konfigurasi tersedia) plus
 * refleksi respondennya (apresiasi/harapan, emosi anak, dukungan yang diminta, hal yang
 * disyukuri). Semua teks dan daftar opsi mengikuti sumber refleksi yang sedang dibuka.
 */
function MuridResumeDialog({ row, aspek, sekolahId, periodeId, onClose, sumber = "orangtua" }) {
  const meta = refleksiMeta(sumber);
  const { loading, skorByAspek } = useMuridAspek(sekolahId, row.murid_id, periodeId);
  const hasSkor = Object.keys(skorByAspek).length > 0;

  const kategoriTags = dedupByLabel(matchedOptions(row.kategori_pernyataan, meta.kategoriOptions));
  const quote = extractPlainText(row.pernyataan);
  const showQuote = !isBlankEssay(row.pernyataan);
  const emosi = (row.emosi_anak || "").trim();
  const showEmosi = emosi && emosi !== "0";
  const alasan = extractPlainText(row.alasan_emosi);
  const showAlasan = !isBlankEssay(row.alasan_emosi);
  const dukungan = dedupByLabel(matchedOptions(row.dukungan_dibutuhkan, meta.dukunganOptions));
  const disyukuri = dedupByLabel(matchedOptions(row.hal_disyukuri, meta.disyukuriOptions));

  return (
    <DetailDialog
      icon="🧑‍🎓"
      eyebrow="Resume Anak"
      title={row.nama_murid || meta.namaFallback}
      subtitle={row.kelas_id || "—"}
      onClose={onClose}
    >
      <section>
        <p className={styles.dialogSectionTitle}>Hasil karakter</p>
        {aspek && aspek.length > 0 && hasSkor ? (
          <AspekBarList aspek={aspek} skorByAspek={skorByAspek} />
        ) : loading ? (
          <p className={styles.briefingEmptyText}>Memuat skor karakter…</p>
        ) : (
          <p className={styles.briefingEmptyText}>Skor karakter per aspek belum tersedia untuk anak ini pada periode ini.</p>
        )}
      </section>

      <section>
        <p className={styles.dialogSectionTitle}>{meta.headingRefleksi}</p>
        <div className={styles.resumeReflection}>
          {kategoriTags.length > 0 && (
            <ReflectionRow label="Jenis masukan">
              <div className={styles.quoteBentoTags}>
                {kategoriTags.map((t) => <span key={t.label} className={styles.quoteBentoTag}>{t.icon} {t.label}</span>)}
              </div>
            </ReflectionRow>
          )}
          {showQuote && (
            <ReflectionRow label={meta.labelPesan}>
              <p className={styles.resumeQuote}>“{quote}”</p>
            </ReflectionRow>
          )}
          {showEmosi && (
            <ReflectionRow label="Emosi anak di rumah">
              <p className={styles.resumeText}>{emosi}{showAlasan ? ` — ${alasan}` : ""}</p>
            </ReflectionRow>
          )}
          {dukungan.length > 0 && (
            <ReflectionRow label="Dukungan yang diminta">
              <div className={styles.quoteBentoTags}>
                {dukungan.map((t) => <span key={t.label} className={styles.quoteBentoTag}>{t.icon} {t.label}</span>)}
              </div>
            </ReflectionRow>
          )}
          {disyukuri.length > 0 && (
            <ReflectionRow label="Yang disyukuri">
              <div className={styles.quoteBentoTags}>
                {disyukuri.map((t) => <span key={t.label} className={styles.quoteBentoTag}>{t.icon} {t.label}</span>)}
              </div>
            </ReflectionRow>
          )}
          {kategoriTags.length === 0 && !showQuote && !showEmosi && dukungan.length === 0 && disyukuri.length === 0 && (
            <p className={styles.briefingEmptyText}>{meta.emptyText.dialogLain}</p>
          )}
        </div>
      </section>
    </DetailDialog>
  );
}

/**
 * Ringkasan kualitatif suara satu sumber refleksi (orang tua atau siswa), gaya bento, dipakai di
 * level Kepsek/Yayasan (agregat lintas kelas/sekolah). Empat sub-menu terpisah, satu dimensi
 * aktif dalam satu waktu, tiap dimensi punya kolom esai sendiri (bukan berbagi satu kolom
 * `pernyataan` untuk semuanya): Testimoni (kategori_pernyataan, esai dari pernyataan), Emosi Anak
 * (emosi_anak, esai dari alasan_emosi), Dukungan Dibutuhkan (dukungan_dibutuhkan, esai dari
 * dukungan_lainnya -- baris tanpa esai nyata di kolom ini tidak ditampilkan), Hal Disyukuri
 * (hal_disyukuri, esai berupa teks lengkap opsi yang dipilih karena tidak ada kolom esai bebas
 * terpisah untuk dimensi ini). Pilih satu nilai di dalam sub-menu yang aktif untuk melihat esai
 * aslinya -- kutipan terpanjang/paling substantif jadi kartu besar, sisanya jadi grid pendukung,
 * tampil 10 dulu lalu bisa dimuat semua. Tidak pernah menampilkan baris kosong/placeholder seolah
 * ada isinya.
 *
 * Seluruh teks dan daftar opsi datang dari REFLEKSI_META[sumber]; komponen ini tidak lagi menanam
 * satu pun kalimat "orang tua" di badannya. Default sumber "orangtua" menjaga pemanggil lama
 * (lewat alias ParentVoiceBento) menghasilkan tampilan yang sama persis seperti sebelumnya.
 */
export function VoiceBento({ sumber = "orangtua", pernyataan, aspek, sekolahId, periodeId, sekolahOptions, aspekBySekolah }) {
  const [activeTab, setActiveTab] = useState("testimoni");
  const [selectedValue, setSelectedValue] = useState(null);
  const [showAllQuotes, setShowAllQuotes] = useState(false);
  const [filterKelas, setFilterKelas] = useState(null);
  const [filterSekolah, setFilterSekolah] = useState(null);
  const [selectedMurid, setSelectedMurid] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);

  const meta = refleksiMeta(sumber);
  // Peta pencocokan dibangun dari opsi milik sumber ini, bukan dari opsi orang tua yang dulu
  // jadi konstanta level modul. Lihat matchMapByLabel untuk alasan bentuknya array.
  const matchMaps = useMemo(() => ({
    kategori: matchMapByLabel(meta.kategoriOptions),
    dukungan: matchMapByLabel(meta.dukunganOptions),
    disyukuri: matchMapByLabel(meta.disyukuriOptions),
  }), [meta]);

  if (!pernyataan || pernyataan.length === 0) {
    return <p className={styles.briefingEmptyText}>{meta.emptyText.blok}</p>;
  }

  const hasSekolahFilter = sekolahOptions && sekolahOptions.length > 0;
  // Filter sekolah diterapkan paling awal, sebelum hitungan kategori, supaya bar kiri dan
  // narasi kanan selalu konsisten merujuk sekolah yang sama saat sekolah tertentu dipilih.
  const basePernyataan = filterSekolah ? pernyataan.filter((p) => p.sekolah_id === filterSekolah) : pernyataan;

  // Emosi tetap dibaca dari kolom emosi_anak untuk kedua sumber: importer menulis kolom Excel
  // emosi_siswa ke kolom DB yang sama (nama tabel/kolom peninggalan, tidak diganti demi
  // kompatibilitas), jadi yang berbeda antar sumber cuma label tampilannya (meta.emosiLabel).
  const emosi = countEmosi(basePernyataan);
  const dukungan = countMultiValue(basePernyataan, "dukungan_dibutuhkan", meta.dukunganOptions);
  const testimoni = countMultiValue(basePernyataan, "kategori_pernyataan", meta.kategoriOptions);
  const halDisyukuri = countMultiValue(basePernyataan, "hal_disyukuri", meta.disyukuriOptions);

  const hasAnyData = emosi.total > 0 || dukungan.totalWithAnswer > 0 || testimoni.totalWithAnswer > 0 || halDisyukuri.totalWithAnswer > 0;

  function selectTab(tabId) {
    setActiveTab(tabId);
    setSelectedValue(null);
    setShowAllQuotes(false);
    setFilterKelas(null);
  }
  function toggleValue(label) {
    setSelectedValue((prev) => (prev === label ? null : label));
    setShowAllQuotes(false);
  }
  function changeKelas(value) {
    setFilterKelas(value || null);
    setShowAllQuotes(false);
  }
  function changeSekolah(value) {
    setFilterSekolah(value || null);
    setFilterKelas(null);
    setSelectedValue(null);
    setShowAllQuotes(false);
  }

  const activeItems = activeTab === "emosi" ? emosi.items
    : activeTab === "dukungan" ? dukungan.items
    : activeTab === "halDisyukuri" ? halDisyukuri.items
    : testimoni.items;

  // Kalau belum ada yang dipilih, pakai kategori terbanyak supaya narasi di kolom kanan
  // langsung tampil tanpa harus klik dulu.
  const sortedItems = activeItems.filter((it) => it.count > 0).sort((a, b) => b.count - a.count);
  const effectiveValue = selectedValue ?? sortedItems[0]?.label ?? null;

  // Hal Disyukuri sengaja beda: "esai"-nya cuma teks opsi yang diulang, jadi tidak ditampilkan
  // sebagai narasi. Kolom kanan menampilkan daftar nama yang memilih kategori itu.
  const isNamesMode = activeTab === "halDisyukuri";

  let matchedRows = [];
  if (effectiveValue) {
    if (isNamesMode) {
      const matches = matchMaps.disyukuri[effectiveValue];
      matchedRows = basePernyataan.filter((p) => matchesLabel(p.hal_disyukuri, matches));
    } else {
      const field = essayFieldForTab(activeTab);
      let base = basePernyataan
        .map((p) => ({ ...p, text: extractPlainText(p[field]) }))
        .filter((p) => !isBlankEssay(p[field]));
      if (activeTab === "emosi") {
        base = base.filter((q) => (q.emosi_anak || "").trim() === effectiveValue);
      } else if (activeTab === "dukungan") {
        const matches = matchMaps.dukungan[effectiveValue];
        base = base.filter((q) => matchesLabel(q.dukungan_dibutuhkan, matches));
      } else {
        const matches = matchMaps.kategori[effectiveValue];
        base = base.filter((q) => matchesLabel(q.kategori_pernyataan, matches));
      }
      matchedRows = base.sort((a, b) => b.text.length - a.text.length);
    }
  }

  // Daftar kelas untuk dropdown filter (dari baris yang cocok kategori terpilih, biar relevan).
  const kelasOptions = Array.from(new Set(matchedRows.map((r) => r.kelas_id).filter(Boolean)))
    .sort((a, b) => String(a).localeCompare(String(b), "id", { numeric: true }));
  const rows = filterKelas ? matchedRows.filter((r) => r.kelas_id === filterKelas) : matchedRows;

  const pageStep = isNamesMode ? 30 : QUOTE_LOAD_STEP;
  const visibleRows = showAllQuotes ? rows : rows.slice(0, pageStep);
  const remainingCount = rows.length - visibleRows.length;
  const badgeIcon = activeItems.find((it) => it.label === effectiveValue)?.icon || "";
  // Hitungan bar kiri (StatBarMiniList) menghitung SEMUA baris yang memilih kategori ini,
  // tanpa peduli apakah orang tuanya juga menulis esai bebas -- banyak yang cuma centang
  // kategori tanpa menulis apa-apa. matchedRows di kanan sudah difilter buang esai kosong
  // (isBlankEssay), jadi angkanya wajar lebih kecil dari count di kiri, kadang sampai nol.
  // Simpan selisihnya supaya pesan kosong di kanan menjelaskan alasannya, bukan sekadar
  // "belum ada data" yang bikin count di kiri kelihatan salah/tidak konsisten.
  const categoryTotalCount = !isNamesMode ? (activeItems.find((it) => it.label === effectiveValue)?.count || 0) : 0;

  return (
    <div className={styles.parentVoiceWrap}>
      <div className={styles.voiceTabsRow}>
        <div className={styles.voiceTabs}>
          {meta.voiceTabs.map((t) => (
            <button
              key={t.id} type="button"
              className={`${styles.voiceTab} ${activeTab === t.id ? styles.voiceTabActive : ""}`}
              onClick={() => selectTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        {hasSekolahFilter && (
          <div className={styles.pvSekolahFilterRow}>
            <span className={styles.pvFilterBadge}>Filter sekolah ({filterSekolah ? 1 : 0})</span>
            <select
              className={styles.pvSekolahFilter}
              value={filterSekolah || ""}
              onChange={(e) => changeSekolah(e.target.value)}
            >
              <option value="">Semua Sekolah</option>
              {sekolahOptions.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
          </div>
        )}
      </div>

      {!hasAnyData ? (
        <p className={styles.briefingEmptyText}>{meta.emptyText.dataKosong(Boolean(filterSekolah))}</p>
      ) : (
      <>
      {/* Dua kolom: hitungan per kategori di kiri, narasi responden yang cocok langsung di kanan.
          Semua tab memakai tampilan yang sama supaya konsisten. */}
      <div className={styles.pvTwoCol}>
        <div className={styles.pvColLeft}>
          <StatBarMiniList
            items={activeItems}
            emptyText="Belum ada data untuk periode ini."
            onItemClick={toggleValue}
            activeLabel={effectiveValue}
          />
        </div>

        <div className={styles.pvColRight}>
          {effectiveValue && matchedRows.length > 0 ? (
            <>
              <div className={styles.pvColRightBar}>
                <p className={styles.pvColRightHead}>
                  {badgeIcon ? `${badgeIcon} ` : ""}{effectiveValue}
                  <span className={styles.pvColRightCount}>
                    {rows.length} {isNamesMode ? meta.satuan : "narasi"}
                  </span>
                </p>
                {kelasOptions.length > 1 && (
                  <select
                    className={styles.pvKelasFilter}
                    value={filterKelas || ""}
                    onChange={(e) => changeKelas(e.target.value)}
                  >
                    <option value="">Semua kelas</option>
                    {kelasOptions.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                )}
              </div>

              {rows.length === 0 ? (
                <p className={styles.briefingEmptyText}>Tidak ada di kelas ini.</p>
              ) : isNamesMode ? (
                <NamesGrid rows={visibleRows} onSelect={setSelectedMurid} meta={meta} />
              ) : (
                <div className={styles.pvEssayList}>
                  {visibleRows.map((q, i) => (
                    <VoiceGridCard
                      key={q.murid_id ? `${q.murid_id}-${i}` : i}
                      quote={q}
                      activeTab={activeTab}
                      emosiItems={emosi.items}
                      onShare={setShareTarget}
                      meta={meta}
                    />
                  ))}
                </div>
              )}

              {remainingCount > 0 && (
                <button type="button" className={styles.quoteLoadMoreBtn} onClick={() => setShowAllQuotes(true)}>
                  Muat semua ({remainingCount} lagi)
                </button>
              )}
              {showAllQuotes && rows.length > pageStep && (
                <button type="button" className={styles.quoteLoadMoreBtn} onClick={() => setShowAllQuotes(false)}>
                  Tampilkan lebih sedikit
                </button>
              )}
            </>
          ) : categoryTotalCount > 0 ? (
            <p className={styles.briefingEmptyText}>
              {meta.emptyText.tanpaEsai(categoryTotalCount, effectiveValue)}
            </p>
          ) : (
            <p className={styles.briefingEmptyText}>Belum ada data untuk pilihan ini.</p>
          )}
        </div>
      </div>
      </>
      )}

      {selectedMurid && (
        <MuridResumeDialog
          row={selectedMurid}
          aspek={(aspekBySekolah && selectedMurid.sekolah_id) ? (aspekBySekolah[selectedMurid.sekolah_id] || aspek) : aspek}
          sekolahId={selectedMurid.sekolah_id || sekolahId}
          periodeId={periodeId}
          sumber={meta.key}
          onClose={() => setSelectedMurid(null)}
        />
      )}

      {shareTarget && <VoiceShareDialog quote={shareTarget} sumber={meta.key} onClose={() => setShareTarget(null)} />}
    </div>
  );
}

/**
 * Alias tipis untuk pemanggil lama (KepsekView, WaliKelasView, YayasanView) yang belum tahu soal
 * multi-sumber. Nama ekspor sengaja dipertahankan supaya tidak ada berkas lain yang perlu ikut
 * berubah di batch ini; jalur orang tua lewat alias ini identik dengan sebelum refactor.
 */
export function ParentVoiceBento(props) {
  return <VoiceBento sumber="orangtua" {...props} />;
}

/**
 * Saklar sumber refleksi di kepala section Suara. Null kalau cuma satu sumber tersedia, jadi
 * sekolah yang cuma punya refleksi orang tua tidak melihat jejak apa pun dari fitur ini.
 */
export function SourceSwitch({ sumberList, value, onChange }) {
  const list = (sumberList || []).filter((s) => REFLEKSI_META[s]);
  if (list.length < 2) return null;
  return (
    <div className={styles.sourceSwitch} role="group" aria-label="Sumber refleksi">
      {list.map((s) => {
        const meta = REFLEKSI_META[s];
        const active = value === s;
        return (
          <button
            key={s}
            type="button"
            aria-pressed={active}
            className={`${styles.sourceSwitchPill} ${active ? styles.sourceSwitchPillActive : ""}`}
            onClick={() => onChange && onChange(s)}
          >
            <span aria-hidden="true">{meta.icon}</span>
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

const BAR_TONE_COLOR = {
  aman: "var(--status-ok)",
  perhatian: "var(--status-caution)",
  waspada: "var(--status-alert)",
};

/**
 * Baris bar per aspek (dipakai di dialog detail siswa/kelas/jenjang/sekolah dan split aspek).
 * Warna bar SELALU mengikuti skor lewat palet status 3 tingkat (hijau/kuning/merah), bukan warna
 * spoke aspek — supaya merah cuma muncul saat skor benar-benar rendah (waspada), bukan sekadar
 * karena posisi aspek. Skor kosong pakai abu netral.
 */
export function AspekBarList({ aspek, skorByAspek }) {
  const [wrapRef, shown] = useReveal();
  return (
    <div ref={wrapRef} className={styles.aspekBarList}>
      {aspek.map((a, i) => {
        const skor = skorByAspek[a.aspek_kode];
        const tone = classifyBarTone(skor);
        const barColor = tone ? BAR_TONE_COLOR[tone] : "var(--ink-4)";
        return (
          <div className={styles.aspekBarRow} key={a.aspek_kode}>
            <span className={styles.aspekBarIcon}>{aspekIcon(a.aspek_label)}</span>
            <span className={styles.aspekBarLabel}>{a.aspek_label}</span>
            <div className={styles.aspekBarTrack}>
              <div
                className={styles.aspekBarFill}
                style={{ width: shown ? `${skor ?? 0}%` : 0, background: barColor, transitionDelay: `${i * 55}ms` }}
              />
            </div>
            <span className={styles.aspekBarVal}>{skor != null ? `${skor}%` : "—"}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Reveal saat elemen masuk viewport, dan re-trigger tiap kali masuk lagi -- dipakai untuk
 * animasi grafik tumbuh dari 0 ke nilainya saat di-scroll. Fallback: kalau IntersectionObserver
 * tidak ada, langsung tampil penuh (tanpa animasi) supaya konten tidak pernah tersangkut kosong.
 */
function useReveal(threshold = 0.2) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setShown(true); return; }
    let ioFired = false;
    // Pengaman: kalau IntersectionObserver tidak pernah callback di lingkungan tertentu,
    // tetap tampilkan grafik penuh supaya tidak pernah tersangkut kosong di 0.
    const fallback = setTimeout(() => { if (!ioFired) setShown(true); }, 900);
    const io = new IntersectionObserver((entries) => {
      ioFired = true;
      clearTimeout(fallback);
      setShown(entries[0].isIntersecting);
    }, { threshold });
    io.observe(el);
    return () => { clearTimeout(fallback); io.disconnect(); };
  }, [threshold]);
  return [ref, shown];
}

/**
 * Daftar bar generik untuk skor apa pun (aspek / siswa / indikator), diurutkan dari nilai
 * tertinggi. Warna bar ikut palet status 3 tingkat. `rankByNumber` menampilkan nomor urut
 * (1..n) sebagai pengganti ikon, dipakai untuk peringkat siswa. Batang tumbuh 0->nilai saat
 * masuk viewport (dengan sedikit stagger antar baris).
 */
export function ScoreBarList({ items, rankByNumber = false, emptyText }) {
  const [wrapRef, shown] = useReveal();
  const rows = items.filter((it) => it.value != null).sort((a, b) => b.value - a.value);
  if (rows.length === 0) return <p className={styles.briefingEmptyText}>{emptyText || "Belum ada data."}</p>;
  return (
    <div ref={wrapRef} className={styles.aspekBarList}>
      {rows.map((r, i) => {
        const tone = classifyBarTone(r.value);
        const color = tone ? BAR_TONE_COLOR[tone] : "var(--ink-4)";
        return (
          <div className={styles.aspekBarRow} key={r.key ?? `${r.label}-${i}`}>
            <span className={styles.aspekBarIcon}>{rankByNumber ? i + 1 : (r.icon || "•")}</span>
            <span className={styles.aspekBarLabel} title={r.label}>{r.label}</span>
            <div className={styles.aspekBarTrack}>
              <div
                className={styles.aspekBarFill}
                style={{ width: shown ? `${r.value}%` : 0, background: color, transitionDelay: `${i * 55}ms` }}
              />
            </div>
            <span className={styles.aspekBarVal}>{r.value}%</span>
          </div>
        );
      })}
    </div>
  );
}

/** Empty-state positif: dipakai saat "perlu penguatan" ternyata kosong (semua sudah baik). */
export function GoodEmptyState({ title, text }) {
  return (
    <div className={styles.goodEmpty}>
      <span className={styles.goodEmptyIcon}>✓</span>
      <p className={styles.goodEmptyTitle}>{title}</p>
      {text && <p className={styles.goodEmptyText}>{text}</p>}
    </div>
  );
}

/**
 * Donut/pie sederhana: satu lingkaran dengan porsi terisi = value% dan angka di tengah.
 * Warna ikut palet status 3 tingkat supaya makna tetap konsisten.
 */
export function Donut({ value, size = 116, label }) {
  const [wrapRef, shown] = useReveal();
  const v = value == null ? null : Math.max(0, Math.min(100, value));
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone = classifyBarTone(v);
  const color = tone ? BAR_TONE_COLOR[tone] : "var(--ink-4)";
  // Arc mengisi 0 -> nilai saat masuk viewport (re-animate tiap scroll masuk lagi).
  const dash = (shown && v != null) ? (v / 100) * c : 0;
  return (
    <div ref={wrapRef} className={styles.donutWrap} style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={c / 4} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dasharray 0.7s ease" }}
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
          fontFamily="'Google Sans Flex Variable', sans-serif" fontSize={size * 0.24} fontWeight={800} fill="var(--ink)">
          {v == null ? "—" : `${v}%`}
        </text>
      </svg>
      {label && <span className={styles.donutLabel}>{label}</span>}
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

/** Isi satu kartu refleksi; label emosinya ikut sumber (orang tua menilai anak, siswa lapor diri). */
function ReflectionCard({ pernyataan, meta }) {
  return (
    <div className={styles.reflectionCard}>
      {pernyataan.kategori_pernyataan && (
        <span className={styles.reflectionTag}>{pernyataan.kategori_pernyataan}</span>
      )}
      {pernyataan.pernyataan && <blockquote className={styles.reflectionQuote}>“{pernyataan.pernyataan}”</blockquote>}
      <div className={styles.reflectionMetaGrid}>
        {pernyataan.emosi_anak && (
          <div>
            <span className={styles.metaLabel}>{meta.emosiLabel}</span>
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

/**
 * Kartu refleksi untuk satu murid.
 *
 * Dua bentuk pemakaian, keduanya sah:
 * - lama, satu sumber: `pernyataan` (satu baris atau null) + `namaMurid`. DOM-nya persis sama
 *   dengan sebelum multi-sumber, tanpa badge, karena satu-satunya sumber saat itu orang tua.
 * - baru, multi-sumber: `blocks = [{ sumber, row }]`. Satu kartu per entri dengan badge sumber,
 *   dan entri yang `row`-nya kosong tetap dirender sebagai empty state milik sumber itu supaya
 *   kelihatan sumber mana yang belum mengisi, bukan hilang tanpa jejak.
 */
export function ReflectionBlock({ pernyataan, namaMurid, blocks }) {
  if (Array.isArray(blocks)) {
    return (
      <div className={styles.reflectionBlocks}>
        {blocks.map(({ sumber, row }) => {
          const meta = refleksiMeta(sumber);
          return (
            <div key={meta.key} className={styles.reflectionBlockItem}>
              <span className={styles.reflectionSourceBadge}>
                <span aria-hidden="true">{meta.icon}</span>
                {meta.label}
              </span>
              {row
                ? <ReflectionCard pernyataan={row} meta={meta} />
                : <p className={styles.briefingEmptyText}>{meta.emptyText.murid(namaMurid)}</p>}
            </div>
          );
        })}
      </div>
    );
  }

  const meta = REFLEKSI_META.orangtua;
  if (!pernyataan) {
    return <p className={styles.briefingEmptyText}>{meta.emptyText.murid(namaMurid)}</p>;
  }
  return <ReflectionCard pernyataan={pernyataan} meta={meta} />;
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

export function TrendChart({ points, aspek, aspekPrefix = "rata_input_guru_" }) {
  const gradientId = useId();
  const [hover, setHover] = useState(null);
  const wrapRef = useRef(null);
  // Ukur lebar kontainer supaya SVG benar-benar mengisi penuh frame (viewBox = piksel nyata,
  // 1:1, tanpa preserveAspectRatio yang bikin grafik ke-center dengan margin kiri-kanan).
  const [chartW, setChartW] = useState(600);
  useEffect(() => {
    // Baca lebar langsung (tidak bergantung ResizeObserver yang belum tentu ter-fire),
    // lalu ikuti perubahan lewat resize window + ResizeObserver bila ada.
    function measure() {
      const el = wrapRef.current;
      if (el && el.offsetWidth) setChartW(Math.round(el.offsetWidth));
    }
    measure();
    window.addEventListener("resize", measure);
    let ro;
    if (typeof ResizeObserver !== "undefined" && wrapRef.current) {
      ro = new ResizeObserver(measure);
      ro.observe(wrapRef.current);
    }
    return () => { window.removeEventListener("resize", measure); if (ro) ro.disconnect(); };
  }, []);

  if (points.length === 0) return <div ref={wrapRef}><p className={styles.briefingEmptyText}>Memuat riwayat…</p></div>;

  if (points.length < 2) {
    return (
      <div ref={wrapRef} className={styles.trendSingle}>
        <div className={styles.trendSingleVal}>{points[0].rata}%</div>
        <p className={styles.briefingEmptyText}>
          Baru ada data {periodeLabel(points[0].periode)}. Grafik perkembangan antar bulan
          akan muncul otomatis begitu periode berikutnya masuk.
        </p>
      </div>
    );
  }

  const w = Math.max(chartW, 240), h = 150, pad = 26;
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

  const hc = hover != null ? coords[hover] : null;
  const prev = hover != null && hover > 0 ? coords[hover - 1] : null;
  const delta = hc && prev ? hc.rata - prev.rata : null;
  const breakdown = hc && aspek
    ? aspek
        .map((a) => ({ label: a.aspek_label, icon: aspekIcon(a.aspek_label), value: ringkasanAspekValue(hc.ringkasan, a.aspek_kode, aspekPrefix) }))
        .filter((x) => x.value != null)
    : [];
  const tipLeft = hc ? Math.min(Math.max((hc.x / w) * 100, 24), 76) : 0;

  return (
    <div ref={wrapRef} className={styles.trendWrap}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ overflow: "visible" }}>
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
        {hc && <line x1={hc.x} x2={hc.x} y1={pad} y2={h - pad} stroke="var(--purple-300)" strokeWidth={1.5} />}
        {coords.map((c) => (
          <g key={c.periode}>
            <circle cx={c.x} cy={c.y} r={hc === c ? 6 : 4} fill="var(--purple-600)" stroke="#EDEDF0" strokeWidth={2} />
            <text x={c.x} y={c.y - 12} textAnchor="middle" fontSize={11} fontWeight={800} fill="var(--purple-700)" fontFamily="'Google Sans Flex Variable', sans-serif">
              {c.rata}%
            </text>
            <text x={c.x} y={h - 2} textAnchor="middle" fontSize={9.5} fontWeight={600} fill="var(--ink-3)" fontFamily="'Google Sans Flex Variable', sans-serif">
              {periodeLabel(c.periode)}
            </text>
          </g>
        ))}
        {/* Area sentuh per titik: hover memunculkan penjelasan angka rata-ratanya. */}
        {coords.map((c, i) => (
          <rect
            key={`hit-${c.periode}`}
            x={c.x - stepX / 2} y={0} width={stepX} height={h}
            fill="transparent" style={{ cursor: "pointer" }}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>

      {hc && (
        <div className={styles.trendTip} style={{ left: `${tipLeft}%` }}>
          <p className={styles.trendTipHead}>
            {periodeLabel(hc.periode)} · <strong>{hc.rata}%</strong>
          </p>
          {delta != null && (
            <p className={styles.trendTipDelta}>
              {delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : "→ 0"} poin dari bulan sebelumnya
            </p>
          )}
          {breakdown.length > 0 && (
            <>
              <p className={styles.trendTipLabel}>Rata-rata ini dari aspek karakter:</p>
              <ul className={styles.trendTipList}>
                {breakdown.map((b) => (
                  <li key={b.label}><span>{b.icon} {b.label}</span><strong>{b.value}%</strong></li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
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
    // sekolahId boleh array (Yayasan memantau banyak sekolah sekaligus).
    const sekolahIds = Array.isArray(sekolahId) ? sekolahId : [sekolahId];

    // Untuk scope "sekolah" satu baris per sekolah per periode sudah unik dari sekolah_id+scope
    // saja. Filter scope_id tambahan bikin grafik tren kosong total untuk sekolah yang baris
    // scope_id-nya tidak persis sama dengan session.school_id (mis. beda jalur import), padahal
    // kartu hero (KepsekView/YayasanView, tidak pernah filter scope_id untuk baris sekolah) tetap
    // tampil normal -- makanya angka hero muncul tapi grafik di bawahnya kosong.
    let query = supabase
      .from("karakter_summary")
      .select("periode_id, ringkasan")
      .in("sekolah_id", sekolahIds)
      .eq("scope", scope);
    if (scope !== "sekolah") query = query.in("scope_id", scopeIds);

    query.then(({ data }) => {
        if (!alive) return;
        const byPeriode = {};
        (data || []).forEach((r) => {
          // Sekolah lain bisa simpan angka ringkasan sekolah tanpa prefix "rata_" (mis.
          // "pencapaian_guru" alih-alih "rata_pencapaian_guru") -- kartu hero KepsekView/
          // YayasanView sudah toleran ke dua-duanya (lihat latestValue/rata di sana), tapi
          // hook ini (dipakai buat grafik tren) dulu cuma cek "rata_pencapaian_guru", jadi
          // grafik trennya kosong sama sekali untuk sekolah yang pakai nama kolom satunya,
          // padahal angka hero-nya sendiri tetap tampil normal lewat fallback itu.
          const v = scope === "sekolah"
            ? pct(r.ringkasan?.rata_pencapaian_guru ?? r.ringkasan?.pencapaian_guru)
            : pct(r.ringkasan?.rata_rata_pencapaian_guru);
          if (v === null) return;
          if (!byPeriode[r.periode_id]) byPeriode[r.periode_id] = { sum: 0, n: 0, ringkasan: null };
          byPeriode[r.periode_id].sum += v;
          byPeriode[r.periode_id].n += 1;
          // Simpan ringkasan mentah (untuk scope tunggal seperti sekolah) supaya tooltip grafik
          // bisa menjelaskan kenapa rata-ratanya segitu, dari aspek apa saja.
          byPeriode[r.periode_id].ringkasan = r.ringkasan;
        });
        const points = Object.entries(byPeriode)
          .map(([periode, v]) => ({ periode, rata: Math.round(v.sum / v.n), ringkasan: v.ringkasan }))
          .sort((a, b) => (a.periode > b.periode ? 1 : -1))
          .slice(-limit);
        setState({ loading: false, points });
      });

    return () => { alive = false; };
    // stringify supaya array baru dengan isi sama tidak memicu fetch ulang tiap render
  }, [JSON.stringify(sekolahId), scope, JSON.stringify(scopeId), limit]);

  return state;
}

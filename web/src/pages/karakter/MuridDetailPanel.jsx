import { useEffect, useMemo, useState } from "react";
import {
  TrendChart, TrendModeSwitch, ReflectionBlock, BelumAdaState,
  useMuridTrend, useMuridPekanTrend, useMuridSkorPeriode, labelTitikPekan,
} from "./KarakterShared";
import {
  periodeLabel, classifyBarIndividu, berbintang, hitungBintang,
  bangunItemsKarakter, indikatorPerluPenguatan,
  extractPlainText, isBlankEssay, matchedCategoryTags,
} from "./karakterMeta";
import styles from "./MuridDetailPanel.module.css";

/**
 * Panel detail satu anak di modul Karakter, dipakai persis sama oleh Wali Kelas dan Kepala
 * Sekolah / Wakil Kepala Sekolah. Satu komponen, bukan dua tampilan kembar: begitu panel ini
 * berubah, kedua peran ikut berubah tanpa ada yang tertinggal.
 *
 * Isinya urut dari atas: kepala kartu (nama, total, selisih dari periode sebelumnya), grafik
 * progres anak (bulanan atau pekanan), perkembangan tiap karakter yang bisa dibuka jadi rincian
 * indikator, indikator yang perlu penguatan lintas karakter, lalu refleksi dari rumah.
 *
 * Panel ini TIDAK menghitung skor. Semua angka datang dari view Supabase yang sudah final; yang
 * dikerjakan di sini cuma mengelompokkan indikator ke karakter induknya lalu mengurutkannya.
 */

const WARNA_BAR = {
  hijau: "var(--status-ok)",
  biru: "var(--status-berkembang)",
  merah: "var(--status-alert)",
};

export function Bintang({ className }) {
  return (
    <svg className={className || styles.bintang} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <polygon
        fill="var(--status-ok)"
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
      />
    </svg>
  );
}

// Bintang yang digambar satu per satu dibatasi supaya barisnya tidak jadi pita panjang di HP;
// sisanya ditulis sebagai angka. Sekolah pekanan bisa mengumpulkan puluhan bintang sebulan.
const BINTANG_MAKS_GAMBAR = 12;

/** Kartu ringkas "bintang terkumpul": jumlahnya digambar, bukan cuma ditulis. */
export function BintangSummary({ bintang, dinilai, jumlahPekan, pekan, labelPeriode }) {
  const digambar = Math.min(bintang, BINTANG_MAKS_GAMBAR);
  const sisa = bintang - digambar;
  const labelSaat = pekan != null ? `pekan ${pekan}` : labelPeriode;

  // Nol bintang tampil sebagai empty-state netral, bukan kartu hijau berangka 0. Angka 0 di
  // kartu yang warnanya sama dengan kartu "4 bintang" terbaca seperti pencapaian, dan hijau
  // untuk ketiadaan pencapaian adalah sinyal yang salah (keputusan pemilik produk 2026-09-09).
  if (bintang === 0) {
    return (
      <div className={styles.bintangKosong}>
        <BelumAdaState
          title="Belum ada bintang terkumpul"
          text={`Bintang didapat tiap karakter yang mencapai 80%. Di ${labelSaat} belum ada yang sampai ke sana.`}
        />
      </div>
    );
  }

  const keterangan = pekan != null
    ? `Dari ${dinilai} karakter yang dinilai di pekan ${pekan}.`
    : jumlahPekan > 1
      ? `Terkumpul dari ${jumlahPekan} pekan penilaian sepanjang ${labelPeriode}, dari ${dinilai} penilaian karakter.`
      : `Dari ${dinilai} karakter yang dinilai di ${labelPeriode}.`;

  return (
    <div className={styles.bintangBox}>
      <div className={styles.bintangHead}>
        <span className={styles.bintangAngka}>{bintang}</span>
        <span className={styles.bintangLabel}>bintang terkumpul</span>
      </div>
      <div className={styles.bintangDeret} aria-hidden="true">
        {Array.from({ length: digambar }, (_, i) => <Bintang key={i} className={styles.bintangBesar} />)}
        {sisa > 0 && <span className={styles.bintangSisa}>+{sisa}</span>}
      </div>
      <p className={styles.bintangKeterangan}>{keterangan}</p>
    </div>
  );
}

/** Baris indikator: dipakai di dalam rincian satu karakter maupun di daftar perlu penguatan. */
export function IndikatorRows({ items }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={styles.indRows}>
      {items.map((it, i) => {
        const tone = classifyBarIndividu(it.value);
        const warna = tone ? WARNA_BAR[tone] : "var(--ink-4)";
        return (
          <div className={styles.indRow} key={`${it.label}-${i}`}>
            <span className={styles.indLabel}>
              {it.label}
              {it.aspekLabel && <span className={styles.indAspek}> · {it.aspekLabel}</span>}
            </span>
            <span className={`${styles.indTrack} ${tone ? "" : styles.trackKosong}`}>
              {tone && (
                <span
                  className={styles.fill}
                  style={{ width: shown ? `${it.value}%` : 0, background: warna, transitionDelay: `${i * 45}ms` }}
                />
              )}
            </span>
            <span className={styles.indVal} style={{ color: tone ? warna : "var(--ink-4)" }}>
              {tone ? `${it.value}%` : "Belum dinilai"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Daftar karakter dengan bar berwarna, bintang, dan tombol "Lihat detail" yang membuka rincian
 * indikator di bawahnya. Keadaan buka-tutup disimpan per baris, jadi guru bisa membuka dua
 * karakter sekaligus tanpa yang lain ikut terbuka.
 */
export function KarakterBreakdown({ items, emptyText }) {
  const [terbuka, setTerbuka] = useState(() => new Set());
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (items.length === 0) return <p className={styles.emptyNote}>{emptyText}</p>;

  const bisaDibuka = items.filter((it) => it.indikator.length > 0);
  const semuaTerbuka = bisaDibuka.length > 0 && bisaDibuka.every((it) => terbuka.has(it.kode));

  const toggle = (kode) => setTerbuka((prev) => {
    const next = new Set(prev);
    if (next.has(kode)) next.delete(kode); else next.add(kode);
    return next;
  });

  const toggleSemua = () => setTerbuka(semuaTerbuka ? new Set() : new Set(bisaDibuka.map((it) => it.kode)));

  return (
    <>
      {bisaDibuka.length > 1 && (
        <div className={styles.headActions} style={{ marginBottom: 10 }}>
          <button type="button" className={styles.btn} onClick={toggleSemua}>
            {semuaTerbuka ? "Tutup semua" : "Buka semua"}
          </button>
        </div>
      )}
      <div className={styles.rows}>
        {items.map((it, i) => {
          const tone = classifyBarIndividu(it.value);
          const warna = tone ? WARNA_BAR[tone] : "var(--ink-4)";
          const buka = terbuka.has(it.kode);
          return (
            <div key={it.kode}>
              <div className={styles.row}>
                <span className={`${styles.rowLabel} ${tone ? "" : styles.rowLabelKosong}`}>
                  <span className={styles.rowIcon} aria-hidden="true">{it.icon}</span>
                  {it.label}
                </span>
                <span className={`${styles.track} ${tone ? "" : styles.trackKosong}`}>
                  {tone && (
                    <span
                      className={styles.fill}
                      style={{ width: shown ? `${it.value}%` : 0, background: warna, transitionDelay: `${i * 55}ms` }}
                    />
                  )}
                </span>
                {tone ? (
                  <>
                    <span className={styles.val}>{it.value}%</span>
                    <span className={styles.starSlot}>{berbintang(it.value) && <Bintang />}</span>
                  </>
                ) : (
                  <span className={styles.valKosong}>Belum dinilai</span>
                )}
                {it.indikator.length > 0 && (
                  <span className={styles.btnSlot}>
                    <button
                      type="button"
                      className={`${styles.btn} ${buka ? styles.btnAktif : ""}`}
                      aria-expanded={buka}
                      onClick={() => toggle(it.kode)}
                    >
                      {buka ? "Tutup" : "Lihat detail"}
                    </button>
                  </span>
                )}
              </div>
              {buka && it.indikator.length > 0 && (
                <div className={styles.indikatorBox}>
                  <p className={styles.indikatorCaption}>Indikator yang dinilai</p>
                  <IndikatorRows items={it.indikator} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Judul dan teks kosong blok refleksi per murid saat cuma satu sumber tersedia (tanpa saklar,
 * tanpa badge). Nilai default (bukan "siswa") disalin persis dari teks lama. */
function judulRefleksiTunggal(sumber) {
  return sumber === "siswa" ? "💬 Refleksi siswa anak ini" : "💬 Refleksi orang tua anak ini";
}
function emptyRefleksiTunggal(sumber) {
  return sumber === "siswa"
    ? "Siswa ini belum menulis refleksi pada periode ini."
    : "Orang tua anak ini belum menulis refleksi pada periode ini.";
}

/**
 * Selisih rata-rata anak ini dengan periode sebelumnya, plus label periode pembandingnya.
 * Ditulis "naik 4% dari Agustus 2026", bukan "4pp": singkatan pp tidak dimengerti guru
 * (keputusan pemilik produk 2026-09-09).
 */
function selisihPeriode(points) {
  if (!points || points.length < 2) return null;
  const kini = points[points.length - 1];
  const lalu = points[points.length - 2];
  if (kini.rata == null || lalu.rata == null) return null;
  const value = kini.rata - lalu.rata;
  return { value, arah: value > 0 ? "naik" : value < 0 ? "turun" : "datar", periodeLalu: lalu.periode };
}

export default function MuridDetailPanel({
  sekolahId,
  murid,
  aspek = [],
  skorIndikatorRows = [],
  labelIndikator,
  pernyataanBySumber = {},
  sumberRefleksi = [],
  pekanAktif = false,
  pekan = null,
  periode = null,
}) {
  const [trenMode, setTrenMode] = useState("bulan");
  const { points: pointsBulan } = useMuridTrend(sekolahId, murid?.murid_id);
  const { points: pointsPekan } = useMuridPekanTrend(sekolahId, murid?.murid_id);
  const { rows: skorPeriode } = useMuridSkorPeriode({ sekolahId, muridId: murid?.murid_id, periode });

  const items = useMemo(
    () => bangunItemsKarakter({ murid, aspek, skorIndikatorRows, labelIndikator }),
    [murid, aspek, skorIndikatorRows, labelIndikator],
  );

  const indLemah = useMemo(() => indikatorPerluPenguatan(items), [items]);

  const refleksiBySumber = useMemo(() => (murid
    ? sumberRefleksi.map((sumber) => ({
        sumber,
        row: (pernyataanBySumber[sumber] || []).find((p) => p.murid_id === murid.murid_id) || null,
      }))
    : []), [murid, sumberRefleksi, pernyataanBySumber]);

  if (!murid) return null;

  const sumberTunggal = sumberRefleksi.length === 1 ? sumberRefleksi[0] : null;
  const refleksiTunggal = sumberTunggal
    ? refleksiBySumber.find((b) => b.sumber === sumberTunggal)?.row || null
    : null;
  const quoteText = refleksiTunggal ? extractPlainText(refleksiTunggal.pernyataan) : "";
  const showQuote = refleksiTunggal && !isBlankEssay(refleksiTunggal.pernyataan);
  const quoteTags = refleksiTunggal ? matchedCategoryTags(refleksiTunggal.kategori_pernyataan) : [];

  // Bintang dihitung dari baris mentah periode ini supaya penilaian tiap pekan ikut terhitung;
  // kalau baris itu tidak terbaca, jatuh ke skor per karakter yang sudah ada di panel.
  const ringkasanBintang = hitungBintang({
    rows: skorPeriode,
    pekan: pekanAktif ? pekan : null,
    fallback: {
      bintang: items.filter((it) => berbintang(it.value)).length,
      dinilai: items.filter((it) => classifyBarIndividu(it.value)).length,
      jumlahPekan: 0,
    },
  });

  const selisih = selisihPeriode(pointsBulan);
  const adaPekanan = pointsPekan.length > 1;
  const pakaiPekan = trenMode === "pekan" && adaPekanan;
  const labelPeriodeAktif = pekanAktif
    ? `${periodeLabel(periode) || "Periode ini"} · pekan ${pekan}`
    : periodeLabel(periode) || "Periode ini";

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.avatar} aria-hidden="true">{(murid.nama || "?").charAt(0).toUpperCase()}</span>
        <span className={styles.headerText}>
          <span className={styles.eyebrow}>Progres per anak</span>
          <h3 className={styles.nama}>{murid.nama}</h3>
        </span>
        <span className={styles.pills}>
          {murid.kelas_id && <span className={styles.pill}>{murid.kelas_id}</span>}
          <span className={styles.pill}>Total {murid.rata != null ? `${murid.rata}%` : "—"}</span>
          {selisih && (
            <span className={`${styles.pill} ${selisih.arah === "naik" ? styles.pillNaik : selisih.arah === "turun" ? styles.pillTurun : styles.pillDatar}`}>
              {selisih.arah === "naik" && `Naik ${selisih.value}% dari ${periodeLabel(selisih.periodeLalu)}`}
              {selisih.arah === "turun" && `Turun ${Math.abs(selisih.value)}% dari ${periodeLabel(selisih.periodeLalu)}`}
              {selisih.arah === "datar" && `Sama dengan ${periodeLabel(selisih.periodeLalu)}`}
            </span>
          )}
        </span>
      </div>

      <section>
        <div className={styles.sectionHead}>
          <p className={styles.sectionTitle}>📈 Progres anak ini</p>
          <span className={styles.headActions}>
            <TrendModeSwitch value={trenMode} onChange={setTrenMode} adaPekanan={adaPekanan} />
          </span>
        </div>
        {pakaiPekan ? (
          <TrendChart
            points={pointsPekan}
            labelOf={labelTitikPekan}
            keyOf={(p) => `${p.periode}|${p.pekanUrut}`}
            satuanDelta="pekan"
          />
        ) : (
          <TrendChart points={pointsBulan} />
        )}
      </section>

      <section>
        <div className={styles.sectionHead}>
          <p className={styles.sectionTitle}>📊 Perkembangan tiap karakter</p>
          <span className={styles.sectionNote}>{labelPeriodeAktif}</span>
        </div>
        <BintangSummary
          bintang={ringkasanBintang.bintang}
          dinilai={ringkasanBintang.dinilai}
          jumlahPekan={ringkasanBintang.jumlahPekan}
          pekan={pekanAktif ? pekan : null}
          labelPeriode={periodeLabel(periode) || "periode ini"}
        />
        <KarakterBreakdown items={items} emptyText="Belum ada skor karakter untuk anak ini." />
      </section>

      {indLemah.length > 0 && (
        <section>
          <p className={styles.sectionTitle}>🔧 Indikator perlu penguatan, lintas karakter</p>
          <IndikatorRows items={indLemah} />
        </section>
      )}

      <section>
        {sumberRefleksi.length > 1 ? (
          <>
            <p className={styles.sectionTitle}>💬 Refleksi anak ini</p>
            <ReflectionBlock blocks={refleksiBySumber} namaMurid={murid.nama} />
          </>
        ) : (
          <>
            <p className={styles.sectionTitle}>{judulRefleksiTunggal(sumberTunggal)}</p>
            {showQuote ? (
              <>
                {quoteTags.length > 0 && (
                  <div className={styles.quoteTagsRow}>
                    {quoteTags.map((t) => <span key={t.label} className={styles.quoteTagChip}>{t.icon} {t.label}</span>)}
                  </div>
                )}
                <p className={styles.quote}>&ldquo;{quoteText}&rdquo;</p>
              </>
            ) : (
              <p className={styles.emptyNote}>{emptyRefleksiTunggal(sumberTunggal)}</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}

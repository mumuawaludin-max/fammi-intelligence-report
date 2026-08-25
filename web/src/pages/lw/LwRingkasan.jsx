import { useMemo } from "react";
import { LwReveal } from "./LwReveal";
import { LwInsightBanner } from "./LwInsightBanner";
import { warnaKategori, PROTEK_CUTOFF } from "./lwMeta";
import tokens from "./lwTokens.module.css";
import styles from "./LwRingkasan.module.css";

const satu = (v) => (v ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function Panah({ naik, warna, ukuran = 13 }) {
  return (
    <svg
      width={ukuran} height={ukuran} viewBox="0 0 24 24" fill="none" stroke={warna}
      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      style={naik ? undefined : { transform: "rotate(180deg)" }}
      aria-hidden="true"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

/**
 * LwRingkasan -- layar pertama modul Wellbeing Guru: indeks, perkembangan antarperiode,
 * pergerakan tiap dimensi, dan analisis ahli. Pertanyaan yang dijawab layar ini: seberapa
 * sehat tim, dan ke mana arahnya.
 *
 * Cakupan "semua jenjang" punya angka tiga periode, jadi pembanding dimensinya Januari.
 * Cakupan satu jenjang hanya punya rincian periode terakhir, jadi pembandingnya rata-rata
 * yayasan pada periode yang sama -- membandingkan satu jenjang hari ini dengan yayasan
 * Januari tidak berarti apa-apa.
 */
export function LwRingkasan({ laporan, periodeId, jenjang, onPilihJenjang }) {
  const { briefing, perPeriode, trenUnit, guru } = laporan;

  const semuaScope = jenjang === "semua";
  const idx = Math.max(0, perPeriode.findIndex((p) => p.periodeId === periodeId));
  const kini = perPeriode[idx];
  const awal = perPeriode[0];

  const indeksPeriode = useMemo(() => {
    if (semuaScope) return perPeriode.map((p) => p.indeks);
    return perPeriode.map((p) => p.perUnit.find((u) => u.unit === jenjang)?.indeks ?? 0);
  }, [perPeriode, jenjang, semuaScope]);

  const indeks = indeksPeriode[idx];
  const delta = Math.round((indeks - indeksPeriode[0]) * 10) / 10;
  const naik = delta >= 0;

  // ── Dimensi ────────────────────────────────────────────────────────────────
  const dims = useMemo(() => {
    const unitKini = semuaScope ? null : kini.perUnit.find((u) => u.unit === jenjang);
    return kini.dimensi.map((d) => {
      const nilai = semuaScope ? d.nilai : (unitKini?.dimensi.find((x) => x.kode === d.kode)?.nilai ?? 0);
      const basis = semuaScope
        ? (awal.dimensi.find((x) => x.kode === d.kode)?.nilai ?? 0)
        : d.nilai;
      const dd = Math.round((nilai - basis) * 10) / 10;
      return { ...d, nilai, basis, delta: dd };
    });
  }, [kini, awal, jenjang, semuaScope]);

  const terlemah = dims.reduce((a, b) => (b.nilai < a.nilai ? b : a), dims[0]);
  const palingTurun = dims.reduce((a, b) => (b.delta < a.delta ? b : a), dims[0]);
  const nNaik = dims.filter((d) => d.delta > 0).length;
  const nTurun = dims.filter((d) => d.delta < 0).length;

  // ── KPI ────────────────────────────────────────────────────────────────────
  const guruScope = semuaScope ? guru : guru.filter((g) => g.unit === jenjang);
  const totalNonBaik = guruScope.filter((g) => g.kategoriTotal !== "Baik").length;
  const adaDimensiLemah = guruScope.filter((g) => g.lemah.length > 0).length;
  const unitTerendah = kini.perUnit.reduce((a, b) => (b.indeks < a.indeks ? b : a), kini.perUnit[0]);
  const unitTerendahTidakNaik = (trenUnit.find((t) => t.unit === unitTerendah.unit)?.titik ?? []);
  const unitStagnan = unitTerendahTidakNaik.length > 1
    && unitTerendahTidakNaik[unitTerendahTidakNaik.length - 1].nilai <= unitTerendahTidakNaik[0].nilai;
  const selisihYayasan = Math.round((indeks - kini.indeks) * 10) / 10;

  const kpi = [
    {
      label: "Skor total kategori Baik",
      nilai: `${guruScope.length - totalNonBaik} dari ${guruScope.length}`,
      ket: totalNonBaik === 0
        ? "Seluruh guru berada di rentang Baik pada skor total 141 sampai 252."
        : `${totalNonBaik} guru di bawah ambang 141 dan butuh pendampingan terjadwal.`,
      warna: "var(--lw-protek-baik)",
    },
    {
      label: "Ada dimensi di bawah Baik",
      nilai: `${adaDimensiLemah} guru`,
      ket: "Skor totalnya boleh jadi masih Baik, tetapi minimal satu dari enam dimensi tertinggal.",
      warna: "var(--lw-protek-perlu-perhatian)",
    },
    {
      label: "Dimensi terlemah",
      nilai: terlemah.label,
      ket: `Rata-rata ${satu(terlemah.nilai)} dari 42${palingTurun.delta < 0 ? `, dan ${palingTurun.label} turun ${satu(Math.abs(palingTurun.delta))} poin` : ""}.`,
      warna: "var(--lw-protek-waspada)",
    },
    semuaScope
      ? {
          label: "Jenjang paling perlu dukungan",
          nilai: unitTerendah.unit,
          ket: `Indeks ${satu(unitTerendah.indeks)}, terendah di antara ${kini.perUnit.length} jenjang${unitStagnan ? " dan satu-satunya yang belum membaik" : ""}.`,
          warna: "var(--lw-primary)",
        }
      : {
          label: "Posisi terhadap yayasan",
          nilai: `${selisihYayasan > 0 ? "+" : ""}${satu(selisihYayasan)} poin`,
          ket: `Rata-rata yayasan ${satu(kini.indeks)}. Jenjang ini ${selisihYayasan >= 0 ? "berada di atas" : "tertinggal dari"} rata-rata itu.`,
          warna: "var(--lw-primary)",
        },
  ];

  // ── Narasi hero ────────────────────────────────────────────────────────────
  const narasi = semuaScope
    ? (idx === 0
        ? `Ini titik awal pembanding. Indeks yayasan berada di ${satu(indeks)}, dengan ${terlemah.label} sebagai dimensi terlemah di angka ${satu(terlemah.nilai)} dari 42. Pindahkan periode untuk melihat ke mana angka ini bergerak.`
        : `Wellbeing guru ${naik ? "naik" : "turun"} ${satu(Math.abs(delta))} poin sejak ${awal.label}: ${nNaik} dimensi membaik, ${nTurun} memburuk. Yang perlu dibaca serius, ${palingTurun.label} bergerak ke arah sebaliknya dan ${unitTerendah.unit} belum ikut membaik.`)
    : `Indeks ${jenjang} berada di ${satu(indeks)}, ${naik ? "naik" : "turun"} ${satu(Math.abs(delta))} poin sejak ${awal.label} dan ${selisihYayasan >= 0 ? "di atas" : "di bawah"} rata-rata yayasan. Dimensi terlemahnya ${terlemah.label} di angka ${satu(terlemah.nilai)} dari 42.`;

  // ── Grafik tren ────────────────────────────────────────────────────────────
  const semuaNilai = [...perPeriode.map((p) => p.indeks), ...trenUnit.flatMap((t) => t.titik.map((x) => x.nilai))];
  const lo = Math.floor((Math.min(...semuaNilai) - 3) / 5) * 5;
  const hi = Math.ceil((Math.max(...semuaNilai) + 3) / 5) * 5;
  const W = 1080, H = 250, PAD_L = 54, PAD_R = 74;
  const gx = (i) => PAD_L + (i * (W - PAD_L - PAD_R)) / Math.max(1, perPeriode.length - 1);
  const gy = (v) => 208 - ((v - lo) / (hi - lo || 1)) * 178;
  const garis = [];
  for (let v = lo; v <= hi; v += 5) garis.push(v);

  const WARNA_UNIT = ["#2e9e6b", "#6c2bd9", "#d6455a", "#0891b2", "#d9a406", "#7c3aed"];
  const seriUnit = trenUnit.map((t, i) => ({
    unit: t.unit,
    warna: WARNA_UNIT[i % WARNA_UNIT.length],
    aktif: semuaScope || jenjang === t.unit,
    titik: t.titik.map((x, j) => ({ x: gx(j), y: gy(x.nilai), nilai: x.nilai })),
  }));

  // Label ujung garis saling didorong kalau berimpit, supaya angkanya tetap terbaca.
  const ujung = seriUnit
    .map((s) => ({ unit: s.unit, warna: s.warna, aktif: s.aktif, y: s.titik[s.titik.length - 1].y, nilai: s.titik[s.titik.length - 1].nilai }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < ujung.length; i += 1) {
    if (ujung[i].y - ujung[i - 1].y < 14) ujung[i].y = ujung[i - 1].y + 14;
  }

  const chips = [{ id: "semua", label: "Semua jenjang", jumlah: guru.length }].concat(
    kini.perUnit.map((u) => ({ id: u.unit, label: u.unit, jumlah: u.jumlahGuru })),
  );

  return (
    <div className={`${tokens.scope} ${styles.layar}`}>
      <div className={styles.filterBar}>
        <span className={styles.filterLabel}>Jenjang</span>
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`${styles.chip} ${jenjang === c.id ? styles.chipAktif : ""}`}
            aria-pressed={jenjang === c.id}
            onClick={() => onPilihJenjang(c.id)}
          >
            {c.label} <span className={styles.chipJumlah}>{c.jumlah}</span>
          </button>
        ))}
      </div>

      <LwReveal className={styles.hero}>
        <div className={styles.heroIndeks}>
          <p className={styles.heroEyebrow}>Indeks Wellbeing</p>
          <div className={styles.heroAngka}>
            <span className={styles.heroNilai}>{satu(indeks)}</span>
            <span className={styles.heroSkala}>/100</span>
          </div>
          <span className={`${styles.heroDelta} ${naik ? styles.heroDeltaNaik : styles.heroDeltaTurun}`}>
            <Panah naik={naik} warna={naik ? "#7ee0b0" : "#ff9daa"} />
            {delta > 0 ? "+" : ""}{satu(delta)} poin sejak {awal.labelPendek}
          </span>
        </div>

        <div className={styles.heroNarasi}>
          <p className={styles.heroNarasiEyebrow}>Bacaan periode ini</p>
          <p className={styles.heroNarasiTeks}>{narasi}</p>
        </div>

        <div className={styles.heroSpark}>
          <p className={styles.heroEyebrow}>{perPeriode.length} periode terakhir</p>
          <div className={styles.sparkRow}>
            {indeksPeriode.map((v, i) => {
              const maks = Math.max(...indeksPeriode);
              const min = Math.min(...indeksPeriode);
              const tinggi = 22 + ((v - min) / (maks - min || 1)) * 44;
              return (
                <div key={perPeriode[i].periodeId} className={styles.sparkKolom}>
                  <span className={`${styles.sparkNilai} ${i === idx ? styles.sparkNilaiAktif : ""}`}>{satu(v)}</span>
                  <span
                    className={`${styles.sparkBatang} ${i === idx ? styles.sparkBatangAktif : ""}`}
                    style={{ height: `${tinggi}px` }}
                  />
                  <span className={`${styles.sparkLabel} ${i === idx ? styles.sparkLabelAktif : ""}`}>{perPeriode[i].labelPendek}</span>
                </div>
              );
            })}
          </div>
        </div>
      </LwReveal>

      <div className={styles.kpiGrid}>
        {kpi.map((k) => (
          <LwReveal className={styles.kpiKartu} delay={0.03} key={k.label}>
            <div className={styles.kpiHead}>
              <span className={styles.kpiTitik} style={{ background: k.warna }} />
              <p className={styles.kpiLabel}>{k.label}</p>
            </div>
            <p className={styles.kpiNilai}>{k.nilai}</p>
            <p className={styles.kpiKet}>{k.ket}</p>
          </LwReveal>
        ))}
      </div>

      <LwReveal className={styles.kartu} delay={0.04}>
        <div className={styles.kartuHead}>
          <div>
            <h2 className={styles.kartuJudul}>Perkembangan wellbeing per jenjang</h2>
            <p className={styles.kartuSub}>Indeks tiap jenjang di {perPeriode.length} periode asesmen. Garis putus-putus adalah rata-rata yayasan.</p>
          </div>
          <div className={styles.legenda}>
            {seriUnit.map((s) => (
              <span key={s.unit} className={styles.legendaItem} style={{ opacity: s.aktif ? 1 : 0.4 }}>
                <span className={styles.legendaGaris} style={{ background: s.warna }} />
                {s.unit}
              </span>
            ))}
            <span className={styles.legendaItem}>
              <span className={styles.legendaGaris} style={{ background: "var(--lw-muted-2)" }} />
              Rata-rata yayasan
            </span>
          </div>
        </div>

        <svg className={styles.grafik} viewBox={`0 0 ${W} ${H}`} role="img"
          aria-label={`Grafik indeks wellbeing ${perPeriode.length} periode untuk ${trenUnit.length} jenjang`}>
          {garis.map((v) => (
            <g key={v}>
              <line x1={PAD_L} y1={gy(v)} x2={W - PAD_R} y2={gy(v)} stroke={v === lo ? "#e2ddd4" : "#f1ede6"} strokeWidth="1" />
              <text x={PAD_L - 12} y={gy(v) + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="var(--lw-muted-2)">{v}</text>
            </g>
          ))}
          {perPeriode.map((p, i) => (
            <text key={p.periodeId} x={gx(i)} y={H - 8} textAnchor="middle" fontSize="12.5"
              fontWeight={i === idx ? "760" : "600"} fill={i === idx ? "var(--lw-heading)" : "var(--lw-muted-2)"}>
              {p.labelPendek}
            </text>
          ))}
          <polyline
            points={perPeriode.map((p, i) => `${gx(i)},${gy(p.indeks)}`).join(" ")}
            fill="none" stroke="var(--lw-muted-2)" strokeWidth="2" strokeDasharray="6 5" strokeLinecap="round"
          />
          {seriUnit.map((s) => (
            <polyline key={s.unit} points={s.titik.map((t) => `${t.x},${t.y}`).join(" ")}
              fill="none" stroke={s.warna} strokeWidth={s.aktif ? 3 : 2} strokeLinecap="round"
              strokeLinejoin="round" opacity={s.aktif ? 1 : 0.18} />
          ))}
          {seriUnit.map((s) => s.titik.map((t, j) => (
            <circle key={`${s.unit}-${j}`} cx={t.x} cy={t.y} r={j === idx ? 6 : 4.5}
              fill="#fff" stroke={s.warna} strokeWidth={j === idx ? 3.5 : 2.5} opacity={s.aktif ? 1 : 0.18} />
          )))}
          {ujung.map((e) => (
            <text key={e.unit} x={W - PAD_R + 12} y={e.y + 4} fontSize="12" fontWeight="750"
              fill={e.warna} opacity={e.aktif ? 1 : 0.25}>{satu(e.nilai)}</text>
          ))}
        </svg>
      </LwReveal>

      <div className={styles.duaKolom}>
        <LwReveal className={styles.kartu} delay={0.05}>
          <h2 className={styles.kartuJudul}>Enam dimensi PROTEK, mana yang bergerak</h2>
          <p className={styles.kartuSub}>
            {semuaScope
              ? `Skor rata-rata dari 42, dibandingkan dengan ${awal.label}.`
              : "Skor rata-rata dari 42 pada periode ini, dibandingkan dengan rata-rata seluruh yayasan."}
          </p>

          <div className={styles.dimList}>
            {dims.map((d) => {
              const turun = d.delta < 0;
              return (
                <div className={styles.dimBaris} key={d.kode}>
                  <span className={styles.dimHuruf} style={{
                    background: turun ? "var(--lw-protek-waspada-bg)" : "var(--lw-soft)",
                    color: turun ? "var(--lw-protek-waspada)" : "var(--lw-primary)",
                  }}>{d.kode}</span>
                  <div className={styles.dimNama}>
                    <p>{d.label}</p>
                    <span>{d.ringkas}</span>
                  </div>
                  <div className={styles.dimTrack}>
                    <div className={styles.dimIsi} style={{
                      width: `${Math.max(0, Math.min(100, (d.nilai / 42) * 100))}%`,
                      background: turun ? "var(--lw-protek-waspada)" : d.nilai >= 35 ? "var(--lw-protek-baik)" : "var(--lw-primary)",
                    }} />
                    <div className={styles.dimPenanda} style={{ left: `${Math.max(0, Math.min(100, (d.basis / 42) * 100))}%` }} />
                  </div>
                  <div className={styles.dimAngka}>
                    <span className={styles.dimNilai}>{satu(d.nilai)}</span>
                    <span className={styles.dimDelta} style={{
                      color: turun ? "var(--lw-protek-waspada)" : d.delta === 0 ? "var(--lw-muted-2)" : "var(--lw-protek-baik)",
                    }}>{d.delta > 0 ? "+" : ""}{satu(d.delta)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className={styles.catatanKecil}>
            {semuaScope
              ? `Garis vertikal gelap menandai posisi ${awal.label}, jadi panjang batang di luar garis itu adalah pertumbuhannya.`
              : "Garis vertikal gelap menandai rata-rata yayasan. Rincian per jenjang tersedia untuk periode terakhir saja."}
          </p>
        </LwReveal>

        <div className={styles.sisiKanan}>
          <LwInsightBanner teks={briefing?.teks} delay={0.05} />

          {kini.narasi.length > 0 && (
            <LwReveal className={styles.analisisKartu} delay={0.06}>
              <p className={styles.analisisEyebrow}>Analisis ahli &middot; {kini.label}</p>
              {kini.narasi.map((n, i) => (
                <div className={styles.analisisItem} key={i}>
                  <p className={styles.analisisJudul}>{n.judul}</p>
                  <p className={styles.analisisIsi}>{n.isi}</p>
                </div>
              ))}
              <p className={styles.analisisNota}>
                Interpretasi disusun psikolog Fammi dari angka yang sudah final. Dashboard menampilkan, tidak menghitung ulang.
              </p>
            </LwReveal>
          )}
        </div>
      </div>

      <LwReveal className={styles.skalaStrip} delay={0.06}>
        <p className={styles.skalaJudul}>Skala kondisi kesehatan mental, dari skor total enam dimensi (1&ndash;252)</p>
        <div className={styles.skalaRow}>
          {PROTEK_CUTOFF.map((c) => (
            <span key={c.kategori} className={styles.skalaItem} style={{ color: warnaKategori(c.kategori) }}>
              <strong>{c.kategori}</strong> {c.min}&ndash;{c.max}
            </span>
          ))}
        </div>
        <p className={styles.skalaNota}>
          Seluruh skor dan kategori berasal dari asesmen yang sudah diskoring psikolog Fammi. Dashboard ini menampilkan, bukan menghitung ulang.
        </p>
      </LwReveal>
    </div>
  );
}

import { useState } from "react";
import { useGasRead } from "../../lib/useGasRead";
import { MI_META, MI_BY_CODE, processMIData, processOutputMI } from "./miMeta";
import StatTile from "../../components/StatTile";
import RadarChart from "../../components/charts/RadarChart";
import SectionHeading from "../../components/SectionHeading";
import FollowupRibbon from "../../components/FollowupRibbon";
import SampleTag from "../../components/SampleTag";
import styles from "./MIPage.module.css";

// ── Data contoh untuk preview sebelum Sheets terhubung ──────────────────────
const SAMPLE_FAKTA = [
  ...["Ie","Sp","Ve","Ki","Na","Lo","Ia","Mu"].flatMap((kode, ki) =>
    Array.from({ length: 28 }, (_, si) => ({
      murid_id: `M${si + 1}`,
      kelas_id: si < 14 ? "X-A" : "X-B",
      aspek_kode: kode,
      skor: 40 + Math.round(Math.random() * 50),
      dominan_flag: ki === [0,1,2,3,4,5,6,7][si % 8],
    }))
  ),
];
// nilai dominan yang lebih deterministik
const SAMPLE_DIST_OVERRIDE = { Ie: 7, Sp: 6, Ve: 5, Ki: 4, Na: 3, Lo: 2, Ia: 1, Mu: 1 };
const SAMPLE_AVG_OVERRIDE  = { Ie: 74, Sp: 69, Ve: 66, Ki: 62, Na: 58, Lo: 56, Ia: 53, Mu: 49 };

const SAMPLE_TINDAK_LANJUT = [
  { id: "TL-MI-1", action: "Sediakan variasi metode pembelajaran yang mendukung kecerdasan Interpersonal dan Spasial.", trigger: "Dua kecerdasan dominan mencakup 48% siswa", module: "mi", priority: "tinggi" },
  { id: "TL-MI-2", action: "Buat pojok refleksi di kelas sebagai ruang siswa dengan kecerdasan Intrapersonal.", trigger: "Kecerdasan Intrapersonal muncul di 4% siswa", module: "mi", priority: "sedang" },
  { id: "TL-MI-3", action: "Integrasikan kegiatan gerakan fisik pada mata pelajaran teori untuk mendukung siswa Kinestetik.", trigger: "14% siswa dominan Kinestetik, paling kurang difasilitasi", module: "mi", priority: "sedang" },
];

// ── Komponen internal ────────────────────────────────────────────────────────
function MIBarList({ items, total }) {
  const maxN = Math.max(...items.map((d) => d.n), 1);
  return (
    <div className={styles.barList}>
      {items.map((d) => {
        const m = MI_BY_CODE[d.code] || { name: d.code, color: "var(--purple-600)" };
        const pct = total > 0 ? Math.round((d.n / total) * 100) : 0;
        return (
          <div key={d.code} className={styles.barRow}>
            <span className={styles.barDot} style={{ background: m.color }} />
            <span className={styles.barName}>{m.name}</span>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${(d.n / maxN) * 100}%`, background: m.color }}
              />
            </div>
            <span className={styles.barCount}>{d.n}</span>
            <span className={styles.barPct}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

function KelasTable({ kelasList }) {
  if (!kelasList.length) return null;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {["Kelas", "Siswa", "Kecerdasan Utama"].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {kelasList.map((k) => {
            const m = k.topMI ? MI_BY_CODE[k.topMI] : null;
            return (
              <tr key={k.kelasId}>
                <td className={styles.tdKelas}>{k.kelasId}</td>
                <td className={styles.tdNum}>{k.nSiswa}</td>
                <td>
                  {m ? (
                    <span className={styles.miChip}>
                      <span className={styles.miDot} style={{ background: m.color }} />
                      {m.name}
                    </span>
                  ) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  const isToken  = message?.includes("Token") || message?.includes("kedaluwarsa") || message?.includes("tidak valid");
  const isSetup  = !isToken && (message?.includes("Sheet") || message?.includes("Cakupan") || message?.includes("langganan") || message?.includes("Workbook") || message?.includes("dikonfigurasi"));

  return (
    <div className={styles.stateBox}>
      <div className={styles.stateIcon}>!</div>
      <h3 className={styles.stateTitle}>
        {isToken ? "Sesi berakhir" : isSetup ? "Sheets belum terhubung" : "Gagal memuat data"}
      </h3>
      <p className={styles.stateMsg}>
        {isToken
          ? "Sesi login sudah berakhir. Klik Keluar di kanan atas lalu masuk kembali."
          : message}
      </p>
      {isSetup && (
        <p className={styles.setupHint}>
          Pastikan spreadsheet kontrol sudah punya sheet: <code>Akses_Kapabilitas</code>,{" "}
          <code>Akses_Cakupan</code>, <code>Langganan</code>, <code>Registry</code>, dan
          workbook data sekolah punya sheet <code>Fakta_Aspek</code>.
        </p>
      )}
      {!isToken && <button className={styles.retryBtn} onClick={onRetry}>Coba lagi</button>}
    </div>
  );
}

// ── Komponen utama ───────────────────────────────────────────────────────────
export default function MIPage({ session, periodeId }) {
  const { loading, data, error, refetch } = useGasRead("mi", periodeId, session);
  const [expanded, setExpanded] = useState(false);

  // Putuskan sumber data: Output_MI (format baru) > Fakta_Aspek (format lama) > contoh
  const hasOutputMI = Array.isArray(data?.output_mi) && data.output_mi.length > 0;
  const hasFakta    = Array.isArray(data?.fakta_aspek) && data.fakta_aspek.length > 0;
  const isSample    = !hasOutputMI && !hasFakta;

  const tl = isSample
    ? SAMPLE_TINDAK_LANJUT
    : (data?.tindak_lanjut || []).map((r) => ({
        id: r.tl_id || r.id,
        action: r.teks_aksi,
        trigger: r.pemicu_ringkas,
        module: "mi",
        priority: r.prioritas,
      }));

  // Hitung agregat
  let processed;
  if (hasOutputMI) {
    processed = processOutputMI(data.output_mi);
  } else if (hasFakta) {
    processed = processMIData(data.fakta_aspek);
  } else {
    processed = {
      nSiswa: 29,
      nKelas: 2,
      miDist: MI_META.map((m) => ({ ...m, n: SAMPLE_DIST_OVERRIDE[m.code] || 0 }))
        .sort((a, b) => b.n - a.n),
      miAvg: SAMPLE_AVG_OVERRIDE,
      kelasList: [
        { kelasId: "X-A", nSiswa: 15, topMI: "Ie" },
        { kelasId: "X-B", nSiswa: 14, topMI: "Sp" },
      ],
      students: [],
    };
  }

  const { nSiswa, nKelas, miDist, miAvg, kelasList } = processed;
  const topMI = miDist[0];
  const topPct = nSiswa > 0 ? Math.round((topMI.n / nSiswa) * 100) : 0;

  const radarAxes = MI_META.map((m) => ({
    label: m.name,
    short: m.code,
    value: miAvg[m.code] || 0,
    max: 100,
    color: m.color,
  }));

  if (loading) {
    return (
      <div className={styles.stateBox}>
        <div className={styles.spinner} />
        <p className={styles.stateMsg}>Memuat data Multiple Intelligence…</p>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  return (
    <div className={styles.page}>

      {/* ── Hero label ── */}
      <div className={styles.heroLabel}>
        <span className={styles.heroPill}>Multiple Intelligence</span>
        {isSample && <SampleTag />}
      </div>

      {/* ── Stat tiles ── */}
      <div className={styles.tiles}>
        <StatTile label="Siswa terpetakan" value={nSiswa} sub={`${nKelas} kelas`} />
        <StatTile
          label="Kecerdasan terbanyak"
          value={topPct}
          unit="%"
          sub={`${topMI.name} · ${topMI.n} siswa`}
        />
        <StatTile label="Kelas dipetakan" value={nKelas} />
        <StatTile
          label="Tindak lanjut aktif"
          value={tl.length}
          tone={tl.some((t) => t.priority === "tinggi") ? "perhatian" : "default"}
        />
      </div>

      {/* ── Sebaran kecerdasan ── */}
      <section className={styles.section}>
        <SectionHeading
          title="Sebaran Kecerdasan Dominan"
          subtitle="Jumlah siswa per kecerdasan terkuat. Kanan: rata-rata index seluruh kelas."
        />
        <div className={styles.sebaranGrid}>
          {/* Bar list */}
          <div className={styles.card}>
            <p className={styles.cardTitle}>Distribusi kecerdasan dominan</p>
            <p className={styles.cardSub}>n = {nSiswa} siswa · satu kecerdasan terkuat per siswa</p>
            <MIBarList items={miDist} total={nSiswa} />
          </div>

          {/* Radar */}
          <div className={styles.card}>
            <p className={styles.cardTitle}>Profil rata-rata sekolah</p>
            <p className={styles.cardSub}>Index 0–100 per kecerdasan</p>
            <div className={styles.radarWrap}>
              <RadarChart axes={radarAxes} size={260} />
            </div>
            <div className={styles.insightBox}>
              <span className={styles.insightLabel}>Ringkasan</span>
              <p className={styles.insightText}>
                Kecerdasan paling umum adalah <strong>{topMI.name}</strong> ({topMI.n} siswa · {topPct}%).
                Metode {topMI.tagline.toLowerCase()} akan menjangkau paling banyak siswa di sekolah ini.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Per kelas ── */}
      <section className={styles.section}>
        <SectionHeading
          title="Breakdown per Kelas"
          subtitle="Kecerdasan dominan terbanyak di tiap kelas."
        />
        <div className={styles.card}>
          <KelasTable kelasList={kelasList} />
        </div>
      </section>

      {/* ── Tindak lanjut ── */}
      <FollowupRibbon
        items={tl.filter((t) => t.module === "mi" || !t.module)}
        isSample={isSample}
      />
    </div>
  );
}

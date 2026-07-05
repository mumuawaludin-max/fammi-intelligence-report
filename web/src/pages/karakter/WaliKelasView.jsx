import { useMemo, useState } from "react";
import StatTile from "../../components/StatTile";
import SectionHeading from "../../components/SectionHeading";
import FollowupRibbon from "../../components/FollowupRibbon";
import {
  KarakterStateBox, BriefingOrEmpty, AspekRadarCard,
  AspekBarList, IndikatorGrid, ReflectionBlock, TrendChart, useMuridTrend, useSummaryTrend,
  CompareSection, NextStepCTA, withEntityColor, TindakLanjutDetailBody,
} from "./KarakterShared";
import DetailDialog from "./DetailDialog";
import { useKarakterWaliKelas } from "./useKarakterData";
import { pct, fracToPct, parseTop5Pair, parseTop5Indikator, deltaVsPrevious, SECTION_ICON } from "./karakterMeta";
import styles from "./KarakterViews.module.css";

function Top5List({ title, icon, tone, pairs, onSelect }) {
  if (!pairs.length) return null;
  const badgeCls = tone === "perhatian" ? styles.rankBadgeWarn : styles.rankBadge;
  return (
    <div className={styles.card}>
      <p className={styles.cardTitle}>{icon} {title}</p>
      <div className={styles.top5List}>
        {pairs.map((p, i) => (
          <button type="button" className={styles.top5Row} key={i} onClick={() => onSelect(p.nama)}>
            <span className={badgeCls}>{i + 1}</span>
            <span className={styles.top5Nama}>{p.nama}</span>
            <span className={tone === "perhatian" ? styles.top5NilaiWarn : styles.top5Nilai}>{p.nilai}</span>
            <span className={styles.rowArrowStatic}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function IndikatorList({ title, items, onSelect }) {
  if (!items.length) return null;
  return (
    <div className={styles.card}>
      <p className={styles.cardTitle}>{title}</p>
      <div className={styles.indikatorList}>
        {items.map((it, i) => (
          <button type="button" className={styles.indikatorRow} key={i} onClick={() => onSelect(it)}>
            <span>{it.label}</span>
            <strong>{it.nilai}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

function SiswaTable({ list, aspek, onSelect }) {
  if (!list.length) return <p className={styles.emptyNote}>Belum ada skor siswa untuk periode ini.</p>;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nama</th>
            {aspek.map((a) => (
              <th key={a.aspek_kode} className={styles.thCenter}>{a.aspek_label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((s) => (
            <tr key={s.murid_id} className={styles.rowClickable} onClick={() => onSelect(s)}>
              <td className={styles.tdNama}>{s.nama} <span className={styles.rowArrow}>›</span></td>
              {aspek.map((a) => (
                <td key={a.aspek_kode} className={styles.tdCenter}>
                  {s.skor[a.aspek_kode] != null ? `${s.skor[a.aspek_kode]}%` : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SentimenCard({ ringkasan, pernyataan }) {
  if (!ringkasan) return null;
  const perasaan = [
    { label: "Sangat positif", val: fracToPct(ringkasan.perasaan_sangat_positif), tone: "aman" },
    { label: "Positif", val: fracToPct(ringkasan.perasaan_positif), tone: "aman" },
    { label: "Netral", val: fracToPct(ringkasan.perasaan_netral), tone: "default" },
    { label: "Negatif", val: fracToPct(ringkasan.perasaan_negatif), tone: "perhatian" },
    { label: "Sangat negatif", val: fracToPct(ringkasan.perasaan_sangat_negatif), tone: "waspada" },
  ].filter((p) => p.val > 0);

  const dukungan = [
    ["dukungan_konsultasi_ringan", "Konsultasi ringan dengan guru"],
    ["dukungan_panduan_sederhana", "Panduan pembiasaan di rumah"],
    ["dukungan_rekomendasi_aktivitas", "Rekomendasi aktivitas bermain"],
    ["dukungan_kelas_parenting", "Kelas parenting tematik"],
    ["dukungan_sesi_diskusi", "Sesi diskusi reflektif"],
    ["dukungan_wadah_komunikasi", "Wadah komunikasi dua arah"],
    ["dukungan_belum_tahu", "Belum tahu"],
    ["dukungan_tidak_ada", "Tidak ada"],
  ]
    .map(([key, label]) => ({ label, val: fracToPct(ringkasan[key]) }))
    .filter((d) => d.val > 0)
    .sort((a, b) => b.val - a.val)
    .slice(0, 4);

  const quotes = (pernyataan || []).slice(0, 3);

  return (
    <div className={styles.card}>
      <p className={styles.cardTitle}>💬 Perasaan orang tua bulan ini</p>
      <div className={styles.sentimenRow}>
        {perasaan.map((p) => (
          <span key={p.label} className={`${styles.sentimenPill} ${styles[`tone_${p.tone}`]}`}>
            {p.label} · {p.val}%
          </span>
        ))}
      </div>

      {dukungan.length > 0 && (
        <>
          <p className={styles.cardSubTop}>Dukungan yang paling banyak diminta</p>
          <ul className={styles.dukunganList}>
            {dukungan.map((d) => (
              <li key={d.label}>
                <span>{d.label}</span>
                <strong>{d.val}%</strong>
              </li>
            ))}
          </ul>
        </>
      )}

      {quotes.length > 0 && (
        <>
          <p className={styles.cardSubTop}>Sebagian refleksi orang tua</p>
          <div className={styles.quoteList}>
            {quotes.map((q, i) => (
              <blockquote key={i} className={styles.quote}>
                “{q.pernyataan}”
                <cite>{q.nama_murid}</cite>
              </blockquote>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Isi dialog detail satu murid: skor per aspek, per indikator, tren antar bulan, refleksi ortu. */
function MuridDialogBody({ murid, aspek, indikator, pernyataan, sekolahId }) {
  const { points } = useMuridTrend(sekolahId, murid.murid_id);
  return (
    <>
      <section>
        <p className={styles.dialogSectionTitle}>{SECTION_ICON.tren} Tren antar bulan</p>
        <TrendChart points={points} />
      </section>
      <section>
        <p className={styles.dialogSectionTitle}>🧭 Skor per aspek</p>
        <AspekBarList aspek={aspek} skorByAspek={murid.skor} />
      </section>
      {indikator.length > 0 && (
        <section>
          <p className={styles.dialogSectionTitle}>⭐ Skor per indikator</p>
          <IndikatorGrid items={indikator} />
        </section>
      )}
      <section>
        <p className={styles.dialogSectionTitle}>💬 Refleksi orang tua</p>
        <ReflectionBlock pernyataan={pernyataan} namaMurid={murid.nama} />
      </section>
    </>
  );
}

export default function WaliKelasView({ session }) {
  const { loading, error, data } = useKarakterWaliKelas(session);
  const { points: trendPoints } = useSummaryTrend({
    sekolahId: session.school_id, scope: "kelas", scopeId: data?.kelasList,
  });
  const [selectedMuridId, setSelectedMuridId] = useState(null);
  const [selectedIndikatorItem, setSelectedIndikatorItem] = useState(null);
  const [selectedTindakLanjut, setSelectedTindakLanjut] = useState(null);

  const byMurid = useMemo(() => {
    if (!data) return {};
    const map = {};
    data.skor.forEach((r) => {
      if (!map[r.murid_id]) map[r.murid_id] = { murid_id: r.murid_id, nama: r.nama_murid, kelas_id: r.kelas_id, skor: {} };
      map[r.murid_id].skor[r.aspek_kode] = r.skor;
    });
    return map;
  }, [data]);

  const byNama = useMemo(() => {
    const map = {};
    Object.values(byMurid).forEach((m) => { map[m.nama] = m.murid_id; });
    return map;
  }, [byMurid]);

  const siswaList = useMemo(
    () => Object.values(byMurid).sort((a, b) => a.nama.localeCompare(b.nama)),
    [byMurid]
  );

  const indikatorByAspek = useMemo(() => {
    if (!data) return {};
    const map = {};
    data.indikator.forEach((it) => { map[`${it.aspek_kode}_${it.indikator_kode}`] = it.indikator_label; });
    return map;
  }, [data]);

  if (loading || error) return <KarakterStateBox loading={loading} error={error} />;

  const { periode, kelasList, aspek, summary, sekolahSummary, pernyataan, briefing, tindakLanjut } = data;
  const ringkasan = summary[0]?.ringkasan || null;

  const kelasEntities = withEntityColor(
    kelasList.map((kelasId) => ({
      id: kelasId, nama: kelasId,
      ringkasan: summary.find((r) => r.scope_id === kelasId)?.ringkasan || null,
      prefix: "input_guru_",
    }))
  );
  const compareEntities = sekolahSummary
    ? [...kelasEntities, { id: "sekolah", nama: "Rata-rata Sekolah", ringkasan: sekolahSummary.ringkasan, prefix: "rata_input_guru_", color: "var(--ink-3)" }]
    : kelasEntities;

  const nSiswa = ringkasan ? pct(ringkasan.total_siswa) ?? ringkasan.total_siswa : "—";
  const rataGuru = ringkasan ? pct(ringkasan.rata_rata_pencapaian_guru) : null;
  const aspekTerkuat = ringkasan?.karakter_tertinggi || "—";
  const aspekPerhatian = ringkasan?.karakter_terendah || "—";

  const top5Terbaik = ringkasan ? parseTop5Pair(ringkasan.top5_siswa_tertinggi, ringkasan.top5_nilai_siswa_tertinggi) : [];
  const top5Perhatian = ringkasan ? parseTop5Pair(ringkasan.top5_siswa_terendah, ringkasan.top5_nilai_siswa_terendah) : [];
  const indikatorTerbaik = ringkasan ? parseTop5Indikator(ringkasan.top5_indikator_terbaik) : [];
  const indikatorTerendah = ringkasan ? parseTop5Indikator(ringkasan.top5_indikator_terendah) : [];

  const tl = tindakLanjut.map((r) => ({
    id: r.id, action: r.action, trigger: r.trigger_desc, module: "karakter", priority: r.priority, _raw: r,
  }));

  const selectedMurid = selectedMuridId ? byMurid[selectedMuridId] : null;
  const selectedIndikator = selectedMurid
    ? data.skorIndikator
        .filter((r) => r.murid_id === selectedMuridId)
        .map((r) => ({
          aspek_kode: r.aspek_kode,
          indikator_kode: r.indikator_kode,
          label: indikatorByAspek[`${r.aspek_kode}_${r.indikator_kode}`] || r.indikator_kode,
          skor: r.skor,
        }))
    : [];
  const selectedPernyataan = selectedMurid
    ? pernyataan.find((p) => p.murid_id === selectedMuridId) || null
    : null;

  function openByNama(nama) {
    const muridId = byNama[nama];
    if (muridId) {
      setSelectedIndikatorItem(null);
      setSelectedMuridId(muridId);
    }
  }

  function openMurid(muridId) {
    setSelectedIndikatorItem(null);
    setSelectedMuridId(muridId);
  }

  function openIndikator(item) {
    setSelectedMuridId(null);
    setSelectedIndikatorItem(item);
  }

  return (
    <div className={styles.page}>
      <div className={styles.heroLabel}>
        <p className={styles.eyebrow}>Rapor Karakter</p>
        <h1 className={styles.heroPill}>{kelasList.join(", ")}</h1>
      </div>

      <BriefingOrEmpty briefing={briefing} periode={periode} label="Rapor Karakter Kelas" />

      <FollowupRibbon items={tl} onItemClick={(item) => setSelectedTindakLanjut(item._raw)} />

      <div className={styles.tiles}>
        <StatTile icon="👥" label="Siswa terpetakan" value={nSiswa} />
        <StatTile
          icon="📈" label="Rata-rata pencapaian" value={rataGuru ?? "—"} unit={rataGuru != null ? "%" : ""}
          delta={rataGuru != null ? deltaVsPrevious(trendPoints) : null}
        />
        <StatTile icon="🌟" label="Aspek terkuat" value={aspekTerkuat} compact />
        <StatTile
          icon="🌱"
          label="Perlu perhatian"
          value={aspekPerhatian}
          tone={aspekPerhatian !== "—" ? "perhatian" : "default"}
          compact
        />
      </div>

      {trendPoints.length >= 2 && (
        <section className={styles.section}>
          <SectionHeading
            icon={SECTION_ICON.tren}
            eyebrow="Perjalanan kelas"
            title="Perkembangan Kelas Antar Bulan"
            subtitle="Rata-rata pencapaian kelas dari periode ke periode."
          />
          <div className={styles.card}>
            <TrendChart points={trendPoints} />
          </div>
        </section>
      )}

      <section className={styles.section}>
        <SectionHeading
          icon={SECTION_ICON.profilKelas}
          eyebrow="Gambaran kelas"
          title="Profil Karakter Kelas"
          subtitle="Rata-rata pencapaian per aspek, dari input guru periode ini."
        />
        <div className={styles.gridTwo}>
          <AspekRadarCard
            title="Profil rata-rata kelas"
            subtitle="Index 0-100 per aspek karakter"
            aspek={aspek}
            ringkasan={ringkasan}
          />
          <div className={styles.stackTwo}>
            <Top5List title="Top 5 pencapaian siswa" icon="🏆" pairs={top5Terbaik} onSelect={openByNama} />
            <Top5List title="Top 5 perlu dukungan" icon="🌱" pairs={top5Perhatian} tone="perhatian" onSelect={openByNama} />
          </div>
        </div>
      </section>

      {compareEntities.length >= 2 && (
        <section className={styles.section}>
          <SectionHeading
            icon={SECTION_ICON.perbandinganKelas}
            eyebrow="Perbandingan"
            title="Kelas Kamu vs Rata-rata Sekolah"
            subtitle="Lihat posisi kelasmu dibanding rata-rata sekolah per aspek karakter."
          />
          <CompareSection
            title="Radar perbandingan"
            aspek={aspek}
            allEntities={compareEntities}
            defaultActiveIds={compareEntities.map((e) => e.id)}
          />
        </section>
      )}

      {(indikatorTerbaik.length > 0 || indikatorTerendah.length > 0) && (
        <section className={styles.section}>
          <SectionHeading
            icon={SECTION_ICON.indikator}
            title="Indikator Menonjol"
            subtitle="Indikator dengan pencapaian tertinggi dan terendah di kelas ini. Klik untuk lihat lengkap."
          />
          <div className={styles.gridTwo}>
            <IndikatorList title="Paling kuat" items={indikatorTerbaik} onSelect={openIndikator} />
            <IndikatorList title="Paling perlu latihan" items={indikatorTerendah} onSelect={openIndikator} />
          </div>
        </section>
      )}

      <section className={styles.section}>
        <SectionHeading
          icon={SECTION_ICON.skorSiswa}
          eyebrow="Klik nama untuk detail"
          title="Skor per Siswa"
          subtitle="Skor tiap aspek karakter, per anak. Klik satu baris untuk lihat tren, indikator, dan refleksi orang tuanya."
        />
        <SiswaTable list={siswaList} aspek={aspek} onSelect={(s) => openMurid(s.murid_id)} />
      </section>

      <section className={styles.section}>
        <SectionHeading icon={SECTION_ICON.suaraOrtu} title="Suara Orang Tua" subtitle="Ringkasan refleksi orang tua kelas ini." />
        <SentimenCard ringkasan={ringkasan} pernyataan={pernyataan} />
      </section>

      <NextStepCTA tindakLanjut={tindakLanjut} />

      {selectedMurid && (
        <DetailDialog
          icon={selectedMurid.nama.trim().charAt(0).toUpperCase()}
          eyebrow="Perkembangan Karakter"
          title={selectedMurid.nama}
          subtitle={selectedMurid.kelas_id}
          onClose={() => setSelectedMuridId(null)}
        >
          <MuridDialogBody
            murid={selectedMurid}
            aspek={aspek}
            indikator={selectedIndikator}
            pernyataan={selectedPernyataan}
            sekolahId={session.school_id}
          />
        </DetailDialog>
      )}

      {selectedIndikatorItem && (
        <DetailDialog
          icon="⭐"
          eyebrow="Indikator Karakter"
          title={selectedIndikatorItem.label}
          subtitle={`Pencapaian kelas: ${selectedIndikatorItem.nilai}`}
          onClose={() => setSelectedIndikatorItem(null)}
        >
          <p className={styles.dialogParagraph}>
            Indikator ini diambil dari input guru periode {periode}. Skor {selectedIndikatorItem.nilai} adalah rata-rata
            pencapaian kelas {kelasList.join(", ")} untuk indikator tersebut.
          </p>
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

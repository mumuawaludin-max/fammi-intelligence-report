import { useState } from "react";
import StatTile from "../../components/StatTile";
import SectionHeading from "../../components/SectionHeading";
import FollowupRibbon from "../../components/FollowupRibbon";
import { KarakterStateBox, BriefingOrEmpty, AspekRadarCard, AspekBarList, CompareSection, NextStepCTA, ParentVoiceBento, withEntityColor, TindakLanjutDetailBody } from "./KarakterShared";
import DetailDialog from "./DetailDialog";
import { useKarakterKepsek } from "./useKarakterData";
import { pct, ringkasanAspekValue, parseTop5Pair, parseTop5Indikator, SECTION_ICON } from "./karakterMeta";
import styles from "./KarakterViews.module.css";

function KelasLeaderboard({ rows, onSelect }) {
  const items = rows
    .map((r) => ({ kelasId: r.scope_id, nilai: pct(r.ringkasan?.rata_rata_pencapaian_guru) ?? 0, ringkasan: r.ringkasan }))
    .sort((a, b) => b.nilai - a.nilai);

  if (!items.length) return <p className={styles.emptyNote}>Belum ada data kelas untuk periode ini.</p>;
  const maxN = Math.max(...items.map((i) => i.nilai), 1);

  return (
    <div className={styles.barList}>
      {items.map((it) => (
        <button type="button" key={it.kelasId} className={styles.barRowClickable} onClick={() => onSelect(it)}>
          <span className={styles.barName}>{it.kelasId}</span>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${(it.nilai / maxN) * 100}%` }} />
          </div>
          <span className={styles.barCount}>{it.nilai}%</span>
          <span className={styles.rowArrowStatic}>›</span>
        </button>
      ))}
    </div>
  );
}

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

export default function KepsekView({ session }) {
  const { loading, error, data } = useKarakterKepsek(session);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [selectedJenjang, setSelectedJenjang] = useState(null);
  const [selectedTindakLanjut, setSelectedTindakLanjut] = useState(null);

  if (loading || error) return <KarakterStateBox loading={loading} error={error} />;

  const { periode, aspek, sekolah, jenjang, kelas, briefing, tindakLanjut, pernyataan } = data;
  const ringkasan = sekolah?.ringkasan || null;

  const rataGuru = ringkasan ? pct(ringkasan.rata_pencapaian_guru ?? ringkasan.pencapaian_guru) : null;
  const kelasSorted = [...kelas].sort(
    (a, b) => (pct(b.ringkasan?.rata_rata_pencapaian_guru) ?? 0) - (pct(a.ringkasan?.rata_rata_pencapaian_guru) ?? 0)
  );
  const kelasTerkuat = kelasSorted[0]?.scope_id ?? "—";
  const kelasPerhatian = kelasSorted[kelasSorted.length - 1]?.scope_id ?? "—";

  const tl = tindakLanjut.map((r) => ({
    id: r.id, action: r.action, trigger: r.trigger_desc, module: "karakter", priority: r.priority, _raw: r,
  }));

  // Semua kelas jadi opsi chip, tapi yang aktif di radar begitu dibuka cuma 3 terkuat + 3 perlu perhatian.
  const allKelasEntities = withEntityColor(kelasSorted).map((r) => ({
    id: r.scope_id, nama: r.scope_id, ringkasan: r.ringkasan, prefix: "input_guru_", color: r.color,
  }));
  const defaultActiveKelasIds = [
    ...kelasSorted.slice(0, 3).map((r) => r.scope_id),
    ...kelasSorted.slice(-3).map((r) => r.scope_id),
  ];

  return (
    <div className={styles.page}>
      <div className={styles.heroLabel}>
        <p className={styles.eyebrow}>Rapor Karakter</p>
        <h1 className={styles.heroPill}>Ringkasan Sekolah</h1>
      </div>

      <BriefingOrEmpty briefing={briefing} periode={periode} label="Rapor Karakter Sekolah" />

      <FollowupRibbon items={tl} onItemClick={(item) => setSelectedTindakLanjut(item._raw)} />

      <div className={styles.tiles}>
        <StatTile label="Kelas dipetakan" value={kelas.length} />
        <StatTile label="Rata-rata sekolah" value={rataGuru ?? "—"} unit={rataGuru != null ? "%" : ""} />
        <StatTile label="Kelas terkuat" value={kelasTerkuat} compact />
        <StatTile label="Perlu perhatian" value={kelasPerhatian} tone={kelasPerhatian !== "—" ? "perhatian" : "default"} compact />
      </div>

      <section className={styles.section}>
        <SectionHeading
          icon={SECTION_ICON.profilSekolah}
          eyebrow="Gambaran sekolah"
          title="Profil Karakter Sekolah"
          subtitle="Rata-rata pencapaian per aspek se-sekolah, dari input guru periode ini."
        />
        <div className={styles.gridTwo}>
          <AspekRadarCard
            title="Profil rata-rata sekolah"
            subtitle="Index 0-100 per aspek karakter"
            aspek={aspek}
            ringkasan={ringkasan}
            prefix="rata_input_guru_"
          />
          <div className={styles.card}>
            <p className={styles.cardTitle}>{SECTION_ICON.perbandinganKelas} Perbandingan antar kelas</p>
            <p className={styles.cardSub}>Diurut dari pencapaian tertinggi. Klik satu kelas untuk detail.</p>
            <KelasLeaderboard rows={kelas} onSelect={setSelectedKelas} />
          </div>
        </div>
      </section>

      {allKelasEntities.length >= 2 && (
        <section className={styles.section}>
          <SectionHeading
            icon={SECTION_ICON.perbandinganKelas}
            eyebrow="Perbandingan"
            title="Bandingkan Antar Kelas"
            subtitle="Klik chip kelas untuk menambah/mengurangi yang ditumpuk di radar."
          />
          <CompareSection
            title="Radar per kelas"
            subtitle="Index 0-100 per aspek karakter"
            aspek={aspek}
            allEntities={allKelasEntities}
            defaultActiveIds={defaultActiveKelasIds}
          />
        </section>
      )}

      <section className={styles.section}>
        <SectionHeading
          icon={SECTION_ICON.jenjang}
          title="Breakdown per Jenjang"
          subtitle="Pencapaian guru dan orang tua tiap jenjang. Klik satu baris untuk detail."
        />
        <div className={styles.card}>
          <JenjangTable rows={jenjang} onSelect={setSelectedJenjang} />
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading icon={SECTION_ICON.suaraOrtu} title="Suara Orang Tua" subtitle="Refleksi orang tua lintas kelas periode ini." />
        <ParentVoiceBento pernyataan={pernyataan} />
      </section>

      <NextStepCTA tindakLanjut={tindakLanjut} />

      {selectedKelas && (
        <DetailDialog
          icon="🧭"
          eyebrow="Detail Kelas"
          title={selectedKelas.kelasId}
          subtitle={`Rata-rata pencapaian ${selectedKelas.nilai}%`}
          onClose={() => setSelectedKelas(null)}
        >
          <section>
            <p className={styles.dialogSectionTitle}>Skor per aspek</p>
            <AspekBarList
              aspek={aspek}
              skorByAspek={Object.fromEntries(
                aspek.map((a) => [a.aspek_kode, ringkasanAspekValue(selectedKelas.ringkasan, a.aspek_kode)])
              )}
            />
          </section>
          {(() => {
            const top5 = parseTop5Pair(
              selectedKelas.ringkasan?.top5_siswa_tertinggi,
              selectedKelas.ringkasan?.top5_nilai_siswa_tertinggi
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
            const ind = parseTop5Indikator(selectedKelas.ringkasan?.top5_indikator_terbaik);
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
        </DetailDialog>
      )}

      {selectedJenjang && (
        <DetailDialog
          icon={SECTION_ICON.jenjang}
          eyebrow="Detail Jenjang"
          title={selectedJenjang.scope_id}
          subtitle={`Pencapaian guru ${selectedJenjang.ringkasan?.pencapaian_guru ?? "—"} · orang tua ${selectedJenjang.ringkasan?.pencapaian_orangtua ?? "—"}`}
          onClose={() => setSelectedJenjang(null)}
        >
          <section>
            <p className={styles.dialogSectionTitle}>Skor per aspek</p>
            <AspekBarList
              aspek={aspek}
              skorByAspek={Object.fromEntries(
                aspek.map((a) => [a.aspek_kode, ringkasanAspekValue(selectedJenjang.ringkasan, a.aspek_kode, "rata_input_guru_")])
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

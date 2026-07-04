import { useState } from "react";
import SectionHeading from "../../components/SectionHeading";
import FollowupCard from "../../components/FollowupCard";
import { KarakterStateBox, AspekBarList, CompareSection, NextStepCTA, ParentVoiceBento, withEntityColor, TindakLanjutDetailBody } from "./KarakterShared";
import DetailDialog from "./DetailDialog";
import { useKarakterYayasan } from "./useKarakterData";
import { pct, ringkasanAspekValue, SECTION_ICON } from "./karakterMeta";
import styles from "./YayasanView.module.css";

function SekolahCard({ sekolah, ringkasan, tlCount, onSelect }) {
  const rataGuru = pct(ringkasan?.rata_pencapaian_guru ?? ringkasan?.pencapaian_guru);
  const aspekTerkuat = ringkasan?.karakter_tertinggi;

  return (
    <button type="button" className={styles.sekolahCard} onClick={() => onSelect(sekolah)}>
      <div className={styles.sekolahTop}>
        <span className={styles.sekolahIcon}>🏫</span>
        <span className={styles.rowArrowStatic}>›</span>
      </div>
      <p className={styles.sekolahNama}>{sekolah.nama}</p>
      <div className={styles.sekolahStat}>
        <span className={styles.sekolahVal}>{rataGuru != null ? `${rataGuru}%` : "—"}</span>
        <span className={styles.sekolahLabel}>Rata-rata pencapaian</span>
      </div>
      {aspekTerkuat && (
        <p className={styles.sekolahMeta}>Aspek terkuat: <strong>{aspekTerkuat}</strong></p>
      )}
      <p className={styles.sekolahMeta}>
        {tlCount > 0 ? `${tlCount} tindak lanjut aktif` : "Belum ada tindak lanjut disetujui"}
      </p>
    </button>
  );
}

export default function YayasanView({ session }) {
  const { loading, error, data } = useKarakterYayasan(session);
  const [selectedSekolah, setSelectedSekolah] = useState(null);
  const [selectedTindakLanjut, setSelectedTindakLanjut] = useState(null);

  if (loading || error) return <KarakterStateBox loading={loading} error={error} />;

  const { periode, sekolahList, summary, aspekBySekolah, briefing, tindakLanjut, pernyataan } = data;

  if (sekolahList.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.heroLabel}>
          <p className={styles.eyebrow}>Rapor Karakter</p>
          <h1 className={styles.heroPill}>Yayasan</h1>
        </div>
        <p className={styles.emptyNote}>
          Belum ada sekolah yang terdaftar di bawah yayasan ini (cek kolom schools.yayasan_id).
        </p>
      </div>
    );
  }

  const summaryBySekolah = Object.fromEntries(summary.map((r) => [r.sekolah_id, r.ringkasan]));
  const tlBySekolah = {};
  tindakLanjut.forEach((r) => {
    (tlBySekolah[r.sekolah_id] ||= []).push(r);
  });
  const briefingBySekolah = Object.fromEntries((briefing || []).map((b) => [b.sekolah_id, b]));

  const selectedRingkasan = selectedSekolah ? summaryBySekolah[selectedSekolah.id] : null;
  const selectedAspek = selectedSekolah ? aspekBySekolah[selectedSekolah.id] || [] : [];

  // Aspek karakter custom per sekolah, jadi radar/bar antar sekolah pakai daftar aspek
  // sekolah pertama sebagai acuan sumbu. Sekolah lain yang tidak punya aspek itu tampil 0.
  const referenceAspek = aspekBySekolah[sekolahList[0]?.id] || [];
  const sekolahEntities = withEntityColor(sekolahList).map((s) => ({
    id: s.id, nama: s.nama, ringkasan: summaryBySekolah[s.id], prefix: "rata_input_guru_", color: s.color,
  }));

  return (
    <div className={styles.page}>
      <div className={styles.heroLabel}>
        <p className={styles.eyebrow}>Rapor Karakter</p>
        <div className={styles.heroTitleRow}>
          <h1 className={styles.heroPill}>Yayasan</h1>
          {periode && <span className={styles.periodTag}>{periode}</span>}
        </div>
      </div>

      <section className={styles.section}>
        <SectionHeading
          icon={SECTION_ICON.perbandinganSekolah}
          title="Perbandingan Antar Sekolah"
          subtitle="Tiap kartu memuat angka yang sudah final per sekolah, tidak digabung jadi satu rata-rata baru. Klik kartu untuk detail."
        />
        <div className={styles.sekolahGrid}>
          {sekolahList.map((s) => (
            <SekolahCard
              key={s.id}
              sekolah={s}
              ringkasan={summaryBySekolah[s.id]}
              tlCount={(tlBySekolah[s.id] || []).length}
              onSelect={setSelectedSekolah}
            />
          ))}
        </div>
      </section>

      {sekolahEntities.length >= 2 && (
        <section className={styles.section}>
          <SectionHeading
            icon={SECTION_ICON.perbandinganSekolah}
            eyebrow="Perbandingan"
            title="Bandingkan Antar Sekolah"
            subtitle="Memakai daftar aspek sekolah pertama sebagai acuan sumbu."
          />
          <CompareSection
            title="Radar per sekolah"
            subtitle="Index 0-100 per aspek karakter"
            aspek={referenceAspek}
            allEntities={sekolahEntities}
          />
        </section>
      )}

      <section className={styles.section}>
        <SectionHeading
          icon={SECTION_ICON.tindakLanjut}
          title="Tindak Lanjut per Sekolah"
          subtitle="Dikelompokkan per sekolah, urut prioritas."
        />
        {sekolahList.every((s) => !(tlBySekolah[s.id] || []).length) ? (
          <p className={styles.emptyNote}>Belum ada tindak lanjut disetujui untuk sekolah-sekolah ini.</p>
        ) : (
          sekolahList.map((s) => {
            const items = tlBySekolah[s.id] || [];
            if (!items.length) return null;
            return (
              <div key={s.id} className={styles.sekolahBlock}>
                <p className={styles.sekolahBlockTitle}>{s.nama}</p>
                <div className={styles.tlGrid}>
                  {items.map((t) => (
                    <FollowupCard
                      key={t.id}
                      action={t.action}
                      trigger={t.trigger_desc}
                      module="karakter"
                      priority={t.priority}
                      onClick={() => setSelectedTindakLanjut(t)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </section>

      {Object.keys(briefingBySekolah).length === 0 && (
        <p className={styles.emptyNote}>
          Briefing naratif per sekolah untuk periode ini belum tersedia.
        </p>
      )}

      <section className={styles.section}>
        <SectionHeading icon={SECTION_ICON.suaraOrtu} title="Suara Orang Tua" subtitle="Refleksi orang tua lintas sekolah periode ini." />
        <ParentVoiceBento pernyataan={pernyataan} />
      </section>

      <NextStepCTA tindakLanjut={tindakLanjut} />

      {selectedSekolah && (
        <DetailDialog
          icon="🏫"
          eyebrow="Detail Sekolah"
          title={selectedSekolah.nama}
          subtitle={periode || ""}
          onClose={() => setSelectedSekolah(null)}
        >
          {selectedRingkasan ? (
            <>
              <p className={styles.dialogParagraph}>
                Rata-rata pencapaian: <strong>{pct(selectedRingkasan.rata_pencapaian_guru ?? selectedRingkasan.pencapaian_guru)}%</strong>.
                {selectedRingkasan.karakter_tertinggi && <> Aspek terkuat: <strong>{selectedRingkasan.karakter_tertinggi}</strong>.</>}
              </p>
              {selectedAspek.length > 0 && (
                <section>
                  <p className={styles.dialogSectionTitle}>Skor per aspek</p>
                  <AspekBarList
                    aspek={selectedAspek}
                    skorByAspek={Object.fromEntries(
                      selectedAspek.map((a) => [a.aspek_kode, ringkasanAspekValue(selectedRingkasan, a.aspek_kode, "rata_input_guru_")])
                    )}
                  />
                </section>
              )}
            </>
          ) : (
            <p className={styles.dialogParagraph}>Belum ada ringkasan untuk sekolah ini periode ini.</p>
          )}
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

import { useMemo, useState } from "react";
import DetailDialog from "./DetailDialog";
import { useKelasSkorPeriode } from "./KarakterShared";
import { Bintang, BintangSummary, KarakterBreakdown } from "./MuridDetailPanel";
import {
  bangunItemsKarakter, berbintang, classifyBarIndividu, classifyPencapaian,
  hitungBintang, periodeLabel,
} from "./karakterMeta";
import styles from "./RingkasanKelasDialog.module.css";

/**
 * Ringkasan perkembangan SEKELAS dalam satu layar: tiap murid langsung tampil lengkap dengan bar
 * per karakter dan bintang yang terkumpul, tanpa perlu dibuka satu per satu. Dipakai persis sama
 * oleh Wali Kelas dan Kepala Sekolah / Wakil Kepala Sekolah.
 *
 * Bedanya dengan panel per anak: di sini cuma perkembangan karakter dan bintangnya. Grafik tren,
 * indikator perlu penguatan lintas karakter, dan refleksi dari rumah tetap tinggal di panel per
 * anak, karena isinya panjang dan tidak akan terbaca kalau dikalikan tiga puluh murid.
 *
 * Baris per karakter, bar berwarna, bintang, dan rincian indikatornya memakai komponen yang sama
 * dengan panel per anak (bukan tampilan kembar), jadi angka satu anak tidak mungkin berbeda cuma
 * karena dilihat dari sini.
 */

/** Id jangkar per kartu anak; pakai urutan, bukan murid_id, karena id murid bisa berisi spasi. */
function anchorId(i) {
  return `ringkasan-anak-${i}`;
}

/** Daftar "perlu perhatian" paling atas: nama, nilai, dan tombol lompat ke kartu anaknya. */
function PerhatianList({ rows, onJump }) {
  return (
    <div className={styles.perhatianRows}>
      {rows.map((r, i) => (
        <button type="button" key={r.murid.murid_id} className={styles.perhatianRow} onClick={() => onJump(r.index)}>
          <span className={styles.perhatianRank}>{i + 1}</span>
          <span className={styles.perhatianNama}>{r.murid.nama}</span>
          <span className={styles.perhatianTrack}>
            <span className={styles.perhatianFill} style={{ width: `${r.murid.rata}%` }} />
          </span>
          <span className={styles.perhatianVal}>{r.murid.rata}%</span>
          <span className={styles.perhatianJump}>Lihat</span>
        </button>
      ))}
    </div>
  );
}

export default function RingkasanKelasDialog({
  sekolahId,
  judulKelas,
  muridList = [],
  aspekUntukMurid,
  skorIndikator = [],
  labelIndikator,
  periode = null,
  pekanAktif = false,
  pekan = null,
  onClose,
}) {
  // Kartu anak terbuka semua sejak awal: yang diminta memang melihat sekelas sekaligus. Set ini
  // menyimpan yang DITUTUP, bukan yang dibuka, supaya keadaan awalnya kosong.
  const [tertutup, setTertutup] = useState(() => new Set());

  const muridIds = useMemo(() => muridList.map((m) => m.murid_id), [muridList]);
  const { loading: bintangLoading, rowsByMurid } = useKelasSkorPeriode({
    sekolahId, muridIds, periode, aktif: true,
  });

  const indikatorByMurid = useMemo(() => {
    const byMurid = {};
    skorIndikator.forEach((r) => { (byMurid[r.murid_id] ||= []).push(r); });
    return byMurid;
  }, [skorIndikator]);

  // Satu baris per anak, urut sama dengan daftar siswa (tertinggi di atas). Semua angka datang
  // dari baris skor yang sudah final; di sini cuma dikelompokkan.
  const anak = useMemo(() => muridList.map((murid, index) => {
    const items = bangunItemsKarakter({
      murid,
      aspek: aspekUntukMurid ? aspekUntukMurid(murid) : [],
      skorIndikatorRows: indikatorByMurid[murid.murid_id] || [],
      labelIndikator,
    });
    // Bintang dihitung dari baris mentah periode ini supaya penilaian tiap pekan ikut terhitung;
    // selama baris itu belum datang, yang dipakai skor per karakter yang sudah ada di layar.
    const ringkasanBintang = hitungBintang({
      rows: rowsByMurid[murid.murid_id] || [],
      pekan: pekanAktif ? pekan : null,
      fallback: {
        bintang: items.filter((it) => berbintang(it.value)).length,
        dinilai: items.filter((it) => classifyBarIndividu(it.value)).length,
        jumlahPekan: 0,
      },
    });
    return { murid, index, items, ringkasanBintang };
  }), [muridList, aspekUntukMurid, indikatorByMurid, labelIndikator, rowsByMurid, pekanAktif, pekan]);

  const perhatian = useMemo(() => anak
    .filter((a) => classifyPencapaian(a.murid.rata) === "perlu_perhatian")
    .sort((a, b) => a.murid.rata - b.murid.rata)
    .slice(0, 5), [anak]);

  const adaNilai = anak.filter((a) => classifyPencapaian(a.murid.rata) !== null).length;
  const jumlahBaik = anak.filter((a) => classifyPencapaian(a.murid.rata) === "baik").length;
  const totalBintang = anak.reduce((s, a) => s + a.ringkasanBintang.bintang, 0);
  const semuaTertutup = anak.length > 0 && tertutup.size === anak.length;

  const labelPeriode = pekanAktif
    ? `${periodeLabel(periode) || "Periode ini"} · pekan ${pekan}`
    : periodeLabel(periode) || "Periode ini";

  const toggle = (id) => setTertutup((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleSemua = () => setTertutup(semuaTertutup ? new Set() : new Set(anak.map((a) => a.murid.murid_id)));

  const lompatKe = (index) => {
    // Kartu yang dituju dibuka lebih dulu kalau sedang tertutup, supaya yang terlihat setelah
    // melompat bukan cuma kepala kartunya.
    setTertutup((prev) => {
      const next = new Set(prev);
      next.delete(muridList[index]?.murid_id);
      return next;
    });
    document.getElementById(anchorId(index))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <DetailDialog
      size="wide"
      icon="📋"
      eyebrow="Ringkasan sekelas"
      title={`Perkembangan Karakter ${judulKelas}`}
      subtitle={`${muridList.length} siswa · ${labelPeriode}`}
      onClose={onClose}
    >
      {muridList.length === 0 ? (
        <p className={styles.emptyNote}>Belum ada data siswa untuk kelas ini pada periode ini.</p>
      ) : (
        <>
          <div className={styles.metaBar}>
            <span className={styles.metaItem}><strong>{jumlahBaik}</strong> sudah baik</span>
            <span className={styles.metaItem}><strong>{adaNilai - jumlahBaik}</strong> perlu perhatian</span>
            <span className={styles.metaItem}>
              <Bintang className={styles.metaBintang} />
              <strong>{totalBintang}</strong> bintang sekelas
              {bintangLoading && <span className={styles.metaLoading}>menghitung</span>}
            </span>
            {anak.length > 1 && (
              <button type="button" className={styles.metaBtn} onClick={toggleSemua}>
                {semuaTertutup ? "Buka semua siswa" : "Tutup semua siswa"}
              </button>
            )}
          </div>

          {perhatian.length > 0 && (
            <section>
              <p className={styles.sectionTitle}>🌱 Top 5 siswa perlu perhatian</p>
              <p className={styles.sectionNote}>
                Di bawah 80% periode ini. Bukan berarti lemah, butuh dukungan tambahan sekarang.
              </p>
              <PerhatianList rows={perhatian} onJump={lompatKe} />
            </section>
          )}

          <section>
            <p className={styles.sectionTitle}>👥 Perkembangan tiap siswa</p>
            <div className={styles.kartuList}>
              {anak.map((a) => {
                const buka = !tertutup.has(a.murid.murid_id);
                const tone = classifyPencapaian(a.murid.rata);
                return (
                  <article className={styles.kartu} key={a.murid.murid_id} id={anchorId(a.index)}>
                    <button
                      type="button"
                      className={styles.kartuHead}
                      aria-expanded={buka}
                      onClick={() => toggle(a.murid.murid_id)}
                    >
                      <span className={styles.avatar}>{(a.murid.nama || "?").charAt(0).toUpperCase()}</span>
                      <span className={styles.kartuNama}>
                        {a.murid.nama}
                        {a.murid.kelas_id && <span className={styles.kartuKelas}>{a.murid.kelas_id}</span>}
                      </span>
                      <span className={`${styles.kartuBintang} ${a.ringkasanBintang.bintang === 0 ? styles.kartuBintangKosong : ""}`}>
                        <Bintang className={styles.kartuBintangIkon} />
                        {a.ringkasanBintang.bintang}
                      </span>
                      <span className={`${styles.kartuTone} ${tone === "baik" ? styles.toneBaik : tone === "perlu_perhatian" ? styles.tonePerhatian : styles.toneKosong}`}>
                        {tone === "baik" ? "Sudah Baik" : tone === "perlu_perhatian" ? "Perlu Perhatian" : "Belum ada data"}
                      </span>
                      <span className={styles.kartuNilai}>{a.murid.rata != null ? `${a.murid.rata}%` : "—"}</span>
                      <span className={`${styles.kartuChevron} ${buka ? styles.kartuChevronBuka : ""}`} aria-hidden="true">▾</span>
                    </button>
                    {buka && (
                      <div className={styles.kartuBody}>
                        <BintangSummary
                          bintang={a.ringkasanBintang.bintang}
                          dinilai={a.ringkasanBintang.dinilai}
                          jumlahPekan={a.ringkasanBintang.jumlahPekan}
                          pekan={pekanAktif ? pekan : null}
                          labelPeriode={periodeLabel(periode) || "periode ini"}
                        />
                        <KarakterBreakdown items={a.items} emptyText="Belum ada skor karakter untuk anak ini." />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </DetailDialog>
  );
}

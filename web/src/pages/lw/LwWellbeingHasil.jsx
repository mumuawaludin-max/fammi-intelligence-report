import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { LwReveal } from "./LwReveal";
import { LwBar, LwStackBar } from "./LwBar";
import { LwDialog } from "./LwDialog";
import tokens from "./lwTokens.module.css";
import styles from "./LwWellbeingHasil.module.css";

/**
 * Trio tingkat kategori PROTEK. Nama tone mengikuti semantik yang lurus (baik=hijau,
 * perluPerhatian=emas, waspada=merah) -- JANGAN disamakan dengan penamaan token PA yang
 * sengaja "meleset", lihat catatan di LwBar.jsx.
 */
const TINGKAT = [
  { kunci: "baik", label: "Baik", tone: "baik" },
  { kunci: "perluPerhatian", label: "Perlu Perhatian", tone: "perluPerhatian" },
  { kunci: "waspada", label: "Waspada", tone: "waspada" },
];

/** Dimensi dengan gabungan non-Baik terbanyak -- dipakai untuk kartu aktif awal. */
function dominanDari(ringkasan) {
  return (ringkasan || []).reduce((acc, d) => {
    const gab = d.perluPerhatian.jumlah + d.waspada.jumlah;
    const accGab = acc ? acc.perluPerhatian.jumlah + acc.waspada.jumlah : -1;
    return gab > accGab ? d : acc;
  }, null);
}

/** Label kiri + persen kanan + bar melintang di bawahnya, dipakai kartu dimensi DAN blok
 * per-unit -- padanan TingkatList di pa/PaHasilAsesmen.jsx. */
function TingkatList({ dimensi, tampilkanJumlah = false }) {
  return (
    <div className={styles.tingkatList}>
      {TINGKAT.map((t) => {
        const nilai = dimensi[t.kunci];
        return (
          <div className={styles.tingkat} key={t.kunci}>
            <span className={`${styles.tingkatLabel} ${styles[`ink_${t.tone}`]}`}>{t.label}</span>
            <span className={`${styles.tingkatValue} ${styles[`ink_${t.tone}`]}`}>
              {nilai.persen}%{tampilkanJumlah ? ` · ${nilai.jumlah}` : ""}
            </span>
            <LwBar
              persen={nilai.persen}
              tone={t.tone}
              size="sm"
              className={styles.tingkatBar}
              label={`${dimensi.label} ${t.label} ${nilai.persen} persen (${nilai.jumlah} orang)`}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * LwWellbeingHasil -- section inti laporan Wellbeing, gabungan gaya School Culture (heading
 * index pill center) dengan pola HEART Perilaku Anak (pa/PaHasilAsesmen.jsx): kartu dimensi
 * klikable + panel definisi-vs-temuan + blok per-unit + perbandingan antarunit + drill-down
 * dialog daftar nama. Satu state pemilih (selectedKey) mengendalikan panel penjelasan dan
 * grafik antarunit sekaligus.
 */
export function LwWellbeingHasil({ sectionIndex, ringkasan, perUnit, daftarPerhatian, namaLembaga, onSelectKandidat }) {
  const reduceMotion = useReducedMotion();
  const [selectedKey, setSelectedKey] = useState(() => dominanDari(ringkasan)?.kode || ringkasan[0]?.kode);
  const [dialogDimensi, setDialogDimensi] = useState(null);

  const selected = ringkasan.find((d) => d.kode === selectedKey) || ringkasan[0];
  const totalKandidat = selected
    ? selected.baik.jumlah + selected.perluPerhatian.jumlah + selected.waspada.jumlah
    : 0;
  const guruPerhatian = daftarPerhatian?.[selectedKey] || [];

  // Kalimat temuan dirakit lewat template dari angka final (preseden narasi template
  // useScData.js) -- bukan menghitung skor/status baru.
  const temuanTeks = useMemo(() => {
    if (!selected) return "";
    const nonBaik = selected.perluPerhatian.jumlah + selected.waspada.jumlah;
    if (nonBaik === 0) {
      return `Seluruh ${totalKandidat} guru berkategori Baik pada dimensi ini. Kondisi ini layak dijaga, bukan berarti selesai.`;
    }
    const bagian = [];
    if (selected.perluPerhatian.jumlah > 0) {
      bagian.push(`${selected.perluPerhatian.jumlah} guru berkategori Perlu Perhatian (${selected.perluPerhatian.persen}%)`);
    }
    if (selected.waspada.jumlah > 0) {
      bagian.push(`${selected.waspada.jumlah} guru berkategori Waspada (${selected.waspada.persen}%)`);
    }
    return `Dari ${totalKandidat} guru, ${bagian.join(" dan ")} pada dimensi ini. Nama-namanya bisa dilihat lewat tombol di bawah untuk ditindaklanjuti.`;
  }, [selected, totalKandidat]);

  const dialogGuru = dialogDimensi ? (daftarPerhatian?.[dialogDimensi.kode] || []) : [];

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <LwReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>Kondisi Kesehatan Mental per Dimensi PROTEK</h2>
        <p>Enam dimensi psychological well-being seluruh guru, ketuk kartu untuk melihat maknanya</p>
      </LwReveal>

      <LwReveal className={styles.dimensiGrid} delay={0.02}>
        {ringkasan.map((d) => {
          const active = d.kode === selectedKey;
          return (
            <button
              key={d.kode}
              type="button"
              className={`${styles.dimensiCard} ${active ? styles.dimensiCardActive : ""}`}
              aria-pressed={active}
              onClick={() => setSelectedKey(d.kode)}
            >
              <div className={styles.dimensiHead}>
                <span className={styles.huruf}>{d.huruf}</span>
                <p className={styles.dimensiLabel}>{d.label}</p>
              </div>
              <TingkatList dimensi={d} />
            </button>
          );
        })}
      </LwReveal>

      {selected && (
        <motion.div
          className={styles.meaningGrid}
          key={selectedKey}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.meaningCard}>
            <p className={styles.meaningEyebrow}>Apa itu {selected.label}?</p>
            <p className={styles.meaningDefinisi}>{selected.deskripsi}</p>
          </div>
          <div className={`${styles.meaningCard} ${styles.meaningCardInsight}`}>
            <p className={`${styles.meaningEyebrow} ${styles.meaningEyebrowInsight}`}>Temuan untuk {namaLembaga}</p>
            <p className={styles.meaningInsight}>{temuanTeks}</p>
            {guruPerhatian.length > 0 && (
              <button type="button" className={styles.daftarBtn} onClick={() => setDialogDimensi(selected)}>
                Lihat Daftar Nama ({guruPerhatian.length})
              </button>
            )}
          </div>
        </motion.div>
      )}

      <div className={styles.unitList}>
        {perUnit.map((u, i) => (
          <LwReveal className={styles.unitBlock} delay={0.04 + i * 0.04} amount={0.12} key={u.unit}>
            <p className={styles.unitTitle}>{u.unit} <span className={styles.unitJumlah}>{u.jumlahGuru} guru</span></p>
            <div className={styles.unitGrid}>
              {u.dimensi.map((d) => (
                <div className={styles.unitCard} key={d.kode}>
                  <p className={styles.unitCardLabel}>
                    <span className={styles.hurufMini}>{d.huruf}</span>{d.label}
                  </p>
                  <TingkatList dimensi={d} tampilkanJumlah />
                </div>
              ))}
            </div>
          </LwReveal>
        ))}
      </div>

      {selected && perUnit.length > 1 && (
        <LwReveal className={styles.compareCard} delay={0.06} amount={0.12}>
          <div className={styles.compareHead}>
            <h3>Bandingkan {selected.label} Antarunit</h3>
            <div className={styles.compareKeys}>
              <span className={styles.ink_baik}>Baik</span>
              <span className={styles.ink_perluPerhatian}>Perlu Perhatian</span>
              <span className={styles.ink_waspada}>Waspada</span>
            </div>
          </div>

          <div>
            {perUnit.map((u) => {
              const d = u.dimensi.find((x) => x.kode === selectedKey);
              if (!d) return null;
              return (
                <div className={styles.compareRow} key={u.unit}>
                  <div>
                    <p className={styles.compareUnitLabel}>{u.unit}</p>
                    <p className={styles.compareUnitNote}>{selected.label}</p>
                  </div>
                  <div className={styles.compareBody}>
                    <LwStackBar
                      size="lg"
                      segmen={[
                        { kode: "baik", persen: d.baik.persen, warna: "var(--lw-protek-baik)" },
                        { kode: "perluPerhatian", persen: d.perluPerhatian.persen, warna: "var(--lw-protek-perlu-perhatian)" },
                        { kode: "waspada", persen: d.waspada.persen, warna: "var(--lw-protek-waspada)" },
                      ]}
                      label={`${u.unit}: baik ${d.baik.persen} persen, perlu perhatian ${d.perluPerhatian.persen} persen, waspada ${d.waspada.persen} persen`}
                    />
                    <div className={styles.compareValues}>
                      <span className={styles.ink_baik}>Baik <strong>{d.baik.persen}% · {d.baik.jumlah}</strong></span>
                      <span className={styles.ink_perluPerhatian}>Perhatian <strong>{d.perluPerhatian.persen}% · {d.perluPerhatian.jumlah}</strong></span>
                      <span className={styles.ink_waspada}>Waspada <strong>{d.waspada.persen}% · {d.waspada.jumlah}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className={styles.compareNote}>Ketuk salah satu kartu dimensi di atas untuk mengganti dimensi yang dibandingkan. Baca persen bersama jumlah orangnya, karena jumlah guru tiap unit tidak besar.</p>
        </LwReveal>
      )}

      {dialogDimensi && (
        <LwDialog
          eyebrow={`Dimensi ${dialogDimensi.label}`}
          title="Daftar Nama Guru yang Perlu Ditindaklanjuti"
          subtitle={`${dialogGuru.length} guru berkategori di luar Baik pada dimensi ini. Klik nama untuk membuka laporan individunya.`}
          onClose={() => setDialogDimensi(null)}
          size="md"
        >
          <div className={styles.dialogHead}>
            <span>Nama guru</span><span>Unit</span>
            <span className={styles.dialogSkorHead}>Skor dimensi</span>
          </div>
          <ol className={styles.guruList}>
            {dialogGuru.map((g, i) => (
              <li key={g.id}>
                <button
                  type="button"
                  className={styles.guruRow}
                  onClick={() => { setDialogDimensi(null); onSelectKandidat?.(g.id); }}
                >
                  <span className={styles.guruNama}>
                    <span className={styles.guruIndex}>{i + 1}.</span>{g.nama}
                  </span>
                  <span className={styles.guruMeta}>{g.unit}</span>
                  <span className={`${styles.guruSkor} ${g.kategori === "Perlu Perhatian" ? styles.ink_perluPerhatian : styles.ink_waspada}`}>
                    {g.nilai} <em>{g.kategori}</em>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <p className={styles.dialogNote}>Daftar ini hanya terbuka untuk peran yang berhak menindaklanjuti. Kategori berasal langsung dari laporan sumber, bukan diagnosis.</p>
        </LwDialog>
      )}
    </section>
  );
}

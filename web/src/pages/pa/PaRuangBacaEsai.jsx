import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { PaReveal } from "./PaReveal";
import { PaIconBadge } from "./paIconBadge";
import { PaDialog } from "./PaDialog";
import { PA_DOMAIN_META, PA_ESAI_PERTANYAAN } from "./paAssembler";
import tokens from "./paTokens.module.css";
import styles from "./PaRuangBacaEsai.module.css";

const DOMAIN_BY_KODE = new Map(PA_DOMAIN_META.map((d) => [d.kode, d]));

/** Tiga tingkat sinyal pembacaan dari sheet NARASI, dipetakan ke skala warna yang sama dengan
 * bagian 02 dan 03. `null` (belum dianotasi) sengaja dapat tone terpisah, bukan jatuh ke salah
 * satu dari tiga tingkat -- supaya jelas beda antara "sudah ditelaah, ternyata ringan" dan
 * "belum sempat ditelaah sama sekali". */
const SINYAL_TONE = {
  Prioritas: "perhatian",
  Pantau: "waspada",
  Pencegahan: "aman",
};

// Berapa banyak kategori tema ditampilkan sekaligus -- kalau tim narasi sudah menulis banyak tag
// berbeda, tanpa batas ini halaman bisa memuat puluhan baris kategori sekaligus. Tema yang tidak
// tampil DISEBUTKAN jumlahnya secara eksplisit (bukan dipotong diam-diam), lihat catatan di bawah.
const MAKS_KATEGORI = 12;

function teksPertanyaan(kode) {
  return PA_ESAI_PERTANYAAN[kode] || kode;
}

function labelDomain(kode) {
  return DOMAIN_BY_KODE.get(kode)?.label || kode || "Domain lain";
}

function hurufDomain(kode) {
  return DOMAIN_BY_KODE.get(kode)?.huruf || "?";
}

function jumlahKata(teks) {
  const bersih = String(teks || "").trim();
  return bersih ? bersih.split(/\s+/).length : 0;
}

function persenSatuDesimal(bagian, total) {
  if (!total) return "0";
  return ((bagian / total) * 100).toFixed(1).replace(".", ",");
}

/** Satu kategori tema: label tampil (casing kemunculan pertama), kunci pengelompokan (trim+lower,
 * supaya "Takut Membebani" dan "takut membebani " dianggap tema yang sama), dan daftar entri. */
function kelompokkanPerTema(entri) {
  const byTema = new Map();
  const tanpaTema = [];
  for (const e of entri) {
    if (!e.tema || e.tema.length === 0) { tanpaTema.push(e); continue; }
    for (const t of e.tema) {
      const bersih = String(t).trim();
      if (!bersih) continue;
      const kunci = bersih.toLowerCase();
      if (!byTema.has(kunci)) byTema.set(kunci, { kunci, label: bersih, entri: [] });
      byTema.get(kunci).entri.push(e);
    }
  }
  const list = [...byTema.values()].sort((a, b) => b.entri.length - a.entri.length);
  if (tanpaTema.length > 0) {
    list.push({ kunci: "__tanpa_tema__", label: "Belum dianotasi", entri: tanpaTema, kosong: true });
  }
  return list;
}

/** Satu baris kategori: header (nama tema + proporsi) di kiri, satu kartu jawaban yang bisa
 * digeser kiri-kanan di kanan -- BUKAN daftar tegak seperti sebelumnya. Tiap kategori punya
 * indeks geser sendiri (dikelola induk lewat `indexAktif`/`onGeser`) supaya menggeser satu
 * kategori tidak memengaruhi kategori lain. */
function KategoriRow({ kategori, totalBeranotasi, indexAktif, onGeser }) {
  const reduceMotion = useReducedMotion();
  const jumlah = kategori.entri.length;
  const indeksAman = Math.min(indexAktif, jumlah - 1);
  const e = kategori.entri[indeksAman];
  const tone = e.prioritas ? (SINYAL_TONE[e.prioritas] || "waspada") : "muted";

  return (
    <PaReveal className={styles.kategoriRow} amount={0.1}>
      <div className={styles.kategoriHead}>
        <p className={styles.kategoriLabel}>{kategori.kosong ? kategori.label : `“${kategori.label}”`}</p>
        <p className={styles.kategoriMeta}>
          {jumlah} jawaban
          {!kategori.kosong && totalBeranotasi > 0 && ` · ${persenSatuDesimal(jumlah, totalBeranotasi)}% dari jawaban beranotasi`}
        </p>
      </div>

      <div className={styles.kategoriBody}>
        <motion.div
          key={`${kategori.kunci}-${e.id}-${e.pertanyaan_kode}`}
          className={styles.kategoriCard}
          initial={reduceMotion ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.kategoriCardHead}>
            <span className={styles.entriId}>
              {e.id} <span className={styles.entriDomain}>· {hurufDomain(e.domain)}</span>
              {e.unit && <span className={styles.entriDomain}> · {e.unit}</span>}
              <span className={styles.entriDomain}> · {jumlahKata(e.jawaban)} kata</span>
            </span>
            <span className={`${styles.status} ${styles[`status_${tone}`]}`}>{e.prioritas || "Belum dianotasi"}</span>
          </div>
          <p className={styles.kategoriPertanyaan}>{teksPertanyaan(e.pertanyaan_kode)}</p>
          <p className={styles.kategoriJawaban}>{e.jawaban}</p>
          {e.sinyal && <p className={styles.kategoriSinyal}>{e.sinyal}</p>}
        </motion.div>

        <div className={styles.kategoriPager}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => onGeser(-1)}
            disabled={jumlah <= 1}
            aria-label={`Jawaban sebelumnya di kategori ${kategori.label}`}
          >
            ←
          </button>
          <span className={styles.pagerIndex}>{indeksAman + 1}/{jumlah}</span>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => onGeser(1)}
            disabled={jumlah <= 1}
            aria-label={`Jawaban berikutnya di kategori ${kategori.label}`}
          >
            →
          </button>
        </div>
      </div>
    </PaReveal>
  );
}

/**
 * PaRuangBacaEsai -- ruang baca jawaban esai modul Perilaku Anak, di bagian 01 Statistik Siswa
 * (dipindah dari bagian 04 Survey atas permintaan pemilik produk).
 *
 * Pengelompokan lewat TEMA (bukan cuma domain seperti sebelumnya) -- tag tema dari sheet NARASI
 * adalah sinyal paling spesifik yang tersedia (domain cuma 2 nilai untuk esai, terlalu kasar
 * untuk terasa "insightful"). Kunci pengelompokan di-trim+lowercase supaya variasi penulisan
 * kecil dari tim narasi tidak pecah jadi kategori terpisah, tapi label yang TAMPIL tetap casing
 * asli kemunculan pertama -- tidak menormalkan isi tulisan tim narasi, cuma kunci pengelompokan.
 * Satu jawaban boleh muncul di lebih dari satu kategori kalau tag temanya lebih dari satu --
 * itu memang cara tag/tema cloud bekerja, bukan duplikasi data.
 *
 * Baris ke bawah = kategori (tema), diurutkan dari yang paling banyak disebut -- itulah bagian
 * "insight"-nya: pola yang paling sering muncul di suara siswa langsung kelihatan di atas, bukan
 * terkubur di tengah daftar abjad. Di dalam satu baris, jawabannya digeser kiri-kanan (bukan
 * daftar tegak) -- lihat KategoriRow.
 *
 * Data asli (`pa_esai`) juga TIDAK punya kelas siap pakai; jumlah kata dihitung ringan di sini
 * dari teks jawabannya sendiri (pemformatan tampilan, bukan skor/status yang dilarang CLAUDE.md).
 */
export function PaRuangBacaEsai({ data }) {
  const { statistik, entri } = data;

  const [cari, setCari] = useState("");
  const [domainAktif, setDomainAktif] = useState("semua");
  const [unitAktif, setUnitAktif] = useState("semua");
  const [indexByKategori, setIndexByKategori] = useState({});
  const [panduanTerbuka, setPanduanTerbuka] = useState(false);

  const domainTersedia = useMemo(() => {
    const kode = [...new Set(entri.map((e) => e.domain).filter(Boolean))];
    return [{ id: "semua", label: "Semua domain" }, ...kode.map((k) => ({ id: k, label: labelDomain(k) }))];
  }, [entri]);

  // Filter unit BERDIRI SENDIRI dari filter unit global halaman (PaFilterBar) -- pa_esai tidak
  // ikut aturan "unit=null artinya semua" seperti pa_lembaga/pa_siswa, jadi ruang baca ini butuh
  // kontrol sendiri, bukan menumpang filter global yang skema datanya beda.
  const unitTersedia = useMemo(() => {
    const unit = [...new Set(entri.map((e) => e.unit).filter(Boolean))];
    return [{ id: "semua", label: "Semua unit" }, ...unit.map((u) => ({ id: u, label: u }))];
  }, [entri]);

  const hasil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return entri.filter((e) => {
      if (domainAktif !== "semua" && e.domain !== domainAktif) return false;
      if (unitAktif !== "semua" && e.unit !== unitAktif) return false;
      if (!q) return true;
      const kolam = [e.id, teksPertanyaan(e.pertanyaan_kode), e.jawaban, labelDomain(e.domain), e.unit, ...(e.tema || [])];
      return kolam.filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [entri, cari, domainAktif, unitAktif]);

  const totalBeranotasi = useMemo(() => hasil.filter((e) => e.tema && e.tema.length > 0).length, [hasil]);

  const kategoriSemua = useMemo(() => kelompokkanPerTema(hasil), [hasil]);
  const kategoriTampil = kategoriSemua.slice(0, MAKS_KATEGORI);
  const kategoriTersembunyi = kategoriSemua.length - kategoriTampil.length;

  function gulirKategori(kategori, delta) {
    setIndexByKategori((prev) => {
      const jumlah = kategori.entri.length;
      const sekarang = Math.min(prev[kategori.kunci] ?? 0, jumlah - 1);
      const berikutnya = (sekarang + delta + jumlah) % jumlah;
      return { ...prev, [kategori.kunci]: berikutnya };
    });
  }

  return (
    <div className={`${tokens.scope} ${styles.wrap}`}>
      <PaReveal className={styles.head}>
        <div>
          <h3>Ruang baca jawaban esai</h3>
          <p>Baca suara siswa dalam konteksnya, dikelompokkan per tema, tanpa membuka identitas aslinya.</p>
        </div>
        <button type="button" className={styles.guideBtn} onClick={() => setPanduanTerbuka(true)}>
          Panduan membaca esai
        </button>
      </PaReveal>

      <PaReveal className={styles.statGrid} delay={0.04}>
        {statistik.map((s) => (
          <div className={styles.statCard} key={s.kode}>
            <p className={styles.statLabel}>{s.label}</p>
            <strong className={styles.statValue}>{s.nilai}</strong>
            <p className={styles.statDetail}>{s.detail}</p>
          </div>
        ))}
      </PaReveal>

      <PaReveal className={styles.filtersBar} delay={0.05}>
        <label className={styles.searchField}>
          <PaIconBadge icon="cari" size="xs" tone="plain" className={styles.searchIcon} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Ketik kata kunci, tema, atau kode anonim"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
        </label>

        <div className={styles.filterGroup}>
          <p className={styles.filterLabel}>Domain</p>
          <div className={styles.chips}>
            {domainTersedia.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`${styles.chip} ${domainAktif === d.id ? styles.chipActive : ""}`}
                aria-pressed={domainAktif === d.id}
                onClick={() => setDomainAktif(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {unitTersedia.length > 2 && (
          <div className={styles.filterGroup}>
            <p className={styles.filterLabel}>Unit sekolah</p>
            <div className={styles.chips}>
              {unitTersedia.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className={`${styles.chip} ${unitAktif === u.id ? styles.chipActive : ""}`}
                  aria-pressed={unitAktif === u.id}
                  onClick={() => setUnitAktif(u.id)}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </PaReveal>

      <p className={styles.hasilCount}>
        {hasil.length > 0
          ? `${hasil.length} jawaban cocok, dikelompokkan jadi ${kategoriSemua.length} kategori tema`
          : "Tidak ada jawaban yang cocok dengan filter ini"}
      </p>

      {kategoriTampil.length > 0 ? (
        <div className={styles.kategoriList}>
          {kategoriTampil.map((kategori) => (
            <KategoriRow
              key={kategori.kunci}
              kategori={kategori}
              totalBeranotasi={totalBeranotasi}
              indexAktif={indexByKategori[kategori.kunci] ?? 0}
              onGeser={(delta) => gulirKategori(kategori, delta)}
            />
          ))}
          {kategoriTersembunyi > 0 && (
            <p className={styles.kategoriSisa}>
              {kategoriTersembunyi} kategori tema lain tidak ditampilkan (masing-masing lebih jarang disebut). Persempit dengan pencarian atau filter untuk melihatnya.
            </p>
          )}
        </div>
      ) : (
        <div className={styles.kosong}>
          <PaIconBadge icon="esai" size="md" tone="purple" />
          <p className={styles.kosongJudul}>Belum ada jawaban yang cocok</p>
          <p className={styles.kosongPesan}>Ubah kata kunci pencarian, atau pilih domain/unit lain.</p>
        </div>
      )}

      {kategoriTampil.length > 0 && (
        <p className={styles.readerFoot}>
          Identitas asli siswa tidak ditampilkan. Sinyal dan saran di atas bahan diskusi wali
          kelas atau guru BK, bukan diagnosis.
        </p>
      )}

      {panduanTerbuka && (
        <PaDialog
          eyebrow="Ruang baca jawaban esai"
          title="Panduan membaca esai"
          subtitle="Empat hal yang perlu dipegang sebelum menyimpulkan apa pun dari jawaban terbuka siswa."
          onClose={() => setPanduanTerbuka(false)}
        >
          <ol className={styles.panduanList}>
            <li>
              <strong>Baca utuh, jangan potongan.</strong> Satu kalimat yang dicuplik hampir selalu
              kehilangan konteksnya. Jawaban di ruang ini sengaja ditampilkan penuh.
            </li>
            <li>
              <strong>Pisahkan cerita dari kesimpulan.</strong> Tema dan sinyal adalah pembacaan atas
              teks, bukan penilaian atas anaknya.
            </li>
            <li>
              <strong>Jangan mencari identitas.</strong> Kode anonim dipakai supaya isi cerita bisa
              dibahas terbuka tanpa membuat siswa menyesal sudah jujur.
            </li>
            <li>
              <strong>Tindak lanjuti polanya, bukan satu kasus.</strong> Kategori tema yang paling
              banyak disebut di atas adalah pola yang paling layak jadi kebijakan kelas atau
              sekolah, bukan satu jawaban yang kebetulan menonjol.
            </li>
          </ol>
        </PaDialog>
      )}
    </div>
  );
}

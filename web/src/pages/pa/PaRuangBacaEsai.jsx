import { useMemo, useState } from "react";
import { PaReveal } from "./PaReveal";
import { PaIconBadge } from "./paIconBadge";
import { PaDialog } from "./PaDialog";
import { PA_DOMAIN_META, PA_ESAI_PERTANYAAN } from "./paAssembler";
import tokens from "./paTokens.module.css";
import styles from "./PaRuangBacaEsai.module.css";

const DOMAIN_BY_KODE = new Map(PA_DOMAIN_META.map((d) => [d.kode, d]));

/** Empat tingkat "sinyal pembacaan", persis kalimat pembuka yang diminta di PROMPT Pengisian
 * Narasi Perilaku Anak.md ("Sinyal positif." / "Sinyal ringan." / "Perlu dipantau." /
 * "Prioritas."). Dipetakan ke ikon + tone warna yang SAMA dengan skala tiga tingkat di bagian
 * 02/03 (aman/waspada/perhatian), "ringan" jatuh ke netral karena bukan salah satu dari tiga
 * tingkat keparahan itu. */
const SINYAL_PREFIX = [
  { cocok: /^sinyal positif\.?/i, tone: "aman", icon: "sinyalPositif", label: "Sinyal positif" },
  { cocok: /^sinyal ringan\.?/i, tone: "muted", icon: "sinyalRingan", label: "Sinyal ringan" },
  { cocok: /^perlu dipantau\.?/i, tone: "waspada", icon: "sinyalPantau", label: "Perlu dipantau" },
  { cocok: /^prioritas\.?/i, tone: "perhatian", icon: "sinyalPrioritas", label: "Prioritas" },
];

/** Prioritas anotasi (field terpisah dari kalimat sinyal) -> tone badge, dipakai di kartu daftar. */
const PRIORITAS_TONE = {
  Prioritas: "perhatian",
  Pantau: "waspada",
  Pencegahan: "aman",
};

function deteksiSinyal(teks) {
  if (!teks) return null;
  const bersih = teks.trim();
  return SINYAL_PREFIX.find((s) => s.cocok.test(bersih)) || null;
}

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

// Berapa banyak kategori tema ditampilkan sekaligus sebagai bento -- kalau tim narasi sudah
// menulis banyak tag berbeda, tanpa batas ini halaman bisa memuat puluhan kartu sekaligus. Tema
// yang tidak tampil DISEBUTKAN jumlahnya secara eksplisit (bukan dipotong diam-diam).
const MAKS_KATEGORI = 12;

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

/** Jawaban paling "kaya" dalam satu kategori -- dipakai jadi kutipan besar di kartu bento.
 * Diambil murni dari jumlah kata (mekanis, bisa diverifikasi), BUKAN skor subjektif "paling
 * bagus" yang tidak ada dasarnya di data -- jawaban yang lebih panjang genuinely lebih punya
 * konteks untuk dikutip dibanding jawaban satu-dua kata. */
function kutipanTerbaik(entri) {
  return entri.reduce((terbaik, e) => (
    !terbaik || jumlahKata(e.jawaban) > jumlahKata(terbaik.jawaban) ? e : terbaik
  ), null);
}

/** Satu kartu bento: label kategori muncul dulu, kutipan besar fade-up menyusul (delay), lalu
 * seluruh kartu interaktif -- diklik untuk membuka daftar lengkap kategori itu. */
function BentoCard({ kategori, besar, totalBeranotasi, onBuka }) {
  const kutipan = useMemo(() => kutipanTerbaik(kategori.entri), [kategori]);
  const sinyal = deteksiSinyal(kutipan?.sinyal);
  const jumlah = kategori.entri.length;

  return (
    <button
      type="button"
      className={`${styles.bentoCard} ${besar ? styles.bentoCardBesar : ""}`}
      onClick={onBuka}
    >
      {/* Dua PaReveal terpisah, BUKAN satu -- masing-masing men-trigger whileInView sendiri saat
          kartu masuk viewport, dengan delay berbeda. Itulah animasi dua tahap yang diminta:
          label kategori muncul dulu, kutipan menyusul sepersekian detik kemudian. */}
      <PaReveal className={styles.bentoKategori} amount={0.3}>
        <span className={styles.bentoKategoriLabel}>{kategori.label}</span>
        <span className={styles.bentoKategoriMeta}>
          {jumlah} jawaban
          {!kategori.kosong && totalBeranotasi > 0 && ` · ${persenSatuDesimal(jumlah, totalBeranotasi)}%`}
        </span>
      </PaReveal>

      <PaReveal className={styles.bentoQuoteWrap} delay={0.16} amount={0.3}>
        <PaIconBadge icon="kutipan" size="xs" tone="plain" className={styles.bentoQuoteIcon} />
        <p className={styles.bentoQuote}>{kutipan.jawaban}</p>
      </PaReveal>

      <div className={styles.bentoFoot}>
        {sinyal ? (
          <span className={`${styles.bentoSinyal} ${styles[`sinyal_${sinyal.tone}`]}`}>
            <PaIconBadge icon={sinyal.icon} size="xs" tone="plain" className={styles.bentoSinyalIcon} />
            {sinyal.label}
          </span>
        ) : <span className={styles.bentoSinyal} />}
        <span className={styles.bentoLihat}>Lihat semua jawaban →</span>
      </div>
    </button>
  );
}

/**
 * PaRuangBacaEsai -- ruang baca jawaban esai modul Perilaku Anak, di bagian 01 Statistik Siswa.
 *
 * Bento dinamis per kategori TEMA (bukan cuma domain -- tag tema dari sheet NARASI adalah sinyal
 * paling spesifik yang tersedia, domain cuma 2 nilai untuk esai, terlalu kasar untuk terasa
 * "insightful"). Kartu terbesar/pertama = tema paling banyak disebut, supaya pola paling
 * menonjol langsung kelihatan, bukan terkubur di tengah daftar abjad. Tiap kartu menampilkan
 * SATU kutipan (jawaban terpanjang di kategori itu) besar sebagai highlight, animasi dua tahap
 * (label kategori muncul dulu, kutipan menyusul) lewat PaReveal berdelay -- lihat catatan di
 * BentoCard. Kartu diklik untuk membuka dialog berisi SELURUH jawaban di kategori itu.
 *
 * Kunci pengelompokan tema di-trim+lowercase supaya variasi penulisan kecil dari tim narasi
 * tidak pecah jadi kategori terpisah, tapi label yang TAMPIL tetap casing asli kemunculan
 * pertama -- tidak menormalkan isi tulisan tim narasi, cuma kunci pengelompokan. Satu jawaban
 * boleh muncul di lebih dari satu kartu kalau tag temanya lebih dari satu -- itu memang cara
 * tag/tema cloud bekerja, bukan duplikasi data.
 */
export function PaRuangBacaEsai({ data }) {
  const { statistik, entri } = data;

  const [cari, setCari] = useState("");
  const [domainAktif, setDomainAktif] = useState("semua");
  const [unitAktif, setUnitAktif] = useState("semua");
  const [kategoriTerbuka, setKategoriTerbuka] = useState(null);
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
        <div className={styles.bentoGrid}>
          {kategoriTampil.map((kategori, i) => (
            <BentoCard
              key={kategori.kunci}
              kategori={kategori}
              besar={i === 0}
              totalBeranotasi={totalBeranotasi}
              onBuka={() => setKategoriTerbuka(kategori)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.kosong}>
          <PaIconBadge icon="esai" size="md" tone="purple" />
          <p className={styles.kosongJudul}>Belum ada jawaban yang cocok</p>
          <p className={styles.kosongPesan}>Ubah kata kunci pencarian, atau pilih domain/unit lain.</p>
        </div>
      )}

      {kategoriTersembunyi > 0 && (
        <p className={styles.kategoriSisa}>
          {kategoriTersembunyi} kategori tema lain tidak ditampilkan (masing-masing lebih jarang disebut). Persempit dengan pencarian atau filter untuk melihatnya.
        </p>
      )}

      {kategoriTampil.length > 0 && (
        <p className={styles.readerFoot}>
          Identitas asli siswa tidak ditampilkan. Sinyal dan saran di atas bahan diskusi wali
          kelas atau guru BK, bukan diagnosis.
        </p>
      )}

      {kategoriTerbuka && (
        <PaDialog
          eyebrow="Ruang baca jawaban esai"
          title={kategoriTerbuka.label}
          subtitle={`${kategoriTerbuka.entri.length} jawaban tercatat untuk kategori ini.`}
          onClose={() => setKategoriTerbuka(null)}
          size="lg"
        >
          <div className={styles.daftarEntri}>
            {kategoriTerbuka.entri.map((e) => {
              const sinyal = deteksiSinyal(e.sinyal);
              const toneStatus = e.prioritas ? (PRIORITAS_TONE[e.prioritas] || "waspada") : "muted";
              return (
                <div className={styles.entriCard} key={`${e.id}-${e.pertanyaan_kode}`}>
                  <div className={styles.entriCardHead}>
                    <span className={styles.entriId}>
                      {e.id} <span className={styles.entriDomain}>· {hurufDomain(e.domain)}</span>
                      {e.unit && <span className={styles.entriDomain}> · {e.unit}</span>}
                      <span className={styles.entriDomain}> · {jumlahKata(e.jawaban)} kata</span>
                    </span>
                    <span className={`${styles.status} ${styles[`status_${toneStatus}`]}`}>
                      {e.prioritas || "Belum dianotasi"}
                    </span>
                  </div>
                  <p className={styles.entriPertanyaan}>{teksPertanyaan(e.pertanyaan_kode)}</p>
                  <p className={styles.entriJawaban}>{e.jawaban}</p>
                  <p className={styles.entriSinyal}>
                    {sinyal && <PaIconBadge icon={sinyal.icon} size="xs" tone="plain" className={styles.entriSinyalIcon} />}
                    {e.sinyal || "Sinyal pembacaan belum ditulis untuk jawaban ini."}
                  </p>
                  {e.saran && <p className={styles.entriSaran}>{e.saran}</p>}
                </div>
              );
            })}
          </div>
        </PaDialog>
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
              <strong>Baca utuh, jangan potongan.</strong> Kutipan besar di kartu bento cuma
              teaser -- klik kartunya untuk membaca seluruh jawaban tanpa terpotong.
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
              <strong>Tindak lanjuti polanya, bukan satu kasus.</strong> Kartu bento terbesar adalah
              tema yang paling banyak disebut -- itu sinyal untuk kebijakan kelas atau sekolah,
              bukan satu jawaban yang kebetulan menonjol.
            </li>
          </ol>
        </PaDialog>
      )}
    </div>
  );
}

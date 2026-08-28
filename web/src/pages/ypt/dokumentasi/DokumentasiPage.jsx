import { useEffect, useMemo, useState } from "react";
import { supabase, fetchAllRows } from "../../../lib/supabase";
import { statusPanel } from "../components/Bits";
import { useReveal } from "../components/useReveal";
import {
  PreviewModal, FotoLightbox, FotoDrive, youtubeId, fotoUrl,
  IkonPutar, IkonGambar, IkonDokumen,
} from "./MediaEmbed";
import styles from "./Dokumentasi.module.css";

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

/** "2026-08-20" -> "20 Ags 2026". Tanggal kosong tidak memunculkan label sama sekali. */
function tanggalRingkas(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return `${d} ${BULAN[m - 1]} ${y}`;
}

/** Thumbnail video: pakai yang diunggah admin, atau turunkan dari YouTube. */
function videoThumb(item) {
  if (item.thumbnail_url) return fotoUrl(item.thumbnail_url);
  const vid = youtubeId(item.url);
  // Rekaman non-YouTube tidak punya thumbnail publik; kartunya tampil dengan bidang ikon
  // alih-alih gambar rusak.
  return vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : null;
}

/** Blok yang muncul dengan animasi naik saat tergulir masuk layar. */
function Blok({ children, tunda = 0 }) {
  const [ref, terlihat] = useReveal({ sekali: true });
  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${terlihat ? styles.revealOn : ""}`}
      style={tunda ? { transitionDelay: `${tunda}ms` } : undefined}
    >
      {children}
    </div>
  );
}

function JudulSection({ ikon, judul, ringkas, jumlah }) {
  return (
    <div className={styles.secHead}>
      <span className={styles.secIkon} aria-hidden="true">{ikon}</span>
      <div className={styles.secTeks}>
        <h2 className={styles.secJudul}>
          {judul}
          <span className={styles.secJumlah}>{jumlah}</span>
        </h2>
        <p className={styles.secRingkas}>{ringkas}</p>
      </div>
    </div>
  );
}

function SekolahChips({ daftar, maks = 2 }) {
  if (!daftar || daftar.length === 0) return null;
  const tampil = daftar.slice(0, maks);
  const sisa = daftar.length - tampil.length;
  return (
    <span className={styles.chipRow}>
      {tampil.map((s) => <span key={s} className={styles.chipSekolah}>{s}</span>)}
      {sisa > 0 && <span className={styles.chipSisa}>+{sisa}</span>}
    </span>
  );
}

/* ── Section rekaman ──────────────────────────────────────────────────────────────────────── */
function SectionVideo({ items, onBuka }) {
  if (items.length === 0) return null;
  return (
    <section className={styles.section}>
      <JudulSection
        ikon={<IkonPutar size={22} />}
        judul="Rekaman Kegiatan"
        ringkas="Siaran ulang sosialisasi dan pelaporan, diputar langsung di halaman ini."
        jumlah={items.length}
      />
      <div className={styles.gridVideo}>
        {items.map((item, i) => {
          const thumb = videoThumb(item);
          const tgl = tanggalRingkas(item.tanggal);
          return (
            <Blok key={item.id} tunda={Math.min(i, 5) * 45}>
              <button type="button" className={styles.kartuVideo} onClick={() => onBuka(item)}>
                <span className={styles.videoThumbWrap}>
                  {thumb
                    ? <img src={thumb} alt="" className={styles.videoThumb} loading="lazy" />
                    : <span className={styles.videoThumbKosong}><IkonPutar size={30} /></span>}
                  <span className={styles.videoPutar} aria-hidden="true"><IkonPutar size={22} /></span>
                  {item.kategori && <span className={styles.videoKategori}>{item.kategori}</span>}
                </span>
                <span className={styles.kartuIsi}>
                  <span className={styles.kartuJudul}>{item.judul}</span>
                  <span className={styles.kartuKaki}>
                    <SekolahChips daftar={item.sekolah_nama} />
                    {tgl && <span className={styles.kartuTanggal}>{tgl}</span>}
                  </span>
                </span>
              </button>
            </Blok>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Kelompokkan foto per sekolah. Yayasan membaca galeri ini per sekolah, bukan sebagai satu
 * tumpukan tanpa asal. Sekolah tanpa foto tidak pernah sampai ke sini -- baris fotonya memang
 * tidak ada di basis data.
 */
function kelompokkanFoto(items) {
  const peta = new Map();
  items.forEach((it) => {
    const nama = it.sekolah_nama?.[0] || "Tanpa sekolah";
    if (!peta.has(nama)) peta.set(nama, []);
    peta.get(nama).push(it);
  });
  return [...peta.entries()]
    .map(([nama, foto]) => ({ nama, foto }))
    .sort((a, b) => b.foto.length - a.foto.length || a.nama.localeCompare(b.nama, "id"));
}

/**
 * Pola ukuran bento, berulang tiap enam kartu pada kisi empat kolom.
 *
 * Urutannya dipilih supaya berdempet rapat dengan grid-auto-flow: dense. Kartu "besar" mengambil
 * 2 kolom x 2 baris, jadi empat kartu kecil sesudahnya persis mengisi dua kolom sisanya pada dua
 * baris yang sama; kartu "lebar" menutup baris berikutnya. Tidak ada kartu tegak (1 kolom x 2
 * baris): seluruh foto sumbernya lanskap, dan bingkai tegak akan memotongnya paling parah.
 *
 * Grup berisi tiga foto atau kurang TIDAK memakai pola ini sama sekali. Kartu besar 2x2 di kisi
 * empat kolom menyisakan setengah baris kosong yang tidak bisa diisi apa pun, dan lubang itu
 * terbaca seperti tata letak yang gagal, bukan seperti pilihan. Grup sekecil itu dirender sebagai
 * satu baris rata dengan kolom sebanyak fotonya (lihat kolomSedikit).
 */
const POLA_BENTO = ['besar', 'kecil', 'kecil', 'kecil', 'kecil', 'lebar'];

function ukuranBento(i) {
  return POLA_BENTO[i % POLA_BENTO.length];
}

/**
 * Jumlah kolom untuk grup kecil. Minimal dua supaya satu foto tidak melebar sendirian selebar
 * halaman, maksimal tiga supaya tiap foto masih cukup besar untuk dikenali.
 */
function kolomSedikit(total) {
  return Math.min(3, Math.max(2, total));
}

/* ── Section foto ─────────────────────────────────────────────────────────────────────────── */
function SectionFoto({ grup, jumlah, onBuka }) {
  if (jumlah === 0) return null;

  return (
    <section className={styles.section}>
      <JudulSection
        ikon={<IkonGambar size={22} />}
        judul="Galeri Foto"
        ringkas="Foto kegiatan di sekolah yang sudah mengirimkan dokumentasi."
        jumlah={jumlah}
      />
      {grup.map((g) => {
        const sedikit = g.foto.length <= 3;
        return (
          <div key={g.nama} className={styles.grupFoto}>
            <div className={styles.grupHead}>
              <h3 className={styles.grupNama}>{g.nama}</h3>
              <span className={styles.grupJumlah}>{g.foto.length} foto</span>
            </div>
            <div
              className={`${styles.gridFoto} ${sedikit ? styles.gridFotoSedikit : ""}`}
              style={sedikit
                ? { gridTemplateColumns: `repeat(${kolomSedikit(g.foto.length)}, 1fr)` }
                : undefined}
            >
              {g.foto.map((f, i) => (
                <FotoDrive
                  key={f.id}
                  src={fotoUrl(f.url)}
                  alt={f.judul}
                  className={`${styles.fotoKartu} ${styles.fotoBento} ${sedikit ? "" : styles[`bento_${ukuranBento(i)}`]}`}
                  onClick={() => onBuka(f)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

/* ── Section berkas ───────────────────────────────────────────────────────────────────────── */
function SectionFile({ items, onBuka }) {
  if (items.length === 0) return null;
  return (
    <section className={styles.section}>
      <JudulSection
        ikon={<IkonDokumen size={22} />}
        judul="Contoh Rapor"
        ringkas="Berkas rapor hasil program, bisa dibaca tanpa mengunduh."
        jumlah={items.length}
      />
      <div className={styles.gridFile}>
        {items.map((item, i) => (
          <Blok key={item.id} tunda={Math.min(i, 5) * 45}>
            <button type="button" className={styles.kartuFile} onClick={() => onBuka(item)}>
              <span className={styles.fileIkon} aria-hidden="true"><IkonDokumen size={24} /></span>
              <span className={styles.kartuIsi}>
                <span className={styles.kartuJudul}>{item.judul}</span>
                <SekolahChips daftar={item.sekolah_nama} />
              </span>
            </button>
          </Blok>
        ))}
      </div>
    </section>
  );
}

/* ── Halaman ──────────────────────────────────────────────────────────────────────────────── */

/**
 * Bagian tampilan, dipisah dari pengambilan data supaya bisa dirender dengan data contoh di
 * YptPreviewData tanpa sesi Supabase. Pemisahannya BUKAN kosmetik: seluruh halaman ini cuma bisa
 * dilihat oleh akun Yayasan Pendidikan Telkom yang sudah login, jadi tanpa jalur pratinjau
 * tata letaknya tidak pernah bisa diperiksa saat dikembangkan.
 */
export function DokumentasiIsi({ items }) {
  const [preview, setPreview] = useState(null);
  const [fotoIndeks, setFotoIndeks] = useState(null);
  const [kategori, setKategori] = useState("semua");
  const [sekolah, setSekolah] = useState("semua");
  const [jenis, setJenis] = useState("semua");

  const semuaSekolah = useMemo(() => {
    const set = new Set();
    items.forEach((it) => (it.sekolah_nama || []).forEach((s) => set.add(s)));
    return [...set].sort((a, b) => a.localeCompare(b, "id"));
  }, [items]);

  const semuaKategori = useMemo(() => {
    const set = new Set();
    items.forEach((it) => { if (it.kategori) set.add(it.kategori); });
    return [...set].sort();
  }, [items]);

  const terfilter = useMemo(() => items.filter((it) => {
    // Item tanpa kategori (mis. berkas contoh rapor) sengaja LOLOS saringan kategori: berkasnya
    // bukan bagian dari salah satu babak kegiatan, dan menyembunyikannya saat "Sosialisasi"
    // dipilih akan terbaca seperti berkasnya hilang.
    if (kategori !== "semua" && it.kategori && it.kategori !== kategori) return false;
    if (sekolah !== "semua" && !(it.sekolah_nama || []).includes(sekolah)) return false;
    if (jenis !== "semua" && it.jenis !== jenis) return false;
    return true;
  }), [items, kategori, sekolah, jenis]);

  const video = terfilter.filter((i) => i.jenis === "video");
  const berkas = terfilter.filter((i) => i.jenis === "file");
  const tautan = terfilter.filter((i) => i.jenis === "link");

  // Grup dihitung di sini, lalu URUTAN TAMPILNYA diratakan lagi jadi `foto`. Lightbox memakai
  // daftar yang sudah rata itu, sehingga tombol maju-mundur mengikuti urutan yang benar-benar
  // dilihat pengguna di layar. Kalau lightbox memakai urutan mentah dari basis data sementara
  // galeri tampil terkelompok, menekan "berikutnya" akan melompat ke sekolah lain.
  const grupFoto = useMemo(
    () => kelompokkanFoto(terfilter.filter((i) => i.jenis === "foto")),
    [terfilter],
  );
  const foto = useMemo(() => grupFoto.flatMap((g) => g.foto), [grupFoto]);

  // Saringan berubah saat lightbox terbuka akan membuat indeksnya menunjuk foto yang sudah tidak
  // ada di daftar. Ditutup saja, bukan digeser: foto yang sedang dilihat memang tidak lolos
  // saringan barunya, jadi tidak ada foto pengganti yang masuk akal.
  useEffect(() => { setFotoIndeks(null); }, [kategori, sekolah, jenis]);

  const adaSaringan = kategori !== "semua" || sekolah !== "semua" || jenis !== "semua";

  // Jenis yang benar-benar ada isinya SEBELUM saringan jenis diterapkan. Kalau dihitung dari
  // hasil akhir, memilih "Foto" akan membuat tombol Rekaman dan Berkas lenyap, dan pengguna
  // terkunci di satu jenis tanpa jalan kembali selain menekan Semua.
  const sebelumJenis = items.filter((it) => {
    if (kategori !== "semua" && it.kategori && it.kategori !== kategori) return false;
    if (sekolah !== "semua" && !(it.sekolah_nama || []).includes(sekolah)) return false;
    return true;
  });
  const JENIS_LABEL = { video: "Rekaman", foto: "Foto", file: "Berkas", link: "Tautan" };
  const jenisTersedia = ["video", "foto", "file", "link"]
    .filter((j) => sebelumJenis.some((it) => it.jenis === j));

  return (
    <>
      <div className={styles.filterBar}>
        <div className={styles.filterKiri}>
          {jenisTersedia.length > 1 && (
            <div className={styles.segmen} role="group" aria-label="Saring jenis dokumentasi">
              <button
                type="button"
                className={`${styles.segmenBtn} ${jenis === "semua" ? styles.segmenAktif : ""}`}
                onClick={() => setJenis("semua")}
              >
                Semua
              </button>
              {jenisTersedia.map((j) => (
                <button
                  key={j}
                  type="button"
                  className={`${styles.segmenBtn} ${jenis === j ? styles.segmenAktif : ""}`}
                  onClick={() => setJenis(j)}
                >
                  {JENIS_LABEL[j]}
                </button>
              ))}
            </div>
          )}

          <div className={styles.segmen} role="group" aria-label="Saring babak kegiatan">
            <button
              type="button"
              className={`${styles.segmenBtn} ${kategori === "semua" ? styles.segmenAktif : ""}`}
              onClick={() => setKategori("semua")}
            >
              Semua
            </button>
            {semuaKategori.map((k) => (
              <button
                key={k}
                type="button"
                className={`${styles.segmenBtn} ${kategori === k ? styles.segmenAktif : ""}`}
                onClick={() => setKategori(k)}
              >
                {k}
              </button>
            ))}
          </div>

          <label className={styles.pilihWrap}>
            <span className={styles.pilihLabel}>Sekolah</span>
            <select className={styles.pilih} value={sekolah} onChange={(e) => setSekolah(e.target.value)}>
              <option value="semua">Semua sekolah ({semuaSekolah.length})</option>
              {semuaSekolah.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <p className={styles.filterHitung}>
          {video.length} rekaman · {foto.length} foto · {berkas.length} berkas
        </p>
      </div>

      {terfilter.length === 0 ? (
        <div className={styles.kosong}>
          <p className={styles.kosongJudul}>Tidak ada dokumentasi pada saringan ini</p>
          {adaSaringan && (
            <button
              type="button"
              className={styles.kosongReset}
              onClick={() => { setKategori("semua"); setSekolah("semua"); setJenis("semua"); }}
            >
              Tampilkan semua
            </button>
          )}
        </div>
      ) : (
        <>
          <SectionVideo items={video} onBuka={setPreview} />
          <SectionFoto
            grup={grupFoto}
            jumlah={foto.length}
            onBuka={(f) => setFotoIndeks(foto.findIndex((x) => x.id === f.id))}
          />
          <SectionFile items={berkas} onBuka={setPreview} />

          {tautan.length > 0 && (
            <section className={styles.section}>
              <JudulSection
                ikon={<IkonDokumen size={22} />}
                judul="Tautan"
                ringkas="Dibuka di tab baru."
                jumlah={tautan.length}
              />
              <div className={styles.gridFile}>
                {tautan.map((item) => (
                  <a key={item.id} href={item.url} target="_blank" rel="noreferrer noopener" className={styles.kartuFile}>
                    <span className={styles.fileIkon} aria-hidden="true"><IkonDokumen size={24} /></span>
                    <span className={styles.kartuIsi}>
                      <span className={styles.kartuJudul}>{item.judul}</span>
                      <SekolahChips daftar={item.sekolah_nama} />
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <PreviewModal item={preview} onTutup={() => setPreview(null)} />
      <FotoLightbox
        daftar={foto}
        indeks={fotoIndeks}
        onPindah={setFotoIndeks}
        onTutup={() => setFotoIndeks(null)}
      />
    </>
  );
}

export default function DokumentasiPage({ session }) {
  const [state, setState] = useState({ loading: true, error: null, items: [] });
  const yayasanId = session?.yayasan_id;

  useEffect(() => {
    let alive = true;
    if (!yayasanId) { setState({ loading: false, error: null, items: [] }); return undefined; }

    async function run() {
      const res = await fetchAllRows((from, to) => supabase.from("dp_item")
        .select("id, jenis, kategori, judul, deskripsi, url, thumbnail_url, tanggal, urutan, sekolah_id, sekolah_nama")
        .eq("yayasan_id", yayasanId).eq("aktif", true)
        .order("urutan").order("tanggal", { ascending: false }).range(from, to));

      if (!alive) return;
      if (res.error) { setState({ loading: false, error: res.error.message, items: [] }); return; }
      setState({ loading: false, error: null, items: res.data || [] });
    }

    run();
    return () => { alive = false; };
  }, [yayasanId]);

  const status = statusPanel({
    loading: state.loading,
    error: state.error,
    kosong: !state.loading && !state.error && state.items.length === 0,
    judul: "Belum ada dokumentasi",
    pesan: "Foto, rekaman, dan berkas kegiatan ditambahkan lewat Admin CMS.",
  });
  if (status) return status;

  return <DokumentasiIsi items={state.items} />;
}

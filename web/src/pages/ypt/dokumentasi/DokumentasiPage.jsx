import { useEffect, useRef, useState } from "react";
import { supabase, fetchAllRows } from "../../../lib/supabase";
import { statusPanel, SectionTitle, ArrowPair } from "../components/Bits";
import { PreviewModal, youtubeId, fotoUrl } from "./MediaEmbed";
import styles from "./Dokumentasi.module.css";

/** Empat section carousel, urut sesuai Figma 86-3321. */
const SECTIONS = [
  { jenis: "video", judul: "Dokumentasi Video", badge: "Video", ikon: "🎥", tombol: "Lihat Rekaman" },
  { jenis: "foto", judul: "Dokumentasi Foto", badge: "Foto", ikon: "🖼", tombol: null },
  { jenis: "link", judul: "Link", badge: "Link", ikon: "🔗", tombol: "Buka Link" },
  { jenis: "file", judul: "File", badge: "File", ikon: "📄", tombol: "Lihat File" },
];

/** Thumbnail video: pakai yang diunggah admin, atau turunkan dari YouTube. */
function videoThumb(item) {
  if (item.thumbnail_url) return fotoUrl(item.thumbnail_url);
  const vid = youtubeId(item.url);
  // Rekaman Zoom tidak punya thumbnail publik, jadi kalau bukan YouTube dan admin belum
  // mengunggah gambar, kartunya tampil dengan kotak ikon alih-alih gambar rusak.
  return vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : null;
}

function Carousel({ section, items, onBuka }) {
  const railRef = useRef(null);
  const [posisi, setPosisi] = useState({ awal: true, akhir: false });
  // "Lihat Semua" (sesuai mockup): rail horizontal berubah jadi grid yang menampilkan seluruh
  // item section itu; tombolnya berganti "Tutup" untuk kembali ke carousel.
  const [semua, setSemua] = useState(false);

  function perbaruiPosisi() {
    const el = railRef.current;
    if (!el) return;
    setPosisi({
      awal: el.scrollLeft <= 4,
      akhir: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }

  useEffect(() => { perbaruiPosisi(); }, [items, semua]);

  function geser(arah) {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: arah * el.clientWidth, behavior: "smooth" });
  }

  // Section tanpa item disembunyikan seluruhnya, bukan ditampilkan sebagai baris kosong -- yayasan
  // yang belum pernah mengunggah video tidak perlu melihat kerangka kosongnya.
  if (items.length === 0) return null;

  const isFoto = section.jenis === "foto";

  return (
    <div className={styles.section}>
      <SectionTitle
        aksi={
          <span className={styles.aksiRow}>
            <ArrowPair
              onPrev={() => geser(-1)}
              onNext={() => geser(1)}
              prevDisabled={semua || posisi.awal}
              nextDisabled={semua || posisi.akhir}
            />
            <button type="button" className={styles.lihatSemua} onClick={() => setSemua((s) => !s)}>
              {semua ? "Tutup" : "Lihat Semua"}
            </button>
          </span>
        }
      >
        {section.judul}
      </SectionTitle>

      <div
        className={[
          styles.rail,
          isFoto ? styles.railFoto : "",
          semua ? styles.railSemua : "",
        ].join(" ")}
        ref={railRef}
        onScroll={perbaruiPosisi}
      >
        {items.map((item) => {
          const thumb = section.jenis === "video" ? videoThumb(item)
            : section.jenis === "foto" ? fotoUrl(item.url)
              : null;

          return (
            <div key={item.id} className={styles.kartu}>
              {!isFoto && (
                <span className={styles.badge}>
                  <span className={styles.badgeIkon} aria-hidden="true">{section.ikon}</span>
                  {section.badge}
                </span>
              )}

              {!isFoto && <p className={styles.judul}>{item.judul}</p>}

              {thumb ? (
                <img
                  src={thumb}
                  alt=""
                  className={`${styles.thumb} ${isFoto ? styles.thumbFoto : ""}`}
                  onClick={isFoto ? () => onBuka(item) : undefined}
                  style={isFoto ? { cursor: "zoom-in" } : undefined}
                />
              ) : section.jenis === "video" ? (
                <span className={styles.thumbKosong} aria-hidden="true">{section.ikon}</span>
              ) : null}

              {isFoto && <p className={`${styles.judul} ${styles.judulFoto}`}>{item.judul}</p>}

              {/* Link selalu dibuka di tab baru (bukan iframe): tujuannya bisa apa saja, dan
                  memaksakan iframe pada situs yang menolaknya cuma menghasilkan kotak kosong.
                  Gaya CTA: tautan merah bertanda panah, sesuai mockup. */}
              {section.jenis === "link" && (
                <a href={item.url} target="_blank" rel="noreferrer noopener" className={styles.tombol}>
                  {section.tombol} <span aria-hidden="true">↗</span>
                </a>
              )}

              {(section.jenis === "video" || section.jenis === "file") && (
                <button type="button" className={styles.tombol} onClick={() => onBuka(item)}>
                  {section.tombol} <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DokumentasiPage({ session }) {
  const [state, setState] = useState({ loading: true, error: null, items: [] });
  const [preview, setPreview] = useState(null);
  const yayasanId = session?.yayasan_id;

  useEffect(() => {
    let alive = true;
    if (!yayasanId) { setState({ loading: false, error: null, items: [] }); return; }

    async function run() {
      const res = await fetchAllRows((from, to) => supabase.from("dp_item")
        .select("id, jenis, judul, deskripsi, url, thumbnail_url, tanggal, urutan, sekolah_id")
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
    pesan: "Foto, video, tautan, dan berkas kegiatan ditambahkan lewat Admin CMS.",
  });
  if (status) return status;

  return (
    <>
      {SECTIONS.map((s) => (
        <Carousel
          key={s.jenis}
          section={s}
          items={state.items.filter((i) => i.jenis === s.jenis)}
          onBuka={setPreview}
        />
      ))}

      <PreviewModal item={preview} onTutup={() => setPreview(null)} />
    </>
  );
}

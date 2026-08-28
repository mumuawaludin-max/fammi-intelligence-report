import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import styles from "./Dokumentasi.module.css";

/**
 * Deteksi jenis tautan dan pembuatan URL preview. Semuanya DETERMINISTIK dari bentuk URL --
 * tidak ada fetch metadata halaman dari browser (kena CORS, dan mengirim alamat yang dibuka
 * yayasan ke pihak ketiga tanpa alasan).
 */

/** Ambil videoId YouTube dari bentuk watch?v=, youtu.be/, /shorts/, /embed/, atau /live/. */
export function youtubeId(url) {
  if (!url) return null;
  const pola = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
    // Seluruh rekaman Telkom berbentuk youtube.com/live/<id>; tanpa pola ini semuanya jatuh ke
    // kartu tanpa thumbnail dan modalnya kosong.
    /\/live\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of pola) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/**
 * URL yang bisa dipasang di iframe untuk berkas. Null kalau bentuknya tidak dikenali -- pemanggil
 * lalu jatuh ke tombol "buka tab baru" alih-alih menampilkan iframe kosong.
 *
 * Syarat: dokumennya sudah dibagikan publik di Google. Kalau tidak, iframe akan menampilkan
 * halaman minta login, bukan isi dokumen.
 */
export function fileEmbedUrl(url) {
  if (!url) return null;
  if (/docs\.google\.com\/presentation/.test(url)) {
    return url.replace(/\/(edit|pub|view).*$/, "/embed?start=false&loop=false");
  }
  if (/docs\.google\.com\/document/.test(url)) {
    return url.replace(/\/(edit|pub|view).*$/, "/preview");
  }
  if (/drive\.google\.com\/file/.test(url)) {
    return url.replace(/\/(view|edit).*$/, "/preview");
  }
  if (/\.pdf($|\?)/i.test(url)) return url;
  return null;
}

/** URL publik berkas foto: URL penuh diteruskan apa adanya, path pendek dicari di bucket Storage. */
export function fotoUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return supabase.storage.from("dokumentasi").getPublicUrl(path).data.publicUrl;
}

/** Versi resolusi penuh untuk lightbox; foto Drive punya parameter ukuran di URL-nya. */
export function fotoUrlBesar(path) {
  const url = fotoUrl(path);
  if (!url) return null;
  return url.replace(/([?&]sz=)w\d+/, "$1w2400");
}

/* ── Antrian pemuat gambar Drive ────────────────────────────────────────────────────────────
 * Drive membalas HTTP 500 kalau beberapa gambar diminta hampir bersamaan. Ini BUKAN dugaan:
 * diuji di browser, enam permintaan serentak gagal semua, lalu permintaan yang sama satu per satu
 * berhasil (1200x675). Galeri 20 foto tanpa pembatas akan tampil sebagai deretan gambar rusak.
 *
 * Jadi pemuatan dibatasi beberapa sekaligus dan yang gagal dicoba ulang dengan jeda menaik.
 * Antriannya di level modul, bukan per komponen, supaya batasnya berlaku untuk seluruh halaman
 * termasuk saat pengguna menggulir cepat dan puluhan kartu masuk layar sekaligus.
 */
const MAKS_SERENTAK = 3;
const JEDA_ULANG_MS = 800;
let sedangJalan = 0;
const antrian = [];

function jalankanAntrian() {
  while (sedangJalan < MAKS_SERENTAK && antrian.length > 0) {
    const tugas = antrian.shift();
    sedangJalan += 1;
    tugas().then(() => {
      sedangJalan -= 1;
      jalankanAntrian();
    });
  }
}

/**
 * Muat satu gambar lewat antrian. Menyelesaikan dengan true kalau berhasil, false kalau gagal
 * sesudah semua percobaan. Sengaja tidak melempar: pemanggilnya menampilkan kartu cadangan,
 * bukan menganggapnya galat halaman.
 */
export function muatGambarAntre(src, maksUlang = 2) {
  return new Promise((selesai) => {
    antrian.push(() => new Promise((lepasSlot) => {
      let sisa = maksUlang;

      function coba() {
        const img = new Image();
        img.onload = () => { selesai(true); lepasSlot(); };
        img.onerror = () => {
          if (sisa > 0) {
            // Jeda menaik: percobaan kedua 800ms, ketiga 1600ms. Mencoba ulang seketika cuma
            // menabrak pembatas laju yang sama.
            const tunggu = JEDA_ULANG_MS * (maksUlang - sisa + 1);
            sisa -= 1;
            setTimeout(coba, tunggu);
          } else {
            selesai(false);
            lepasSlot();
          }
        };
        img.src = src;
      }

      coba();
    }));
    jalankanAntrian();
  });
}

/**
 * Gambar Drive yang baru mulai dimuat ketika mendekati layar, lewat antrian di atas.
 *
 * Kenapa bukan `<img loading="lazy">` saja: lazy bawaan browser tetap melepas semua permintaan
 * sekaligus begitu banyak gambar masuk viewport, dan itu persis kondisi yang memicu 500 dari
 * Drive. Yang dibutuhkan adalah pembatas jumlah serentak, dan itu tidak ada di atribut lazy.
 */
export function FotoDrive({ src, alt, className, onClick, ratio }) {
  const [el, setEl] = useState(null);
  const [status, setStatus] = useState("menunggu");

  useEffect(() => {
    if (!el || !src) return undefined;

    let hidup = true;

    function mulai() {
      if (!hidup) return;
      setStatus("memuat");
      muatGambarAntre(src).then((berhasil) => {
        if (hidup) setStatus(berhasil ? "siap" : "gagal");
      });
    }

    if (typeof IntersectionObserver === "undefined") { mulai(); return () => { hidup = false; }; }

    const obs = new IntersectionObserver(([entri]) => {
      if (entri.isIntersecting) { obs.disconnect(); mulai(); }
    }, { rootMargin: "300px 0px" });

    obs.observe(el);
    return () => { hidup = false; obs.disconnect(); };
  }, [el, src]);

  return (
    <div
      ref={setEl}
      className={`${styles.fotoWrap} ${className || ""}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(e); } } : undefined}
      aria-label={onClick ? `Perbesar foto: ${alt}` : undefined}
    >
      {status === "siap" && <img src={src} alt={alt} className={styles.fotoImg} />}
      {(status === "menunggu" || status === "memuat") && <span className={styles.fotoSkeleton} aria-hidden="true" />}
      {status === "gagal" && (
        <span className={styles.fotoGagal}>
          <IkonGambar />
          <span>Foto tidak bisa dimuat</span>
        </span>
      )}
    </div>
  );
}

/* ── Ikon ───────────────────────────────────────────────────────────────────────────────────
 * Digambar sebagai SVG stroke 24px, bukan emoji: emoji bergantung pada set glyph sistem sehingga
 * bentuk dan beratnya berbeda antar mesin, dan tidak bisa mengikuti warna teks. */

export function IkonPutar({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
    </svg>
  );
}

export function IkonGambar({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="m3.5 17 4.8-4.6a1.8 1.8 0 0 1 2.5 0L16 17.5M14.5 14l1.7-1.6a1.8 1.8 0 0 1 2.5 0l1.8 1.7" />
    </svg>
  );
}

export function IkonDokumen({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

export function IkonPanah({ arah = "kanan", size = 22 }) {
  const d = arah === "kiri" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function IkonTutup({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/* ── Dialog ─────────────────────────────────────────────────────────────────────────────── */

/** Escape untuk menutup, dan kunci gulir latar selama dialog terbuka. */
function useDialog(terbuka, onTutup, onKiri, onKanan) {
  useEffect(() => {
    if (!terbuka) return undefined;

    function onKey(e) {
      if (e.key === "Escape") onTutup();
      else if (e.key === "ArrowLeft" && onKiri) onKiri();
      else if (e.key === "ArrowRight" && onKanan) onKanan();
    }

    const gulirLama = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = gulirLama;
      window.removeEventListener("keydown", onKey);
    };
  }, [terbuka, onTutup, onKiri, onKanan]);
}

/**
 * Dialog pratinjau video dan berkas. Iframe diberi referrerpolicy no-referrer supaya halaman
 * pihak ketiga tidak ikut membawa alamat dashboard yayasan.
 */
export function PreviewModal({ item, onTutup }) {
  useDialog(Boolean(item), onTutup);
  if (!item) return null;

  let isi = null;
  if (item.jenis === "video") {
    const vid = youtubeId(item.url);
    isi = vid ? (
      <iframe
        className={styles.modalFrame}
        src={`https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0`}
        title={item.judul}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="no-referrer"
      />
    ) : null;
  } else if (item.jenis === "file") {
    const src = fileEmbedUrl(item.url);
    isi = src ? (
      <iframe
        className={styles.modalFrame}
        src={src}
        title={item.judul}
        sandbox="allow-scripts allow-same-origin allow-popups"
        referrerPolicy="no-referrer"
      />
    ) : null;
  }

  return (
    <div className={styles.modalBackdrop} onClick={onTutup} role="presentation">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={item.judul}>
        <div className={styles.modalHead}>
          <span className={styles.modalJudul}>{item.judul}</span>
          {item.sekolah_nama?.length > 0 && (
            <span className={styles.modalMeta}>{item.sekolah_nama.join(" · ")}</span>
          )}
          <button type="button" className={styles.modalTutup} onClick={onTutup} aria-label="Tutup">
            <IkonTutup />
          </button>
        </div>

        {isi || (
          <div className={styles.modalKosong}>
            <p>Pratinjau tidak tersedia untuk tautan ini.</p>
            <a href={item.url} target="_blank" rel="noreferrer noopener" className={styles.modalLink}>
              Buka di tab baru
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Lightbox foto: gambar besar, maju-mundur lewat tombol atau panah papan ketik, penghitung posisi.
 * `daftar` adalah seluruh foto yang sedang tampil sesudah disaring, jadi urutan maju-mundurnya
 * sama dengan yang dilihat pengguna di galeri, bukan urutan mentah dari basis data.
 */
export function FotoLightbox({ daftar, indeks, onPindah, onTutup }) {
  const terbuka = indeks != null && indeks >= 0 && daftar.length > 0;

  const kePrev = useCallback(() => {
    onPindah((indeks - 1 + daftar.length) % daftar.length);
  }, [indeks, daftar.length, onPindah]);

  const keNext = useCallback(() => {
    onPindah((indeks + 1) % daftar.length);
  }, [indeks, daftar.length, onPindah]);

  useDialog(terbuka, onTutup, kePrev, keNext);

  if (!terbuka) return null;
  const item = daftar[indeks];
  if (!item) return null;

  return (
    <div className={styles.lbBackdrop} onClick={onTutup} role="presentation">
      <div className={styles.lbBar} onClick={(e) => e.stopPropagation()}>
        <span className={styles.lbJudul}>
          {item.sekolah_nama?.[0] || item.judul}
          <span className={styles.lbHitung}>{indeks + 1} dari {daftar.length}</span>
        </span>
        <button type="button" className={styles.lbTutup} onClick={onTutup} aria-label="Tutup">
          <IkonTutup size={22} />
        </button>
      </div>

      <div className={styles.lbPanggung} onClick={(e) => e.stopPropagation()}>
        {daftar.length > 1 && (
          <button type="button" className={`${styles.lbNav} ${styles.lbNavKiri}`} onClick={kePrev} aria-label="Foto sebelumnya">
            <IkonPanah arah="kiri" size={26} />
          </button>
        )}

        {/* key memaksa <img> baru tiap pindah foto, supaya tidak ada satu frame yang menampilkan
            foto lama dengan ukuran foto baru. */}
        <img key={item.id} src={fotoUrlBesar(item.url)} alt={item.judul} className={styles.lbFoto} />

        {daftar.length > 1 && (
          <button type="button" className={`${styles.lbNav} ${styles.lbNavKanan}`} onClick={keNext} aria-label="Foto berikutnya">
            <IkonPanah arah="kanan" size={26} />
          </button>
        )}
      </div>

      <p className={styles.lbKeterangan} onClick={(e) => e.stopPropagation()}>{item.judul}</p>
    </div>
  );
}

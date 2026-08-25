import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import styles from "./Dokumentasi.module.css";

/**
 * Deteksi jenis tautan dan pembuatan URL preview. Semuanya DETERMINISTIK dari bentuk URL --
 * tidak ada fetch metadata halaman dari browser (kena CORS, dan mengirim alamat yang dibuka
 * yayasan ke pihak ketiga tanpa alasan).
 */

/** Ambil videoId YouTube dari bentuk watch?v=, youtu.be/, /shorts/, atau /embed/. */
export function youtubeId(url) {
  if (!url) return null;
  const pola = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
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

/** URL publik berkas foto di bucket Storage "dokumentasi". */
export function fotoUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return supabase.storage.from("dokumentasi").getPublicUrl(path).data.publicUrl;
}

/**
 * Modal pratinjau. Dipakai untuk video YouTube, foto, dan berkas (Slides/PDF/Drive).
 * Semua iframe diberi sandbox dan referrerpolicy no-referrer: halaman pihak ketiga tidak boleh
 * ikut membawa alamat dashboard yayasan, dan tidak perlu akses ke halaman induknya.
 */
export function PreviewModal({ item, onTutup }) {
  if (!item) return null;

  let isi = null;
  if (item.jenis === "foto") {
    isi = <img src={fotoUrl(item.url)} alt={item.judul} className={styles.modalFoto} />;
  } else if (item.jenis === "video") {
    const vid = youtubeId(item.url);
    isi = vid ? (
      <iframe
        className={styles.modalFrame}
        src={`https://www.youtube-nocookie.com/embed/${vid}`}
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
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <span className={styles.modalJudul}>{item.judul}</span>
          <button type="button" className={styles.modalTutup} onClick={onTutup} aria-label="Tutup">×</button>
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

import { useEffect, useRef } from "react";
import { Ikon } from "../komponen";
import s from "./dialogVideo.module.css";

/**
 * Dialog di dalam aplikasi ponsel: skrining sudah diisi dan dikunci (dibuka ulang hanya oleh tim
 * Fammi), video Fammi tentang inti skrining, dan ajakan membaca hasil serta mempraktikkan saran.
 * Video diputar lewat youtube-nocookie. Escape dan ketuk lapisan menutup dialog. Dipasang di dalam
 * wadah aplikasi yang `position: relative`.
 *
 * Juga dipakai untuk ajakan Screening HEART di aplikasi orang tua: tanpa `idVideo` videonya tidak
 * tampil, `ikon` mengganti gembok, dan `kedua` = { label, onClick } memberi tombol kedua.
 */
export default function DialogVideo({ judul, isi, idVideo, labelVideo, aksi, onAksi, onTutup, ikon = "gembok", kedua }) {
  const ref = useRef(null);
  useEffect(() => {
    const sebelum = document.activeElement;
    ref.current?.focus({ preventScroll: true });
    return () => {
      if (sebelum instanceof HTMLElement && sebelum.isConnected) sebelum.focus({ preventScroll: true });
    };
  }, []);

  return (
    <>
      <button type="button" className={s.lapis} aria-label="Tutup" tabIndex={-1} onClick={onTutup} />
      <div
        ref={ref}
        className={s.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dv-judul"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape") onTutup();
        }}
      >
        <div className={s.kepala}>
          <span className={s.kunci} aria-hidden="true">
            <Ikon nama={ikon} size={20} />
          </span>
          <h2 id="dv-judul" className={s.judul}>
            {judul}
          </h2>
          <button type="button" className={s.tutup} aria-label="Tutup" onClick={onTutup}>
            <Ikon nama="tutup" size={18} />
          </button>
        </div>
        <p className={s.isi}>{isi}</p>
        {idVideo ? (
          <>
            <div className={s.video}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${idVideo}?rel=0`}
                title={labelVideo}
                loading="lazy"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className={s.label}>{labelVideo}</p>
          </>
        ) : null}
        <button type="button" className={s.aksi} onClick={onAksi}>
          {aksi}
          <Ikon nama="kanan" size={18} />
        </button>
        {kedua ? (
          <button type="button" className={s.kedua} onClick={kedua.onClick}>
            {kedua.label}
          </button>
        ) : null}
      </div>
    </>
  );
}

import { useEffect, useRef } from "react";
import { IKON } from "./ikonData";
import dasar from "./proteksi.module.css";

/**
 * Komponen kecil bersama prototipe Sekolah Proteksi. Nama kelas mengikuti desain (lihat
 * proteksi.module.css), jadi JSX di layar bisa memakai nama kelas desain apa adanya.
 */

/** Ikon SVG 24x24. `nama` dari ikonData.js, atau `d` untuk jalur khusus satu layar. */
export function Ikon({ nama, d, size = 18, warna, className, style, label }) {
  const jalur = d || IKON[nama];
  if (!jalur) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={warna || "currentColor"}
      className={className}
      style={style}
      focusable="false"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      <path d={jalur} />
    </svg>
  );
}

/**
 * Kepala kartu: ubin ikon + judul satu baris. Judul berbentuk array (peninggalan desain awal yang
 * memecah judul jadi dua baris) digabung dengan spasi supaya tampilan tetap ringkas.
 */
export function KepalaKartu({ ikon, d, nada = "p", judul, as: Tag = "h2" }) {
  const teks = Array.isArray(judul) ? judul.join(" ") : judul;
  return (
    <div className="chead">
      <div className={`tile ${nada}`}>
        <Ikon nama={ikon} d={d} size={19} />
      </div>
      <Tag className="ctitle">{teks}</Tag>
    </div>
  );
}

/** Tombol segmen (filter, tab kecil). pilihan: [{ id, label }]. */
export function Segmen({ label, pilihan, nilai, onPilih, className = "", style }) {
  return (
    <div className={`seg ${className}`} role="group" aria-label={label} style={style}>
      {pilihan.map((p) => {
        const aktif = p.id === nilai;
        return (
          <button
            key={p.id}
            type="button"
            className={`segb${aktif ? " active" : ""}`}
            aria-pressed={aktif}
            onClick={() => onPilih(p.id)}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

const BISA_FOKUS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Laci kanan (dialog). Dipasang hanya selama terbuka: fokus masuk ke laci, Tab berputar di
 * dalamnya, Escape dan klik lapisan gelap menutup, lalu fokus kembali ke tombol pembukanya.
 * Lebar bawaan 612px (desain), `lebar` untuk laci yang berbeda.
 */
export function Laci({ label, onTutup, lebar, className = "", labelTutup = "Tutup", children }) {
  const ref = useRef(null);
  const tutupRef = useRef(onTutup);
  useEffect(() => {
    tutupRef.current = onTutup;
  }, [onTutup]);

  useEffect(() => {
    const sebelum = document.activeElement;
    const akar = ref.current?.closest("[data-sp-akar]");
    ref.current?.focus({ preventScroll: true });
    return () => {
      if (sebelum instanceof HTMLElement && sebelum.isConnected) {
        sebelum.focus({ preventScroll: true });
        return;
      }
      // Tombol pembukanya sudah hilang (mis. sesudah formulir dikirim, atau layar berganti): fokus
      // ke judul layar supaya tidak jatuh ke body.
      const judul = akar?.querySelector("[data-judul-layar]") || akar?.querySelector("h1");
      if (judul) {
        if (!judul.hasAttribute("tabindex")) judul.setAttribute("tabindex", "-1");
        judul.focus({ preventScroll: true });
      }
    };
  }, []);

  function saatTombol(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      tutupRef.current();
      return;
    }
    if (e.key !== "Tab" || !ref.current) return;
    const daftar = [...ref.current.querySelectorAll(BISA_FOKUS)].filter((el) => el.offsetParent !== null);
    if (daftar.length === 0) return;
    const pertama = daftar[0];
    const terakhir = daftar[daftar.length - 1];
    if (e.shiftKey && (document.activeElement === pertama || document.activeElement === ref.current)) {
      e.preventDefault();
      terakhir.focus();
    } else if (!e.shiftKey && document.activeElement === terakhir) {
      e.preventDefault();
      pertama.focus();
    }
  }

  return (
    <>
      <button type="button" className={`overlay ${dasar.lapisMasuk}`} aria-label={labelTutup} tabIndex={-1} onClick={onTutup} />
      <aside
        ref={ref}
        className={`drawer ${dasar.laciMasuk} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        style={lebar ? { width: lebar } : undefined}
        onKeyDown={saatTombol}
      >
        {children}
      </aside>
    </>
  );
}

/** Kepala laci: `awal` (ubin ikon atau avatar), judul, keterangan, tombol tutup. */
export function KepalaLaci({ awal, judul, sub, onTutup, children }) {
  return (
    <div className="dhead">
      {awal}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 className="dtitle">{judul}</h2>
        {sub ? <p className="dsub">{sub}</p> : null}
        {children}
      </div>
      <button type="button" className="xbtn" aria-label="Tutup" onClick={onTutup}>
        <Ikon nama="tutup" size={18} />
      </button>
    </div>
  );
}

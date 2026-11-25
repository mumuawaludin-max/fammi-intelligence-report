/**
 * Wajah perasaan datar: lingkaran berwarna, dua mata, dan mulut (warna mata/mulut ikut currentColor).
 * Dipakai mode cerita anak (aplikasi orang tua) dan mood harian (aplikasi remaja). Sengaja datar,
 * bukan emoji atau ikon 3D.
 */
export default function Wajah({ isi, mulut, ukuran, className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={ukuran} height={ukuran} aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill={isi} />
      <circle cx="9" cy="10" r="1.3" fill="currentColor" />
      <circle cx="15" cy="10" r="1.3" fill="currentColor" />
      <path d={mulut} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

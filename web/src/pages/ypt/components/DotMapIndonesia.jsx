import { KOTA_COORDS, PETA_RASIO, PETA_BINS, warnaPeta } from "../yptMeta";
import styles from "./DotMapIndonesia.module.css";

/**
 * Peta sebaran sekolah per kota, dengan pewarnaan pencapaian per wilayah + legenda
 * (permintaan pemilik produk 2026-08-26: marker kota diwarnai sesuai rata-rata pencapaian
 * karakter wilayah itu, mis. >= 90% hijau, supaya perkembangan tiap wilayah terbaca sekilas).
 *
 * Peta dasarnya (/peta-indonesia-dots.svg) DIBANGKITKAN dari poligon pulau lewat script
 * scratchpad gen-peta.mjs (grid titik 0.55 derajat, bingkai lon 94..142 lat 7.5..-11.5) --
 * bukan aset Figma, karena kuota Figma MCP habis saat implementasi. Marker kota diletakkan
 * pakai persen dari KOTA_COORDS yang diproyeksikan dari lon/lat lewat bingkai yang SAMA, dan
 * kanvas memakai aspect-ratio PETA_RASIO yang sama pula -- tiga hal ini harus selalu satu
 * paket; mengganti salah satu tanpa dua lainnya membuat marker meleset dari pulau.
 *
 * Kota yang belum punya koordinat TIDAK dibuang -- ditampilkan sebagai daftar teks di bawah
 * peta. Menyembunyikannya membuat sekolah di kota itu seolah tidak ada, padahal datanya lengkap.
 */
export default function DotMapIndonesia({ kota, aktif, onPilih }) {
  const terpetakan = kota.filter((k) => KOTA_COORDS[k.nama]);
  const belumTerpetakan = kota.filter((k) => !KOTA_COORDS[k.nama]);
  const kotaAktif = kota.find((k) => k.nama === aktif) || null;

  return (
    <div className={styles.wrap}>
      <div className={styles.canvas} style={{ aspectRatio: PETA_RASIO }}>
        <img
          src="/peta-indonesia-dots.svg"
          alt=""
          className={styles.basemap}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />

        {terpetakan.map((k) => {
          const pos = KOTA_COORDS[k.nama];
          const isAktif = aktif === k.nama;
          const warna = warnaPeta(k.nilai);
          return (
            <button
              key={k.nama}
              type="button"
              className={`${styles.marker} ${isAktif ? styles.markerActive : ""}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, background: warna, "--marker-warna": warna }}
              onClick={() => onPilih(k.nama)}
              title={`${k.nama} — ${k.nilai == null ? "belum ada data" : `${k.nilai}%`} · ${k.jumlahSekolah} sekolah`}
              aria-label={`${k.nama}, ${k.jumlahSekolah} sekolah, pencapaian ${k.nilai == null ? "belum ada" : `${k.nilai} persen`}`}
            />
          );
        })}

        {kotaAktif && KOTA_COORDS[aktif] && (
          <span
            className={styles.tooltip}
            style={{ left: `${KOTA_COORDS[aktif].x}%`, top: `${KOTA_COORDS[aktif].y}%` }}
          >
            <span className={styles.tooltipNama}>{aktif}</span>
            <span className={styles.tooltipSub}>
              {kotaAktif.nilai == null ? "belum ada data" : `${kotaAktif.nilai}%`} · {kotaAktif.jumlahSekolah} sekolah
            </span>
          </span>
        )}
      </div>

      {/* Legenda: pembacaan cepat pencapaian per wilayah dari warna marker. */}
      <div className={styles.legend} aria-hidden="true">
        <span className={styles.legendJudul}>Pencapaian wilayah:</span>
        {PETA_BINS.map((b) => (
          <span key={b.label} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: b.warna }} />
            {b.label}
          </span>
        ))}
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#b6bccb" }} />
          Belum ada data
        </span>
      </div>

      {belumTerpetakan.length > 0 && (
        <p className={styles.belum}>
          Belum ada titik peta untuk:{" "}
          {belumTerpetakan.map((k, i) => (
            <button
              key={k.nama}
              type="button"
              className={styles.belumBtn}
              onClick={() => onPilih(k.nama)}
            >
              {k.nama}{i < belumTerpetakan.length - 1 ? "," : ""}
            </button>
          ))}
        </p>
      )}
    </div>
  );
}

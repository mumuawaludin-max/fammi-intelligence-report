import { motion } from "motion/react";
import { ArrowRight, CircleNotch, LockSimple } from "@phosphor-icons/react";
import { DEMO_SYSTEMS, statusSistem, statusTampilan } from "../demo/demoSystems";
import IkonSistem from "../demo/IkonSistem";
import styles from "./MozaikSistem.module.css";

/**
 * Lima Intelligence System sebagai ubin berwarna, susunan slide "5 Intelligence System" di deck
 * Fammi (Education & Character tinggi di tengah).
 *
 *   mode "info"  -> halaman masuk: ubin informasi saja, tanpa tombol.
 *   mode "pilih" -> layar demo (sesudah kode demo diterima server): tiap ubin membawa tombol
 *                   tampilan demonya.
 *
 * Tinggi ubin mengikuti ruang yang tersisa di layar (wadahnya yang menentukan), dan isi yang kurang
 * penting disembunyikan lewat container query saat ubin pendek, supaya halaman tidak bergulir.
 */

const EASE = [0.22, 1, 0.36, 1];
const VARIAN_UBIN = {
  awal: { opacity: 0, y: 18, scale: 0.97 },
  tampil: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE } },
};

export default function MozaikSistem({
  mode = "info", sesi = null, membuka = null, onBukaTampilan, daftarkanTombol, jeda = 0.1, className = "",
}) {
  const pilih = mode === "pilih";
  return (
    <motion.ul
      className={`${styles.mozaik} ${pilih ? styles.modePilih : ""} ${className}`}
      aria-label="Lima Intelligence System Fammi"
      initial="awal"
      animate="tampil"
      variants={{ awal: {}, tampil: { transition: { staggerChildren: 0.07, delayChildren: jeda } } }}
    >
      {DEMO_SYSTEMS.map((s) => (
        <Ubin
          key={s.id}
          sistem={s}
          pilih={pilih}
          sesi={sesi}
          membuka={membuka}
          onBukaTampilan={onBukaTampilan}
          daftarkanTombol={daftarkanTombol}
        />
      ))}
    </motion.ul>
  );
}

function Ubin({ sistem, pilih, sesi, membuka, onBukaTampilan, daftarkanTombol }) {
  const status = pilih ? statusSistem(sistem, sesi) : null;
  const tinggi = sistem.ikon === "edukasi";
  return (
    <motion.li
      className={[
        styles.ubin,
        styles[`warna_${sistem.warna}`],
        styles[`area_${sistem.ikon}`],
        status === "terbatas" ? styles.ubinTerbatas : "",
      ].join(" ")}
      variants={VARIAN_UBIN}
    >
      <div className={styles.ubinAtas}>
        <span className={styles.ubinNomor}>Module {sistem.nomor}</span>
        <span className={styles.ubinIkon}>
          <IkonSistem nama={sistem.ikon} size={tinggi ? 34 : 28} />
        </span>
      </div>
      <div className={styles.ubinIsi}>
        <h2 className={styles.ubinJudul}>{sistem.judul}</h2>
        <p className={styles.ubinDesk}>{tinggi ? sistem.deskripsi : sistem.ringkas}</p>
        {pilih && (
          <PilihanTampilan
            sistem={sistem}
            status={status}
            sesi={sesi}
            membuka={membuka}
            onBukaTampilan={onBukaTampilan}
            daftarkanTombol={daftarkanTombol}
          />
        )}
      </div>
    </motion.li>
  );
}

function PilihanTampilan({ sistem, status, sesi, membuka, onBukaTampilan, daftarkanTombol }) {
  if (status === "terbatas") {
    return (
      <p className={styles.pilihanCatatan}>
        <LockSimple size={13} weight="bold" aria-hidden="true" />
        Tidak termasuk kode demo ini
      </p>
    );
  }
  const banyak = sistem.tampilan.length > 1;
  return (
    <div className={styles.pilihan}>
      {banyak && <span className={styles.pilihanGrup}>{sistem.tampilan[0].grup}</span>}
      <div className={styles.pilihanDaftar}>
        {sistem.tampilan.map((t) => {
          const st = statusTampilan({ ...t, sistem: sistem.id }, sesi);
          if (st !== "tersedia") {
            return <span key={t.id} className={styles.pilihanSegera}>{t.label} · Segera hadir</span>;
          }
          const sedang = membuka === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => daftarkanTombol?.(t.id, el)}
              type="button"
              className={styles.pilihanTombol}
              onClick={() => onBukaTampilan(t.id)}
              disabled={Boolean(membuka)}
              aria-busy={sedang || undefined}
              aria-label={`${sistem.judul}: ${banyak ? `${t.grup} ${t.label}` : t.label}`}
            >
              {sedang ? <CircleNotch className={styles.putar} size={14} weight="bold" aria-hidden="true" /> : null}
              <span>{sedang ? "Membuka" : t.label}</span>
              {!sedang && <ArrowRight size={13} weight="bold" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

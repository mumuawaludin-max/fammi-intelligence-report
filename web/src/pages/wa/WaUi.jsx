// Komponen dasar modul Wellbeing Assessment. Semua bergerak: kartu muncul bertahap, bar dan donat
// tumbuh, angka menghitung naik, tombol mengecil sedikit saat ditekan, dialog dan lembar bawah
// meluncur masuk. Animasi memakai `motion` (instruksi pemilik produk 2026-10-19: "seluruh UI dan
// perpindahan section ada animasinya, setiap tombol beranimasi saat ditekan"). Pengguna dengan
// prefers-reduced-motion mendapat versi diam lewat MotionConfig reducedMotion="user" di cangkang.
//
// Tooltip (Petunjuk) dipinjam dari modul sw supaya perilakunya sama di seluruh ruang wellbeing.

import { Children, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight, Info, MagnifyingGlass, Minus, Plus, Star, X } from "@phosphor-icons/react";
import { Petunjuk } from "../sw/SwUi";
import { formatAngka } from "./lib/waAturan";
import { EASE, VARIAN_MUNCUL } from "./waGerak";
import swTokens from "../sw/swTokens.module.css";
import tokens from "./waTokens.module.css";
import styles from "./WaUi.module.css";

// Dialog dan lembar dirender lewat portal ke body, di luar .scope cangkang; kelas token dipasang
// ulang di elemen dialog supaya --fm-* dan --wa-* tetap terbaca.
const SCOPE = `${swTokens.scope} ${tokens.scope}`;

export { Petunjuk };

// ── Gerak dasar ─────────────────────────────────────────────────────────────────────────────

/** Wadah yang memunculkan anak-anaknya satu per satu. */
export function Bertahap({ children, className = "", jeda = 0.06, tunda = 0, as = "div", ...rest }) {
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      className={className}
      initial="awal"
      animate="tampil"
      variants={{ awal: {}, tampil: { transition: { staggerChildren: jeda, delayChildren: tunda } } }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Satu elemen yang muncul sendiri, atau sebagai anak Bertahap. */
export function Muncul({ children, className = "", as = "div", ...rest }) {
  const Tag = motion[as] || motion.div;
  return <Tag className={className} variants={VARIAN_MUNCUL} {...rest}>{children}</Tag>;
}

/** Angka yang menghitung naik dari nol saat pertama terlihat. */
export function AngkaHitung({ nilai, digit = 0, akhiran = "", durasi = 1.1, className = "" }) {
  const ref = useRef(null);
  const terlihat = useInView(ref, { once: true, margin: "-20px" });
  const diam = useReducedMotion();
  const [tampil, setTampil] = useState(0);
  useEffect(() => {
    if (typeof nilai !== "number" || diam || !terlihat) return undefined;
    const kendali = animate(0, nilai, { duration: durasi, ease: EASE, onUpdate: setTampil });
    return () => kendali.stop();
  }, [nilai, terlihat, diam, durasi]);
  return (
    <span ref={ref} className={className}>
      {typeof nilai === "number" ? formatAngka(diam ? nilai : tampil, digit) : "-"}{akhiran}
    </span>
  );
}

// ── Tombol ──────────────────────────────────────────────────────────────────────────────────

const TEKAN = { scale: 0.95 };
const SOROT = { y: -1 };

/** Tombol bergerak: sedikit terangkat saat disorot, mengecil saat ditekan. */
export function Tombol({ children, varian = "utama", ukuran = "sedang", ikon: Ikon, ikonKanan: IkonKanan, className = "", ...rest }) {
  return (
    <motion.button
      type="button"
      whileTap={TEKAN}
      whileHover={rest.disabled ? undefined : SOROT}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      className={`${styles.tombol} ${styles[`tombol_${varian}`] || ""} ${styles[`tombol_${ukuran}`] || ""} ${className}`}
      {...rest}
    >
      {Ikon && <Ikon size={ukuran === "kecil" ? 15 : 18} weight="bold" aria-hidden="true" />}
      {children}
      {IkonKanan && <IkonKanan size={ukuran === "kecil" ? 15 : 18} weight="bold" aria-hidden="true" className={styles.ikonKanan} />}
    </motion.button>
  );
}

/** Tautan bergaya teks bergaris bawah dengan panah yang bergeser saat disorot. */
export function TombolTeks({ children, warna = "var(--fm-ungu)", onClick, ...rest }) {
  return (
    <motion.button type="button" className={styles.tombolTeks} style={{ "--w": warna }} whileTap={TEKAN} whileHover="sorot" onClick={onClick} {...rest}>
      <span>{children}</span>
      <motion.span variants={{ sorot: { x: 4 } }} transition={{ type: "spring", stiffness: 400, damping: 20 }} className={styles.tombolTeksPanah}>
        <ArrowRight size={16} weight="bold" aria-hidden="true" />
      </motion.span>
    </motion.button>
  );
}

export function TombolIkon({ children, label, className = "", ...rest }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.88 }} whileHover={{ rotate: 90 }} className={`${styles.tombolIkon} ${className}`} aria-label={label} title={label} {...rest}>
      {children}
    </motion.button>
  );
}

/**
 * Kendali bersegmen dengan pil yang meluncur ke pilihan aktif. `id` wajib unik per halaman
 * karena dipakai sebagai layoutId pil.
 */
export function Segmen({ id, opsi, nilai, onUbah, kecil = false, label }) {
  return (
    <div className={`${styles.segmen} ${kecil ? styles.segmenKecil : ""}`} role="radiogroup" aria-label={label}>
      {opsi.map((o) => {
        const aktif = o.nilai === nilai;
        const Ikon = o.ikon;
        return (
          <motion.button
            key={o.nilai}
            type="button"
            role="radio"
            aria-checked={aktif}
            className={`${styles.segmenTombol} ${aktif ? styles.segmenAktif : ""}`}
            onClick={() => onUbah(o.nilai)}
            whileTap={TEKAN}
          >
            {aktif && <motion.span layoutId={`segmen-${id}`} className={styles.segmenPil} transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className={styles.segmenIsi}>
              {Ikon && <Ikon size={15} weight={aktif ? "fill" : "regular"} aria-hidden="true" />}
              {o.label}
              {typeof o.jumlah === "number" && <span className={styles.segmenJumlah}>{o.jumlah}</span>}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/** Kolom cari dengan ikon kaca pembesar. */
export function KolomCari({ nilai, onUbah, placeholder = "Cari" }) {
  return (
    <label className={styles.cari}>
      <MagnifyingGlass size={16} weight="bold" aria-hidden="true" />
      <input type="search" value={nilai} onChange={(e) => onUbah(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </label>
  );
}

// ── Kartu ───────────────────────────────────────────────────────────────────────────────────

/**
 * Kartu putih tanpa garis tepi. `naik` membuat kartu terangkat saat disorot; `onClick` membuat
 * seluruh kartu jadi tombol (dengan animasi tekan).
 */
export function Kartu({ children, className = "", naik = false, onClick, label, as = "section", ...rest }) {
  const klik = typeof onClick === "function";
  const Tag = klik ? motion.button : (motion[as] || motion.section);
  return (
    <Tag
      type={klik ? "button" : undefined}
      className={`${styles.kartu} ${klik ? styles.kartuKlik : ""} ${className}`}
      variants={VARIAN_MUNCUL}
      whileHover={naik || klik ? { y: -4, boxShadow: "0 4px 8px rgb(52 32 96 / 0.06), 0 18px 40px rgb(52 32 96 / 0.12)" } : undefined}
      whileTap={klik ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      onClick={onClick}
      aria-label={label}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function JudulBagian({ children, keterangan, aksi }) {
  return (
    <Muncul className={styles.judulBagian}>
      <div>
        <h2>{children}</h2>
        {keterangan && <p>{keterangan}</p>}
      </div>
      {aksi && <div className={styles.judulBagianAksi}>{aksi}</div>}
    </Muncul>
  );
}

/** Kartu plus/minus berikon kotak gelap, seperti desain. */
export function KartuPlusMinus({ jenis = "plus", children, kosong = "Narasi belum tersedia untuk cakupan ini." }) {
  const Ikon = jenis === "plus" ? Plus : Minus;
  return (
    <Kartu className={styles.plusMinus}>
      <span className={`${styles.plusMinusIkon} ${jenis === "plus" ? styles.plusIkon : styles.minusIkon}`} aria-hidden="true">
        <Ikon size={14} weight="bold" />
      </span>
      <p className={children ? "" : styles.redup}>{children || kosong}</p>
    </Kartu>
  );
}

/** Chip kategori berwarna. */
export function Chip({ warna, teks = "#ffffff", children, besar = false, garis = false, petunjuk }) {
  const isi = (
    <motion.span
      className={`${styles.chip} ${besar ? styles.chipBesar : ""} ${garis ? styles.chipGaris : ""}`}
      style={garis ? { "--w": warna } : { background: warna, color: teks }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 24, delay: 0.2 }}
    >
      {children}
    </motion.span>
  );
  return petunjuk ? <Petunjuk teks={petunjuk}>{isi}</Petunjuk> : isi;
}

export function KeadaanKosong({ ikon: Ikon = Info, judul, pesan, kecil = false }) {
  return (
    <motion.div
      className={`${styles.kosong} ${kecil ? styles.kosongKecil : ""}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
      role="status"
    >
      <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className={styles.kosongIkon}>
        <Ikon size={kecil ? 22 : 30} weight="duotone" aria-hidden="true" />
      </motion.span>
      <p className={styles.kosongJudul}>{judul}</p>
      {pesan && <p className={styles.kosongPesan}>{pesan}</p>}
    </motion.div>
  );
}

// ── Grafik ──────────────────────────────────────────────────────────────────────────────────

/** Bar tunggal 0-100, tumbuh dari kiri saat terlihat. */
export function Bar({ pct, warna = "var(--fm-ungu)", tebal, tunda = 0, label }) {
  const ref = useRef(null);
  const terlihat = useInView(ref, { once: true, margin: "-10px" });
  const lebar = Math.max(0, Math.min(100, pct ?? 0));
  return (
    <span ref={ref} className={styles.bar} style={tebal ? { height: tebal } : undefined} role={label ? "img" : undefined} aria-label={label}>
      <motion.span
        className={styles.barIsi}
        style={{ background: warna }}
        initial={{ width: 0 }}
        animate={{ width: terlihat ? `${lebar}%` : 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: tunda }}
      />
    </span>
  );
}

/**
 * Bar bertumpuk. `segmen` = [{kunci, label, warna, jumlah, arti?}]. Segmen tumbuh berurutan;
 * setiap segmen punya tooltip jumlah dan porsi.
 */
export function BarTumpuk({ segmen, total, tebal = 14, satuan = "pegawai", label }) {
  const ref = useRef(null);
  const terlihat = useInView(ref, { once: true, margin: "-10px" });
  const jumlah = total ?? segmen.reduce((a, s) => a + s.jumlah, 0);
  const tampil = segmen.filter((s) => s.jumlah > 0);
  return (
    <div
      ref={ref}
      className={styles.barTumpuk}
      style={{ height: tebal }}
      role="img"
      aria-label={`${label ? `${label}: ` : ""}${segmen.map((s) => `${s.label} ${s.jumlah} ${satuan}`).join(", ")}`}
    >
      {tampil.map((s, i) => {
        const porsi = jumlah ? (s.jumlah / jumlah) * 100 : 0;
        return (
          <motion.span
            key={s.kunci}
            className={styles.barTumpukSegmen}
            style={{ background: s.warna }}
            initial={{ width: 0 }}
            animate={{ width: terlihat ? `${porsi}%` : 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 + i * 0.12 }}
          >
            <Petunjuk teks={`${s.label}: ${s.jumlah} ${satuan} (${formatAngka(porsi, 0)}%)${s.arti ? `. ${s.arti}` : ""}`} blok className={styles.barTumpukSentuh}>
              <span />
            </Petunjuk>
          </motion.span>
        );
      })}
    </div>
  );
}

/** Legenda sebaris: titik, label, persen, jumlah. */
export function Legenda({ segmen, total, satuan = "Pegawai", kecil = false }) {
  const jumlah = total ?? segmen.reduce((a, s) => a + s.jumlah, 0);
  return (
    <ul className={`${styles.legenda} ${kecil ? styles.legendaKecil : ""}`}>
      {segmen.map((s) => (
        <li key={s.kunci} style={{ "--w": s.warnaTeks || s.warna }}>
          <Petunjuk teks={s.arti || `${s.label}: ${s.jumlah} ${satuan.toLowerCase()}`}>
            <span className={styles.legendaTitik} aria-hidden="true" />
            <b>{s.label}</b>
            <span>{jumlah ? formatAngka((s.jumlah / jumlah) * 100, 0) : 0}%</span>
            <span className={styles.legendaJumlah}>{s.jumlah} {satuan}</span>
          </Petunjuk>
        </li>
      ))}
    </ul>
  );
}

/** Donat 0-maks; busur terisi dengan pathLength sehingga tumbuh halus. */
export function Donat({ nilai, maks = 100, ukuran = 64, tebal = 9, warna = "var(--fm-ungu)", jalur = "var(--fm-jalur-lintasan)", children, label, tunda = 0 }) {
  const ref = useRef(null);
  const terlihat = useInView(ref, { once: true, margin: "-10px" });
  const r = (ukuran - tebal) / 2;
  const p = Math.max(0, Math.min(1, (nilai ?? 0) / maks));
  return (
    <span ref={ref} className={styles.donat} style={{ width: ukuran, height: ukuran }}>
      <svg width={ukuran} height={ukuran} viewBox={`0 0 ${ukuran} ${ukuran}`} role="img" aria-label={label}>
        <circle cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none" stroke={jalur} strokeWidth={tebal} />
        <motion.circle
          cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none" stroke={warna} strokeWidth={tebal} strokeLinecap="round"
          transform={`rotate(-90 ${ukuran / 2} ${ukuran / 2})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: terlihat ? p : 0 }}
          transition={{ duration: 1.1, ease: EASE, delay: tunda }}
        />
      </svg>
      {children && <span className={styles.donatTengah}>{children}</span>}
    </span>
  );
}

/** Lima bintang; isian tiap bintang mengikuti nilai 0-5 (lebar isian = bagian nilai). */
export function Bintang({ nilai, ukuran = 26, label }) {
  const ref = useRef(null);
  const terlihat = useInView(ref, { once: true });
  return (
    <span ref={ref} className={styles.bintang} role="img" aria-label={label || `${formatAngka(nilai, 1)} dari 5 bintang`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const isi = Math.max(0, Math.min(1, (nilai ?? 0) - i));
        return (
          <motion.span
            key={i}
            className={styles.bintangSatu}
            style={{ width: ukuran, height: ukuran }}
            initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
            animate={terlihat ? { scale: 1, opacity: 1, rotate: 0 } : {}}
            transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.15 + i * 0.08 }}
          >
            <Star size={ukuran} weight="fill" className={styles.bintangJalur} aria-hidden="true" />
            <span className={styles.bintangIsi} style={{ width: `${isi * 100}%` }}>
              <Star size={ukuran} weight="fill" aria-hidden="true" />
            </span>
          </motion.span>
        );
      })}
    </span>
  );
}

/** Kotak huruf gelap (P R O T E K) atau ikon. */
export function Lencana({ children, warna = "var(--fm-ungu-tua)", ukuran = 40 }) {
  return (
    <motion.span
      className={styles.lencana}
      style={{ background: warna, width: ukuran, height: ukuran, fontSize: ukuran * 0.5 }}
      whileHover={{ rotate: -6, scale: 1.06 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      {children}
    </motion.span>
  );
}

// ── Dialog dan lembar bawah ─────────────────────────────────────────────────────────────────

/**
 * Dialog modal di tengah layar (native <dialog>, jadi isi di belakangnya tidak bisa disentuh).
 * Tampil dan hilang dengan animasi. `terkunci` menghilangkan tombol tutup, Escape, dan klik latar,
 * dipakai sambutan laporan individu yang wajib dibaca dulu.
 */
export function Dialog({ buka, onTutup, judul, keterangan, children, aksi, lebar = "sedang", terkunci = false, kelas = "" }) {
  return (
    <AnimatePresence>
      {buka && (
        <DialogIsi key="dialog" onTutup={onTutup} judul={judul} keterangan={keterangan} aksi={aksi} lebar={lebar} terkunci={terkunci} kelas={kelas}>
          {children}
        </DialogIsi>
      )}
    </AnimatePresence>
  );
}

/**
 * Buka <dialog> sebagai modal dan jaga keadaannya tetap sejalan dengan React. Chrome mengabaikan
 * preventDefault pada Escape jika belum ada interaksi pengguna, jadi dialog bisa tertutup sendiri:
 * dialog terkunci dibuka ulang, dialog biasa memberi tahu induknya lewat onTutup.
 */
function useModal(ref, terkunci, onTutup) {
  const tutupRef = useRef(onTutup);
  const kunciRef = useRef(terkunci);
  useEffect(() => {
    tutupRef.current = onTutup;
    kunciRef.current = terkunci;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!el.open) el.showModal();
    // Event close dikirim tidak sinkron. Saat StrictMode memasang ulang efek (tutup lalu buka lagi),
    // event dari penutupan pertama baru tiba ketika dialog sudah terbuka kembali; abaikan.
    const saatTutup = () => {
      if (el.open) return;
      if (kunciRef.current) {
        if (el.isConnected && !el.open) el.showModal();
      } else {
        tutupRef.current?.();
      }
    };
    el.addEventListener("close", saatTutup);
    return () => {
      el.removeEventListener("close", saatTutup);
      if (el.open) el.close();
    };
  }, [ref]);
}

function DialogIsi({ onTutup, judul, keterangan, children, aksi, lebar, terkunci, kelas }) {
  const ref = useRef(null);
  const idJudul = useId();
  useModal(ref, terkunci, onTutup);
  return createPortal(
    <dialog
      ref={ref}
      className={`${SCOPE} ${styles.dialog}`}
      onCancel={(e) => { e.preventDefault(); if (!terkunci) onTutup?.(); }}
      onClick={(e) => { if (!terkunci && e.target === e.currentTarget) onTutup?.(); }}
      aria-labelledby={judul ? idJudul : undefined}
    >
      <motion.div className={styles.dialogLatar} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} aria-hidden="true" />
      <motion.div
        className={`${styles.dialogBingkai} ${styles[`dialog_${lebar}`] || ""} ${kelas}`}
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
      >
        {(judul || !terkunci) && (
          <div className={styles.dialogKepala}>
            <div>
              {judul && <h2 id={idJudul}>{judul}</h2>}
              {keterangan && <p>{keterangan}</p>}
            </div>
            {!terkunci && (
              <TombolIkon label="Tutup" onClick={onTutup}>
                <X size={18} weight="bold" />
              </TombolIkon>
            )}
          </div>
        )}
        <div className={styles.dialogIsi}>{children}</div>
        {aksi && <div className={styles.dialogAksi}>{aksi}</div>}
      </motion.div>
    </dialog>,
    document.body,
  );
}

/** Lembar bawah untuk ponsel: meluncur dari bawah, bisa ditarik turun untuk menutup. */
export function LembarBawah({ buka, onTutup, judul, kepala, children }) {
  return (
    <AnimatePresence>
      {buka && <LembarIsi key="lembar" onTutup={onTutup} judul={judul} kepala={kepala}>{children}</LembarIsi>}
    </AnimatePresence>
  );
}

function LembarIsi({ onTutup, judul, kepala, children }) {
  const ref = useRef(null);
  useModal(ref, false, onTutup);
  return createPortal(
    <dialog
      ref={ref}
      className={`${SCOPE} ${styles.dialog} ${styles.lembar}`}
      onCancel={(e) => { e.preventDefault(); onTutup(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onTutup(); }}
      aria-label={judul}
    >
      <motion.div className={styles.dialogLatar} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-hidden="true" onClick={onTutup} />
      <motion.div
        className={styles.lembarBingkai}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => { if (info.offset.y > 90 || info.velocity.y > 600) onTutup(); }}
      >
        <span className={styles.lembarPegangan} aria-hidden="true" />
        {kepala && <div className={styles.lembarKepala}>{kepala}<TombolIkon label="Tutup" onClick={onTutup}><X size={20} weight="bold" /></TombolIkon></div>}
        <div className={styles.lembarIsi}>{children}</div>
      </motion.div>
    </dialog>,
    document.body,
  );
}

// ── Lain-lain ───────────────────────────────────────────────────────────────────────────────

/** Teks panjang yang dipotong beberapa baris, bisa dibuka dengan animasi tinggi. */
export function TeksLipat({ children, baris = 5, panjangMin = 260 }) {
  const [buka, setBuka] = useState(false);
  const teks = String(children || "");
  if (teks.length < panjangMin) return <p className={styles.teksLipat}>{teks}</p>;
  return (
    <div>
      <motion.p
        className={`${styles.teksLipat} ${buka ? "" : styles.teksTerlipat}`}
        style={{ "--baris": baris }}
        layout
        transition={{ duration: 0.35, ease: EASE }}
      >
        {teks}
      </motion.p>
      <motion.button type="button" className={styles.tombolLipat} onClick={() => setBuka((v) => !v)} whileTap={TEKAN}>
        {buka ? "Ringkas" : "Selengkapnya"}
      </motion.button>
    </div>
  );
}

/** Gabung anak dalam grid berkelas; dipakai supaya baris kartu ikut bertahap. */
export function Grid({ children, kolom = 3, className = "", jeda = 0.06, ...rest }) {
  return (
    <Bertahap className={`${styles.grid} ${className}`} style={{ "--kolom": kolom }} jeda={jeda} {...rest}>
      {Children.toArray(children)}
    </Bertahap>
  );
}

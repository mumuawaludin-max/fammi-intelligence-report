// Panduan langkah demi langkah. Menggelapkan layar kecuali satu bagian (sorotan), lalu menaruh
// kartu penjelasan di dekatnya. Sorotan dan kartu bergerak halus antarlangkah. Isi langkah dari
// lib/waTur.js; bagian yang disorot dicari lewat atribut data-tur.
//
// Perilaku:
// - Layar di belakang tidak bisa diklik selama panduan terbuka; gulir tetap bisa.
// - Langkah yang targetnya tidak muncul dalam 2,5 detik dilewati ke arah yang sama.
// - Keyboard: panah kanan/Enter lanjut, panah kiri kembali, Escape menutup.
// - Di layar sempit (ponsel) kartu menempel di bawah dan bagian yang disorot digulir ke atas.
// - Tanpa garis tepi (instruksi pemilik produk): sorotan dibentuk dari bayangan gelap di
//   sekelilingnya, kartu dibedakan lewat latar putih.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Compass } from "@phosphor-icons/react";
import { EASE } from "./waGerak";
import swTokens from "../sw/swTokens.module.css";
import tokens from "./waTokens.module.css";
import styles from "./WaTur.module.css";

const JARAK = 10;
const LEBAR_KARTU = 380;
const BATAS_PONSEL = 640;

// Isi kartu bergeser searah tombol yang ditekan: Lanjut dari kanan, Kembali dari kiri.
const GESER = {
  masuk: (arah) => ({ opacity: 0, x: arah * 24 }),
  tampil: { opacity: 1, x: 0 },
  keluar: (arah) => ({ opacity: 0, x: arah * -24 }),
};

// Posisi kartu. Ponsel: menempel di bawah. Tanpa sorotan: di tengah. Selebihnya di sisi sorotan
// yang ruangnya paling lega (bawah, atas, kanan, kiri), dengan tinggi maksimum sebesar ruang itu
// supaya kartu tidak pernah keluar layar; isi kartu bergulir jika tidak muat. Jika sorotan
// memenuhi layar, kartu menumpang di pojok kanan bawah.
function posisiKartu(ponsel, kotak, layar) {
  const TEPI = 16;
  const SELA = 14;
  if (ponsel) return { left: 12, right: 12, bottom: 12 };
  if (!kotak) {
    const lebar = Math.min(LEBAR_KARTU + 80, layar.w - TEPI * 2);
    return { left: (layar.w - lebar) / 2, top: Math.max(24, layar.h * 0.2), width: lebar, maxHeight: layar.h * 0.7 };
  }
  const kiriSejajar = Math.min(Math.max(TEPI, kotak.x), layar.w - LEBAR_KARTU - TEPI);
  const ruang = {
    bawah: layar.h - (kotak.y + kotak.h) - SELA - TEPI,
    atas: kotak.y - SELA - TEPI,
    kanan: layar.w - (kotak.x + kotak.w) - SELA - TEPI,
    kiri: kotak.x - SELA - TEPI,
  };
  const tinggiPenuh = Math.min(560, layar.h - TEPI * 2);
  const atasSamping = Math.min(Math.max(TEPI, kotak.y), layar.h - tinggiPenuh - TEPI);
  if (ruang.bawah >= 280 && ruang.bawah >= ruang.atas) {
    return { left: kiriSejajar, top: kotak.y + kotak.h + SELA, width: LEBAR_KARTU, maxHeight: Math.min(560, ruang.bawah) };
  }
  if (ruang.atas >= 280) {
    return { left: kiriSejajar, bottom: layar.h - kotak.y + SELA, width: LEBAR_KARTU, maxHeight: Math.min(560, ruang.atas) };
  }
  if (ruang.kanan >= LEBAR_KARTU) {
    return { left: kotak.x + kotak.w + SELA, top: atasSamping, width: LEBAR_KARTU, maxHeight: tinggiPenuh };
  }
  if (ruang.kiri >= LEBAR_KARTU) {
    return { left: kotak.x - SELA - LEBAR_KARTU, top: atasSamping, width: LEBAR_KARTU, maxHeight: tinggiPenuh };
  }
  return { right: TEPI + 8, bottom: TEPI + 8, width: LEBAR_KARTU, maxHeight: Math.min(420, layar.h * 0.6) };
}

// Tepi bawah bilah yang menempel di atas layar (ditandai data-tur-lekat), supaya bagian yang
// disorot tidak tertutup bilah itu.
function batasAtas() {
  const bilah = [...document.querySelectorAll("[data-tur-lekat]")].map((e) => e.getBoundingClientRect().bottom);
  return Math.max(0, ...bilah) + JARAK + 8;
}

// Posisi atas tujuan gulir untuk sebuah bagian. Bagian ditaruh tepat di bawah bilah supaya kartu
// muat di bawahnya. Jika bagiannya terlalu tinggi untuk itu, bagian ditaruh di tengah ruang yang
// tersisa, atau di atas jika lebih tinggi dari layar; kartu lalu pindah ke samping atau pojok.
function tujuanGulir(r) {
  const atas = batasAtas();
  const tinggiLayar = window.innerHeight;
  if (window.innerWidth < BATAS_PONSEL) return atas;
  if (atas + r.height + JARAK + 300 <= tinggiLayar) return atas;
  if (r.height + JARAK * 2 <= tinggiLayar - atas) return atas + (tinggiLayar - atas - r.height) / 2;
  return atas;
}

function cariTarget(nama) {
  return nama ? document.querySelector(`[data-tur="${nama}"]`) : null;
}

export default function WaTur({ langkah, onTutup, onBagian, judul = "Panduan" }) {
  const [{ i, arah }, setPos] = useState({ i: 0, arah: 1 });
  const [kotak, setKotak] = useState(null);
  const [layar, setLayar] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const elRef = useRef(null);
  const kartuRef = useRef(null);
  const tombolRef = useRef(null);
  const idJudul = useId();
  const diam = useReducedMotion();
  const total = langkah.length;
  const step = langkah[i];
  const ponsel = layar.w < BATAS_PONSEL;

  const ukur = useCallback(() => {
    setLayar({ w: window.innerWidth, h: window.innerHeight });
    const el = elRef.current;
    if (!el || !el.isConnected) { setKotak(null); return; }
    const r = el.getBoundingClientRect();
    setKotak({ x: r.left - JARAK, y: r.top - JARAK, w: r.width + JARAK * 2, h: r.height + JARAK * 2 });
  }, []);

  const pindah = useCallback((ke) => {
    if (ke < 0) return;
    if (ke >= total) { onTutup(true); return; }
    setPos({ i: ke, arah: ke >= i ? 1 : -1 });
  }, [i, total, onTutup]);

  // Cari target langkah ini: buka bagiannya dulu jika perlu, tunggu elemennya muncul, gulir ke
  // sana, lalu ukur. Jika tidak muncul, lewati ke arah yang sama.
  useEffect(() => {
    let hidup = true;
    let timer;
    elRef.current = null;
    if (step?.bagian && onBagian) onBagian(step.bagian);
    if (!step?.target) {
      Promise.resolve().then(() => hidup && setKotak(null));
      return () => { hidup = false; };
    }
    const mulai = Date.now();
    const coba = () => {
      if (!hidup) return;
      const el = cariTarget(step.target);
      if (el) {
        elRef.current = el;
        const r = el.getBoundingClientRect();
        window.scrollTo({ top: Math.max(0, window.scrollY + r.top - tujuanGulir(r)), behavior: diam ? "auto" : "smooth" });
        ukur();
        // Gulir halus memakan waktu; ukur ulang beberapa kali sampai posisinya tenang.
        [120, 260, 420, 650, 900].forEach((t) => setTimeout(() => hidup && ukur(), t));
        return;
      }
      if (Date.now() - mulai > 2500) {
        const ke = i + arah;
        if (ke < 0 || ke >= total) onTutup(true);
        else setPos({ i: ke, arah });
        return;
      }
      timer = setTimeout(coba, 80);
    };
    coba();
    return () => { hidup = false; clearTimeout(timer); };
  }, [i, arah, step, onBagian, ukur, diam, total, onTutup]);

  useEffect(() => {
    const ulang = () => ukur();
    // capture: gulir di dalam wadah bergulir (bukan jendela) juga ikut terukur
    document.addEventListener("scroll", ulang, { passive: true, capture: true });
    window.addEventListener("resize", ulang);
    return () => {
      document.removeEventListener("scroll", ulang, { capture: true });
      window.removeEventListener("resize", ulang);
    };
  }, [ukur]);

  useEffect(() => {
    function tombol(e) {
      if (e.key === "Escape") { e.preventDefault(); onTutup(false); }
      else if (e.key === "ArrowRight") { e.preventDefault(); pindah(i + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); pindah(i - 1); }
    }
    window.addEventListener("keydown", tombol);
    return () => window.removeEventListener("keydown", tombol);
  }, [i, pindah, onTutup]);

  useLayoutEffect(() => { tombolRef.current?.focus({ preventScroll: true }); }, [i]);

  const posisi = posisiKartu(ponsel, kotak, layar);

  const sorot = kotak || { x: layar.w / 2, y: layar.h / 2, w: 0, h: 0 };
  const akhir = i === total - 1;

  return createPortal(
    <div className={`${swTokens.scope} ${tokens.scope} ${styles.akar}`} role="presentation" onClick={(e) => e.stopPropagation()}>
      <motion.div
        className={styles.sorot}
        initial={{ opacity: 0, x: sorot.x, y: sorot.y, width: sorot.w, height: sorot.h }}
        animate={{ opacity: 1, x: sorot.x, y: sorot.y, width: sorot.w, height: sorot.h, borderRadius: kotak ? 18 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 32 }}
        aria-hidden="true"
      />
      <motion.div
        ref={kartuRef}
        className={`${styles.kartu} ${ponsel ? styles.kartuPonsel : ""}`}
        style={posisi}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idJudul}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        layout={!diam}
      >
        <div className={styles.atas}>
          <span className={styles.lencana}><Compass size={14} weight="fill" aria-hidden="true" /> {judul} · {i + 1} dari {total}</span>
          <motion.button type="button" className={styles.lewati} onClick={() => onTutup(false)} whileTap={{ scale: 0.94 }}>
            Lewati
          </motion.button>
        </div>

        <AnimatePresence mode="wait" initial={false} custom={arah}>
          <motion.div
            key={i}
            className={styles.isi}
            custom={arah}
            variants={GESER}
            initial="masuk"
            animate="tampil"
            exit="keluar"
            transition={{ duration: 0.26, ease: EASE }}
          >
            <h2 id={idJudul} className={styles.judul}>{step?.judul}</h2>
            {(step?.isi || []).map((p, k) => <p key={k} className={styles.teks}>{p}</p>)}
            {step?.daftar && (
              <ul className={styles.daftar}>
                {step.daftar.map((d, k) => (
                  <motion.li key={d.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * k, duration: 0.25 }}>
                    {d.tanda ? <span className={styles.tanda}>{d.tanda}</span> : <span className={styles.titik} aria-hidden="true" />}
                    <span><b>{d.label}.</b> {d.teks}</span>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>

        <div className={styles.bawah}>
          <div className={styles.kemajuan} aria-hidden="true">
            {langkah.map((_, k) => (
              <motion.span key={k} className={styles.kemajuanTitik} animate={{ width: k === i ? 18 : 6, opacity: k <= i ? 1 : 0.35 }} transition={{ duration: 0.25 }} />
            ))}
          </div>
          <div className={styles.tombolBaris}>
            {i > 0 && (
              <motion.button type="button" className={styles.kembali} onClick={() => pindah(i - 1)} whileTap={{ scale: 0.94 }}>
                <ArrowLeft size={15} weight="bold" aria-hidden="true" /> Kembali
              </motion.button>
            )}
            <motion.button ref={tombolRef} type="button" className={styles.lanjut} onClick={() => pindah(i + 1)} whileTap={{ scale: 0.94 }} whileHover={{ y: -1 }}>
              {akhir ? <>Selesai <Check size={15} weight="bold" aria-hidden="true" /></> : <>Lanjut <ArrowRight size={15} weight="bold" aria-hidden="true" /></>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

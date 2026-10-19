// Dialog sambutan laporan individu (permintaan pemilik produk 2026-10-19). Muncul setiap laporan
// dibuka, sebelum pegawai bisa melihat apa pun: tidak ada tombol tutup, Escape dan klik latar
// tidak menutupnya, dan isi di belakangnya tidak bisa disentuh (native <dialog> modal). Satu-
// satunya jalan keluar adalah mencentang pernyataan pemahaman lalu menekan tombol siap.
//
// Nada: lugas dan jujur, tanpa hiperbola (revisi pemilik produk 2026-10-19). Alasan diundang
// disebut apa adanya sesuai jalur peserta Screening Awal (minta didampingi, jawaban perlu
// didalami, perwakilan unit) tanpa menyebut alasan orang itu. Bagian "siapa yang bisa melihat
// apa" mengikuti RLS migration 20261020100000: Human Capital melihat angka, tidak melihat narasi
// pribadi; isi cerita hanya dibaca tim Fammi untuk menyusun tanggapan. Jangan menjanjikan lebih
// dari itu, dan jangan menawarkan percakapan atau pendampingan dari Fammi (keputusan pemilik produk).
// Mode `terkunci = false` dipakai saat pegawai membuka ulang lewat menu "Tentang asesmen ini".

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft, ArrowRight, ChatCircleText, Check, Compass, Footprints, HandHeart, Heart, LockKey, Plant, ShieldCheck,
  Stethoscope, ThumbsUp, UsersThree,
} from "@phosphor-icons/react";
import { namaDepan } from "./lib/waAturan";
import { IlustrasiSambutan } from "./WaIlustrasi";
import { Dialog, Tombol } from "./WaUi";
import { EASE } from "./waGerak";
import styles from "./WaSambutan.module.css";

const ALASAN = [
  {
    ikon: Compass, warna: "var(--fm-ungu)",
    judul: "Alasannya berbeda-beda",
    isi: "Ada yang menyatakan ingin didampingi, ada yang jawaban screening-nya perlu ditanyakan lebih lanjut, dan ada yang dipilih supaya setiap unit terwakili. Laporan ini tidak menyebutkan alasan Anda.",
  },
  {
    ikon: ShieldCheck, warna: "var(--fm-hijau)",
    judul: "Bukan penilaian kinerja",
    isi: "Asesmen ini mengukur kesejahteraan diri dan kepuasan kerja. Kinerja Anda tidak diukur di sini.",
  },
  {
    ikon: Stethoscope, warna: "var(--fm-jingga)",
    judul: "Bukan diagnosis",
    isi: "Angka di laporan ini menggambarkan jawaban Anda saat mengisi. Angka ini bukan hasil pemeriksaan kesehatan.",
  },
  {
    ikon: HandHeart, warna: "var(--wa-kuning)",
    judul: "Dipakai untuk menyusun dukungan",
    isi: "Hasil seluruh peserta dirangkum untuk lembaga sebagai bahan program dan pelatihan.",
  },
];

const TEMUAN = [
  { ikon: Heart, judul: "Kesejahteraan diri", isi: "Skor enam aspek PROTEK dari 42 pernyataan." },
  { ikon: ThumbsUp, judul: "Kepuasan kerja", isi: "Rata-rata kepuasan di enam bidang pekerjaan." },
  { ikon: Plant, judul: "Yang kuat dan yang bisa dikuatkan", isi: "Pernyataan dengan skor tertinggi dan terendah." },
  { ikon: Footprints, judul: "Langkah kecil", isi: "Beberapa hal yang bisa dicoba, sesuai hasil Anda." },
];

const JANJI = [
  { ikon: LockKey, judul: "Penjelasan pribadi", isi: "Penjelasan, langkah kecil, dan pesan di laporan ini hanya tampil di akun Anda." },
  { ikon: UsersThree, judul: "Human Capital", isi: "Tim Human Capital lembaga melihat angka skor tiap pegawai untuk merencanakan dukungan. Penjelasan pribadi di laporan ini tidak bisa mereka buka." },
  { ikon: ChatCircleText, judul: "Cerita yang Anda tulis", isi: "Isinya hanya dibaca tim Fammi untuk menyusun tanggapan bagi Anda. Lembaga hanya menerima rangkuman tema dari banyak orang, tanpa nama dan tanpa kutipan." },
];

const LANGKAH = 4;

const geser = {
  masuk: (arah) => ({ opacity: 0, x: arah * 48 }),
  tampil: { opacity: 1, x: 0, transition: { duration: 0.42, ease: EASE } },
  keluar: (arah) => ({ opacity: 0, x: arah * -48, transition: { duration: 0.25 } }),
};

const anak = {
  masuk: { opacity: 0, y: 14 },
  tampil: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: 0.12 + i * 0.08, duration: 0.45, ease: EASE } }),
};

export default function WaSambutan({ buka, onSelesai, nama, lembaga, nPeserta, terkunci = true }) {
  const [langkah, setLangkah] = useState(0);
  const [arah, setArah] = useState(1);
  const [paham, setPaham] = useState(!terkunci);

  function ke(n) {
    setArah(n > langkah ? 1 : -1);
    setLangkah(n);
  }

  function selesai() {
    onSelesai();
    setLangkah(0);
  }

  const akhir = langkah === LANGKAH - 1;

  return (
    <Dialog buka={buka} onTutup={terkunci ? undefined : selesai} terkunci={terkunci} lebar="kecil" kelas={styles.bingkai}>
      <div className={styles.isi}>
        <div className={styles.kemajuan} aria-label={`Langkah ${langkah + 1} dari ${LANGKAH}`}>
          {Array.from({ length: LANGKAH }, (_, i) => (
            <span key={i} className={styles.kemajuanJalur}>
              <motion.span className={styles.kemajuanIsi} initial={false} animate={{ scaleX: i <= langkah ? 1 : 0 }} transition={{ duration: 0.4, ease: EASE }} />
            </span>
          ))}
        </div>

        <div className={styles.panggung}>
          <AnimatePresence mode="popLayout" custom={arah} initial={false}>
            <motion.div key={langkah} custom={arah} variants={geser} initial="masuk" animate="tampil" exit="keluar" className={styles.slide}>
              {langkah === 0 && (
                <>
                  <motion.div className={styles.gambar} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 16 }}>
                    <IlustrasiSambutan ukuran={210} />
                  </motion.div>
                  <motion.p className={styles.kecil} variants={anak} initial="masuk" animate="tampil" custom={0}>Wellbeing Assessment · {lembaga}</motion.p>
                  <motion.h2 className={styles.judul} variants={anak} initial="masuk" animate="tampil" custom={1}>
                    Halo, {namaDepan(nama) || "Anda"}.
                  </motion.h2>
                  <motion.p className={styles.narasi} variants={anak} initial="masuk" animate="tampil" custom={2}>
                    Beberapa waktu lalu Anda mengisi Screening Awal Wellbeing, lalu asesmen lanjutan ini. Tiga halaman berikut menjelaskan kenapa Anda diminta mengisi, apa isi laporan, dan siapa yang bisa melihatnya.
                  </motion.p>
                  {typeof nPeserta === "number" && nPeserta > 0 && (
                    <motion.div className={styles.sorot} variants={anak} initial="masuk" animate="tampil" custom={3}>
                      <span className={styles.sorotAngka}>{nPeserta}</span>
                      <span>pegawai {lembaga} mengisi asesmen lanjutan ini. Terima kasih sudah ikut mengisi.</span>
                    </motion.div>
                  )}
                </>
              )}

              {langkah === 1 && (
                <>
                  <motion.h2 className={styles.judul} variants={anak} initial="masuk" animate="tampil" custom={0}>Kenapa Anda diminta mengisi?</motion.h2>
                  <motion.p className={styles.narasi} variants={anak} initial="masuk" animate="tampil" custom={1}>
                    Setelah Screening Awal, lembaga meminta sebagian pegawai mengisi asesmen yang lebih rinci, supaya dukungan yang disiapkan sesuai dengan kondisi sebenarnya.
                  </motion.p>
                  <ul className={styles.poin}>
                    {ALASAN.map((a, i) => (
                      <motion.li key={a.judul} variants={anak} initial="masuk" animate="tampil" custom={i + 2} style={{ "--w": a.warna }}>
                        <motion.span className={styles.poinIkon} whileHover={{ rotate: -10, scale: 1.1 }}>
                          <a.ikon size={20} weight="fill" aria-hidden="true" />
                        </motion.span>
                        <span>
                          <b>{a.judul}</b>
                          {a.isi}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </>
              )}

              {langkah === 2 && (
                <>
                  <motion.h2 className={styles.judul} variants={anak} initial="masuk" animate="tampil" custom={0}>Isi laporan ini</motion.h2>
                  <motion.p className={styles.narasi} variants={anak} initial="masuk" animate="tampil" custom={1}>
                    Semua isi laporan disusun dari jawaban Anda sendiri.
                  </motion.p>
                  <div className={styles.ubin}>
                    {TEMUAN.map((x, i) => (
                      <motion.div key={x.judul} className={styles.ubinSatu} variants={anak} initial="masuk" animate="tampil" custom={i + 2} whileHover={{ y: -3 }}>
                        <x.ikon size={24} weight="fill" aria-hidden="true" />
                        <b>{x.judul}</b>
                        <span>{x.isi}</span>
                      </motion.div>
                    ))}
                  </div>
                  <motion.p className={styles.catatan} variants={anak} initial="masuk" animate="tampil" custom={6}>
                    Kalau Anda menulis cerita saat mengisi, ada juga tanggapan untuk cerita itu. Setelah ini, panduan singkat menjelaskan tiap bagian laporan.
                  </motion.p>
                </>
              )}

              {langkah === 3 && (
                <>
                  <motion.h2 className={styles.judul} variants={anak} initial="masuk" animate="tampil" custom={0}>Siapa yang bisa melihat apa</motion.h2>
                  <ul className={styles.poin}>
                    {JANJI.map((a, i) => (
                      <motion.li key={a.judul} variants={anak} initial="masuk" animate="tampil" custom={i + 1} style={{ "--w": "var(--fm-ungu)" }}>
                        <span className={styles.poinIkon}><a.ikon size={20} weight="fill" aria-hidden="true" /></span>
                        <span>
                          <b>{a.judul}</b>
                          {a.isi}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                  <motion.label className={`${styles.paham} ${paham ? styles.pahamAktif : ""}`} variants={anak} initial="masuk" animate="tampil" custom={4} whileTap={{ scale: 0.98 }}>
                    <input type="checkbox" checked={paham} onChange={(e) => setPaham(e.target.checked)} />
                    <span className={styles.pahamKotak} aria-hidden="true">
                      <AnimatePresence>
                        {paham && (
                          <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                            <Check size={16} weight="bold" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <span>Saya memahami bahwa laporan ini menggambarkan jawaban saya saat mengisi, bukan penilaian atas diri saya.</span>
                  </motion.label>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className={styles.aksi}>
          {akhir ? (
            <motion.div className={styles.aksiAkhir} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Tombol varian="utama" ukuran="besar" disabled={!paham} onClick={selesai} className={styles.tombolSiap}>
                Saya memahami dan siap melihat hasil saya
              </Tombol>
              <button type="button" className={styles.kembali} onClick={() => ke(langkah - 1)}>
                <ArrowLeft size={14} weight="bold" aria-hidden="true" /> Kembali
              </button>
            </motion.div>
          ) : (
            <>
              {langkah > 0 ? (
                <Tombol varian="garis" ikon={ArrowLeft} onClick={() => ke(langkah - 1)}>Kembali</Tombol>
              ) : <span />}
              <Tombol varian="gelap" ikonKanan={ArrowRight} onClick={() => ke(langkah + 1)}>
                {langkah === 0 ? "Mulai" : "Lanjut"}
              </Tombol>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}

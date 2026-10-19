// Bagian "Umpan Balik" di laporan pegawai: survei singkat pengalaman mengikuti Wellbeing
// Assessment (permintaan pemilik produk 2026-10-19). Skala bintang 1 sampai 10, pilihan ganda,
// dan paling banyak dua esai, semuanya dari PERTANYAAN_UMPAN_BALIK (waMeta). Jawaban tersimpan
// lewat `umpan.kirim` (Supabase di produksi, memori di pratinjau) dan bisa diubah kapan saja.
// Human Capital hanya melihat rekap tanpa nama (lihat migration 20261021100000).

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, PaperPlaneTilt, PencilSimple, Star } from "@phosphor-icons/react";
import {
  ESAI_MAKS_KARAKTER, LAINNYA_MAKS_KARAKTER, OPSI_LAINNYA, PERTANYAAN_UMPAN_BALIK, opsiUmpanBalik, umpanBalikBelumLengkap,
} from "./lib/waMeta";
import { formatHari } from "./lib/waAturan";
import { Bertahap, Kartu, KeadaanKosong, Muncul } from "./WaUi";
import { EASE } from "./waGerak";
import styles from "./WaUmpanBalik.module.css";

const KOSONG = { nilai: {}, pilihan: {}, esai: {}, lainnya: {} };

export default function WaUmpanBalik({ umpan }) {
  const [ubah, setUbah] = useState(false);
  if (!umpan || umpan.memuat) return <KeadaanKosong kecil judul="Memuat…" />;
  if (!umpan.tersedia) {
    return <KeadaanKosong judul="Umpan balik belum bisa diisi" pesan="Akun ini belum tertaut ke isian asesmen. Hubungi Human Capital." />;
  }
  const sudah = Boolean(umpan.dikirimPada);
  return (
    <Bertahap className={styles.tumpuk}>
      <Kartu className={styles.pembuka}>
        <motion.span className={styles.pembukaIkon} animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.5 }}>
          <Star size={30} weight="fill" aria-hidden="true" />
        </motion.span>
        <div>
          <h2>Bagaimana pengalaman Anda?</h2>
          <p>Sembilan pertanyaan singkat, sekitar dua menit. Jawaban Anda dipakai untuk memperbaiki asesmen dan laporan berikutnya.</p>
        </div>
      </Kartu>

      <AnimatePresence mode="wait" initial={false}>
        {sudah && !ubah ? (
          <motion.div key="terima" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease: EASE }}>
            <Terkirim umpan={umpan} onUbah={() => setUbah(true)} />
          </motion.div>
        ) : (
          <motion.div key="isi" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease: EASE }}>
            <Formulir awal={umpan.jawaban || KOSONG} sudah={sudah} kirim={umpan.kirim} onSelesai={() => setUbah(false)} onBatal={sudah ? () => setUbah(false) : null} />
          </motion.div>
        )}
      </AnimatePresence>
    </Bertahap>
  );
}

function Terkirim({ umpan, onUbah }) {
  const puas = umpan.jawaban?.nilai?.puas_keseluruhan;
  return (
    <Kartu className={styles.terkirim}>
      <motion.span className={styles.terkirimIkon} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 14 }}>
        <CheckCircle size={44} weight="fill" aria-hidden="true" />
      </motion.span>
      <h3>Terima kasih, jawaban Anda sudah terkirim</h3>
      <p>
        {puas ? `Anda memberi nilai ${puas} dari 10 untuk laporan ini. ` : ""}
        Dikirim {formatHari(umpan.dikirimPada)}
        {umpan.diperbaruiPada && umpan.diperbaruiPada !== umpan.dikirimPada ? `, terakhir diubah ${formatHari(umpan.diperbaruiPada)}` : ""}.
      </p>
      <motion.button type="button" className={styles.tombolLembut} onClick={onUbah} whileTap={{ scale: 0.95 }}>
        <PencilSimple size={16} weight="bold" aria-hidden="true" /> Ubah jawaban
      </motion.button>
    </Kartu>
  );
}

function Formulir({ awal, sudah, kirim, onSelesai, onBatal }) {
  const [jawaban, setJawaban] = useState(() => ({
    nilai: { ...(awal.nilai || {}) },
    pilihan: { ...(awal.pilihan || {}) },
    esai: { ...(awal.esai || {}) },
    lainnya: { ...(awal.lainnya || {}) },
  }));
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState(null);
  const [coba, setCoba] = useState(false);
  const belum = umpanBalikBelumLengkap(jawaban);
  const wajib = PERTANYAAN_UMPAN_BALIK.filter((p) => p.jenis !== "esai").length;
  const belumKode = new Set(belum.map((p) => p.kode));

  const set = (jenis, kode, nilai) => setJawaban((j) => ({ ...j, [jenis]: { ...j[jenis], [kode]: nilai } }));

  async function kirimJawaban() {
    setCoba(true);
    if (belum.length) {
      document.getElementById(`ub-${belum[0].kode}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSibuk(true);
    setGalat(null);
    try {
      // Esai kosong tidak dikirim, supaya rekap tidak berisi baris kosong.
      const esai = Object.fromEntries(Object.entries(jawaban.esai).map(([k, v]) => [k, String(v || "").trim()]).filter(([, v]) => v));
      // Teks "Lainnya" hanya dikirim untuk pertanyaan yang memang memilih opsi itu.
      const lainnya = Object.fromEntries(Object.entries(jawaban.lainnya)
        .filter(([k]) => [].concat(jawaban.pilihan[k] || []).includes(OPSI_LAINNYA))
        .map(([k, v]) => [k, String(v || "").trim()])
        .filter(([, v]) => v));
      await kirim({ ...jawaban, esai, lainnya });
      onSelesai();
    } catch (e) {
      setGalat(e.message || "Jawaban belum terkirim. Coba lagi.");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div className={styles.formulir}>
      <div className={styles.kemajuan} aria-live="polite">
        <span>{wajib - belum.length} dari {wajib} pertanyaan wajib terjawab</span>
        <span className={styles.kemajuanJalur}><motion.span animate={{ width: `${((wajib - belum.length) / wajib) * 100}%` }} transition={{ duration: 0.35 }} /></span>
      </div>

      <Bertahap className={styles.tumpuk} jeda={0.05}>
        {PERTANYAAN_UMPAN_BALIK.map((p, i) => (
          <Muncul key={p.kode} id={`ub-${p.kode}`} className={`${styles.tanya} ${coba && belumKode.has(p.kode) ? styles.tanyaKurang : ""}`}>
            <span className={styles.tanyaNomor}>{i + 1}</span>
            <div className={styles.tanyaIsi}>
              <p className={styles.tanyaTeks}>
                {p.tanya}
                {p.jenis === "esai" && <span className={styles.opsional}> (tidak wajib)</span>}
              </p>
              {p.jenis === "nilai" && <SkalaBintang kode={p.kode} nilai={jawaban.nilai[p.kode]} onPilih={(v) => set("nilai", p.kode, v)} />}
              {p.jenis === "pilihan" && (
                <Pilihan
                  p={p}
                  nilai={jawaban.pilihan[p.kode]}
                  onUbah={(v) => set("pilihan", p.kode, v)}
                  teksLainnya={jawaban.lainnya[p.kode] || ""}
                  onUbahLainnya={(v) => set("lainnya", p.kode, v)}
                />
              )}
              {p.jenis === "esai" && (
                <label className={styles.esai}>
                  <textarea
                    rows={3}
                    maxLength={ESAI_MAKS_KARAKTER}
                    placeholder={p.contoh}
                    value={jawaban.esai[p.kode] || ""}
                    onChange={(e) => set("esai", p.kode, e.target.value)}
                    aria-label={p.tanya}
                  />
                  <span>{(jawaban.esai[p.kode] || "").length}/{ESAI_MAKS_KARAKTER}</span>
                </label>
              )}
              {coba && belumKode.has(p.kode) && <span className={styles.kurang}>Pertanyaan ini perlu dijawab.</span>}
            </div>
          </Muncul>
        ))}
      </Bertahap>

      {galat && <p className={styles.galat} role="alert">{galat}</p>}
      <div className={styles.aksi}>
        {onBatal && (
          <motion.button type="button" className={styles.tombolLembut} onClick={onBatal} whileTap={{ scale: 0.95 }} disabled={sibuk}>
            Batal
          </motion.button>
        )}
        <motion.button type="button" className={styles.tombolKirim} onClick={kirimJawaban} whileTap={{ scale: 0.95 }} whileHover={{ y: -1 }} disabled={sibuk}>
          <PaperPlaneTilt size={18} weight="fill" aria-hidden="true" />
          {sibuk ? "Mengirim…" : sudah ? "Simpan perubahan" : "Kirim umpan balik"}
        </motion.button>
      </div>
    </div>
  );
}

/** Sepuluh bintang. Ketuk bintang ke-n untuk memberi nilai n; panah kiri/kanan menggeser nilai. */
function SkalaBintang({ kode, nilai, onPilih }) {
  const [sorot, setSorot] = useState(0);
  const tampil = sorot || nilai || 0;
  return (
    <div className={styles.skala}>
      <div
        className={styles.bintangBaris}
        role="radiogroup"
        aria-label="Nilai 1 sampai 10"
        onMouseLeave={() => setSorot(0)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); onPilih(Math.min(10, (nilai || 0) + 1)); }
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); onPilih(Math.max(1, (nilai || 2) - 1)); }
        }}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const aktif = n <= tampil;
          return (
            <motion.button
              key={n}
              type="button"
              role="radio"
              aria-checked={nilai === n}
              aria-label={`Nilai ${n}`}
              tabIndex={nilai ? (nilai === n ? 0 : -1) : (n === 1 ? 0 : -1)}
              className={`${styles.bintang} ${aktif ? styles.bintangAktif : ""}`}
              onClick={() => onPilih(n)}
              onMouseEnter={() => setSorot(n)}
              whileTap={{ scale: 0.8 }}
              animate={nilai === n ? { scale: [1, 1.35, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              data-kode={kode}
            >
              <Star size={24} weight={aktif ? "fill" : "regular"} aria-hidden="true" />
            </motion.button>
          );
        })}
      </div>
      <div className={styles.skalaKet}>
        <span>1 sangat rendah</span>
        <AnimatePresence mode="wait">
          <motion.b key={tampil} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
            {tampil ? `${tampil} dari 10` : "Belum dinilai"}
          </motion.b>
        </AnimatePresence>
        <span>10 sangat tinggi</span>
      </div>
    </div>
  );
}

function Pilihan({ p, nilai, onUbah, teksLainnya, onUbahLainnya }) {
  const opsi = opsiUmpanBalik(p);
  const terpilih = p.banyak ? new Set(nilai || []) : new Set(nilai ? [nilai] : []);
  function ketuk(o) {
    if (!p.banyak) { onUbah(o); return; }
    const baru = new Set(terpilih);
    if (baru.has(o)) baru.delete(o);
    else if (o === "Belum tahu") { baru.clear(); baru.add(o); }
    else { baru.delete("Belum tahu"); baru.add(o); }
    onUbah(opsi.filter((x) => baru.has(x)));
  }
  const pilihLainnya = terpilih.has(OPSI_LAINNYA);
  return (
    <>
      <div className={styles.pilihan} role={p.banyak ? "group" : "radiogroup"} aria-label={p.tanya}>
        {opsi.map((o) => {
          const aktif = terpilih.has(o);
          return (
            <motion.button
              key={o}
              type="button"
              role={p.banyak ? "checkbox" : "radio"}
              aria-checked={aktif}
              className={`${styles.chip} ${aktif ? styles.chipAktif : ""}`}
              onClick={() => ketuk(o)}
              whileTap={{ scale: 0.95 }}
              layout
            >
              {aktif && <CheckCircle size={16} weight="fill" aria-hidden="true" />}
              {o === OPSI_LAINNYA ? "Lainnya, tulis sendiri" : o}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence initial={false}>
        {pilihLainnya && (
          <motion.label
            key="lainnya"
            className={styles.lainnya}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            <input
              type="text"
              maxLength={LAINNYA_MAKS_KARAKTER}
              placeholder="Tulis yang ingin Anda lakukan"
              value={teksLainnya}
              onChange={(e) => onUbahLainnya(e.target.value)}
              aria-label="Jawaban lainnya"
              autoFocus
            />
          </motion.label>
        )}
      </AnimatePresence>
    </>
  );
}

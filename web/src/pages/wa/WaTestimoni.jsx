// Tab Testimoni (desain D5): empat kartu pertanyaan terbuka yang sekaligus jadi penyaring, tema
// yang paling sering muncul (dari narasi kelompok), lalu kutipan bernama dua kolom. Yang tampil
// hanya jawaban berpenanda layak tampil di berkas olahan; jawaban yang menyebut orang lain atau
// minta dirahasiakan sudah dibuang pembaca.

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Quotes, SealCheck } from "@phosphor-icons/react";
import { PERAN_TESTIMONI, PERTANYAAN_TERBUKA } from "./lib/waMeta";
import { duaKolom, jumlahKutipan, kutipan } from "./lib/waAturan";
import { IKON_TERBUKA } from "./waIkon";
import { Bertahap, Grid, JudulBagian, Kartu, KeadaanKosong, KolomCari, Segmen, TeksLipat, Tombol } from "./WaUi";
import { EASE } from "./waGerak";
import t from "./WaTab.module.css";

const PER_HALAMAN = 10;

export default function WaTestimoni({ individu, narasi }) {
  const [pertanyaan, setPertanyaan] = useState(PERTANYAAN_TERBUKA[0].kode);
  const [peran, setPeran] = useState("");
  const [tema, setTema] = useState("");
  const [cari, setCari] = useState("");
  const [batas, setBatas] = useState(PER_HALAMAN);

  const jumlah = useMemo(() => jumlahKutipan(individu), [individu]);
  const semuaPertanyaan = useMemo(() => kutipan(individu, pertanyaan), [individu, pertanyaan]);
  const tersaring = useMemo(() => kutipan(individu, pertanyaan, { peran, tema, cari }), [individu, pertanyaan, peran, tema, cari]);
  const temaDaftar = narasi?.testimoni?.tema?.[pertanyaan] || [];
  const temaAktif = temaDaftar.find((x) => x.tema === tema);
  const info = PERTANYAAN_TERBUKA.find((p) => p.kode === pertanyaan);
  const [kiri, kanan] = duaKolom(tersaring.slice(0, batas));

  const opsiPeran = [
    { nilai: "", label: "Semua", jumlah: semuaPertanyaan.length },
    ...PERAN_TESTIMONI.map((p) => ({ nilai: p, label: p, jumlah: semuaPertanyaan.filter((k) => k.peran === p).length })).filter((o) => o.jumlah > 0),
  ];

  function gantiPertanyaan(kode) {
    setPertanyaan(kode);
    setPeran("");
    setTema("");
    setBatas(PER_HALAMAN);
  }

  return (
    <Bertahap className={t.halaman}>
      <Grid kolom={4} data-tur="pertanyaan">
        {PERTANYAAN_TERBUKA.map((p) => {
          const Ikon = IKON_TERBUKA[p.kode];
          const aktif = p.kode === pertanyaan;
          return (
            <Kartu key={p.kode} className={`${t.tanya} ${aktif ? t.tanyaAktif : ""}`} style={{ "--w": p.warna }} onClick={() => gantiPertanyaan(p.kode)} label={`${p.judul}, ${jumlah[p.kode]} jawaban`} aria-pressed={aktif}>
              <span className={t.tanyaAtas}>
                <Ikon size={30} weight="fill" style={{ color: p.warna }} aria-hidden="true" />
                <span className={t.tanyaJumlah}>{jumlah[p.kode]} jawaban</span>
              </span>
              <span className={t.tanyaJudul}>{p.judul}</span>
            </Kartu>
          );
        })}
      </Grid>

      {temaDaftar.length > 0 && (
        <section data-tur="tema">
          <JudulBagian keterangan="Dirangkum dari jawaban pegawai. Klik satu tema untuk menyaring kutipan.">Tema yang paling sering muncul</JudulBagian>
          <Bertahap className={t.temaDaftar} jeda={0.04}>
            {temaDaftar.map((x) => {
              const aktif = x.tema === tema;
              return (
                <motion.button
                  key={x.tema}
                  type="button"
                  className={`${t.temaChip} ${aktif ? t.temaChipAktif : ""}`}
                  style={{ "--w": info.warna }}
                  variants={{ awal: { opacity: 0, scale: 0.85 }, tampil: { opacity: 1, scale: 1 } }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => { setTema(aktif ? "" : x.tema); setBatas(PER_HALAMAN); }}
                  aria-pressed={aktif}
                >
                  {x.tema}
                  <span>{x.jumlah}</span>
                </motion.button>
              );
            })}
          </Bertahap>
          <AnimatePresence mode="wait">
            {temaAktif && (
              <motion.div
                key={temaAktif.tema}
                className={t.temaRingkas}
                style={{ "--w": info.warna }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <p><SealCheck size={18} weight="fill" aria-hidden="true" /> {temaAktif.ringkasan}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      <section>
        <div className={t.saringBaris} data-tur="saring">
          <Segmen id="wa-peran-testimoni" label="Saring peran" opsi={opsiPeran} nilai={peran} onUbah={(v) => { setPeran(v); setBatas(PER_HALAMAN); }} kecil />
          <KolomCari nilai={cari} onUbah={(v) => { setCari(v); setBatas(PER_HALAMAN); }} placeholder="Cari kata atau nama" />
        </div>

        {tersaring.length === 0 ? (
          <KeadaanKosong ikon={Quotes} judul="Belum ada kutipan yang cocok" pesan="Coba lepas saringan tema atau peran." />
        ) : (
          <div className={t.kutipanGrid} data-tur="kutipan">
            {[kiri, kanan].map((kolom, k) => (
              <div key={k} className={t.kutipanKolom}>
                <AnimatePresence mode="popLayout">
                  {kolom.map((x, i) => (
                    <motion.article
                      key={x.id}
                      layout
                      className={t.kutipan}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: (i % PER_HALAMAN) * 0.05, duration: 0.4, ease: EASE } }}
                      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                      whileHover={{ y: -3 }}
                    >
                      <header>
                        <div>
                          <h3>{x.nama}</h3>
                          <p>{x.unit}</p>
                        </div>
                        <span className={t.kutipanPeran}>{x.peran}</span>
                      </header>
                      <TeksLipat baris={5}>{x.jawaban}</TeksLipat>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}

        {tersaring.length > batas && (
          <div className={t.lebih}>
            <Tombol varian="lembut" onClick={() => setBatas((b) => b + PER_HALAMAN)}>
              Tampilkan {Math.min(PER_HALAMAN, tersaring.length - batas)} kutipan lagi
            </Tombol>
            <span>{batas} dari {tersaring.length} ditampilkan</span>
          </div>
        )}
      </section>
    </Bertahap>
  );
}

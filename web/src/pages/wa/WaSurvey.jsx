// Tab Survey (desain D4): dua kartu kesimpulan (kekuatan dan perbaikan segera) lalu enam kartu
// pilihan ganda. Persen tiap pilihan dibaca dari sheet PILIHAN (persen dari jumlah responden
// cakupan, satu orang boleh memilih lebih dari satu). Pilihan "tidak ada" dan "belum bisa
// menjawab" ditaruh redup di bawah supaya tidak bersaing dengan jawaban yang bermakna.

import { motion } from "motion/react";
import { PERTANYAAN_PILIHAN } from "./lib/waMeta";
import { formatPersen, pisahPilihan } from "./lib/waAturan";
import { IKON_PILIHAN } from "./waIkon";
import { IlustrasiKekuatan, IlustrasiPerbaikan } from "./WaIlustrasi";
import { Bar, Bertahap, Grid, Kartu, KeadaanKosong, Muncul, Petunjuk } from "./WaUi";
import t from "./WaTab.module.css";

export default function WaSurvey({ kelompok, narasi }) {
  const survey = narasi?.survey || {};
  return (
    <Bertahap className={t.halaman}>
      <div className={t.duaHero} data-tur="kesimpulan">
        <KartuKesimpulan
          warna="var(--fm-hijau)"
          ilustrasi={<IlustrasiKekuatan ukuran={200} />}
          judul="Fokus pada kekuatan lembaga yaitu:"
          isi={survey.fokus_kekuatan}
        />
        <KartuKesimpulan
          warna="var(--fm-jingga)"
          ilustrasi={<IlustrasiPerbaikan ukuran={200} />}
          judul="Lakukan perbaikan segera pada hal berikut:"
          isi={survey.perbaikan_segera}
        />
      </div>

      <Grid kolom={3} data-tur="pilihan">
        {PERTANYAAN_PILIHAN.map((p) => (
          <KartuPilihan
            key={p.kode}
            pertanyaan={p}
            daftar={kelompok.pilihan?.[p.kode] || []}
            n={kelompok.nResponden}
            narasi={survey.narasi?.[p.kode]}
          />
        ))}
      </Grid>
    </Bertahap>
  );
}

function KartuKesimpulan({ warna, ilustrasi, judul, isi }) {
  return (
    <Kartu className={t.kesimpulan} style={{ "--w": warna }} naik>
      <div className={t.kesimpulanAtas}>
        <div className={t.kesimpulanGambar}>{ilustrasi}</div>
        <h2 className={t.kesimpulanJudul}>{judul}</h2>
      </div>
      <motion.blockquote
        className={`${t.kesimpulanKutip} ${isi ? "" : t.redup}`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
      >
        {isi || "Narasi belum tersedia untuk cakupan ini."}
      </motion.blockquote>
    </Kartu>
  );
}

function KartuPilihan({ pertanyaan, daftar, n, narasi }) {
  const Ikon = IKON_PILIHAN[pertanyaan.kode];
  const { utama, netral } = pisahPilihan(daftar);
  return (
    <Kartu className={t.pilihan} naik>
      <div className={t.pilihanKepala}>
        <motion.span
          className={t.pilihanIkon}
          style={{ background: pertanyaan.warna }}
          whileHover={{ rotate: -12, scale: 1.08 }}
          transition={{ type: "spring", stiffness: 380, damping: 14 }}
        >
          <Ikon size={32} weight="fill" aria-hidden="true" />
        </motion.span>
        <h3>{pertanyaan.judul}</h3>
      </div>
      <div className={t.pilihanDaftar}>
        {daftar.length === 0 && <KeadaanKosong kecil judul="Belum ada jawaban" />}
        <Bertahap jeda={0.05}>
          {[...utama, ...netral].map((p, i) => {
            const redup = i >= utama.length;
            return (
              <Muncul key={p.pilihan} className={`${t.pilihanBaris} ${redup ? t.pilihanRedup : ""}`}>
                <Petunjuk teks={`${p.jumlah} dari ${n} pegawai memilih ini${redup ? ". Jawaban netral, ditaruh di bawah." : "."}`} blok>
                  <span className={t.pilihanTeks}>
                    <b>{p.pilihan}</b>
                    <span>{formatPersen(p.pct)}</span>
                  </span>
                </Petunjuk>
                <Bar pct={p.pct} warna={redup ? "#c9c6d3" : pertanyaan.warna} tunda={0.1 + i * 0.05} />
              </Muncul>
            );
          })}
        </Bertahap>
      </div>
      <p className={`${t.pilihanNarasi} ${narasi ? "" : t.redup}`}>{narasi || "Narasi belum tersedia."}</p>
    </Kartu>
  );
}

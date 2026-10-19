// Tab "Dampak Asesmen" laporan Human Capital: rekap umpan balik pegawai tentang pengalaman
// mengikuti Wellbeing Assessment, diperbarui otomatis begitu ada isian baru (permintaan pemilik
// produk 2026-10-19). Rekap dihitung di Postgres (wa_umpan_balik_ringkasan) tanpa identitas dan
// baru terbuka setelah minimal tiga isian; tab ini hanya menata dan menampilkan.
//
// Urutan cerita: siapa yang sudah mengisi, seberapa puas dan terbantu, apa yang ingin mereka
// lakukan setelah membaca (dampak), apakah mereka merasa diperhatikan, lalu kata-kata mereka.

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowClockwise, ChatCenteredText, Footprints, HandHeart, LockSimple, Star, UsersThree } from "@phosphor-icons/react";
import { OPSI_LAINNYA, PERTANYAAN_UMPAN_BALIK, opsiUmpanBalik } from "./lib/waMeta";
import { formatAngka, formatHari } from "./lib/waAturan";
import { AngkaHitung, Bar, BarTumpuk, Bertahap, Donat, Grid, JudulBagian, Kartu, KeadaanKosong, Legenda, Muncul, TeksLipat, Tombol } from "./WaUi";
import { EASE } from "./waGerak";
import t from "./WaTab.module.css";
import styles from "./WaDampak.module.css";

const tanya = (kode) => PERTANYAAN_UMPAN_BALIK.find((p) => p.kode === kode);

// Warna per opsi pilihan tunggal, dari yang paling positif.
const WARNA_SKALA = ["var(--fm-hijau)", "var(--wa-hijau-muda)", "var(--wa-kuning)", "var(--fm-jingga)"];

function relatif(iso) {
  if (!iso) return "";
  const detik = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (detik < 60) return "baru saja";
  if (detik < 3600) return `${Math.floor(detik / 60)} menit lalu`;
  if (detik < 86400) return `${Math.floor(detik / 3600)} jam lalu`;
  return formatHari(iso);
}

/**
 * @param ringkasan { memuat, galat, data, dimuatPada, muatUlang } dari useRingkasanUmpanBalik
 *                  (atau tiruannya di pratinjau). `data` berbentuk keluaran wa_umpan_balik_ringkasan.
 */
export default function WaDampak({ ringkasan, dataset }) {
  const data = ringkasan?.data;
  if (!ringkasan || (ringkasan.memuat && !data)) return <KeadaanKosong judul="Memuat umpan balik…" />;
  if (ringkasan.galat && !data) return <KeadaanKosong judul="Umpan balik belum bisa dimuat" pesan={ringkasan.galat} />;

  const n = data?.n ?? 0;
  const peserta = data?.peserta ?? dataset?.meta?.nDipakai ?? 0;
  return (
    <Bertahap className={t.halaman}>
      <BilahLangsung ringkasan={ringkasan} />
      <Grid kolom={4} data-tur="dampak-angka">
        <KartuPartisipasi n={n} peserta={peserta} />
        <KartuNilai kode="puas_keseluruhan" data={data} ikon={Star} />
        <KartuNilai kode="paham_diri" data={data} ikon={HandHeart} />
        <KartuNilai kode="rekomendasi" data={data} ikon={UsersThree} />
      </Grid>

      {!data?.terbuka ? (
        <Kartu className={styles.terkunci}>
          <LockSimple size={30} weight="fill" aria-hidden="true" />
          <div>
            <h3>Rekap terbuka setelah {data?.ambang ?? 3} pegawai mengisi</h3>
            <p>Supaya jawaban tidak bisa ditebak pemiliknya. Saat ini {n} pegawai sudah mengisi; halaman ini memperbarui diri begitu ada isian baru.</p>
          </div>
        </Kartu>
      ) : (
        <>
          <Rencana data={data} />
          <div className={styles.duaKolom}>
            <PilihanTunggal kode="diperhatikan" data={data} tur="dampak-diperhatikan" />
            <PilihanTunggal kode="sesuai" data={data} tur="dampak-sesuai" />
          </div>
          <SebaranNilai data={data} />
          <Esai data={data} />
        </>
      )}
    </Bertahap>
  );
}

function BilahLangsung({ ringkasan }) {
  const terakhir = ringkasan.data?.terakhir;
  return (
    <Muncul className={styles.langsung}>
      <span className={styles.langsungTitik} aria-hidden="true"><motion.span animate={{ scale: [1, 2.2], opacity: [0.6, 0] }} transition={{ duration: 1.6, repeat: Infinity }} /></span>
      <b>Langsung</b>
      <span>Seluruh lembaga · diperbarui otomatis tiap 20 detik{terakhir ? ` · isian terakhir masuk ${relatif(terakhir)}` : " · belum ada isian"}</span>
      <motion.button type="button" className={styles.muatUlang} onClick={() => ringkasan.muatUlang?.()} whileTap={{ scale: 0.9, rotate: 180 }} aria-label="Muat ulang sekarang" title="Muat ulang sekarang">
        <ArrowClockwise size={16} weight="bold" aria-hidden="true" />
      </motion.button>
    </Muncul>
  );
}

function KartuPartisipasi({ n, peserta }) {
  const pct = peserta ? (n / peserta) * 100 : 0;
  return (
    <Kartu className={styles.angka} naik>
      <span className={styles.angkaLabel}>Pegawai yang mengisi</span>
      <div className={styles.angkaBaris}>
        <Donat nilai={pct} ukuran={64} tebal={10} warna="var(--fm-ungu)" label={`${formatAngka(pct, 0)}% peserta mengisi`}>
          <span className={styles.donatTeks}>{formatAngka(pct, 0)}%</span>
        </Donat>
        <div>
          <span className={styles.angkaBesar}><AngkaHitung nilai={n} /></span>
          <span className={styles.angkaKet}>dari {peserta} peserta</span>
        </div>
      </div>
    </Kartu>
  );
}

function KartuNilai({ kode, data, ikon: Ikon }) {
  const p = tanya(kode);
  const v = data?.nilai?.[kode];
  return (
    <Kartu className={styles.angka} naik>
      <span className={styles.angkaLabel}><Ikon size={16} weight="fill" aria-hidden="true" /> {p.ringkas}</span>
      {v ? (
        <>
          <div className={styles.angkaBaris}>
            <span className={styles.angkaBesar}><AngkaHitung nilai={v.rata} digit={1} /></span>
            <span className={styles.angkaKet}>dari 10</span>
          </div>
          <Bar pct={v.rata * 10} warna="var(--fm-emas)" />
          <span className={styles.angkaKet}>rata-rata {v.n} jawaban</span>
        </>
      ) : (
        <span className={styles.angkaKet}>Tampil setelah rekap terbuka.</span>
      )}
    </Kartu>
  );
}

// Inti "dampak": apa yang ingin dilakukan pegawai setelah membaca laporannya.
function Rencana({ data }) {
  const p = tanya("rencana");
  const r = data.pilihan?.rencana;
  const daftar = useMemo(() => opsiUmpanBalik(p).map((o) => ({ opsi: o, jumlah: r?.opsi?.[o] ?? 0 })), [p, r]);
  const lainnya = data.lainnya?.rencana || [];
  if (!r) return null;
  const teratas = [...daftar].filter((x) => x.opsi !== "Belum tahu" && x.opsi !== OPSI_LAINNYA).sort((a, b) => b.jumlah - a.jumlah)[0];
  return (
    <section data-tur="dampak-rencana">
      <JudulBagian keterangan={`Dari ${r.n} pegawai yang menjawab. Satu orang boleh memilih lebih dari satu.`}>Setelah membaca laporan, pegawai ingin…</JudulBagian>
      <Kartu className={styles.rencana}>
        {teratas?.jumlah > 0 && (
          <div className={styles.rencanaSorot}>
            <Footprints size={28} weight="fill" aria-hidden="true" />
            <p><b>{formatAngka((teratas.jumlah / r.n) * 100, 0)}%</b> pegawai ingin <b>{teratas.opsi.charAt(0).toLowerCase() + teratas.opsi.slice(1)}</b>.</p>
          </div>
        )}
        <Bertahap className={styles.rencanaDaftar} jeda={0.06}>
          {daftar.map((x, i) => {
            const pct = r.n ? (x.jumlah / r.n) * 100 : 0;
            const netral = x.opsi === "Belum tahu";
            return (
              <Muncul key={x.opsi} className={styles.rencanaBaris}>
                <span className={styles.rencanaTeks}>{x.opsi}</span>
                <Bar pct={pct} warna={netral ? "var(--wa-netral)" : "var(--fm-ungu)"} tunda={0.1 + i * 0.06} />
                <span className={styles.rencanaAngka}><b>{formatAngka(pct, 0)}%</b> {x.jumlah} orang</span>
              </Muncul>
            );
          })}
        </Bertahap>
        {lainnya.length > 0 && (
          <div className={styles.lainnya}>
            <span className={styles.angkaLabel}>Ditulis sendiri lewat "Lainnya"</span>
            <div className={styles.lainnyaDaftar}>
              {lainnya.slice(0, 12).map((x, i) => <span key={`${x.pada}-${i}`} className={styles.lainnyaSatu}>{x.teks}</span>)}
            </div>
          </div>
        )}
      </Kartu>
    </section>
  );
}

function PilihanTunggal({ kode, data, tur }) {
  const p = tanya(kode);
  const r = data.pilihan?.[kode];
  if (!r) return null;
  const segmen = p.opsi.map((o, i) => ({ kunci: o, label: o, jumlah: r.opsi?.[o] ?? 0, warna: WARNA_SKALA[Math.min(i, WARNA_SKALA.length - 1)] }));
  const pertama = segmen[0];
  return (
    <Kartu className={styles.tunggal} data-tur={tur} naik>
      <span className={styles.angkaLabel}>{p.ringkas}</span>
      <p className={styles.tunggalSorot}><b>{formatAngka(r.n ? (pertama.jumlah / r.n) * 100 : 0, 0)}%</b> menjawab "{pertama.label}"</p>
      <BarTumpuk segmen={segmen} total={r.n} tebal={14} satuan="orang" label={p.ringkas} />
      <Legenda segmen={segmen} total={r.n} satuan="orang" kecil />
    </Kartu>
  );
}

function SebaranNilai({ data }) {
  const daftar = PERTANYAAN_UMPAN_BALIK.filter((p) => p.jenis === "nilai" && data.nilai?.[p.kode]);
  if (!daftar.length) return null;
  return (
    <section>
      <JudulBagian keterangan="Banyaknya pegawai di tiap nilai, 1 sampai 10. Arahkan kursor ke batang untuk jumlahnya.">Sebaran nilai</JudulBagian>
      <Grid kolom={4}>
        {daftar.map((p) => {
          const v = data.nilai[p.kode];
          const maks = Math.max(1, ...v.sebaran);
          return (
            <Kartu key={p.kode} className={styles.sebaran} naik>
              <span className={styles.angkaLabel}>{p.ringkas}</span>
              <div className={styles.histogram} role="img" aria-label={`${p.ringkas}: ${v.sebaran.map((j, i) => `nilai ${i + 1} ${j} orang`).join(", ")}`}>
                {v.sebaran.map((j, i) => (
                  <span key={i} className={styles.histKolom} title={`Nilai ${i + 1}: ${j} orang`}>
                    <motion.span
                      className={styles.histBatang}
                      style={{ background: i >= 7 ? "var(--fm-hijau)" : i >= 4 ? "var(--wa-kuning)" : "var(--fm-jingga)" }}
                      initial={{ height: 0 }}
                      animate={{ height: `${(j / maks) * 100}%` }}
                      transition={{ duration: 0.6, ease: EASE, delay: 0.05 * i }}
                    />
                    <span className={styles.histLabel}>{i + 1}</span>
                  </span>
                ))}
              </div>
              <span className={styles.angkaKet}>Rata-rata {formatAngka(v.rata, 1)} dari {v.n} jawaban</span>
            </Kartu>
          );
        })}
      </Grid>
    </section>
  );
}

const PER_HALAMAN = 6;

function Esai({ data }) {
  const daftar = PERTANYAAN_UMPAN_BALIK.filter((p) => p.jenis === "esai");
  return (
    <section data-tur="dampak-esai">
      <JudulBagian keterangan="Ditulis pegawai apa adanya, tanpa nama, terbaru di atas.">Kata pegawai</JudulBagian>
      <div className={styles.duaKolom}>
        {daftar.map((p) => <KolomEsai key={p.kode} p={p} isi={data.esai?.[p.kode] || []} />)}
      </div>
    </section>
  );
}

function KolomEsai({ p, isi }) {
  const [batas, setBatas] = useState(PER_HALAMAN);
  return (
    <Kartu className={styles.esai}>
      <span className={styles.esaiJudul}><ChatCenteredText size={18} weight="fill" aria-hidden="true" /> {p.ringkas} <small>{isi.length}</small></span>
      {isi.length === 0 ? (
        <p className={styles.angkaKet}>Belum ada jawaban.</p>
      ) : (
        <div className={styles.esaiDaftar}>
          <AnimatePresence initial={false}>
            {isi.slice(0, batas).map((e, i) => (
              <motion.blockquote
                key={`${e.pada}-${i}`}
                className={styles.esaiSatu}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.04 }}
                layout
              >
                <TeksLipat baris={4}>{e.teks}</TeksLipat>
                <span>{relatif(e.pada)}</span>
              </motion.blockquote>
            ))}
          </AnimatePresence>
          {isi.length > batas && (
            <Tombol varian="lembut" onClick={() => setBatas((b) => b + PER_HALAMAN)}>Tampilkan {Math.min(PER_HALAMAN, isi.length - batas)} lagi</Tombol>
          )}
        </div>
      )}
    </Kartu>
  );
}

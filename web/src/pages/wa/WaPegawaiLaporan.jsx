// Laporan individu Wellbeing Assessment untuk pegawai (desain M1 sampai M6), mobile-first.
// Empat bagian lewat lembar menu bawah: Ringkasan, Aspek Kuat, Perlu Penguatan, Refleksi Saya.
// Sebelum apa pun tampil, pegawai melewati dialog sambutan wajib (WaSambutan).
//
// Narasi pribadi dan respons cerita hanya tampil jika barisnya ada di dataset; di Supabase, RLS
// hanya mengembalikan baris yang sudah disetujui. Respons cerita yang belum disetujui tampil sebagai
// kartu "sedang disiapkan", tidak pernah sebagai draf.
//
// Panduan (WaTur) terbuka sendiri setelah sambutan pada kunjungan pertama di perangkat ini, dan
// bisa dibuka lagi dari tombol kompas di bilah atas atau dari Menu.

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  ArrowRight, CaretRight, ChartBar, ChatCircleText, CheckCircle, Circle, ClipboardText, ClockCounterClockwise, Compass, Footprints, Heart, HourglassMedium, Info, Plant,
  Lightbulb, LockKey, Question, Quotes, SignOut, SquaresFour, Star, ThumbsDown,
} from "@phosphor-icons/react";
import SampleTag from "../../components/SampleTag";
import {
  ASPEK, DIMENSI_KEPUASAN, JUDUL_TAB_WELLBEING, KALIMAT_BUKAN_DIAGNOSIS, PERTANYAAN_PILIHAN, PERTANYAAN_TERBUKA,
  infoAspek, infoDimensi, infoKategoriProtek,
} from "./lib/waMeta";
import {
  formatHari, formatPersen, itemKategori, keteranganPembaruan, lengkapiItem, namaDepan, narasiUntuk, pisahPilihan, tanggalPembaruan, urutItem,
} from "./lib/waAturan";
import { IKON_DIMENSI, IKON_PILIHAN } from "./waIkon";
import { KartuSkorKepuasan, KartuSkorWellbeing } from "./WaBagian";
import { IlustrasiHati } from "./WaIlustrasi";
import WaSambutan from "./WaSambutan";
import WaUmpanBalik from "./WaUmpanBalik";
import WaTur from "./WaTur";
import { langkahPegawai } from "./lib/waTur";
import { sudahDilihat, tandaiDilihat } from "./waSimpanan";
import {
  AngkaHitung, Bar, Bertahap, Donat, Kartu, KeadaanKosong, LembarBawah, Lencana, Muncul, Petunjuk, TeksLipat, TombolTeks,
} from "./WaUi";
import { EASE } from "./waGerak";
import swTokens from "../sw/swTokens.module.css";
import tokens from "./waTokens.module.css";
import styles from "./WaPegawaiLaporan.module.css";

const BAGIAN = [
  { id: "ringkasan", label: "Ringkasan", ikon: ChartBar },
  { id: "kuat", label: "Aspek Kuat", ikon: Heart },
  { id: "perlu", label: "Perlu Penguatan", ikon: ThumbsDown },
  { id: "refleksi", label: "Refleksi Saya", ikon: ChatCircleText },
  { id: "umpan", label: "Umpan Balik", ikon: Star },
];

/**
 * @param onLogout       keluar dari akun (produksi); tidak ada di pratinjau
 * @param onKeScreening  pindah ke laporan Screening Awal Wellbeing jika akun ini juga tertaut ke sana
 */
export default function WaPegawaiLaporan({ dataset, akses, onLogout, onKeScreening, umpanBalik }) {
  const orang = useMemo(() => dataset?.individu?.find((o) => o.id === akses?.individuId) || null, [dataset, akses]);
  const [sambutan, setSambutan] = useState("wajib");
  const [bagian, setBagian] = useState("ringkasan");
  const [menu, setMenu] = useState(false);
  const [semua, setSemua] = useState(null);
  const [aspekBuka, setAspekBuka] = useState(null);
  const [tur, setTur] = useState(false);
  const kunciTur = `panduan-pegawai-${akses?.individuId || ""}`;
  const langkahTur = useMemo(() => langkahPegawai(), []);
  const pembaruan = useMemo(() => tanggalPembaruan(dataset), [dataset]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [bagian]);

  // Dialog bawaan browser berada di lapisan paling atas sampai animasi tutupnya selesai, jadi
  // panduan baru dibuka setelah jeda singkat supaya tidak tertutup dialog yang sedang menutup.
  const bukaTur = useCallback(() => {
    setMenu(false);
    setTimeout(() => setTur(true), 450);
  }, []);

  const tutupTur = useCallback(() => {
    setTur(false);
    setBagian("ringkasan");
    tandaiDilihat(kunciTur);
  }, [kunciTur]);

  if (!orang) {
    return (
      <div className={`${swTokens.scope} ${tokens.scope} ${styles.halaman}`}>
        <KeadaanKosong judul="Hasil Anda belum ditemukan" pesan="Hubungi tim Fammi agar akun ini dihubungkan dengan isian Anda." />
      </div>
    );
  }

  const narasi = narasiUntuk(dataset, "individu", orang.id);
  const respons = narasiUntuk(dataset, "respons_cerita", orang.id);
  const items = lengkapiItem(orang.protek.item, dataset.item);
  const ctx = { orang, narasi, respons, items, umpanBalik, keBagian: setBagian, bukaSemua: setSemua, bukaAspek: setAspekBuka };
  const pindah = (id) => { setBagian(id); setMenu(false); };

  return (
    <MotionConfig reducedMotion="user">
      <div className={`${swTokens.scope} ${tokens.scope} ${styles.halaman}`}>
        <header className={styles.bilah} data-tur-lekat>
          <span className={styles.logo}>
            <img src="/logo-purple.png" alt="Fammi" />
            {dataset.meta.contoh && <SampleTag />}
          </span>
          <span className={styles.bilahKanan}>
          <motion.button type="button" className={styles.tombolPanduan} onClick={bukaTur} whileTap={{ scale: 0.9 }} whileHover={{ y: -1 }} aria-label="Panduan membaca laporan" title="Panduan membaca laporan">
            <Compass size={20} weight="fill" aria-hidden="true" />
          </motion.button>
          <motion.button type="button" className={styles.tombolMenu} data-tur="menu" onClick={() => setMenu(true)} whileTap={{ scale: 0.92 }} whileHover={{ y: -1 }} aria-haspopup="dialog">
            <SquaresFour size={20} weight="regular" aria-hidden="true" /> Menu
          </motion.button>
          </span>
        </header>

        <motion.div className={styles.sapa} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p>Halo, <b>{namaDepan(orang.nama)}</b></p>
          <span>{BAGIAN.find((b) => b.id === bagian)?.label}</span>
        </motion.div>
        {pembaruan.terakhir && (
          <motion.div className={styles.diperbarui} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Petunjuk teks={keteranganPembaruan(pembaruan)}>
              <span className={styles.diperbaruiIsi}>
                <ClockCounterClockwise size={14} weight="bold" aria-hidden="true" />
                Diperbarui {formatHari(pembaruan.terakhir)}
              </span>
            </Petunjuk>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.main
            key={bagian}
            className={styles.isi}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.32, ease: EASE }}
          >
            {bagian === "ringkasan" && <BagianRingkasan {...ctx} />}
            {bagian === "kuat" && <BagianKuat {...ctx} />}
            {bagian === "perlu" && <BagianPerlu {...ctx} />}
            {bagian === "refleksi" && <BagianRefleksi {...ctx} />}
            {bagian === "umpan" && <WaUmpanBalik umpan={umpanBalik} />}
          </motion.main>
        </AnimatePresence>

        <p className={styles.kaki}>{KALIMAT_BUKAN_DIAGNOSIS}</p>

        <LembarBawah buka={menu} onTutup={() => setMenu(false)} judul="Menu laporan">
          <Bertahap className={styles.menuUbin} jeda={0.05}>
            {BAGIAN.map((b) => {
              const aktif = b.id === bagian;
              return (
                <motion.button
                  key={b.id}
                  type="button"
                  className={`${styles.menuSatu} ${aktif ? styles.menuAktif : ""}`}
                  variants={{ awal: { opacity: 0, scale: 0.9 }, tampil: { opacity: 1, scale: 1 } }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => pindah(b.id)}
                  aria-current={aktif ? "page" : undefined}
                >
                  <b.ikon size={30} weight="fill" aria-hidden="true" />
                  {b.label}
                </motion.button>
              );
            })}
          </Bertahap>
          <motion.button type="button" className={styles.menuTentang} whileTap={{ scale: 0.97 }} onClick={bukaTur}>
            <Compass size={18} weight="fill" aria-hidden="true" /> Panduan membaca laporan
          </motion.button>
          <motion.button type="button" className={styles.menuTentang} whileTap={{ scale: 0.97 }} onClick={() => { setMenu(false); setSambutan("ulang"); }}>
            <Info size={18} weight="fill" aria-hidden="true" /> Tentang asesmen ini dan mengapa Anda diundang
          </motion.button>
          {onKeScreening && (
            <motion.button type="button" className={styles.menuLain} whileTap={{ scale: 0.97 }} onClick={() => { setMenu(false); onKeScreening(); }}>
              <ClipboardText size={18} weight="fill" aria-hidden="true" /> Lihat hasil Screening Awal Wellbeing
            </motion.button>
          )}
          {onLogout && (
            <motion.button type="button" className={styles.menuLain} whileTap={{ scale: 0.97 }} onClick={onLogout}>
              <SignOut size={18} weight="bold" aria-hidden="true" /> Keluar
            </motion.button>
          )}
        </LembarBawah>

        <LembarBawah
          buka={Boolean(semua)}
          onTutup={() => setSemua(null)}
          judul="Semua pernyataan"
          kepala={semua && <KepalaTop jenis={semua} />}
        >
          {semua && <DaftarItem items={semua === "kuat" ? itemKategori(items, "kuat") : lemahAtauCukup(items)} jenis={semua} />}
        </LembarBawah>

        <LembarBawah
          buka={Boolean(aspekBuka)}
          onTutup={() => setAspekBuka(null)}
          judul={infoAspek(aspekBuka)?.label || "Penjelasan aspek"}
          kepala={aspekBuka && <KepalaAspek kunci={aspekBuka} nilai={orang.protek.aspek[aspekBuka]} />}
        >
          {aspekBuka && <IsiAspek kunci={aspekBuka} items={items} narasi={narasi?.aspek?.[aspekBuka]} />}
        </LembarBawah>

        <WaSambutan
          buka={sambutan !== "selesai"}
          terkunci={sambutan === "wajib"}
          onSelesai={() => {
            const pertama = sambutan === "wajib";
            setSambutan("selesai");
            if (pertama && !sudahDilihat(kunciTur)) bukaTur();
          }}
          nama={orang.nama}
          lembaga={dataset.meta.lembaga}
          nPeserta={dataset.meta.nDipakai}
        />

        {tur && <WaTur langkah={langkahTur} onBagian={setBagian} onTutup={tutupTur} judul="Panduan" />}
      </div>
    </MotionConfig>
  );
}

function lemahAtauCukup(items) {
  const perlu = itemKategori(items, "perlu");
  return perlu.length ? perlu : itemKategori(items, "cukup");
}

// ── Ringkasan ───────────────────────────────────────────────────────────────────────────────

function BagianRingkasan({ orang, narasi, respons, items, umpanBalik, keBagian, bukaSemua, bukaAspek }) {
  const { protek, kepuasan } = orang;
  const kuat = itemKategori(items, "kuat");
  const perlu = itemKategori(items, "perlu");
  return (
    <Bertahap className={styles.tumpuk}>
      <KartuSkorWellbeing ringkas judul={`Skor ${JUDUL_TAB_WELLBEING} Anda`} pct={protek.pct} kategori={protek.kategori} narasi={narasi?.ringkasan?.wellbeing} kosong="Penjelasan untuk Anda sedang disiapkan." />
      <KartuSkorKepuasan ringkas judul="Skor Rata-rata Kepuasan Kerja" rata={kepuasan.rata} kategori5={kepuasan.kategori5} bintang={kepuasan.bintang} narasi={narasi?.ringkasan?.kepuasan} kosong="Penjelasan untuk Anda sedang disiapkan." />

      <JudulKecil>Detail {JUDUL_TAB_WELLBEING} Anda</JudulKecil>
      <Kartu className={styles.kartuDaftar} data-tur="aspek">
        {ASPEK.map((a, i) => {
          const v = protek.aspek[a.kunci];
          const rendah = v.kategori !== "baik";
          return (
            <BarisAspekKlik key={a.kunci} aspek={a} onClick={() => bukaAspek(a.kunci)}>
              <Lencana ukuran={34}>{a.huruf}</Lencana>
              <div className={styles.barisAspekIsi}>
                <span className={styles.barisAspekAtas}>
                  <span>{a.label}</span>
                  <b style={{ color: rendah ? "var(--fm-jingga)" : "var(--fm-ungu-tua)" }}><AngkaHitung nilai={v.pct} akhiran="%" /></b>
                </span>
                <Bar pct={v.pct} warna={rendah ? "var(--fm-jingga)" : "var(--fm-ungu-sedang)"} tunda={0.1 + i * 0.07} />
              </div>
            </BarisAspekKlik>
          );
        })}
        <p className={styles.ketukAspek}>Ketuk satu aspek untuk membaca artinya bagi Anda dan yang bisa dilakukan.</p>
        <PlusMinusKecil tur="aspek-catatan" plus={narasi?.wellbeing?.hal_kuat} minus={narasi?.wellbeing?.hal_tantangan} />
      </Kartu>

      <JudulKecil>Detail Kepuasan Kerja Anda</JudulKecil>
      <div className={styles.gridDua} data-tur="dimensi">
        {DIMENSI_KEPUASAN.map((d, i) => {
          const v = kepuasan.dimensi[d.kunci];
          const Ikon = IKON_DIMENSI[d.kunci];
          const rendah = d.kunci === kepuasan.dimensiTerendah;
          const warna = rendah ? "var(--fm-jingga)" : "var(--fm-ungu-sedang)";
          return (
            <Kartu key={d.kunci} className={styles.dimensi}>
              <div className={styles.dimensiAtas}>
                <Donat nilai={v.rata} maks={5} ukuran={52} tebal={7} warna={warna} tunda={0.1 + i * 0.06} label={`${d.label} ${v.rata} dari 5`}>
                  <Ikon size={17} weight="fill" style={{ color: "var(--fm-ungu-tua)" }} aria-hidden="true" />
                </Donat>
                <span className={styles.dimensiAngka} style={{ color: warna }}><AngkaHitung nilai={v.rata} digit={1} /><small>/5</small></span>
              </div>
              <span className={styles.dimensiLabel}>{d.baris[0]}<br />{d.baris[1]}</span>
            </Kartu>
          );
        })}
      </div>
      <Kartu className={styles.kartuDaftar}>
        <PlusMinusKecil plus={narasi?.kepuasan?.hal_kuat} minus={narasi?.kepuasan?.hal_tantangan} />
      </Kartu>

      <JudulKecil>Detail Aspek {JUDUL_TAB_WELLBEING} Anda</JudulKecil>
      <KartuTop jenis="kuat" items={urutItem(items, "turun", 3)} total={`Total ${kuat.length} Aspek Sudah Kuat`} onSemua={() => bukaSemua("kuat")} />
      <KartuTop
        jenis="perlu"
        items={urutItem(items, "naik", 3)}
        total={perlu.length ? `Total ${perlu.length} Aspek Perlu Penguatan` : "Semua di atas ambang"}
        onSemua={() => bukaSemua("perlu")}
      />

      <KartuPesan respons={respons} onBuka={() => keBagian("refleksi")} />
      <KartuAjakUmpan umpan={umpanBalik} onBuka={() => keBagian("umpan")} />
    </Bertahap>
  );
}

// ── Penjelasan per aspek ────────────────────────────────────────────────────────────────────
// Tiap aspek PROTEK bisa diketuk dan membuka lembar: arti aspek secara umum, "Artinya untuk Anda"
// dan "Yang bisa dilakukan" (narasi.aspek[kunci], ditulis per orang dan disetujui seperti narasi
// lain), lalu tujuh pernyataan aspek itu. Narasi berlaku untuk keenam aspek, kuat maupun lemah
// (keputusan pemilik produk 2026-10-19: setiap orang butuh penjelasan atas hasilnya sendiri).

function BarisAspekKlik({ aspek, onClick, children }) {
  return (
    <motion.button
      type="button"
      className={`${styles.barisAspek} ${styles.barisAspekKlik}`}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      aria-label={`${aspek.label}, buka penjelasan`}
    >
      {children}
      <CaretRight size={16} weight="bold" className={styles.barisAspekPanah} aria-hidden="true" />
    </motion.button>
  );
}

function KepalaAspek({ kunci, nilai }) {
  const a = infoAspek(kunci);
  const kat = infoKategoriProtek(nilai?.kategori);
  return (
    <span className={styles.aspekKepala}>
      <Lencana ukuran={40}>{a.huruf}</Lencana>
      <span>
        <span className={styles.aspekKepalaJudul}>{a.label}</span>
        <span className={styles.aspekKepalaNilai}>
          <b>{formatPersen(nilai?.pct)}</b>
          {kat && <span className={styles.aspekKategori} style={{ "--w": kat.warnaTeks || kat.warna }}>{kat.label}</span>}
        </span>
      </span>
    </span>
  );
}

function IsiAspek({ kunci, items, narasi }) {
  const a = infoAspek(kunci);
  const daftar = urutItem(items.filter((x) => x.aspek === kunci), "turun");
  return (
    <Bertahap className={styles.aspekIsi} jeda={0.07}>
      <Muncul as="p" className={styles.aspekUmum}>{a.arti}</Muncul>
      <Muncul className={`${styles.aspekBlok} ${styles.aspekBlokArti}`}>
        <span className={styles.aspekLabel}><Lightbulb size={16} weight="fill" aria-hidden="true" /> Artinya untuk Anda</span>
        <p className={narasi?.arti ? "" : styles.redup}>{narasi?.arti || "Penjelasan untuk aspek ini sedang disiapkan."}</p>
      </Muncul>
      <Muncul className={`${styles.aspekBlok} ${styles.aspekBlokLangkah}`}>
        <span className={styles.aspekLabel}><Footprints size={16} weight="fill" aria-hidden="true" /> Yang bisa dilakukan</span>
        <p className={narasi?.langkah ? "" : styles.redup}>{narasi?.langkah || "Saran untuk aspek ini sedang disiapkan."}</p>
      </Muncul>
      <Muncul as="h3" className={styles.aspekSubjudul}>Tujuh pernyataan di aspek ini</Muncul>
      <DaftarItem items={daftar} jenis="aspek" />
    </Bertahap>
  );
}

function JudulKecil({ children }) {
  return <Muncul as="h2" className={styles.judulKecil}>{children}</Muncul>;
}

function PlusMinusKecil({ plus, minus, tur }) {
  return (
    <div className={styles.plusMinus} data-tur={tur}>
      <p><span className={styles.tandaPlus} aria-hidden="true">+</span>{plus || <i className={styles.redup}>Narasi sedang disiapkan.</i>}</p>
      <p><span className={styles.tandaMinus} aria-hidden="true">−</span>{minus || <i className={styles.redup}>Narasi sedang disiapkan.</i>}</p>
    </div>
  );
}

function KepalaTop({ jenis }) {
  const kuat = jenis === "kuat";
  return (
    <span className={styles.topKepala} style={{ "--w": kuat ? "var(--fm-ungu)" : "var(--fm-jingga)" }}>
      <span className={styles.topLencana}><span aria-hidden="true">−</span> TOP 3</span>
      <span className={styles.topJudul}>Aspek {JUDUL_TAB_WELLBEING}<br />{kuat ? "yang Sudah Kuat" : "yang Perlu Penguatan"}</span>
    </span>
  );
}

function KartuTop({ jenis, items, total, onSemua }) {
  const kuat = jenis === "kuat";
  const warna = kuat ? "var(--fm-ungu-sedang)" : "var(--fm-jingga)";
  return (
    <Kartu className={styles.top} data-tur={kuat ? "top-kuat" : "top-perlu"}>
      <KepalaTop jenis={jenis} />
      <DaftarItem items={items} jenis={jenis} />
      <div className={styles.topKaki}>
        <span className={`${styles.topTotal} ${kuat ? styles.topTotalKuat : styles.topTotalPerlu}`}>{total}</span>
        <TombolTeks warna={warna} onClick={onSemua}>Lihat Semua</TombolTeks>
      </div>
    </Kartu>
  );
}

// Bar perlu penguatan hanya jingga untuk butir yang memang di bawah ambang. Butir yang tampil di
// daftar ini sekadar karena relatif paling rendah tetap ungu lembut, supaya tidak terbaca sebagai
// peringatan.
function warnaItem(it, jenis) {
  if (jenis === "kuat") return "var(--fm-ungu-sedang)";
  if (jenis === "aspek" && it.kategori === "kuat") return "var(--fm-ungu-sedang)";
  return it.kategori === "perlu" ? "var(--fm-jingga)" : "var(--wa-ungu-lembut)";
}

function DaftarItem({ items, jenis }) {
  if (!items.length) return <KeadaanKosong kecil judul="Belum ada pernyataan di sini" />;
  return (
    <Bertahap className={styles.daftarItem} jeda={0.05}>
      {items.map((it, i) => (
        <Muncul key={it.kode} className={styles.barisItem}>
          {/* Teks singkat berarah positif. Separuh butir PROTEK berbunyi negatif dan skornya sudah dibalik,
              jadi menampilkan kalimat aslinya di samping persen tinggi akan terbaca terbalik. */}
          <p>{it.teks}</p>
          <div className={styles.barisItemBar}>
            <b style={{ color: warnaItem(it, jenis) === "var(--wa-ungu-lembut)" ? "var(--fm-ungu)" : warnaItem(it, jenis) }}>{formatPersen(it.pct)}</b>
            <Bar pct={it.pct} warna={warnaItem(it, jenis)} tunda={0.1 + Math.min(i, 10) * 0.05} />
          </div>
        </Muncul>
      ))}
    </Bertahap>
  );
}

function KartuPesan({ respons, onBuka }) {
  if (respons && !respons.ada) return null;
  return (
    <Kartu className={styles.pesanTeaser} data-tur="pesan" onClick={onBuka} label="Buka tanggapan untuk cerita Anda">
      <motion.span className={styles.pesanIkon} animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.2, repeat: Infinity }}>
        <ChatCircleText size={24} weight="fill" aria-hidden="true" />
      </motion.span>
      <span>
        <b>{respons ? "Ada tanggapan untuk cerita Anda" : "Tanggapan untuk cerita Anda sedang disiapkan"}</b>
        <small>{respons ? "Ditulis setelah membaca cerita yang Anda tulis saat mengisi." : "Tanggapannya masih ditinjau sebelum ditampilkan."}</small>
      </span>
      <ArrowRight size={18} weight="bold" aria-hidden="true" />
    </Kartu>
  );
}

// Ajakan mengisi umpan balik di akhir Ringkasan; setelah terkirim berubah jadi ucapan terima kasih.
function KartuAjakUmpan({ umpan, onBuka }) {
  if (!umpan?.tersedia) return null;
  const sudah = Boolean(umpan.dikirimPada);
  return (
    <Kartu className={`${styles.ajakUmpan} ${sudah ? styles.ajakUmpanSudah : ""}`} data-tur="umpan-ajak" onClick={onBuka} label={sudah ? "Lihat umpan balik Anda" : "Isi umpan balik"}>
      <motion.span className={styles.ajakUmpanIkon} animate={sudah ? {} : { rotate: [0, -10, 10, 0] }} transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2 }}>
        {sudah ? <CheckCircle size={24} weight="fill" aria-hidden="true" /> : <Star size={24} weight="fill" aria-hidden="true" />}
      </motion.span>
      <span>
        <b>{sudah ? "Terima kasih atas umpan balik Anda" : "Bagaimana pengalaman Anda?"}</b>
        <small>{sudah ? "Jawaban bisa diubah kapan saja." : "Beri nilai laporan ini, sekitar dua menit."}</small>
      </span>
      <ArrowRight size={18} weight="bold" aria-hidden="true" />
    </Kartu>
  );
}

// ── Aspek kuat dan perlu penguatan ──────────────────────────────────────────────────────────

function BagianKuat({ orang, items, bukaAspek }) {
  const urut = [...ASPEK].sort((a, b) => orang.protek.aspek[b.kunci].pct - orang.protek.aspek[a.kunci].pct);
  const kuat = itemKategori(items, "kuat");
  const teratas = infoAspek(orang.protek.aspekTertinggi);
  return (
    <Bertahap className={styles.tumpuk}>
      <Kartu className={styles.pembuka} style={{ "--w": "var(--fm-ungu)" }}>
        <IlustrasiHati ukuran={96} />
        <div>
          <h2>Aspek Anda dari yang tertinggi</h2>
          <p>{teratas ? `Skor tertinggi Anda ada di ${teratas.label}. ` : ""}Di bawah ini enam aspek diurutkan dari skor tertinggi, lalu daftar pernyataan dengan skor 5 atau 6.</p>
        </div>
      </Kartu>
      <JudulKecil>Urutan enam aspek Anda</JudulKecil>
      <Kartu className={styles.kartuDaftar}>
        {urut.map((a, i) => {
          const v = orang.protek.aspek[a.kunci];
          return (
            <BarisAspekKlik key={a.kunci} aspek={a} onClick={() => bukaAspek(a.kunci)}>
              <Lencana ukuran={34} warna={i < 3 ? "var(--fm-ungu)" : "var(--fm-ungu-tua)"}>{a.huruf}</Lencana>
              <div className={styles.barisAspekIsi}>
                <span className={styles.barisAspekAtas}><span>{a.label}</span><b>{formatPersen(v.pct)}</b></span>
                <Bar pct={v.pct} warna={i < 3 ? "var(--fm-ungu)" : "var(--wa-ungu-lembut)"} tunda={0.1 + i * 0.07} />
              </div>
            </BarisAspekKlik>
          );
        })}
        <p className={styles.ketukAspek}>Ketuk satu aspek untuk membaca artinya bagi Anda dan yang bisa dilakukan.</p>
      </Kartu>
      <JudulKecil>{kuat.length} pernyataan yang sudah kuat</JudulKecil>
      <Kartu className={styles.top}><DaftarItem items={kuat} jenis="kuat" /></Kartu>
    </Bertahap>
  );
}

function BagianPerlu({ orang, narasi, items, bukaAspek }) {
  const perlu = itemKategori(items, "perlu");
  const tampil = perlu.length ? perlu : urutItem(items, "naik", 3);
  const terendah = infoAspek(orang.protek.aspekTerendah);
  return (
    <Bertahap className={styles.tumpuk}>
      <Kartu className={styles.pembuka} style={{ "--w": "var(--fm-jingga)" }}>
        <motion.span className={styles.pembukaIkon} animate={{ rotate: [-6, 6, -6] }} transition={{ duration: 3, repeat: Infinity }}>
          <Plant size={44} weight="fill" aria-hidden="true" />
        </motion.span>
        <div>
          <h2>Yang bisa dikuatkan</h2>
          <p>Daftar ini berisi pernyataan dengan skor terendah Anda.{terendah ? ` Aspek dengan skor paling rendah saat ini: ${terendah.label}.` : ""}</p>
        </div>
      </Kartu>
      {narasi?.wellbeing?.hal_tantangan && (
        <Kartu className={styles.kutipBesar}>
          <p>{narasi.wellbeing.hal_tantangan}</p>
        </Kartu>
      )}
      {terendah && (
        <Kartu className={styles.bukaAspek} onClick={() => bukaAspek(terendah.kunci)} label={`Buka penjelasan ${terendah.label}`}>
          <Lencana ukuran={36}>{terendah.huruf}</Lencana>
          <span>
            <b>Apa artinya untuk Anda?</b>
            <small>Baca penjelasan {terendah.label} dan yang bisa dilakukan.</small>
          </span>
          <CaretRight size={18} weight="bold" aria-hidden="true" />
        </Kartu>
      )}
      <JudulKecil>{perlu.length ? `${perlu.length} pernyataan yang bisa dikuatkan` : "Tiga pernyataan dengan skor paling rendah"}</JudulKecil>
      {!perlu.length && (
        <Kartu className={styles.kabarBaik}>
          <CheckCircle size={22} weight="fill" aria-hidden="true" />
          <span>Semua skor pernyataan Anda 4 ke atas. Tiga pernyataan di bawah ini yang paling rendah di antaranya.</span>
        </Kartu>
      )}
      <Kartu className={styles.top}><DaftarItem items={tampil} jenis="perlu" /></Kartu>
    </Bertahap>
  );
}

// ── Refleksi ────────────────────────────────────────────────────────────────────────────────

function BagianRefleksi({ orang, narasi, respons }) {
  const [dicoba, setDicoba] = useState({});
  const langkah = narasi?.langkah_kecil || [];
  const jawaban = PERTANYAAN_TERBUKA
    .map((p) => ({ ...p, isi: (orang.testimoni || []).find((t) => t.pertanyaan === p.kode)?.jawaban }))
    .filter((p) => p.isi);
  return (
    <Bertahap className={styles.tumpuk}>
      {narasi?.refleksi && (
        <Kartu className={styles.refleksi} data-tur="refleksi-tanya">
          <Question size={26} weight="fill" aria-hidden="true" />
          <p>{narasi.refleksi}</p>
        </Kartu>
      )}

      <div className={styles.tumpuk} data-tur="refleksi-pilihan">
      {PERTANYAAN_PILIHAN.map((p) => {
        const Ikon = IKON_PILIHAN[p.kode];
        const { utama, netral } = pisahPilihan(orang.pilihan[p.kode] || []);
        const isi = [...utama, ...netral];
        return (
          <Kartu key={p.kode} className={styles.pilihan}>
            <Ikon size={24} weight="fill" className={styles.pilihanIkon} aria-hidden="true" />
            <div className={styles.pilihanIsi}>
              <span className={styles.pilihanJudul} style={{ background: p.warna === "var(--fm-ungu)" ? "var(--wa-ungu-lembut)" : p.warna, color: p.warna === "var(--fm-hijau)" || p.warna === "var(--fm-jingga)" ? "#ffffff" : "#222222" }}>
                {p.judulSaya}
              </span>
              {isi.length ? isi.map((x) => <span key={x} className={styles.pilihanJawab}>{x}</span>) : <span className={styles.pilihanJawab}>-</span>}
            </div>
          </Kartu>
        );
      })}
      </div>

      {langkah.length > 0 && (
        <div className={styles.tumpuk} data-tur="langkah">
          <JudulKecil>Langkah kecil yang bisa dicoba</JudulKecil>
          {langkah.map((l, i) => {
            const sudah = Boolean(dicoba[i]);
            return (
              <Kartu key={l.judul} className={`${styles.langkah} ${sudah ? styles.langkahSudah : ""}`} onClick={() => setDicoba((d) => ({ ...d, [i]: !d[i] }))} label={`${l.judul}, tandai ${sudah ? "belum" : "akan dicoba"}`}>
                <motion.span className={styles.langkahCek} animate={{ scale: sudah ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.3 }}>
                  {sudah ? <CheckCircle size={26} weight="fill" /> : <Circle size={26} weight="regular" />}
                </motion.span>
                <span className={styles.langkahIsi}>
                  <span className={styles.langkahJangka}><Footprints size={13} weight="fill" aria-hidden="true" /> {l.jangka}</span>
                  <b>{l.judul}</b>
                  <small>{l.alasan}</small>
                  {l.terkait && <span className={styles.langkahTerkait}>{infoAspek(l.terkait)?.label || infoDimensi(l.terkait)?.label || ""}</span>}
                </span>
              </Kartu>
            );
          })}
          <p className={styles.catatanKecil}>Tanda centang hanya membantu Anda di layar ini dan tidak disimpan.</p>
        </div>
      )}

      <JudulKecil>{respons && !respons.ada ? "Untuk Anda" : "Cerita dan tanggapan"}</JudulKecil>
      <TanggapanCerita respons={respons} />

      {jawaban.length > 0 && (
        <>
          <JudulKecil>Jawaban Anda di survei</JudulKecil>
          {jawaban.map((j) => (
            <Kartu key={j.kode} className={styles.jawaban} style={{ "--w": j.warna }}>
              <span>{j.pendek}</span>
              <p>{j.isi}</p>
            </Kartu>
          ))}
        </>
      )}
    </Bertahap>
  );
}

function TanggapanCerita({ respons }) {
  if (!respons) {
    return (
      <Kartu className={styles.pesanTunggu} data-tur="tanggapan-cerita">
        <motion.span animate={{ rotate: [0, 180, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} style={{ display: "inline-flex" }}>
          <HourglassMedium size={24} weight="fill" aria-hidden="true" />
        </motion.span>
        <span>Tanggapan untuk cerita Anda sedang ditinjau. Begitu selesai, tanggapannya muncul di sini.</span>
      </Kartu>
    );
  }
  return (
    <div className={styles.tanggapanTumpuk} data-tur="tanggapan-cerita">
      {/* Kerahasiaan cerita (permintaan pemilik produk 2026-10-19). Sesuai RLS migration
          20261020100000: baris respons_cerita hanya terbaca pemiliknya dan Admin Fammi. */}
      {respons.ada && (
        <motion.div className={styles.rahasia} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
          <motion.span className={styles.rahasiaIkon} animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1 }}>
            <LockKey size={22} weight="fill" aria-hidden="true" />
          </motion.span>
          <div>
            <b>Cerita ini hanya Anda yang tahu</b>
            <ul>
              <li>Lembaga, termasuk Human Capital dan atasan Anda, tidak diberi akses untuk membaca cerita ini.</li>
              <li>Tim Fammi meninjau cerita Anda dan menyusun tanggapan di bawah ini sebagai bentuk dukungan.</li>
            </ul>
          </div>
        </motion.div>
      )}
      {/* Cerita asli ditampilkan lagi supaya jelas tanggapan ini menjawab tulisan yang mana. */}
      {respons.ada && respons.cerita && (
        <Kartu className={styles.ceritaAnda}>
          <span className={styles.ceritaLabel}><Quotes size={18} weight="fill" aria-hidden="true" /> Cerita yang Anda tulis</span>
          <div className={styles.ceritaTeks}><TeksLipat baris={4} panjangMin={220}>{respons.cerita}</TeksLipat></div>
        </Kartu>
      )}
      <Kartu className={styles.pesan}>
        <span className={styles.pesanLabel}><ChatCircleText size={18} weight="fill" aria-hidden="true" /> {respons.ada ? "Tanggapan untuk cerita Anda" : "Untuk Anda"}</span>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}>{respons.draf}</motion.p>
      </Kartu>
    </div>
  );
}

// Blok tampilan yang dipakai lebih dari satu tab (dan sebagian juga di laporan individu):
// kartu skor hero, kartu huruf PROTEK, kartu donat dimensi kepuasan, daftar Top item, kolom Top
// pegawai, dan dialog daftar lengkap. Semua angka diterima apa adanya dari dataset.

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Heart, User, UserCircle } from "@phosphor-icons/react";
import {
  infoAspek, infoDimensi, infoKategoriProtek, infoKepuasan5,
} from "./lib/waMeta";
import { formatAngka, formatPersen } from "./lib/waAturan";
import { IKON_DIMENSI } from "./waIkon";
import { IlustrasiHati, IlustrasiPapan } from "./WaIlustrasi";
import {
  AngkaHitung, Bar, Bertahap, Bintang, Chip, Dialog, Donat, KartuPlusMinus, Kartu, KeadaanKosong, KolomCari, Muncul,
  Petunjuk, TombolTeks,
} from "./WaUi";
import styles from "./WaBagian.module.css";

// ── Kartu skor hero ─────────────────────────────────────────────────────────────────────────

/**
 * Kartu skor PROTEK: donat, persen besar, chip kategori, ilustrasi, dan panel narasi ungu.
 * `catatan` (laporan kelompok) menjelaskan sebaran kategori di bawah angka rata-rata, supaya
 * rata-rata skor tidak terbaca bertentangan dengan "N% pegawai berkategori Baik" di narasi.
 */
export function KartuSkorWellbeing({ judul, pct, kategori, narasi, ringkas = false, kosong, catatan, tur = "skor-wellbeing" }) {
  const kat = infoKategoriProtek(kategori);
  return (
    <Kartu className={`${styles.hero} ${ringkas ? styles.heroRingkas : ""}`} naik data-tur={tur}>
      <div className={styles.heroAtas}>
        <div className={styles.heroTeks}>
          <p className={styles.heroJudul}>{judul}</p>
          <div className={styles.heroAngkaBaris}>
            <Donat nilai={pct} ukuran={ringkas ? 74 : 108} tebal={ringkas ? 22 : 32} warna="var(--fm-ungu-tua)" jalur="var(--wa-ungu-lembut)" label={`Skor ${formatPersen(pct, 2)}`} />
            <div>
              <AngkaHitung nilai={pct} digit={2} akhiran="%" className={styles.heroAngka} />
              {kat && <div><Chip warna="var(--fm-ungu-tua)" besar petunjuk={kat.arti}>{kat.label}</Chip></div>}
            </div>
          </div>
          {catatan && <p className={styles.heroCatatan}>{catatan}</p>}
        </div>
        <div className={styles.heroGambar}><IlustrasiHati ukuran={ringkas ? 92 : 150} /></div>
      </div>
      <PanelNarasi warna="var(--wa-ungu-lembut)" kosong={kosong}>{narasi}</PanelNarasi>
    </Kartu>
  );
}

/** Kartu skor kepuasan: angka per lima, bintang, chip, ilustrasi, dan panel narasi kuning. */
export function KartuSkorKepuasan({ judul, rata, kategori5, bintang, narasi, ringkas = false, kosong, catatan, tur = "skor-kepuasan" }) {
  const kat = infoKepuasan5(kategori5);
  return (
    <Kartu className={`${styles.hero} ${ringkas ? styles.heroRingkas : ""}`} naik data-tur={tur}>
      <div className={styles.heroAtas}>
        <div className={styles.heroTeks}>
          <p className={styles.heroJudul}>{judul}</p>
          <p className={styles.heroAngkaLima}>
            <AngkaHitung nilai={rata} digit={2} className={styles.heroAngka} />
            <span className={styles.heroPer}>/ 5</span>
          </p>
          <div className={`${styles.heroBintang} ${ringkas ? styles.heroBintangTumpuk : ""}`}>
            <Bintang nilai={bintang ?? rata} ukuran={ringkas ? 26 : 32} />
            {kat && <Chip warna="var(--wa-kuning)" teks="#222222" besar petunjuk="Kategori dari rata-rata kepuasan dua belas pernyataan, skala 1 sampai 5.">{kat.label}</Chip>}
          </div>
          {catatan && <p className={styles.heroCatatan}>{catatan}</p>}
        </div>
        <div className={styles.heroGambar}><IlustrasiPapan ukuran={ringkas ? 92 : 150} /></div>
      </div>
      <PanelNarasi warna="var(--wa-kuning)" kosong={kosong}>{narasi}</PanelNarasi>
    </Kartu>
  );
}

function PanelNarasi({ warna, children, kosong = "Narasi belum tersedia untuk cakupan ini." }) {
  return (
    <motion.div
      className={styles.panelNarasi}
      style={{ background: warna }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <p className={children ? "" : styles.redup}>{children || kosong}</p>
    </motion.div>
  );
}

// ── Aspek dan dimensi ───────────────────────────────────────────────────────────────────────

/** Kartu huruf PROTEK: huruf besar, bar, persen, label. */
export function KartuHuruf({ kunci, pct, sorot = false, onClick, tunda = 0 }) {
  const a = infoAspek(kunci);
  const warna = sorot ? "var(--fm-jingga)" : "var(--fm-ungu-sedang)";
  return (
    <Kartu className={styles.huruf} onClick={onClick} label={onClick ? `${a.label}, buka rincian` : undefined}>
      <Petunjuk teks={`${a.label}. ${a.arti}${sorot ? " Aspek terendah di cakupan ini." : ""}`} blok fokus={!onClick}>
        <span className={styles.hurufBesar} style={{ color: "var(--fm-ungu-tua)" }}>{a.huruf}</span>
      </Petunjuk>
      <Bar pct={pct} warna={warna} tunda={tunda} label={`${a.label} ${formatPersen(pct)}`} />
      <div className={styles.hurufBawah}>
        <AngkaHitung nilai={pct} akhiran="%" className={styles.hurufAngka} />
        <span className={styles.hurufLabel}>{a.label}</span>
      </div>
    </Kartu>
  );
}

/** Kartu donat dimensi kepuasan: donat rata-rata per lima, angka, label dua baris. */
export function KartuDimensi({ kunci, rata, sorot = false, onClick, tunda = 0 }) {
  const d = infoDimensi(kunci);
  const Ikon = IKON_DIMENSI[kunci];
  const warna = sorot ? "var(--fm-jingga)" : "var(--fm-ungu-sedang)";
  return (
    <Kartu className={styles.dimensi} onClick={onClick} label={onClick ? `${d.label}, buka rincian` : undefined}>
      <div className={styles.dimensiAtas}>
        <Donat nilai={rata} maks={5} ukuran={58} tebal={8} warna={warna} tunda={tunda} label={`${d.label} ${formatAngka(rata, 2)} dari 5`}>
          <Ikon size={18} weight="fill" style={{ color: warna }} aria-hidden="true" />
        </Donat>
        <span className={styles.dimensiAngka} style={{ color: warna }}>
          <AngkaHitung nilai={rata} digit={1} />
          <small>/5</small>
        </span>
      </div>
      <Petunjuk teks={`${d.arti}${sorot ? " Dimensi terendah di cakupan ini." : ""}`} blok fokus={!onClick}>
        <span className={styles.dimensiLabel}>{d.baris[0]}<br />{d.baris[1]}</span>
      </Petunjuk>
    </Kartu>
  );
}

// ── Daftar item ─────────────────────────────────────────────────────────────────────────────

/** Satu baris pernyataan: teks, persen, bar. */
export function BarisItem({ item, warna, tunda = 0 }) {
  return (
    <Muncul className={styles.barisItem}>
      <Petunjuk teks={item.teksAsli ? `Pernyataan asli: "${item.teksAsli}"` : null} blok>
        <p className={styles.barisItemTeks}>{item.teks}</p>
      </Petunjuk>
      <div className={styles.barisItemBar}>
        <span className={styles.barisItemPersen} style={{ color: warna }}>{formatPersen(item.pct)}</span>
        <Bar pct={item.pct} warna={warna} tunda={tunda} />
      </div>
    </Muncul>
  );
}

/** Kartu "TOP 3" item kuat atau perlu penguatan, dengan tombol lihat semua. */
export function KartuTopItem({ jenis, judul, items, total, onLihatSemua, catatanKosong }) {
  const kuat = jenis === "kuat";
  const warna = kuat ? "var(--fm-ungu-sedang)" : "var(--fm-jingga)";
  return (
    <div className={styles.topItemBungkus}>
      <h3 className={styles.topItemJudul}>{judul}</h3>
      <Kartu className={styles.topItem}>
        {items.length ? (
          <Bertahap className={styles.topItemDaftar} jeda={0.08}>
            {items.map((it, i) => <BarisItem key={it.kode} item={it} warna={warna} tunda={0.1 + i * 0.1} />)}
          </Bertahap>
        ) : (
          <KeadaanKosong kecil judul="Tidak ada pernyataan di kategori ini" pesan={catatanKosong} />
        )}
        <div className={styles.topItemKaki}>
          <span style={{ color: warna }}>{total}</span>
          {onLihatSemua && <TombolTeks warna={warna} onClick={onLihatSemua}>Lihat semua</TombolTeks>}
        </div>
      </Kartu>
    </div>
  );
}

/** Dialog berisi semua pernyataan satu kategori, dikelompokkan per aspek. */
export function DialogSemuaItem({ buka, onTutup, judul, keterangan, items, warna }) {
  const perAspek = useMemo(() => {
    const peta = new Map();
    for (const it of items) {
      if (!peta.has(it.aspek)) peta.set(it.aspek, []);
      peta.get(it.aspek).push(it);
    }
    return [...peta.entries()];
  }, [items]);
  return (
    <Dialog buka={buka} onTutup={onTutup} judul={judul} keterangan={keterangan} lebar="sedang">
      {items.length === 0 && <KeadaanKosong judul="Belum ada pernyataan di kategori ini" />}
      <Bertahap className={styles.dialogItem} jeda={0.04}>
        {perAspek.map(([aspek, daftar]) => (
          <Muncul key={aspek} className={styles.dialogAspek}>
            <h4>{infoAspek(aspek)?.label || aspek}</h4>
            {daftar.map((it, i) => <BarisItem key={it.kode} item={it} warna={warna} tunda={i * 0.05} />)}
          </Muncul>
        ))}
      </Bertahap>
    </Dialog>
  );
}

// ── Kategori dan pegawai ────────────────────────────────────────────────────────────────────

/** Kartu kategori bergaris (Baik / Perlu Perhatian / Perlu Pendampingan; Puas / Netral / Tidak Puas). */
export function KartuKategori({ label, warna, warnaTeks, pct, n, arti, onClick, aktif = false }) {
  return (
    <Kartu className={`${styles.kategori} ${aktif ? styles.kategoriAktif : ""}`} style={{ "--w": warna, "--wt": warnaTeks || warna }} onClick={onClick} label={onClick ? `${label}, lihat daftar pegawai` : undefined}>
      <Petunjuk teks={arti} blok fokus={!onClick}>
        <span className={styles.kategoriLabel}>{label}</span>
      </Petunjuk>
      <span className={styles.kategoriAngka}>
        <span><Heart size={18} weight="fill" aria-hidden="true" /> <AngkaHitung nilai={pct} akhiran="%" /></span>
        <span><User size={18} weight="fill" aria-hidden="true" /> <AngkaHitung nilai={n} /> Pegawai</span>
      </span>
    </Kartu>
  );
}

/**
 * Kolom TOP 5 pegawai satu kategori. `nilai(o)` mengembalikan {pct, teks} untuk bar dan angka.
 */
export function KolomTopPegawai({ label, warna, warnaTeks, daftar, nilai, onPilih, onLihatSemua, kosong }) {
  const lima = daftar.slice(0, 5);
  return (
    <Kartu className={styles.kolomTop}>
      <header className={styles.kolomTopKepala}>
        <h3 style={{ color: warnaTeks || warna }}>{label}</h3>
        <span><User size={18} weight="fill" style={{ color: warnaTeks || warna }} aria-hidden="true" /> {daftar.length} Pegawai</span>
      </header>
      <div className={styles.kolomTopIsi}>
        {lima.length === 0 ? (
          <KeadaanKosong kecil ikon={UserCircle} judul="Tidak ada pegawai di sini" pesan={kosong} />
        ) : (
          <Bertahap jeda={0.06} className={styles.kolomTopDaftar}>
            {lima.map((o, i) => {
              const v = nilai(o);
              return (
                <motion.button
                  key={o.id}
                  type="button"
                  className={styles.barisPegawai}
                  variants={{ awal: { opacity: 0, x: -10 }, tampil: { opacity: 1, x: 0 } }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onPilih(o.id)}
                >
                  <span className={styles.barisPegawaiAtas}>
                    <span className={styles.barisPegawaiNama}>{o.nama}</span>
                    <span>{v.teks}</span>
                  </span>
                  <Bar pct={v.pct} warna={warna} tunda={0.15 + i * 0.07} />
                </motion.button>
              );
            })}
          </Bertahap>
        )}
      </div>
      {daftar.length > 0 && (
        <div className={styles.kolomTopKaki}>
          <TombolTeks warna={warnaTeks || warna} onClick={onLihatSemua}>Lihat semua pegawai</TombolTeks>
        </div>
      )}
    </Kartu>
  );
}

/** Dialog daftar lengkap pegawai satu kategori, bisa dicari, klik nama membuka profil. */
export function DialogDaftarPegawai({ buka, onTutup, judul, keterangan, daftar, nilai, warna, onPilih }) {
  const [cari, setCari] = useState("");
  const tersaring = useMemo(() => {
    const k = cari.trim().toLowerCase();
    return k ? daftar.filter((o) => `${o.nama} ${o.unit} ${o.jabatan}`.toLowerCase().includes(k)) : daftar;
  }, [daftar, cari]);
  return (
    <Dialog buka={buka} onTutup={() => { setCari(""); onTutup(); }} judul={judul} keterangan={keterangan} lebar="sedang">
      <div className={styles.dialogCari}><KolomCari nilai={cari} onUbah={setCari} placeholder="Cari nama, unit, atau jabatan" /></div>
      <AnimatePresence mode="popLayout">
        {tersaring.map((o, i) => {
          const v = nilai(o);
          return (
            <motion.button
              key={o.id}
              layout
              type="button"
              className={styles.barisDaftar}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 20) * 0.02 } }}
              exit={{ opacity: 0, scale: 0.98 }}
              whileHover={{ backgroundColor: "rgb(99 35 218 / 0.05)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPilih(o.id)}
            >
              <span className={styles.barisDaftarNo}>{i + 1}</span>
              <span className={styles.barisDaftarNama}>
                <b>{o.nama}</b>
                <small>{[o.jabatan, o.unit].filter(Boolean).join(" · ")}</small>
              </span>
              <span className={styles.barisDaftarBar}><Bar pct={v.pct} warna={warna} /></span>
              <span className={styles.barisDaftarAngka}>{v.teks}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
      {tersaring.length === 0 && <KeadaanKosong kecil judul="Tidak ada yang cocok" pesan="Coba kata lain." />}
    </Dialog>
  );
}

// ── Baris rincian bertumpuk ─────────────────────────────────────────────────────────────────

/** Baris rincian: lencana (huruf atau ikon), label dua baris, bar bertumpuk, dan legenda. */
export function BarisRincian({ lencana, label, children }) {
  return (
    <Kartu className={styles.rincian} naik>
      <span className={styles.rincianKiri}>
        {lencana}
        <span className={styles.rincianLabel}>{label}</span>
      </span>
      <div className={styles.rincianKanan}>{children}</div>
    </Kartu>
  );
}

// ── Lain-lain ───────────────────────────────────────────────────────────────────────────────

export function DuaPlusMinus({ plus, minus, tur }) {
  return (
    <Bertahap className={styles.duaKolom} data-tur={tur}>
      <KartuPlusMinus jenis="plus">{plus}</KartuPlusMinus>
      <KartuPlusMinus jenis="minus">{minus}</KartuPlusMinus>
    </Bertahap>
  );
}


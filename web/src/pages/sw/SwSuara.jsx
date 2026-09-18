// Tab Suara Pegawai sebagai ruang kendali, dua sub-tab yang masing-masing muat satu layar:
//   Kondisi kerja: kategori per aspek, harapan 3 bulan, dukungan yang dibutuhkan.
//   Jawaban pegawai: tema tiga pertanyaan terbuka; kutipan dan tabel per unit dibuka di dialog.
// Kutipan tidak pernah membawa nama, unit, atau jabatan, dan kutipan bertanda sensitif tidak
// pernah ditampilkan.

import { useState } from "react";
import { ChartBar, HandHeart, Quotes, Table, TrendUp } from "@phosphor-icons/react";
import { HARAPAN, KALIMAT_BERAT_TETAP, KEBUTUHAN, SUBSKALA } from "./lib/swMeta";
import {
  daftarKategori, formatAngka, formatPersen, jumlahUnitKecil, porsi, saringUnitTampil,
  sebaranKategori,
} from "./lib/swAturan";
import {
  BarBaris, BarTumpuk, CatatanUnitKecil, Dialog, Kartu, KeadaanLayar, Petunjuk, TabelPadanan, Tombol, Wafel,
} from "./SwUi";
import { IKON_ASPEK, IKON_TEMA, WARNA_TEMA } from "./swWarna";
import styles from "./SwSuara.module.css";

const SUB = [
  { id: "kondisi", label: "Kondisi kerja" },
  { id: "suara", label: "Jawaban pegawai" },
];

const TAMPIL_TEMA = 9;

export default function SwSuara({ data, peran, unitFokus = null, sub, onSub }) {
  const unit = peran === "kepalaUnit" ? unitFokus || data.unit[0] || null : null;
  if (peran === "kepalaUnit" && !unit) {
    return (
      <KeadaanLayar
        jenis="kosong"
        judul="Unit Anda tidak ditemukan"
        pesan="Hubungi tim Fammi agar akun Anda ditautkan ke unit yang benar."
      />
    );
  }
  return (
    <div className={styles.tab}>
      <div className={styles.subBaris}>
        <div className={styles.subTab} role="tablist" aria-label="Sub-bagian">
          {SUB.map((s) => (
            <button key={s.id} type="button" role="tab" aria-selected={sub === s.id} className={sub === s.id ? styles.subAktif : ""} onClick={() => onSub(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        <span className={styles.lingkup}>
          {sub === "kondisi"
            ? `${unit ? unit.nama : "Seluruh lembaga"} · ${(unit || data.lembaga).nPengisi} pegawai`
            : `Kutipan tanpa nama, unit, atau jabatan${unit ? " · tema dari seluruh lembaga" : ""}`}
        </span>
      </div>
      <div className={styles.isiSub}>
        {sub === "kondisi" ? <KondisiKerja data={data} unit={unit} /> : <SuaraPegawai data={data} peran={peran} />}
      </div>
    </div>
  );
}

// ── Kondisi kerja ───────────────────────────────────────────────────────────────────────────

function KondisiKerja({ data, unit }) {
  const { asumsi } = data;
  const fokus = unit || data.lembaga;
  const kategori = daftarKategori(asumsi);
  const h = fokus.harapan;
  const n = fokus.nPengisi;
  const baris = SUBSKALA.map((s) => ({ ...s, sebaran: sebaranKategori(fokus.distribusi?.[s.kunci], asumsi) }));
  const kebutuhan = KEBUTUHAN.map((k) => ({ ...k, jumlah: fokus.kebutuhan?.[k.kunci] || 0 })).sort((a, b) => b.jumlah - a.jumlah);
  const nBisaNaik = h.naik + h.tetap + h.turun;

  return (
    <div className={styles.gridKondisi}>
      <Kartu
        className={styles.kartuAspek}
        judul="Kondisi per aspek"
        ikon={ChartBar}
        aksi={(
          <TabelPadanan
            judul="Kondisi per aspek"
            kolom={["Aspek", ...kategori.map((k) => k.label)]}
            baris={baris.map((b) => [b.label, ...kategori.map((k) => `${b.sebaran[k.kunci]} (${formatPersen(porsi(b.sebaran[k.kunci], n))})`)])}
          />
        )}
      >
        <ul className={styles.legenda}>
          {kategori.map((k) => (
            <li key={k.kunci}><Petunjuk teks={`${k.label}: skor ${k.min} sampai ${k.max} dari 100.`}><i style={{ background: k.warna }} />{k.label}</Petunjuk></li>
          ))}
        </ul>
        {baris.map((b) => {
          const Ikon = IKON_ASPEK[b.kunci];
          return (
            <div key={b.kunci} className={styles.barisAspek}>
              <p>
                <Petunjuk teks={b.panjang}><b><Ikon size={15} weight="fill" aria-hidden="true" /> {b.pendek}</b></Petunjuk>
                <span>rata-rata {formatAngka(fokus.skor?.[b.kunci])} · baik ke atas {formatPersen(porsi(b.sebaran.menopang + b.sebaran.sangat_menopang, n))}</span>
              </p>
              <BarTumpuk legenda={false} label={b.label} segmen={kategori.map((k) => ({ kunci: k.kunci, label: k.label, jumlah: b.sebaran[k.kunci], warna: k.warna, panjang: `Skor ${k.min} sampai ${k.max}` }))} />
            </div>
          );
        })}
        <Petunjuk teks={`Angka sekarang 3 ke bawah (dari 5) dan angka harapan 3 bulan lagi tidak lebih tinggi. ${formatPersen(porsi(h.datarRendah, n))} dari ${n} pengisi.`} blok>
          <div className={styles.datar}>
            <strong>{h.datarRendah}</strong>
            <span>orang {KALIMAT_BERAT_TETAP} · {formatPersen(porsi(h.datarRendah, n))}</span>
          </div>
        </Petunjuk>
      </Kartu>

      <Kartu
        className={styles.kartuHarapan}
        judul="Harapan 3 bulan ke depan"
        ikon={TrendUp}
        warnaIkon="var(--fm-hijau)"
        aksi={(
          <TabelPadanan
            judul="Harapan 3 bulan ke depan"
            kolom={["Kelompok", "Jumlah orang"]}
            baris={[...HARAPAN.map((x) => [x.label, h[x.kunci]]), [`Merasa berat dan mengira tetap berat`, h.datarRendah]]}
          />
        )}
      >
        <div className={styles.harapanIsi}>
          <Wafel sebaris lebar={92} label="Harapan 3 bulan" segmen={HARAPAN.map((x) => ({ ...x, jumlah: h[x.kunci] }))} />
          <p className={styles.kecil}>{`Satu kotak = 1% dari ${n} pengisi · ${formatPersen(porsi(h.naik, nBisaNaik))} dari ${nBisaNaik} yang masih bisa naik ingin membaik`}</p>
        </div>
      </Kartu>

      <Kartu
        className={styles.kartuDukungan}
        judul="Dukungan dibutuhkan · boleh pilih lebih dari satu"
        ikon={HandHeart}
        warnaIkon="var(--fm-emas)"
        isiClassName={styles.rapat}
        aksi={<TabelPadanan judul="Dukungan yang paling dibutuhkan" kolom={["Dukungan", "Jumlah orang", `Porsi dari ${n}`]} baris={kebutuhan.map((k) => [k.label, k.jumlah, formatPersen(porsi(k.jumlah, n))])} />}
      >
        {kebutuhan.map((k) => (
          <BarBaris key={k.kunci} label={k.label} nilai={k.jumlah} maks={n} teks={`${formatPersen(porsi(k.jumlah, n))} · ${k.jumlah}`} lebarLabel="minmax(0, 1.25fr)" />
        ))}
      </Kartu>
    </div>
  );
}

// ── Jawaban pegawai ─────────────────────────────────────────────────────────────────────────

const KELOMPOK_TEMA = [
  { kunci: "bertahan", judul: "Yang membuat bertahan", warna: WARNA_TEMA.bertahan, ikon: IKON_TEMA.bertahan },
  { kunci: "menguras", judul: "Yang menguras tenaga", warna: WARNA_TEMA.menguras, ikon: IKON_TEMA.menguras },
  { kunci: "diperbaiki", judul: "Yang ingin diperbaiki", warna: WARNA_TEMA.diperbaiki, ikon: IKON_TEMA.diperbaiki },
];

function SuaraPegawai({ data, peran }) {
  const { tema } = data;
  const [kutipan, setKutipan] = useState(null);
  const [semua, setSemua] = useState(null);
  const [bukaSilang, setBukaSilang] = useState(false);
  if (!tema) return <KeadaanLayar jenis="kosong" judul="Belum ada jawaban yang dikelompokkan" />;

  return (
    <div className={styles.gridSuara}>
      {KELOMPOK_TEMA.map((k) => {
        const blok = tema[k.kunci];
        if (!blok) return null;
        const maks = Math.max(1, ...blok.daftar.map((t) => t.jumlah));
        const lebih = blok.daftar.length > TAMPIL_TEMA;
        return (
          <Kartu
            key={k.kunci}
            judul={k.judul}
            ikon={k.ikon}
            warnaIkon={k.warna}
            isiClassName={styles.rapat}
            aksi={(
              <>
                {k.kunci === "menguras" && tema.silangMenguras && (
                  <Tombol varian="garis" onClick={() => setBukaSilang(true)}><Table size={16} weight="bold" aria-hidden="true" /> Per unit</Tombol>
                )}
                <TabelPadanan judul={k.judul} kolom={["Tema", "Jumlah orang", "Porsi"]} baris={blok.daftar.map((t) => [t.tema, t.jumlah, formatPersen(t.porsi)])} />
              </>
            )}
          >
            <p className={styles.kecil}>{blok.terisi} orang menjawab · klik tema untuk contoh jawaban</p>
            {blok.daftar.slice(0, TAMPIL_TEMA).map((t) => (
              <BarBaris
                key={t.tema}
                label={t.tema}
                nilai={t.jumlah}
                maks={maks}
                warna={k.warna}
                teks={`${t.jumlah} · ${formatPersen(t.porsi)}`}
                lebarLabel="minmax(0, 1.3fr)"
                onKlik={() => setKutipan({ judul: k.judul, tema: t })}
              />
            ))}
            {lebih && (
              <Tombol varian="teks" onClick={() => setSemua({ ...k, blok, maks })}>Lihat semua {blok.daftar.length} tema</Tombol>
            )}
          </Kartu>
        );
      })}

      {kutipan && <DialogKutipan judul={kutipan.judul} tema={kutipan.tema} onTutup={() => setKutipan(null)} />}
      {semua && (
        <Dialog judul={semua.judul} keterangan={`${semua.blok.terisi} orang menjawab · klik tema untuk membaca contoh jawaban`} onTutup={() => setSemua(null)}>
          <div className={styles.daftarDialog}>
            {semua.blok.daftar.map((t) => (
              <BarBaris
                key={t.tema}
                label={t.tema}
                nilai={t.jumlah}
                maks={semua.maks}
                warna={semua.warna}
                teks={`${t.jumlah} · ${formatPersen(t.porsi)}`}
                lebarLabel="minmax(0, 1.3fr)"
                onKlik={() => { setSemua(null); setKutipan({ judul: semua.judul, tema: t }); }}
              />
            ))}
          </div>
        </Dialog>
      )}
      {bukaSilang && <DialogSilang data={data} peran={peran} onTutup={() => setBukaSilang(false)} />}
    </div>
  );
}

function DialogKutipan({ judul, tema, onTutup }) {
  const daftar = (tema.kutipan || []).filter((q) => !q.sensitif).slice(0, 3);
  return (
    <Dialog judul={tema.tema} keterangan={`${judul} · ${tema.jumlah} orang`} onTutup={onTutup}>
      {daftar.length ? (
        <ul className={styles.kutipan}>
          {daftar.map((q) => <li key={q.teks}><Quotes size={18} weight="fill" aria-hidden="true" /><span>{q.teks}</span></li>)}
        </ul>
      ) : <p>Belum ada contoh jawaban yang bisa ditampilkan.</p>}
    </Dialog>
  );
}

function DialogSilang({ data, peran, onTutup }) {
  const { tema, asumsi } = data;
  const silang = tema.silangMenguras;
  const namaUnit = Object.fromEntries(data.unit.map((u) => [u.id, u.nama]));
  const tampil = saringUnitTampil(data.unit, peran, asumsi);
  const boleh = new Set(tampil.map((u) => u.id));
  const baris = silang.baris.filter((b) => boleh.has(b.unitId));
  const maks = Math.max(1, ...baris.flatMap((b) => b.nilai));
  return (
    <Dialog
      lebar
      judul="Yang paling menguras tenaga, per unit"
      keterangan="Angka = jumlah orang di unit itu yang menyebut tema tersebut."
      onTutup={onTutup}
    >
      {baris.length === 0 ? <KeadaanLayar jenis="kosong" judul="Tidak ada unit yang bisa ditampilkan" /> : (
        <table className={styles.silang}>
          <thead>
            <tr>
              <th scope="col">Unit</th>
              <th scope="col">Menjawab</th>
              {silang.tema.map((t) => <th key={t} scope="col">{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => (
              <tr key={b.unitId}>
                <th scope="row">{namaUnit[b.unitId] || b.unitId}</th>
                <td className={styles.angkaSilang}>{b.terisi}</td>
                {b.nilai.map((v, i) => {
                  const pekat = v / maks >= 0.5;
                  return (
                    <td
                      key={silang.tema[i]}
                      className={styles.selSilang}
                      style={{
                        background: v === 0 ? "transparent" : pekat ? "var(--fm-ungu-tua)" : `rgb(99 35 218 / ${0.08 + (v / maks) * 0.3})`,
                        color: pekat ? "#FFFFFF" : "var(--fm-teks)",
                      }}
                    >
                      {v || "·"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <CatatanUnitKecil jumlah={jumlahUnitKecil(tampil.filter((u) => baris.some((b) => b.unitId === u.id)), asumsi)} ambang={asumsi.minPengisiUnit} />
    </Dialog>
  );
}

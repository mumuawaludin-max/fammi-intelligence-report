// Laporan pegawai untuk dirinya sendiri, mobile-first: satu kolom yang mengalir, tiga bagian
// yang dipilih lewat bilah bawah (Skor, Atasan, Jawaban). Dipakai SwPegawaiPage (produksi) dan
// pratinjau ?preview=sw peran Pegawai. Datanya sudah dipotong siapkanDataUntukPeran: hanya diri
// sendiri, unit (kalau pengisinya cukup), dan angka pembanding lembaga.

import { useMemo, useState } from "react";
import { ChartPolar, ChatCircleText, CheckCircle, Eye, Gauge, HandHeart, Smiley } from "@phosphor-icons/react";
import {
  GAP_PANDANGAN, KALIMAT_BUKAN_DIAGNOSIS, KALIMAT_FOOTER, KEBUTUHAN, SUBSKALA, indikatorPerRanah, infoKuadran,
  labelKondisi,
} from "./lib/swMeta";
import {
  bandingTigaLapis, formatAngka, kalimatTigaLapis, kategoriKondisi, siapkanDataUntukPeran, unitKecil,
} from "./lib/swAturan";
import { BarBaris, ChipKategori, Donat, Kartu, KeadaanLayar, KotakKuadran, Petunjuk, Radar } from "./SwUi";
import { BarDuaArah, SkalaKondisi } from "./SwProfil";
import { IKON_ASPEK } from "./swWarna";
import styles from "./SwPegawaiLaporan.module.css";

const BAGIAN = [
  { id: "skor", label: "Skor saya", ikon: Gauge },
  { id: "atasan", label: "Pandangan atasan", ikon: Eye },
  { id: "jawaban", label: "Jawaban saya", ikon: ChatCircleText },
];

const PERTANYAAN = [
  { kunci: "bertahan", label: "Yang membuat saya bertahan" },
  { kunci: "menaikkan", label: "Yang bisa membuat lebih baik" },
  { kunci: "menguras", label: "Yang paling menguras tenaga" },
  { kunci: "diperbaiki", label: "Yang paling ingin diperbaiki" },
];

export default function SwPegawaiLaporan({ dataset, akses }) {
  const data = useMemo(() => siapkanDataUntukPeran(dataset, akses), [dataset, akses]);
  const [bagian, setBagian] = useState("skor");
  const orang = data?.individu?.[0] || null;

  if (!orang) {
    return <KeadaanLayar jenis="kosong" judul="Hasil Anda belum ditemukan" pesan="Hubungi tim Fammi agar akun ini dihubungkan dengan isian Anda." />;
  }

  const { asumsi, lembaga } = data;
  const unit = data.unit[0] && !unitKecil(data.unit[0], asumsi) ? data.unit[0] : null;
  const namaUnit = unit?.nama || data.unitSendiri?.nama || "-";

  return (
    <div className={styles.laporan}>
      <header className={styles.kepala}>
        <p className={styles.kecil}>Screening Awal Wellbeing · hasil Anda</p>
        <h1 className={styles.nama}>{orang.nama}</h1>
        <p className={styles.meta}>{namaUnit} · {orang.jabatan || "-"}</p>
      </header>

      <main className={styles.isi}>
        {bagian === "skor" && <BagianSkor orang={orang} unit={unit} lembaga={lembaga} asumsi={asumsi} unitAda={Boolean(data.unitSendiri)} />}
        {bagian === "atasan" && <BagianAtasan orang={orang} />}
        {bagian === "jawaban" && <BagianJawaban orang={orang} unit={unit} lembaga={lembaga} />}
        <p className={styles.catatanKaki}>{KALIMAT_BUKAN_DIAGNOSIS} {KALIMAT_FOOTER}</p>
      </main>

      <nav className={styles.bilah} aria-label="Bagian laporan">
        {BAGIAN.map((b) => {
          const Ikon = b.ikon;
          const aktif = bagian === b.id;
          return (
            <button key={b.id} type="button" className={`${styles.tombolBilah} ${aktif ? styles.tombolBilahAktif : ""}`} aria-current={aktif ? "page" : undefined} onClick={() => { setBagian(b.id); window.scrollTo({ top: 0 }); }}>
              <Ikon size={22} weight={aktif ? "fill" : "regular"} aria-hidden="true" />
              <span>{b.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function BagianSkor({ orang, unit, lembaga, asumsi, unitAda }) {
  const baris = bandingTigaLapis(orang, unit, lembaga);
  const kalimat = kalimatTigaLapis(baris);
  const kat = kategoriKondisi(orang.indeks, asumsi);
  const sumbu = SUBSKALA.map((s) => ({ kunci: s.kunci, label: s.pendek }));
  const lapis = [
    { kunci: "diri", label: "Anda", warna: "var(--fm-ungu)", tebal: true },
    { kunci: "unit", label: "Rata-rata unit", warna: "var(--fm-emas)" },
    { kunci: "lembaga", label: "Rata-rata lembaga", warna: "var(--ink-4, #a8a2b4)" },
  ].filter((l) => baris.some((b) => b[l.kunci] !== null))
    .map((l) => ({ ...l, nilai: Object.fromEntries(baris.map((b) => [b.kunci, b[l.kunci]])) }));
  const pembanding = unit ? unit.skor : lembaga.skor;
  const labelPembanding = unit ? "Rata-rata unit" : "Rata-rata lembaga";

  return (
    <>
      <Kartu judul="Skor kondisi kerja Anda" ikon={Gauge}>
        <div className={styles.skorIsi}>
          <Donat nilai={orang.indeks} asumsi={asumsi} ukuran={124} tebal={13} />
          <div className={styles.skorTeks}>
            <ChipKategori nilai={orang.indeks} asumsi={asumsi} />
            <p>{kat ? `Skor Anda ${formatAngka(orang.indeks)} dari 100. Rata-rata ${unit ? "unit" : "lembaga"} ${formatAngka(unit ? unit.indeks : lembaga.indeks)}.` : "Skor belum tersedia."}</p>
            {!unit && unitAda && <p className={styles.kecil}>Unit Anda pengisinya di bawah {asumsi.minPengisiUnit} orang, jadi pembandingnya lembaga.</p>}
          </div>
        </div>
      </Kartu>

      <Kartu judul="Bentuk kondisi kerja Anda" ikon={ChartPolar} warnaIkon="var(--fm-ungu-sedang)">
        <div className={styles.radar}>
          <Radar sumbu={sumbu} lapis={lapis} ukuran={200} labelLebar={70} />
        </div>
        <ul className={styles.legenda}>
          {lapis.map((l) => <li key={l.kunci}><i style={{ background: l.warna }} />{l.label}</li>)}
        </ul>
      </Kartu>

      <Kartu judul="Per aspek" ikon={ChartPolar} warnaIkon="var(--fm-hijau)">
        {SUBSKALA.map((s) => {
          const nilai = orang.skor?.[s.kunci];
          const k = kategoriKondisi(nilai, asumsi);
          return (
            <BarBaris
              key={s.kunci}
              label={s.pendek}
              petunjuk={s.panjang}
              ikon={IKON_ASPEK[s.kunci]}
              nilai={nilai}
              warna={k?.warna}
              penanda={pembanding?.[s.kunci] ?? null}
              labelPenanda={labelPembanding}
              lebarLabel="132px"
            />
          );
        })}
        <p className={styles.kecil}>Garis tegak = {labelPembanding.toLowerCase()}. Sorot nama aspek untuk penjelasannya.</p>
      </Kartu>

      <Kartu judul="Artinya" ikon={CheckCircle} warnaIkon="var(--fm-hijau)">
        <ul className={styles.kalimat}>
          {kalimat.map((k) => <li key={k}>{k}</li>)}
        </ul>
      </Kartu>

      <Kartu judul="Rasanya bekerja dan harapan Anda" ikon={Smiley} warnaIkon="var(--fm-emas)">
        <SkalaKondisi kondisi={orang.kondisi} target={orang.target} />
        <p className={styles.teks}>
          Sekarang <b>{orang.kondisi ?? "-"}</b> ({labelKondisi(orang.kondisi).toLowerCase()}), harapan 3 bulan lagi <b>{orang.target ?? "-"}</b>.
        </p>
      </Kartu>
    </>
  );
}

function BagianAtasan({ orang }) {
  const p = orang.pengamatan;
  if (!p) {
    return <KeadaanLayar jenis="kosong" judul="Atasan belum mengisi penilaian" pesan="Bagian ini terisi kalau atasan Anda mengisi Form B." />;
  }
  const kuadran = infoKuadran(p.kuadran);
  return (
    <>
      <Kartu judul="Apakah atasan melihatnya?" ikon={Eye} warnaIkon="var(--fm-emas)">
        <div className={styles.kuadran}>
          <KotakKuadran aktif={p.kuadran} x={p.kebutuhanTeramati} y={p.kebutuhanDirasakan} ringkas />
        </div>
        <p className={styles.teks}><strong>{kuadran?.label}.</strong> {kuadran?.arti}</p>
      </Kartu>

      <Kartu judul="Di mana pandangannya berbeda" ikon={ChartPolar} warnaIkon="var(--fm-ungu-sedang)">
        <p className={styles.kecil}>Dinilai {p.pimpinan?.join(", ") || "atasan"} · bertemu {p.frekuensi.toLowerCase()}</p>
        {GAP_PANDANGAN.map((g) => <BarDuaArah key={g.kunci} {...g} kanan={g.kanan.replace("Pegawai merasa", "Anda merasa")} kiri={g.kiri.replace("Pegawai merasa", "Anda merasa")} nilai={p.gap?.[g.kunci]} />)}
      </Kartu>

      <Kartu judul="Yang ditandai atasan" ikon={CheckCircle} warnaIkon="var(--fm-hijau)">
        {indikatorPerRanah().map((r) => {
          const dicentang = r.indikator.filter((i) => p.indikator.includes(i.kode));
          return (
            <div key={r.kunci} className={`${styles.ranah} ${r.kunci === "kekuatan" ? styles.ranahKekuatan : ""}`}>
              <Petunjuk teks={r.panjang} blok><p className={styles.ranahJudul}>{r.label} <span>{dicentang.length}/{r.indikator.length}</span></p></Petunjuk>
              {dicentang.length ? <ul>{dicentang.map((i) => <li key={i.kode}>{i.teks}</li>)}</ul> : <p className={styles.tidakAda}>Tidak ada.</p>}
            </div>
          );
        })}
      </Kartu>
    </>
  );
}

function BagianJawaban({ orang, unit, lembaga }) {
  const acuan = unit || lembaga;
  const milik = new Set(orang.kebutuhan || []);
  const semua = KEBUTUHAN.map((k, i) => ({ ...k, i, jumlah: acuan.kebutuhan?.[k.kunci] || 0 })).sort((a, b) => b.jumlah - a.jumlah || a.i - b.i);
  return (
    <>
      {PERTANYAAN.map((q) => (
        <Kartu key={q.kunci} judul={q.label} ikon={ChatCircleText} warnaIkon="var(--fm-ungu-sedang)">
          <blockquote className={`${styles.jawaban} ${orang.jawaban?.[q.kunci] ? "" : styles.tidakAda}`}>{orang.jawaban?.[q.kunci] || "Tidak diisi."}</blockquote>
        </Kartu>
      ))}
      <Kartu judul="Dukungan yang Anda pilih" ikon={HandHeart} warnaIkon="var(--fm-emas)">
        <p className={styles.kecil}>{milik.size ? `Centang = pilihan Anda · angka = pemilih di ${unit ? "unit" : "lembaga"}` : "Anda tidak memilih dukungan apa pun."}</p>
        <ul className={styles.kebutuhan}>
          {semua.map((k) => (
            <li key={k.kunci} className={milik.has(k.kunci) ? styles.kebutuhanDipilih : ""}>
              {milik.has(k.kunci) ? <CheckCircle size={18} weight="fill" aria-label="Dipilih" /> : <span className={styles.titikKosong} aria-hidden="true" />}
              <span>{k.label}</span>
              <b>{k.jumlah}</b>
            </li>
          ))}
        </ul>
      </Kartu>
    </>
  );
}

// Lapisan pembaca berkas olahan Screening Awal Wellbeing.
//
// Masukan: { [namaSheet]: baris[][] } (bentuk XLSX.utils.sheet_to_json dengan header: 1).
// Keluaran: satu objek dataset yang dimuat antarmuka apa adanya (lihat bentuknya di
// docs/sw-screening-awal-wellbeing.md).
//
// Aturan: skor, gap, pola, kategori Excel, dan skor prioritas TIDAK dihitung ulang. Pembaca ini
// hanya (1) memindahkan angka final ke bentuk yang dipakai antarmuka, (2) menautkan baris antar
// sheet lewat kolom bantu "H: Baris ..", dan (3) menjumlahkan orang per kelompok untuk sebaran
// yang tidak tersedia sebagai tabel di berkas (sebaran angka kondisi per unit, histogram skor,
// persentase indikator Form B, jumlah alasan per unit).
//
// Fungsi ini murni (tanpa fs), dipakai oleh scripts/sw/baca-berkas-sw.mjs untuk berkas asli
// dan oleh scripts/sw/buat-data-contoh.mjs untuk data contoh.

import {
  ASUMSI_BAWAAN, INDIKATOR, JALUR, KEBUTUHAN, PERMINTAAN, POLA, SUBSKALA,
} from "./swMeta.js";
import { hitungAlasan, kebutuhanTeratas, labelKeselarasan, lengkapiAsumsi } from "./swAturan.js";

export const SHEET = {
  personal: "Personal Form",
  audit: "01 Audit",
  skor: "03 Skor Individu",
  pengamatan: "04 Pengamatan",
  prioritas: "05 Prioritas",
  peserta: "06 Daftar Peserta",
  unit: "07 Unit",
  tema: "08 Tema",
  ringkasan: "09 Ringkasan Pimpinan",
};

// ── Pembantu umum ───────────────────────────────────────────────────────────────────────────

const teks = (v) => (v === null || v === undefined ? "" : String(v).trim());
const angka = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const bulat1 = (n) => (n === null ? null : Math.round(n * 10) / 10);

/** Ambil sheet dengan nama persis atau awalan yang sama (nama sheet kadang berakhiran spasi). */
function ambilSheet(sheets, nama, wajib = true) {
  const kunci = Object.keys(sheets).find((k) => k.trim() === nama) || Object.keys(sheets).find((k) => k.startsWith(nama));
  if (!kunci) {
    if (wajib) throw new Error(`Sheet "${nama}" tidak ditemukan di berkas.`);
    return [];
  }
  return sheets[kunci] || [];
}

/** Indeks kolom per judul pada satu baris judul. Judul dicocokkan setelah trim. */
function petaKolom(barisJudul) {
  const peta = {};
  (barisJudul || []).forEach((j, i) => {
    const k = teks(j);
    if (k && !(k in peta)) peta[k] = i;
  });
  return peta;
}

function kolomWajib(peta, judul, sheet) {
  if (!(judul in peta)) throw new Error(`Kolom "${judul}" tidak ditemukan di sheet "${sheet}".`);
  return peta[judul];
}

/** Cari baris pertama yang sel-selnya diawali nilai tertentu (untuk sheet berblok). */
function cariBaris(rows, cocok, mulai = 0) {
  for (let i = mulai; i < rows.length; i++) if (cocok(rows[i] || [])) return i;
  return -1;
}

const tokenNama = (s) => new Set(teks(s).toLowerCase().split(/[^a-z0-9]+/).filter((k) => k && k !== "unit"));

/**
 * Cocokkan nama blok daftar induk ke nama unit. Sama persis dulu, lalu semua kata nama blok ada
 * di nama unit ("ASRAMA BARUGA" -> "Asrama Athirah Baruga"), dan hanya kalau hasilnya tunggal.
 */
function unitUntukBlok(namaBlok, daftarNamaUnit) {
  const q = tokenNama(namaBlok);
  if (!q.size) return null;
  const sama = daftarNamaUnit.find((n) => slug(n) === slug(namaBlok));
  if (sama) return sama;
  const muat = daftarNamaUnit.filter((n) => {
    const t = tokenNama(n);
    return [...q].every((k) => t.has(k));
  });
  return muat.length === 1 ? muat[0] : null;
}

/**
 * Jumlah pegawai per unit dari daftar induk (sheet "Wellbeing Assessment ..."). Sheet 07 tidak bisa
 * dipakai untuk ini: kolom "Jumlah pegawai" di sana sama dengan jumlah baris Personal Form, jadi
 * setiap unit tampil 100% mengisi. Daftar induk berupa blok "Screening N | <nama unit>" diikuti
 * baris bernomor. Satu blok bisa memuat beberapa unit (Departemen Kurikulum memuat QGDP TK dan SD,
 * QGDP SMP dan SMA, dan Pendidikan Inklusi); pergantian unit di dalam blok ditandai baris berjabatan
 * "Kepala Seksi <nama unit>". Hasil: Map nama unit -> jumlah nama unik.
 */
export function bacaDaftarInduk(rows, daftarNamaUnit) {
  const nama = new Map();
  let aktif = null;
  let judul = null;
  for (const r of rows || []) {
    const a = teks(r?.[0]);
    const b = teks(r?.[1]);
    if (/^screening\b/i.test(a)) {
      aktif = unitUntukBlok(b, daftarNamaUnit);
      judul = null;
      continue;
    }
    if (b === "NO") {
      judul = petaKolom(r);
      continue;
    }
    if (!judul || !/^\d+$/.test(b)) continue;
    const orang = teks(r[judul.NAMA_LENGKAP ?? 2]);
    if (!orang) continue;
    const seksi = /^kepala seksi\s+(.+)$/i.exec(teks(r[judul.JABATAN ?? 3]));
    const unitSeksi = seksi ? unitUntukBlok(seksi[1], daftarNamaUnit) : null;
    if (unitSeksi) aktif = unitSeksi;
    if (!aktif) continue;
    if (!nama.has(aktif)) nama.set(aktif, new Set());
    nama.get(aktif).add(orang.toLowerCase().replace(/\s+/g, " "));
  }
  return new Map([...nama].map(([k, v]) => [k, v.size]));
}

export function slug(s) {
  return teks(s).toLowerCase().normalize("NFKD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
}

function hitung(daftar, kunciFn) {
  const hasil = {};
  for (const x of daftar) {
    const k = kunciFn(x);
    if (k === null || k === undefined) continue;
    hasil[k] = (hasil[k] || 0) + 1;
  }
  return hasil;
}

function rata(daftar) {
  const v = daftar.filter((x) => typeof x === "number");
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function bulat2(v) {
  return typeof v === "number" ? Math.round(v * 100) / 100 : null;
}

/**
 * Rata-rata satu kelompok orang, dihitung dari baris individu yang sudah bersih dari isian ganda
 * (permintaan pemilik produk 2026-09-17): indeks, lima subskala, angka kondisi dalam skala 0-100
 * seperti kolom "Rata-rata T_Skala" sheet 07 ((angka - 1) x 25), gap harapan, dan gap tim
 * (rata-rata Ketidakselarasan orang yang dinilai atasan). Angka per orang tetap dari berkas.
 */
function rataKelompok(orang) {
  return {
    indeks: bulat1(rata(orang.map((o) => o.indeks))),
    skor: Object.fromEntries(SUBSKALA.map((s) => [s.kunci, bulat1(rata(orang.map((o) => o.skor[s.kunci])))])),
    rataKondisi: bulat2(rata(orang.map((o) => (typeof o.kondisi === "number" ? (o.kondisi - 1) * 25 : null)))),
    gapHarapanRata: bulat2(rata(orang.map((o) => o.gapHarapan))),
    gapTim: bulat1(rata(orang.filter((o) => o.pengamatan).map((o) => o.pengamatan.ketidakselarasan))),
  };
}

/** Angka di depan jawaban skala ("4 : Baik - ...", "5: Sangat Baik ..."). */
export function angkaDepan(v) {
  const m = teks(v).match(/^(\d)/);
  return m ? Number(m[1]) : null;
}

function kunciDariSumber(daftar, nilai) {
  const t = teks(nilai);
  return daftar.find((d) => d.sumber === t)?.kunci || null;
}

export function kunciPermintaan(v) {
  const t = teks(v);
  return PERMINTAAN.find((p) => t.startsWith(p.awalan))?.kunci || null;
}

/** Pilihan kebutuhan dukungan, dicocokkan per kata pertama (jawaban di berkas bisa terpotong). */
export function kunciKebutuhan(v) {
  const hasil = [];
  for (const potongan of teks(v).split(",")) {
    const kata = potongan.trim().split(/\s+/)[0];
    const k = KEBUTUHAN.find((x) => x.awalan === kata)?.kunci;
    if (k && !hasil.includes(k)) hasil.push(k);
  }
  return hasil;
}

/** Jenjang unit dari nama unit. */
export function jenjangUnit(nama) {
  const t = teks(nama);
  const m = t.match(/^(TK|SD|SMP|SMA)\b/);
  if (m) return m[1];
  if (/asrama|boarding/i.test(t)) return "Boarding";
  return "Lintas jenjang";
}

function frekuensiBersih(v) {
  const t = teks(v);
  if (!t || t === "(tidak tercatat)") return "Tidak tercatat";
  if (t.includes("|")) return "Lebih dari satu jawaban";
  return t;
}

/** Jawaban terbuka yang kosong atau hanya tanda hubung dianggap tidak menjawab. */
function jawabanTerbuka(v) {
  const t = teks(v);
  if (!t || /^[-\u2013\u2014.\s]+$/.test(t)) return null;
  return t;
}

const TEMA_DIABAIKAN = "(diabaikan)";

/**
 * Label tema yang ditampilkan. Nama tema dibiarkan apa adanya kecuali yang memakai kata yang
 * tidak boleh tampil sebagai label kategori di modul ini.
 */
const LABEL_TEMA_TAMPIL = {
  "Kesehatan fisik & mental": "Kondisi fisik & pikiran",
  "Kondisi pribadi, keluarga & kesehatan": "Kondisi pribadi, keluarga & fisik",
};
export function labelTema(t) {
  const x = teks(t);
  return LABEL_TEMA_TAMPIL[x] || x;
}

// ── Pembaca per sheet ───────────────────────────────────────────────────────────────────────

function bacaAsumsi(rowsPrioritas, judul) {
  const iLabel = judul["ASUMSI & AMBANG (diubah di sini, seluruh kolom ikut)"];
  const asumsi = structuredClone(ASUMSI_BAWAAN);
  if (iLabel === undefined) return asumsi;
  let bagian = "";
  for (const r of rowsPrioritas) {
    const label = teks(r[iLabel]);
    const nilai = angka(r[iLabel + 1]);
    if (!label) continue;
    if (label.startsWith("Bobot SPA") && label.includes("ADA")) { bagian = "ada"; continue; }
    if (label.startsWith("Bobot SPA") && label.includes("TANPA")) { bagian = "tanpa"; continue; }
    if (nilai === null) continue;
    const w = label.match(/^w_([ABCD])/);
    if (w && bagian === "ada") asumsi.bobotDenganPengamatan[w[1]] = nilai;
    else if (w && bagian === "tanpa") asumsi.bobotTanpaPengamatan[w[1]] = nilai;
    else if (label.includes('"Selaras"')) asumsi.labelGap.selaras = nilai;
    else if (label.includes('"Ringan"')) asumsi.labelGap.ringan = nilai;
    else if (label.includes('"Sedang"')) asumsi.labelGap.sedang = nilai;
    else if (label.startsWith("Ambang Pola")) asumsi.ambangPola = nilai;
    else if (label.startsWith("Ambang \"Fungsi rendah\"")) asumsi.ambangFungsi = nilai;
    else if (label.startsWith("Batas atas Ketidakselarasan")) asumsi.batasKompC = nilai;
  }
  return asumsi;
}

function bacaTemaBlok(rows, awalanJudul) {
  const iJudul = cariBaris(rows, (r) => teks(r[0]).startsWith(awalanJudul));
  if (iJudul < 0) return null;
  const blok = { judul: teks(rows[iJudul][0]).replace(/\s*[\u2014\u2013]\s*/g, ": "), terisi: 0, diabaikan: 0, sebutOrang: 0, daftar: [] };
  let i = iJudul + 1;
  for (; i < rows.length; i++) {
    const a = teks(rows[i]?.[0]);
    if (a === "Tema") break;
    if (a.startsWith("Jawaban terisi")) blok.terisi = angka(rows[i][1]) || 0;
    else if (a.startsWith("Diabaikan")) blok.diabaikan = angka(rows[i][1]) || 0;
    else if (a.startsWith("Menyebut orang")) blok.sebutOrang = angka(rows[i][1]) || 0;
  }
  for (i += 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const nama = teks(r[0]);
    if (!nama || nama === "TOTAL") break;
    blok.daftar.push({
      tema: labelTema(nama),
      jumlah: angka(r[1]) || 0,
      porsi: angka(r[2]) || 0,
      kutipan: [r[3], r[4], r[5]].map(teks).filter(Boolean).map((t) => ({ teks: t, sensitif: false })),
    });
  }
  blok.daftar.sort((a, b) => b.jumlah - a.jumlah);
  return blok;
}

function bacaSilang(rows, unitIdDariNama) {
  const i = cariBaris(rows, (r) => teks(r[0]) === "Unit" && teks(r[1]) === "Jawaban terisi");
  if (i < 0) return null;
  const judul = rows[i];
  let akhir = 2;
  while (teks(judul[akhir]) && teks(judul[akhir]) !== "Tema terbanyak di unit") akhir++;
  const tema = judul.slice(2, akhir).map(labelTema);
  const baris = [];
  for (let j = i + 1; j < rows.length; j++) {
    const r = rows[j] || [];
    const nama = teks(r[0]);
    if (!nama || nama === "TOTAL") break;
    const unitId = unitIdDariNama(nama);
    if (!unitId) continue;
    baris.push({ unitId, terisi: angka(r[1]) || 0, nilai: r.slice(2, akhir).map((v) => angka(v) || 0) });
  }
  return { tema, baris };
}

function bacaDitinjau(rows) {
  const i = cariBaris(rows, (r) => teks(r[0]) === "Nama" && teks(r[2]) === "Kolom" && teks(r[4]) === "Isi jawaban");
  const isi = new Set();
  if (i < 0) return isi;
  for (let j = i + 1; j < rows.length; j++) {
    const r = rows[j] || [];
    if (!teks(r[0])) break;
    isi.add(normalKutipan(r[4]));
  }
  return isi;
}

function normalKutipan(t) {
  return teks(t).toLowerCase().replace(/\s+/g, " ");
}

function bacaRingkasanPimpinan(rows) {
  const hasil = [];
  let aktif = null;
  for (const r of rows.slice(2)) {
    const t = teks(r?.[0]).replace(/\s*[\u2014\u2013]\s*/g, ", ");
    if (!t) continue;
    if (/^\d+\.\s/.test(t) || t === "CATATAN KETERBATASAN") {
      aktif = { judul: t.replace(/^\d+\.\s*/, ""), isi: [] };
      hasil.push(aktif);
    } else if (aktif) {
      aktif.isi.push(t);
    }
  }
  return hasil;
}

// ── Pembagian kursi asesmen lanjutan (aturan sheet "06 Daftar Peserta", Ringkasan 2) ────────

/** Penanda yang otomatis memasukkan orang ke daftar (jalur "Penanda"). Ragu dan Harapan datar tidak. */
const PENANDA_OTOMATIS = ["Minta sendiri", "Disampaikan ke atasan"];

/**
 * Menyusun daftar peserta persis mengikuti aturan yang tertulis di sheet 06:
 *   1. semua yang punya penanda otomatis masuk lewat jalur Penanda;
 *   2. sisa kursi (target - penanda) dibagi ke unit sebanding jumlah pengisi unit, dibulatkan ke
 *      bawah; sisa pembulatan diberikan satu-satu ke unit dengan SPA rata-rata tertinggi;
 *   3. kuota tiap unit diisi orang ber-SPA tertinggi di unit itu yang belum masuk;
 *   4. kursi yang tidak terisi (unit kekurangan calon) menjadi "Sisa kursi" untuk SPA tertinggi
 *      di seluruh lembaga.
 * Dipakai dua kali: pada data mentah untuk memastikan aturan ini menghasilkan daftar yang sama
 * dengan berkas, lalu pada data yang sudah bersih dari isian ganda supaya jumlahnya tetap target.
 */
function susunPeserta(individu, unitIds, target) {
  const urutSpa = (a, b) => (b.spa ?? -1) - (a.spa ?? -1) || a.nama.localeCompare(b.nama, "id");
  const hasil = new Map();
  for (const o of individu) if (PENANDA_OTOMATIS.includes(o.penandaBerkas)) hasil.set(o.id, "penanda");
  const sisa = Math.max(0, target - hasil.size);
  const perUnit = unitIds.map((id) => {
    const orang = individu.filter((o) => o.unitId === id);
    const spa = orang.map((o) => o.spa).filter((v) => typeof v === "number");
    return {
      id,
      n: orang.length,
      rataSpa: spa.length ? spa.reduce((a, b) => a + b, 0) / spa.length : 0,
      kuota: individu.length ? Math.floor((sisa * orang.length) / individu.length) : 0,
    };
  });
  let tambahan = sisa - perUnit.reduce((a, u) => a + u.kuota, 0);
  for (const u of [...perUnit].sort((a, b) => b.rataSpa - a.rataSpa || b.n - a.n)) {
    if (tambahan <= 0) break;
    u.kuota += 1;
    tambahan -= 1;
  }
  let kosong = 0;
  for (const u of perUnit) {
    const calon = individu.filter((o) => o.unitId === u.id && !hasil.has(o.id)).sort(urutSpa);
    const ambil = calon.slice(0, u.kuota);
    for (const o of ambil) hasil.set(o.id, "kuota");
    kosong += u.kuota - ambil.length;
  }
  if (kosong > 0) {
    const calon = individu.filter((o) => !hasil.has(o.id)).sort(urutSpa);
    for (const o of calon.slice(0, kosong)) hasil.set(o.id, "sisa");
  }
  return { peserta: hasil, kuota: Object.fromEntries(perUnit.map((u) => [u.id, u.kuota])) };
}

// ── Pembaca utama ───────────────────────────────────────────────────────────────────────────

/**
 * @param {Record<string, any[][]>} sheets
 * @param {{ lembaga: string, sekolahId: string, periodeId: string, sumber?: string, contoh?: boolean }} meta
 */
export function bacaDatasetSw(sheets, meta) {
  const rowsPF = ambilSheet(sheets, SHEET.personal);
  const rowsSkor = ambilSheet(sheets, SHEET.skor);
  const rowsAmati = ambilSheet(sheets, SHEET.pengamatan);
  const rowsPrio = ambilSheet(sheets, SHEET.prioritas);
  const rowsPeserta = ambilSheet(sheets, SHEET.peserta);
  const rowsUnit = ambilSheet(sheets, SHEET.unit);
  const rowsTema = ambilSheet(sheets, SHEET.tema);
  const rowsRingkas = ambilSheet(sheets, SHEET.ringkasan, false);

  const jPF = petaKolom(rowsPF[0]);
  const jSkor = petaKolom(rowsSkor[0]);
  const jAmati = petaKolom(rowsAmati[0]);
  const jPrio = petaKolom(rowsPrio[0]);

  const asumsi = bacaAsumsi(rowsPrio, jPrio);

  // Kolom Personal Form dicari lewat awalan pertanyaan supaya tahan perbedaan tanda baca.
  const kolomPF = (awalan) => {
    const k = Object.keys(jPF).find((j) => j.startsWith(awalan));
    if (k === undefined) throw new Error(`Kolom Personal Form berawalan "${awalan}" tidak ditemukan.`);
    return jPF[k];
  };
  const pf = {
    unit: kolomWajib(jPF, "Unit", SHEET.personal),
    kelompok: 1,
    nama: kolomWajib(jPF, "Nama Lengkap", SHEET.personal),
    lama: kolomWajib(jPF, "Lama Kerja", SHEET.personal),
    atasan: kolomWajib(jPF, "Atasan Langsung", SHEET.personal),
    bertahan: kolomPF("Apa yang selama ini paling membantu"),
    target: kolomPF("Tiga bulan lagi"),
    menaikkan: kolomPF("Apa satu hal yang bisa menaikkan"),
    kebutuhan: kolomPF("Dukungan apa yang paling"),
    menguras: kolomPF("Apa yang paling menguras"),
    diperbaiki: kolomPF("Satu hal yang kalau diperbaiki"),
  };

  // ── 07 Unit: daftar unit dan rata-rata final ──
  const iJudulUnit = cariBaris(rowsUnit, (r) => teks(r[0]) === "Unit" && teks(r[1]) === "Jumlah pegawai");
  if (iJudulUnit < 0) throw new Error(`Judul tabel tidak ditemukan di sheet "${SHEET.unit}".`);
  const jUnit = petaKolom(rowsUnit[iJudulUnit]);
  const kolomKebutuhanUnit = KEBUTUHAN.map((k) => ({ kunci: k.kunci, i: jUnit[k.label] }));

  // Baris "SELURUH LEMBAGA" sheet 07 tidak dipakai: rata-rata lembaga dihitung dari baris bersih.
  const unitMentah = [];
  for (let i = iJudulUnit + 1; i < rowsUnit.length; i++) {
    const r = rowsUnit[i] || [];
    const nama = teks(r[0]);
    if (!nama) break;
    const isi = {
      nama,
      nPegawai: angka(r[jUnit["Jumlah pegawai"]]) || 0,
      nPengisi: angka(r[jUnit["Jumlah pengisi"]]) || 0,
      indeks: angka(r[jUnit["Rata-rata IKD"]]),
      skor: Object.fromEntries(SUBSKALA.map((s) => [s.kunci, angka(r[jUnit[`Rata-rata ${s.kolom}`]])])),
      rataKondisi: angka(r[jUnit["Rata-rata T_Skala"]]),
      gapHarapanRata: angka(r[jUnit["Rata-rata Gap_Harapan"]]),
      gapTim: angka(r[jUnit["Rata-rata gap tim"]]),
      punyaPengamatan: teks(r[jUnit["Punya_Data_Pengamatan"]]) === "Ya",
      kebutuhan: Object.fromEntries(kolomKebutuhanUnit.filter((k) => k.i !== undefined).map((k) => [k.kunci, angka(r[k.i]) || 0])),
    };
    if (nama === "SELURUH LEMBAGA") break;
    unitMentah.push(isi);
  }

  // Jumlah pegawai sebenarnya dari daftar induk; unit yang tidak ada di sana memakai angka sheet 07.
  const kunciInduk = Object.keys(sheets).find((k) => /^wellbeing assessment/i.test(k.trim()));
  const pegawaiInduk = kunciInduk ? bacaDaftarInduk(sheets[kunciInduk], unitMentah.map((u) => u.nama)) : new Map();
  for (const u of unitMentah) {
    if (pegawaiInduk.has(u.nama)) {
      u.nPegawai = pegawaiInduk.get(u.nama);
      u.sumberPegawai = "daftar induk";
    } else {
      u.sumberPegawai = "07 Unit";
    }
  }

  const unitIdDariNama = (() => {
    const peta = new Map(unitMentah.map((u) => [slug(u.nama), `u-${slug(u.nama)}`]));
    return (nama) => peta.get(slug(nama)) || null;
  })();

  // ── 04 Pengamatan: baris per sheet row ──
  const amati = new Map();
  const barisAmatiSemua = [];
  for (let i = 1; i < rowsAmati.length; i++) {
    const r = rowsAmati[i] || [];
    if (!teks(r[jAmati["Nama"]])) continue;
    const indikator = INDIKATOR.filter((k) => angka(r[jAmati[k.kode]]) === 1).map((k) => k.kode);
    const pimpinan = teks(r[jAmati["Nama pimpinan pengisi"]]);
    const baris = {
      barisSheet: i + 1,
      nama: teks(r[jAmati["Nama"]]),
      unitId: unitIdDariNama(r[jAmati["Unit Personal Form (pemetaan)"]]),
      pimpinan: pimpinan ? pimpinan.split("|").map((p) => p.trim()).filter(Boolean) : [],
      frekuensi: frekuensiBersih(r[jAmati["Frekuensi_Interaksi"]]),
      indikator,
      centang: {
        beban: angka(r[jAmati["Centang_Beban"]]) || 0,
        perubahan: angka(r[jAmati["Centang_Perubahan"]]) || 0,
        kekuatan: angka(r[jAmati["Centang_Kekuatan"]]) || 0,
        konteks: angka(r[jAmati["Centang_Konteks"]]) || 0,
      },
    };
    amati.set(i + 1, baris);
    if (baris.pimpinan.length && baris.unitId) barisAmatiSemua.push(baris);
  }

  // ── 05 Prioritas: diikat ke baris 03 lewat "H: Baris 03" ──
  const prioDariBaris03 = new Map();
  const baris05Ke03 = new Map();
  for (let i = 1; i < rowsPrio.length; i++) {
    const r = rowsPrio[i] || [];
    const b03 = angka(r[jPrio["H: Baris 03"]]);
    if (!teks(r[jPrio["Nama"]]) || b03 === null) continue;
    prioDariBaris03.set(b03, r);
    baris05Ke03.set(i + 1, b03);
  }

  // ── 06 Daftar Peserta ──
  const iJudulPeserta = cariBaris(rowsPeserta, (r) => teks(r[0]) === "Nama" && teks(r[1]) === "Unit" && teks(r[6]) === "Jalur");
  if (iJudulPeserta < 0) throw new Error(`Tabel daftar tidak ditemukan di sheet "${SHEET.peserta}".`);
  const jPes = petaKolom(rowsPeserta[iJudulPeserta]);
  const pesertaDari03 = new Map();
  for (let i = iJudulPeserta + 1; i < rowsPeserta.length; i++) {
    const r = rowsPeserta[i] || [];
    if (!teks(r[0])) continue;
    const b05 = angka(r[jPes["H: Baris 05"]]);
    const b03 = baris05Ke03.get(b05);
    if (b03 === undefined) throw new Error(`Baris peserta "${teks(r[0])}" tidak tertaut ke sheet 05 (H: Baris 05 = ${b05}).`);
    pesertaDari03.set(b03, { jalur: kunciDariSumber(JALUR, r[jPes["Jalur"]]) });
  }
  const ringkasPeserta = {};
  for (const r of rowsPeserta.slice(0, iJudulPeserta)) {
    const a = teks(r?.[0]);
    if (a === "Target peserta") ringkasPeserta.target = angka(r[1]);
    if (a.startsWith("Catatan:")) ringkasPeserta.catatan = a;
    const j = JALUR.find((x) => x.sumber === a);
    if (j) (ringkasPeserta.perJalurBerkas ||= {})[j.kunci] = angka(r[1]) || 0;
  }
  const kuotaUnit = {};
  const iKuota = cariBaris(rowsPeserta, (r) => teks(r[0]) === "Unit" && teks(r[5]) === "Kuota unit final");
  if (iKuota >= 0) {
    for (let i = iKuota + 1; i < rowsPeserta.length; i++) {
      const r = rowsPeserta[i] || [];
      const nama = teks(r[0]);
      if (!nama || nama === "TOTAL") break;
      const id = unitIdDariNama(nama);
      if (id) kuotaUnit[id] = angka(r[5]) || 0;
    }
  }

  // ── 08 Tema: blok, tabel silang, tanda tinjauan, tema per orang ──
  const tema = {
    bertahan: bacaTemaBlok(rowsTema, "KOLOM J "),
    menguras: bacaTemaBlok(rowsTema, "KOLOM AI "),
    diperbaiki: bacaTemaBlok(rowsTema, "KOLOM AJ "),
    silangMenguras: bacaSilang(rowsTema, unitIdDariNama),
  };
  const ditinjau = bacaDitinjau(rowsTema);
  const jTema = petaKolom(rowsTema[0]);
  const temaDariBaris = new Map();
  if ("Baris PF" in jTema) {
    for (const r of rowsTema.slice(1)) {
      const b = angka(r?.[jTema["Baris PF"]]);
      if (b === null) continue;
      const ambil = (kol) => {
        const t = teks(r[jTema[kol]]);
        return t && t !== TEMA_DIABAIKAN ? labelTema(t) : null;
      };
      temaDariBaris.set(b, {
        tema: { bertahan: ambil("Tema J"), menguras: ambil("Tema AI"), diperbaiki: ambil("Tema AJ") },
        sebutOrang: ["Sebut orang J", "Sebut orang AI", "Sebut orang AJ"].some((k) => angka(r[jTema[k]]) === 1),
        tandaTinjauan: Boolean(teks(r[jTema["Penanda tinjauan"]])),
      });
    }
  }

  // ── Individu: 03 Skor Individu sebagai tulang punggung, satu baris = satu pengisi ──
  const individu = [];
  const kelompokUnit = {};
  const jawabanSensitif = new Set(ditinjau);
  for (let i = 1; i < rowsSkor.length; i++) {
    const r = rowsSkor[i] || [];
    const nama = teks(r[jSkor["Nama"]]);
    if (!nama) continue;
    const barisSheet = i + 1;
    const p = rowsPF[i] || [];
    if (teks(p[pf.nama]) !== nama) {
      throw new Error(`Baris ${barisSheet}: nama di "${SHEET.skor}" (${nama}) tidak sama dengan Personal Form (${teks(p[pf.nama])}).`);
    }
    const q = prioDariBaris03.get(barisSheet);
    if (!q) throw new Error(`Baris ${barisSheet} (${nama}) tidak punya pasangan di sheet "${SHEET.prioritas}".`);

    const unitId = unitIdDariNama(r[jSkor["Unit"]]);
    if (!unitId) throw new Error(`Unit "${teks(r[jSkor["Unit"]])}" (baris ${barisSheet}) tidak ada di sheet "${SHEET.unit}".`);
    kelompokUnit[unitId] ||= teks(p[pf.kelompok]) === "sekolah" ? "sekolah" : "layanan";

    const adaAmati = teks(q[jPrio["Ada_Pengamatan"]]) === "Ya";
    const a04 = adaAmati ? amati.get(angka(q[jPrio["H: Baris 04"]])) : null;
    const pola = kunciDariSumber(POLA, q[jPrio["Pola"]]);
    const kebutuhanTeramati = angka(q[jPrio["Kebutuhan_Teramati"]]);
    const kompA = angka(q[jPrio["Komp_A (100-IKD)"]]);

    const jenjangMentah = r[jSkor["Jenjang"]];
    const infoTema = temaDariBaris.get(barisSheet);
    const jawaban = {
      bertahan: jawabanTerbuka(p[pf.bertahan]),
      menaikkan: jawabanTerbuka(p[pf.menaikkan]),
      menguras: jawabanTerbuka(p[pf.menguras]),
      diperbaiki: jawabanTerbuka(p[pf.diperbaiki]),
    };
    if (infoTema?.sebutOrang || infoTema?.tandaTinjauan) {
      for (const v of Object.values(jawaban)) if (v) jawabanSensitif.add(normalKutipan(v));
    }

    individu.push({
      id: `p${barisSheet}`,
      nama,
      unitId,
      jabatan: teks(r[jSkor["Jabatan"]]),
      jenjang: jenjangMentah && jenjangMentah !== 0 ? teks(jenjangMentah) : null,
      masaKerja: teks(p[pf.lama]).replace("1 sampai 3, 4 sampai 7", "1 sampai 7 tahun"),
      atasan: teks(r[jSkor["Atasan Langsung"]]) || teks(p[pf.atasan]),
      skor: Object.fromEntries(SUBSKALA.map((s) => [s.kunci, angka(q[jPrio[s.kolom]])])),
      indeks: angka(q[jPrio["IKD"]]),
      kondisi: angka(q[jPrio["Angka_Kondisi (kol I)"]]),
      target: angkaDepan(p[pf.target]),
      gapHarapan: angka(q[jPrio["Gap_Harapan"]]),
      permintaan: kunciPermintaan(q[jPrio["Permintaan (kol AH)"]]),
      pola,
      spa: angka(q[jPrio["SPA"]]),
      penandaBerkas: teks(q[jPrio["Penanda"]]) || null,
      // Kolom Catatan_Skor, bukan Ada_Pengamatan: orang yang interaksinya "Jarang" punya
      // pengamatan tapi skor prioritasnya tetap memakai bobot tanpa pengamatan.
      diskorTanpaPengamatan: teks(q[jPrio["Catatan_Skor"]]) === "Tanpa data pengamatan",
      pengamatan: adaAmati ? {
        pimpinan: a04?.pimpinan || [],
        frekuensi: frekuensiBersih(q[jPrio["Frekuensi_Interaksi"]]),
        indikator: a04?.indikator || [],
        centang: {
          beban: angka(q[jPrio["Centang_Beban"]]) || 0,
          perubahan: angka(q[jPrio["Centang_Perubahan"]]) || 0,
          kekuatan: angka(q[jPrio["Centang_Kekuatan"]]) || 0,
          konteks: angka(q[jPrio["Centang_Konteks"]]) || 0,
        },
        gap: {
          beban: angka(q[jPrio["Gap_Beban"]]),
          energi: angka(q[jPrio["Gap_Energi"]]),
          dukungan: angka(q[jPrio["Gap_Dukungan"]]),
        },
        ketidakselarasan: angka(q[jPrio["Ketidakselarasan"]]),
        labelGap: teks(q[jPrio["Label_Gap"]]) || null,
        kebutuhanTeramati,
        kebutuhanDirasakan: kompA,
        kuadran: kuadranDari(pola, kompA, asumsi.batasKuadran),
      } : null,
      peserta: pesertaDari03.get(barisSheet) || null,
      kebutuhan: kunciKebutuhan(p[pf.kebutuhan]),
      jawaban,
      tema: infoTema?.tema || { bertahan: null, menguras: null, diperbaiki: null },
      catatanData: null,
    });
  }

  // Sebelum isian ganda dibuang: pastikan aturan kursi di atas memang menghasilkan daftar yang
  // sama dengan berkas. Kalau tidak, daftar berkas yang dipakai dan selisihnya dicatat di meta.
  const targetPeserta = ringkasPeserta.target ?? pesertaDari03.size;
  const unitIds = unitMentah.map((u) => unitIdDariNama(u.nama)).filter(Boolean);
  const ujiKursi = susunPeserta(individu, unitIds, targetPeserta);
  const selisihKursi = [];
  for (const o of individu) {
    const berkas = o.peserta?.jalur || null;
    const hitung = ujiKursi.peserta.get(o.id) || null;
    if (berkas !== hitung) selisihKursi.push({ id: o.id, nama: o.nama, berkas, hitung });
  }
  const kursi = { cocokDenganBerkas: selisihKursi.length === 0, selisih: selisihKursi };

  // Isian ganda dibuang: nama, unit, dan jabatan yang sama dianggap orang yang sama mengisi dua
  // kali; yang dipakai isian terakhir (baris paling bawah). Nama sama di unit atau jabatan lain
  // dianggap orang berbeda dan hanya diberi catatan. Rata-rata unit dan lembaga di sheet 07 tetap
  // dipakai apa adanya (masih memuat isian ganda) karena FIR tidak menghitung ulang skor.
  const kunciOrang = (o) => `${o.nama.trim().toLowerCase()}|${o.unitId}|${(o.jabatan || "").trim().toLowerCase()}`;
  const terakhir = new Map();
  for (const o of individu) terakhir.set(kunciOrang(o), o.id);
  const isianGanda = individu.filter((o) => terakhir.get(kunciOrang(o)) !== o.id).map((o) => ({ id: o.id, nama: o.nama }));
  const dibuang = new Set(isianGanda.map((o) => o.id));
  const individuBersih = individu.filter((o) => !dibuang.has(o.id));
  const namaSama = new Map();
  for (const o of individuBersih) namaSama.set(o.nama.trim().toLowerCase(), (namaSama.get(o.nama.trim().toLowerCase()) || 0) + 1);
  for (const o of individuBersih) {
    o.catatanData = namaSama.get(o.nama.trim().toLowerCase()) > 1
      ? "Ada pegawai lain dengan nama yang sama di unit atau jabatan berbeda; keduanya dianggap orang berbeda."
      : null;
  }
  individu.length = 0;
  individu.push(...individuBersih);

  // Setelah bersih, kursi dibagi ulang dengan aturan yang sama supaya jumlah peserta tetap target
  // (isian ganda sempat menduduki dua kursi). Hanya dilakukan kalau aturannya terbukti cocok.
  if (isianGanda.length && kursi.cocokDenganBerkas) {
    const ulang = susunPeserta(individu, unitIds, targetPeserta);
    for (const o of individu) {
      const jalur = ulang.peserta.get(o.id);
      o.peserta = jalur ? { jalur } : null;
    }
    for (const id of Object.keys(ulang.kuota)) kuotaUnit[id] = ulang.kuota[id];
  }

  // Kutipan tema yang sama dengan jawaban bertanda tinjauan atau menyebut orang tidak dikirim.
  for (const blok of [tema.bertahan, tema.menguras, tema.diperbaiki]) {
    if (!blok) continue;
    for (const t of blok.daftar) t.kutipan = t.kutipan.filter((k) => !jawabanSensitif.has(normalKutipan(k.teks)));
  }

  // ── Unit: rata-rata final dari 07 + sebaran yang dihitung dari orang ──
  const peserta = individu.filter((o) => o.peserta);
  const skorMin = Object.fromEntries(SUBSKALA.map((s) => [s.kunci, Math.min(...individu.map((o) => o.skor[s.kunci]).filter((v) => v !== null))]));

  const unit = unitMentah.map((u) => {
    const id = unitIdDariNama(u.nama);
    const orang = individu.filter((o) => o.unitId === id);
    const barisAmati = barisAmatiSemua.filter((b) => b.unitId === id);
    const rataUnit = rataKelompok(orang);
    return {
      id,
      nama: u.nama,
      kelompok: kelompokUnit[id] || "layanan",
      jenjang: jenjangUnit(u.nama),
      // Pengisi bisa melebihi daftar induk (orang di luar daftar ikut mengisi atas nama unit ini);
      // jumlah pegawai tidak boleh lebih kecil dari yang benar-benar mengisi.
      nPegawai: Math.max(u.nPegawai, orang.length),
      nPegawaiInduk: u.sumberPegawai === "daftar induk" ? u.nPegawai : null,
      indeks: rataUnit.indeks,
      skor: rataUnit.skor,
      rataKondisi: rataUnit.rataKondisi,
      gapHarapanRata: rataUnit.gapHarapanRata,
      ...ringkasKelompok(orang, asumsi, null),
      nPengisi: orang.length,
      nPengisiBerkas: u.nPengisi,
      kuotaPeserta: kuotaUnit[id] ?? null,
      pengamatan: u.punyaPengamatan
        ? ringkasPengamatan(orang, barisAmati, asumsi, { gapTim: rataUnit.gapTim, pimpinanSemua: true })
        : null,
    };
  });

  const barisTanpaUnit = barisAmatiSemua.length;
  // Rata-rata dan hitungan lembaga juga dari baris bersih; sheet 07 ("SELURUH LEMBAGA") tidak dipakai.
  const rataLembaga = rataKelompok(individu);
  const lembagaKebutuhan = jumlahkan(unit.map((u) => u.kebutuhan));
  const unitTanpaPengamatan = unit.filter((u) => !u.pengamatan).map((u) => u.nama);

  const lembaga = {
    nama: meta.lembaga,
    nPengisi: individu.length,
    nIsianGanda: isianGanda.length,
    nUnit: unit.length,
    nUnitPengamatan: unit.length - unitTanpaPengamatan.length,
    unitTanpaPengamatan,
    nPegawaiPengamatan: individu.filter((o) => o.pengamatan).length,
    nUnitDibawahAmbang: unit.filter((u) => u.nPengisi < asumsi.minPengisiUnit).length,
    indeks: rataLembaga.indeks,
    skor: rataLembaga.skor,
    rataKondisi: rataLembaga.rataKondisi,
    gapHarapanRata: rataLembaga.gapHarapanRata,
    skorMin,
    ...ringkasKelompok(individu, asumsi, lembagaKebutuhan),
    pengamatan: ringkasPengamatan(individu, barisAmatiSemua, asumsi, { gapTim: rataLembaga.gapTim }),
    nBarisPengamatan: barisTanpaUnit,
    pesertaInfo: {
      target: targetPeserta,
      // Catatan "baris kembar" dari berkas tidak dipakai: isian ganda sudah dibuang di sini.
      catatan: null,
      tanpaPengamatan: peserta.filter((o) => o.diskorTanpaPengamatan).length,
    },
  };

  const ringkasanPimpinan = bacaRingkasanPimpinan(rowsRingkas);

  return {
    versi: 1,
    meta: {
      lembaga: meta.lembaga,
      sekolahId: meta.sekolahId,
      periodeId: meta.periodeId,
      sumber: meta.sumber || null,
      dibuat: meta.dibuat || null,
      contoh: Boolean(meta.contoh),
      isianGanda,
      kursi,
    },
    asumsi,
    lembaga,
    unit,
    individu,
    tema,
    ringkasanPimpinan,
  };
}

/**
 * Kuadran mengikuti Pola dari sheet 05 supaya layar tidak pernah memberi dua kesimpulan yang
 * bertentangan. Batas hanya dipakai untuk memisah pola "Selaras" menjadi sama-sama berat atau
 * sama-sama baik, berdasarkan seberapa berat yang dirasakan pegawai (100 - indeks).
 */
function kuadranDari(pola, dirasakan, batas) {
  if (pola === "tekanan") return "tersembunyi";
  if (pola === "selisih") return "teramati";
  if (pola === "selaras") return dirasakan !== null && dirasakan >= batas ? "keduanya" : "menopang";
  return null;
}

function jumlahkan(daftarObjek) {
  const hasil = {};
  for (const o of daftarObjek) for (const [k, v] of Object.entries(o || {})) hasil[k] = (hasil[k] || 0) + (v || 0);
  return hasil;
}

function histogram(nilai) {
  const h = {};
  for (const v of nilai) {
    if (typeof v !== "number") continue;
    const k = String(bulat1(v));
    h[k] = (h[k] || 0) + 1;
  }
  return h;
}

/**
 * Sebaran untuk satu kelompok orang (unit atau seluruh lembaga): angka kondisi, histogram skor,
 * harapan perubahan, kebutuhan dukungan, pertanyaan pendalaman, dan komposisi peserta.
 */
function ringkasKelompok(orang, asumsi, kebutuhanBerkas) {
  const peserta = orang.filter((o) => o.peserta);
  const kebutuhanOrang = jumlahkan(orang.map((o) => Object.fromEntries(o.kebutuhan.map((k) => [k, 1]))));
  const kebutuhan = kebutuhanBerkas && Object.keys(kebutuhanBerkas).length ? kebutuhanBerkas : kebutuhanOrang;

  const sudahTertinggi = orang.filter((o) => o.kondisi === 5);
  const lainnya = orang.filter((o) => typeof o.kondisi === "number" && o.kondisi < 5 && typeof o.gapHarapan === "number");

  return {
    nPengisi: orang.length,
    kondisi: Object.fromEntries([1, 2, 3, 4, 5].map((n) => [n, orang.filter((o) => o.kondisi === n).length])),
    target: Object.fromEntries([1, 2, 3, 4, 5].map((n) => [n, orang.filter((o) => o.target === n).length])),
    distribusi: {
      ...Object.fromEntries(SUBSKALA.map((s) => [s.kunci, histogram(orang.map((o) => o.skor[s.kunci]))])),
      indeks: histogram(orang.map((o) => o.indeks)),
    },
    harapan: {
      naik: lainnya.filter((o) => o.gapHarapan > 0).length,
      tetap: lainnya.filter((o) => o.gapHarapan === 0).length,
      turun: lainnya.filter((o) => o.gapHarapan < 0).length,
      sudahTertinggi: sudahTertinggi.length,
      datarRendah: lainnya.filter((o) => o.kondisi <= 3 && o.gapHarapan <= 0).length,
      besarKenaikan: hitung(lainnya.filter((o) => o.gapHarapan > 0), (o) => (o.gapHarapan >= 3 ? "3+" : String(o.gapHarapan))),
    },
    kebutuhan,
    kebutuhanTop: kebutuhanTeratas(kebutuhan, 3),
    permintaan: Object.fromEntries(PERMINTAAN.map((p) => [p.kunci, orang.filter((o) => o.permintaan === p.kunci).length])),
    peserta: {
      total: peserta.length,
      perJalur: Object.fromEntries(JALUR.map((j) => [j.kunci, peserta.filter((o) => o.peserta.jalur === j.kunci).length])),
      perAlasan: hitungAlasan(peserta, asumsi),
      tanpaPengamatan: peserta.filter((o) => o.diskorTanpaPengamatan).length,
    },
    tekananTakTerlihat: orang.filter((o) => o.pola === "tekanan").length,
  };
}

/**
 * Ringkasan Form B untuk satu kelompok. `barisAmati` = baris sheet 04 (semua yang dinilai
 * pimpinan, termasuk yang tidak mengisi Form A); `orang` = pengisi Form A di kelompok itu.
 */
function ringkasPengamatan(orang, barisAmati, asumsi, { gapTim = null, pimpinanSemua = false } = {}) {
  const dinilai = barisAmati.length;
  if (!dinilai) return null;
  const a = lengkapiAsumsi(asumsi);
  const pimpinan = [...new Set(barisAmati.flatMap((b) => b.pimpinan))];
  const orangDenganAmati = orang.filter((o) => o.pengamatan);

  const qc = pimpinan.map((nama) => {
    const tim = barisAmati.filter((b) => b.pimpinan.includes(nama));
    const centangPerOrang = tim.map((b) => b.indikator.length);
    const total = centangPerOrang.reduce((x, y) => x + y, 0);
    const rataCentang = tim.length ? total / tim.length : 0;
    const porsiIsi = rataCentang / INDIKATOR.length;
    const nTeratas = Math.max(1, Math.ceil(tim.length * 0.2));
    const teratas = [...centangPerOrang].sort((x, y) => y - x).slice(0, nTeratas).reduce((x, y) => x + y, 0);
    const pemusatan = total > 0 ? teratas / total : 0;
    return {
      pimpinan: nama,
      nDinilai: tim.length,
      rataCentang: bulat1(rataCentang),
      porsiIsi: Math.round(porsiIsi * 1000) / 1000,
      pemusatan: Math.round(pemusatan * 1000) / 1000,
      nTeratas,
      terlaluBanyak: porsiIsi >= a.qcPimpinan.banyakMin,
      terlaluSedikit: rataCentang < a.qcPimpinan.sedikitMaks,
      memusat: tim.length >= a.qcPimpinan.pusatTimMin && pemusatan >= a.qcPimpinan.pusatMin,
    };
  });

  return {
    pimpinan: pimpinanSemua ? pimpinan : undefined,
    nDinilai: dinilai,
    nPengisiDenganPengamatan: orangDenganAmati.length,
    rataCentang: Object.fromEntries(["beban", "perubahan", "kekuatan", "konteks"].map((k) => [k, bulat1(rata(barisAmati.map((b) => b.centang[k])) ?? 0)])),
    indikatorPorsi: Object.fromEntries(INDIKATOR.map((k) => [k.kode, Math.round((barisAmati.filter((b) => b.indikator.includes(k.kode)).length / dinilai) * 1000) / 1000])),
    frekuensi: hitung(barisAmati, (b) => b.frekuensi),
    kuadran: hitung(orangDenganAmati, (o) => o.pengamatan.kuadran),
    pola: hitung(orangDenganAmati, (o) => o.pola),
    gapTim,
    labelKeselarasan: labelKeselarasan(gapTim, a),
    qc: pimpinanSemua ? qc : undefined,
  };
}

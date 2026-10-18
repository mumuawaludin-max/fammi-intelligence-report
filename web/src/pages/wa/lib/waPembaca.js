// Pembaca berkas olahan Wellbeing Assessment ("<lembaga> - Master - Olahan.xlsx", hasil prompt
// docs/Prompt_Wellbeing_Assessment_Excel.md). Fungsi murni: menerima isi sheet sebagai array
// baris (header: 1) dan mengembalikan dataset berbentuk tetap (docs/wa-wellbeing-assessment-plan.md
// bagian 5). Dipakai CLI scripts/wa/baca-berkas-wa.mjs dan generator data contoh.
//
// Aturan:
// - Angka dipindahkan apa adanya. Tidak ada rata-rata, persen, korelasi, atau frekuensi yang
//   dihitung di sini. Satu-satunya turunan: kategori PROTEK dari RATA-RATA kelompok, dengan
//   ambang yang dibaca dari sheet PARAMETER (berkas belum punya kolomnya, lihat butir 11.7).
// - Kolom rahasia TIDAK pernah disalin: cerita kelelahan (BB), orang yang dipercaya (BC, BD),
//   nomor WhatsApp (CB), dan teks unit asli. Pembaca mengambil kolom yang dibutuhkan saja.
// - Penanda "perlu perhatian ahli" dan ada-tidaknya cerita hanya disimpan di baris narasi
//   respons_cerita (yang tidak terbaca Human Capital), tidak di data individu.

import {
  ASPEK, KATA_TERLARANG, KODE_PILIHAN, KODE_TERBUKA, KUNCI_DIMENSI, kunciKategoriItem, kunciKategoriKepuasan, kunciKategoriProtek,
} from "./waMeta.js";

export const SHEET = {
  individu: "INDIVIDU",
  kelompok: "KELOMPOK",
  pilihan: "PILIHAN",
  testimoni: "TESTIMONI",
  item: "ITEM",
  parameter: "PARAMETER",
  qc: "CATATAN_QC",
};

const KOLOM_WAJIB_INDIVIDU = [
  "id_responden", "dipakai", "unit_normal", "jenjang", "kelompok_jabatan", "protek_total", "protek_pct",
  "protek_kategori", "item_json", "kepuasan_rata", "kepuasan_kategori5", "kepuasan_kategori3", "laporan_json",
];
const KOLOM_WAJIB_KELOMPOK = ["cakupan", "nama", "n_responden", "protek_rata", "protek_pct", "item_json", "kepuasan_rata", "laporan_json"];

// ── Utilitas ────────────────────────────────────────────────────────────────────────────────

function teks(v) {
  return v === null || v === undefined ? "" : String(v).trim();
}

/** Sama persis dengan slug() modul sw, supaya id unit wa = id unit sw untuk nama yang sama. */
export function slug(s) {
  return teks(s).toLowerCase().normalize("NFKD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
}

function angka(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const t = teks(v).replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function ya(v) {
  return teks(v).toLowerCase() === "ya";
}

/** JSON dari sel; galat parse dilaporkan lewat `galat` supaya pembaca bisa menolak berkas. */
function jsonSel(v, cadangan, galat, lokasi) {
  const t = teks(v);
  if (!t) return cadangan;
  try {
    return JSON.parse(t);
  } catch (e) {
    galat.push(`${lokasi}: JSON tidak terbaca (${e.message})`);
    return cadangan;
  }
}

/** Baris sheet (array of array, baris pertama header) jadi array objek. Baris kosong dibuang. */
export function barisObjek(rows) {
  if (!rows?.length) return [];
  const kepala = rows[0].map((h) => teks(h));
  return rows.slice(1)
    .filter((r) => r && r.some((c) => teks(c) !== ""))
    .map((r) => Object.fromEntries(kepala.map((h, i) => [h, r[i] ?? null]).filter(([h]) => h)));
}

function cekKolom(objek, wajib, namaSheet) {
  const ada = new Set(Object.keys(objek[0] || {}));
  const kurang = wajib.filter((k) => !ada.has(k));
  if (kurang.length) throw new Error(`Sheet ${namaSheet} tidak punya kolom: ${kurang.join(", ")}`);
}

/**
 * Ambang dari teks PARAMETER, mis. "1-70 Perlu Pendampingan; 71-140 Perlu Perhatian; 141-252 Baik".
 * Label kategori terbawah gaya lama juga terbaca (lihat kunciKategoriProtek).
 * Hasil: [{min, max, kunci}] urut naik.
 */
export function ambangDariTeks(t) {
  return teks(t)
    .split(";")
    .map((bagian) => bagian.trim().match(/^(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)\s+(.+)$/))
    .filter(Boolean)
    .map((m) => ({ min: Number(m[1].replace(",", ".")), max: Number(m[2].replace(",", ".")), kunci: kunciKategoriProtek(m[3]) }))
    .filter((a) => a.kunci)
    .sort((a, b) => a.min - b.min);
}

/**
 * Kategori untuk nilai rata-rata. Rentang berkas ditulis bilangan bulat (1-70, 71-140), jadi
 * rata-rata 140,4 masuk rentang yang batas bawahnya paling dekat di bawahnya.
 */
export function kategoriDariAmbang(ambang, nilai) {
  if (typeof nilai !== "number" || !ambang?.length) return null;
  let hasil = null;
  for (const a of ambang) if (nilai >= a.min) hasil = a.kunci;
  return hasil;
}

export function kunciKelompok(cakupan, nama) {
  if (cakupan === "lembaga") return "lembaga";
  const awalan = { jenjang: "j", unit: "u", kelompok_jabatan: "kj" }[cakupan] || cakupan;
  return `${awalan}-${slug(nama)}`;
}

/** Bintang dari berkas; kalau kosong, null (tampilan memakai rata-rata untuk lebar isian). */
function bintang(v) {
  return angka(v);
}

/**
 * Label kategori terbawah gaya lama dilarang tampil (keputusan pemilik produk 2026-10-19). Narasi
 * dari berkas olahan lama masih bisa memuatnya: sebagai nama kategori (huruf besar) diganti
 * "Perlu Pendampingan", sebagai kata sifat (huruf kecil) diganti "berhati-hati". Kutipan verbatim
 * pegawai di Testimoni TIDAK diubah karena itu kata-kata mereka sendiri.
 */
export function bersihkanKata(nilai) {
  if (typeof nilai === "string") {
    if (!KATA_TERLARANG.test(nilai)) return nilai;
    return nilai
      .replace(new RegExp(`ke${KATA_TERLARANG.source}an`, "gi"), (k) => (k[0] === k[0].toUpperCase() ? "Kehati-hatian" : "kehati-hatian"))
      .replace(new RegExp(KATA_TERLARANG.source, "gi"), (k) => (k[0] === k[0].toUpperCase() ? "Perlu Pendampingan" : "berhati-hati"));
  }
  if (Array.isArray(nilai)) return nilai.map(bersihkanKata);
  if (nilai && typeof nilai === "object") return Object.fromEntries(Object.entries(nilai).map(([k, v]) => [k, bersihkanKata(v)]));
  return nilai;
}

// ── Pembaca per sheet ───────────────────────────────────────────────────────────────────────

export function bacaParameter(rows) {
  const hasil = {};
  for (const r of barisObjek(rows)) {
    const nama = teks(r.nama);
    if (nama) hasil[nama] = r.nilai ?? null;
  }
  return hasil;
}

export function bacaItem(rows) {
  return barisObjek(rows).map((r) => ({
    kode: teks(r.kode),
    instrumen: teks(r.instrumen),
    kunci: teks(r.aspek_atau_dimensi),
    labelAspek: teks(r.label_aspek),
    teksAsli: teks(r.teks_asli),
    teksSingkat: teks(r.teks_singkat) || teks(r.teks_asli),
    arahAsli: teks(r.arah_asli),
  })).filter((r) => r.kode);
}

function itemProtekIndividu(json) {
  return (json || []).map((x) => ({
    kode: x.kode,
    aspek: x.aspek,
    skor: angka(x.skor),
    pct: angka(x.pct),
    kategori: kunciKategoriItem(x.kategori),
  }));
}

function itemProtekKelompok(json) {
  return (json || []).map((x) => ({
    kode: x.kode,
    aspek: x.aspek,
    rata: angka(x.rata),
    pct: angka(x.pct),
    kategori: kunciKategoriItem(x.kategori),
  }));
}

function bacaIndividu(r, testimoni, galat) {
  const id = teks(r.id_responden);
  const kolomNama = Object.keys(r).find((k) => /nama lengkap/i.test(k));
  const aspek = Object.fromEntries(ASPEK.map((a) => [a.kunci, {
    skor: angka(r[`${a.kunci}_skor`]),
    pct: angka(r[`${a.kunci}_pct`]),
    kategori: kunciKategoriProtek(r[`${a.kunci}_kategori`]),
  }]));
  const dimensi = Object.fromEntries(KUNCI_DIMENSI.map((d) => [d, {
    rata: angka(r[`kep_${d}`]),
    kategori: kunciKategoriKepuasan(r[`kep_${d}_kategori`]),
  }]));
  const pilihan = Object.fromEntries(KODE_PILIHAN.map((k) => [k, jsonSel(r[`pilihan_${k}_json`], [], galat, `INDIVIDU ${id} pilihan_${k}_json`)]));
  return {
    id,
    nama: teks(kolomNama ? r[kolomNama] : ""),
    jenisKelamin: teks(r.jenis_kelamin_bersih) || null,
    usia: angka(r.usia),
    unitId: kunciKelompok("unit", r.unit_normal),
    unit: teks(r.unit_normal),
    jenjang: teks(r.jenjang),
    kelompokJabatan: teks(r.kelompok_jabatan),
    jabatan: teks(r.jabatan_bersih),
    peranTestimoni: teks(r.peran_testimoni) || "Lainnya",
    isianGanda: ya(r.isian_ganda),
    protek: {
      total: angka(r.protek_total),
      pct: angka(r.protek_pct),
      kategori: kunciKategoriProtek(r.protek_kategori),
      aspek,
      aspekTertinggi: teks(r.aspek_tertinggi) || null,
      aspekTerendah: teks(r.aspek_terendah) || null,
      item: itemProtekIndividu(jsonSel(r.item_json, [], galat, `INDIVIDU ${id} item_json`)),
      nItem: { kuat: angka(r.n_item_kuat), cukup: angka(r.n_item_cukup), perlu: angka(r.n_item_perlu) },
    },
    kepuasan: {
      rata: angka(r.kepuasan_rata),
      kategori5: kunciKategoriKepuasan(r.kepuasan_kategori5),
      kategori3: kunciKategoriKepuasan(r.kepuasan_kategori3),
      bintang: bintang(r.kepuasan_bintang),
      dimensi,
      dimensiTertinggi: teks(r.kep_dimensi_tertinggi) || null,
      dimensiTerendah: teks(r.kep_dimensi_terendah) || null,
    },
    pilihan,
    testimoni,
  };
}

function bacaKelompok(r, pilihan, ambang, galat) {
  const cakupan = teks(r.cakupan);
  const nama = teks(r.nama);
  const kunci = kunciKelompok(cakupan, nama);
  const aspek = Object.fromEntries(ASPEK.map((a) => {
    const rata = angka(r[`${a.kunci}_rata`]);
    return [a.kunci, {
      rata,
      pct: angka(r[`${a.kunci}_pct`]),
      kategoriRata: kategoriDariAmbang(ambang.aspek, rata),
      n: {
        baik: angka(r[`${a.kunci}_n_baik`]) ?? 0,
        perluPerhatian: angka(r[`${a.kunci}_n_perlu_perhatian`]) ?? 0,
        pendampingan: angka(r[`${a.kunci}_n_pendampingan`] ?? r[`${a.kunci}_n_waspada`]) ?? 0,
      },
    }];
  }));
  const dimensi = Object.fromEntries(KUNCI_DIMENSI.map((d) => [d, {
    rata: angka(r[`kep_${d}_rata`]),
    kategori: kunciKategoriKepuasan(r[`kep_${d}_kategori5`]),
    n: {
      sangatPuas: angka(r[`kep_${d}_n_sangat_puas`]) ?? 0,
      puas: angka(r[`kep_${d}_n_puas`]) ?? 0,
      netral: angka(r[`kep_${d}_n_netral`]) ?? 0,
      tidakPuas: angka(r[`kep_${d}_n_tidak_puas`]) ?? 0,
      sangatTidakPuas: angka(r[`kep_${d}_n_sangat_tidak_puas`]) ?? 0,
    },
  }]));
  const protekRata = angka(r.protek_rata);
  return {
    cakupan,
    kunci,
    nama,
    nResponden: angka(r.n_responden) ?? 0,
    nPerempuan: angka(r.n_perempuan),
    nLaki: angka(r.n_laki),
    usia: { rata: angka(r.usia_rata), min: angka(r.usia_min), max: angka(r.usia_max) },
    protek: {
      rata: protekRata,
      pct: angka(r.protek_pct),
      kategoriRata: kategoriDariAmbang(ambang.total, protekRata),
      n: { baik: angka(r.n_baik) ?? 0, perluPerhatian: angka(r.n_perlu_perhatian) ?? 0, pendampingan: angka(r.n_pendampingan ?? r.n_waspada) ?? 0 },
      pctKategori: { baik: angka(r.pct_baik), perluPerhatian: angka(r.pct_perlu_perhatian), pendampingan: angka(r.pct_pendampingan ?? r.pct_waspada) },
      aspek,
      aspekTertinggi: teks(r.aspek_tertinggi) || null,
      aspekTerendah: teks(r.aspek_terendah) || null,
      item: itemProtekKelompok(jsonSel(r.item_json, [], galat, `KELOMPOK ${nama} item_json`)),
      nItem: { kuat: angka(r.n_item_kuat), cukup: angka(r.n_item_cukup), perlu: angka(r.n_item_perlu) },
    },
    kepuasan: {
      rata: angka(r.kepuasan_rata),
      kategori5: kunciKategoriKepuasan(r.kepuasan_kategori5),
      bintang: bintang(r.kepuasan_bintang),
      n: { puas: angka(r.n_puas) ?? 0, netral: angka(r.n_netral) ?? 0, tidakPuas: angka(r.n_tidak_puas) ?? 0 },
      pctKategori: { puas: angka(r.pct_puas), netral: angka(r.pct_netral), tidakPuas: angka(r.pct_tidak_puas) },
      dimensi,
      dimensiTertinggi: teks(r.kep_dimensi_tertinggi) || null,
      dimensiTerendah: teks(r.kep_dimensi_terendah) || null,
    },
    korelasiProtekKepuasan: angka(r.korelasi_protek_kepuasan),
    nCerita: angka(r.n_cerita),
    pilihan,
    adaNarasi: teks(r.laporan_json) !== "",
  };
}

/** Frekuensi pilihan ganda per cakupan: {`${cakupan}|${nama}`: {kode: [{pilihan, jumlah, pct}]}}. */
function kelompokkanPilihan(rows) {
  const hasil = {};
  for (const r of barisObjek(rows)) {
    const k = `${teks(r.cakupan)}|${teks(r.nama)}`;
    const kode = teks(r.pertanyaan_kode);
    if (!KODE_PILIHAN.includes(kode)) continue;
    ((hasil[k] ||= {})[kode] ||= []).push({ pilihan: teks(r.pilihan), jumlah: angka(r.jumlah) ?? 0, pct: angka(r.pct_responden) });
  }
  for (const per of Object.values(hasil)) {
    for (const kode of Object.keys(per)) per[kode].sort((a, b) => b.jumlah - a.jumlah);
  }
  return hasil;
}

// Jawaban terbuka yang tidak layak tampil tetap disimpan untuk pemiliknya kalau alasannya sekadar
// pendek atau "tidak ada". Yang mengarah ke orang tertentu, minta dirahasiakan, atau kosong dibuang.
const ALASAN_TETAP_DISIMPAN = /kurang dari|tidak ada jawaban/i;

function kelompokkanTestimoni(rows) {
  const hasil = {};
  for (const r of barisObjek(rows)) {
    const id = teks(r.id_responden);
    const kode = teks(r.pertanyaan_kode);
    const jawaban = teks(r.jawaban);
    if (!id || !KODE_TERBUKA.includes(kode) || !jawaban) continue;
    const layak = ya(r.layak_tampil);
    const alasan = teks(r.alasan_tidak_tampil);
    if (!layak && !ALASAN_TETAP_DISIMPAN.test(alasan)) continue;
    (hasil[id] ||= []).push({ pertanyaan: kode, jawaban, layakTampil: layak, tema: teks(r.tema) || null });
  }
  return hasil;
}

function ringkasQc(rows) {
  const hasil = {};
  for (const r of barisObjek(rows)) {
    const jenis = teks(r.jenis) || "lainnya";
    hasil[jenis] = (hasil[jenis] || 0) + 1;
  }
  return hasil;
}

// ── Pembaca utama ───────────────────────────────────────────────────────────────────────────

/**
 * @param sheets {nama sheet: rows} dengan rows = array of array (baris pertama header).
 * @param meta   {lembaga, sekolahId, periodeId, sumber, dibuat}
 */
export function bacaDatasetWa(sheets, meta = {}) {
  const hilang = Object.values(SHEET).filter((s) => s !== SHEET.qc && !sheets[s]);
  if (hilang.length) throw new Error(`Berkas olahan tidak punya sheet: ${hilang.join(", ")}`);

  const galat = [];
  const parameter = bacaParameter(sheets[SHEET.parameter]);
  const ambang = {
    total: ambangDariTeks(parameter.kategori_total),
    aspek: ambangDariTeks(parameter.kategori_aspek),
  };
  if (!ambang.total.length || !ambang.aspek.length) {
    throw new Error("Sheet PARAMETER tidak memuat kategori_total dan kategori_aspek yang terbaca.");
  }
  const item = bacaItem(sheets[SHEET.item]);

  const barisIndividu = barisObjek(sheets[SHEET.individu]);
  cekKolom(barisIndividu, KOLOM_WAJIB_INDIVIDU, SHEET.individu);
  const barisKelompok = barisObjek(sheets[SHEET.kelompok]);
  cekKolom(barisKelompok, KOLOM_WAJIB_KELOMPOK, SHEET.kelompok);

  const testimoniPerId = kelompokkanTestimoni(sheets[SHEET.testimoni]);
  const pilihanPer = kelompokkanPilihan(sheets[SHEET.pilihan]);

  const dipakai = barisIndividu.filter((r) => ya(r.dipakai));
  const nDipakaiBerkas = angka(parameter.n_baris_dipakai);
  if (nDipakaiBerkas !== null && nDipakaiBerkas !== dipakai.length) {
    throw new Error(`PARAMETER menyebut ${nDipakaiBerkas} baris dipakai, sheet INDIVIDU berisi ${dipakai.length}.`);
  }

  const narasi = [];
  const individu = dipakai.map((r) => {
    const o = bacaIndividu(r, testimoniPerId[teks(r.id_responden)] || [], galat);
    const laporan = jsonSel(r.laporan_json, null, galat, `INDIVIDU ${o.id} laporan_json`);
    if (laporan) {
      const { respons_cerita: respons, ...isi } = bersihkanKata(laporan);
      narasi.push({ cakupan: "individu", kunci: o.id, isi, perluAhli: false, alasanPerhatian: null });
      if (respons) {
        const perluAhli = Boolean(respons.perlu_perhatian_ahli) || ya(r.cerita_perlu_ahli);
        narasi.push({
          cakupan: "respons_cerita",
          kunci: o.id,
          isi: { ada: Boolean(respons.ada) || ya(r.cerita_ada), draf: teks(respons.draf) },
          perluAhli,
          // Catatan untuk peninjau, bukan untuk pegawai: disimpan di kolom terpisah yang tidak
          // diberikan ke peran authenticated (lihat migration wa).
          alasanPerhatian: teks(respons.alasan_perhatian) || null,
        });
      }
    }
    return o;
  });

  const kelompok = barisKelompok.map((r) => {
    const k = bacaKelompok(r, pilihanPer[`${teks(r.cakupan)}|${teks(r.nama)}`] || {}, ambang, galat);
    const laporan = jsonSel(r.laporan_json, null, galat, `KELOMPOK ${k.nama} laporan_json`);
    if (laporan) narasi.push({ cakupan: k.cakupan, kunci: k.kunci, isi: bersihkanKata(laporan), perluAhli: false, alasanPerhatian: null });
    return k;
  });
  if (!kelompok.some((k) => k.cakupan === "lembaga")) throw new Error("Sheet KELOMPOK tidak punya baris cakupan lembaga.");

  if (galat.length) throw new Error(`Berkas olahan bermasalah:\n- ${galat.slice(0, 20).join("\n- ")}`);

  const lembaga = kelompok.find((k) => k.cakupan === "lembaga");
  return {
    versi: 1,
    meta: {
      lembaga: meta.lembaga || lembaga.nama,
      sekolahId: meta.sekolahId || null,
      periodeId: meta.periodeId || null,
      sumber: meta.sumber || null,
      dibuat: meta.dibuat || null,
      contoh: Boolean(meta.contoh),
      tanggalPengolahan: teks(parameter.tanggal_pengolahan) || null,
      nAsli: angka(parameter.n_baris_asli) ?? barisIndividu.length,
      nDipakai: dipakai.length,
      catatanQc: sheets[SHEET.qc] ? ringkasQc(sheets[SHEET.qc]) : {},
    },
    parameter: bersihkanKata(parameter),
    item,
    kelompok,
    individu,
    narasi,
  };
}

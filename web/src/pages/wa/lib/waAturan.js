// Aturan tampilan modul Wellbeing Assessment: format angka, akses per peran, pemilihan cakupan,
// dan pengurutan. Semuanya fungsi murni tanpa React. Tidak ada rata-rata, persen, atau kategori
// yang dihitung di sini; yang dilakukan hanya menyaring, mengurutkan, dan menghitung panjang daftar.

import {
  ASPEK, CAKUPAN, DIMENSI_KEPUASAN, KATA_TERLARANG, KATEGORI_KEPUASAN_3, KATEGORI_KEPUASAN_5, KATEGORI_PROTEK,
  PERTANYAAN_TERBUKA, infoAspek, pilihanNetral,
} from "./waMeta.js";

// ── Format ──────────────────────────────────────────────────────────────────────────────────

const pemformat = new Map();
function fmt(digit) {
  if (!pemformat.has(digit)) {
    pemformat.set(digit, new Intl.NumberFormat("id-ID", { minimumFractionDigits: digit, maximumFractionDigits: digit }));
  }
  return pemformat.get(digit);
}

export function formatAngka(n, digit = 1) {
  return typeof n === "number" && Number.isFinite(n) ? fmt(digit).format(n) : "-";
}

/** Persen dari nilai 0-100 yang sudah final di berkas. */
export function formatPersen(n, digit = 0) {
  return typeof n === "number" && Number.isFinite(n) ? `${fmt(digit).format(n)}%` : "-";
}

export function labelPeriode(periodeId) {
  const m = String(periodeId || "").match(/^(\d{4})-(\d{2})$/);
  if (!m) return periodeId || "";
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${bulan[Number(m[2]) - 1]} ${m[1]}`;
}

export function namaDepan(nama) {
  const bersih = String(nama || "").replace(/,.*$/, "").trim();
  const kata = bersih.split(/\s+/).filter((k) => !/^(h|hj|dr|drs|ir|ust|ustadz|ustadzah)\.?$/i.test(k));
  return kata[0] || bersih || "";
}

// ── Peran ───────────────────────────────────────────────────────────────────────────────────

export const PERAN_WA = ["hc", "pegawai"];

export function peranWa(session) {
  const p = session?.peran;
  if (p === "HumanCapital" || p === "AdminFammi") return "hc";
  if (p === "Pegawai") return "pegawai";
  return null;
}

// ── Cakupan ─────────────────────────────────────────────────────────────────────────────────

export function kelompokLembaga(dataset) {
  return dataset?.kelompok?.find((k) => k.cakupan === "lembaga") || null;
}

export function cariKelompok(dataset, kunci) {
  return dataset?.kelompok?.find((k) => k.kunci === kunci) || kelompokLembaga(dataset);
}

/**
 * Opsi pemilih cakupan, dikelompokkan per jenis. Baris "Tidak teridentifikasi" tetap muncul
 * (jujur soal data yang belum lengkap) tapi ditaruh paling bawah tiap kelompok.
 */
export function opsiCakupan(dataset) {
  return CAKUPAN.filter((c) => c.kunci !== "lembaga").map((c) => ({
    ...c,
    opsi: (dataset?.kelompok || [])
      .filter((k) => k.cakupan === c.kunci)
      .sort((a, b) => Number(/tidak teridentifikasi/i.test(a.nama)) - Number(/tidak teridentifikasi/i.test(b.nama)))
      .map((k) => ({ kunci: k.kunci, nama: k.nama, n: k.nResponden })),
  })).filter((c) => c.opsi.length);
}

/** Individu yang masuk satu kelompok. Pencocokan memakai kolom yang sama dengan berkas. */
export function individuDalam(dataset, kelompok) {
  const semua = dataset?.individu || [];
  if (!kelompok || kelompok.cakupan === "lembaga") return semua;
  if (kelompok.cakupan === "unit") return semua.filter((o) => o.unitId === kelompok.kunci);
  if (kelompok.cakupan === "jenjang") return semua.filter((o) => o.jenjang === kelompok.nama);
  if (kelompok.cakupan === "kelompok_jabatan") return semua.filter((o) => o.kelompokJabatan === kelompok.nama);
  return semua;
}

/** Narasi yang sudah boleh tampil. Di Supabase, RLS hanya mengembalikan yang disetujui. */
export function narasiUntuk(dataset, cakupan, kunci) {
  return dataset?.narasi?.find((n) => n.cakupan === cakupan && n.kunci === kunci)?.isi || null;
}

export function narasiKelompok(dataset, kelompok) {
  if (!kelompok) return null;
  return narasiUntuk(dataset, kelompok.cakupan, kelompok.kunci);
}

// ── Item dan pegawai ────────────────────────────────────────────────────────────────────────

/** Item dengan teks dari kamus ITEM. */
export function lengkapiItem(item, kamus) {
  const peta = new Map((kamus || []).map((k) => [k.kode, k]));
  return (item || []).map((x) => ({ ...x, teks: peta.get(x.kode)?.teksSingkat || x.kode, teksAsli: peta.get(x.kode)?.teksAsli || "" }));
}

/** Item terkuat (arah "turun") atau terlemah ("naik"), urut pct; seri diurutkan kode. */
export function urutItem(item, arah = "turun", n = Infinity) {
  const kali = arah === "naik" ? 1 : -1;
  return [...(item || [])]
    .filter((x) => typeof x.pct === "number")
    .sort((a, b) => kali * (a.pct - b.pct) || a.kode.localeCompare(b.kode))
    .slice(0, n);
}

/** Item satu kategori (kuat / perlu), urut dari yang paling menonjol. */
export function itemKategori(item, kategori) {
  return urutItem((item || []).filter((x) => x.kategori === kategori), kategori === "perlu" ? "naik" : "turun");
}

/**
 * Pegawai per kategori PROTEK. Kategori baik diurutkan dari skor tertinggi (siapa yang paling
 * kuat), dua kategori lain dari skor terendah (siapa yang paling perlu didekati lebih dulu).
 */
export function pegawaiKategoriProtek(individu, kategori) {
  const naik = kategori !== "baik";
  return (individu || [])
    .filter((o) => o.protek?.kategori === kategori)
    .sort((a, b) => (naik ? a.protek.pct - b.protek.pct : b.protek.pct - a.protek.pct) || a.nama.localeCompare(b.nama));
}

export function pegawaiKategoriKepuasan(individu, kategori) {
  const naik = kategori !== "puas";
  return (individu || [])
    .filter((o) => o.kepuasan?.kategori3 === kategori)
    .sort((a, b) => (naik ? a.kepuasan.rata - b.kepuasan.rata : b.kepuasan.rata - a.kepuasan.rata) || a.nama.localeCompare(b.nama));
}

/** Segmen bar bertumpuk tiga kategori PROTEK dari jumlah orang di berkas. */
export function segmenProtek(n) {
  return KATEGORI_PROTEK.map((k) => ({ kunci: k.kunci, label: k.label, warna: k.warna, warnaTeks: k.warnaTeks, jumlah: n?.[k.kunci] ?? 0, arti: k.arti }));
}

export function segmenKepuasan3(n) {
  return KATEGORI_KEPUASAN_3.map((k) => ({ kunci: k.kunci, label: k.label, warna: k.warnaBar || k.warna, warnaTeks: k.warna, jumlah: n?.[k.kunci] ?? 0, arti: k.arti }));
}

export function segmenKepuasan5(n) {
  return KATEGORI_KEPUASAN_5.map((k) => ({ kunci: k.kunci, label: k.label, warna: k.warna, warnaTeks: k.warnaTeks, jumlah: n?.[k.kunci] ?? 0 }));
}

/** Pilihan ganda dipisah: pilihan bermakna di atas, "tidak ada"/"belum bisa menjawab" di bawah. */
export function pisahPilihan(daftar) {
  const utama = [];
  const netral = [];
  for (const p of daftar || []) (pilihanNetral(p.pilihan ?? p) ? netral : utama).push(p);
  return { utama, netral };
}

// ── Testimoni ───────────────────────────────────────────────────────────────────────────────

/** Kutipan layak tampil untuk satu pertanyaan, dengan identitas penulis. */
export function kutipan(individu, pertanyaan, { peran = "", tema = "", cari = "" } = {}) {
  const kata = cari.trim().toLowerCase();
  const hasil = [];
  for (const o of individu || []) {
    for (const t of o.testimoni || []) {
      if (!t.layakTampil || t.pertanyaan !== pertanyaan) continue;
      if (peran && o.peranTestimoni !== peran) continue;
      if (tema && t.tema !== tema) continue;
      if (kata && !`${t.jawaban} ${o.nama}`.toLowerCase().includes(kata)) continue;
      hasil.push({ id: `${o.id}-${t.pertanyaan}`, nama: o.nama, unit: o.unit, peran: o.peranTestimoni, jawaban: t.jawaban, tema: t.tema });
    }
  }
  return hasil.sort((a, b) => b.jawaban.length - a.jawaban.length);
}

export function jumlahKutipan(individu) {
  const hasil = Object.fromEntries(PERTANYAAN_TERBUKA.map((p) => [p.kode, 0]));
  for (const o of individu || []) for (const t of o.testimoni || []) if (t.layakTampil && t.pertanyaan in hasil) hasil[t.pertanyaan] += 1;
  return hasil;
}

/** Bagi daftar ke dua kolom berselang-seling supaya tinggi kolom seimbang. */
export function duaKolom(daftar) {
  const kiri = [];
  const kanan = [];
  daftar.forEach((x, i) => (i % 2 ? kanan : kiri).push(x));
  return [kiri, kanan];
}

// ── Lain-lain ───────────────────────────────────────────────────────────────────────────────

export function labelAspek(kunci) {
  return infoAspek(kunci)?.label || kunci || "-";
}

export function labelDimensi(kunci) {
  return DIMENSI_KEPUASAN.find((d) => d.kunci === kunci)?.label || kunci || "-";
}

/** Aspek berurutan untuk tampilan (p r o t e k). */
export function urutanAspek() {
  return ASPEK;
}

/** Kata untuk kekuatan korelasi; ambang lazim pembacaan koefisien, tanpa menghitung koefisiennya. */
export function kataKorelasi(r) {
  if (typeof r !== "number") return null;
  const a = Math.abs(r);
  if (a >= 0.7) return "sangat erat";
  if (a >= 0.5) return "erat";
  if (a >= 0.3) return "sedang";
  return "lemah";
}

// ── Kendali mutu narasi (layar persetujuan Admin Fammi) ─────────────────────────────────────

/** Semua isian teks di dalam narasi, beserta jalurnya ("ringkasan.wellbeing", "langkah_kecil.0.judul"). */
export function isianTeks(isi, awalan = "") {
  if (typeof isi === "string") return [{ jalur: awalan, nilai: isi }];
  if (Array.isArray(isi)) return isi.flatMap((x, i) => isianTeks(x, awalan ? `${awalan}.${i}` : String(i)));
  if (isi && typeof isi === "object") return Object.entries(isi).flatMap(([k, v]) => isianTeks(v, awalan ? `${awalan}.${k}` : k));
  return [];
}

const KATA_DIAGNOSIS = /\b(depresi|gangguan|burnout|sakit mental|tidak sehat)\b/i;
// Daftar larangan tulisan di CLAUDE.md ditambah hiperbola yang lazim di narasi buatan model.
export const KATA_KLISE = /\b(sangat penting|perlu dicatat|pada dasarnya|sesungguhnya|tentu saja|dengan demikian|merupakan|terdapat|komprehensif|holistik|luar biasa|tak dapat dipungkiri|mari kita|berperan penting|sinergi|transformatif)\b/i;
const JALUR_BOLEH_ANGKA = /(^|\.)(terkait|jangka|bukti|jumlah)$/;

/**
 * Lencana peringatan untuk peninjau, bukan penegak. Aturan mengikuti prompt pengolahan
 * (docs/Prompt_Wellbeing_Assessment_Excel.md): narasi pribadi tanpa angka, tanpa tanda hubung
 * panjang, tanpa label diagnosis, tanpa kata yang dilarang modul, paling banyak tiga kalimat per
 * isian (respons cerita lima).
 */
export function qcNarasiWa(row) {
  const isu = [];
  const pribadi = row.cakupan === "individu" || row.cakupan === "respons_cerita";
  const batas = row.cakupan === "respons_cerita" ? 5 : row.cakupan === "individu" ? 3 : 4;
  for (const { jalur, nilai } of isianTeks(row.isi)) {
    if (KATA_TERLARANG.test(nilai)) isu.push({ isu: "kata_terlarang", jalur });
    if (/—|--/.test(nilai)) isu.push({ isu: "tanda_hubung", jalur });
    if (KATA_DIAGNOSIS.test(nilai)) isu.push({ isu: "diagnosis", jalur });
    if (KATA_KLISE.test(nilai)) isu.push({ isu: "klise", jalur });
    if (pribadi && /\d/.test(nilai) && !JALUR_BOLEH_ANGKA.test(jalur)) isu.push({ isu: "angka", jalur });
    const kalimat = nilai.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().length > 2).length;
    if (kalimat > batas && !/(^|\.)(mengapa|bukti)$/.test(jalur)) isu.push({ isu: "kalimat_banyak", jalur });
  }
  return isu;
}

export const LABEL_ISU_QC = {
  kata_terlarang: "Memuat kata yang dilarang modul",
  tanda_hubung: "Memuat tanda hubung panjang",
  diagnosis: "Memuat istilah diagnosis",
  klise: "Memuat kata klise atau hiperbola",
  angka: "Memuat angka di narasi pribadi",
  kalimat_banyak: "Terlalu banyak kalimat",
};

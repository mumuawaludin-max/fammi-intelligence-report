// Uji pembaca berkas olahan Wellbeing Assessment. Jalankan: npm test (dari folder web/).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ambangDariTeks, bacaDatasetWa, bersihkanKata, kategoriDariAmbang, kunciKelompok, slug } from "./waPembaca.js";
import { KATA_TERLARANG } from "./waMeta.js";

const folder = path.dirname(fileURLToPath(import.meta.url));
const contoh = JSON.parse(fs.readFileSync(path.join(folder, "../data/wa.contoh.json"), "utf8"));

const KOLOM_CERITA = "Adakah yang ingin anda ceritakan dan tanyakan tentang kelelahan atau stress anda saat ini?";
const KOLOM_PERCAYA = "Tulis satu orang yang paling anda percayai atau andalkan saat ini di lingkungan pekerjaan";
const KOLOM_WA = "Tuliskan Nomor WhatsApp Anda";

function laporan(respons) {
  return JSON.stringify({
    ringkasan: { wellbeing: "a", kepuasan: "b" },
    wellbeing: { hal_kuat: "c", hal_tantangan: "d" },
    kepuasan: { hal_kuat: "e", hal_tantangan: "f" },
    refleksi: "g",
    langkah_kecil: [],
    respons_cerita: respons,
  });
}

/** Workbook kecil buatan: tiga baris (satu tidak dipakai), satu baris lembaga, satu baris unit. */
function workbook({ nDipakai = 2, jsonRusak = false } = {}) {
  const kolom = [
    "TUlis Nama Lengkap Anda Disini", KOLOM_CERITA, KOLOM_PERCAYA, KOLOM_WA, "id_responden", "dipakai", "unit_normal", "jenjang",
    "kelompok_jabatan", "protek_total", "protek_pct", "protek_kategori", "p_skor", "p_pct", "p_kategori", "item_json", "kepuasan_rata",
    "kepuasan_kategori5", "kepuasan_kategori3", "pilihan_disukai_json", "cerita_ada", "cerita_perlu_ahli", "laporan_json",
  ];
  const item = JSON.stringify([{ kode: "P1", aspek: "p", skor: 6, pct: 100, kategori: "kuat" }]);
  const responsAni = { ada: true, draf: "Terima kasih sudah bercerita.", perlu_perhatian_ahli: true, alasan_perhatian: "perlu ditemani" };
  const responsBudi = { ada: false, draf: "Boleh tidak bercerita.", perlu_perhatian_ahli: false, alasan_perhatian: "" };
  return {
    INDIVIDU: [
      kolom,
      ["Ani Contoh", "CERITA-RAHASIA-ANI", "Pak Budi", "081299990000", "R001", "Ya", "SMA Contoh Bone", "SMA", "Guru", 200, 79.4, "Baik", 30, 71.4, "Baik",
        item, 4.1, "Puas", "Puas", JSON.stringify(["Kepemimpinan yang baik"]), "Ya", "Ya", jsonRusak ? "{rusak" : laporan(responsAni)],
      ["Budi Contoh", "", "", "081300001111", "R002", "Ya", "SMA Contoh Bone", "SMA", "Guru", 130, 51.6, "Perlu Perhatian", 20, 47.6, "Perlu Perhatian",
        item, 3.0, "Netral", "Netral", "[]", "Tidak", "", laporan(responsBudi)],
      ["Cici Ganda", "", "", "", "R003", "Tidak", "SMA Contoh Bone", "SMA", "Guru", 130, 51.6, "Perlu Perhatian", 20, 47.6, "Perlu Perhatian",
        item, 3.0, "Netral", "Netral", "[]", "Tidak", "", ""],
    ],
    KELOMPOK: [
      ["cakupan", "nama", "n_responden", "protek_rata", "protek_pct", "p_rata", "item_json", "kepuasan_rata", "laporan_json"],
      ["lembaga", "Lembaga Uji", 2, 140.4, 55.7, 25, JSON.stringify([{ kode: "P1", aspek: "p", rata: 6, pct: 100, kategori: "kuat" }]), 3.55,
        JSON.stringify({ ringkasan: { wellbeing: "x", kepuasan: "y" } })],
      ["unit", "SMA Contoh Bone", 2, 165, 65.5, 25, "[]", 3.55, ""],
    ],
    PILIHAN: [
      ["cakupan", "nama", "pertanyaan_kode", "pilihan", "jumlah", "pct_responden"],
      ["lembaga", "Lembaga Uji", "disukai", "Kepemimpinan yang baik", 1, 50],
      ["lembaga", "Lembaga Uji", "disukai", "Lingkungan kerja yang nyaman", 2, 100],
    ],
    TESTIMONI: [
      ["id_responden", "nama", "unit_normal", "jenjang", "peran_testimoni", "pertanyaan_kode", "jawaban", "panjang_kata", "layak_tampil", "alasan_tidak_tampil", "tema"],
      ["R001", "Ani Contoh", "SMA Contoh Bone", "SMA", "Guru", "pimpinan_efektif", "Pimpinan lebih sering hadir di kelas.", 6, "Ya", "", "Hadir di lapangan"],
      ["R001", "Ani Contoh", "SMA Contoh Bone", "SMA", "Guru", "kebijakan_diubah", "TOLONG-DIRAHASIAKAN", 1, "Tidak", "responden meminta jawaban dirahasiakan", ""],
      ["R002", "Budi Contoh", "SMA Contoh Bone", "SMA", "Guru", "pelatihan_dibutuhkan", "Excel", 1, "Tidak", "kurang dari 4 kata", ""],
    ],
    ITEM: [
      ["kode", "instrumen", "aspek_atau_dimensi", "label_aspek", "teks_asli", "teks_singkat", "arah_asli"],
      ["P1", "protek", "p", "Penerimaan Diri", "Teks asli", "Teks singkat", "positif"],
    ],
    PARAMETER: [
      ["nama", "nilai", "keterangan"],
      ["n_baris_dipakai", nDipakai, ""],
      ["kategori_aspek", "1-14 Waspada; 15-28 Perlu Perhatian; 29-42 Baik", ""],
      ["kategori_total", "1-70 Waspada; 71-140 Perlu Perhatian; 141-252 Baik", ""],
    ],
  };
}

test("kolom rahasia tidak pernah ikut ke dataset", () => {
  const d = bacaDatasetWa(workbook());
  const teks = JSON.stringify(d);
  assert.doesNotMatch(teks, /CERITA-RAHASIA-ANI/);
  assert.doesNotMatch(teks, /Pak Budi/);
  assert.doesNotMatch(teks, /0812999|0813000/);
  assert.doesNotMatch(teks, /TOLONG-DIRAHASIAKAN/);
  for (const o of d.individu) {
    assert.equal("cerita" in o, false);
    assert.equal("perluAhli" in o, false);
  }
});

test("baris tidak dipakai dibuang, isian pendek tetap disimpan untuk pemiliknya", () => {
  const d = bacaDatasetWa(workbook());
  assert.deepEqual(d.individu.map((o) => o.id), ["R001", "R002"]);
  const budi = d.individu.find((o) => o.id === "R002");
  assert.equal(budi.testimoni.length, 1);
  assert.equal(budi.testimoni[0].layakTampil, false);
});

test("respons cerita dipisah ke narasi sendiri beserta penanda ahli", () => {
  const d = bacaDatasetWa(workbook());
  const individu = d.narasi.find((n) => n.cakupan === "individu" && n.kunci === "R001");
  assert.equal("respons_cerita" in individu.isi, false);
  const respons = d.narasi.find((n) => n.cakupan === "respons_cerita" && n.kunci === "R001");
  assert.equal(respons.perluAhli, true);
  assert.equal(respons.isi.ada, true);
  assert.equal(d.narasi.find((n) => n.cakupan === "respons_cerita" && n.kunci === "R002").perluAhli, false);
});

test("kategori kelompok dari rata-rata memakai ambang PARAMETER", () => {
  const ambang = ambangDariTeks("1-70 Waspada; 71-140 Perlu Perhatian; 141-252 Baik");
  assert.deepEqual(ambang.map((a) => a.kunci), ["pendampingan", "perluPerhatian", "baik"]);
  assert.equal(kategoriDariAmbang(ambang, 140.4), "perluPerhatian");
  assert.equal(kategoriDariAmbang(ambang, 141), "baik");
  assert.equal(kategoriDariAmbang(ambang, 70), "pendampingan");
  assert.equal(kategoriDariAmbang(ambang, null), null);
  const d = bacaDatasetWa(workbook());
  assert.equal(d.kelompok[0].protek.kategoriRata, "perluPerhatian");
  assert.equal(d.kelompok[0].protek.aspek.p.kategoriRata, "perluPerhatian");
});

test("berkas ditolak kalau jumlah baris dipakai tidak cocok, JSON rusak, atau sheet hilang", () => {
  assert.throws(() => bacaDatasetWa(workbook({ nDipakai: 5 })), /5 baris dipakai/);
  assert.throws(() => bacaDatasetWa(workbook({ jsonRusak: true })), /JSON tidak terbaca/);
  const tanpaSheet = workbook();
  delete tanpaSheet.ITEM;
  assert.throws(() => bacaDatasetWa(tanpaSheet), /tidak punya sheet: ITEM/);
});

test("id unit sama dengan format modul sw", () => {
  assert.equal(kunciKelompok("unit", "SMA Athirah Bone"), "u-sma-athirah-bone");
  assert.equal(kunciKelompok("jenjang", "Tidak teridentifikasi"), "j-tidak-teridentifikasi");
  assert.equal(kunciKelompok("lembaga", "apa saja"), "lembaga");
  assert.equal(slug("QGDP TK dan SD"), "qgdp-tk-dan-sd");
});

test("pilihan per kelompok diurutkan dari yang paling sering", () => {
  const d = bacaDatasetWa(workbook());
  assert.deepEqual(d.kelompok[0].pilihan.disukai.map((p) => p.jumlah), [2, 1]);
});

test("data contoh berbentuk lengkap dan ditandai contoh", () => {
  assert.equal(contoh.meta.contoh, true);
  assert.ok(contoh.individu.length >= 30);
  for (const o of contoh.individu) {
    assert.equal(o.protek.item.length, 42);
    assert.equal(Object.keys(o.kepuasan.dimensi).length, 6);
    assert.ok(contoh.narasi.some((n) => n.cakupan === "individu" && n.kunci === o.id));
  }
  assert.ok(contoh.kelompok.some((k) => k.cakupan === "lembaga" && k.adaNarasi));
});

test("label kategori terbawah gaya lama dinormalkan dan tidak pernah tampil", () => {
  assert.equal(bersihkanKata("Tujuan Hidup masuk Waspada."), "Tujuan Hidup masuk Perlu Pendampingan.");
  assert.equal(bersihkanKata("menjaga Anda tetap waspada"), "menjaga Anda tetap berhati-hati");
  assert.equal(bersihkanKata("rasa kewaspadaan"), "rasa kehati-hatian");
  assert.deepEqual(bersihkanKata({ a: ["Waspada"], b: 3 }), { a: ["Perlu Pendampingan"], b: 3 });
  const d = bacaDatasetWa(workbook());
  assert.equal(d.kelompok[0].protek.kategoriRata, "perluPerhatian");
  assert.ok("pendampingan" in d.kelompok[0].protek.n);
  const tanpaKutipan = JSON.stringify({ ...contoh, individu: contoh.individu.map(({ testimoni: _kutipan, ...o }) => o) });
  assert.doesNotMatch(tanpaKutipan, KATA_TERLARANG);
});

test("catatan peninjau respons cerita dipisah dari isi yang dibaca pegawai", () => {
  const d = bacaDatasetWa(workbook());
  const r = d.narasi.find((n) => n.cakupan === "respons_cerita" && n.kunci === "R001");
  assert.equal(r.alasanPerhatian, "perlu ditemani");
  assert.equal("alasanPerhatian" in r.isi, false);
  assert.equal("alasan_perhatian" in r.isi, false);
});

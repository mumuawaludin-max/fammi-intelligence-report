// Uji aturan tampilan modul Wellbeing Assessment. Jalankan: npm test (dari folder web/).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cariKelompok, duaKolom, formatAngka, formatPersen, individuDalam, itemKategori, kataKorelasi, kutipan, namaDepan,
  isianTeks, narasiUntuk, opsiCakupan, pegawaiKategoriKepuasan, pegawaiKategoriProtek, peranWa, pisahPilihan, qcNarasiWa,
  urutItem, formatHari, keteranganPembaruan, tanggalPembaruan,
} from "./waAturan.js";
import { KATA_TERLARANG, KATEGORI_KEPUASAN_3, KATEGORI_PROTEK, labelTerkait, pilihanNetral } from "./waMeta.js";

const folder = path.dirname(fileURLToPath(import.meta.url));
const contoh = JSON.parse(fs.readFileSync(path.join(folder, "../data/wa.contoh.json"), "utf8"));

test("format angka memakai koma desimal Indonesia", () => {
  assert.equal(formatAngka(87.52, 2), "87,52");
  assert.equal(formatPersen(77.2), "77%");
  assert.equal(formatPersen(null), "-");
});

test("peran FIR dipetakan ke peran modul", () => {
  assert.equal(peranWa({ peran: "HumanCapital" }), "hc");
  assert.equal(peranWa({ peran: "Pegawai" }), "pegawai");
  assert.equal(peranWa({ peran: "KepalaUnit" }), null);
});

test("nama depan tanpa gelar", () => {
  assert.equal(namaDepan("Mutmainnah, S.Pd"), "Mutmainnah");
  assert.equal(namaDepan("H. Haeruddin Marsuki"), "Haeruddin");
});

test("individu dalam cakupan cocok dengan jumlah responden kelompok", () => {
  for (const k of contoh.kelompok) {
    assert.equal(individuDalam(contoh, k).length, k.nResponden, `${k.cakupan} ${k.nama}`);
  }
});

test("opsi cakupan memuat setiap kelompok non-lembaga tepat sekali", () => {
  const opsi = opsiCakupan(contoh).flatMap((c) => c.opsi.map((o) => o.kunci));
  assert.equal(opsi.length, contoh.kelompok.length - 1);
  assert.equal(cariKelompok(contoh, "tidak-ada").cakupan, "lembaga");
});

test("urutan item dan pegawai", () => {
  const item = [{ kode: "A", pct: 50, kategori: "perlu" }, { kode: "B", pct: 90, kategori: "kuat" }, { kode: "C", pct: 30, kategori: "perlu" }];
  assert.deepEqual(urutItem(item, "turun", 2).map((x) => x.kode), ["B", "A"]);
  assert.deepEqual(itemKategori(item, "perlu").map((x) => x.kode), ["C", "A"]);
  const baik = pegawaiKategoriProtek(contoh.individu, "baik");
  for (let i = 1; i < baik.length; i++) assert.ok(baik[i - 1].protek.pct >= baik[i].protek.pct);
  const tidak = pegawaiKategoriKepuasan(contoh.individu, "tidakPuas");
  for (let i = 1; i < tidak.length; i++) assert.ok(tidak[i - 1].kepuasan.rata <= tidak[i].kepuasan.rata);
});

test("pilihan netral dipisah dari pilihan bermakna", () => {
  assert.equal(pilihanNetral("Saya belum bisa menjawab"), true);
  assert.equal(pilihanNetral("Tidak ada yang saya tidak sukai"), true);
  assert.equal(pilihanNetral("Kepemimpinan yang baik"), false);
  const { utama, netral } = pisahPilihan([{ pilihan: "Beban kerja yang terlalu berat" }, { pilihan: "Saya belum bisa menjawab" }]);
  assert.equal(utama.length, 1);
  assert.equal(netral.length, 1);
});

test("kutipan hanya yang layak tampil, bisa disaring peran", () => {
  const semua = kutipan(contoh.individu, "pimpinan_efektif");
  assert.ok(semua.length > 0);
  const guru = kutipan(contoh.individu, "pimpinan_efektif", { peran: "Guru" });
  assert.ok(guru.every((k) => k.peran === "Guru"));
  const individu = [{ id: "X", nama: "N", testimoni: [{ pertanyaan: "pimpinan_efektif", jawaban: "rahasia", layakTampil: false }] }];
  assert.equal(kutipan(individu, "pimpinan_efektif").length, 0);
});

test("narasi dan label terkait", () => {
  assert.ok(narasiUntuk(contoh, "lembaga", "lembaga").ringkasan);
  assert.equal(narasiUntuk(contoh, "lembaga", "tidak-ada"), null);
  assert.deepEqual(labelTerkait("sulit; kebijakan_diubah; e"), ["Hal yang paling sulit dilakukan", "Kebijakan yang ingin diubah", "Eksplorasi Tempat Kerja"]);
  assert.equal(kataKorelasi(0.63), "erat");
});

test("dua kolom seimbang", () => {
  const [a, b] = duaKolom([1, 2, 3, 4, 5]);
  assert.deepEqual(a, [1, 3, 5]);
  assert.deepEqual(b, [2, 4]);
});

test("setiap kategori punya label, warna, dan penjelasan", () => {
  for (const k of [...KATEGORI_PROTEK, ...KATEGORI_KEPUASAN_3]) {
    assert.ok(k.label && k.warna && k.arti);
  }
});

test("label dan penjelasan yang tampil tidak memakai kata terlarang", () => {
  const semua = [...KATEGORI_PROTEK, ...KATEGORI_KEPUASAN_3].map((k) => `${k.label} ${k.arti}`).join(" ");
  assert.doesNotMatch(semua, KATA_TERLARANG);
  assert.ok(KATEGORI_PROTEK.some((k) => k.label === "Perlu Pendampingan"));
});

test("kendali mutu narasi menandai pelanggaran yang lazim", () => {
  const isu = (row) => qcNarasiWa(row).map((x) => x.isu);
  assert.deepEqual(isu({ cakupan: "individu", isi: { ringkasan: { wellbeing: "Skor Anda 85 persen." } } }), ["angka"]);
  assert.deepEqual(isu({ cakupan: "individu", isi: { langkah_kecil: [{ terkait: "p", jangka: "3 bulan" }] } }), []);
  assert.deepEqual(isu({ cakupan: "lembaga", isi: { insight: [{ bukti: "r = 0,63" }], ringkasan: { a: "Ada 12 orang." } } }), []);
  assert.ok(isu({ cakupan: "lembaga", isi: { a: "Kondisi ini gangguan serius" } }).includes("diagnosis"));
  assert.ok(isu({ cakupan: "lembaga", isi: { a: "Aman -- lanjut" } }).includes("tanda_hubung"));
  assert.ok(isu({ cakupan: "individu", isi: { a: "Satu. Dua. Tiga. Empat." } }).includes("kalimat_banyak"));
  for (const n of contoh.narasi) assert.equal(qcNarasiWa(n).some((x) => x.isu === "kata_terlarang"), false);
  assert.deepEqual(isianTeks({ a: ["x", { b: "y" }] }).map((x) => x.jalur), ["a.0", "a.1.b"]);
});

test("narasi pribadi yang menawarkan percakapan dari Fammi ditandai, saran lewat Human Capital tidak", () => {
  const tawar = { cakupan: "respons_cerita", isi: { ada: true, draf: "Kami ingin menawarkan percakapan lanjutan dengan tim pendamping." } };
  const rujuk = { cakupan: "respons_cerita", isi: { ada: true, draf: "Sampaikan ke Human Capital bahwa Anda ingin dihubungkan dengan psikolog." } };
  const lomba = { cakupan: "individu", isi: { langkah_kecil: [{ judul: "Minta pembagian tim pendampingan lomba" }] } };
  assert.ok(qcNarasiWa(tawar).some((x) => x.isu === "tawaran"));
  assert.ok(!qcNarasiWa(rujuk).some((x) => x.isu === "tawaran"));
  assert.ok(!qcNarasiWa(lomba).some((x) => x.isu === "tawaran"));
});

test("data contoh tidak menawarkan percakapan atau pendampingan dari Fammi", () => {
  for (const n of contoh.narasi) {
    assert.ok(!qcNarasiWa({ cakupan: n.cakupan, isi: n.isi }).some((x) => x.isu === "tawaran"), `${n.cakupan} ${n.kunci}`);
  }
});

test("narasi individu contoh punya penjelasan untuk keenam aspek PROTEK", () => {
  for (const n of contoh.narasi.filter((x) => x.cakupan === "individu")) {
    for (const a of ["p", "r", "o", "t", "e", "k"]) {
      assert.ok(n.isi.aspek?.[a]?.arti && n.isi.aspek[a].langkah, `${n.kunci} ${a}`);
    }
  }
});

test("tanggal pembaruan memakai yang terbaru di antara unggah data dan rilis narasi", () => {
  const ds = {
    diunggahPada: "2026-10-18T22:36:00Z",
    meta: { tanggalPengolahan: "2026-10-14", dibuat: "2026-10-01T00:00:00Z" },
    narasi: [{ disetujuiPada: "2026-10-19T03:00:00Z" }, { disetujuiPada: null }, {}],
  };
  const t = tanggalPembaruan(ds);
  assert.equal(t.terakhir, "2026-10-19T03:00:00.000Z");
  assert.equal(t.diunggah, "2026-10-18T22:36:00.000Z");
  assert.equal(t.diolah, "2026-10-14");
  assert.match(keteranganPembaruan(t), /Selesai diolah tim ahli Fammi: Rabu, 14 Oktober 2026/);
});

test("tanpa narasi yang dirilis, tanggal unggah yang dipakai; tanpa created_at, meta.dibuat", () => {
  const t = tanggalPembaruan({ meta: { dibuat: "2026-10-18T22:36:00Z" }, narasi: [] });
  assert.equal(t.terakhir, "2026-10-18T22:36:00.000Z");
  assert.equal(t.dirilis, null);
  assert.match(keteranganPembaruan(t), /belum dirilis/);
  assert.equal(tanggalPembaruan({}).terakhir, null);
});

test("format hari dalam bahasa Indonesia, tanggal tanpa jam tidak mundur sehari", () => {
  assert.equal(formatHari("2026-10-19"), "Senin, 19 Oktober 2026");
  assert.equal(formatHari("bukan tanggal"), "");
  assert.equal(formatHari(null), "");
});

test("survei umpan balik: paling banyak dua esai, kode unik, teks bersih", async () => {
  const { PERTANYAAN_UMPAN_BALIK, umpanBalikBelumLengkap } = await import("./waMeta.js");
  assert.ok(PERTANYAAN_UMPAN_BALIK.filter((p) => p.jenis === "esai").length <= 2);
  assert.equal(new Set(PERTANYAAN_UMPAN_BALIK.map((p) => p.kode)).size, PERTANYAAN_UMPAN_BALIK.length);
  const teks = JSON.stringify(PERTANYAAN_UMPAN_BALIK);
  assert.doesNotMatch(teks, KATA_TERLARANG);
  assert.doesNotMatch(teks, /—|--/);
  // Esai tidak wajib; nilai 1-10 dan pilihan wajib.
  const wajib = PERTANYAAN_UMPAN_BALIK.filter((p) => p.jenis !== "esai").length;
  assert.equal(umpanBalikBelumLengkap({}).length, wajib);
  const lengkap = { nilai: {}, pilihan: {}, esai: {} };
  for (const p of PERTANYAAN_UMPAN_BALIK) {
    if (p.jenis === "nilai") lengkap.nilai[p.kode] = 8;
    if (p.jenis === "pilihan") lengkap.pilihan[p.kode] = p.banyak ? [p.opsi[0]] : p.opsi[0];
  }
  assert.equal(umpanBalikBelumLengkap(lengkap).length, 0);
  assert.equal(umpanBalikBelumLengkap({ ...lengkap, nilai: { ...lengkap.nilai, puas_keseluruhan: 11 } }).length, 1);
});

test("opsi Lainnya: teks wajib kalau dipilih, opsi Belum tahu tetap di akhir", async () => {
  const { PERTANYAAN_UMPAN_BALIK, OPSI_LAINNYA, opsiUmpanBalik, umpanBalikBelumLengkap } = await import("./waMeta.js");
  const rencana = PERTANYAAN_UMPAN_BALIK.find((p) => p.kode === "rencana");
  const opsi = opsiUmpanBalik(rencana);
  assert.deepEqual(opsi.slice(-2), [OPSI_LAINNYA, "Belum tahu"]);
  const dasar = { nilai: {}, pilihan: {} };
  for (const p of PERTANYAAN_UMPAN_BALIK) {
    if (p.jenis === "nilai") dasar.nilai[p.kode] = 7;
    if (p.jenis === "pilihan") dasar.pilihan[p.kode] = p.banyak ? [p.opsi[0]] : p.opsi[0];
  }
  const tanpaTeks = { ...dasar, pilihan: { ...dasar.pilihan, rencana: [OPSI_LAINNYA] } };
  assert.deepEqual(umpanBalikBelumLengkap(tanpaTeks).map((p) => p.kode), ["rencana"]);
  assert.equal(umpanBalikBelumLengkap({ ...tanpaTeks, lainnya: { rencana: "Ikut kajian" } }).length, 0);
});

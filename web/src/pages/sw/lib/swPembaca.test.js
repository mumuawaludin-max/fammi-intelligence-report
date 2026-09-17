// Uji pembaca berkas dan bentuk data contoh. Jalankan: npm test (dari folder web/).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { angkaDepan, bacaDaftarInduk, jenjangUnit, kunciKebutuhan, kunciPermintaan, labelTema } from "./swPembaca.js";
import { hitungAlasan } from "./swAturan.js";

const folder = path.dirname(fileURLToPath(import.meta.url));
const contoh = JSON.parse(fs.readFileSync(path.join(folder, "../data/sw.contoh.json"), "utf8"));

test("jawaban kebutuhan yang terpotong tetap dikenali lewat kata pertama", () => {
  assert.deepEqual(
    kunciKebutuhan("Waktu dan ruang istirahat ya,Komunikasi yan,Pelatihan keterampi"),
    ["waktu", "komunikasi", "pelatihan"],
  );
  assert.deepEqual(kunciKebutuhan("Tempat"), ["tempat"]);
  assert.deepEqual(kunciKebutuhan(null), []);
});

test("angka skala dan jawaban pendalaman dibaca dari teks jawaban", () => {
  assert.equal(angkaDepan("5: Sangat Baik - Tenang dan Bertenaga"), 5);
  assert.equal(angkaDepan("2 : Berat - Terasa Menguras Energi"), 2);
  assert.equal(angkaDepan(""), null);
  assert.equal(kunciPermintaan("Mungkin, saya belum yakin"), "mungkin");
  assert.equal(kunciPermintaan("Ya, saya merasa perlu"), "ya");
});

test("jenjang unit dan label tema yang diganti", () => {
  assert.equal(jenjangUnit("SMP Athirah Bone"), "SMP");
  assert.equal(jenjangUnit("Boarding Bone"), "Boarding");
  assert.equal(jenjangUnit("Departemen HC"), "Lintas jenjang");
  assert.equal(labelTema("Kesehatan fisik & mental"), "Kondisi fisik & pikiran");
  assert.equal(labelTema("Rekan kerja & kerja sama tim"), "Rekan kerja & kerja sama tim");
});

test("daftar induk: jumlah pegawai per blok, blok gabungan dipecah lewat Kepala Seksi", () => {
  const unit = ["Departemen Kurikulum", "QGDP TK dan SD", "Pendidikan Inklusi", "Asrama Athirah Baruga", "SMA Athirah Baruga"];
  const rows = [
    ["Screening 3", "Departemen Kurikulum"],
    ["", "NO", "NAMA_LENGKAP", "JABATAN"],
    ["dptkur", "1", "Guru A", "Kadept. Kurikulum"],
    ["", "2", "Guru B", "Staf Kurikulum"],
    ["", "3", "Guru C", "Kepala Seksi QGDP Unit TK dan SD"],
    ["", "4", "Guru D", "Staf QGDP"],
    ["", "5", "Guru E", "Kepala Seksi Pendidikan Inklusi"],
    ["", "6", "Guru F", "Guru Pembimbing Khusus"],
    ["", "", "", "", "catatan di luar tabel"],
    ["Screening 17", "ASRAMA BARUGA"],
    ["", "NO", "NAMA_LENGKAP", "JABATAN"],
    ["", "1", "Guru G", "Pembina"],
    ["", "2", "Guru G ", "Pembina"],
    ["", "3", "", ""],
    ["Screening 16", "SMA ATHIRAH BARUGA"],
    ["", "NO", "NAMA_LENGKAP", "JABATAN"],
    ["", "1", "Guru H", "Kepala Sekolah"],
    ["Screening 99", "Unit Tak Dikenal"],
    ["", "NO", "NAMA_LENGKAP", "JABATAN"],
    ["", "1", "Orang Lain", "Staf"],
  ];
  const hasil = bacaDaftarInduk(rows, unit);
  assert.equal(hasil.get("Departemen Kurikulum"), 2);
  assert.equal(hasil.get("QGDP TK dan SD"), 2);
  assert.equal(hasil.get("Pendidikan Inklusi"), 2);
  assert.equal(hasil.get("Asrama Athirah Baruga"), 1, "nama sama dihitung sekali, baris kosong dilewati");
  assert.equal(hasil.get("SMA Athirah Baruga"), 1);
  assert.equal(hasil.size, 5, "blok yang tidak cocok ke unit mana pun diabaikan");
});

test("data contoh: satu baris individu per pengisi dan jumlah peserta konsisten", () => {
  const { lembaga, individu, unit } = contoh;
  assert.equal(contoh.meta.contoh, true);
  assert.equal(individu.length, lembaga.nPengisi);
  assert.equal(new Set(individu.map((o) => o.id)).size, individu.length, "id individu unik");
  assert.equal(individu.filter((o) => o.peserta).length, lembaga.peserta.total);
  assert.equal(unit.reduce((a, u) => a + u.nPengisi, 0), lembaga.nPengisi);
  assert.deepEqual(hitungAlasan(individu.filter((o) => o.peserta), contoh.asumsi), lembaga.peserta.perAlasan);
  for (const o of individu) {
    assert.ok(unit.some((u) => u.id === o.unitId), `unit ${o.unitId} ada`);
    assert.equal(typeof o.indeks, "number");
  }
});

test("data contoh: kutipan yang ditandai tinjauan tidak ikut dikirim", () => {
  const semua = ["bertahan", "menguras", "diperbaiki"].flatMap((k) => contoh.tema[k].daftar.flatMap((t) => t.kutipan));
  assert.ok(semua.length > 0);
  assert.ok(semua.every((k) => !/IGD/.test(k.teks)));
});

test("data contoh: harapan memisahkan orang di angka tertinggi", () => {
  const h = contoh.lembaga.harapan;
  const lima = contoh.individu.filter((o) => o.kondisi === 5).length;
  assert.equal(h.sudahTertinggi, lima);
  assert.equal(h.naik + h.tetap + h.turun + h.sudahTertinggi, contoh.lembaga.nPengisi);
});

test("sumber antarmuka modul tidak memakai kata terlarang sebagai teks tampilan", () => {
  const terlarang = /kesehatan mental|gangguan|\bsehat\b|tidak sehat|waspada/i;
  const akar = path.join(folder, "..");
  const berkas = fs.readdirSync(akar).filter((f) => f.endsWith(".jsx"))
    .concat(["lib/swMeta.js", "lib/swAturan.js"]);
  for (const f of berkas) {
    const isi = fs.readFileSync(path.join(akar, f), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
    assert.doesNotMatch(isi, terlarang, f);
  }
  const labelTemaContoh = ["bertahan", "menguras", "diperbaiki"].flatMap((k) => contoh.tema[k].daftar.map((t) => t.tema));
  for (const t of labelTemaContoh) assert.doesNotMatch(t, terlarang, t);
});

// Berkas asli hanya ada di mesin yang menjalankan `npm run sw:baca`; uji dilewati kalau tidak ada.
const berkasAthirah = path.join(folder, "../../../../sw-data-lokal/athirah.json");
test("data Athirah: setiap pengisi Form A punya laporan individu", { skip: !fs.existsSync(berkasAthirah) }, () => {
  const d = JSON.parse(fs.readFileSync(berkasAthirah, "utf8"));
  // 602 baris Form A, 25 di antaranya isian ganda (nama, unit, jabatan sama) yang dibuang.
  assert.equal(d.meta.isianGanda.length, 25);
  assert.equal(d.individu.length, 602 - 25);
  assert.equal(d.lembaga.nPengisi, d.individu.length);
  assert.equal(new Set(d.individu.map((o) => o.id)).size, d.individu.length);
  const kunci = (o) => `${o.nama.toLowerCase()}|${o.unitId}|${(o.jabatan || "").toLowerCase()}`;
  assert.equal(new Set(d.individu.map(kunci)).size, d.individu.length, "tidak ada isian ganda tersisa");
  assert.ok(d.individu.every((o) => typeof o.indeks === "number" && o.unitId && o.nama));
  assert.equal(d.unit.length, 25);
  assert.equal(d.unit.filter((u) => u.pengamatan).length, 19);
  // Jumlah pegawai dari daftar induk, bukan dari sheet 07 (yang selalu sama dengan pengisi).
  const unitNama = (n) => d.unit.find((u) => u.nama === n);
  assert.equal(unitNama("SMA Athirah Baruga").nPegawai, 48);
  assert.equal(unitNama("SMP Athirah Kajaolalido").nPegawai, 35);
  assert.ok(d.unit.every((u) => u.nPegawai >= u.nPengisi), "pengisi tidak pernah melebihi pegawai");
  // Aturan kursi sheet 06 menghasilkan daftar yang sama dengan berkas pada data mentah, lalu
  // diterapkan ulang pada data bersih supaya tetap 200 orang (tanpa nama ganda).
  assert.equal(d.meta.kursi.cocokDenganBerkas, true, JSON.stringify(d.meta.kursi.selisih.slice(0, 5)));
  assert.equal(d.lembaga.peserta.total, 200);
  assert.equal(d.lembaga.peserta.perJalur.penanda, 128);
  assert.equal(d.lembaga.peserta.perJalur.penanda + d.lembaga.peserta.perJalur.kuota + d.lembaga.peserta.perJalur.sisa, 200);
  assert.equal(new Set(d.individu.filter((o) => o.peserta).map((o) => o.nama.toLowerCase())).size, 200, "tidak ada nama ganda di daftar peserta");
  assert.equal(d.lembaga.pesertaInfo.catatan, null);
  assert.equal(d.lembaga.peserta.perAlasan.fungsi, 0);
  assert.equal(d.lembaga.nUnitDibawahAmbang, 7);
  // Rata-rata dihitung ulang dari baris bersih, bukan dari sheet 07.
  const rata = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  assert.equal(d.lembaga.indeks, Math.round(rata(d.individu.map((o) => o.indeks)) * 10) / 10);
  for (const u of d.unit) {
    const orang = d.individu.filter((o) => o.unitId === u.id);
    assert.equal(u.indeks, Math.round(rata(orang.map((o) => o.indeks)) * 10) / 10, u.nama);
    assert.equal(u.nPengisi, orang.length, u.nama);
  }
});

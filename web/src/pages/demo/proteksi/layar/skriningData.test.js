// Uji data layar Skrining HEART: daftar anak, kelas, dan formulir tidak boleh bertentangan dengan
// data bersama (bersama/heart.js, dukungan.js, tindakLanjut.js), dan teks layar tidak memakai
// istilah skrining lama. Jalankan dari folder web: node --test src/pages/demo/proteksi/layar/skriningData.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ANAK_2B, HEART, HEART_IDS, RINGKAS_SEKOLAH, statusTerberat } from "../bersama/heart.js";
import { BUDDY_2B } from "../bersama/dukungan.js";
import { PEMILIK } from "../bersama/tindakLanjut.js";
import {
  ASPEK_TERATAS,
  BUTIR_HEART,
  EVALUASI,
  HASIL_KELAS,
  HEART_ANAK,
  KELAS,
  KELAS_WALAS,
  KELAS_WALAS_BELUM,
  PENDUKUNG,
  PERHATIAN,
  PERTANYAAN_KEAMANAN,
  TANDA_BAHAYA,
  TANDA_TERBUKA,
  TOTAL,
  USULAN,
  WASPADA,
  WASPADA_BELUM,
  bacaHeart,
  usulanAnak,
} from "./skriningData.js";

const SEMUA = [...WASPADA, ...PERHATIAN];

test("jumlah anak per daftar sama dengan ringkasan sekolah", () => {
  assert.equal(WASPADA.length, RINGKAS_SEKOLAH.waspada);
  assert.equal(PERHATIAN.length, RINGKAS_SEKOLAH.perhatian);
  assert.equal(TANDA_BAHAYA.length, RINGKAS_SEKOLAH.tandaBahaya);
  assert.equal(new Set(SEMUA.map((a) => a.nama)).size, SEMUA.length, "nama anak ganda");
});

test("kode HEART: Waspada punya minimal satu w, Perlu Perhatian minimal satu p tanpa w", () => {
  for (const a of SEMUA) assert.match(a.heart, /^[bpw]{5}$/, `${a.nama}: kode tidak sah`);
  for (const a of WASPADA) assert.equal(statusTerberat(Object.values(bacaHeart(a.heart))), "waspada", `${a.nama} bukan Waspada`);
  for (const a of PERHATIAN) assert.equal(statusTerberat(Object.values(bacaHeart(a.heart))), "perhatian", `${a.nama} bukan Perlu Perhatian`);
  assert.deepEqual(Object.keys(bacaHeart("bpbwb")), HEART_IDS);
});

test("anak kelas 2B sama persis dengan ANAK_2B", () => {
  const bersama = ANAK_2B.filter((a) => a.status === "waspada" || a.status === "perhatian");
  const di2B = SEMUA.filter((a) => a.kelas === KELAS_WALAS);
  assert.deepEqual(di2B.map((a) => a.nama).sort(), bersama.map((a) => a.nama).sort());
  for (const a of bersama) {
    assert.deepEqual(bacaHeart(HEART_ANAK[a.nama]), a.heart, `${a.nama}: kode HEART beda dengan ANAK_2B`);
  }
  // Buddy yang tampil di layar ini sama dengan pasangan buddy kelas 2B.
  for (const a of WASPADA.filter((x) => x.kelas === KELAS_WALAS && x.tindak.buddy)) {
    assert.equal(a.tindak.buddy, BUDDY_2B.find((b) => b.anak === a.nama)?.buddy, `${a.nama}: buddy beda dengan BUDDY_2B`);
  }
});

test("kelas: total formulir sama dengan kartu, anak perlu tindak lanjut tidak melebihi yang sudah diskrining", () => {
  const jumlah = (k) => KELAS.reduce((n, x) => n + x[k], 0);
  assert.equal(jumlah("anak"), RINGKAS_SEKOLAH.total);
  assert.equal(jumlah("walas"), RINGKAS_SEKOLAH.terpetakan);
  assert.equal(jumlah("ortu"), 241);
  const kelas = new Set(KELAS.map((k) => k.kelas));
  for (const a of [...SEMUA, ...TANDA_BAHAYA]) assert.ok(kelas.has(a.kelas), `${a.nama}: kelas ${a.kelas} tidak dikenal`);
  let baik = 0;
  for (const k of KELAS) {
    const ditandai = SEMUA.filter((a) => a.kelas === k.kelas).length;
    assert.ok(ditandai <= k.walas, `${k.kelas}: ${ditandai} anak ditandai, sudah diskrining ${k.walas}`);
    baik += k.walas - ditandai;
  }
  assert.equal(baik, RINGKAS_SEKOLAH.baik);
});

test("tanda bahaya: anaknya punya hasil HEART, butir pertanyaannya ada", () => {
  for (const t of TANDA_BAHAYA) {
    assert.ok(HEART_ANAK[t.nama], `${t.nama} tidak ada di daftar`);
    assert.ok(PERTANYAAN_KEAMANAN[t.butir], `${t.nama}: butir ${t.butir} tidak ada`);
    assert.match(t.kasus, /^KS-\d{3}$/);
  }
});

test("formulir: lima butir per aspek HEART, enam pertanyaan keamanan, isian pendukung dua versi", () => {
  assert.deepEqual(Object.keys(BUTIR_HEART), HEART_IDS);
  for (const a of HEART) assert.equal(BUTIR_HEART[a.id].length, a.indikator.length, `${a.id}: butir tidak sama dengan indikator`);
  assert.equal(PERTANYAAN_KEAMANAN.length, 6);
  assert.ok(PENDUKUNG.ot.butir.length && PENDUKUNG.wk.butir.length);
});

test("usulan tindak lanjut: pemilik dikenal, cukup butir untuk aspek Waspada", () => {
  assert.deepEqual(Object.keys(USULAN), HEART_IDS);
  for (const [id, daftar] of Object.entries(USULAN)) {
    assert.ok(daftar.length >= 4, `${id}: usulan kurang dari 4`);
    for (const u of daftar) assert.ok(PEMILIK[u.oleh], `${id}: pemilik ${u.oleh} tidak dikenal`);
  }
  for (const a of WASPADA.filter((x) => x.tindak.jenis === "belum")) {
    const butir = usulanAnak(a.heart);
    assert.ok(butir.length >= 4, `${a.nama}: usulan terlalu sedikit`);
    assert.equal(new Set(butir.map((b) => b.id)).size, butir.length);
    if (!a.tindak.buddy) assert.ok(a.calonBuddy?.length, `${a.nama}: tanpa calon buddy`);
  }
  assert.ok(EVALUASI.some((e) => e.id === "4"));
});

test("teks layar: tanpa em-dash dan tanpa istilah skrining lama", () => {
  const berkas = ["./skriningData.js", "./Skrining.jsx", "./SkriningLaci.jsx"].map((b) =>
    readFileSync(new URL(b, import.meta.url), "utf8"),
  );
  const LAMA = ["Sesuai tahap", "Perlu dipantau", "Perlu dukungan", "Tanda keamanan", "Fokus & energi", "Fokus &amp; energi", "Kepedulian"];
  for (const isi of berkas) {
    assert.ok(!isi.includes(String.fromCharCode(0x2014)), "ada em-dash");
    for (const kata of LAMA) assert.ok(!isi.toLowerCase().includes(kata.toLowerCase()), `istilah lama: ${kata}`);
    // Nama aspek lama yang berdiri sendiri (Relasi Pertemanan tetap boleh).
    assert.ok(!/(?<!Relasi )Pertemanan/.test(isi), "nama aspek lama: Pertemanan");
    assert.ok(!/"Perasaan"|"Perilaku"|>Perasaan<|>Perilaku</.test(isi), "nama aspek lama: Perasaan atau Perilaku");
  }
});

test("teks tampilan: istilah sulit sudah diganti kata sehari-hari", () => {
  // Hanya teks tampilan: isi string dan teks JSX, sesudah komentar dibuang. Nama properti di kode
  // (t.buddy, calonBuddy, RINGKAS_SEKOLAH.terpetakan) tidak ikut karena didahului titik atau huruf.
  const SULIT = /(?<![.\w])(buddy|terpetakan|triage|ditriage|observasi|eskalasi|SLA|rencana tindak)(?![\w:])/i;
  for (const b of ["./skriningData.js", "./Skrining.jsx", "./SkriningLaci.jsx"]) {
    const kode = readFileSync(new URL(b, import.meta.url), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    const teks = [...kode.matchAll(/"([^"\\\n]*)"|`([^`]*)`|>([^<>{}]*)</g)].map((m) => m[1] ?? m[2] ?? m[3]);
    for (const t of teks) assert.ok(!SULIT.test(t), `${b}: istilah sulit di "${t.trim()}"`);
  }
});

test("halaman utama: yang mendesak (tanda bahaya terbuka, Waspada tanpa tindak lanjut) sesuai data", () => {
  assert.deepEqual(
    WASPADA_BELUM.map((a) => a.nama),
    WASPADA.filter((a) => a.tindak.jenis === "belum").map((a) => a.nama),
  );
  assert.ok(WASPADA_BELUM.length > 0 && TANDA_TERBUKA.length > 0);
  for (const t of TANDA_TERBUKA) assert.ok(!t.selesai, `${t.nama}: kasus sudah selesai`);
  assert.equal(TOTAL.anak, RINGKAS_SEKOLAH.total);
  assert.equal(TOTAL.walas, RINGKAS_SEKOLAH.terpetakan);
  assert.equal(TOTAL.belumOrtu, TOTAL.anak - TOTAL.ortu);
  assert.ok(KELAS_WALAS_BELUM.every((k) => k.walas < k.anak) && KELAS_WALAS_BELUM.length > 0);
  // Dua aspek teratas memang yang paling banyak anak tidak Baik.
  const n = HEART.map((a) => RINGKAS_SEKOLAH.perAspek[a.id].perhatian + RINGKAS_SEKOLAH.perAspek[a.id].waspada).sort((p, q) => q - p);
  assert.deepEqual(ASPEK_TERATAS.map((t) => t.n), n.slice(0, 2));
  // Hasil per kelas menjumlah ke daftar anak.
  assert.equal(HASIL_KELAS.reduce((s, k) => s + k.jumlah, 0), SEMUA.length);
  assert.equal(HASIL_KELAS.reduce((s, k) => s + k.waspada, 0), WASPADA.length);
});

test("sebaran per aspek di ringkasan sekolah sama dengan kode HEART daftar anak", () => {
  const status = { b: "baik", p: "perhatian", w: "waspada" };
  HEART.forEach((aspek, i) => {
    const hitung = { baik: RINGKAS_SEKOLAH.baik, perhatian: 0, waspada: 0 };
    for (const anak of [...WASPADA, ...PERHATIAN]) hitung[status[anak.heart[i]]] += 1;
    assert.deepEqual(hitung, RINGKAS_SEKOLAH.perAspek[aspek.id], `${aspek.id}: sebaran tidak cocok dengan daftar anak`);
  });
});

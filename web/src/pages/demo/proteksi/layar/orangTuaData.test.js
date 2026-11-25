import test from "node:test";
import assert from "node:assert/strict";
import { HEART } from "../bersama/heart.js";
import { ARTI_SINGKAT, PERTAHANKAN, RITME, SCREENING_ORTU, TUGAS_RUMAH, cuplikanRutin, ritmeButir, rutinOrtu } from "./orangTuaData.js";

test("setiap rutinitas orang tua berjangka harian atau mingguan", () => {
  const rutin = rutinOrtu();
  assert.equal(rutin.length, TUGAS_RUMAH.length + PERTAHANKAN.length);
  for (const b of rutin) assert.ok(Object.keys(RITME).includes(b.ritme), `${b.id}: ritme ${b.ritme}`);
  // Ada tugas harian dan mingguan, supaya kedua kelompok di halaman Checklist terisi.
  assert.ok(rutin.some((b) => b.ritme === "harian"));
  assert.ok(rutin.some((b) => b.ritme === "mingguan"));
});

test("ritme dibaca dari waktu bila kolom ritme kosong (tambahan sekolah)", () => {
  assert.equal(ritmeButir({ waktu: "Setiap hari" }), "harian");
  assert.equal(ritmeButir({ waktu: "Setiap pagi" }), "harian");
  assert.equal(ritmeButir({ waktu: "Setiap minggu" }), "mingguan");
  assert.equal(ritmeButir({ waktu: "Kamis, 3 Des" }), "mingguan");
  assert.equal(ritmeButir({ waktu: "Setiap hari", ritme: "mingguan" }), "mingguan");
});

test("cuplikan Beranda: paling banyak tiga, belum selesai, harian lebih dulu", () => {
  const rutin = rutinOrtu();
  const centang = { [rutin.find((b) => b.ritme === "harian").id]: true };
  const c = cuplikanRutin(rutin, centang);
  assert.ok(c.length <= 3);
  assert.ok(c.every((b) => !centang[b.id]));
  const pertamaMingguan = c.findIndex((b) => b.ritme === "mingguan");
  if (pertamaMingguan >= 0) assert.ok(c.slice(pertamaMingguan).every((b) => b.ritme === "mingguan"));
  const semua = Object.fromEntries(rutin.map((b) => [b.id, true]));
  assert.deepEqual(cuplikanRutin(rutin, semua), []);
});

test("screening orang tua: satu pernyataan per indikator HEART, id unik", () => {
  assert.equal(SCREENING_ORTU.length, HEART.reduce((n, a) => n + a.indikator.length, 0));
  assert.equal(new Set(SCREENING_ORTU.map((b) => b.id)).size, SCREENING_ORTU.length);
  for (const b of SCREENING_ORTU) assert.ok(b.teks && b.teks.length > 5, `${b.id} tanpa teks`);
});

test("arti singkat untuk orang tua memakai bahasa terindikasi, bukan diagnosis", () => {
  for (const [id, teks] of Object.entries(ARTI_SINGKAT)) assert.match(teks, /^Terindikasi/, id);
});

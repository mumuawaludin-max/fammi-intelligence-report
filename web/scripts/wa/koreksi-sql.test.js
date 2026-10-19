// Uji penyusun SQL koreksi narasi. Jalankan: npm test (dari folder web/).
import { test } from "node:test";
import assert from "node:assert/strict";
import { susunKoreksi } from "./koreksi-sql.mjs";

const lama = { narasi: [
  { cakupan: "individu", kunci: "R1", isi: { refleksi: "a" } },
  { cakupan: "individu", kunci: "R2", isi: { refleksi: "b" } },
  { cakupan: "respons_cerita", kunci: "R1", isi: { ada: true, draf: "lama" } },
  { cakupan: "respons_cerita", kunci: "R2", isi: { ada: true, draf: "tetap" } },
  { cakupan: "unit", kunci: "u1", isi: { x: "sama" } },
] };
const baru = { narasi: [
  { cakupan: "individu", kunci: "R1", isi: { refleksi: "a2", aspek: { p: { arti: "x", langkah: "y" } } } },
  { cakupan: "individu", kunci: "R2", isi: { refleksi: "b", aspek: { p: { arti: "x", langkah: "y" } } } },
  { cakupan: "respons_cerita", kunci: "R1", isi: { ada: true, cerita: "cerita O'Neil", draf: "baru" } },
  { cakupan: "respons_cerita", kunci: "R2", isi: { ada: true, cerita: "cerita", draf: "tetap" } },
  { cakupan: "unit", kunci: "u1", isi: { x: "sama" } },
] };
const { baris } = susunKoreksi(lama, baru, "WA-X");
const cari = (kunci, cakupan) => baris.filter((b) => b.includes(`cakupan = '${cakupan}' and kunci = '${kunci}'`));

test("narasi yang tidak berubah tidak disentuh", () => {
  assert.equal(cari("u1", "unit").length, 0);
});

test("isi utama berubah: ganti penuh di baris belum disunting, tambahan dipasang di baris disunting", () => {
  const [penuh, tambah] = cari("R1", "individu");
  assert.match(penuh, /disunting = false;$/);
  assert.match(penuh, /menunggu_persetujuan/);
  assert.match(tambah, /jsonb_set\(isi, '\{aspek\}'/);
  assert.match(tambah, /disunting = true;$/);
});

test("hanya aspek ditambahkan: semua baris, status kembali menunggu", () => {
  const b = cari("R2", "individu");
  assert.equal(b.length, 1);
  assert.doesNotMatch(b[0], /disunting/);
  assert.match(b[0], /menunggu_persetujuan/);
});

test("hanya cerita ditambahkan: status persetujuan tidak diubah", () => {
  const b = cari("R2", "respons_cerita");
  assert.equal(b.length, 1);
  assert.match(b[0], /jsonb_set\(isi, '\{cerita\}'/);
  assert.doesNotMatch(b[0], /menunggu_persetujuan/);
});

test("isi memakai dollar-quote, tanda kutip dalam cerita tidak merusak SQL", () => {
  const b = cari("R1", "respons_cerita").join("\n");
  assert.match(b, /cerita O'Neil/);
  assert.match(b, /\$wa[a-z0-9]+\$/);
});

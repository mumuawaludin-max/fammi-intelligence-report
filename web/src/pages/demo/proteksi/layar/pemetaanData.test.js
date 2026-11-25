// Uji halaman Hasil HEART (pemetaan): angka sekolah, kelas, dan anak harus sama dengan layar
// Skrining dan Ringkasan, karena semuanya disusun ulang dari data yang sama.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ANAK_2B, HEART, RINGKAS_2B, RINGKAS_SEKOLAH } from "../bersama/heart.js";
import { KELAS } from "./skriningData.js";
import { PER_KELAS, SEMUA, anakUntuk, ringkasan, temuan } from "./pemetaanData.js";

test("ringkasan sekolah sama dengan RINGKAS_SEKOLAH, termasuk per aspek", () => {
  const r = ringkasan(SEMUA);
  assert.equal(r.anak, RINGKAS_SEKOLAH.total);
  assert.equal(r.diskrining, RINGKAS_SEKOLAH.terpetakan);
  assert.equal(r.baik, RINGKAS_SEKOLAH.baik);
  assert.equal(r.perhatian, RINGKAS_SEKOLAH.perhatian);
  assert.equal(r.waspada, RINGKAS_SEKOLAH.waspada);
  for (const a of HEART) assert.deepEqual(r.perAspek[a.id], RINGKAS_SEKOLAH.perAspek[a.id], a.id);
});

test("jumlah per kelas berjumlah sama dengan sekolah", () => {
  const r = ringkasan(SEMUA);
  const jumlah = (k) => PER_KELAS.reduce((n, x) => n + x[k], 0);
  assert.equal(PER_KELAS.length, KELAS.length);
  for (const k of ["waspada", "perhatian", "baik", "belum"]) assert.equal(jumlah(k), r[k], k);
});

test("kelas 2B: semua anak bernama dan sama dengan RINGKAS_2B", () => {
  const anak = anakUntuk("2B");
  const r = ringkasan("2B");
  assert.equal(anak.length, ANAK_2B.length);
  for (const k of ["baik", "perhatian", "waspada", "belum"]) {
    assert.equal(anak.filter((a) => a.status === k).length, RINGKAS_2B[k], k);
    assert.equal(r[k], RINGKAS_2B[k], `ringkasan ${k}`);
  }
});

test("temuan: kalimat tanpa istilah teknis dan tanpa em-dash", () => {
  for (const k of [SEMUA, ...KELAS.map((x) => x.kelas)]) {
    for (const t of temuan(ringkasan(k))) {
      assert.doesNotMatch(t.teks, /triage|SLA|terpetakan|buddy|observasi|—/i, `${k}: ${t.teks}`);
    }
  }
});

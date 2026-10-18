// Uji isi panduan modul Wellbeing Assessment. Jalankan: npm test (dari folder web/).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TAB_BERPANDUAN, langkahHc, langkahPegawai } from "./waTur.js";
import { KATA_KLISE } from "./waAturan.js";
import { KATA_TERLARANG } from "./waMeta.js";

const folder = path.dirname(fileURLToPath(import.meta.url));
const semuaLangkah = [
  ["pegawai", langkahPegawai()],
  ...TAB_BERPANDUAN.map((tab) => [`hc ${tab}`, langkahHc(tab, { nResponden: 195 })]),
];

function teksLangkah(l) {
  return [l.judul, ...(l.isi || []), ...(l.daftar || []).flatMap((d) => [d.label, d.teks])].join("\n");
}

test("tiap langkah punya judul dan isi", () => {
  for (const [nama, daftar] of semuaLangkah) {
    assert.ok(daftar.length > 0, nama);
    for (const l of daftar) {
      assert.ok(l.judul, `${nama}: judul kosong`);
      assert.ok(l.isi?.length, `${nama} ${l.judul}: isi kosong`);
    }
  }
});

test("teks panduan bebas kata terlarang, tanda hubung panjang, dan kata klise", () => {
  for (const [nama, daftar] of semuaLangkah) {
    for (const l of daftar) {
      const teks = teksLangkah(l);
      assert.doesNotMatch(teks, KATA_TERLARANG, `${nama} ${l.judul}`);
      assert.doesNotMatch(teks, /—|--/, `${nama} ${l.judul}`);
      assert.doesNotMatch(teks, KATA_KLISE, `${nama} ${l.judul}`);
      assert.doesNotMatch(teks, /\b(gangguan|tidak sehat|diagnosis klinis)\b/i, `${nama} ${l.judul}`);
    }
  }
});

test("panduan pegawai menjelaskan keenam huruf PROTEK", () => {
  const protek = langkahPegawai().find((l) => l.target === "aspek");
  assert.equal(protek.daftar.map((d) => d.tanda).join(""), "PROTEK");
});

test("tiap target panduan ada di komponen", () => {
  const sumber = fs.readdirSync(path.join(folder, ".."))
    .filter((f) => f.endsWith(".jsx"))
    .map((f) => fs.readFileSync(path.join(folder, "..", f), "utf8"))
    .join("\n");
  const ada = new Set([...sumber.matchAll(/(?:data-tur|tur)\s*=\s*\{?"([a-z-]+)"/g)].map((m) => m[1]));
  // target yang dipilih lewat ekspresi (KartuTop memilih salah satu)
  for (const m of sumber.matchAll(/"(top-kuat|top-perlu)"/g)) ada.add(m[1]);
  for (const [nama, daftar] of semuaLangkah) {
    for (const l of daftar) {
      if (l.target) assert.ok(ada.has(l.target), `${nama}: target "${l.target}" tidak ditemukan`);
    }
  }
});

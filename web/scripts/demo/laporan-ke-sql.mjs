#!/usr/bin/env node
// Ubah satu laporan HTML mandiri jadi SQL yang menyimpannya di tabel demo_reports, untuk ditempel
// di Supabase SQL Editor sesudah migration 20261111100000_demo_access.sql.
//
//   npm run demo:laporan -- <berkas.html> <id sistem> "<judul>" [berkas-keluaran.sql]
//   npm run demo:laporan -- ../supabase/demo/laporan-keuangan.html finance-planning "Dashboard Keuangan Sekolah" ../supabase/demo/laporan-keuangan.sql
//
// Isi HTML dibungkus dollar quoting dengan tanda yang dipastikan tidak muncul di dalam HTML, jadi
// tanda kutip dan karakter apa pun di laporan tidak perlu di-escape. Laporan hanya keluar dari
// server untuk sesi demo yang sah (fungsi demo_report_html).

import { readFileSync, writeFileSync } from "node:fs";

const SISTEM = ["education-character", "safety-crisis", "talent-life-design", "teacher-growth", "finance-planning"];

const [berkas, sistem, judul, keluaran] = process.argv.slice(2);
if (!berkas || !SISTEM.includes(sistem) || !judul) {
  console.error('Pakai: npm run demo:laporan -- <berkas.html> <id sistem> "<judul>" [keluaran.sql]');
  console.error(`Id sistem: ${SISTEM.join(", ")}`);
  process.exit(1);
}

const html = readFileSync(berkas, "utf8");
if (!/<html[\s>]/i.test(html)) {
  console.error("Berkas ini tidak tampak seperti dokumen HTML utuh.");
  process.exit(1);
}
if (html.length > 8_000_000) {
  console.error("Laporan lebih dari 8 MB, melebihi batas kolom demo_reports.html.");
  process.exit(1);
}

// Tanda tetap supaya keluaran sama tiap dibuat ulang; diberi nomor hanya kalau bentrok dengan isi.
let tanda = "$laporan_demo$";
for (let n = 1; html.includes(tanda); n += 1) tanda = `$laporan_demo_${n}$`;

const kutipTeks = (s) => `'${s.replace(/'/g, "''")}'`;

const sql = [
  `-- Laporan HTML demo untuk sistem ${sistem}, dibuat dari ${berkas.split(/[\\/]/).pop()}.`,
  "-- Jalankan di Supabase SQL Editor SESUDAH migration 20261111100000_demo_access.sql.",
  "-- Menjalankan ulang mengganti laporan yang lama. Dibuat ulang dengan npm run demo:laporan.",
  `select public.demo_report_upsert(${kutipTeks(sistem)}, ${kutipTeks(judul)}, ${tanda}${html}${tanda});`,
  "",
].join("\n");

if (keluaran) {
  writeFileSync(keluaran, sql, "utf8");
  console.log(`Tertulis ${keluaran} (${Math.round(sql.length / 1024)} KB).`);
} else {
  process.stdout.write(sql);
}

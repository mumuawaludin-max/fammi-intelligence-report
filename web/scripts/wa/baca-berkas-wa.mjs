// Baca berkas olahan Wellbeing Assessment (xlsx) lalu tulis:
//   web/wa-data-lokal/<slug>.json            dataset untuk pratinjau lokal (?preview=wa)
//   web/wa-data-lokal/<slug>.seed.sql        seed Supabase satu transaksi
//   web/wa-data-lokal/<slug>.seed.bagian-N.sql  pecahan seed kalau terlalu panjang untuk SQL Editor
//
// Semua berkas keluaran BERISI NAMA PEGAWAI dan draf respons untuk cerita pribadi. Folder
// wa-data-lokal/ ada di .gitignore dan hanya dibaca aplikasi saat `npm run dev`.
//
// Pemakaian (dari folder web/):
//   npm run wa:baca -- "C:/path/Athirah - Master - Olahan.xlsx" \
//     --sekolah ATHIRAH --periode 2026-10 --lembaga "Sekolah Islam Athirah" [--slug athirah]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";
import { bacaDatasetWa, slug as buatSlug } from "../../src/pages/wa/lib/waPembaca.js";
import { datasetKeSql } from "./waSql.mjs";

XLSX.set_fs(fs);

function argumen(argv) {
  const hasil = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) hasil[a.slice(2)] = argv[++i];
    else hasil._.push(a);
  }
  return hasil;
}

export function bacaWorkbook(berkas) {
  const wb = XLSX.readFile(berkas, { cellDates: false });
  const sheets = {};
  for (const nama of wb.SheetNames) {
    sheets[nama] = XLSX.utils.sheet_to_json(wb.Sheets[nama], { header: 1, defval: null, raw: true });
  }
  return sheets;
}

function main() {
  const arg = argumen(process.argv.slice(2));
  const berkas = arg._[0];
  if (!berkas || !arg.sekolah || !arg.periode || !arg.lembaga) {
    console.error('Pakai: npm run wa:baca -- "<olahan.xlsx>" --sekolah <school_id> --periode YYYY-MM --lembaga "<nama>" [--slug <slug>]');
    process.exit(1);
  }
  const slug = arg.slug || buatSlug(arg.lembaga);
  const dataset = bacaDatasetWa(bacaWorkbook(berkas), {
    lembaga: arg.lembaga,
    sekolahId: arg.sekolah,
    periodeId: arg.periode,
    sumber: path.basename(berkas),
    dibuat: new Date().toISOString(),
  });

  const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const folder = path.join(web, "wa-data-lokal");
  fs.mkdirSync(folder, { recursive: true });
  const datasetId = `WA-${arg.sekolah}-${arg.periode}`;
  const sql = datasetKeSql(dataset, { datasetId });
  fs.writeFileSync(path.join(folder, `${slug}.json`), JSON.stringify(dataset));
  fs.writeFileSync(path.join(folder, `${slug}.seed.sql`), sql.utuh);
  for (const f of fs.readdirSync(folder)) {
    if (f.startsWith(`${slug}.seed.bagian-`)) fs.rmSync(path.join(folder, f));
  }
  if (sql.bagian.length > 1) {
    sql.bagian.forEach((isi, i) => fs.writeFileSync(path.join(folder, `${slug}.seed.bagian-${i + 1}.sql`), isi));
  }

  const lembaga = dataset.kelompok.find((k) => k.cakupan === "lembaga");
  const hitung = (c) => dataset.kelompok.filter((k) => k.cakupan === c).length;
  const perCakupan = dataset.narasi.reduce((a, n) => ({ ...a, [n.cakupan]: (a[n.cakupan] || 0) + 1 }), {});
  console.log(`Dataset ${datasetId}`);
  console.log(`  pengisi dipakai     : ${dataset.meta.nDipakai} dari ${dataset.meta.nAsli} baris`);
  console.log(`  kategori PROTEK     : ${Object.entries(lembaga.protek.n).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  console.log(`  kelompok            : jenjang ${hitung("jenjang")}, unit ${hitung("unit")}, kelompok jabatan ${hitung("kelompok_jabatan")}`);
  console.log(`  narasi              : ${Object.entries(perCakupan).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  console.log(`  perlu tinjau ahli   : ${dataset.narasi.filter((n) => n.perluAhli).length}`);
  console.log(`  ditulis ke          : ${path.relative(web, folder)}/${slug}.json, ${slug}.seed.sql${sql.bagian.length > 1 ? ` (+${sql.bagian.length} bagian)` : ""}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

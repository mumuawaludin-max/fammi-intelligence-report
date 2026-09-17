// Baca berkas olahan Screening Awal Wellbeing (xlsx) lalu tulis:
//   web/sw-data-lokal/<slug>.json      dataset untuk dimuat aplikasi (mode pratinjau lokal)
//   web/sw-data-lokal/<slug>.seed.sql  seed Supabase untuk ditempel di SQL Editor
//
// Kedua berkas BERISI NAMA PEGAWAI dan jawaban terbuka. Folder sw-data-lokal/ ada di .gitignore dan
// hanya dibaca aplikasi saat `npm run dev`; build produksi tidak pernah mengemasnya.
//
// Pemakaian (dari folder web/):
//   npm run sw:baca -- "C:/path/Data Wellbeing Athirah - Final.xlsx" \
//     --sekolah <school_id> --periode 2026-09 --lembaga "Sekolah Islam Athirah" [--slug athirah]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";
import { bacaDatasetSw, slug as buatSlug } from "../../src/pages/sw/lib/swPembaca.js";
import { datasetKeSql } from "./swSql.mjs";

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
    console.error('Pakai: npm run sw:baca -- "<berkas.xlsx>" --sekolah <school_id> --periode YYYY-MM --lembaga "<nama>" [--slug <slug>]');
    process.exit(1);
  }
  const slug = arg.slug || buatSlug(arg.lembaga);
  const dataset = bacaDatasetSw(bacaWorkbook(berkas), {
    lembaga: arg.lembaga,
    sekolahId: arg.sekolah,
    periodeId: arg.periode,
    sumber: path.basename(berkas),
    dibuat: new Date().toISOString(),
  });

  const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const folder = path.join(web, "sw-data-lokal");
  fs.mkdirSync(folder, { recursive: true });
  const datasetId = `SW-${arg.sekolah}-${arg.periode}`;
  fs.writeFileSync(path.join(folder, `${slug}.json`), JSON.stringify(dataset));
  fs.writeFileSync(path.join(folder, `${slug}.seed.sql`), datasetKeSql(dataset, { datasetId }));

  const l = dataset.lembaga;
  console.log(`Dataset ${datasetId}`);
  console.log(`  pengisi Form A      : ${l.nPengisi}`);
  console.log(`  unit                : ${l.nUnit} (${l.nUnitPengamatan} dengan data Form B, ${l.nUnitDibawahAmbang} di bawah ambang ${dataset.asumsi.minPengisiUnit})`);
  console.log(`  peserta lanjutan    : ${l.peserta.total} (${Object.entries(l.peserta.perJalur).map(([k, v]) => `${k} ${v}`).join(", ")})`);
  console.log(`  alasan              : ${Object.entries(l.peserta.perAlasan).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  console.log(`  ditulis ke          : ${path.relative(web, folder)}/${slug}.json dan ${slug}.seed.sql`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

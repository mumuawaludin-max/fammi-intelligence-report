// Susun SQL koreksi wa_narasi dari dua dataset lokal: yang sudah tertanam di Supabase (--lama) dan
// yang sudah dikoreksi (--baru). Dipakai saat narasi diperbaiki setelah seed ditempel, supaya tidak
// perlu menghapus dan menanam ulang dataset (yang akan membuang persetujuan dan suntingan admin).
//
// Aturan per baris narasi yang berubah:
// - Isi utama berubah: seluruh `isi` diganti dan status kembali ke menunggu_persetujuan, KECUALI
//   baris yang sudah disunting admin (disunting = true), yang tidak ditimpa.
// - Isian tambahan ("aspek" penjelasan per aspek, "cerita" tulisan asli pegawai) dipasang lewat
//   jsonb_set, juga di baris yang sudah disunting. "aspek" adalah narasi baru, jadi status kembali
//   ke menunggu_persetujuan; "cerita" bukan tulisan kita, jadi status tidak diubah.
//
// Keluaran BERISI JAWABAN PRIBADI PEGAWAI; tulis hanya ke wa-data-lokal/ (gitignored).
//
// Pemakaian (dari folder web/):
//   npm run wa:koreksi -- --lama wa-data-lokal/x.lama.json --baru wa-data-lokal/x.json \
//     --dataset WA-ATHIRAH-2026-10 --keluar wa-data-lokal/x.koreksi [--judul "teks"]

import fs from "node:fs";
import path from "node:path";

const TAMBAHAN = { aspek: { ulangStatus: true }, cerita: { ulangStatus: false } };
const BATAS_BAGIAN = 550 * 1024;

function argumen(argv) {
  const hasil = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith("--")) hasil[argv[i].slice(2)] = argv[++i];
  return hasil;
}

const tanpaTambahan = (isi) => Object.fromEntries(Object.entries(isi || {}).filter(([k]) => !(k in TAMBAHAN)));
const sama = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const teksSql = (s) => `'${String(s).replace(/'/g, "''")}'`;

export function susunKoreksi(lama, baru, datasetId) {
  const tanda = `wa${Math.random().toString(36).slice(2, 8)}`;
  const jsonb = (v) => {
    const s = JSON.stringify(v);
    if (s.includes(`$${tanda}$`)) throw new Error("Penanda dollar-quote bentrok dengan isi data.");
    return `$${tanda}$${s}$${tanda}$::jsonb`;
  };
  const ulang = "status = 'menunggu_persetujuan', disetujui_oleh = null, disetujui_pada = null";
  const peta = new Map(lama.narasi.map((n) => [`${n.cakupan}|${n.kunci}`, n.isi]));
  const baris = [];
  const ringkas = {};
  for (const n of baru.narasi) {
    const sebelum = peta.get(`${n.cakupan}|${n.kunci}`);
    if (sebelum === undefined || sama(sebelum, n.isi)) continue;
    const kunci = `dataset_id = ${teksSql(datasetId)} and cakupan = ${teksSql(n.cakupan)} and kunci = ${teksSql(n.kunci)}`;
    const utamaBerubah = !sama(tanpaTambahan(sebelum), tanpaTambahan(n.isi));
    const tambahan = Object.keys(TAMBAHAN).filter((k) => k in n.isi && !sama(sebelum[k], n.isi[k]));
    ringkas[n.cakupan] = (ringkas[n.cakupan] || 0) + 1;
    if (utamaBerubah) {
      baris.push(`update public.wa_narasi set isi = ${jsonb(n.isi)}, ${ulang}, diperbarui_pada = now() where ${kunci} and disunting = false;`);
    }
    if (tambahan.length) {
      let isi = "isi";
      for (const k of tambahan) isi = `jsonb_set(${isi}, '{${k}}', ${jsonb(n.isi[k])}, true)`;
      const reset = tambahan.some((k) => TAMBAHAN[k].ulangStatus) ? `, ${ulang}` : "";
      // Kalau isi utama ikut berubah, baris yang belum disunting sudah tertangani di atas.
      const saring = utamaBerubah ? " and disunting = true" : "";
      baris.push(`update public.wa_narasi set isi = ${isi}${reset}, diperbarui_pada = now() where ${kunci}${saring};`);
    }
  }
  return { baris, ringkas };
}

function main() {
  const arg = argumen(process.argv.slice(2));
  if (!arg.lama || !arg.baru || !arg.dataset || !arg.keluar) {
    console.error("Pakai: npm run wa:koreksi -- --lama <lama.json> --baru <baru.json> --dataset <id> --keluar <awalan berkas>");
    process.exit(1);
  }
  const lama = JSON.parse(fs.readFileSync(arg.lama, "utf8"));
  const baru = JSON.parse(fs.readFileSync(arg.baru, "utf8"));
  const { baris, ringkas } = susunKoreksi(lama, baru, arg.dataset);
  if (!baris.length) { console.log("Tidak ada narasi yang berubah."); return; }

  const kepala = [
    `-- Koreksi narasi Wellbeing Assessment ${arg.dataset}${arg.judul ? `: ${arg.judul}` : ""}.`,
    "-- BERISI JAWABAN PRIBADI PEGAWAI. Jangan di-commit, jangan dikirim lewat kanal umum.",
    "-- Aman dijalankan ulang. Narasi yang isinya berubah kembali berstatus menunggu_persetujuan.",
    "-- Baris yang sudah disunting admin tidak ditimpa; hanya ditambahi isian baru (aspek, cerita).",
  ];
  const id = teksSql(arg.dataset);
  const periksa = [
    "-- Pemeriksaan setelah SEMUA bagian dijalankan:",
    `select cakupan, status, count(*) from public.wa_narasi where dataset_id = ${id} group by 1, 2 order by 1, 2;`,
    `select count(*) as respons_bercerita_tanpa_teks from public.wa_narasi where dataset_id = ${id} and cakupan = 'respons_cerita' and (isi->>'ada')::boolean and not (isi ? 'cerita');`,
    `select count(*) as individu_tanpa_aspek from public.wa_narasi where dataset_id = ${id} and cakupan = 'individu' and not (isi ? 'aspek');`,
  ];
  const bagian = [];
  let isi = [];
  let ukuran = 0;
  for (const b of baris) {
    if (ukuran + b.length > BATAS_BAGIAN && isi.length) { bagian.push(isi); isi = []; ukuran = 0; }
    isi.push(b);
    ukuran += b.length + 1;
  }
  if (isi.length) bagian.push(isi);

  const folder = path.dirname(arg.keluar);
  const awalan = path.basename(arg.keluar);
  for (const f of fs.readdirSync(folder)) if (f.startsWith(`${awalan}.bagian-`)) fs.rmSync(path.join(folder, f));
  bagian.forEach((b, i) => {
    const teks = [
      ...kepala,
      `-- Bagian ${i + 1} dari ${bagian.length}. Jalankan semua bagian; urutannya bebas.`,
      "begin;", ...b, "commit;", "",
      ...(i === bagian.length - 1 ? periksa : []), "",
    ].join("\n");
    fs.writeFileSync(path.join(folder, `${awalan}.bagian-${i + 1}.sql`), teks);
  });
  console.log("Narasi berubah:", ringkas);
  console.log(`${baris.length} pernyataan, ${bagian.length} bagian: ${arg.keluar}.bagian-1..${bagian.length}.sql`);
}

if (process.argv[1]?.endsWith("koreksi-sql.mjs")) main();

// Susun SQL koreksi dari dua dataset lokal: yang sudah tertanam di Supabase (--lama) dan yang sudah
// dikoreksi (--baru). Dipakai saat narasi atau angka kelompok diperbaiki setelah seed ditempel, supaya
// tidak perlu menghapus dan menanam ulang dataset (yang akan membuang persetujuan, suntingan admin,
// dan umpan balik pegawai). Yang ditangani: wa_kelompok (diganti per baris, yang hilang dihapus),
// wa_individu (baris yang berubah; daftar pegawai harus sama), dan wa_narasi (aturan di bawah;
// narasi baru masuk menunggu persetujuan, narasi yang cakupannya hilang dihapus).
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
  const id = teksSql(datasetId);
  const sekolahId = baru.meta?.sekolahId || lama.meta?.sekolahId;
  const sekolah = () => {
    if (!sekolahId) throw new Error("meta.sekolahId tidak ada; dibutuhkan untuk baris baru.");
    return teksSql(sekolahId);
  };
  const baris = [];
  const ringkas = {};
  const hitung = (k) => { ringkas[k] = (ringkas[k] || 0) + 1; };

  // ── Angka kelompok (wa_kelompok): diganti utuh per baris; kelompok yang hilang dihapus ──
  // Dipakai saat berkas olahan dihitung ulang (mis. koreksi unit). Tidak ada persetujuan di tabel
  // ini, jadi aman diganti langsung.
  const kelLama = new Map((lama.kelompok || []).map((k) => [`${k.cakupan}|${k.kunci}`, k]));
  const kelBaru = new Map((baru.kelompok || []).map((k) => [`${k.cakupan}|${k.kunci}`, k]));
  for (const [kunci, k] of kelBaru) {
    if (sama(kelLama.get(kunci), k)) continue;
    baris.push(
      "insert into public.wa_kelompok (dataset_id, cakupan, kunci, sekolah_id, nama, n_responden, data) values ("
        + [id, teksSql(k.cakupan), teksSql(k.kunci), sekolah(), teksSql(k.nama), Number(k.nResponden) || 0, jsonb(k)].join(", ")
        + ") on conflict (dataset_id, cakupan, kunci) do update set nama = excluded.nama, n_responden = excluded.n_responden, data = excluded.data;",
    );
    hitung("kelompok");
  }
  for (const [kunci, k] of kelLama) {
    if (kelBaru.has(kunci)) continue;
    baris.push(`delete from public.wa_kelompok where dataset_id = ${id} and cakupan = ${teksSql(k.cakupan)} and kunci = ${teksSql(k.kunci)};`);
    hitung("kelompok_dihapus");
  }

  // ── Data pegawai (wa_individu): hanya yang berubah. Pegawai bertambah atau berkurang berarti
  // dataset lain, dan itu wajib lewat seed ulang, bukan koreksi.
  const indLama = new Map((lama.individu || []).map((o) => [o.id, o]));
  const indBaru = baru.individu || [];
  if (indLama.size && (indLama.size !== indBaru.length || indBaru.some((o) => !indLama.has(o.id)))) {
    throw new Error("Daftar pegawai berbeda antara dataset lama dan baru; pakai seed ulang, bukan koreksi.");
  }
  for (const o of indBaru) {
    if (!indLama.size || sama(indLama.get(o.id), o)) continue;
    baris.push(`update public.wa_individu set unit_id = ${teksSql(o.unitId)}, nama = ${teksSql(o.nama)}, data = ${jsonb(o)} where dataset_id = ${id} and individu_id = ${teksSql(o.id)};`);
    hitung("individu");
  }

  // ── Narasi ──
  const peta = new Map(lama.narasi.map((n) => [`${n.cakupan}|${n.kunci}`, n.isi]));
  const kunciBaru = new Set(baru.narasi.map((n) => `${n.cakupan}|${n.kunci}`));
  for (const n of lama.narasi) {
    if (kunciBaru.has(`${n.cakupan}|${n.kunci}`)) continue;
    baris.push(`delete from public.wa_narasi where dataset_id = ${id} and cakupan = ${teksSql(n.cakupan)} and kunci = ${teksSql(n.kunci)};`);
    hitung(`${n.cakupan}_dihapus`);
  }
  for (const n of baru.narasi) {
    const sebelum = peta.get(`${n.cakupan}|${n.kunci}`);
    if (sebelum === undefined) {
      // Narasi baru (mis. unit yang kini mencapai ambang narasi): masuk menunggu persetujuan.
      baris.push(
        "insert into public.wa_narasi (dataset_id, cakupan, kunci, sekolah_id, isi, perlu_ahli, alasan_perhatian, status, draf_asal) values ("
          + [id, teksSql(n.cakupan), teksSql(n.kunci), sekolah(), jsonb(n.isi), n.perluAhli ? "true" : "false", n.alasanPerhatian ? teksSql(n.alasanPerhatian) : "null", "'menunggu_persetujuan'", "'excel'"].join(", ")
          + ") on conflict (dataset_id, cakupan, kunci) do nothing;",
      );
      hitung(`${n.cakupan}_baru`);
      continue;
    }
    if (sama(sebelum, n.isi)) continue;
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
  console.log("Perubahan per jenis:", ringkas);
  console.log(`${baris.length} pernyataan, ${bagian.length} bagian: ${arg.keluar}.bagian-1..${bagian.length}.sql`);
}

if (process.argv[1]?.endsWith("koreksi-sql.mjs")) main();

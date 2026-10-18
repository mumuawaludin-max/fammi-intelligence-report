// Penulis seed SQL dataset Wellbeing Assessment. Hasilnya ditempel di Supabase SQL Editor
// (importer CSV Studio tidak dipakai). Kolom jsonb dibungkus dollar-quote bertanda acak supaya
// tanda kutip di jawaban terbuka tidak perlu di-escape satu per satu.
//
// Tabelnya dibuat migration modul wa (milestone 4 docs/wa-wellbeing-assessment-plan.md). Semua
// narasi masuk berstatus menunggu_persetujuan; tidak ada yang tayang sebelum disetujui admin.

function dolar(nilai, tanda) {
  const isi = JSON.stringify(nilai ?? null);
  if (isi.includes(`$${tanda}$`)) throw new Error("Penanda dollar-quote bentrok dengan isi data.");
  return `$${tanda}$${isi}$${tanda}$::jsonb`;
}

const teksSql = (s) => (s === null || s === undefined ? "null" : `'${String(s).replace(/'/g, "''")}'`);

/**
 * @returns {{ utuh: string, bagian: string[] }} `utuh` satu transaksi; `bagian` pecahan sekitar
 * `batas` karakter untuk SQL Editor yang menolak teks terlalu panjang. Bagian pertama memuat
 * dataset, bagian berikutnya baris anak.
 */
export function datasetKeSql(dataset, { datasetId, batas = 800_000 }) {
  const tanda = `wa${Math.random().toString(36).slice(2, 8)}`;
  const { meta } = dataset;
  const sekolah = teksSql(meta.sekolahId);
  const id = teksSql(datasetId);
  const kepala = [
    `-- Seed Wellbeing Assessment: ${meta.lembaga} (${meta.periodeId}).`,
    "-- BERISI NAMA PEGAWAI DAN JAWABAN PRIBADI. Jangan di-commit, jangan dikirim lewat kanal umum.",
    `-- Dibuat ${meta.dibuat || "-"} dari ${meta.sumber || "-"}.`,
  ];

  const pembuka = [
    `update public.wa_dataset set aktif = false where sekolah_id = ${sekolah};`,
    `delete from public.wa_dataset where id = ${id};`,
    "insert into public.wa_dataset (id, sekolah_id, periode_id, meta, parameter, item, aktif) values ("
      + [id, sekolah, teksSql(meta.periodeId), dolar(meta, tanda), dolar(dataset.parameter, tanda), dolar(dataset.item, tanda), "true"].join(", ")
      + ");",
  ];

  const anak = [];
  for (const k of dataset.kelompok) {
    anak.push(
      "insert into public.wa_kelompok (dataset_id, cakupan, kunci, sekolah_id, nama, n_responden, data) values ("
        + [id, teksSql(k.cakupan), teksSql(k.kunci), sekolah, teksSql(k.nama), k.nResponden, dolar(k, tanda)].join(", ")
        + ");",
    );
  }
  for (const o of dataset.individu) {
    anak.push(
      "insert into public.wa_individu (dataset_id, individu_id, sekolah_id, unit_id, nama, data) values ("
        + [id, teksSql(o.id), sekolah, teksSql(o.unitId), teksSql(o.nama), dolar(o, tanda)].join(", ")
        + ");",
    );
  }
  for (const n of dataset.narasi) {
    anak.push(
      "insert into public.wa_narasi (dataset_id, cakupan, kunci, sekolah_id, isi, perlu_ahli, alasan_perhatian, status, draf_asal) values ("
        + [id, teksSql(n.cakupan), teksSql(n.kunci), sekolah, dolar(n.isi, tanda), n.perluAhli ? "true" : "false", teksSql(n.alasanPerhatian), "'menunggu_persetujuan'", "'excel'"].join(", ")
        + ");",
    );
  }

  const utuh = [...kepala, "begin;", ...pembuka, ...anak, "commit;", ""].join("\n");

  const bagian = [];
  let isi = [...pembuka];
  let panjang = isi.join("\n").length;
  for (const baris of anak) {
    if (panjang + baris.length > batas && isi.length) {
      bagian.push(isi);
      isi = [];
      panjang = 0;
    }
    isi.push(baris);
    panjang += baris.length + 1;
  }
  if (isi.length) bagian.push(isi);
  const total = bagian.length;
  return {
    utuh,
    bagian: bagian.map((b, i) => [...kepala, `-- Bagian ${i + 1} dari ${total}. Jalankan berurutan.`, "begin;", ...b, "commit;", ""].join("\n")),
  };
}

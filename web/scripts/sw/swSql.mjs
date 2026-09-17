// Penulis seed SQL untuk dataset Screening Awal Wellbeing.
//
// Hasilnya ditempel di Supabase SQL Editor (importer CSV Studio tidak dipakai, lihat catatan
// impor data di repo). Isi kolom jsonb dibungkus dollar-quote bertanda acak supaya tanda kutip
// di jawaban terbuka tidak perlu di-escape satu per satu.

function dolar(nilai, tanda) {
  const isi = JSON.stringify(nilai ?? null);
  if (isi.includes(`$${tanda}$`)) throw new Error("Penanda dollar-quote bentrok dengan isi data.");
  return `$${tanda}$${isi}$${tanda}$::jsonb`;
}

const teksSql = (s) => `'${String(s).replace(/'/g, "''")}'`;

/**
 * Kendali mutu per pimpinan dipisah ke tabel sendiri: RLS baris tidak bisa menyembunyikan satu
 * kunci jsonb, dan bagian ini hanya untuk psikolog.
 */
function pisahQc(unit) {
  if (!unit.pengamatan?.qc) return { unit, qc: [] };
  const { qc, ...sisa } = unit.pengamatan;
  return { unit: { ...unit, pengamatan: sisa }, qc };
}

export function datasetKeSql(dataset, { datasetId }) {
  const tanda = `sw${Math.random().toString(36).slice(2, 8)}`;
  const { meta } = dataset;
  const baris = [];
  baris.push(`-- Seed Screening Awal Wellbeing: ${meta.lembaga} (${meta.periodeId}).`);
  baris.push("-- BERISI NAMA PEGAWAI. Jangan di-commit, jangan dikirim lewat kanal umum.");
  baris.push(`-- Dibuat ${meta.dibuat || "-"} dari ${meta.sumber || "-"}.`);
  baris.push("begin;");
  baris.push(`update public.sw_dataset set aktif = false where sekolah_id = ${teksSql(meta.sekolahId)};`);
  baris.push(`delete from public.sw_dataset where id = ${teksSql(datasetId)};`);
  baris.push(
    "insert into public.sw_dataset (id, sekolah_id, periode_id, meta, asumsi, lembaga, tema, ringkasan_pimpinan, aktif) values ("
      + [
        teksSql(datasetId), teksSql(meta.sekolahId), teksSql(meta.periodeId),
        dolar(meta, tanda), dolar(dataset.asumsi, tanda), dolar(dataset.lembaga, tanda),
        dolar(dataset.tema, tanda), dolar(dataset.ringkasanPimpinan, tanda), "true",
      ].join(", ")
      + ");",
  );

  const qcSemua = [];
  for (const u of dataset.unit) {
    const { unit, qc } = pisahQc(u);
    qc.forEach((q) => qcSemua.push({ unitId: u.id, ...q }));
    baris.push(
      "insert into public.sw_unit (dataset_id, unit_id, sekolah_id, n_pengisi, data) values ("
        + [teksSql(datasetId), teksSql(unit.id), teksSql(meta.sekolahId), unit.nPengisi, dolar(unit, tanda)].join(", ")
        + ");",
    );
  }
  for (const q of qcSemua) {
    const { unitId, ...data } = q;
    baris.push(
      "insert into public.sw_pimpinan_qc (dataset_id, unit_id, sekolah_id, pimpinan, data) values ("
        + [teksSql(datasetId), teksSql(unitId), teksSql(meta.sekolahId), teksSql(q.pimpinan), dolar(data, tanda)].join(", ")
        + ");",
    );
  }
  for (const o of dataset.individu) {
    baris.push(
      "insert into public.sw_individu (dataset_id, individu_id, sekolah_id, unit_id, nama, data) values ("
        + [teksSql(datasetId), teksSql(o.id), teksSql(meta.sekolahId), teksSql(o.unitId), teksSql(o.nama), dolar(o, tanda)].join(", ")
        + ");",
    );
  }
  baris.push("commit;");
  return `${baris.join("\n")}\n`;
}

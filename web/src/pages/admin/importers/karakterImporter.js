import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabase';

function pct(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace('%', '').trim());
  return Number.isFinite(n) ? Math.round(n) : null;
}

const ASPEK_COLS = [
  ['karakter1', 'karakter1_berpikir_positif'],
  ['karakter2', 'karakter2_bicara_baik'],
  ['karakter3', 'karakter3_bertindak_bermanfaat'],
  ['karakter4', 'karakter4_magic_word_maaf'],
  ['karakter5', 'karakter5_magic_word_terima_kasih'],
  ['karakter6', 'karakter6_fiqih_wudhu'],
];

const INDIKATOR_COLS = [
  ['karakter1', 'indikator2_percaya_diri'],
  ['karakter1', 'indikator2_melihat_sisi_baik'],
  ['karakter2', 'indikator1_berkata_sopan'],
  ['karakter2', 'indikator2_pendapat_jelas'],
  ['karakter3', 'indikator1_menjaga_kedisiplinan'],
  ['karakter3', 'indikator2_mendatangkan_kebaikan'],
  ['karakter4', 'indikator1_terbiasa_minta_maaf'],
  ['karakter4', 'indikator2_bersikap_tulus'],
  ['karakter5', 'indikator1_sopan_berterima_kasih'],
  ['karakter5', 'indikator2_menunjukkan_syukur'],
  ['karakter6', 'indikator1_benar_gerakan_wudhu'],
  ['karakter6', 'indikator2_niat_wudhu'],
];

/** murid_id harus konsisten antar periode (bulan) supaya grafik tren per anak tidak putus. */
async function loadExistingMuridIds(sekolahId) {
  const { data, error } = await supabase
    .from('karakter_skor')
    .select('murid_id, nama_murid')
    .eq('sekolah_id', sekolahId);
  if (error) throw error;

  const byNama = {};
  let maxNum = 0;
  (data || []).forEach((r) => {
    if (!byNama[r.nama_murid]) byNama[r.nama_murid] = r.murid_id;
    const n = parseInt(String(r.murid_id).replace(/\D/g, ''), 10);
    if (Number.isFinite(n) && n > maxNum) maxNum = n;
  });
  return { byNama, nextNum: maxNum + 1 };
}

/**
 * Baca workbook Excel (format sama seperti yang dipakai SDIP Al Madani: sheet
 * detail_persentase_karakter / detail_persentase_indikator / detail_pernyataan_orangtua /
 * summary_kelas / summary_jenjang / summary_sekolah) dan siapkan baris siap-insert.
 * murid_id di-resolve terhadap data yang sudah ada di sekolah itu, bukan digenerate ulang
 * dari nol, supaya konsisten dipakai lintas periode.
 */
export async function parseKarakterWorkbook(file, { sekolahId, periodeId }) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = (name) => (wb.Sheets[name] ? XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' }) : []);

  const dk = sheet('detail_persentase_karakter');
  const di = sheet('detail_persentase_indikator');
  const po = sheet('detail_pernyataan_orangtua');
  const sk = sheet('summary_kelas');
  const sj = sheet('summary_jenjang');
  const ss = sheet('summary_sekolah');

  const preview = {
    sheets: [
      { name: 'detail_persentase_karakter', rows: dk.length, found: dk.length > 0 },
      { name: 'detail_persentase_indikator', rows: di.length, found: di.length > 0 },
      { name: 'detail_pernyataan_orangtua', rows: po.length, found: po.length > 0 },
      { name: 'summary_kelas', rows: sk.length, found: sk.length > 0 },
      { name: 'summary_jenjang', rows: sj.length, found: sj.length > 0 },
      { name: 'summary_sekolah', rows: ss.length, found: ss.length > 0 },
    ],
  };

  if (dk.length === 0) {
    return { preview, ok: false, error: 'Sheet "detail_persentase_karakter" tidak ditemukan atau kosong.' };
  }

  const { byNama, nextNum } = await loadExistingMuridIds(sekolahId);
  let seq = nextNum;
  function muridId(nama) {
    if (byNama[nama]) return byNama[nama];
    const id = 'M' + String(seq++).padStart(3, '0');
    byNama[nama] = id;
    return id;
  }

  const skorRows = [];
  dk.forEach((r) => {
    const mid = muridId(r.nama);
    ASPEK_COLS.forEach(([aspek, col]) => {
      skorRows.push({
        sekolah_id: sekolahId, kelas_id: r.kelas, murid_id: mid, nama_murid: r.nama,
        periode_id: periodeId, aspek_kode: aspek, skor: pct(r[col]), sumber: 'guru', status: 'disetujui',
      });
    });
  });

  const skorIndikatorRows = [];
  di.forEach((r) => {
    const mid = muridId(r.nama);
    INDIKATOR_COLS.forEach(([aspek, kode]) => {
      const col = `${aspek}_${kode}`;
      skorIndikatorRows.push({
        sekolah_id: sekolahId, kelas_id: r.kelas, murid_id: mid, nama_murid: r.nama,
        periode_id: periodeId, aspek_kode: aspek, indikator_kode: kode, skor: pct(r[col]),
        sumber: 'guru', status: 'disetujui',
      });
    });
  });

  const pernyataanRows = po.map((r) => ({
    sekolah_id: sekolahId, kelas_id: r.kelas, murid_id: muridId(r.Nama), nama_murid: r.Nama,
    periode_id: periodeId,
    kategori_pernyataan: r.kategori_pernyataan, pernyataan: r.pernyataan_orangtua,
    emosi_anak: r.emosi_anak, alasan_emosi: r.alasan_emosi_anak,
    dukungan_dibutuhkan: r.dukungan_yang_dibutuhkan_orangtua, dukungan_lainnya: r.dukungan_lainya,
    hal_disyukuri: r.hal_yang_disyukuri_orangtua, status: 'disetujui',
  }));

  const summaryRows = [];
  sk.forEach((r) => {
    if (!r.Kelas) return;
    const { bulan, Kelas, ...rest } = r;
    summaryRows.push({ sekolah_id: sekolahId, scope: 'kelas', scope_id: Kelas, periode_id: periodeId, ringkasan: rest, status: 'disetujui' });
  });
  sj.forEach((r) => {
    if (!r.jenjang) return;
    const { bulan, jenjang, ...rest } = r;
    summaryRows.push({ sekolah_id: sekolahId, scope: 'jenjang', scope_id: jenjang, periode_id: periodeId, ringkasan: rest, status: 'disetujui' });
  });
  ss.forEach((r) => {
    const { bulan, ...rest } = r;
    if (Object.values(rest).every((v) => v === '')) return;
    summaryRows.push({ sekolah_id: sekolahId, scope: 'sekolah', scope_id: sekolahId, periode_id: periodeId, ringkasan: rest, status: 'disetujui' });
  });

  return {
    ok: true,
    preview,
    muridBaru: seq - nextNum,
    rows: { skorRows, skorIndikatorRows, pernyataanRows, summaryRows },
  };
}

/** Tulis hasil parse ke Supabase, kembalikan jumlah baris + error kalau ada. */
export async function importKarakterWorkbook(parsed) {
  const { skorRows, skorIndikatorRows, pernyataanRows, summaryRows } = parsed.rows;
  let totalRows = 0;

  for (const [table, rows] of [
    ['karakter_skor', skorRows],
    ['karakter_skor_indikator', skorIndikatorRows],
    ['karakter_pernyataan_ortu', pernyataanRows],
    ['karakter_summary', summaryRows],
  ]) {
    if (rows.length === 0) continue;
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error } = await supabase.from(table).insert(chunk);
      if (error) return { ok: false, rowsWritten: totalRows, error: `${table}: ${error.message}` };
      totalRows += chunk.length;
    }
  }
  return { ok: true, rowsWritten: totalRows };
}

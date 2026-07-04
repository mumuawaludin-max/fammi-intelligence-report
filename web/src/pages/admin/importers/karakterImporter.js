import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabase';

function pct(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace('%', '').trim());
  return Number.isFinite(n) ? Math.round(n) : null;
}

const NAMA_BULAN = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];

/** Cari kolom di baris tanpa peduli besar/kecil huruf, karena header sumber tidak konsisten. */
function getField(row, ...names) {
  const wanted = names.map((n) => n.toLowerCase());
  const key = Object.keys(row).find((k) => wanted.includes(k.toLowerCase().trim()));
  return key ? row[key] : undefined;
}

/** Serial tanggal Excel (basis 1899-12-30) diubah ke Date. */
function excelSerialToDate(n) {
  return new Date(Math.round((n - 25569) * 86400 * 1000));
}

/** Ubah nilai kolom "bulan" (Date, serial Excel, "2026-07", "07/2026", atau "Juli 2026") jadi periode_id "YYYY-MM". Null kalau tidak terbaca. */
function parseBulan(raw) {
  if (raw === '' || raw === null || raw === undefined) return null;
  if (raw instanceof Date) {
    return `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, '0')}`;
  }
  if (typeof raw === 'number') {
    const d = excelSerialToDate(raw);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  const s = String(raw).trim();
  let m = s.match(/^(\d{4})[-\/](\d{1,2})/);
  if (m) return `${m[1]}-${String(parseInt(m[2], 10)).padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[-\/](\d{4})$/);
  if (m) return `${m[2]}-${String(parseInt(m[1], 10)).padStart(2, '0')}`;
  const parts = s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim().split(/\s+/);
  if (parts.length >= 2) {
    const idx = NAMA_BULAN.indexOf(parts[0]);
    if (idx >= 0 && /^\d{4}$/.test(parts[1])) return `${parts[1]}-${String(idx + 1).padStart(2, '0')}`;
  }
  return null;
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
 * dari nol, supaya konsisten dipakai lintas periode. periode_id TIDAK diketik admin, tapi
 * dibaca per baris dari kolom "bulan" di sheet itu sendiri, karena satu file bisa memuat
 * beberapa bulan sekaligus.
 */
export async function parseKarakterWorkbook(file, { sekolahId }) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
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

  const periodeCount = {};
  const badRows = [];
  function resolvePeriode(sheetName, r, rowIdx) {
    const periode = parseBulan(getField(r, 'bulan', 'periode', 'periode_id'));
    if (!periode) {
      badRows.push(`${sheetName} baris ${rowIdx + 2}`);
      return null;
    }
    periodeCount[periode] = (periodeCount[periode] || 0) + 1;
    return periode;
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
  dk.forEach((r, i) => {
    const periode = resolvePeriode('detail_persentase_karakter', r, i);
    const mid = muridId(r.nama);
    ASPEK_COLS.forEach(([aspek, col]) => {
      skorRows.push({
        sekolah_id: sekolahId, kelas_id: r.kelas, murid_id: mid, nama_murid: r.nama,
        periode_id: periode, aspek_kode: aspek, skor: pct(r[col]), sumber: 'guru', status: 'disetujui',
      });
    });
  });

  const skorIndikatorRows = [];
  di.forEach((r, i) => {
    const periode = resolvePeriode('detail_persentase_indikator', r, i);
    const mid = muridId(r.nama);
    INDIKATOR_COLS.forEach(([aspek, kode]) => {
      const col = `${aspek}_${kode}`;
      skorIndikatorRows.push({
        sekolah_id: sekolahId, kelas_id: r.kelas, murid_id: mid, nama_murid: r.nama,
        periode_id: periode, aspek_kode: aspek, indikator_kode: kode, skor: pct(r[col]),
        sumber: 'guru', status: 'disetujui',
      });
    });
  });

  const pernyataanRows = po.map((r, i) => ({
    sekolah_id: sekolahId, kelas_id: r.kelas, murid_id: muridId(r.Nama), nama_murid: r.Nama,
    periode_id: resolvePeriode('detail_pernyataan_orangtua', r, i),
    kategori_pernyataan: r.kategori_pernyataan, pernyataan: r.pernyataan_orangtua,
    emosi_anak: r.emosi_anak, alasan_emosi: r.alasan_emosi_anak,
    dukungan_dibutuhkan: r.dukungan_yang_dibutuhkan_orangtua, dukungan_lainnya: r.dukungan_lainya,
    hal_disyukuri: r.hal_yang_disyukuri_orangtua, status: 'disetujui',
  }));

  const summaryRows = [];
  sk.forEach((r, i) => {
    if (!r.Kelas) return;
    const periode = resolvePeriode('summary_kelas', r, i);
    const { bulan, Kelas, ...rest } = r;
    summaryRows.push({ sekolah_id: sekolahId, scope: 'kelas', scope_id: Kelas, periode_id: periode, ringkasan: rest, status: 'disetujui' });
  });
  sj.forEach((r, i) => {
    if (!r.jenjang) return;
    const periode = resolvePeriode('summary_jenjang', r, i);
    const { bulan, jenjang, ...rest } = r;
    summaryRows.push({ sekolah_id: sekolahId, scope: 'jenjang', scope_id: jenjang, periode_id: periode, ringkasan: rest, status: 'disetujui' });
  });
  ss.forEach((r, i) => {
    const { bulan, ...rest } = r;
    if (Object.values(rest).every((v) => v === '')) return;
    const periode = resolvePeriode('summary_sekolah', r, i);
    summaryRows.push({ sekolah_id: sekolahId, scope: 'sekolah', scope_id: sekolahId, periode_id: periode, ringkasan: rest, status: 'disetujui' });
  });

  if (badRows.length > 0) {
    return {
      preview, ok: false,
      error: `Kolom "bulan" tidak terbaca di: ${badRows.slice(0, 5).join(', ')}${badRows.length > 5 ? ` (+${badRows.length - 5} baris lain)` : ''}. Format yang didukung: tanggal Excel, "2026-07", "07/2026", atau "Juli 2026".`,
    };
  }

  preview.periodeDetected = Object.entries(periodeCount)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periode, rows]) => ({ periode, rows }));

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

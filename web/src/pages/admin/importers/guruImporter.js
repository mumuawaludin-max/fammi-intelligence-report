import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabase';

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/['".-]/g, '')
    .replace(/\s+/g, '');
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Cocokkan nama kelas dari CSV ("1 Umar bin Khattab") ke kelas_id nyata di karakter_skor
 * ("G1 Umar bin Khattab"). Nama sering beda ejaan tipis (Rabah vs Rabbah, Sa'ad vs Saad),
 * jadi dicoba exact-match normalized dulu, baru fallback jarak-edit dalam grade yang sama.
 */
function matchKelas(csvKelas, kelasIdList) {
  const m = String(csvKelas || '').trim().match(/^(\d+)\s*(.*)$/);
  if (!m) return { kelasId: null, confidence: 'unmatched' };
  const grade = m[1];
  const nameNorm = normalize(m[2]);

  const sameGrade = kelasIdList.filter((k) => k.startsWith('G' + grade + ' '));
  if (sameGrade.length === 0) return { kelasId: null, confidence: 'unmatched' };

  let best = null;
  let bestDist = Infinity;
  for (const k of sameGrade) {
    const kNorm = normalize(k.replace(/^G\d+\s*/, ''));
    if (kNorm === nameNorm || kNorm.includes(nameNorm) || nameNorm.includes(kNorm)) {
      return { kelasId: k, confidence: 'exact' };
    }
    const dist = levenshtein(kNorm, nameNorm);
    if (dist < bestDist) { bestDist = dist; best = k; }
  }
  if (best && bestDist <= 3) return { kelasId: best, confidence: 'fuzzy' };
  return { kelasId: null, confidence: 'unmatched' };
}

/**
 * "Posisi" berisi Kepala Sekolah / Wakasek Bidang X / Guru. Kolom "Wali Kelas" berisi
 * "Pimpinan Sekolah" untuk baris pimpinan, atau nama kelas nyata untuk guru pemegang kelas.
 * Wakasek dapat peran WakilKepalaSekolah sendiri (cakupan/akses sama persis dengan
 * KepalaSekolah — sekolah-wide — cuma beda label peran).
 */
function inferPeran(posisi, waliKelasCol) {
  if (String(waliKelasCol || '').trim().toLowerCase() === 'pimpinan sekolah') {
    return /wakasek/i.test(posisi || '') ? 'WakilKepalaSekolah' : 'KepalaSekolah';
  }
  return 'WaliKelas';
}

/**
 * Parse CSV/Excel database guru (kolom: Nama Lengkap, Posisi, Wali Kelas, Email) jadi baris
 * siap create-user. Kelas dicocokkan ke kelas_id nyata di karakter_skor sekolah tsb — kalau
 * gagal cocok, ditandai unmatched supaya admin pilih manual di preview, bukan ditebak.
 */
export async function parseGuruFile(file, { sekolahId }) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });

  const { data: skorRows, error } = await supabase
    .from('karakter_skor')
    .select('kelas_id')
    .eq('sekolah_id', sekolahId);
  if (error) throw new Error(error.message);
  const kelasIdList = [...new Set((skorRows || []).map((r) => r.kelas_id))];

  return rows
    .filter((r) => String(r['Nama Lengkap'] || '').trim())
    .map((r, idx) => {
      const nama = String(r['Nama Lengkap']).trim();
      const posisi = String(r['Posisi'] || '').trim();
      const waliKelasCol = String(r['Wali Kelas'] || '').trim();
      const email = String(r['Email'] || '').trim().toLowerCase();
      const peran = inferPeran(posisi, waliKelasCol);

      let kelasId = null;
      let confidence = 'n/a';
      if (peran === 'WaliKelas') {
        const match = matchKelas(waliKelasCol, kelasIdList);
        kelasId = match.kelasId;
        confidence = match.confidence;
      }

      return {
        rowIndex: idx,
        nama,
        posisi,
        email,
        username: email,
        peran,
        cakupan: kelasId ? [kelasId] : [],
        csvKelas: waliKelasCol,
        confidence,
        kelasOptions: peran === 'WaliKelas' ? kelasIdList : [],
      };
    });
}

/** Panggil Edge Function create-user dalam mode bulk untuk semua baris yang valid. */
export async function bulkCreateUsers(rows, { sekolahId }) {
  const users = rows.map((r) => ({
    nama: r.nama,
    username: r.username,
    peran: r.peran,
    school_id: sekolahId,
    cakupan: r.cakupan,
  }));
  const { data, error } = await supabase.functions.invoke('create-user', { body: { users } });
  if (error) throw new Error(error.message || 'Edge Function create-user gagal dipanggil.');
  return data.results;
}

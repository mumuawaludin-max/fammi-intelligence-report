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

// Nama kolom di file sekolah tidak seragam (beda spasi, huruf besar, atau variasi label).
// Dicocokkan lewat bentuk ternormalisasi supaya "Nama Lengkap", "NAMA LENGKAP ", atau "Nama"
// sama-sama terbaca, bukan diam-diam menghasilkan baris kosong yang lalu terbuang.
const HEADER_ALIASES = {
  nama: ['namalengkap', 'nama', 'namaguru'],
  posisi: ['posisi', 'jabatan'],
  waliKelas: ['walikelas', 'kelas'],
  email: ['email', 'alamatemail', 'emailusername', 'emailaktif'],
};

function pickCol(row, aliases) {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const k = keys.find((key) => normalize(key) === alias);
    if (k !== undefined) return row[k];
  }
  return '';
}

/**
 * Parse CSV/Excel database guru jadi baris siap create-user. SEMUA sheet dibaca lalu
 * digabung — file sekolah sering dipecah satu sheet per kelas/kelompok, dan versi lama yang
 * cuma membaca sheet pertama membuat sebagian besar baris tidak pernah ikut terimport.
 * Kelas dicocokkan ke kelas_id nyata di karakter_skor sekolah tsb — kalau gagal cocok,
 * ditandai unmatched supaya admin pilih manual di preview, bukan ditebak.
 *
 * Return: { rows, sheetCount, dupCount } supaya dialog bisa menampilkan berapa baris
 * terbaca dari berapa sheet (bukti tidak ada baris yang terpotong).
 */
export async function parseGuruFile(file, { sekolahId }) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });

  const { data: skorRows, error } = await supabase
    .from('karakter_skor')
    .select('kelas_id')
    .eq('sekolah_id', sekolahId);
  if (error) throw new Error(error.message);
  const kelasIdList = [...new Set((skorRows || []).map((r) => r.kelas_id))];

  const rows = [];
  const seenEmails = new Set();
  let dupCount = 0;
  let sheetCount = 0;

  for (const sheetName of wb.SheetNames) {
    const sheetRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
    if (sheetRows.length === 0) continue;
    sheetCount += 1;

    for (const r of sheetRows) {
      const nama = String(pickCol(r, HEADER_ALIASES.nama) || '').trim();
      if (!nama) continue;

      const posisi = String(pickCol(r, HEADER_ALIASES.posisi) || '').trim();
      const waliKelasCol = String(pickCol(r, HEADER_ALIASES.waliKelas) || '').trim();
      const email = String(pickCol(r, HEADER_ALIASES.email) || '').trim().toLowerCase();

      // Orang yang sama bisa muncul di lebih dari satu sheet (mis. pimpinan tercantum di tiap
      // sheet kelas). Email sama = akun sama, cukup dibuat sekali; tanpa dedupe baris kedua
      // pasti gagal "already registered" dan bikin hasil terlihat cuma sebagian berhasil.
      if (email) {
        if (seenEmails.has(email)) { dupCount += 1; continue; }
        seenEmails.add(email);
      }

      const peran = inferPeran(posisi, waliKelasCol);

      let kelasId = null;
      let confidence = 'n/a';
      if (peran === 'WaliKelas') {
        const match = matchKelas(waliKelasCol, kelasIdList);
        kelasId = match.kelasId;
        confidence = match.confidence;
      }

      rows.push({
        rowIndex: rows.length,
        sheetName,
        nama,
        posisi,
        email,
        username: email,
        peran,
        cakupan: kelasId ? [kelasId] : [],
        csvKelas: waliKelasCol,
        confidence,
        kelasOptions: peran === 'WaliKelas' ? kelasIdList : [],
      });
    }
  }

  return { rows, sheetCount, dupCount };
}

// Dikirim bertahap, bukan satu request raksasa: Edge Function membuat akun satu per satu,
// jadi request berisi ratusan baris bisa kena timeout di tengah — sebagian akun sudah
// terbuat, sisanya hilang tanpa laporan. Chunk kecil menjaga tiap request singkat sehingga
// berapa pun jumlah baris di file pasti terproses semua.
const BULK_CHUNK_SIZE = 10;

/** Panggil Edge Function create-user per-chunk untuk semua baris. onProgress(done, total) opsional. */
export async function bulkCreateUsers(rows, { sekolahId, onProgress }) {
  const users = rows.map((r) => ({
    nama: r.nama,
    username: r.username,
    peran: r.peran,
    school_id: sekolahId,
    cakupan: r.cakupan,
  }));

  const results = [];
  for (let i = 0; i < users.length; i += BULK_CHUNK_SIZE) {
    const chunk = users.slice(i, i + BULK_CHUNK_SIZE);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', { body: { users: chunk } });
      if (error) throw new Error(error.message || 'Edge Function create-user gagal dipanggil.');
      results.push(...(data?.results || []));
    } catch (ex) {
      // Satu chunk gagal (jaringan/timeout) tidak boleh menghentikan sisanya: baris chunk ini
      // dicatat gagal dengan alasannya, chunk berikutnya tetap jalan.
      results.push(...chunk.map((u) => ({ ok: false, username: u.username, error: ex.message })));
    }
    onProgress?.(Math.min(i + chunk.length, users.length), users.length);
  }
  return results;
}

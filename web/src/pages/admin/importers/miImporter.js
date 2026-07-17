import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabase';
import { getField, parseBulan, normalizeNama } from './karakterImporter';

// Importer Multiple Intelligence. Beda dari Karakter dalam dua hal:
// 1. File MI berisi SATU sheet datar, satu baris = satu siswa (bukan enam sheet agregat).
// 2. File bisa mencampur banyak sekolah lewat kolom sekolah_id (nama bebas), jadi tiap baris
//    di-resolve sendiri ke sekolah terdaftar lewat pencocokan nama (keputusan pemilik produk),
//    bukan satu sekolah per upload seperti Karakter.
//
// Importer ini HANYA memparse + memvalidasi + me-resolve identitas. Ia TIDAK memanggil Gemini
// dan tidak menulis mi_hasil. Hasil parse (baris mentah per siswa) dikirim ke Edge Function
// generate-mi satu per satu (lihat useAdminCmsData.runMiGenerate), yang menjalankan pipeline
// (5 panggilan Gemini) lalu menulis mi_hasil berstatus menunggu_persetujuan.

const SKOR_COLS = [
  'r_inter', 'r_intra', 'r_kines', 'r_linguistik',
  'r_logmat', 'r_musikal', 'r_naturalis', 'r_spasial',
];
const ESSAY_COLS = [
  'essay_kelebihan_cara_berpikir', 'essay_cara_belajar', 'essay_penggunaan_ai',
  'essay_citacita_profesi', 'essay_alasan_pilih_profesi', 'essay_cara_belajar_paling_berhasil',
];

/** Skor 0-100. Kosong/non-angka -> null (dianggap tidak terbaca, baris ditolak). */
function skor(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace('%', '').trim());
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** Bangun peta nama-sekolah-ternormalisasi -> sekolah_id dari daftar schools terdaftar. Nama
 * file dicocokkan ke sini; yang tidak kenal ditolak dengan pesan jelas, bukan ditebak. */
function buildSchoolResolver(schools) {
  const byNama = {};
  (schools || []).forEach((s) => {
    const key = normalizeNama(s.nama);
    if (key) byNama[key] = s.id;
  });
  return byNama;
}

/** murid_id harus konsisten dengan yang sudah ada di mi_hasil sekolah itu supaya tren per anak
 * tidak putus antar periode. Dicocokkan lewat nama ternormalisasi; nama baru dapat id baru. */
async function loadExistingMiMuridIds(sekolahId) {
  const { data, error } = await supabase
    .from('mi_hasil')
    .select('murid_id, nama_siswa:detail->>nama_siswa')
    .eq('sekolah_id', sekolahId);
  if (error) throw error;

  const byNama = {};
  let maxNum = 0;
  (data || []).forEach((r) => {
    const key = normalizeNama(r.nama_siswa);
    if (key && !byNama[key]) byNama[key] = r.murid_id;
    const n = parseInt(String(r.murid_id).replace(/\D/g, ''), 10);
    if (Number.isFinite(n) && n > maxNum) maxNum = n;
  });
  return { byNama, nextNum: maxNum + 1 };
}

/**
 * Parse workbook MI (format Screening_MI__Personal: satu sheet, kolom nama_siswa, kelas_id,
 * sekolah_id, periode, r_inter..r_spasial, mapel_sulit_1/2, essay_*). schools = daftar sekolah
 * terdaftar [{id, nama}] dari CMS, dipakai untuk resolusi sekolah per baris.
 *
 * Return { ok, preview, rows } atau { ok:false, error }. rows = baris siap kirim ke generate-mi.
 */
export async function parseMiWorkbook(file, { schools }) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheetName = wb.SheetNames[0];
  const rows = sheetName ? XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' }) : [];

  const preview = { sheet: sheetName || null, rows: rows.length };
  if (rows.length === 0) {
    return { preview, ok: false, error: 'File MI kosong atau sheet pertama tidak punya baris data.' };
  }

  // Pastikan kolom skor benar-benar ada di header (kalau tidak, kemungkinan format beda).
  const header = rows[0];
  const kolomSkorAda = SKOR_COLS.filter((c) => getField(header, c) !== undefined);
  if (kolomSkorAda.length === 0) {
    return {
      preview, ok: false,
      error: `Tidak ada kolom skor kecerdasan (r_inter..r_spasial) di file. Kolom yang ada: ${Object.keys(header).join(', ')}. Kemungkinan format file berbeda.`,
    };
  }

  const schoolByNama = buildSchoolResolver(schools);

  // Resolusi murid_id butuh tahu sekolah dulu, dan sekolah bisa beda antar baris. Cache peta
  // murid per sekolah supaya tidak query berulang untuk sekolah yang sama.
  const muridCacheBySekolah = {};
  async function muridPeta(sekolahId) {
    if (!muridCacheBySekolah[sekolahId]) {
      muridCacheBySekolah[sekolahId] = await loadExistingMiMuridIds(sekolahId);
    }
    return muridCacheBySekolah[sekolahId];
  }

  const badRows = [];
  const sekolahTakDikenal = new Set();
  const outRows = [];
  const periodeSet = new Set();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const baris = i + 2; // +2: header di baris 1, data mulai baris 2

    const nama = String(getField(r, 'nama_siswa', 'nama') || '').trim();
    if (!nama) { badRows.push(`baris ${baris} (nama_siswa kosong)`); continue; }

    const sekolahNamaFile = String(getField(r, 'sekolah_id', 'sekolah', 'nama_sekolah') || '').trim();
    if (!sekolahNamaFile) { badRows.push(`baris ${baris} (sekolah_id kosong untuk ${nama})`); continue; }
    const sekolahId = schoolByNama[normalizeNama(sekolahNamaFile)];
    if (!sekolahId) { sekolahTakDikenal.add(sekolahNamaFile); continue; }

    const kelas = String(getField(r, 'kelas_id', 'kelas') || '').trim();
    if (!kelas) { badRows.push(`baris ${baris} (kelas_id kosong untuk ${nama})`); continue; }

    const periode = parseBulan(getField(r, 'periode', 'periode_id', 'bulan'));
    if (!periode) { badRows.push(`baris ${baris} (periode tidak terbaca untuk ${nama})`); continue; }

    // Semua 8 skor wajib angka; MI tanpa skor lengkap tidak bisa dihitung level/top-nya.
    const skorObj = {};
    let skorKurang = null;
    for (const col of SKOR_COLS) {
      const val = skor(getField(r, col));
      if (val === null) { skorKurang = col; break; }
      skorObj[col] = val;
    }
    if (skorKurang) { badRows.push(`baris ${baris} (skor ${skorKurang} kosong/tidak terbaca untuk ${nama})`); continue; }

    const peta = await muridPeta(sekolahId);
    const namaKey = normalizeNama(nama);
    let muridId = peta.byNama[namaKey];
    if (!muridId) {
      muridId = 'M' + String(peta.nextNum++).padStart(3, '0');
      peta.byNama[namaKey] = muridId;
    }

    const inp = {
      murid_id: muridId, nama_siswa: nama, kelas_id: kelas,
      sekolah_id: sekolahId, periode_id: periode,
      ...skorObj,
      mapel_sulit_1: String(getField(r, 'mapel_sulit_1') || '').trim(),
      mapel_sulit_2: String(getField(r, 'mapel_sulit_2') || '').trim(),
    };
    ESSAY_COLS.forEach((c) => { inp[c] = String(getField(r, c) || '').trim(); });

    outRows.push(inp);
    periodeSet.add(periode);
  }

  if (sekolahTakDikenal.size > 0) {
    return {
      preview, ok: false,
      error: `Nama sekolah di file tidak cocok dengan sekolah terdaftar: ${[...sekolahTakDikenal].join(', ')}. Daftarkan sekolah itu dulu (nama harus sama persis, beda spasi/besar-kecil huruf tidak masalah), atau perbaiki nama di file.`,
    };
  }
  if (badRows.length > 0) {
    return {
      preview, ok: false,
      error: `Data tidak terbaca di: ${badRows.slice(0, 6).join(', ')}${badRows.length > 6 ? ` (+${badRows.length - 6} baris lain)` : ''}. Tiap baris wajib punya nama_siswa, sekolah_id, kelas_id, periode, dan 8 skor kecerdasan (r_inter..r_spasial) berisi angka.`,
    };
  }

  preview.periodeDetected = [...periodeSet].sort().map((periode) => ({
    periode, rows: outRows.filter((x) => x.periode_id === periode).length,
  }));
  preview.sekolahCount = new Set(outRows.map((x) => x.sekolah_id)).size;

  return { ok: true, preview, rows: outRows };
}

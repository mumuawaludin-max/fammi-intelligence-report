import * as XLSX from 'xlsx';
import { supabase, edgeErrorDetail, fetchAllRows } from '../../../lib/supabase';

// parseFloat berhenti diam-diam di karakter koma ("84,67" -> 84, bukan 84.67) -- kalau ada
// sekolah yang sel skornya berformat Indonesia (koma desimal) alih-alih titik, skor yang
// ditulis ke karakter_skor/karakter_skor_indikator bisa salah 1 poin tanpa error apa pun.
// Verifikasi nyata: ringkasan jenjang KB TK Istiqamah menyimpan "84,12 %" dkk untuk
// rata_pencapaian_orangtua -- ganti koma ke titik dulu sebelum parseFloat.
function pct(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace('%', '').replace(',', '.').trim());
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** Tiap indeks: [nama Indonesia lengkap, singkatan Indonesia, nama Inggris lengkap, singkatan Inggris]. */
const NAMA_BULAN = [
  ['januari', 'jan', 'january', 'jan'],
  ['februari', 'feb', 'february', 'feb'],
  ['maret', 'mar', 'march', 'mar'],
  ['april', 'apr', 'april', 'apr'],
  ['mei', 'mei', 'may', 'may'],
  ['juni', 'jun', 'june', 'jun'],
  ['juli', 'jul', 'july', 'jul'],
  ['agustus', 'agu', 'august', 'aug'],
  ['september', 'sep', 'september', 'sep'],
  ['oktober', 'okt', 'october', 'oct'],
  ['november', 'nov', 'november', 'nov'],
  ['desember', 'des', 'december', 'dec'],
];

/** Cari indeks bulan (0-11) dari kata apa pun (Indonesia/Inggris, lengkap/singkatan). */
function bulanIndex(word) {
  return NAMA_BULAN.findIndex((names) => names.includes(word));
}

/** "Pernyataan Orangtua", "pernyataan_orangtua ", "pernyataan-orangtua" semua jadi kunci yang
 * sama, tidak peduli sumber headernya pakai spasi, underscore, atau strip -- termasuk spasi
 * tak terlihat (non-breaking space) yang sering ikut ke-copy-paste dari Word/Google Docs,
 * karena kelas \s di regex JS sudah mencakup non-breaking space per spesifikasi ECMAScript. */
function normalizeKey(s) {
  return String(s).toLowerCase().trim().replace(/[\s_-]+/g, '_');
}

/** Cari kolom di baris tanpa peduli besar/kecil huruf ataupun spasi/underscore/strip, karena
 * header sumber tidak konsisten (dan kadang bawa spasi tak terlihat dari copy-paste Word/Docs).
 * Diekspor supaya importer lain (mis. MI) memakai logika pencarian kolom yang sama. */
export function getField(row, ...names) {
  const wanted = names.map(normalizeKey);
  const key = Object.keys(row).find((k) => wanted.includes(normalizeKey(k)));
  return key ? row[key] : undefined;
}

/**
 * true kalau seluruh kolom baris ini kosong KECUALI kolom bulan/periode. Bentuk ini muncul
 * sebagai sisa spreadsheet: satu tanggal nyasar di kolom bulan, kolom lain (termasuk nama)
 * kosong semua. Baris seperti ini bukan kesalahan pengisian yang berguna dilaporkan per baris,
 * jadi dilewati seperti baris kosong di sheet summary, bukan digagalkan lewat aturan "nama
 * kosong". Baris yang punya isi lain tapi namanya kosong TETAP dilaporkan, karena itu memang
 * data rusak yang perlu dibetulkan di sumbernya.
 */
function isBarisKosongSelainBulan(row) {
  return Object.entries(row).every(([k, v]) => {
    const key = normalizeKey(k);
    if (key === 'bulan' || key === 'periode' || key === 'periode_id') return true;
    return String(v ?? '').trim() === '';
  });
}

/** Serial tanggal Excel (basis 1899-12-30) diubah ke Date. */
function excelSerialToDate(n) {
  return new Date(Math.round((n - 25569) * 86400 * 1000));
}

/**
 * Ubah nilai kolom "bulan" jadi periode_id "YYYY-MM". Null kalau tidak terbaca.
 * Dukung: Date/serial Excel, "2026-07", "07/2026", nama bulan Indonesia atau Inggris
 * lengkap/singkatan dalam urutan apa pun ("Juli 2026", "October, 2025", "Oct 2025", "2025 October").
 */
export function parseBulan(raw) {
  if (raw === '' || raw === null || raw === undefined) return null;
  if (raw instanceof Date) {
    return `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, '0')}`;
  }
  if (typeof raw === 'number') {
    const d = excelSerialToDate(raw);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  const s = String(raw).trim();
  let m = s.match(/^(\d{4})[-/](\d{1,2})/);
  if (m) return `${m[1]}-${String(parseInt(m[2], 10)).padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[-/](\d{4})$/);
  if (m) return `${m[2]}-${String(parseInt(m[1], 10)).padStart(2, '0')}`;
  const parts = s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    let idx = bulanIndex(parts[0]);
    if (idx >= 0 && /^\d{4}$/.test(parts[1])) return `${parts[1]}-${String(idx + 1).padStart(2, '0')}`;
    idx = bulanIndex(parts[1]);
    if (idx >= 0 && /^\d{4}$/.test(parts[0])) return `${parts[0]}-${String(idx + 1).padStart(2, '0')}`;
  }
  return null;
}

/**
 * Cari SEMUA kode aspek karakter yang benar-benar ada di header lewat prefix "karakterN_",
 * apa pun angka N dan berapa pun jumlahnya -- BUKAN daftar tetap 6 aspek. Tiap sekolah bisa
 * punya jumlah aspek karakter yang beda (5, 6, 7, atau berapa pun), sama seperti tiap sekolah
 * bisa pakai istilah Indonesia berbeda untuk aspek yang sama (mis. sekolah A pakai
 * "karakter1_berpikir_positif", sekolah B pakai "karakter1_optimis") -- akhiran itu cuma label,
 * yang disimpan ke DB tetap kode pendeknya ("karakter1"). Kolom indikator ("karakterN_indikatorM_...")
 * sengaja dikecualikan supaya tidak salah tertangkap sebagai skor aspek. Kalau jumlah aspek
 * di-hardcode (mis. selalu 6), sekolah yang jumlah aspeknya beda gagal upload dengan cara sama
 * seperti bug kolom testimoni KB TK Istiqamah: semua baris "gagal" karena kolom yang dicari
 * memang tidak pernah ada di file itu, bukan karena datanya salah.
 */
function detectAspekKode(headerRow) {
  const found = new Set();
  Object.keys(headerRow).forEach((k) => {
    const m = k.trim().match(/^karakter(\d+)_(?!indikator)/i);
    if (m) found.add(`karakter${m[1]}`);
  });
  return [...found].sort((a, b) => parseInt(a.replace('karakter', ''), 10) - parseInt(b.replace('karakter', ''), 10));
}

function resolveAspekCol(headerRow, kode) {
  const n = kode.replace('karakter', '');
  const re = new RegExp(`^karakter${n}_(?!indikator)`, 'i');
  return Object.keys(headerRow).find((k) => re.test(k.trim()));
}

/**
 * Cari semua kolom skor indikator di header lewat pola "karakterN_indikatorM_...", apa pun
 * angka N, angka M, dan teks setelah "indikatorM_". Dulu N dibatasi 1-6 dan M dibatasi 1-2 --
 * sekolah yang punya lebih dari 6 aspek atau lebih dari 2 indikator per aspek gagal upload
 * karena kolom-kolom itu tidak pernah cocok dengan pola lama. Teks setelah "indikatorM_" justru
 * DIPAKAI APA ADANYA sebagai bagian indikator_kode yang disimpan ke DB (bukan cuma label
 * tampilan) -- karena tiap sekolah bisa punya indikator yang beda secara isi, bukan cuma beda
 * istilah untuk hal yang sama. Kode yang disimpan otomatis konsisten dengan nama kolom sekolah
 * itu sendiri, tidak dicocokkan ke daftar tetap SDIP Al Madani. Sekolah baru butuh baris
 * karakter_indikator_config sendiri yang kode-nya cocok dengan hasil fungsi ini supaya labelnya
 * tampil di FIR.
 */
function resolveIndikatorCols(headerRow) {
  const out = [];
  Object.keys(headerRow).forEach((k) => {
    const m = k.trim().match(/^karakter(\d+)_(indikator\d+_.+)$/i);
    if (m) out.push({ aspek: `karakter${m[1]}`, kode: m[2].toLowerCase(), col: k });
  });
  return out;
}

/** Kunci pencocokan nama yang tidak peduli spasi berlebih atau besar/kecil huruf -- "Ahmad
 * Fajri" dan "ahmad  fajri" (dua spasi, ketikan bulan lain) harus jadi murid yang sama, bukan
 * dianggap murid baru. Nama ASLI (bukan versi ternormalisasi ini) tetap yang disimpan ke DB. */
export function normalizeNama(nama) {
  return String(nama || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Buang baris yang kunci uniknya bentrok dengan baris lain DI FILE YANG SAMA; baris terakhir
 * yang menang, posisinya tetap di tempat kemunculan pertama.
 *
 * Kunci di sini sengaja dibuat persis sama dengan unique constraint tabel tujuannya
 * (20260707120000_karakter_unique_constraints.sql dan 20260810100000 untuk pernyataan). Tanpa
 * penyaringan ini, satu baris ganda di file membuat SELURUH periode gagal di Postgres dengan
 * "duplicate key value violates unique constraint karakter_skor_sekolah_murid_periode_aspek_key"
 * -- pesan mentah yang tidak menyebut murid mana pun, jadi admin tidak punya petunjuk apa yang
 * harus diperbaiki di file. Persis itu yang menggagalkan upload TK Telkom Batam (2026-08-11).
 *
 * Dua asal-usul baris ganda, keduanya nyata:
 * 1. Satu murid mengisi/terekspor dua kali untuk bulan yang sama (form diisi ulang).
 * 2. Dua baris yang namanya cuma beda spasi/kapitalisasi digabung jadi satu murid_id oleh
 *    normalizeNama -- termasuk kalau ternyata itu memang DUA anak berbeda yang namanya sama.
 *
 * Kasus 2 tidak bisa dibedakan dari kasus 1 secara otomatis, jadi baris ganda tidak dibuang
 * diam-diam: pemanggil mengumpulkan bentrokannya ke preview.duplikat dan Upload.jsx
 * menampilkannya sebelum admin menekan konfirmasi, lengkap dengan penanda kalau kelasnya beda
 * (petunjuk kuat bahwa itu dua anak berbeda, bukan satu anak yang mengisi dua kali).
 */
function dedupeByKey(rows, keyOf) {
  const seen = new Map();
  const bentrok = [];
  rows.forEach((r) => {
    const k = keyOf(r);
    const lama = seen.get(k);
    if (lama) bentrok.push({ lama, baru: r });
    seen.set(k, r);
  });
  return { rows: [...seen.values()], bentrok };
}

/** murid_id harus konsisten antar periode (bulan) supaya grafik tren per anak tidak putus.
 * karakter_skor satu baris per (murid, periode, aspek) -- untuk sekolah dengan cukup banyak
 * murid/periode/aspek, query tanpa paginasi diam-diam terpotong di batas 1000 baris PostgREST
 * (lihat catatan fetchAllRows di lib/supabase.js). Kalau terpotong, murid yang barisnya jatuh
 * di luar 1000 pertama tidak kebaca di sini, dianggap "murid baru" tiap import, dan dapat
 * murid_id baru yang beda tiap bulan -- grafik trennya jadi patah-patah padahal muridnya sama. */
async function loadExistingMuridIds(sekolahId) {
  const { data, error } = await fetchAllRows((from, to) =>
    supabase
      .from('karakter_skor')
      .select('murid_id, nama_murid')
      .eq('sekolah_id', sekolahId)
      .range(from, to)
  );
  if (error) throw error;

  const byNama = {};
  let maxNum = 0;
  (data || []).forEach((r) => {
    const key = normalizeNama(r.nama_murid);
    if (key && !byNama[key]) byNama[key] = r.murid_id;
    const n = parseInt(String(r.murid_id).replace(/\D/g, ''), 10);
    if (Number.isFinite(n) && n > maxNum) maxNum = n;
  });
  return { byNama, nextNum: maxNum + 1 };
}

/**
 * Sheet refleksi yang dikenali, beserta nama kolom yang beda antar sumber. Dulu hanya ada satu
 * sheet (`detail_pernyataan_orangtua`) dan nama kolomnya ditulis langsung di loop parsing; sejak
 * SMK Telkom Purwokerto, satu file bisa memuat blok refleksi kedua dari siswa dengan struktur
 * paralel persis, cuma beda akhiran nama kolom. Daftar ini yang jadi satu-satunya tempat nama
 * kolom per sumber ditulis, jadi menambah sumber ketiga nanti cukup menambah satu entri di sini.
 *
 * `kolomPenanda` dipakai pre-flight: kalau sheet-nya hadir tapi kolom itu tidak ketemu, parse
 * digagalkan dengan daftar header asli (lihat alasannya di dekat pengecekan itu). Kolom yang
 * namanya SAMA di semua sumber (`kategori_pernyataan`, `dukungan_lainya`/`dukungan_lainnya`,
 * nama/kelas/bulan) sengaja tidak masuk sini, tetap dibaca lewat getField langsung.
 */
const REFLEKSI_SHEETS = [
  {
    sheet: 'detail_pernyataan_orangtua', sumber: 'orangtua',
    label: 'testimoni orang tua', kolomPenanda: 'pernyataan_orangtua',
    kolom: {
      pernyataan: 'pernyataan_orangtua', emosi_anak: 'emosi_anak', alasan_emosi: 'alasan_emosi_anak',
      dukungan_dibutuhkan: 'dukungan_yang_dibutuhkan_orangtua', hal_disyukuri: 'hal_yang_disyukuri_orangtua',
    },
  },
  {
    sheet: 'detail_pernyataan_siswa', sumber: 'siswa',
    label: 'testimoni siswa', kolomPenanda: 'pernyataan_siswa',
    kolom: {
      pernyataan: 'pernyataan_siswa', emosi_anak: 'emosi_siswa', alasan_emosi: 'alasan_emosi_siswa',
      dukungan_dibutuhkan: 'dukungan_yang_dibutuhkan_siswa', hal_disyukuri: 'hal_yang_disyukuri_siswa',
    },
  },
];

/**
 * Baca workbook Excel (format sama seperti yang dipakai SDIP Al Madani: sheet
 * detail_persentase_karakter / detail_persentase_indikator / detail_pernyataan_orangtua /
 * summary_kelas / summary_jenjang / summary_sekolah) dan siapkan baris siap-insert.
 * Sheet refleksi kedua `detail_pernyataan_siswa` opsional: kalau ada ikut terbaca dan tiap
 * barisnya ditandai sumber='siswa', kalau tidak ada file tetap sah tanpa peringatan apa pun.
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
  // Sheet refleksi dibaca sebagai daftar, bukan variabel per sheet: yang absen tinggal berisi
  // array kosong dan otomatis terlewat di pre-flight maupun loop parsing di bawah.
  const refleksi = REFLEKSI_SHEETS.map((cfg) => ({ cfg, rows: sheet(cfg.sheet) }));
  const sk = sheet('summary_kelas');
  const sj = sheet('summary_jenjang');
  const ss = sheet('summary_sekolah');

  // Objek yang sama dipasang ke preview lalu diisi saat loop parsing jalan, jadi pratinjau
  // menghitung baris yang BENAR-BENAR terparse, bukan jumlah baris mentah di sheet.
  const refleksiPerSumber = Object.fromEntries(REFLEKSI_SHEETS.map((cfg) => [cfg.sumber, 0]));
  // Baris sisa spreadsheet yang dilewati (lihat isBarisKosongSelainBulan). Ditampilkan di
  // pratinjau supaya admin tahu ada baris yang tidak ikut, bukan hilang diam-diam.
  const refleksiBarisDilewati = Object.fromEntries(REFLEKSI_SHEETS.map((cfg) => [cfg.sumber, 0]));

  const preview = {
    refleksiPerSumber,
    refleksiBarisDilewati,
    sheets: [
      { name: 'detail_persentase_karakter', rows: dk.length, found: dk.length > 0 },
      { name: 'detail_persentase_indikator', rows: di.length, found: di.length > 0 },
      ...refleksi.map(({ cfg, rows }) => ({ name: cfg.sheet, rows: rows.length, found: rows.length > 0 })),
      { name: 'summary_kelas', rows: sk.length, found: sk.length > 0 },
      { name: 'summary_jenjang', rows: sj.length, found: sj.length > 0 },
      { name: 'summary_sekolah', rows: ss.length, found: ss.length > 0 },
    ],
    refleksiSheetAda: refleksi.filter(({ rows }) => rows.length > 0).map(({ cfg }) => cfg.sumber),
  };

  if (dk.length === 0) {
    return { preview, ok: false, error: 'Sheet "detail_persentase_karakter" tidak ditemukan atau kosong.' };
  }

  // Jumlah aspek karakter dideteksi dari header file itu sendiri lewat prefix "karakterN_"
  // (lihat detectAspekKode), bukan daftar tetap 6 aspek, supaya sekolah dengan jumlah aspek
  // berbeda (kurang atau lebih dari 6) tetap bisa terbaca tanpa perlu ubah kode tiap kali
  // sekolah baru onboarding. Kalau tidak satu pun kolom "karakterN_..." ketemu, kemungkinan
  // sekolah ini malah tidak pakai konvensi itu sama sekali -- gagal cepat dan tunjukkan
  // header asli file, daripada membanjiri pesan error per baris per murid.
  const aspekKodeList = detectAspekKode(dk[0]);
  if (aspekKodeList.length === 0) {
    return {
      preview, ok: false,
      error: `Tidak ada satu pun kolom skor karakter yang dikenali di sheet detail_persentase_karakter (dicari lewat prefix karakterN_, apa pun angka N-nya). Kolom yang benar-benar ada di file: ${Object.keys(dk[0]).join(', ')}. Kemungkinan file ini pakai konvensi nama kolom yang sama sekali berbeda, importer perlu disesuaikan dulu untuk sekolah ini.`,
    };
  }
  const aspekColMap = {};
  aspekKodeList.forEach((kode) => {
    const col = resolveAspekCol(dk[0], kode);
    if (col) aspekColMap[kode] = col;
  });
  let indikatorCols = [];
  if (di.length > 0) {
    indikatorCols = resolveIndikatorCols(di[0]);
    if (indikatorCols.length === 0) {
      return {
        preview, ok: false,
        error: `Tidak ada satu pun kolom skor indikator yang dikenali di sheet detail_persentase_indikator (dicari lewat pola karakterN_indikatorM_...). Kolom yang benar-benar ada di file: ${Object.keys(di[0]).join(', ')}. Kemungkinan file ini pakai konvensi nama kolom yang sama sekali berbeda, importer perlu disesuaikan dulu untuk sekolah ini.`,
      };
    }
  }

  const periodeCount = {};
  const badRows = [];
  function ownBulan(r) {
    return parseBulan(getField(r, 'bulan', 'periode', 'periode_id'));
  }
  function countPeriode(periode) {
    if (periode) periodeCount[periode] = (periodeCount[periode] || 0) + 1;
  }

  const { byNama, nextNum } = await loadExistingMuridIds(sekolahId);
  let seq = nextNum;
  /** nama WAJIB sudah tervalidasi tidak kosong oleh pemanggil (lihat pengecekan sebelum tiap
   * panggilan muridId() di bawah) -- nama kosong tidak boleh sampai sini karena semua baris
   * tanpa nama akan tergabung jadi satu "murid" kalau dibiarkan. */
  function muridId(nama) {
    const key = normalizeNama(nama);
    if (byNama[key]) return byNama[key];
    const id = 'M' + String(seq++).padStart(3, '0');
    byNama[key] = id;
    return id;
  }

  // detail_persentase_karakter wajib punya kolom bulan & kelas sendiri, jadi ini yang jadi acuan.
  // Nama/kelas dibaca case-insensitive ("nama"/"Nama"/"NAMA") karena header sumber tidak konsisten.
  const namaPeriode = {};
  const namaKelas = {};
  const skorRows = [];
  dk.forEach((r, i) => {
    const periode = ownBulan(r);
    if (!periode) { badRows.push(`detail_persentase_karakter baris ${i + 2} (bulan)`); return; }
    const nama = getField(r, 'nama');
    if (!String(nama || '').trim()) { badRows.push(`detail_persentase_karakter baris ${i + 2} (nama kosong -- baris tanpa nama tidak bisa dipetakan ke murid mana pun)`); return; }
    const kelas = getField(r, 'kelas');
    if (!kelas) { badRows.push(`detail_persentase_karakter baris ${i + 2} (kelas)`); return; }
    countPeriode(periode);
    const namaKey = normalizeNama(nama);
    namaPeriode[namaKey] = periode; namaKelas[namaKey] = kelas;
    const mid = muridId(nama);
    aspekKodeList.forEach((aspek) => {
      const col = aspekColMap[aspek];
      const skor = col ? pct(r[col]) : null;
      if (skor === null) { badRows.push(`detail_persentase_karakter baris ${i + 2} (kolom skor ${aspek}${col ? ` "${col}"` : ''} kosong/tidak ditemukan untuk ${nama || 'baris ini'})`); return; }
      skorRows.push({
        sekolah_id: sekolahId, kelas_id: kelas, murid_id: mid, nama_murid: nama,
        periode_id: periode, aspek_kode: aspek, skor, sumber: 'guru', status: 'disetujui',
      });
    });
  });

  // Sheet lain sering tidak punya kolom bulan/kelas sendiri: fallback ke data murid yang sama
  // dari detail_persentase_karakter (dicocokkan lewat nama), baru dianggap gagal kalau
  // benar-benar tidak ada cara menentukan nilainya.
  const skorIndikatorRows = [];
  di.forEach((r, i) => {
    const nama = getField(r, 'nama');
    if (!String(nama || '').trim()) { badRows.push(`detail_persentase_indikator baris ${i + 2} (nama kosong)`); return; }
    const namaKey = normalizeNama(nama);
    const kelas = getField(r, 'kelas') || namaKelas[namaKey];
    const periode = ownBulan(r) || namaPeriode[namaKey];
    if (!periode) { badRows.push(`detail_persentase_indikator baris ${i + 2} (bulan)`); return; }
    if (!kelas) { badRows.push(`detail_persentase_indikator baris ${i + 2} (kelas)`); return; }
    countPeriode(periode);
    const mid = muridId(nama);
    indikatorCols.forEach(({ aspek, kode, col }) => {
      const skor = pct(r[col]);
      if (skor === null) { badRows.push(`detail_persentase_indikator baris ${i + 2} (kolom "${col}" kosong/tidak terbaca untuk ${nama || 'baris ini'})`); return; }
      skorIndikatorRows.push({
        sekolah_id: sekolahId, kelas_id: kelas, murid_id: mid, nama_murid: nama,
        periode_id: periode, aspek_kode: aspek, indikator_kode: kode, skor,
        sumber: 'guru', status: 'disetujui',
      });
    });
  });

  // Pre-flight: kolom penanda tiap sheet refleksi ("pernyataan_orangtua", "pernyataan_siswa")
  // sengaja dicek SEBELUM loop, bukan per-baris, karena kalau kolomnya memang tidak ketemu di
  // header, SEMUA baris akan gagal dengan cara yang sama -- lebih berguna satu pesan jelas
  // dengan daftar header asli (seperti pengecekan kolom aspek karakter1-6 di atas) daripada
  // mengimpor 500+ baris dengan testimoni kosong tanpa satu pun error, seperti yang sempat
  // terjadi ke KB TK Istiqamah dua kali berturut-turut (kolom "pernyataan_orangtua" yang dicoba
  // ternyata tidak cocok dengan nama kolom asli di file itu, bukan cuma beda kapitalisasi/spasi
  // seperti dugaan awal). Dicek per sheet supaya pesannya menyebut sheet mana yang bermasalah;
  // sheet yang tidak ada di file dilewati tanpa error, termasuk kalau dua-duanya tidak ada
  // (file skor-saja tetap sah).
  for (const { cfg, rows } of refleksi) {
    if (rows.length > 0 && getField(rows[0], cfg.kolomPenanda) === undefined) {
      return {
        preview, ok: false,
        error: `Kolom ${cfg.label} tidak ditemukan di sheet ${cfg.sheet} (dicari lewat nama "${cfg.kolomPenanda}"). Kolom yang benar-benar ada di file: ${Object.keys(rows[0]).join(', ')}. Cek nama kolom yang benar di daftar itu, lalu kabari pengembang supaya importer dicocokkan.`,
      };
    }
  }

  // Semua sumber masuk ke SATU array pernyataanRows, dibedakan lewat kolom "sumber" per baris,
  // bukan dipecah jadi array per sumber: importKarakterWorkbook memfilter array ini per periode
  // saja, dan RPC di hulu yang menghapus per (sekolah, periode, sumber). Urutan sheet mengikuti
  // urutan REFLEKSI_SHEETS, jadi file lama yang cuma punya blok orang tua menghasilkan isi dan
  // urutan yang sama seperti sebelum sheet siswa dikenali, plus satu field sumber.
  const pernyataanRows = [];
  refleksi.forEach(({ cfg, rows }) => {
    rows.forEach((r, i) => {
      if (isBarisKosongSelainBulan(r)) { refleksiBarisDilewati[cfg.sumber] += 1; return; }
      const nama = getField(r, 'nama');
      if (!String(nama || '').trim()) { badRows.push(`${cfg.sheet} baris ${i + 2} (nama kosong)`); return; }
      const namaKey = normalizeNama(nama);
      const kelas = getField(r, 'kelas') || namaKelas[namaKey];
      const periode = ownBulan(r) || namaPeriode[namaKey];
      if (!periode) { badRows.push(`${cfg.sheet} baris ${i + 2} (bulan)`); return; }
      if (!kelas) { badRows.push(`${cfg.sheet} baris ${i + 2} (kelas)`); return; }
      countPeriode(periode);
      // Dulu 6 kolom di bawah dibaca lewat properti langsung (r.pernyataan_orangtua dst),
      // beda dari nama/kelas/bulan yang sudah lebih dulu case/spasi-toleran lewat getField().
      // Bahaya nyatanya: kalau SATU SAJA kolom di header file beda kapitalisasi/spasi dari
      // yang persis diharapkan, baris tetap ikut ter-insert (tidak masuk badRows sama sekali,
      // karena kelas/bulan/nama-nya tetap lengkap) tapi kolom itu diam-diam jadi NULL untuk
      // SEMUA baris -- persis yang terjadi di KB TK Istiqamah: 573/573 baris punya kolom
      // "pernyataan" (testimoni orangtua) kosong padahal 6 kolom lain di sheet yang sama
      // terisi penuh, ternyata cuma beda kapitalisasi/spasi di satu nama kolom itu saja.
      // getField() sama-sama case/spasi-toleran seperti nama/kelas/bulan, jadi sekarang aman
      // dari kelas bug yang sama untuk keenam kolom ini. Nama kolom yang beda antar sumber
      // diambil dari cfg.kolom, yang beda-nya cuma akhiran; sisanya sama di semua sumber.
      pernyataanRows.push({
        sekolah_id: sekolahId, kelas_id: kelas, murid_id: muridId(nama), nama_murid: nama,
        periode_id: periode,
        kategori_pernyataan: getField(r, 'kategori_pernyataan'), pernyataan: getField(r, cfg.kolom.pernyataan),
        emosi_anak: getField(r, cfg.kolom.emosi_anak), alasan_emosi: getField(r, cfg.kolom.alasan_emosi),
        dukungan_dibutuhkan: getField(r, cfg.kolom.dukungan_dibutuhkan), dukungan_lainnya: getField(r, 'dukungan_lainya', 'dukungan_lainnya'),
        hal_disyukuri: getField(r, cfg.kolom.hal_disyukuri), sumber: cfg.sumber, status: 'disetujui',
      });
      refleksiPerSumber[cfg.sumber] += 1;
    });
  });

  // Ringkasan per kelas/jenjang/sekolah tidak punya nama murid untuk dicocokkan; kalau
  // barisnya sendiri tidak punya bulan, dulu selalu pakai periode dominan dari
  // detail_persentase_karakter. Itu aman kalau file cuma cakup satu bulan, tapi kalau file
  // memuat lebih dari satu periode (mis. gabungan dua bulan dalam satu upload) dan baris
  // summary-nya tidak punya kolom bulan sendiri, menebak periode dominan bisa salah tempatkan
  // ringkasan bulan lain ke bulan yang salah tanpa ketahuan -- jadi begitu file punya lebih
  // dari satu periode, fallback ini dimatikan dan baris tanpa bulan sendiri ditolak dengan
  // pesan jelas, bukan ditebak.
  const periodeList = Object.keys(periodeCount);
  const multiPeriode = periodeList.length > 1;
  const periodeDominan = multiPeriode ? null : (periodeList[0] || null);
  const summaryByKey = new Map();
  function pushSummary(scope, scopeId, periode, ringkasan) {
    // Kalau ada tabrakan periode+scope (mis. periode dominan salah tebak karena bulan sheet
    // ringkasan tidak terbaca), baris terakhir menang, bukan error duplikat ke Supabase.
    summaryByKey.set(`${scope}|${scopeId}|${periode}`, { sekolah_id: sekolahId, scope, scope_id: scopeId, periode_id: periode, ringkasan, status: 'disetujui' });
  }
  function resolvePeriodeSummary(r) {
    const own = ownBulan(r);
    if (own) return own;
    if (multiPeriode) return null;
    return periodeDominan;
  }
  const bulanWajibNote = ' (kolom bulan wajib diisi di baris ini karena file ini memuat lebih dari satu periode -- tidak bisa ditebak)';
  sk.forEach((r, i) => {
    if (Object.values(r).every((v) => v === '')) return; // baris kosong beneran, bukan error
    const kelas = getField(r, 'kelas');
    // Dulu di-skip diam-diam kalau kolom "kelas" tidak ketemu -- baris summary_kelas hilang
    // tanpa jejak dan import tetap dilaporkan "sukses", padahal karakter_summary scope=kelas
    // jadi kosong untuk sekolah itu (kelas baru tidak pernah muncul di Rekomendasi/Antrian).
    // Sekarang gagal cepat dan kelihatan, sama seperti pengecekan periode di baris sebelahnya.
    if (!kelas) { badRows.push(`summary_kelas baris ${i + 2} (kolom kelas kosong/tidak ditemukan, header yang ada: ${Object.keys(r).join(', ')})`); return; }
    const periode = resolvePeriodeSummary(r);
    if (!periode) { badRows.push(`summary_kelas baris ${i + 2}${multiPeriode ? bulanWajibNote : ' (bulan)'}`); return; }
    const { bulan: _bulan, Kelas: _Kelas, kelas: _kelasLower, ...rest } = r;
    pushSummary('kelas', kelas, periode, rest);
  });
  sj.forEach((r, i) => {
    if (Object.values(r).every((v) => v === '')) return;
    const jenjang = getField(r, 'jenjang');
    if (!jenjang) { badRows.push(`summary_jenjang baris ${i + 2} (kolom jenjang kosong/tidak ditemukan, header yang ada: ${Object.keys(r).join(', ')})`); return; }
    const periode = resolvePeriodeSummary(r);
    if (!periode) { badRows.push(`summary_jenjang baris ${i + 2}${multiPeriode ? bulanWajibNote : ' (bulan)'}`); return; }
    const { bulan: _bulan, jenjang: _jenjangLower, Jenjang: _Jenjang, ...rest } = r;
    pushSummary('jenjang', jenjang, periode, rest);
  });
  ss.forEach((r, i) => {
    const { bulan: _bulan, ...rest } = r;
    if (Object.values(rest).every((v) => v === '')) return;
    const periode = resolvePeriodeSummary(r);
    if (!periode) { badRows.push(`summary_sekolah baris ${i + 2}${multiPeriode ? bulanWajibNote : ' (bulan)'}`); return; }
    pushSummary('sekolah', sekolahId, periode, rest);
  });
  const summaryRows = [...summaryByKey.values()];

  // Penyaringan baris ganda dilakukan di sini, setelah semua sheet terbaca, bukan per sheet:
  // kunci uniknya memakai murid_id hasil resolve (bukan nama mentah), dan murid_id baru bisa
  // lahir di sheet mana pun. karakter_summary tidak ikut karena summaryByKey di atas sudah
  // menyaring dengan kunci yang sama sejak awal.
  const skorDedupe = dedupeByKey(skorRows, (r) => `${r.murid_id}|${r.periode_id}|${r.aspek_kode}`);
  const indikatorDedupe = dedupeByKey(skorIndikatorRows, (r) => `${r.murid_id}|${r.periode_id}|${r.aspek_kode}|${r.indikator_kode}`);
  const pernyataanDedupe = dedupeByKey(pernyataanRows, (r) => `${r.murid_id}|${r.periode_id}|${r.sumber}`);

  // Satu murid yang barisnya ganda menghasilkan sebanyak-jumlah-aspek bentrokan di skorRows,
  // jadi yang ditampilkan ke admin adalah daftar MURID-nya, bukan hitungan baris mentah.
  const duplikatMurid = new Map();
  [skorDedupe, indikatorDedupe, pernyataanDedupe].forEach(({ bentrok }) => {
    bentrok.forEach(({ lama, baru }) => {
      const key = `${baru.murid_id}|${baru.periode_id}`;
      let e = duplikatMurid.get(key);
      if (!e) {
        e = { nama: baru.nama_murid, periode: baru.periode_id, kelas: new Set() };
        duplikatMurid.set(key, e);
      }
      e.kelas.add(lama.kelas_id);
      e.kelas.add(baru.kelas_id);
    });
  });
  preview.duplikat = {
    skor: skorDedupe.bentrok.length,
    skorIndikator: indikatorDedupe.bentrok.length,
    pernyataan: pernyataanDedupe.bentrok.length,
    total: skorDedupe.bentrok.length + indikatorDedupe.bentrok.length + pernyataanDedupe.bentrok.length,
    murid: [...duplikatMurid.values()].map((e) => ({
      nama: e.nama, periode: e.periode, kelas: [...e.kelas], bedaKelas: e.kelas.size > 1,
    })),
  };

  if (badRows.length > 0) {
    return {
      preview, ok: false,
      error: `Data tidak terbaca di: ${badRows.slice(0, 5).join(', ')}${badRows.length > 5 ? ` (+${badRows.length - 5} baris lain)` : ''}. Kolom "bulan" dan "kelas" di detail_persentase_karakter wajib terisi untuk tiap murid (bulan boleh format tanggal Excel, "2026-07", "07/2026", "Juli 2026", atau "October 2025"), dan tiap kolom skor karakter/indikator wajib berisi angka, bukan kosong; sheet lain boleh kosong asal nama muridnya cocok persis dengan detail_persentase_karakter.`,
    };
  }

  preview.periodeDetected = Object.entries(periodeCount)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periode, rows]) => ({ periode, rows }));

  return {
    ok: true,
    preview,
    muridBaru: seq - nextNum,
    rows: {
      skorRows: skorDedupe.rows,
      skorIndikatorRows: indikatorDedupe.rows,
      pernyataanRows: pernyataanDedupe.rows,
      summaryRows,
    },
  };
}

/**
 * Tulis hasil parse ke Supabase lewat Edge Function admin-actions (action "import-karakter"),
 * yang di dalamnya memanggil RPC Postgres `import_karakter_periode` (migration
 * 20260712100000_import_karakter_rpc.sql) pakai service_role: satu panggilan RPC per periode,
 * tiap panggilan DELETE lalu INSERT keempat tabel dalam satu transaksi Postgres.
 *
 * Awalnya RPC ini dipanggil langsung dari browser lewat supabase.rpc() (anon key + JWT admin),
 * dengan asumsi SECURITY DEFINER otomatis melewati RLS -- ternyata TIDAK di project ini,
 * writes di dalam function tetap dievaluasi terhadap policy tabel. Begitu policy tulis
 * langsung disempitkan (Fase E1 lanjutan), import gagal dengan "new row violates row-level
 * security policy". Dipindah lewat Edge Function (service_role, benar-benar melewati RLS)
 * supaya policy tabel bisa disempitkan jadi baca-saja tanpa mematahkan import.
 *
 * Sebelum RPC ini ada, penulisan lewat chunked upsert langsung dari browser (500 baris per
 * batch, empat tabel terpisah) -- kalau gagal di tengah, tabel-tabel yang sudah sempat
 * ditulis tetap tersimpan, tidak ada rollback. Sekarang satu periode selalu
 * semua-atau-tidak-sama-sekali; kalau file punya beberapa periode dan salah satu gagal,
 * periode lain yang sudah sempat commit tetap tersimpan (itu batas atomik yang wajar --
 * lihat catatan Fase E1 di Rencana_Perbaikan_FIR_2026-07.md).
 *
 * Periode besar dipecah jadi beberapa panggilan (lihat CHUNK_ROWS). Satu panggilan = satu
 * statement Postgres, dan statement itu dibatasi statement_timeout milik role service_role;
 * upload SMK Telkom Purwokerto (27.522 baris, 3 bulan) mati di "canceling statement due to
 * statement timeout" pada periode ketiga karena satu panggilan harus menghapus lalu memasukkan
 * ~10.000 baris sekaligus. Memecahnya membuat tiap statement tetap kecil berapa pun besar
 * berkasnya, jadi batas waktunya tidak lagi bergantung pada jumlah murid sekolah.
 */

/** Batas baris per panggilan RPC (jumlah keempat tabel). Periode yang muat dalam satu chunk
 * dikirim seperti sebelumnya: satu panggilan, satu transaksi, tetap semua-atau-tidak. Nilai ini
 * kompromi antara jumlah panggilan (tiap panggilan kena ongkos Edge Function + PostgREST) dan
 * lama satu statement. */
const CHUNK_ROWS = 2000;

/**
 * Pecah baris satu periode jadi beberapa payload chunk, masing-masing maksimal `size` baris
 * gabungan keempat tabel. Urutan tabel dipertahankan (skor, indikator, pernyataan, summary)
 * supaya isi chunk deterministik dan mudah dicocokkan saat menelusuri kegagalan.
 */
function chunkPayloadRows({ skor, indikator, pernyataan, summary }, size) {
  const kosong = () => ({ skor_rows: [], skor_indikator_rows: [], pernyataan_rows: [], summary_rows: [] });
  const chunks = [];
  let cur = kosong();
  let curCount = 0;
  const tambah = (key, rows) => {
    let i = 0;
    while (i < rows.length) {
      if (curCount >= size) { chunks.push(cur); cur = kosong(); curCount = 0; }
      const take = rows.slice(i, i + (size - curCount));
      cur[key] = cur[key].concat(take);
      curCount += take.length;
      i += take.length;
    }
  };
  tambah('skor_rows', skor);
  tambah('skor_indikator_rows', indikator);
  tambah('pernyataan_rows', pernyataan);
  tambah('summary_rows', summary);
  // Chunk terakhir tetap dikirim walau kosong kalau periode ini memang tidak punya baris sama
  // sekali -- panggilan pertama yang menjalankan DELETE, jadi tidak boleh dilewati.
  if (curCount > 0 || chunks.length === 0) chunks.push(cur);
  return chunks;
}

export async function importKarakterWorkbook(parsed) {
  const { skorRows, skorIndikatorRows, pernyataanRows, summaryRows } = parsed.rows;
  const sekolahId = skorRows[0]?.sekolah_id || summaryRows[0]?.sekolah_id;
  if (!sekolahId) return { ok: true, rowsWritten: 0 };

  const periodeIds = [...new Set([
    ...skorRows.map((r) => r.periode_id),
    ...skorIndikatorRows.map((r) => r.periode_id),
    ...pernyataanRows.map((r) => r.periode_id),
    ...summaryRows.map((r) => r.periode_id),
  ])].sort();

  let totalRows = 0;
  for (const periodeId of periodeIds) {
    const perPeriode = {
      skor: skorRows.filter((r) => r.periode_id === periodeId),
      indikator: skorIndikatorRows.filter((r) => r.periode_id === periodeId),
      pernyataan: pernyataanRows.filter((r) => r.periode_id === periodeId),
      summary: summaryRows.filter((r) => r.periode_id === periodeId),
    };
    // Daftar sumber refleksi dihitung dari SELURUH baris periode ini, bukan dari chunk pertama
    // saja: RPC memakainya untuk menentukan sumber mana yang barisnya dihapus, dan chunk pertama
    // belum tentu memuat kedua sumber. Tanpa ini, refleksi siswa dari upload sebelumnya bisa
    // tertinggal di periode yang sedang ditimpa.
    const pernyataanSumber = [...new Set(perPeriode.pernyataan.map((r) => r.sumber || 'orangtua'))];
    const chunks = chunkPayloadRows(perPeriode, CHUNK_ROWS);

    for (let i = 0; i < chunks.length; i++) {
      // Chunk pertama yang menghapus data lama periode ini ('ganti'), sisanya menambah
      // ('lanjut'). Upload ulang tetap idempoten karena chunk pertama selalu menghapus dulu.
      const payload = {
        sekolah_id: sekolahId,
        periode_id: periodeId,
        mode: i === 0 ? 'ganti' : 'lanjut',
        ...(i === 0 ? { pernyataan_sumber: pernyataanSumber } : null),
        ...chunks[i],
      };
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'import-karakter', payload },
      });
      // Kegagalan setelah chunk pertama berarti periode ini tertulis separuh (tiap chunk
      // transaksinya sendiri). Itu harus disebut, bukan dibiarkan admin mengira periode ini
      // utuh atau kosong sama sekali.
      const separuh = i > 0 ? ` Periode ini sudah tertulis sebagian (${i} dari ${chunks.length} bagian), ulangi upload berkas ini untuk memperbaikinya.` : '';
      if (error) {
        const detail = await edgeErrorDetail(error, 'Edge Function admin-actions gagal dipanggil.');
        return { ok: false, rowsWritten: totalRows, error: `Periode ${periodeId}: ${detail}${separuh}` };
      }
      if (!data?.ok) {
        return { ok: false, rowsWritten: totalRows, error: `Periode ${periodeId}: ${data?.error || 'Import gagal tanpa keterangan.'}${separuh}` };
      }
      totalRows += (data?.skor || 0) + (data?.skor_indikator || 0) + (data?.pernyataan || 0) + (data?.summary || 0);

      // Gerbang urutan deploy. RPC versi lama (sebelum migration 20260814100000) mengabaikan
      // field mode dan SELALU menghapus data periode ini lebih dulu -- kalau frontend ini
      // terlanjur tayang sebelum migration-nya dijalankan, chunk kedua akan menghapus hasil
      // chunk pertama, dan seterusnya, sehingga yang tersisa cuma chunk terakhir TANPA satu pun
      // error. Kehilangan data diam-diam seperti itu jauh lebih buruk daripada import gagal,
      // jadi dihentikan di sini: RPC baru mengembalikan field 'mode', yang lama tidak.
      // Periode yang muat dalam satu chunk tidak lewat sini sama sekali, jadi sekolah kecil
      // tetap bisa upload walau migration-nya belum dijalankan.
      if (i === 0 && chunks.length > 1 && data?.mode !== 'ganti') {
        return {
          ok: false, rowsWritten: totalRows,
          error: `Periode ${periodeId}: database masih memakai versi lama fungsi import_karakter_periode, yang tidak mengenal upload bertahap. Jalankan dulu migration supabase/migrations/20260814100000_karakter_import_chunk_dan_timeout.sql di Supabase SQL Editor, lalu ulangi upload berkas ini.`,
        };
      }
    }
  }
  return { ok: true, rowsWritten: totalRows };
}

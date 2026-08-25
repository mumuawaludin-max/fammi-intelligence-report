// Edge Function: sync-ypt-sheets
//
// Menarik dua spreadsheet Google milik Yayasan Pendidikan Telkom ke Supabase:
//   1. Survei Kepuasan Rapor Karakter  -> kp_responden
//   2. Testimoni Citra Sekolah         -> cs_testimoni
// Keduanya respons form yang TERUS BERTAMBAH, jadi ini sinkronisasi tarik berkala, bukan
// unggah Excel sekali jalan seperti importer modul lain.
//
// Soal arsitektur: CLAUDE.md menyebut Google Sheets/GAS tidak lagi dipakai. Itu tentang GERBANG
// BACA -- dulu React membaca Sheets lewat Apps Script. Di sini spreadsheet adalah SUMBER HULU
// yang ditarik SEKALI ARAH di server, lalu FIR membaca hasilnya dari Supabase + RLS seperti
// biasa. Kunci Gemini/service_role tidak pernah menyentuh browser, dan tidak ada pemanggilan
// Gemini sama sekali di jalur ini.
//
// Dipicu dari Admin CMS (tombol "Sinkronkan Spreadsheet YPT"). Setelah stabil, jadwalkan
// harian lewat pg_cron/scheduled functions yang memanggil endpoint yang sama; tombol manual
// tetap berguna untuk menarik respons yang baru masuk.
//
// Body: { sumber?: "kepuasan" | "testimoni" | "semua" }  (default "semua")
// Respons: { ok, hasil: { kepuasan: {...}, testimoni: {...} } }
//
// Prasyarat: kedua spreadsheet dibagikan "siapa saja dengan link boleh melihat". Tanpa itu,
// export CSV membalas HTML halaman login dan sinkronisasi berhenti dengan pesan jelas.
//
// Secret opsional: YPT_SHEET_KEPUASAN_ID, YPT_SHEET_TESTIMONI_ID (kalau spreadsheetnya pindah).

import { createClient } from "jsr:@supabase/supabase-js@2";

const PROD_ORIGINS = (Deno.env.get("ALLOWED_ORIGIN") || "https://fammi-intelligence-report.vercel.app")
  .split(",").map((s) => s.trim()).filter(Boolean);

function buildCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || req.headers.get("Origin");
  const allowed = origin && (PROD_ORIGINS.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin));
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : PROD_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const SHEET_KEPUASAN = Deno.env.get("YPT_SHEET_KEPUASAN_ID")
  || "1yLxxa4cvN4vO-0IkvWoUJSXRX_60HGfGrMGqR864RL0";
const SHEET_TESTIMONI = Deno.env.get("YPT_SHEET_TESTIMONI_ID")
  || "1bFeeBZJcCuzYQKus13le0TdTqWl847U3FSDKHAJtsw8";

// ── Parser CSV ───────────────────────────────────────────────────────────────────────────────
// Ditulis sendiri (bukan split(",")) karena isian esai responden sangat sering memuat koma,
// tanda kutip, DAN baris baru di tengah jawaban -- ketiganya membuat pemisahan naif menggeser
// seluruh kolom tanpa error, menghasilkan skor yang tampak wajar tapi salah kolom.
function parseCsv(teks: string): string[][] {
  const baris: string[][] = [];
  let sel = "";
  let kolom: string[] = [];
  let dalamKutip = false;

  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];

    if (dalamKutip) {
      if (c === '"') {
        if (teks[i + 1] === '"') { sel += '"'; i++; }  // kutip ganda = kutip literal
        else dalamKutip = false;
      } else sel += c;
      continue;
    }

    if (c === '"') { dalamKutip = true; continue; }
    if (c === ",") { kolom.push(sel); sel = ""; continue; }
    if (c === "\r") continue;
    if (c === "\n") { kolom.push(sel); baris.push(kolom); kolom = []; sel = ""; continue; }
    sel += c;
  }

  if (sel !== "" || kolom.length > 0) { kolom.push(sel); baris.push(kolom); }
  return baris.filter((r) => r.some((s) => s.trim() !== ""));
}

async function ambilSheet(sheetId: string, namaSumber: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  const res = await fetch(url, { redirect: "follow" });

  if (!res.ok) {
    throw new Error(`Spreadsheet ${namaSumber} tidak bisa diambil (HTTP ${res.status}). `
      + `Pastikan berkasnya dibagikan "siapa saja dengan link boleh melihat".`);
  }

  const teks = await res.text();
  // Google membalas halaman HTML (bukan CSV) kalau berkasnya masih privat -- statusnya tetap 200,
  // jadi kegagalan ini TIDAK terdeteksi lewat res.ok dan harus diperiksa dari isinya.
  if (teks.trimStart().startsWith("<")) {
    throw new Error(`Spreadsheet ${namaSumber} masih privat. Ubah aksesnya jadi `
      + `"siapa saja dengan link boleh melihat", lalu sinkronkan lagi.`);
  }

  return parseCsv(teks);
}

// ── Normalisasi nilai ────────────────────────────────────────────────────────────────────────

/** "5/1/2026 11:29:17" (M/D/YYYY) -> { periode: "2026-05", iso }. Null kalau tidak bisa diurai. */
function uraiTimestamp(teks: string) {
  const m = (teks || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2}))?/);
  if (!m) return null;
  const [, bln, tgl, thn, jam = "0", mnt = "0", dtk = "0"] = m;
  const d = new Date(Date.UTC(+thn, +bln - 1, +tgl, +jam, +mnt, +dtk));
  if (Number.isNaN(d.getTime())) return null;
  return { periode: `${thn}-${String(bln).padStart(2, "0")}`, iso: d.toISOString() };
}

/**
 * Peran responden -> lima nilai kanonik.
 * URUTAN PENGECEKAN PENTING: "Wakil Kepala Sekolah" memuat "Kepala Sekolah", dan
 * "Wali Kelas dan BK" memuat "Wali Kelas" -- keduanya harus tertangkap oleh cabang yang lebih
 * spesifik lebih dulu, kalau tidak akan salah kelompok tanpa jejak.
 */
function normalPeran(teks: string) {
  const t = (teks || "").toLowerCase();
  if (/\bbk\b|bimbingan konseling/.test(t)) return "BK";
  if (/wakasek|wakil kepala|kaur/.test(t)) return "Wakasek";
  if (/guru mata pelajaran|guru mapel/.test(t)) return "GuruMapel";
  if (/kepala sekolah/.test(t)) return "KepalaSekolah";
  if (/wali kelas|walas/.test(t)) return "WaliKelas";
  return "WaliKelas";
}

const STATUS_BACA = [
  { kanonik: "Ya", cocok: ["ya"] },
  { kanonik: "SebagianBaca", cocok: ["sudah baca sebagian", "sebagian"] },
  { kanonik: "RingkasanSaja", cocok: ["ringkasan"] },
  { kanonik: "BelumBaca", cocok: ["belum sempat", "belum membaca"] },
];

function normalStatusBaca(teks: string) {
  const t = (teks || "").trim().toLowerCase();
  if (!t) return null;
  // Cabang spesifik dicek lebih dulu; "ya" yang cuma dua huruf ditaruh terakhir supaya tidak
  // menyerempet kalimat lain yang kebetulan memuatnya.
  for (const s of STATUS_BACA.slice(1)) {
    if (s.cocok.some((c) => t.includes(c))) return s.kanonik;
  }
  return t === "ya" ? "Ya" : teks.trim();
}

/**
 * Enam opsi tindak lanjut. Dicocokkan sebagai SUBSTRING dari jawaban mentah, bukan lewat
 * split(",") -- data nyata memuat artefak label form ("☐ Membagikan laporan ke orang tua siswa"
 * menempel tanpa pemisah koma) dan opsi yang sendirinya mengandung koma.
 */
const TINDAK_LANJUT = [
  "Mengecek daftar siswa \"Perlu Perhatian\"",
  "Mendiskusikan data dengan sesama guru",
  "Menghubungi orang tua siswa yang perlu perhatian",
  "Menyesuaikan pendekatan pembelajaran di kelas",
  "Membagikan laporan ke orang tua siswa",
  "Belum melakukan tindak lanjut apapun",
];

function normalTindakLanjut(teks: string) {
  // Tanda kutip dinormalkan dulu (lurus, lengkung, dan tanpa kutip sama sekali) karena Google
  // Form menuliskan opsi 'Mengecek daftar siswa "Perlu Perhatian"' dengan kutip lengkung di
  // sebagian ekspor dan kutip lurus di sebagian lain.
  const bersih = (s: string) => s.toLowerCase().replace(/["“”'']/g, "");
  const t = bersih(teks || "");
  return TINDAK_LANJUT.filter((opsi) => t.includes(bersih(opsi)));
}

function angka(teks: string) {
  const n = Number(String(teks || "").trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function teksLayak(teks: string) {
  const t = (teks || "").trim();
  return t.length > 3 && !/^[-_.\s]+$/.test(t) ? t : null;
}

const KATEGORI_TESTIMONI: Record<string, string> = {
  apresiasi: "Apresiasi",
  harapan: "Harapan",
  "saran & masukan": "SaranMasukan",
  "saran dan masukan": "SaranMasukan",
  saran: "SaranMasukan",
  "kritik & keluhan": "KritikKeluhan",
  "kritik dan keluhan": "KritikKeluhan",
  kritik: "KritikKeluhan",
};

async function hash(...bagian: (string | null | undefined)[]) {
  const teks = bagian.map((b) => (b ?? "")).join("|");
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(teks));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Pemetaan nama sekolah ────────────────────────────────────────────────────────────────────

/**
 * Muat tabel alias sekali, kembalikan fungsi pencari + pencatat alias tak dikenal.
 * Alias yang tidak ketemu TIDAK dibuang diam-diam: dicatat ke ypt_alias_tak_dikenal supaya
 * muncul di CMS dan admin tahu persis sekolah mana yang belum terhubung.
 */
async function buatPencariSekolah(admin: ReturnType<typeof createClient>, sumber: string) {
  const { data } = await admin.from("ypt_sekolah_alias").select("alias, sekolah_id");
  const peta = new Map<string, string>();
  (data || []).forEach((r: { alias: string; sekolah_id: string }) => peta.set(r.alias, r.sekolah_id));

  const takDikenal = new Map<string, number>();

  return {
    cari(nama: string) {
      const kunci = (nama || "").trim().toUpperCase();
      if (!kunci) return null;
      const id = peta.get(kunci);
      if (id) return id;
      takDikenal.set(kunci, (takDikenal.get(kunci) || 0) + 1);
      return null;
    },
    async simpanTakDikenal() {
      if (takDikenal.size === 0) return [];
      const rows = Array.from(takDikenal.entries()).map(([alias, jumlah]) => ({
        alias, sumber, jumlah, terakhir_dilihat: new Date().toISOString(),
      }));
      await admin.from("ypt_alias_tak_dikenal").upsert(rows, { onConflict: "alias" });
      return rows.map((r) => `${r.alias} (${r.jumlah} baris)`);
    },
  };
}

// ── Sinkronisasi Survei Kepuasan ─────────────────────────────────────────────────────────────

/** Cari indeks kolom lewat kata kunci di header; -1 kalau tidak ketemu. */
function kolomIdx(header: string[], ...kunci: string[]) {
  return header.findIndex((h) => {
    const t = (h || "").toLowerCase();
    return kunci.every((k) => t.includes(k.toLowerCase()));
  });
}

async function syncKepuasan(admin: ReturnType<typeof createClient>) {
  const baris = await ambilSheet(SHEET_KEPUASAN, "Survei Kepuasan");
  if (baris.length < 2) return { total: 0, baru: 0, dilewati: 0, aliasTakDikenal: [] };

  const header = baris[0];
  // Kolom dicari lewat kata kunci, bukan posisi tetap: pertanyaan form bisa disunting redaksinya
  // atau ditambah pertanyaan baru di tengah, dan indeks keras akan diam-diam salah kolom.
  const idx = {
    waktu: 0,
    sekolah: kolomIdx(header, "nama sekolah"),
    peran: kolomIdx(header, "peran"),
    baca: kolomIdx(header, "membaca laporan"),
    tindak: kolomIdx(header, "apa yang bapak/ibu lakukan"),
    mudah: kolomIdx(header, "mudah dipahami"),
    lengkap: kolomIdx(header, "kelengkapan"),
    relevan: kolomIdx(header, "relevansi"),
    rekomendasi: kolomIdx(header, "kejelasan rekomendasi"),
    waktuKirim: kolomIdx(header, "ketepatan waktu"),
    komunikasi: kolomIdx(header, "kualitas komunikasi"),
    disukai: kolomIdx(header, "paling", "sukai"),
    saran: kolomIdx(header, "diperbaiki"),
  };

  if (idx.sekolah < 0 || idx.peran < 0) {
    throw new Error("Header spreadsheet Survei Kepuasan tidak dikenali (kolom sekolah/peran tidak ketemu).");
  }

  const pencari = await buatPencariSekolah(admin, "kepuasan");
  const rows: Record<string, unknown>[] = [];
  let dilewati = 0;

  for (const r of baris.slice(1)) {
    const waktu = uraiTimestamp(r[idx.waktu]);
    const sekolahId = pencari.cari(r[idx.sekolah]);
    if (!waktu || !sekolahId) { dilewati++; continue; }

    const metrik: Record<string, number> = {};
    const petaMetrik: [string, number][] = [
      ["mudah_dipahami", idx.mudah],
      ["kelengkapan", idx.lengkap],
      ["relevansi", idx.relevan],
      ["kejelasan_rekomendasi", idx.rekomendasi],
      ["ketepatan_waktu", idx.waktuKirim],
      ["komunikasi", idx.komunikasi],
    ];
    petaMetrik.forEach(([nama, i]) => {
      const n = i >= 0 ? angka(r[i]) : null;
      // Nilai di luar 1-5 dibuang, bukan dipaksa masuk: itu tanda kolomnya bergeser atau
      // respondennya mengisi teks, dan memasukkannya akan mencemari rata-rata diam-diam.
      if (n != null && n >= 1 && n <= 5) metrik[nama] = n;
    });

    const nilai = Object.values(metrik);
    // Skala 10 = rata-rata metrik (1-5) dikali 2. Form tidak menanyakan skor /10 langsung,
    // sedangkan Figma menampilkannya sebagai angka utama; konversinya dikunci di sini (server)
    // supaya tampilan tidak pernah menghitung ulang dengan rumus berbeda.
    const skorTotal = nilai.length > 0
      ? Number(((nilai.reduce((a, b) => a + b, 0) / nilai.length) * 2).toFixed(2))
      : null;

    rows.push({
      row_hash: await hash(r[idx.waktu], r[idx.sekolah], r[idx.peran], JSON.stringify(metrik),
        r[idx.disukai], r[idx.saran]),
      sekolah_id: sekolahId,
      periode_id: waktu.periode,
      peran_responden: normalPeran(r[idx.peran]),
      peran_mentah: (r[idx.peran] || "").trim() || null,
      status_baca: idx.baca >= 0 ? normalStatusBaca(r[idx.baca]) : null,
      tindak_lanjut: idx.tindak >= 0 ? normalTindakLanjut(r[idx.tindak]) : [],
      metrik,
      skor_total: skorTotal,
      esai_disukai: idx.disukai >= 0 ? teksLayak(r[idx.disukai]) : null,
      esai_saran: idx.saran >= 0 ? teksLayak(r[idx.saran]) : null,
      submitted_at: waktu.iso,
    });
  }

  // ignoreDuplicates: respons yang sudah pernah masuk tidak disentuh lagi. Sinkronisasi ulang
  // karena itu selalu aman dan hasilnya idempotent.
  let baru = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const potongan = rows.slice(i, i + 500);
    const { data, error } = await admin.from("kp_responden")
      .upsert(potongan, { onConflict: "row_hash", ignoreDuplicates: true })
      .select("id");
    if (error) throw new Error(`Gagal menyimpan Survei Kepuasan: ${error.message}`);
    baru += (data || []).length;
  }

  return {
    total: rows.length,
    baru,
    dilewati,
    aliasTakDikenal: await pencari.simpanTakDikenal(),
  };
}

// ── Sinkronisasi Testimoni ───────────────────────────────────────────────────────────────────

async function syncTestimoni(admin: ReturnType<typeof createClient>) {
  const baris = await ambilSheet(SHEET_TESTIMONI, "Testimoni Citra Sekolah");
  if (baris.length < 2) return { total: 0, baru: 0, dilewati: 0, aliasTakDikenal: [] };

  const header = baris[0];
  const idx = {
    waktu: 0,
    sekolah: kolomIdx(header, "sekolah"),
    nama: header.findIndex((h) => (h || "").trim().toLowerCase() === "nama"),
    kelas: kolomIdx(header, "kelas"),
    kategori: kolomIdx(header, "kategori"),
    teks: kolomIdx(header, "testimoni"),
    tampilkan: kolomIdx(header, "tampilkan"),
  };

  if (idx.sekolah < 0 || idx.teks < 0) {
    throw new Error("Header spreadsheet Testimoni tidak dikenali (kolom sekolah/isi testimoni tidak ketemu).");
  }

  const pencari = await buatPencariSekolah(admin, "testimoni");
  const rows: Record<string, unknown>[] = [];
  let dilewati = 0;

  for (const r of baris.slice(1)) {
    const waktu = uraiTimestamp(r[idx.waktu]);
    const sekolahId = pencari.cari(r[idx.sekolah]);
    const teks = teksLayak(r[idx.teks]);
    if (!waktu || !sekolahId || !teks) { dilewati++; continue; }

    const kategoriMentah = (r[idx.kategori] || "").trim().toLowerCase();
    const kategori = KATEGORI_TESTIMONI[kategoriMentah] || "Apresiasi";

    rows.push({
      row_hash: await hash(r[idx.waktu], r[idx.sekolah], r[idx.nama], teks),
      sekolah_id: sekolahId,
      periode_id: waktu.periode,
      nama: idx.nama >= 0 ? (r[idx.nama] || "").trim() || null : null,
      kelas: idx.kelas >= 0 ? (r[idx.kelas] || "").trim() || null : null,
      kategori,
      teks,
      tampilkan: idx.tampilkan >= 0 && /^ya$/i.test((r[idx.tampilkan] || "").trim()),
      submitted_at: waktu.iso,
    });
  }

  // Beda dengan kp_responden: di sini konflik MENIMPA kolom tampilkan/kategori. Kolom "Tampilkan"
  // di sheet adalah gerbang kurasi yang bisa diubah admin kapan saja, dan perubahannya harus ikut
  // terbawa saat sinkronisasi berikutnya -- bukan terkunci pada nilai saat baris pertama masuk.
  let baru = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const potongan = rows.slice(i, i + 500);
    const { data, error } = await admin.from("cs_testimoni")
      .upsert(potongan, { onConflict: "row_hash" })
      .select("id");
    if (error) throw new Error(`Gagal menyimpan Testimoni: ${error.message}`);
    baru += (data || []).length;
  }

  return {
    total: rows.length,
    baru,
    dilewati,
    aliasTakDikenal: await pencari.simpanTakDikenal(),
  };
}

// ── Handler ──────────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Tidak ada token." }, 401);

    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Sesi tidak valid." }, 401);

    const { data: profil } = await callerClient
      .from("profiles").select("peran").eq("id", userData.user.id).single();
    if (profil?.peran !== "AdminFammi") {
      return json({ error: "Cuma AdminFammi yang boleh menjalankan sinkronisasi." }, 403);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const sumber = body.sumber || "semua";

    const hasil: Record<string, unknown> = {};

    // Kegagalan satu sumber tidak membatalkan sumber lain: kalau spreadsheet testimoni masih
    // privat, sinkronisasi kepuasan tetap harus jalan dan hasilnya tetap dilaporkan.
    if (sumber === "semua" || sumber === "kepuasan") {
      try { hasil.kepuasan = await syncKepuasan(admin); }
      catch (e) { hasil.kepuasan = { error: (e as Error).message }; }
    }
    if (sumber === "semua" || sumber === "testimoni") {
      try { hasil.testimoni = await syncTestimoni(admin); }
      catch (e) { hasil.testimoni = { error: (e as Error).message }; }
    }

    return json({ ok: true, hasil });
  } catch (e) {
    return json({ error: (e as Error).message || "Sinkronisasi gagal." }, 500);
  }
});

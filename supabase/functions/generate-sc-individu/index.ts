// Edge Function: generate-sc-individu
//
// Dipanggil dari CMS Admin Fammi, SATU staf (sc_personal_id) per panggilan -- pola identik
// generate-mi/index.ts (satu murid per panggilan), TAPI cuma SATU panggilan Gemini per staf
// (bukan 5x seperti MI), karena skema keluarannya lebih ringkas. Menulis hasilnya ke sc_hasil
// berstatus 'menunggu_persetujuan'.
//
// Body: { sc_personal_id, catatan? } -- catatan opsional dari reviewer (Fase C: "Regenerate
// dengan catatan" di PersetujuanSc.jsx), disimpan permanen ke sc_feedback dan otomatis dipatuhi
// di panggilan ini DAN setiap generate ulang berikutnya untuk staf yang sama, pola identik
// gemini_feedback pada generate-tindak-lanjut.
//
// CATATAN TERBUKA (lihat docs/Kerangka_School_Culture_FIR.md dan migration 20260722100000):
// bagian_kesejahteraan.indeks di sini dihitung sebagai RATA-RATA sederhana dari 5 nilai
// kesejahteraan yang sudah final (bukan interpretasi/kategori baru, cuma agregasi tampilan
// satu angka ringkasan) -- kategori-nya (Sangat Rendah..Sangat Tinggi) sengaja DIBIARKAN null
// sampai pemilik produk mengonfirmasi ambang persen->kategori untuk level individu (sheet
// "Personal" tidak menyertakan kolom predikat untuk blok ini, beda dari sheet "Lembaga").
//
// Deploy: supabase functions deploy generate-sc-individu (WAJIB lewat CLI, bukan Dashboard
//   "Via Editor" -- fungsi ini mengimpor ../_shared/geminiPromptSc.ts + ../_shared/cors.ts).
// Secret: GEMINI_API_KEY (sama seperti generate-mi/generate-tindak-lanjut).

import { createClient } from "jsr:@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { callGemini } from "../_shared/geminiPrompt.ts";
import { SYSTEM_INSTRUCTION_SC_INDIVIDU, buildUserPromptScIndividu } from "../_shared/geminiPromptSc.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-3.5-flash";

const DISCLAIMER_INDIVIDU =
  "Laporan ini adalah hasil pengolahan jawaban asesmen Anda dan bersifat rahasia. Gunakan sebagai bahan refleksi pribadi, bukan alat penilaian kinerja formal.";

function rataRata(nilai: number[]) {
  const valid = nilai.filter((n) => Number.isFinite(n));
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  function json(body, status = 200) {
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

    const { data: profile, error: profileErr } = await callerClient
      .from("profiles").select("peran").eq("id", userData.user.id).single();
    if (profileErr || profile?.peran !== "AdminFammi") {
      return json({ error: "Cuma AdminFammi yang boleh menggenerate laporan School Culture." }, 403);
    }

    const body = await req.json();
    const scPersonalId = body.sc_personal_id;
    if (!scPersonalId) return json({ error: "Field wajib: sc_personal_id." }, 400);

    const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: row, error: rowErr } = await db
      .from("sc_personal")
      .select("id, sekolah_id, periode_id, nama_responden, peran_kerja, unit, jenjang, jenis_kelamin, budaya, kesejahteraan, profil_organisasi, essay, pregen_laporan")
      .eq("id", scPersonalId).maybeSingle();
    if (rowErr) return json({ error: rowErr.message }, 500);
    if (!row) return json({ error: "sc_personal_id tidak ditemukan." }, 404);

    const { data: sekolahRow } = await db.from("schools").select("nama").eq("id", row.sekolah_id).maybeSingle();
    const namaLembaga = sekolahRow?.nama || row.sekolah_id;

    if (body.catatan && String(body.catatan).trim()) {
      const { error: fbErr } = await db.from("sc_feedback").insert({
        sekolah_id: row.sekolah_id, sc_personal_id: row.id, catatan: String(body.catatan).trim(),
      });
      if (fbErr) return json({ error: `Gagal simpan catatan: ${fbErr.message}` }, 500);
    }
    const { data: feedbackRows } = await db.from("sc_feedback")
      .select("catatan").eq("sc_personal_id", row.id)
      .order("created_at", { ascending: false }).limit(10);
    const arahanReviewer = (feedbackRows || []).map((r: any) => r.catatan).filter(Boolean);

    // JALUR PINTAS: laporan siap pakai dari Excel (kolom "laporan_json" di sheet Personal ->
    // sc_personal.pregen_laporan, lihat migration 20260728100000 dan scImporter.js). Kalau ada
    // dan bentuknya valid, dipakai APA ADANYA dan Gemini tidak dipanggil sama sekali untuk
    // responden ini. Dibuat karena jendela 503 Gemini yang berjam-jam berkali-kali menggagalkan
    // generate massal (lihat riwayat retry/fallback/timeout di _shared/geminiPrompt.ts).
    //
    // Validasi bentuknya SENGAJA sama persis dengan validasi keluaran Gemini di bawah -- dari
    // sini ke bawah kedua jalur tidak dibedakan lagi, termasuk QC otomatis dan gerbang
    // persetujuan admin ('menunggu_persetujuan'), supaya jalur Excel tidak diam-diam lebih
    // longgar standarnya daripada jalur Gemini.
    const pregen = row.pregen_laporan;
    const pakaiPregen = !!(pregen && typeof pregen === "object" && pregen.header && Array.isArray(pregen.rencana_aksi));

    let out;
    if (pakaiPregen) {
      out = pregen;
      console.log(`generate-sc-individu: pakai laporan siap pakai dari Excel untuk ${row.nama_responden} (Gemini dilewati).`);
    } else {
      if (pregen) {
        // Kolomnya terisi TAPI bentuknya tidak valid -- jangan diam-diam jatuh ke Gemini tanpa
        // jejak, admin perlu tahu kolom Excel-nya perlu diperbaiki.
        console.warn(`generate-sc-individu: pregen_laporan untuk ${row.nama_responden} ada tapi bentuknya tidak valid, jatuh ke Gemini.`);
      }
      const prompt = buildUserPromptScIndividu({
        namaResponden: row.nama_responden, peranKerja: row.peran_kerja, unit: row.unit,
        budaya: row.budaya || [], kesejahteraan: row.kesejahteraan || [],
        profilOrganisasi: row.profil_organisasi || [], essay: row.essay || {}, arahanReviewer,
      });
      try {
        out = await callGemini(GEMINI_API_KEY, GEMINI_MODEL, SYSTEM_INSTRUCTION_SC_INDIVIDU, prompt);
      } catch (geminiErr: any) {
        // Log eksplisit -- SEBELUMNYA error dari callGemini() cuma dilempar ke catch terluar dan
        // dibalas sebagai JSON ke klien, tapi TIDAK PERNAH tercatat di Supabase Function Logs
        // (yang cuma menangkap Boot/Shutdown dari infra, bukan console output kita). Tanpa baris
        // ini, admin tidak bisa tahu APAKAH kegagalan berulang sungguh Gemini 503, API key
        // salah, model tidak ada, atau sebab lain -- cuma bisa menebak dari pola waktu.
        console.error(`generate-sc-individu gagal untuk sc_personal_id=${scPersonalId} (${row.nama_responden}): ${geminiErr?.message || geminiErr}`);
        throw geminiErr;
      }
    }
    if (!out || !out.header || !Array.isArray(out.rencana_aksi)) {
      console.error(`generate-sc-individu: Gemini balas JSON tapi skema tidak valid untuk sc_personal_id=${scPersonalId} (${row.nama_responden}). Keys: ${out ? Object.keys(out).join(", ") : "null"}`);
      return json({ error: "Gemini tidak mengembalikan laporan yang valid." }, 500);
    }
    const qcFlags = computeQcFlags(out);

    const indeks = rataRata((row.kesejahteraan || []).map((k: any) => k.nilai));

    // sc_personal.budaya (jsonb) punya DUA pasang angka per tipe (lihat buildBudayaPersonal di
    // scImporter.js): mean_gambaran/mean_harapan (rata-rata mentah Likert 1-5 per staf -- angka
    // SATU digit, mis. "4") dan t_gambaran/t_harapan (konversi T-score dari kolom t_konversi_*
    // sheet Personal -- angka DUA digit/puluhan, skala yang sebanding dipakai seluruh laporan
    // ini). WAJIB pakai t_gambaran/t_harapan untuk saat_ini/harapan yang ditampilkan -- pakai
    // mean_ langsung bikin kartu budaya laporan individu tampil "4%" alih-alih angka puluhan
    // yang benar (bug nyata, ditemukan dari laporan produksi). Sheet Lembaga (agregat pimpinan,
    // buildBudayaLembaga) TIDAK punya kolom t_konversi_ sama sekali (t_gambaran/t_harapan selalu
    // null di situ) -- itu levelnya sendiri, sengaja tidak disentuh perbaikan ini, kolom
    // gambaran_/harapan_ Lembaga memang skala berbeda dari mean_ Personal.
    const budayaChartData = (row.budaya || []).map((b: any) => ({
      tipe: b.tipe, saat_ini: b.t_gambaran ?? b.mean_gambaran, harapan: b.t_harapan ?? b.mean_harapan,
    }));

    // header.hook SEKARANG RUMUS, BUKAN Gemini -- instruksi eksplisit pemilik produk:
    // 'Anda melihat {nama_lembaga} ini sebagai "{jawaban survey_q1_gambaran_lembaga}"'. Kutipan
    // esai Q1 verbatim (satu huruf pun tidak diubah), nama_lembaga dari tabel schools (sudah
    // final). Fallback ke header.hook Gemini kalau staf tidak mengisi Q1 (data lama sebelum
    // kolom ini ditambahkan importer, atau memang dikosongkan) -- tidak ada jalan menyusun
    // kalimat rumus yang jujur tanpa kutipannya, jadi Gemini boleh isi kekosongan ini.
    const gambaranLembaga = row.essay?.gambaran_lembaga ? String(row.essay.gambaran_lembaga).trim() : "";
    const hook = gambaranLembaga
      ? `Anda melihat ${namaLembaga} ini sebagai "${gambaranLembaga}"`
      : (out.header?.hook || `Anda melihat ${namaLembaga}.`);

    // CATATAN (Gap C audit, lihat ScLaporanIndividuPage.jsx): sejak beranda laporan individu
    // direstart total (hero ringkas + 4 section flat + Rencana Tindak Lanjut jadi halaman
    // terpisah), field header.sub_hook dan ketiga bagian_*.narasi + bagian_refleksi di bawah
    // TIDAK PERNAH dirender ke staf lagi -- cuma header.hook dan jawaban_survey yang benar-benar
    // tampil. Field ini SENGAJA TETAP digenerate (bukan dihapus dari skema Gemini) karena masih
    // berguna sebagai konteks tinjauan admin di ScDetailDrawer.jsx sebelum approve -- kalau nanti
    // mau dipangkas dari system instruction untuk hemat token, cek dulu tidak ada konsumer lain.
    const detail = {
      meta: {
        responden_id: row.id, nama_responden: row.nama_responden, peran_kerja: row.peran_kerja,
        unit: row.unit, jenjang: row.jenjang, jenis_kelamin: row.jenis_kelamin || null,
        organisasi_id: row.sekolah_id, periode_id: row.periode_id,
        // Dipakai frontend (ScLaporanIndividuPage.jsx) menyusun ULANG kalimat header di sisi
        // render, bukan cuma memakai `header.hook` yang statis -- supaya sapaannya bisa
        // menyesuaikan siapa yang membuka laporan (pemilik sendiri vs drill-down pimpinan),
        // sesuatu yang tidak bisa dilakukan kalau kalimatnya sudah dipanggang jadi satu string
        // di sini saat generate.
        nama_lembaga: namaLembaga,
        // Jejak perumus laporan ini: 'excel' = JSON siap pakai dari kolom laporan_json,
        // 'gemini' = dirumuskan Edge Function ini saat itu juga. Dipakai badge di layar
        // Persetujuan School Culture supaya reviewer tahu apa yang sedang ditinjaunya.
        sumber: pakaiPregen ? "excel" : "gemini",
      },
      header: { hook, sub_hook: out.header?.sub_hook || "" },
      bagian_budaya: { narasi: out.bagian_budaya?.narasi || "", chart_data: budayaChartData, tabel_gap: (row.budaya || []).map((b: any) => ({ label: b.tipe, arah: arahDariGap(b.gap), nilai_gap: b.gap })) },
      bagian_kesejahteraan: { narasi: out.bagian_kesejahteraan?.narasi || "", indeks, kategori: null, chart_data: row.kesejahteraan || [] },
      bagian_profil_organisasi: { narasi: out.bagian_profil_organisasi?.narasi || "", chart_data: row.profil_organisasi || [] },
      bagian_cermin: buildCermin(row.essay, out.cermin_konteks),
      bagian_refleksi: out.bagian_refleksi || "",
      jawaban_survey: buildJawabanSurvey(row.essay),
      rencana_aksi: (out.rencana_aksi || []).map((a: any, i: number) => ({
        id: `${row.id}-aksi-${i + 1}`, judul: a.judul, alasan: a.alasan,
        terkait: a.terkait, jangka: a.jangka, ikon: a.ikon || "🎯",
      })),
      lingkar_kontribusi: buildLingkarKontribusi(out.lingkar_kontribusi),
      footer: { disclaimer: DISCLAIMER_INDIVIDU },
    };

    // Idempoten: buang draf 'menunggu_persetujuan' lama untuk (personal, periode) yang sama
    // dulu, supaya generate ulang tidak menumpuk draf ganda -- pola sama generate-mi.
    await db.from("sc_hasil").delete()
      .eq("sc_personal_id", row.id).eq("periode_id", row.periode_id).eq("status", "menunggu_persetujuan");

    const { error: insErr } = await db.from("sc_hasil").insert({
      sekolah_id: row.sekolah_id, sc_personal_id: row.id, periode_id: row.periode_id,
      detail, status: "menunggu_persetujuan", qc_flags: qcFlags.length > 0 ? qcFlags : null,
    });
    if (insErr) return json({ error: insErr.message }, 500);

    return json({ ok: true, nama: row.nama_responden, sumber: pakaiPregen ? "excel" : "gemini" });
  } catch (e: any) {
    // Jaring pengaman terluar -- menangkap error DI LUAR blok callGemini di atas (mis. koneksi
    // DB, RPC gagal), yang sebelumnya juga tidak pernah tercatat di Function Logs.
    console.error(`generate-sc-individu error tak tertangani: ${e?.message || e}`);
    return json({ error: String(e?.message || e) }, 500);
  }
});

// Fase C: QC otomatis ringan, regex saja -- TIDAK auto-block draf mana pun, cuma menandai
// supaya reviewer tahu bagian mana yang perlu dibaca lebih teliti sebelum approve. Diperiksa
// dari keluaran Gemini MENTAH (out), bukan `detail` final -- bagian_cermin sengaja tidak
// diperiksa di sini karena isinya kutipan verbatim staf sendiri (boleh mengandung angka/apa
// saja), beda dari cermin_konteks yang murni tulisan Gemini.
const FORBIDDEN_TERM_RE = /\b(ocai|klan|adhokrasi|pasar|hierarki|t-score)\b/i;
const EM_DASH_RE = /—|--/;
const NUMBER_RE = /\d/;
const MAX_KALIMAT = 4;

function jumlahKalimat(text: string) {
  return text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean).length;
}

function periksaTeks(field: string, text: string | null | undefined, flags: { field: string; issue: string }[]) {
  if (!text) return;
  if (NUMBER_RE.test(text)) flags.push({ field, issue: "contains_number" });
  if (EM_DASH_RE.test(text)) flags.push({ field, issue: "contains_em_dash" });
  if (FORBIDDEN_TERM_RE.test(text)) flags.push({ field, issue: "contains_forbidden_terms" });
  if (jumlahKalimat(text) > MAX_KALIMAT) flags.push({ field, issue: "exceeds_sentence_limit" });
}

function computeQcFlags(out: Record<string, any>) {
  const flags: { field: string; issue: string }[] = [];
  // header.hook TIDAK diperiksa di sini -- sejak header.hook jadi rumus (nama lembaga + kutipan
  // esai Q1 verbatim), isinya bukan lagi tanggung jawab Gemini, memeriksa pola larangan
  // wording (angka/em-dash/dst) terhadap kutipan asli staf tidak ada gunanya.
  periksaTeks("header.sub_hook", out.header?.sub_hook, flags);
  periksaTeks("bagian_budaya.narasi", out.bagian_budaya?.narasi, flags);
  periksaTeks("bagian_kesejahteraan.narasi", out.bagian_kesejahteraan?.narasi, flags);
  periksaTeks("bagian_profil_organisasi.narasi", out.bagian_profil_organisasi?.narasi, flags);
  periksaTeks("cermin_konteks", out.cermin_konteks, flags);
  periksaTeks("bagian_refleksi", out.bagian_refleksi, flags);
  (out.rencana_aksi || []).forEach((a: any, i: number) => {
    periksaTeks(`rencana_aksi[${i}].judul`, a?.judul, flags);
    periksaTeks(`rencana_aksi[${i}].alasan`, a?.alasan, flags);
  });
  (out.lingkar_kontribusi || []).forEach((area: any, i: number) => {
    periksaTeks(`lingkar_kontribusi[${i}].mengapa_fokus`, area?.mengapa_fokus, flags);
    (area?.langkah || []).forEach((l: any, j: number) => {
      periksaTeks(`lingkar_kontribusi[${i}].langkah[${j}].judul`, l?.judul, flags);
      periksaTeks(`lingkar_kontribusi[${i}].langkah[${j}].instruksi`, l?.instruksi, flags);
      periksaTeks(`lingkar_kontribusi[${i}].langkah[${j}].tujuan`, l?.tujuan, flags);
    });
  });
  return flags;
}

/** Arah gap: tanda field `gap` yang sudah final dibaca apa adanya (bukan ambang baru yang
 * dikarang) -- positif berarti staf berharap lebih (naik), negatif berarti berharap lebih
 * ringan (turun), persis nol berarti sejalan (tetap). */
function arahDariGap(gap: number | null) {
  if (gap == null || gap === 0) return "tetap";
  return gap > 0 ? "naik" : "turun";
}

/**
 * Kutipan esai (alasan_betah + hal_menguras_energi) ditempel VERBATIM di sini, bukan digenerate
 * Gemini -- satu huruf pun tidak boleh berubah dari jawaban staf sendiri. Gemini cuma menulis
 * konteks yang menemani (cermin_konteks), tidak pernah menyentuh isi kutipannya. Kalau kedua
 * jawaban kosong, cukup pakai konteksnya saja (ajakan reflektif umum, sudah diatur di prompt).
 */
function buildCermin(essay: Record<string, any> | null | undefined, konteks: string | null | undefined) {
  const betah = essay?.alasan_betah ? String(essay.alasan_betah).trim() : "";
  const menguras = essay?.hal_menguras_energi ? String(essay.hal_menguras_energi).trim() : "";
  const kutipan = [betah, menguras].filter(Boolean).map((t) => `"${t}"`).join(" ");
  const konteksBersih = (konteks || "").trim();
  return [kutipan, konteksBersih].filter(Boolean).join(" ");
}

/**
 * Lingkar Kontribusi (kendali/pengaruh/sistem) -- konten Gemini baru per locus, kerangka kalimat
 * eksplisit pemilik produk (mengapa_fokus + 3 langkah, tiap langkah instruksi/contoh/tujuan).
 * WAJIB tepat tiga entri locus, satu per LOCUS_VALID -- entri locus lain/ganda/kurang lengkap
 * dibuang diam-diam, frontend (ScLaporanIndividuPage.jsx) fallback ke definisi statis kalau locus
 * tertentu tidak ketemu di sini (laporan lama sebelum field ini ada, atau Gemini gagal isi satu
 * locus). Tidak men-hard-fail seluruh generate cuma karena bagian tambahan ini kurang lengkap.
 */
const LOCUS_VALID = new Set(["control", "influence", "system"]);
function buildLingkarKontribusi(raw: any) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const areas: any[] = [];
  for (const area of raw) {
    if (!area || !LOCUS_VALID.has(area.locus) || seen.has(area.locus)) continue;
    const langkah = Array.isArray(area.langkah)
      ? area.langkah
        .filter((l: any) => l && l.judul && l.instruksi && l.tujuan)
        .map((l: any) => ({
          judul: l.judul, instruksi: l.instruksi,
          contoh: Array.isArray(l.contoh) ? l.contoh.filter(Boolean) : [],
          tujuan: l.tujuan,
        }))
      : [];
    if (langkah.length === 0 || !area.mengapa_fokus) continue;
    seen.add(area.locus);
    areas.push({ locus: area.locus, mengapa_fokus: area.mengapa_fokus, langkah });
  }
  return areas;
}

/**
 * Empat jawaban esai VERBATIM, satu field per pertanyaan survey -- BEDA dari buildCermin() di
 * atas yang membaurkan sebagian jawaban ini jadi satu paragraf gabungan dengan konteks Gemini.
 * Dipakai laporan individu remake total (section "Jawaban Survey Anda" + kartu "Perubahan yang
 * Anda harapkan" di hero) supaya tiap jawaban tampil apa adanya per pertanyaan, tidak diringkas.
 */
function buildJawabanSurvey(essay: Record<string, any> | null | undefined) {
  function ambil(field: string) {
    const v = essay?.[field];
    return v ? String(v).trim() : undefined;
  }
  return {
    betah: ambil("alasan_betah"),
    hal_menguras_energi: ambil("hal_menguras_energi"),
    yang_ingin_disampaikan: ambil("yang_ingin_disampaikan"),
    yang_ingin_diubah: ambil("yang_ingin_diubah"),
    // Q1 verbatim -- dipakai frontend menyusun kalimat header (lihat catatan di meta.nama_lembaga
    // di atas), bukan cuma bahan formula sekali-jadi di sini.
    gambaran_lembaga: ambil("gambaran_lembaga"),
  };
}

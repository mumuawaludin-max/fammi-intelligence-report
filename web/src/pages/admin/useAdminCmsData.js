import { useEffect, useState, useCallback } from 'react';
import { supabase, edgeErrorDetail } from '../../lib/supabase';
import { importKarakterWorkbook } from './importers/karakterImporter';
import { importScWorkbook } from './importers/scImporter';
import { importPaWorkbook } from './importers/paImporter';

function currentPeriode() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthBefore(periodeId) {
  const [y, m] = periodeId.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function gapFor(latestPeriode) {
  if (!latestPeriode) return 'gap';
  const now = currentPeriode();
  if (latestPeriode === now) return 'none';
  if (latestPeriode === monthBefore(now)) return 'periode';
  return 'gap';
}

/** Hook data utama CMS Admin Fammi. Baca-baca lintas sekolah (RLS admin_all). */
export function useAdminCmsData() {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  const fetchAll = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [
        yayasanRes, schoolsRes, modulesRes, summaryRes, aspekRes,
        briefingRes, tlRes, importLogRes, profilesRes,
        kelasSummaryRes, tlKelasAllRes, tlSekolahYayasanRes, scheduleRes,
        scLembagaRes, tlScRes, briefingScRes,
      ] = await Promise.all([
        supabase.from('yayasan').select('id, nama'),
        supabase.from('schools').select('id, nama, jenjang, yayasan_id, aktif, logo_url'),
        supabase.from('school_modules').select('school_id, modul, aktif').eq('aktif', true),
        supabase.from('karakter_summary').select('sekolah_id, periode_id').eq('scope', 'sekolah'),
        supabase.from('karakter_aspek_config').select('sekolah_id, aspek_kode, aspek_label, urutan').order('urutan', { ascending: true }),
        supabase.from('briefing').select('id, sekolah_id, modul, scope, scope_id, periode_id, teks, sumber, tema_esai, status, created_at').eq('status', 'menunggu_persetujuan'),
        supabase.from('tindak_lanjut').select('id, sekolah_id, modul, scope, scope_id, periode_id, action, trigger_desc, priority, status, gambaran, opsi_kandidat, catatan_internal, langkah_terpilih, regenerate_dari, created_at, term, type, fokus, jenjang, icon, title, teaser, mengapa_data, mengapa_perspektif, dasar_teori, manfaat, konkret, target_role').in('status', ['menunggu_persetujuan', 'disetujui']),
        supabase.from('import_log').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('id, username, nama, peran, school_id, cakupan, created_at'),
        // Dipakai buat hitung "kelas belum ada tindak lanjut" (Rekomendasi di layar Gemini).
        // Sengaja HANYA hitung status menunggu_persetujuan/disetujui sebagai "sudah ada" --
        // kelas yang drafnya ditolak harus muncul lagi di sini supaya gampang di-generate ulang,
        // bukan malah hilang dari daftar rekomendasi selamanya.
        supabase.from('karakter_summary').select('sekolah_id, scope_id, periode_id').eq('scope', 'kelas'),
        supabase.from('tindak_lanjut').select('sekolah_id, scope_id, periode_id').eq('modul', 'karakter').eq('scope', 'kelas').in('status', ['menunggu_persetujuan', 'disetujui']),
        // Sama, tapi buat level sekolah (Kepala Sekolah) dan lintas sekolah (Yayasan) --
        // dua-duanya sama-sama scope='sekolah', dibedakan lewat target_role. Filter modul
        // penting: tanpa itu, baris tindak lanjut modul lain (MI/Screening) ikut menandai
        // sekolah sebagai "sudah ada" padahal belum ada draf karakternya.
        supabase.from('tindak_lanjut').select('sekolah_id, periode_id, target_role').eq('modul', 'karakter').eq('scope', 'sekolah').in('target_role', ['kepala_sekolah', 'yayasan']).in('status', ['menunggu_persetujuan', 'disetujui']),
        supabase.from('gemini_schedule').select('*').eq('id', 'default').maybeSingle(),
        // Rekomendasi School Culture: sekolah yang punya baris agregat sc_lembaga (unit=null,
        // seluruh sekolah) tapi belum ada tindak_lanjut modul='sc' untuk periode itu.
        supabase.from('sc_lembaga').select('sekolah_id, periode_id, unit').is('unit', null),
        supabase.from('tindak_lanjut').select('sekolah_id, periode_id, target_role').eq('modul', 'sc').eq('scope', 'sekolah').in('status', ['menunggu_persetujuan', 'disetujui']),
        // Padanan tlScRes tapi untuk briefing -- briefingRes di atas SENGAJA cuma menunggu_persetujuan
        // (dipakai pendingBySchool/antrian), tidak cocok dipakai di sini karena briefing yang SUDAH
        // disetujui harus tetap dianggap "sudah ada", bukan disuruh generate ulang terus-menerus.
        supabase.from('briefing').select('sekolah_id, periode_id').eq('modul', 'sc').eq('scope', 'sekolah').in('status', ['menunggu_persetujuan', 'disetujui']),
      ]);

      const firstError = [yayasanRes, schoolsRes, modulesRes, summaryRes, aspekRes, briefingRes, tlRes, importLogRes, profilesRes, kelasSummaryRes, tlKelasAllRes, tlSekolahYayasanRes, scheduleRes, scLembagaRes, tlScRes, briefingScRes]
        .find((r) => r.error);
      if (firstError) throw new Error(firstError.error.message);

      const modulesBySchool = {};
      (modulesRes.data || []).forEach((m) => {
        (modulesBySchool[m.school_id] ||= []).push(m.modul);
      });

      const latestPeriodeBySchool = {};
      (summaryRes.data || []).forEach((r) => {
        if (!latestPeriodeBySchool[r.sekolah_id] || r.periode_id > latestPeriodeBySchool[r.sekolah_id]) {
          latestPeriodeBySchool[r.sekolah_id] = r.periode_id;
        }
      });

      const aspekBySchool = {};
      (aspekRes.data || []).forEach((a) => {
        (aspekBySchool[a.sekolah_id] ||= []).push(a);
      });

      const pendingBySchool = {};
      [...(briefingRes.data || []), ...(tlRes.data || [])].forEach((r) => {
        if (r.status !== 'menunggu_persetujuan') return;
        pendingBySchool[r.sekolah_id] = (pendingBySchool[r.sekolah_id] || 0) + 1;
      });

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const errBySchool = {};
      (importLogRes.data || []).forEach((r) => {
        if (r.status === 'gagal' && new Date(r.created_at).getTime() >= sevenDaysAgo) {
          errBySchool[r.sekolah_id] = (errBySchool[r.sekolah_id] || 0) + 1;
        }
      });

      const sekolah = (schoolsRes.data || []).map((s) => {
        const modules = modulesBySchool[s.id] || [];
        const periode = modules.includes('karakter') ? latestPeriodeBySchool[s.id] || null : null;
        return {
          id: s.id,
          nama: s.nama,
          yay: s.yayasan_id,
          aktif: s.aktif,
          logoUrl: s.logo_url || null,
          jenjang: s.jenjang || '—',
          modules,
          periode,
          gap: modules.includes('karakter') ? gapFor(periode) : 'none',
          pendingCount: pendingBySchool[s.id] || 0,
          err: errBySchool[s.id] || 0,
          aspekConfig: aspekBySchool[s.id] || [],
        };
      });

      const schoolNameById = Object.fromEntries(sekolah.map((s) => [s.id, s.nama]));
      const sekolahInfoById = Object.fromEntries(sekolah.map((s) => [s.id, s]));

      // Rekomendasi PER PERIODE: setiap (sekolah, kelas, periode) yang punya karakter_summary
      // tapi belum ada tindak_lanjut untuk periode itu. Sengaja SEMUA periode (bukan cuma
      // terbaru) supaya kalau ada 4 periode data, keempatnya bisa digenerate sendiri-sendiri
      // dan tiap periode punya kelompok tindak lanjutnya sendiri, sesuai filter periode di FIR.
      const tlKelasKeySet = new Set(
        (tlKelasAllRes.data || []).map((r) => `${r.sekolah_id}|${r.scope_id}|${r.periode_id}`)
      );
      const rekomendasi = [];
      (kelasSummaryRes.data || []).forEach((r) => {
        const key = `${r.sekolah_id}|${r.scope_id}|${r.periode_id}`;
        if (!tlKelasKeySet.has(key)) {
          rekomendasi.push({
            sekolahId: r.sekolah_id, sekolahNama: schoolNameById[r.sekolah_id] || r.sekolah_id,
            yayasanId: sekolahInfoById[r.sekolah_id]?.yay || null,
            kelasId: r.scope_id, periodeId: r.periode_id,
          });
        }
      });
      // Urut per sekolah, lalu periode terbaru dulu, lalu kelas, supaya panel gampang dibaca.
      rekomendasi.sort((a, b) =>
        a.sekolahNama.localeCompare(b.sekolahNama) || (a.periodeId < b.periodeId ? 1 : a.periodeId > b.periodeId ? -1 : 0) || String(a.kelasId).localeCompare(String(b.kelasId), 'id', { numeric: true })
      );

      // Rekomendasi level Kepala Sekolah & Yayasan, juga PER PERIODE: tiap (sekolah, periode)
      // yang punya karakter_summary scope=sekolah (summaryRes) tapi belum ada tindak_lanjut
      // untuk target_role itu di periode tsb. Kepsek dan Yayasan sama-sama baca scope=sekolah,
      // dibedakan target_role.
      const tlSekolahKeySet = new Set(
        (tlSekolahYayasanRes.data || []).map((r) => `${r.sekolah_id}|${r.periode_id}|${r.target_role}`)
      );
      const yayasanNameById = Object.fromEntries((yayasanRes.data || []).map((y) => [y.id, y.nama]));
      const rekomendasiSekolah = [];
      const rekomendasiYayasan = [];
      (summaryRes.data || []).forEach((r) => {
        const info = sekolahInfoById[r.sekolah_id];
        if (!info || !info.modules.includes('karakter')) return;
        if (!tlSekolahKeySet.has(`${r.sekolah_id}|${r.periode_id}|kepala_sekolah`)) {
          rekomendasiSekolah.push({ sekolahId: r.sekolah_id, sekolahNama: info.nama, yayasanId: info.yay || null, periodeId: r.periode_id });
        }
        if (info.yay && !tlSekolahKeySet.has(`${r.sekolah_id}|${r.periode_id}|yayasan`)) {
          rekomendasiYayasan.push({
            yayasanId: info.yay, yayasanNama: yayasanNameById[info.yay] || info.yay,
            sekolahId: r.sekolah_id, sekolahNama: info.nama, periodeId: r.periode_id,
          });
        }
      });
      const byNamaPeriodeDesc = (a, b) => a.sekolahNama.localeCompare(b.sekolahNama) || (a.periodeId < b.periodeId ? 1 : a.periodeId > b.periodeId ? -1 : 0);
      rekomendasiSekolah.sort(byNamaPeriodeDesc);
      rekomendasiYayasan.sort(byNamaPeriodeDesc);

      // Rekomendasi School Culture, padanan rekomendasiSekolah tapi sumbernya sc_lembaga
      // (bukan karakter_summary) dan target_role='manajemen' (peran pimpinan utama modul ini).
      // sc_lembaga tidak perlu dicek modules.includes('sc') seperti karakter -- baris sc_lembaga
      // cuma ada kalau sekolahnya memang sudah import data SC.
      const tlScKeySet = new Set(
        (tlScRes.data || []).map((r) => `${r.sekolah_id}|${r.periode_id}|${r.target_role}`)
      );
      // Bug nyata yang ditemukan: rekomendasi ini SEBELUMNYA cuma cek tindak_lanjut, tidak pernah
      // cek briefing sama sekali -- begitu tindak_lanjut role=manajemen sudah ada, baris (sekolah,
      // periode) itu hilang dari daftar "perlu digenerate" SELAMANYA, padahal briefing (narasi
      // "Cerita dari Tim" dkk) belum pernah digenerate sama sekali. Admin tidak pernah tahu harus
      // buka "Trigger manual" > Tipe=Briefing secara terpisah. Sekarang baris ini tetap muncul
      // kalau SALAH SATU (tindak_lanjut ATAU briefing) masih belum ada, dan generateSc/
      // generateSemuaLevel (Gemini.jsx) memicu KEDUANYA sekaligus.
      const briefingScKeySet = new Set(
        (briefingScRes.data || []).map((r) => `${r.sekolah_id}|${r.periode_id}`)
      );
      const rekomendasiSc = [];
      (scLembagaRes.data || []).forEach((r) => {
        const info = sekolahInfoById[r.sekolah_id];
        if (!info) return;
        const adaTindakLanjut = tlScKeySet.has(`${r.sekolah_id}|${r.periode_id}|manajemen`);
        const adaBriefing = briefingScKeySet.has(`${r.sekolah_id}|${r.periode_id}`);
        if (!adaTindakLanjut || !adaBriefing) {
          rekomendasiSc.push({
            sekolahId: r.sekolah_id, sekolahNama: info.nama, yayasanId: info.yay || null, periodeId: r.periode_id,
            // Dipakai Gemini.jsx supaya generateSc/generateSemuaLevel cuma memicu tipe yang
            // memang belum ada -- tanpa ini, sekolah yang tindak_lanjut-nya sudah disetujui
            // tapi briefing-nya belum akan ikut memicu tindak_lanjut lagi (duplikat butuh
            // approve ulang percuma) setiap kali admin generate cuma untuk melengkapi briefing.
            butuhTindakLanjut: !adaTindakLanjut, butuhBriefing: !adaBriefing,
          });
        }
      });
      rekomendasiSc.sort(byNamaPeriodeDesc);

      const antrianTlAll = (tlRes.data || []).map((r) => ({
        id: r.id, tipe: 'tindak_lanjut', modul: r.modul, sekolah: r.sekolah_id, periode: r.periode_id,
        yayasan: sekolahInfoById[r.sekolah_id]?.yay || null,
        kelas: r.scope === 'kelas' ? r.scope_id : null, scope: r.scope,
        prioritas: r.priority || 'sedang', status: r.status,
        dibuat: (r.created_at || '').replace('T', ' ').slice(0, 16),
        pemicu: r.trigger_desc || '', teks: r.action || '', konteks: [],
        gambaran: r.gambaran || '', opsiKandidat: r.opsi_kandidat || [], catatanInternal: r.catatan_internal || '',
        langkahTerpilih: r.langkah_terpilih || null, regenerateDari: r.regenerate_dari || null,
        // Skema baru kartu Rapor Karakter (satu baris = satu rekomendasi, bukan opsi jamak).
        term: r.term || null, type: r.type || null, fokus: r.fokus || null, jenjang: r.jenjang || null,
        icon: r.icon || null, title: r.title || null, teaser: r.teaser || null,
        mengapaData: r.mengapa_data || null, mengapaPerspektif: r.mengapa_perspektif || null,
        dasarTeori: r.dasar_teori || null, manfaat: r.manfaat || null, konkret: r.konkret || null,
        targetRole: r.target_role || null,
      }));
      const antrianBriefing = (briefingRes.data || []).map((r) => ({
        id: r.id, tipe: 'briefing', modul: r.modul, sekolah: r.sekolah_id, periode: r.periode_id,
        yayasan: sekolahInfoById[r.sekolah_id]?.yay || null,
        kelas: r.scope === 'kelas' ? r.scope_id : null, scope: r.scope,
        prioritas: 'sedang', status: r.status,
        dibuat: (r.created_at || '').replace('T', ' ').slice(0, 16),
        pemicu: Array.isArray(r.sumber) ? `Sumber: ${r.sumber.join(', ')}` : '', teks: r.teks || '', konteks: [],
        temaEsai: r.tema_esai || null,
      }));
      const byDibuatDesc = (a, b) => (a.dibuat < b.dibuat ? 1 : -1);
      const antrian = [...antrianTlAll.filter((r) => r.status === 'menunggu_persetujuan'), ...antrianBriefing].sort(byDibuatDesc);
      const riwayatDisetujui = antrianTlAll.filter((r) => r.status === 'disetujui').sort(byDibuatDesc);

      const uploadHistory = (importLogRes.data || []).map((r) => ({
        id: r.id, when: (r.created_at || '').replace('T', ' ').slice(0, 16),
        sekolah: schoolNameById[r.sekolah_id] || r.sekolah_id, modul: r.modul, periode: r.periode_id,
        rows: r.rows, status: r.status, by: r.oleh, pesan: r.pesan,
      }));

      const users = (profilesRes.data || []).map((p) => ({
        id: p.id, nama: p.nama, username: p.username, peran: p.peran,
        sekolah: p.school_id ? (schoolNameById[p.school_id] || p.school_id) : null,
        cakupan: Array.isArray(p.cakupan) ? p.cakupan.join(', ') : (p.cakupan || ''),
        createdAt: p.created_at,
      }));

      setState({
        loading: false,
        error: null,
        data: {
          yayasan: yayasanRes.data || [], sekolah, antrian, riwayatDisetujui, uploadHistory, geminiJobs: [], users,
          rekomendasi, rekomendasiSekolah, rekomendasiYayasan, rekomendasiSc,
          geminiSchedule: scheduleRes.data || { id: 'default', aktif: false, interval_jam: 6, terakhir_jalan: null },
        },
      });
    } catch (e) {
      setState({ loading: false, error: e.message || String(e), data: null });
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { ...state, refetch: fetchAll };
}

// ── Actions (dipanggil dari CmsStore, tiap fungsi refetch sendiri lewat pemanggilnya) ──

export async function actApprovalAction(item, action, langkahTerpilih) {
  const { error } = await supabase.functions.invoke('admin-actions', {
    body: {
      action: action === 'setuju' ? 'approve' : 'reject',
      id: item.id, tipe: item.tipe, teks: item.teks,
      langkahTerpilih: langkahTerpilih || undefined,
      regenerateDari: item.regenerateDari || undefined,
    },
  });
  if (error) throw new Error(await edgeErrorDetail(error, 'Edge Function admin-actions gagal dipanggil.'));
}

export async function toggleModuleAction(schoolId, modul, nextOn) {
  const { error } = await supabase.functions.invoke('admin-actions', {
    body: { action: 'toggle-module', schoolId, modul, aktif: nextOn },
  });
  if (error) throw new Error(await edgeErrorDetail(error, 'Edge Function admin-actions gagal dipanggil.'));
}

export async function addSchoolAction({ nama, jenjang, yayasanId, modules, logoBase64 }) {
  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: { action: 'add-school', nama, jenjang, yayasanId, modules, logoBase64 },
  });
  if (error) throw new Error(await edgeErrorDetail(error, 'Edge Function admin-actions gagal dipanggil.'));
  return data.id;
}

/** Ubah sekolah yang sudah ada -- padanan addSchoolAction tapi untuk baris `schools` yang sudah
 * terdaftar duluan. `nama`/`jenjang`/`yayasanId` opsional dan independen dari logo (`logoBase64`
 * untuk unggah/ganti, `removeLogo:true` untuk menghapus) -- kirim hanya field yang benar-benar
 * berubah, field yang tidak dikirim tidak akan disentuh di sisi server. */
export async function editSchoolAction({ schoolId, nama, jenjang, yayasanId, logoBase64, removeLogo }) {
  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: { action: 'edit-school', schoolId, nama, jenjang, yayasanId, logoBase64, removeLogo },
  });
  if (error) throw new Error(await edgeErrorDetail(error, 'Edge Function admin-actions gagal dipanggil.'));
  return data;
}

export async function addYayasanAction({ nama }) {
  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: { action: 'add-yayasan', nama },
  });
  if (error) throw new Error(await edgeErrorDetail(error, 'Edge Function admin-actions gagal dipanggil.'));
  return data;
}

async function generateSatuMi(row) {
  try {
    const { data, error } = await supabase.functions.invoke('generate-mi', { body: { row } });
    if (error) {
      return { ok: false, nama: row.nama_siswa, error: await edgeErrorDetail(error, 'generate-mi gagal dipanggil.') };
    }
    if (!data?.ok) {
      return { ok: false, nama: row.nama_siswa, error: data?.error || 'Gagal tanpa keterangan.' };
    }
    return { ok: true, nama: row.nama_siswa, top_1: data.top_1 };
  } catch (e) {
    return { ok: false, nama: row.nama_siswa, error: String(e?.message || e) };
  }
}

/**
 * Generate laporan MI: satu panggilan Edge Function generate-mi PER SISWA (5 panggilan Gemini
 * per siswa, ~15-30 detik, jadi tidak bisa sekelas sekaligus dalam satu request). onProgress
 * dipanggil tiap siswa selesai supaya UI bisa menampilkan bilah kemajuan. Tidak berhenti di
 * siswa yang gagal -- kumpulkan hasil per siswa, lapor ringkasannya di akhir. Tiap panggilan
 * menulis satu baris mi_hasil berstatus menunggu_persetujuan (lihat generate-mi).
 *
 * Retry berputar sama seperti runScIndividuGenerateAction (lihat komentar di sana) -- 5
 * panggilan Gemini internal generate-mi per siswa sama-sama bisa kena jendela padat 503/429,
 * jendela padat yang lebih lama dari retry internal satu panggilan butuh putaran ulang di
 * level batch ini, bukan cuma sekali seperti sebelumnya (yang sebelumnya malah tidak ada sama
 * sekali di MI).
 */
export async function runMiGenerateAction(rows, onProgress) {
  const results = [];
  for (let i = 0; i < rows.length; i++) {
    results.push(await generateSatuMi(rows[i]));
    onProgress?.(i + 1, rows.length);
  }

  for (let pass = 0; pass < RETRY_PASS_DELAYS_MS.length; pass++) {
    const gagalTransient = results
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => !r.ok && isTransientGeminiError(r.error));
    if (gagalTransient.length === 0) break;

    // waiting:true dulu SEBELUM sleep -- UI (Upload.jsx) butuh tahu sedang menunggu jeda retry
    // (bukan macet), baru sesudah sleep dilaporkan sedang mencoba ulang satu-satu.
    onProgress?.(rows.length, rows.length, { pass: pass + 1, ofPass: RETRY_PASS_DELAYS_MS.length, sisaGagal: gagalTransient.length, waiting: true });
    await sleep(RETRY_PASS_DELAYS_MS[pass]);
    for (const { i } of gagalTransient) {
      results[i] = await generateSatuMi(rows[i]);
      onProgress?.(rows.length, rows.length, { pass: pass + 1, ofPass: RETRY_PASS_DELAYS_MS.length, sisaGagal: gagalTransient.length, waiting: false });
    }
  }
  return results;
}

/** Ambil daftar laporan MI menunggu persetujuan lewat admin-actions (service_role, supaya RLS
 * mi_hasil tidak perlu membuka baris menunggu ke AdminFammi). */
export async function loadMiPendingAction() {
  const { data, error } = await supabase.functions.invoke('admin-actions', { body: { action: 'list-mi-pending' } });
  if (error) throw new Error(await edgeErrorDetail(error, 'Gagal memuat antrian MI.'));
  return data?.rows || [];
}

/** Setuju/tolak satu laporan MI. Kalau disetujui, admin-actions otomatis buat akun OrangTua
 * untuk murid itu (kalau belum ada) -- hasilnya dikembalikan di sini supaya kodenya bisa
 * ditampilkan sekali ke admin (password tidak bisa diambil ulang setelah ini). */
export async function actMiApproval(id, action) {
  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: { action: action === 'setuju' ? 'approve-mi' : 'reject-mi', id },
  });
  if (error) throw new Error(await edgeErrorDetail(error, 'Edge Function admin-actions gagal dipanggil.'));
  return data?.akun || null;
}

export async function runImportAction({ sekolahId, modul, fileName, parsed, paMode }) {
  const periodeId = parsed?.preview?.periodeDetected?.map((p) => p.periode).join(',') || null;
  const IMPORTER = {
    karakter: importKarakterWorkbook,
    sc: importScWorkbook,
    // Perilaku Anak satu-satunya importer yang butuh argumen kedua (mode ulang/baru) -- lihat
    // catatan di paImporter.js.
    pa: (p) => importPaWorkbook(p, paMode),
  };
  const importer = IMPORTER[modul];
  if (!importer) {
    await supabase.from('import_log').insert({
      sekolah_id: sekolahId, modul, periode_id: periodeId, rows: 0, status: 'gagal',
      pesan: 'Importer modul ini belum tersedia.', oleh: fileName || 'admin',
    });
    throw new Error('Importer untuk modul ini belum tersedia.');
  }
  const result = await importer(parsed);
  await supabase.from('import_log').insert({
    sekolah_id: sekolahId, modul, periode_id: periodeId,
    rows: result.rowsWritten, status: result.ok ? 'sukses' : 'gagal',
    pesan: result.ok ? null : result.error, oleh: fileName || 'admin',
  });
  if (!result.ok) throw new Error(result.error);
  return result;
}

/** Ambil id+nama seluruh sc_personal untuk satu (sekolah, periode) yang baru diimpor -- dipakai
 * Upload.jsx untuk tahu siapa saja yang perlu digenerate laporan individunya setelah import.
 * Lewat admin-actions (service_role), BUKAN query langsung -- RLS sc_personal cuma membuka
 * baris ke KepalaSekolah/WakilKepalaSekolah/Manajemen/Yayasan sekolah itu sendiri, AdminFammi
 * tidak match sekolah_id = my_school_id() apa pun sekolah yang diakses, jadi query langsung
 * selalu balas 0 baris walau datanya baru saja berhasil diimpor. */
export async function loadScPersonalIdsAction(sekolahId, periodeId) {
  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: { action: 'list-sc-personal', sekolah_id: sekolahId, periode_id: periodeId },
  });
  if (error) throw new Error(await edgeErrorDetail(error, 'Edge Function admin-actions gagal dipanggil.'));
  if (!data?.ok) throw new Error(data?.error || 'Gagal memuat daftar responden.');
  return data.rows || [];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** true kalau error-nya kelihatan seperti overload sementara Gemini (503/UNAVAILABLE, atau 429
 * rate limit) -- pola yang sama dipakai callGemini() di _shared/geminiPrompt.ts untuk retry
 * server-side, dicek lagi di sini untuk retry lapis kedua di sisi klien (lihat komentar di
 * runScIndividuGenerateAction). */
function isTransientGeminiError(msg) {
  // "timeout"/"gagal dihubungi" -- callGemini() (_shared/geminiPrompt.ts) sekarang membatasi tiap
  // fetch ke Gemini dengan AbortController, ditemukan lewat log Supabase yang menunjukkan
  // function generate-sc-individu mati diam-diam di ~75 detik (platform membunuh koneksi yang
  // menggantung tanpa timeout sendiri) alih-alih melempar error yang bisa di-retry. Kedua pesan
  // baru itu sama transiennya dengan 503/429, wajib ikut lapis retry batch di sini juga.
  return /\b503\b|UNAVAILABLE|\b429\b|high demand|timeout|gagal dihubungi/i.test(String(msg || ''));
}

async function generateSatuSc(p) {
  try {
    const { data, error } = await supabase.functions.invoke('generate-sc-individu', {
      body: { sc_personal_id: p.id },
    });
    if (error) {
      return { ok: false, nama: p.nama_responden, error: await edgeErrorDetail(error, 'generate-sc-individu gagal dipanggil.') };
    }
    if (!data?.ok) {
      return { ok: false, nama: p.nama_responden, error: data?.error || 'Gagal tanpa keterangan.' };
    }
    return { ok: true, nama: p.nama_responden };
  } catch (e) {
    return { ok: false, nama: p.nama_responden, error: String(e?.message || e) };
  }
}

/**
 * Generate laporan individu SC satu per satu (bukan Promise.all -- pola sama runMiGenerateAction,
 * Edge Function generate-sc-individu makan waktu per panggilan). onProgress dipanggil tiap staf
 * selesai. Tidak berhenti di staf yang gagal, kumpulkan hasil per staf.
 *
 * Dua lapis penanganan 503 Gemini ("model sedang padat"): callGemini() di server sudah retry
 * sendiri dengan backoff eksponensial (lihat _shared/geminiPrompt.ts), tapi kalau permintaan
 * ditembak beruntun tanpa jeda (16 staf berturut-turut) itu sendiri bisa memicu overload baru,
 * dan kalau jendela padatnya kebetulan lebih lama dari total waktu retry SATU panggilan
 * (~35 detik), retry di dalam satu panggilan itu saja tidak cukup. Di sini ditambah (1) jeda
 * kecil ANTAR staf supaya tidak membanjiri API, dan (2) BEBERAPA putaran retry di akhir khusus
 * staf yang gagalnya kelihatan transient (503/429), dengan jeda antar-putaran yang makin
 * panjang (5s, 15s, 30s) -- satu putaran saja (perilaku lama) terbukti tidak cukup kalau
 * jendela padat Gemini kebetulan menutupi hampir seluruh proses generate massal.
 */
// Putaran keempat (60 detik) ditambahkan setelah log produksi menunjukkan jendela 503 Gemini
// bisa menutupi seluruh tiga putaran pertama (5+15+30 detik) -- dikombinasikan dengan fallback
// model di callGemini() (_shared/geminiPrompt.ts), putaran yang lebih renggang ini memberi
// kesempatan jendela padatnya lewat betulan, bukan cuma menembak ulang di tengah badai.
const RETRY_PASS_DELAYS_MS = [5000, 15000, 30000, 60000];

export async function runScIndividuGenerateAction(personalRows, onProgress) {
  const results = [];
  for (let i = 0; i < personalRows.length; i++) {
    results.push(await generateSatuSc(personalRows[i]));
    onProgress?.(i + 1, personalRows.length);
    if (i < personalRows.length - 1) await sleep(600);
  }

  for (let pass = 0; pass < RETRY_PASS_DELAYS_MS.length; pass++) {
    const gagalTransient = results
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => !r.ok && isTransientGeminiError(r.error));
    if (gagalTransient.length === 0) break;

    // waiting:true dulu SEBELUM sleep -- UI (Upload.jsx) butuh tahu sedang menunggu jeda retry
    // karena Gemini overload (bukan macet), baru sesudah sleep dilaporkan sedang mencoba ulang.
    onProgress?.(personalRows.length, personalRows.length, { pass: pass + 1, ofPass: RETRY_PASS_DELAYS_MS.length, sisaGagal: gagalTransient.length, waiting: true });
    await sleep(RETRY_PASS_DELAYS_MS[pass]);
    for (const { i } of gagalTransient) {
      results[i] = await generateSatuSc(personalRows[i]);
      onProgress?.(personalRows.length, personalRows.length, { pass: pass + 1, ofPass: RETRY_PASS_DELAYS_MS.length, sisaGagal: gagalTransient.length, waiting: false });
      await sleep(600);
    }
  }
  return results;
}

/** Daftar laporan individu School Culture yang menunggu persetujuan -- padanan loadMiPendingAction. */
export async function loadScPendingAction() {
  const { data, error } = await supabase.functions.invoke('admin-actions', { body: { action: 'list-sc-pending' } });
  if (error) throw new Error(await edgeErrorDetail(error, 'Gagal memuat antrian School Culture.'));
  return data?.rows || [];
}

/** Setuju/tolak satu laporan SC. Kalau disetujui, admin-actions otomatis buat akun Karyawan
 * kalau belum ada; kalau BARU dibuat, balik {created:true, username, password} -- WAJIB
 * ditampilkan sekali ke admin (password tidak bisa diambil ulang setelah ini). */
export async function actScApproval(id, action) {
  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: { action: action === 'setuju' ? 'approve-sc' : 'reject-sc', id },
  });
  if (error) throw new Error(await edgeErrorDetail(error, 'Edge Function admin-actions gagal dipanggil.'));
  return data?.akun || null;
}

/** Pemulihan: laporan SC yang sudah tayang ('disetujui') tapi akun Karyawan-nya sempat gagal
 * dibuat diam-diam (mis. rate limit Supabase Auth saat approve banyak berurutan cepat -- lihat
 * catatan di ensureKaryawanScAccount, admin-actions/index.ts) tidak punya jalur "buat ulang" di
 * layar Persetujuan (baris yang sudah disetujui tidak lagi tampil di antrian menunggu). Action
 * ini memeriksa SEMUA laporan disetujui untuk satu (sekolah, periode) dan mencoba lagi bikin
 * akun untuk yang belum punya -- aman diklik berkali-kali. */
export async function retryScAccountsAction(sekolahId, periodeId) {
  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: { action: 'retry-sc-accounts', sekolah_id: sekolahId, periode_id: periodeId },
  });
  if (error) throw new Error(await edgeErrorDetail(error, 'Edge Function admin-actions gagal dipanggil.'));
  if (!data?.ok) throw new Error(data?.error || 'Gagal memeriksa akun Karyawan.');
  return data;
}

/** Fase C: simpan sunting manual draf sc_hasil (LaporanIndividuSC lengkap) sebelum approve. */
export async function updateScDraftAction(id, detail) {
  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: { action: 'edit-sc', id, detail },
  });
  if (error) throw new Error(await edgeErrorDetail(error, 'Edge Function admin-actions gagal dipanggil.'));
  if (data?.error) throw new Error(data.error);
  return data;
}

/** Fase C: regenerate satu laporan individu SC dengan catatan reviewer -- catatan tersimpan
 * permanen ke sc_feedback dan otomatis dipatuhi generate berikutnya untuk staf yang sama. */
export async function regenerateScIndividuAction(scPersonalId, catatan) {
  const { data, error } = await supabase.functions.invoke('generate-sc-individu', {
    body: { sc_personal_id: scPersonalId, catatan: catatan || '' },
  });
  if (error) throw new Error(await edgeErrorDetail(error, 'Edge Function generate-sc-individu gagal dipanggil.'));
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function triggerGeminiJobAction({ scope, scopeId, sekolahId, modul, tipe, periodeId, role }) {
  const { data, error } = await supabase.functions.invoke('generate-tindak-lanjut', {
    body: { scope, scope_id: scopeId, sekolah_id: sekolahId, modul, tipe, periode_id: periodeId, role },
  });
  if (error) throw new Error(await edgeErrorDetail(error, 'Edge Function generate-tindak-lanjut gagal dipanggil.'));
  return data;
}

export async function regenerateDraftAction({ id, catatan }) {
  const { data, error } = await supabase.functions.invoke('generate-tindak-lanjut', {
    body: { regenerate_of: id, catatan: catatan || '' },
  });
  if (error) throw new Error(await edgeErrorDetail(error, 'Edge Function generate-tindak-lanjut (regenerate) gagal dipanggil.'));
  return data;
}

export async function updateGeminiScheduleAction(patch) {
  const { error } = await supabase.functions.invoke('admin-actions', {
    body: { action: 'update-schedule', patch },
  });
  if (error) throw new Error(await edgeErrorDetail(error, 'Edge Function admin-actions gagal dipanggil.'));
}

export async function createUserAction({ nama, username, peran, schoolId, cakupan }) {
  const cakupanArr = cakupan ? cakupan.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: { nama, username, peran, school_id: schoolId, cakupan: cakupanArr },
  });
  if (error) throw new Error(error.message || 'Edge Function create-user gagal dipanggil.');
  return data;
}

export async function updateUserAction(userId, { nama, peran, schoolId, cakupan }) {
  const cakupanArr = cakupan ? cakupan.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const { error } = await supabase.functions.invoke('admin-actions', {
    body: { action: 'update-profile', userId, nama, peran, schoolId, cakupan: cakupanArr },
  });
  if (error) throw new Error(await edgeErrorDetail(error, 'Edge Function admin-actions gagal dipanggil.'));
}

export async function resetPasswordAction({ userId, username }) {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: { reset_user_id: userId, reset_username: username },
  });
  if (error) throw new Error(await edgeErrorDetail(error, 'Edge Function create-user (reset) gagal dipanggil.'));
  return data;
}

export async function bulkResetPasswordAction(users) {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: { reset_users: users.map((u) => ({ user_id: u.id, username: u.username })) },
  });
  if (error) throw new Error(await edgeErrorDetail(error, 'Edge Function create-user (bulk reset) gagal dipanggil.'));
  return data.results;
}

export async function deleteUserAction(userId) {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: { delete_user_id: userId },
  });
  if (error) throw new Error(error.message || 'Edge Function create-user (hapus) gagal dipanggil.');
  return data;
}

export async function bulkDeleteUsersAction(userIds) {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: { delete_user_ids: userIds },
  });
  if (error) throw new Error(error.message || 'Edge Function create-user (bulk hapus) gagal dipanggil.');
  return data.results;
}

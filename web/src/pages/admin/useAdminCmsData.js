import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { importKarakterWorkbook } from './importers/karakterImporter';

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
export function useAdminCmsData(session) {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  const fetchAll = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [
        yayasanRes, schoolsRes, modulesRes, summaryRes, aspekRes,
        briefingRes, tlRes, importLogRes, profilesRes,
        kelasSummaryRes, tlKelasAllRes, tlSekolahYayasanRes, scheduleRes,
      ] = await Promise.all([
        supabase.from('yayasan').select('id, nama'),
        supabase.from('schools').select('id, nama, yayasan_id, aktif'),
        supabase.from('school_modules').select('school_id, modul, aktif').eq('aktif', true),
        supabase.from('karakter_summary').select('sekolah_id, periode_id').eq('scope', 'sekolah'),
        supabase.from('karakter_aspek_config').select('sekolah_id, aspek_kode, aspek_label, urutan').order('urutan', { ascending: true }),
        supabase.from('briefing').select('id, sekolah_id, modul, scope, scope_id, periode_id, teks, sumber, status, created_at').eq('status', 'menunggu_persetujuan'),
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
      ]);

      const firstError = [yayasanRes, schoolsRes, modulesRes, summaryRes, aspekRes, briefingRes, tlRes, importLogRes, profilesRes, kelasSummaryRes, tlKelasAllRes, tlSekolahYayasanRes]
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
          jenjang: '—',
          modules,
          periode,
          gap: modules.includes('karakter') ? gapFor(periode) : 'none',
          pendingCount: pendingBySchool[s.id] || 0,
          err: errBySchool[s.id] || 0,
          aspekConfig: aspekBySchool[s.id] || [],
        };
      });

      const schoolNameById = Object.fromEntries(sekolah.map((s) => [s.id, s.nama]));

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
          rekomendasi.push({ sekolahId: r.sekolah_id, sekolahNama: schoolNameById[r.sekolah_id] || r.sekolah_id, kelasId: r.scope_id, periodeId: r.periode_id });
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
      const sekolahInfoById = Object.fromEntries(sekolah.map((s) => [s.id, s]));
      const rekomendasiSekolah = [];
      const rekomendasiYayasan = [];
      (summaryRes.data || []).forEach((r) => {
        const info = sekolahInfoById[r.sekolah_id];
        if (!info || !info.modules.includes('karakter')) return;
        if (!tlSekolahKeySet.has(`${r.sekolah_id}|${r.periode_id}|kepala_sekolah`)) {
          rekomendasiSekolah.push({ sekolahId: r.sekolah_id, sekolahNama: info.nama, periodeId: r.periode_id });
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

      const antrianTlAll = (tlRes.data || []).map((r) => ({
        id: r.id, tipe: 'tindak_lanjut', modul: r.modul, sekolah: r.sekolah_id,
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
        id: r.id, tipe: 'briefing', modul: r.modul, sekolah: r.sekolah_id,
        kelas: r.scope === 'kelas' ? r.scope_id : null, scope: r.scope,
        prioritas: 'sedang', status: r.status,
        dibuat: (r.created_at || '').replace('T', ' ').slice(0, 16),
        pemicu: Array.isArray(r.sumber) ? `Sumber: ${r.sumber.join(', ')}` : '', teks: r.teks || '', konteks: [],
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
          rekomendasi, rekomendasiSekolah, rekomendasiYayasan,
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
  const table = item.tipe === 'briefing' ? 'briefing' : 'tindak_lanjut';
  const status = action === 'setuju' ? 'disetujui' : 'ditolak';
  const patch = { status };
  if (item.tipe === 'briefing') patch.teks = item.teks;
  else {
    patch.action = item.teks;
    if (langkahTerpilih) patch.langkah_terpilih = langkahTerpilih; // array opsi terpilih (bisa semua)
  }
  const { error } = await supabase.from(table).update(patch).eq('id', item.id);
  if (error) throw new Error(error.message);

  // Penggantian mulus: begitu draf hasil regenerate disetujui, baris lama yang digantikannya
  // otomatis ditolak supaya tidak tayang ganda di laporan sekolah.
  if (action === 'setuju' && item.tipe !== 'briefing' && item.regenerateDari) {
    await supabase.from('tindak_lanjut').update({ status: 'ditolak' }).eq('id', item.regenerateDari);
  }
}

export async function toggleModuleAction(schoolId, modul, nextOn) {
  const { error } = await supabase
    .from('school_modules')
    .upsert({ school_id: schoolId, modul, aktif: nextOn }, { onConflict: 'school_id,modul' });
  if (error) throw new Error(error.message);
}

export async function addSchoolAction({ nama, jenjang, yayasanId, modules }) {
  const id = nama.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
  const { error: schoolErr } = await supabase.from('schools').insert({ id, nama, yayasan_id: yayasanId || null, aktif: true });
  if (schoolErr) throw new Error(schoolErr.message);
  if (modules.length > 0) {
    const { error: modErr } = await supabase.from('school_modules').insert(
      modules.map((m) => ({ school_id: id, modul: m, aktif: true }))
    );
    if (modErr) throw new Error(modErr.message);
  }
  return id;
}

export async function runImportAction({ sekolahId, modul, fileName, parsed }) {
  const periodeId = parsed?.preview?.periodeDetected?.map((p) => p.periode).join(',') || null;
  if (modul !== 'karakter') {
    await supabase.from('import_log').insert({
      sekolah_id: sekolahId, modul, periode_id: periodeId, rows: 0, status: 'gagal',
      pesan: 'Importer modul ini belum tersedia.', oleh: fileName || 'admin',
    });
    throw new Error('Importer untuk modul ini belum tersedia.');
  }
  const result = await importKarakterWorkbook(parsed);
  await supabase.from('import_log').insert({
    sekolah_id: sekolahId, modul, periode_id: periodeId,
    rows: result.rowsWritten, status: result.ok ? 'sukses' : 'gagal',
    pesan: result.ok ? null : result.error, oleh: fileName || 'admin',
  });
  if (!result.ok) throw new Error(result.error);
  return result;
}

/**
 * Ambil pesan error ASLI dari body respons Edge Function. supabase.functions.invoke cuma
 * kasih pesan generik "non-2xx status code"; error sebenarnya (mis. kolom belum ada,
 * Gemini balas JSON tak valid) ada di body JSON {error: "..."} yang tersimpan di
 * error.context (sebuah Response). Baca itu supaya toast menampilkan penyebab nyata.
 */
async function edgeErrorDetail(error, fallback) {
  try {
    const ctx = error?.context;
    if (ctx && typeof ctx.json === 'function') {
      const body = await ctx.json();
      if (body?.error) return body.error;
    } else if (ctx && typeof ctx.text === 'function') {
      const t = await ctx.text();
      if (t) return t;
    }
  } catch { /* body tidak bisa dibaca, pakai fallback */ }
  return error?.message || fallback;
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
  const { error } = await supabase.from('gemini_schedule').update(patch).eq('id', 'default');
  if (error) throw new Error(error.message);
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
  const { error } = await supabase.from('profiles').update({
    nama, peran, school_id: schoolId || null,
    cakupan: cakupanArr.length > 0 ? cakupanArr : null,
  }).eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function resetPasswordAction({ userId, username }) {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: { reset_user_id: userId, reset_username: username },
  });
  if (error) throw new Error(error.message || 'Edge Function create-user (reset) gagal dipanggil.');
  return data;
}

export async function bulkResetPasswordAction(users) {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: { reset_users: users.map((u) => ({ user_id: u.id, username: u.username })) },
  });
  if (error) throw new Error(error.message || 'Edge Function create-user (bulk reset) gagal dipanggil.');
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

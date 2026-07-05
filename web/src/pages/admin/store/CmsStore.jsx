import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useAdminCmsData, actApprovalAction, toggleModuleAction, addSchoolAction, runImportAction, triggerGeminiJobAction, createUserAction, updateUserAction, resetPasswordAction, bulkResetPasswordAction, deleteUserAction, bulkDeleteUsersAction, updateGeminiScheduleAction, regenerateDraftAction } from '../useAdminCmsData';
import { bulkCreateUsers as bulkCreateUsersAction } from '../importers/guruImporter';
import { downloadCsv } from '../data/helpers';

const CmsContext = createContext(null);

const initialState = {
  screen: 'dashboard',
  selectedApproval: null,
  approvalFilter: { modul: 'all', prioritas: 'all', sekolah: 'all' },
  sekolahFilter: 'all',
  userFilter: 'all',
  approvalEditText: {},
  toast: null,
  addUserOpen: false,
  addSchoolOpen: false,
  editUserTarget: null,
};

export function CmsProvider({ session, children }) {
  const { data, loading, error, refetch } = useAdminCmsData(session);
  const [state, setState] = useState(initialState);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, kind = 'safe', durationMs = 2600) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setState((s) => ({ ...s, toast: { msg, kind } }));
    toastTimer.current = setTimeout(() => setState((s) => ({ ...s, toast: null })), durationMs);
  }, []);

  const actApproval = useCallback(async (id, action, langkahTerpilih) => {
    const item = data?.antrian.find((a) => a.id === id);
    if (!item) return;
    // Quick-approve dari kartu (tanpa buka drawer): default simpan SEMUA opsi.
    if (action === 'setuju' && !langkahTerpilih && Array.isArray(item.opsiKandidat) && item.opsiKandidat.length > 0) {
      langkahTerpilih = item.opsiKandidat;
    }
    const edited = state.approvalEditText[id];
    const payload = edited != null ? { ...item, teks: edited } : item;
    try {
      await actApprovalAction(payload, action, langkahTerpilih);
      setState((s) => ({ ...s, selectedApproval: null }));
      showToast('Draf ' + (action === 'setuju' ? 'disetujui & tayang' : 'ditolak'), action === 'tolak' ? 'alert' : 'safe');
      refetch();
    } catch (e) {
      showToast('Gagal: ' + e.message, 'alert');
    }
  }, [data, state.approvalEditText, showToast, refetch]);

  const toggleModule = useCallback(async (schoolId, modul, currentlyOn) => {
    try {
      await toggleModuleAction(schoolId, modul, !currentlyOn);
      showToast('Modul ' + modul + ' ' + (currentlyOn ? 'dimatikan' : 'diaktifkan') + ' untuk ' + schoolId, 'safe');
      refetch();
    } catch (e) {
      showToast('Gagal ubah modul: ' + e.message, 'alert');
    }
  }, [showToast, refetch]);

  const isModuleOn = useCallback((school, modul) => school.modules.includes(modul), []);

  const addSchool = useCallback(async (payload) => {
    try {
      const id = await addSchoolAction(payload);
      showToast(`Sekolah ${id} terdaftar · school_modules disiapkan`, 'safe');
      refetch();
    } catch (e) {
      showToast('Gagal tambah sekolah: ' + e.message, 'alert');
    }
  }, [showToast, refetch]);

  const runImport = useCallback(async (payload) => {
    try {
      const result = await runImportAction(payload);
      showToast(`${result.rowsWritten} baris berhasil di-import`, 'safe');
      refetch();
    } catch (e) {
      showToast('Import gagal: ' + e.message, 'alert');
      refetch();
    }
  }, [showToast, refetch]);

  const triggerGeminiJob = useCallback(async (payload) => {
    try {
      await triggerGeminiJobAction(payload);
      showToast('Draf baru dibuat · menunggu tinjauan di Antrian Persetujuan', 'safe');
      refetch();
    } catch (e) {
      showToast('Gemini gagal: ' + e.message, 'alert');
    }
  }, [showToast, refetch]);

  const createUser = useCallback(async (payload) => {
    try {
      const result = await createUserAction(payload);
      // Belum ada pengiriman email/WA otomatis — tampilkan lebih lama supaya admin sempat salin manual.
      showToast(`Akun ${result.username} dibuat · kode: ${result.password}`, 'safe', 12000);
      refetch();
    } catch (e) {
      showToast('Gagal buat akun: ' + e.message, 'alert');
    }
  }, [showToast, refetch]);

  const bulkCreateUsers = useCallback(async (rows, sekolahId) => {
    const results = await bulkCreateUsersAction(rows, { sekolahId });
    const ok = results.filter((r) => r.ok);
    const failed = results.filter((r) => !r.ok);
    if (failed.length === 0) {
      showToast(`${ok.length} akun dibuat. Kode masing-masing tersimpan di riwayat hasil.`, 'safe', 6000);
    } else {
      showToast(`${ok.length} akun dibuat, ${failed.length} gagal — lihat detail di dialog.`, 'warn', 8000);
    }
    refetch();
    return results;
  }, [showToast, refetch]);

  const resetPassword = useCallback(async (userId, username) => {
    try {
      const result = await resetPasswordAction({ userId, username });
      showToast(`Kode baru untuk ${result.username}: ${result.password}`, 'safe', 12000);
      return result;
    } catch (e) {
      showToast('Gagal reset password: ' + e.message, 'alert');
      return null;
    }
  }, [showToast]);

  const deleteUser = useCallback(async (userId, nama) => {
    try {
      await deleteUserAction(userId);
      showToast(`Akun ${nama || userId} dihapus.`, 'safe');
      refetch();
      return true;
    } catch (e) {
      showToast('Gagal hapus akun: ' + e.message, 'alert');
      return false;
    }
  }, [showToast, refetch]);

  const bulkDeleteUsers = useCallback(async (users) => {
    try {
      const results = await bulkDeleteUsersAction(users.map((u) => u.id));
      const ok = results.filter((r) => r.ok);
      const failed = results.filter((r) => !r.ok);
      showToast(
        failed.length === 0
          ? `${ok.length} akun dihapus.`
          : `${ok.length} berhasil dihapus, ${failed.length} gagal (${failed.map((f) => f.error).join('; ')}).`,
        failed.length === 0 ? 'safe' : 'warn', 8000,
      );
      refetch();
      return results;
    } catch (e) {
      showToast('Gagal hapus akun: ' + e.message, 'alert');
      return null;
    }
  }, [showToast, refetch]);

  const updateUser = useCallback(async (userId, payload) => {
    try {
      await updateUserAction(userId, payload);
      showToast('Data pengguna diperbarui.', 'safe');
      setState((s) => ({ ...s, editUserTarget: null }));
      refetch();
      return true;
    } catch (e) {
      showToast('Gagal ubah pengguna: ' + e.message, 'alert');
      return false;
    }
  }, [showToast, refetch]);

  const regenerateDraft = useCallback(async (id, catatan) => {
    try {
      await regenerateDraftAction({ id, catatan });
      setState((s) => ({ ...s, selectedApproval: null }));
      showToast('Draf baru dibuat dengan catatanmu · cek Antrian Persetujuan', 'safe', 5000);
      refetch();
      return true;
    } catch (e) {
      showToast('Regenerate gagal: ' + e.message, 'alert');
      return false;
    }
  }, [showToast, refetch]);

  const updateGeminiSchedule = useCallback(async (patch) => {
    try {
      await updateGeminiScheduleAction(patch);
      showToast('Jadwal otomatis diperbarui.', 'safe');
      refetch();
    } catch (e) {
      showToast('Gagal ubah jadwal: ' + e.message, 'alert');
    }
  }, [showToast, refetch]);

  const bulkResetAndExport = useCallback(async (users) => {
    try {
      const results = await bulkResetPasswordAction(users);
      const ok = results.filter((r) => r.ok);
      const failed = results.filter((r) => !r.ok);
      const byUsername = Object.fromEntries(ok.map((r) => [r.username, r.password]));
      downloadCsv('kode-khusus-fammi.csv', users.map((u) => ({
        nama: u.nama, username: u.username, peran: u.peran, sekolah: u.sekolah || '',
        kode_khusus: byUsername[u.username] || 'GAGAL',
      })));
      showToast(
        failed.length === 0
          ? `${ok.length} kode direset & file CSV terunduh. Kode lama langsung tidak berlaku.`
          : `${ok.length} berhasil, ${failed.length} gagal. File CSV terunduh untuk yang berhasil.`,
        failed.length === 0 ? 'safe' : 'warn', 8000,
      );
      refetch();
      return results;
    } catch (e) {
      showToast('Gagal reset & export: ' + e.message, 'alert');
      return null;
    }
  }, [showToast, refetch]);

  const value = useMemo(() => ({
    session,
    data: data || { yayasan: [], sekolah: [], antrian: [], riwayatDisetujui: [], uploadHistory: [], geminiJobs: [], users: [], rekomendasi: [], rekomendasiSekolah: [], rekomendasiYayasan: [], geminiSchedule: { aktif: false, interval_jam: 6, terakhir_jalan: null } },
    loading,
    error,
    refetch,
    state,
    setScreen: (screen) => setState((s) => ({ ...s, screen, selectedApproval: null })),
    setSelectedApproval: (selectedApproval) => setState((s) => ({ ...s, selectedApproval })),
    setApprovalFilter: (f) => setState((s) => ({ ...s, approvalFilter: { ...s.approvalFilter, ...f } })),
    setSekolahFilter: (sekolahFilter) => setState((s) => ({ ...s, sekolahFilter })),
    setUserFilter: (userFilter) => setState((s) => ({ ...s, userFilter })),
    setAddUserOpen: (addUserOpen) => setState((s) => ({ ...s, addUserOpen })),
    setAddSchoolOpen: (addSchoolOpen) => setState((s) => ({ ...s, addSchoolOpen })),
    setEditUserTarget: (editUserTarget) => setState((s) => ({ ...s, editUserTarget })),
    showToast,
    actApproval,
    toggleModule,
    isModuleOn,
    addSchool,
    runImport,
    triggerGeminiJob,
    createUser,
    updateUser,
    bulkCreateUsers,
    resetPassword,
    bulkResetAndExport,
    deleteUser,
    bulkDeleteUsers,
    updateGeminiSchedule,
    regenerateDraft,
    setApprovalEditText: (id, text) => setState((s) => ({ ...s, approvalEditText: { ...s.approvalEditText, [id]: text } })),
    resetApprovalEditText: (id) => setState((s) => {
      const n = { ...s.approvalEditText };
      delete n[id];
      return { ...s, approvalEditText: n };
    }),
  }), [session, data, loading, error, refetch, state, showToast, actApproval, toggleModule, isModuleOn, addSchool, runImport, triggerGeminiJob, createUser, updateUser, bulkCreateUsers, resetPassword, bulkResetAndExport, deleteUser, bulkDeleteUsers, updateGeminiSchedule, regenerateDraft]);

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
}

export function useCms() {
  const ctx = useContext(CmsContext);
  if (!ctx) throw new Error('useCms must be used within CmsProvider');
  return ctx;
}

import { useCallback, useEffect, useState } from 'react';
import { useCms } from '../store/CmsStore';
import { LoadingCards } from '../components/LoadingCards';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { ScDetailDrawer } from '../components/ScDetailDrawer';
import { moduleColor } from '../data/helpers';
import { loadScPendingAction, actScApproval, updateScDraftAction, regenerateScIndividuAction } from '../useAdminCmsData';
import { periodeLabel } from '../../karakter/karakterMeta';

// Persetujuan laporan individu School Culture. Pola identik PersetujuanMi.jsx: sc_hasil
// bentuknya per staf responden, bukan kartu tindak lanjut agregat (itu tetap lewat Antrian,
// modul='sc', karena tindak_lanjut/briefing generik dipakai bareng Karakter). Data ditarik
// lewat admin-actions (service_role) supaya RLS sc_hasil tetap cuma membuka baris 'disetujui'
// ke jalur baca staf/pimpinan.
export function PersetujuanSc() {
  const { data, showToast } = useCms();
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const [busyId, setBusyId] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null); // {done, total}
  const [akunBaru, setAkunBaru] = useState([]); // {username, password} dari sesi approve terakhir

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const rows = await loadScPendingAction();
      setState({ loading: false, error: null, rows });
    } catch (e) {
      setState({ loading: false, error: e.message || String(e), rows: [] });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const schoolNameById = Object.fromEntries((data.sekolah || []).map((s) => [s.id, s.nama]));

  async function saveDraft(id, detail) {
    try {
      await updateScDraftAction(id, detail);
      setState((s) => ({ ...s, rows: s.rows.map((r) => (r.id === id ? { ...r, detail } : r)) }));
      showToast('Perubahan draf SC disimpan.', 'safe');
    } catch (e) {
      showToast('Gagal simpan: ' + e.message, 'alert');
      throw e;
    }
  }

  async function regenerateDraft(scPersonalId, catatan) {
    try {
      await regenerateScIndividuAction(scPersonalId, catatan);
      showToast('Draf baru dibuat dengan catatanmu.', 'safe', 5000);
      setDetailRow(null);
      load();
    } catch (e) {
      showToast('Regenerate gagal: ' + e.message, 'alert');
      throw e;
    }
  }

  async function act(id, action) {
    setBusyId(id);
    try {
      const akun = await actScApproval(id, action);
      if (action === 'setuju' && akun?.created) {
        showToast(`Laporan SC disetujui & tayang · akun Karyawan dibuat: ${akun.username} / ${akun.password}`, 'safe', 15000);
        setAkunBaru((s) => [...s, { username: akun.username, password: akun.password }]);
      } else {
        showToast(action === 'setuju' ? 'Laporan SC disetujui & tayang.' : 'Laporan SC ditolak.', action === 'setuju' ? 'safe' : 'alert');
      }
      setState((s) => ({ ...s, rows: s.rows.filter((r) => r.id !== id) }));
      if (detailRow?.id === id) setDetailRow(null);
    } catch (e) {
      showToast('Gagal: ' + e.message, 'alert');
    } finally {
      setBusyId(null);
    }
  }

  // Setujui semua baris yang sedang menunggu, satu per satu (bukan Promise.all) -- tiap approve
  // memicu ensureKaryawanScAccount (admin-actions), lebih aman diproses berurutan daripada
  // menembak banyak createUser bersamaan. Kegagalan satu baris tidak menghentikan sisanya.
  async function setujuiSemua() {
    const targets = [...state.rows];
    if (targets.length === 0) return;
    if (!window.confirm(`Setujui ${targets.length} laporan School Culture sekaligus? Semuanya langsung tayang ke staf, dan akun Karyawan baru akan dibuat untuk responden yang belum punya akun.`)) return;

    setBulkBusy(true);
    setBulkProgress({ done: 0, total: targets.length });
    let okCount = 0;
    const failed = [];
    const akunSesiIni = [];
    for (let i = 0; i < targets.length; i++) {
      const r = targets[i];
      try {
        const akun = await actScApproval(r.id, 'setuju');
        okCount++;
        if (akun?.created) akunSesiIni.push({ username: akun.username, password: akun.password });
        setState((s) => ({ ...s, rows: s.rows.filter((x) => x.id !== r.id) }));
      } catch (e) {
        failed.push({ nama: r.nama_responden || r.sc_personal_id, error: e.message || String(e) });
      }
      setBulkProgress({ done: i + 1, total: targets.length });
    }
    setBulkBusy(false);
    setBulkProgress(null);
    if (akunSesiIni.length > 0) setAkunBaru((s) => [...s, ...akunSesiIni]);
    showToast(
      failed.length === 0
        ? `${okCount} laporan SC disetujui & tayang.`
        : `${okCount} berhasil disetujui, ${failed.length} gagal (${failed.map((f) => f.nama).join(', ')}).`,
      failed.length === 0 ? 'safe' : 'warn', 8000,
    );
  }

  if (state.loading) return <LoadingCards rows={5} />;
  if (state.error) return <ErrorState title="Gagal memuat antrian School Culture" desc={state.error} cta="Muat ulang" onCta={load} />;

  const mc = moduleColor('sc');

  return (
    <div style={{ padding: '22px 26px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Persetujuan School Culture</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>Laporan individu SC hasil generate Gemini yang menunggu ditinjau. Setelah disetujui, tayang ke staf yang bersangkutan.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={load} disabled={bulkBusy}>Refresh</button>
          {state.rows.length > 0 && (
            <button className="btn-primary" style={{ fontSize: 12.5, background: 'var(--status-safe)' }} onClick={setujuiSemua} disabled={bulkBusy}>
              {bulkBusy ? `Menyetujui… (${bulkProgress?.done ?? 0}/${bulkProgress?.total ?? 0})` : `✓ Setujui semua (${state.rows.length})`}
            </button>
          )}
        </div>
      </div>

      {akunBaru.length > 0 && (
        <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--info-soft)', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--info)' }}>💡 {akunBaru.length} akun Karyawan baru dibuat sesi ini · kode cuma tampil sekali</div>
            <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setAkunBaru([])}>Tutup</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {akunBaru.map((a, i) => (
              <div key={i} className="mono" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{a.username} / {a.password}</div>
            ))}
          </div>
        </div>
      )}

      {state.rows.length === 0 ? (
        <EmptyState title="Tidak ada laporan School Culture menunggu" desc="Laporan SC yang digenerate lewat generate-sc-individu muncul di sini untuk ditinjau." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {state.rows.map((r) => {
            const busy = busyId === r.id || bulkBusy;
            return (
              <div key={r.id} className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="pill" style={{ background: mc.bg, color: mc.ink }}>SC</span>
                  {r.peran_kerja && <span className="pill" style={{ background: 'var(--purple-050)', color: 'var(--purple-700)' }}>{r.peran_kerja}</span>}
                  {Array.isArray(r.qc_flags) && r.qc_flags.length > 0 && (
                    <span className="pill" style={{ background: 'var(--status-warn-bg)', color: 'var(--status-warn)' }} title={r.qc_flags.map((f) => f.issue).join(', ')}>
                      ⚠ QC {r.qc_flags.length}
                    </span>
                  )}
                  <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-4)' }}>{String(r.id).slice(0, 8)}</span>
                </div>
                <div
                  style={{ cursor: 'pointer' }}
                  onClick={() => setDetailRow(r)}
                  title="Lihat gambaran lengkap laporan"
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{r.nama_responden || r.sc_personal_id}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                    {(schoolNameById[r.sekolah_id] || r.sekolah_id)}{r.unit ? ` · ${r.unit}` : ''} · {periodeLabel(r.periode_id) || r.periode_id}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 2, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                  <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11.5 }} disabled={busy} onClick={() => setDetailRow(r)}>👁 Detail</button>
                  <div style={{ flex: 1 }} />
                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 11.5 }} disabled={busy} onClick={() => act(r.id, 'tolak')}>Tolak</button>
                  <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 11.5, background: 'var(--status-safe)' }} disabled={busy} onClick={() => act(r.id, 'setuju')}>{busyId === r.id ? '…' : 'Setujui'}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ScDetailDrawer row={detailRow} onClose={() => setDetailRow(null)} onSave={saveDraft} onRegenerate={regenerateDraft} />
    </div>
  );
}

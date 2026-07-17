import { useCallback, useEffect, useState } from 'react';
import { useCms } from '../store/CmsStore';
import { LoadingCards } from '../components/LoadingCards';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { MiDetailDrawer } from '../components/MiDetailDrawer';
import { moduleColor } from '../data/helpers';
import { loadMiPendingAction, actMiApproval } from '../useAdminCmsData';
import { periodeLabel } from '../../karakter/karakterMeta';

// Persetujuan laporan MI. Terpisah dari Antrian (tindak_lanjut/briefing) karena mi_hasil
// bentuknya per siswa, bukan kartu tindak lanjut. Data ditarik lewat admin-actions
// (service_role) supaya RLS mi_hasil tetap cuma membuka baris 'disetujui' ke jalur baca FIR.
export function PersetujuanMi() {
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
      const rows = await loadMiPendingAction();
      setState({ loading: false, error: null, rows });
    } catch (e) {
      setState({ loading: false, error: e.message || String(e), rows: [] });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const schoolNameById = Object.fromEntries((data.sekolah || []).map((s) => [s.id, s.nama]));

  async function act(id, action) {
    setBusyId(id);
    try {
      const akun = await actMiApproval(id, action);
      if (action === 'setuju' && akun?.created) {
        showToast(`Laporan MI disetujui & tayang · akun orang tua dibuat: ${akun.username} / ${akun.password}`, 'safe', 15000);
        setAkunBaru((s) => [...s, { username: akun.username, password: akun.password }]);
      } else {
        showToast(action === 'setuju' ? 'Laporan MI disetujui & tayang.' : 'Laporan MI ditolak.', action === 'setuju' ? 'safe' : 'alert');
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
  // memicu ensureOrangTuaAccount (admin-actions) yang bikin auth user, lebih aman diproses
  // berurutan daripada menembak banyak createUser bersamaan. Kegagalan satu baris tidak
  // menghentikan sisanya, hasilnya dirangkum di akhir.
  async function setujuiSemua() {
    const targets = [...state.rows];
    if (targets.length === 0) return;
    if (!window.confirm(`Setujui ${targets.length} laporan MI sekaligus? Semuanya langsung tayang ke siswa/orang tua, dan akun orang tua baru akan dibuat untuk siswa yang belum punya akun.`)) return;

    setBulkBusy(true);
    setBulkProgress({ done: 0, total: targets.length });
    let okCount = 0;
    const failed = [];
    const akunSesiIni = [];
    for (let i = 0; i < targets.length; i++) {
      const r = targets[i];
      try {
        const akun = await actMiApproval(r.id, 'setuju');
        okCount++;
        if (akun?.created) akunSesiIni.push({ username: akun.username, password: akun.password });
        setState((s) => ({ ...s, rows: s.rows.filter((x) => x.id !== r.id) }));
      } catch (e) {
        failed.push({ nama: r.nama_siswa || r.murid_id, error: e.message || String(e) });
      }
      setBulkProgress({ done: i + 1, total: targets.length });
    }
    setBulkBusy(false);
    setBulkProgress(null);
    if (akunSesiIni.length > 0) setAkunBaru((s) => [...s, ...akunSesiIni]);
    showToast(
      failed.length === 0
        ? `${okCount} laporan MI disetujui & tayang.`
        : `${okCount} berhasil disetujui, ${failed.length} gagal (${failed.map((f) => f.nama).join(', ')}).`,
      failed.length === 0 ? 'safe' : 'warn', 8000,
    );
  }

  if (state.loading) return <LoadingCards rows={5} />;
  if (state.error) return <ErrorState title="Gagal memuat antrian MI" desc={state.error} cta="Muat ulang" onCta={load} />;

  const mc = moduleColor('mi');

  return (
    <div style={{ padding: '22px 26px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Persetujuan MI</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>Laporan MI hasil generate Gemini yang menunggu ditinjau. Setelah disetujui, tayang ke siswa dan orang tua.</div>
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
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--info)' }}>💡 {akunBaru.length} akun orang tua baru dibuat sesi ini · kode cuma tampil sekali</div>
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
        <EmptyState title="Tidak ada laporan MI menunggu" desc="Laporan MI yang digenerate dari layar Upload Data (modul MI) muncul di sini untuk ditinjau." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {state.rows.map((r) => {
            const busy = busyId === r.id || bulkBusy;
            return (
              <div key={r.id} className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="pill" style={{ background: mc.bg, color: mc.ink }}>MI</span>
                  {r.top_1 && <span className="pill" style={{ background: 'var(--purple-050)', color: 'var(--purple-700)' }}>Dominan: {r.top_1}</span>}
                  <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-4)' }}>{String(r.id).slice(0, 8)}</span>
                </div>
                <div
                  style={{ cursor: 'pointer' }}
                  onClick={() => setDetailRow(r)}
                  title="Lihat gambaran lengkap laporan"
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{r.nama_siswa || r.murid_id}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                    {(schoolNameById[r.sekolah_id] || r.sekolah_id)}{r.kelas_id ? ` · ${r.kelas_id}` : ''} · {periodeLabel(r.periode_id) || r.periode_id}
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

      <MiDetailDrawer row={detailRow} onClose={() => setDetailRow(null)} />
    </div>
  );
}

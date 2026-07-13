import { useCallback, useEffect, useState } from 'react';
import { useCms } from '../store/CmsStore';
import { LoadingCards } from '../components/LoadingCards';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
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
      await actMiApproval(id, action);
      showToast(action === 'setuju' ? 'Laporan MI disetujui & tayang.' : 'Laporan MI ditolak.', action === 'setuju' ? 'safe' : 'alert');
      setState((s) => ({ ...s, rows: s.rows.filter((r) => r.id !== id) }));
    } catch (e) {
      showToast('Gagal: ' + e.message, 'alert');
    } finally {
      setBusyId(null);
    }
  }

  if (state.loading) return <LoadingCards rows={5} />;
  if (state.error) return <ErrorState title="Gagal memuat antrian MI" desc={state.error} cta="Muat ulang" onCta={load} />;

  const mc = moduleColor('mi');

  return (
    <div style={{ padding: '22px 26px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Persetujuan MI</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>Laporan MI hasil generate Gemini yang menunggu ditinjau. Setelah disetujui, tayang ke siswa dan orang tua.</div>
        </div>
        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={load}>Refresh</button>
      </div>

      {state.rows.length === 0 ? (
        <EmptyState title="Tidak ada laporan MI menunggu" desc="Laporan MI yang digenerate dari layar Upload Data (modul MI) muncul di sini untuk ditinjau." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {state.rows.map((r) => {
            const busy = busyId === r.id;
            return (
              <div key={r.id} className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="pill" style={{ background: mc.bg, color: mc.ink }}>MI</span>
                  {r.top_1 && <span className="pill" style={{ background: 'var(--purple-050)', color: 'var(--purple-700)' }}>Dominan: {r.top_1}</span>}
                  <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-4)' }}>{String(r.id).slice(0, 8)}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{r.nama_siswa || r.murid_id}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  {(schoolNameById[r.sekolah_id] || r.sekolah_id)}{r.kelas_id ? ` · ${r.kelas_id}` : ''} · {periodeLabel(r.periode_id) || r.periode_id}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 2, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 11.5 }} disabled={busy} onClick={() => act(r.id, 'tolak')}>Tolak</button>
                  <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 11.5, background: 'var(--status-safe)' }} disabled={busy} onClick={() => act(r.id, 'setuju')}>{busy ? '…' : 'Setujui'}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

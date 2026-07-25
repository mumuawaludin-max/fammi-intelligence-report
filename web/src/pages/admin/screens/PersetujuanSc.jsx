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
  const { data, showToast, retryScAccounts } = useCms();
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const [busyId, setBusyId] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null); // {done, total}
  const [akunBaru, setAkunBaru] = useState([]); // {username, password} dari sesi approve terakhir
  // {nama, error} -- akun Karyawan yang gagal dibuat SEBELUMNYA dibuang diam-diam (cuma
  // akun?.created yang dicek), laporan tetap tayang tapi stafnya tidak pernah bisa login tanpa
  // admin sadar. Ditampilkan terpisah dari akunBaru supaya kelihatan jelas butuh tindak lanjut.
  const [akunGagal, setAkunGagal] = useState([]);
  const [retryBusyKey, setRetryBusyKey] = useState(null); // "sekolahId|periodeId" sedang diproses

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

  async function act(row, action) {
    const id = row.id;
    setBusyId(id);
    try {
      const akun = await actScApproval(id, action);
      if (action === 'setuju' && akun?.created) {
        showToast(`Laporan SC disetujui & tayang · akun Karyawan dibuat: ${akun.username} / ${akun.password}`, 'safe', 15000);
        setAkunBaru((s) => [...s, { username: akun.username, password: akun.password }]);
      } else if (action === 'setuju' && akun && !akun.existing && akun.error) {
        // Laporan TETAP tayang (approve-nya sendiri berhasil), tapi akun Karyawan gagal dibuat --
        // SEBELUMNYA dibuang diam-diam. Tampilkan sebagai peringatan terpisah, bukan error approve.
        showToast(`Laporan SC disetujui & tayang, TAPI akun Karyawan gagal dibuat: ${akun.error}`, 'warn', 12000);
        setAkunGagal((s) => [...s, { nama: row.nama_responden || row.sc_personal_id, error: akun.error, sekolahId: row.sekolah_id, periodeId: row.periode_id }]);
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
    // akunGagalSesiIni DIPISAH dari `failed` -- laporan tetap tayang meski akunnya gagal dibuat,
    // jadi ini bukan kegagalan approve. Ditemukan lewat kejadian nyata: 16 laporan disetujui,
    // cuma 11 akun jadi, 5 sisanya dibuang diam-diam tanpa jejak sama sekali.
    const akunGagalSesiIni = [];
    for (let i = 0; i < targets.length; i++) {
      const r = targets[i];
      // Jeda kecil ANTAR approve -- tiap approve memicu createUser lewat Supabase Auth admin
      // API, menembak beruntun tanpa jeda diduga jadi penyebab kegagalan diam-diam itu. 700ms
      // (naik dari 400ms) -- rombongan 16 responden masih sempat kena rate limit dengan 400ms,
      // ensureKaryawanScAccount sekarang juga retry-with-backoff sendiri kalau tetap kena.
      if (i > 0) await new Promise((resolve) => setTimeout(resolve, 700));
      try {
        const akun = await actScApproval(r.id, 'setuju');
        okCount++;
        if (akun?.created) akunSesiIni.push({ username: akun.username, password: akun.password });
        else if (akun && !akun.existing) akunGagalSesiIni.push({ nama: r.nama_responden || r.sc_personal_id, error: akun.error || 'Gagal tanpa keterangan.', sekolahId: r.sekolah_id, periodeId: r.periode_id });
        setState((s) => ({ ...s, rows: s.rows.filter((x) => x.id !== r.id) }));
      } catch (e) {
        failed.push({ nama: r.nama_responden || r.sc_personal_id, error: e.message || String(e) });
      }
      setBulkProgress({ done: i + 1, total: targets.length });
    }
    setBulkBusy(false);
    setBulkProgress(null);
    if (akunSesiIni.length > 0) setAkunBaru((s) => [...s, ...akunSesiIni]);
    if (akunGagalSesiIni.length > 0) setAkunGagal((s) => [...s, ...akunGagalSesiIni]);
    const bagianPesan = [];
    if (failed.length > 0) bagianPesan.push(`${failed.length} gagal disetujui (${failed.map((f) => f.nama).join(', ')})`);
    if (akunGagalSesiIni.length > 0) bagianPesan.push(`${akunGagalSesiIni.length} akun Karyawan gagal dibuat, tayang tanpa akun (lihat di bawah)`);
    showToast(
      bagianPesan.length === 0 ? `${okCount} laporan SC disetujui & tayang.` : `${okCount} disetujui. ${bagianPesan.join('. ')}.`,
      bagianPesan.length === 0 ? 'safe' : 'warn', 10000,
    );
  }

  // Pemulihan per kelompok (sekolah, periode) -- laporan yang tercantum di akunGagal sudah
  // tayang, tombol ini cuma mencoba lagi bikin akunnya. Aman diklik berkali-kali.
  async function handleRetryAkunGrup(sekolahId, periodeId) {
    const key = `${sekolahId}|${periodeId}`;
    setRetryBusyKey(key);
    try {
      const result = await retryScAccounts(sekolahId, periodeId);
      setAkunGagal((s) => s.filter((f) => !(f.sekolahId === sekolahId && f.periodeId === periodeId)));
      if (result.akunBaru.length > 0) setAkunBaru((s) => [...s, ...result.akunBaru]);
      if (result.gagal.length > 0) {
        setAkunGagal((s) => [...s, ...result.gagal.map((f) => ({ ...f, sekolahId, periodeId }))]);
      }
    } catch (e) {
      showToast('Gagal memeriksa ulang akun: ' + e.message, 'alert');
    } finally {
      setRetryBusyKey(null);
    }
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

      {akunGagal.length > 0 && (() => {
        const grup = new Map();
        akunGagal.forEach((f) => {
          const key = `${f.sekolahId}|${f.periodeId}`;
          if (!grup.has(key)) grup.set(key, { sekolahId: f.sekolahId, periodeId: f.periodeId, items: [] });
          grup.get(key).items.push(f);
        });
        return (
          <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--status-warn-bg)', borderRadius: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--status-warn)', marginBottom: 8 }}>
              ⚠ {akunGagal.length} laporan tayang tapi akun Karyawan-nya BELUM jadi
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...grup.values()].map((g) => {
                const key = `${g.sekolahId}|${g.periodeId}`;
                const busy = retryBusyKey === key;
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink)' }}>
                      {schoolNameById[g.sekolahId] || g.sekolahId} · {periodeLabel(g.periodeId) || g.periodeId}
                    </div>
                    {g.items.map((f, i) => (
                      <div key={i} style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{f.nama}: {f.error}</div>
                    ))}
                    <button className="btn-secondary" style={{ alignSelf: 'flex-start', marginTop: 2 }} disabled={busy} onClick={() => handleRetryAkunGrup(g.sekolahId, g.periodeId)}>
                      {busy ? 'Mencoba lagi…' : '🔁 Coba lagi buat akun yang gagal'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

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
                  {r.sumber === 'excel' && (
                    <span className="pill" style={{ background: 'var(--status-safe-bg)', color: 'var(--status-safe)' }} title="Laporan ini datang siap pakai dari kolom laporan_json di file Excel, bukan dirumuskan Gemini saat generate. Tetap wajib ditinjau seperti biasa sebelum disetujui.">
                      📄 Dari Excel
                    </span>
                  )}
                  {Array.isArray(r.qc_flags) && r.qc_flags.length > 0 && (
                    <span className="pill" style={{ background: 'var(--status-warn-bg)', color: 'var(--status-warn)' }} title={r.qc_flags.map((f) => f.issue).join(', ')}>
                      ⚠ QC {r.qc_flags.length}
                    </span>
                  )}
                  {r.bersedia === false && (
                    <span className="pill" style={{ background: 'var(--status-warn-bg)', color: 'var(--status-warn)' }} title="Staf ini menjawab TIDAK bersedia di kolom consent -- laporan tetap boleh disetujui supaya staf itu sendiri bisa membacanya, tapi drill-down-nya TIDAK akan tampil di tabel Laporan Individu pimpinan.">
                      🔒 Tidak bersedia (individu disembunyikan)
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
                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 11.5 }} disabled={busy} onClick={() => act(r, 'tolak')}>Tolak</button>
                  <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 11.5, background: 'var(--status-safe)' }} disabled={busy} onClick={() => act(r, 'setuju')}>{busyId === r.id ? '…' : 'Setujui'}</button>
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

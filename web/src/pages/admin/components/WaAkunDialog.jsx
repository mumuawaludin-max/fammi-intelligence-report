import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useCms } from '../store/CmsStore';
import { IconX } from './icons';
import { supabase } from '../../../lib/supabase';
import { linkWaAction } from '../useAdminCmsData';
import { susunTautanWa } from '../importers/waAkun';

// Tautkan akun Pegawai ke isian Wellbeing Assessment untuk satu sekolah sekaligus. Rencananya
// disusun waAkun.js: akun Screening Awal yang namanya persis sama cukup ditambah wa_individu_id
// (satu orang tetap satu akun), yang belum punya akun dibuatkan akun Pegawai baru, dan nama yang
// meragukan diputuskan admin. Kode akun baru hanya tampil sekali dan bisa diunduh sebagai Excel.

const LABEL_STATUS = {
  sudah: { label: 'Sudah tertaut', bg: 'var(--status-safe-bg)', ink: 'var(--status-safe)' },
  tautkan: { label: 'Tautkan ke akun', bg: 'var(--purple-050)', ink: 'var(--purple-700)' },
  buat: { label: 'Buat akun baru', bg: 'var(--info-soft)', ink: 'var(--info)' },
  ragu: { label: 'Perlu dipilih', bg: 'var(--status-warn-bg)', ink: 'var(--status-warn)' },
};

export function WaAkunDialog({ open, onClose }) {
  const { data, bulkCreateUsers, refetch, showToast } = useCms();
  const sekolahWa = useMemo(() => (data.sekolah || []).filter((s) => (s.modules || []).includes('wa')), [data.sekolah]);
  const [sekolahId, setSekolahId] = useState('');
  const [individu, setIndividu] = useState({ status: 'idle', rows: [], pesan: '' });
  const [pilihan, setPilihan] = useState({});
  const [proses, setProses] = useState(null);
  const [hasil, setHasil] = useState(null);
  const sekolahAktif = sekolahId || sekolahWa[0]?.id || '';

  useEffect(() => {
    if (!open || !sekolahAktif) return undefined;
    let hidup = true;
    (async () => {
      await Promise.resolve();
      if (!hidup) return;
      setIndividu({ status: 'memuat', rows: [], pesan: '' });
      setPilihan({});
      setHasil(null);
      const { data: ds, error } = await supabase.from('wa_dataset').select('id').eq('sekolah_id', sekolahAktif).eq('aktif', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!hidup) return;
      if (error) { setIndividu({ status: 'galat', rows: [], pesan: error.message }); return; }
      if (!ds) { setIndividu({ status: 'galat', rows: [], pesan: 'Belum ada dataset Wellbeing Assessment untuk sekolah ini. Jalankan seed dulu.' }); return; }
      const { data: rows, error: e2 } = await supabase.from('wa_individu').select('individu_id, nama, data').eq('dataset_id', ds.id).order('nama').range(0, 4999);
      if (!hidup) return;
      if (e2) { setIndividu({ status: 'galat', rows: [], pesan: e2.message }); return; }
      setIndividu({ status: 'siap', rows: (rows || []).map((r) => ({ id: r.individu_id, nama: r.nama, unit: r.data?.unit || '', jabatan: r.data?.jabatan || '' })), pesan: '' });
    })();
    return () => { hidup = false; };
  }, [open, sekolahAktif]);

  const rencana = useMemo(() => {
    if (individu.status !== 'siap') return [];
    const akun = (data.users || []).filter((u) => u.school_id === sekolahAktif);
    return susunTautanWa({ individu: individu.rows, akun, usernameTerpakai: (data.users || []).map((u) => u.username) });
  }, [individu, data.users, sekolahAktif]);

  // Pilihan bawaan: tautkan dan buat dijalankan, ragu dilewati sampai admin memilih.
  const aksiBaris = (r) => pilihan[r.orang.id] || (r.status === 'tautkan' ? { aksi: 'tautkan', akunId: r.akun.id } : r.status === 'buat' ? { aksi: 'buat', username: r.usernameBaru } : { aksi: 'lewati' });
  const hitung = rencana.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {});
  const akanTautkan = rencana.filter((r) => r.status !== 'sudah' && aksiBaris(r).aksi === 'tautkan');
  const akanBuat = rencana.filter((r) => r.status !== 'sudah' && aksiBaris(r).aksi === 'buat');

  async function jalankan() {
    if (!window.confirm(`Tautkan ${akanTautkan.length} akun dan buat ${akanBuat.length} akun Pegawai baru untuk ${sekolahWa.find((s) => s.id === sekolahAktif)?.nama || sekolahAktif}?`)) return;
    const gagal = [];
    let ditautkan = 0;
    setProses({ selesai: 0, total: akanTautkan.length + akanBuat.length });
    for (const r of akanTautkan) {
      try {
        await linkWaAction(aksiBaris(r).akunId, r.orang.id);
        ditautkan += 1;
      } catch (e) {
        gagal.push({ nama: r.orang.nama, error: e.message });
      }
      setProses((p) => ({ ...p, selesai: p.selesai + 1 }));
    }
    let akunBaru = [];
    if (akanBuat.length) {
      const res = await bulkCreateUsers(
        akanBuat.map((r) => ({ nama: r.orang.nama, username: aksiBaris(r).username, peran: 'Pegawai', cakupan: null, wa_individu_id: r.orang.id })),
        sekolahAktif,
        (done) => setProses((p) => ({ ...p, selesai: akanTautkan.length + done })),
      );
      akunBaru = res.filter((x) => x.ok).map((x) => ({ nama: x.nama, username: x.username, password: x.password }));
      res.filter((x) => !x.ok).forEach((x) => gagal.push({ nama: x.username, error: x.error }));
    }
    setProses(null);
    setHasil({ ditautkan, akunBaru, gagal });
    showToast(`${ditautkan} akun ditautkan, ${akunBaru.length} akun baru dibuat${gagal.length ? `, ${gagal.length} gagal` : ''}.`, gagal.length ? 'warn' : 'safe', 6000);
    refetch();
  }

  function unduhKode() {
    const ws = XLSX.utils.json_to_sheet(hasil.akunBaru.map((a) => ({ Nama: a.nama, Username: a.username, Kode: a.password })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Akun Wellbeing');
    XLSX.writeFile(wb, `akun-wellbeing-assessment-${sekolahAktif}.xlsx`);
  }

  if (!open) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(33,27,46,.42)', zIndex: 60 }} onClick={proses ? undefined : onClose} />
      <div className="dialog-enter" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--surface)', borderRadius: 20, width: 'min(980px,94vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(33,27,46,.28)', zIndex: 70 }}>
        <div style={{ padding: '18px 24px 12px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div className="disp" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Tautkan akun Wellbeing Assessment</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3, lineHeight: 1.45 }}>Akun Pegawai yang namanya persis sama ditambah tautan isian Wellbeing Assessment; yang belum punya akun dibuatkan. Nama yang meragukan dipilih manual.</div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose} disabled={Boolean(proses)}><IconX size={16} /></button>
        </div>

        <div style={{ padding: '14px 24px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid var(--line)' }}>
          {sekolahWa.length === 0 ? (
            <span style={{ fontSize: 12.5, color: 'var(--status-warn)' }}>Belum ada sekolah dengan modul Wellbeing Assessment aktif. Aktifkan modul wa di Sekolah & Modul.</span>
          ) : (
            <select className="fld" style={{ maxWidth: 320 }} value={sekolahAktif} onChange={(e) => setSekolahId(e.target.value)} disabled={Boolean(proses)}>
              {sekolahWa.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
          )}
          {Object.entries(LABEL_STATUS).map(([k, v]) => (hitung[k] ? <span key={k} className="pill" style={{ background: v.bg, color: v.ink }}>{v.label} · {hitung[k]}</span> : null))}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 24px' }}>
          {individu.status === 'memuat' && <div style={{ padding: 20, fontSize: 13, color: 'var(--ink-3)' }}>Memuat isian…</div>}
          {individu.status === 'galat' && <div style={{ padding: 20, fontSize: 13, color: 'var(--status-warn)' }}>{individu.pesan}</div>}
          {hasil ? (
            <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13.5, color: 'var(--ink)' }}>{hasil.ditautkan} akun ditautkan. {hasil.akunBaru.length} akun baru dibuat.</div>
              {hasil.akunBaru.length > 0 && (
                <div style={{ padding: '12px 14px', background: 'var(--info-soft)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <b style={{ fontSize: 12, color: 'var(--info)' }}>Kode akun baru hanya tampil sekali</b>
                    <button className="btn-primary" style={{ fontSize: 12 }} onClick={unduhKode}>⬇ Unduh Excel kode</button>
                  </div>
                  {hasil.akunBaru.slice(0, 12).map((a) => <div key={a.username} className="mono" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{a.nama} · {a.username} / {a.password}</div>)}
                  {hasil.akunBaru.length > 12 && <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4 }}>dan {hasil.akunBaru.length - 12} lainnya di berkas Excel.</div>}
                </div>
              )}
              {hasil.gagal.length > 0 && (
                <div style={{ padding: '12px 14px', background: 'var(--status-warn-bg)', borderRadius: 12, fontSize: 12, color: 'var(--ink)' }}>
                  <b style={{ color: 'var(--status-warn)' }}>{hasil.gagal.length} gagal</b>
                  {hasil.gagal.map((g, i) => <div key={i}>{g.nama}: {g.error}</div>)}
                </div>
              )}
            </div>
          ) : individu.status === 'siap' && (
            <table>
              <thead>
                <tr><th>Nama di asesmen</th><th>Unit</th><th>Rencana</th><th>Akun</th></tr>
              </thead>
              <tbody>
                {rencana.map((r) => {
                  const a = aksiBaris(r);
                  const st = LABEL_STATUS[r.status];
                  return (
                    <tr key={r.orang.id}>
                      <td><div style={{ fontWeight: 600 }}>{r.orang.nama}</div><div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>{r.orang.id}</div></td>
                      <td style={{ fontSize: 12 }}>{r.orang.unit}</td>
                      <td><span className="pill" style={{ background: st.bg, color: st.ink }}>{st.label}</span></td>
                      <td style={{ minWidth: 260 }}>
                        {r.status === 'sudah' && <span className="mono" style={{ fontSize: 12 }}>{r.akun.username}</span>}
                        {r.status !== 'sudah' && (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <select className="fld" style={{ fontSize: 12, padding: '4px 6px' }} disabled={Boolean(proses)}
                              value={a.aksi === 'tautkan' ? `t:${a.akunId}` : a.aksi}
                              onChange={(e) => {
                                const v = e.target.value;
                                setPilihan((p) => ({ ...p, [r.orang.id]: v.startsWith('t:') ? { aksi: 'tautkan', akunId: v.slice(2) } : v === 'buat' ? { aksi: 'buat', username: r.usernameBaru || a.username || '' } : { aksi: 'lewati' } }));
                              }}>
                              {(r.status === 'tautkan' ? [r.akun] : r.kandidat || []).map((k) => (
                                <option key={k.id} value={`t:${k.id}`}>Tautkan ke {k.username}{k.wa_individu_id ? ` (sudah ${k.wa_individu_id})` : ''}</option>
                              ))}
                              <option value="buat">Buat akun baru</option>
                              <option value="lewati">Lewati</option>
                            </select>
                            {a.aksi === 'buat' && (
                              <input className="fld mono" style={{ fontSize: 12, padding: '4px 6px', maxWidth: 160 }} value={a.username || ''} disabled={Boolean(proses)}
                                onChange={(e) => setPilihan((p) => ({ ...p, [r.orang.id]: { aksi: 'buat', username: e.target.value.trim() } }))} />
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, background: 'var(--surface-soft)', borderRadius: '0 0 20px 20px' }}>
          {proses && <span style={{ fontSize: 12, color: 'var(--ink-3)', marginRight: 'auto' }}>Memproses {proses.selesai} dari {proses.total}…</span>}
          <button className="btn-secondary" onClick={onClose} disabled={Boolean(proses)}>{hasil ? 'Tutup' : 'Batal'}</button>
          {!hasil && (
            <button className="btn-primary" onClick={jalankan} disabled={Boolean(proses) || individu.status !== 'siap' || (!akanTautkan.length && !akanBuat.length)}>
              Tautkan {akanTautkan.length} · Buat {akanBuat.length}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

import { useRef, useState } from 'react';
import { useCms } from '../store/CmsStore';
import { IconX } from './icons';
import { parseGuruFile } from '../importers/guruImporter';

const PERAN_OPTIONS = ['AdminFammi', 'Yayasan', 'KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Karyawan', 'WaliKelas', 'OrangTua', 'Siswa'];
const labelStyle = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5, display: 'block' };

export function AddUserDialog() {
  const { state, setAddUserOpen } = useCms();
  const [tab, setTab] = useState('satu');

  if (!state.addUserOpen) return null;
  const close = () => setAddUserOpen(false);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(33,27,46,.42)', zIndex: 60 }} onClick={close} />
      <div className="dialog-enter" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--surface)', borderRadius: 20, width: 'min(720px,94vw)', maxHeight: '86vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px rgba(33,27,46,.28)', zIndex: 70 }}>
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="disp" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Buat akun baru</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3, marginBottom: 14 }}>Password sementara auto-generate lewat Edge Function create-user</div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={close}><IconX size={16} /></button>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: '0 24px', borderBottom: '1px solid var(--line)' }}>
          {[['satu', 'Satu per satu'], ['bulk', 'Upload CSV / Excel']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '10px 4px', marginRight: 20, background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, color: tab === key ? 'var(--purple-600)' : 'var(--ink-3)',
              borderBottom: tab === key ? '2px solid var(--purple-600)' : '2px solid transparent',
            }}>{label}</button>
          ))}
        </div>
        {tab === 'satu' ? <SingleForm close={close} /> : <BulkForm close={close} />}
      </div>
    </>
  );
}

function SingleForm({ close }) {
  const { createUser } = useCms();
  const [busy, setBusy] = useState(false);
  const namaRef = useRef(null);
  const usernameRef = useRef(null);
  const peranRef = useRef(null);
  const cakupanRef = useRef(null);
  const schoolRef = useRef(null);

  const submit = async () => {
    const nama = namaRef.current?.value.trim();
    const username = usernameRef.current?.value.trim();
    if (!nama || !username) return;
    setBusy(true);
    try {
      await createUser({
        nama,
        username,
        peran: peranRef.current?.value,
        schoolId: schoolRef.current?.value.trim() || null,
        cakupan: cakupanRef.current?.value.trim() || null,
      });
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <div>
          <label style={labelStyle}>Nama lengkap</label>
          <input ref={namaRef} className="fld" placeholder="Contoh: Bu Ratna Dewi" autoFocus />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Username (atau email)</label>
            <input ref={usernameRef} className="fld mono" placeholder="wali.x-a atau nama@sekolah.id" />
          </div>
          <div>
            <label style={labelStyle}>Peran</label>
            <select ref={peranRef} className="fld">
              {PERAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Sekolah (school_id, opsional)</label>
          <input ref={schoolRef} className="fld mono" placeholder="Contoh: SDIP-ALMADANI" />
        </div>
        <div>
          <label style={labelStyle}>Cakupan</label>
          <input ref={cakupanRef} className="fld" placeholder="Sesuai peran: nama kelas / yayasan_id, pisah koma kalau lebih dari satu" />
        </div>
        <div style={{ padding: '10px 12px', background: 'var(--info-soft)', borderRadius: 8, fontSize: 11.5, color: 'var(--info)', lineHeight: 1.4 }}>
          💡 Kalau username diisi alamat email asli (ada "@"), login pakai email itu langsung — bukan lewat domain @fammi.internal.
        </div>
      </div>
      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--surface-soft)', borderRadius: '0 0 20px 20px' }}>
        <button className="btn-secondary" onClick={close} disabled={busy}>Batal</button>
        <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? 'Membuat…' : 'Buat akun & kirim password'}</button>
      </div>
    </>
  );
}

function BulkForm({ close }) {
  const { bulkCreateUsers, data } = useCms();
  const [sekolahId, setSekolahId] = useState(data.sekolah[0]?.id || '');
  const [rows, setRows] = useState(null);
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const fileRef = useRef(null);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !sekolahId) return;
    setErr(null);
    setResults(null);
    try {
      const parsed = await parseGuruFile(file, { sekolahId });
      setRows(parsed);
    } catch (ex) {
      setErr(ex.message);
    }
  };

  const updateRow = (idx, patch) => {
    setRows((rs) => rs.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };

  const submit = async () => {
    setBusy(true);
    try {
      const res = await bulkCreateUsers(rows, sekolahId);
      setResults(res);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  const unmatchedCount = rows ? rows.filter(r => r.peran === 'WaliKelas' && r.confidence === 'unmatched').length : 0;

  return (
    <>
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Sekolah</label>
            <select className="fld" value={sekolahId} onChange={(e) => setSekolahId(e.target.value)}>
              {data.sekolah.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>File CSV / Excel</label>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="fld" onChange={onFile} />
          </div>
        </div>
        <div style={{ padding: '10px 12px', background: 'var(--info-soft)', borderRadius: 8, fontSize: 11.5, color: 'var(--info)', lineHeight: 1.4 }}>
          💡 Kolom yang dibaca: <span className="mono">Nama Lengkap, Posisi, Wali Kelas, Email</span>. Baris dengan Wali Kelas = "Pimpinan Sekolah" jadi peran <span className="mono">KepalaSekolah</span>, sisanya <span className="mono">WaliKelas</span> dengan kelas dicocokkan otomatis ke data karakter_skor.
        </div>
        {err && <div style={{ padding: '10px 12px', background: 'var(--status-alert-bg,#FBE7EA)', borderRadius: 8, fontSize: 12, color: 'var(--status-alert,#D6455A)' }}>{err}</div>}

        {rows && !results && (
          <>
            {unmatchedCount > 0 && (
              <div style={{ padding: '10px 12px', background: '#FAF1DC', borderRadius: 8, fontSize: 12, color: '#D69219' }}>
                ⚠️ {unmatchedCount} baris kelasnya tidak ketemu otomatis — pilih manual di dropdown kolom Kelas sebelum submit.
              </div>
            )}
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-soft)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px' }}>Nama</th>
                    <th style={{ padding: '8px 10px' }}>Email (username)</th>
                    <th style={{ padding: '8px 10px' }}>Peran</th>
                    <th style={{ padding: '8px 10px' }}>Kelas</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid var(--line)' }}>
                      <td style={{ padding: '6px 10px' }}>{r.nama}</td>
                      <td style={{ padding: '6px 10px' }} className="mono">{r.email}</td>
                      <td style={{ padding: '6px 10px' }}>
                        <select className="fld" style={{ padding: '4px 6px', fontSize: 12 }} value={r.peran}
                          onChange={(e) => updateRow(idx, { peran: e.target.value, cakupan: e.target.value === 'WaliKelas' ? r.cakupan : [] })}>
                          {PERAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        {r.peran === 'WaliKelas' ? (
                          <select className="fld" style={{ padding: '4px 6px', fontSize: 12, borderColor: r.confidence === 'unmatched' ? '#D69219' : undefined }}
                            value={r.cakupan[0] || ''} onChange={(e) => updateRow(idx, { cakupan: [e.target.value] })}>
                            <option value="">— pilih kelas —</option>
                            {r.kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                        ) : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {results && (
          <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-soft)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>Username</th>
                  <th style={{ padding: '8px 10px' }}>Status</th>
                  <th style={{ padding: '8px 10px' }}>Kode khusus</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={{ padding: '6px 10px' }} className="mono">{r.username}</td>
                    <td style={{ padding: '6px 10px', color: r.ok ? '#2E9E6B' : '#D6455A' }}>{r.ok ? 'Berhasil' : r.error}</td>
                    <td style={{ padding: '6px 10px' }} className="mono">{r.ok ? r.password : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '10px 12px', fontSize: 11.5, color: 'var(--ink-3)' }}>
              ⚠️ Kode khusus di atas cuma tampil sekali di sini — salin/screenshot sebelum menutup dialog ini.
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--surface-soft)', borderRadius: '0 0 20px 20px' }}>
        <button className="btn-secondary" onClick={close} disabled={busy}>{results ? 'Tutup' : 'Batal'}</button>
        {rows && !results && (
          <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? 'Membuat…' : `Buat ${rows.length} akun`}</button>
        )}
      </div>
    </>
  );
}

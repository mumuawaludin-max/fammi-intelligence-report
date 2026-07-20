import { useRef, useState } from 'react';
import { useCms } from '../store/CmsStore';
import { IconX } from './icons';

const PERAN_OPTIONS = ['AdminFammi', 'Yayasan', 'KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'WaliKelas', 'OrangTua', 'Siswa'];
const labelStyle = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5, display: 'block' };

export function EditUserDialog() {
  const { state, setEditUserTarget, updateUser, data } = useCms();
  const u = state.editUserTarget;
  const [busy, setBusy] = useState(false);
  const namaRef = useRef(null);
  const peranRef = useRef(null);
  const cakupanRef = useRef(null);
  const schoolRef = useRef(null);

  if (!u) return null;
  const close = () => setEditUserTarget(null);

  const submit = async () => {
    const nama = namaRef.current?.value.trim();
    if (!nama) return;
    setBusy(true);
    try {
      await updateUser(u.id, {
        nama,
        peran: peranRef.current?.value,
        schoolId: schoolRef.current?.value.trim() || null,
        cakupan: cakupanRef.current?.value.trim() || null,
      });
    } finally {
      setBusy(false);
    }
  };

  const schoolIdForCode = data.sekolah.find((s) => s.nama === u.sekolah)?.id || '';

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(33,27,46,.42)', zIndex: 60 }} onClick={close} />
      <div className="dialog-enter" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--surface)', borderRadius: 20, width: 'min(520px,92vw)', boxShadow: '0 24px 60px rgba(33,27,46,.28)', zIndex: 70 }}>
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="disp" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Edit pengguna</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>{u.username}</div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={close}><IconX size={16} /></button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nama lengkap</label>
            <input ref={namaRef} className="fld" defaultValue={u.nama} autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Peran / jabatan</label>
            <select ref={peranRef} className="fld" defaultValue={u.peran}>
              {PERAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Sekolah (school_id)</label>
            <input ref={schoolRef} className="fld mono" defaultValue={schoolIdForCode} placeholder="Contoh: SDIP-ALMADANI" />
          </div>
          <div>
            <label style={labelStyle}>Cakupan</label>
            <input ref={cakupanRef} className="fld" defaultValue={u.cakupan} placeholder="Sesuai peran: nama kelas / yayasan_id, pisah koma kalau lebih dari satu" />
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--info-soft)', borderRadius: 8, fontSize: 11.5, color: 'var(--info)', lineHeight: 1.4 }}>
            💡 Username/email login tidak bisa diubah di sini — kalau perlu ganti email login, hapus akun lalu buat ulang.
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--surface-soft)', borderRadius: '0 0 20px 20px' }}>
          <button className="btn-secondary" onClick={close} disabled={busy}>Batal</button>
          <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan perubahan'}</button>
        </div>
      </div>
    </>
  );
}

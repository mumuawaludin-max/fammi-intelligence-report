import { useRef, useState } from 'react';
import { useCms } from '../store/CmsStore';
import { moduleColor, moduleLabel } from '../data/helpers';
import { IconX } from './icons';

const MODULES = ['karakter', 'mi', 'screening'];

export function AddSchoolDialog() {
  const { data, state, setAddSchoolOpen, addSchool } = useCms();
  const [modules, setModules] = useState(['karakter']);
  const namaRef = useRef(null);
  const jenjangRef = useRef(null);
  const yayRef = useRef(null);

  if (!state.addSchoolOpen) return null;

  const close = () => setAddSchoolOpen(false);
  const submit = async () => {
    const nama = namaRef.current?.value.trim();
    if (!nama) return;
    await addSchool({
      nama,
      jenjang: jenjangRef.current?.value,
      yayasanId: yayRef.current?.value || null,
      modules,
    });
    close();
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(33,27,46,.42)', zIndex: 60 }} onClick={close} />
      <div className="dialog-enter" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--surface)', borderRadius: 20, width: 'min(560px,92vw)', boxShadow: '0 24px 60px rgba(33,27,46,.28)', zIndex: 70 }}>
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="disp" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Tambah sekolah</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>
              Otomatis buat baris di <span className="mono" style={{ fontSize: 11 }}>schools</span> & <span className="mono" style={{ fontSize: 11 }}>school_modules</span>
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={close}><IconX size={16} /></button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5, display: 'block' }}>Nama sekolah</label>
            <input ref={namaRef} className="fld" placeholder="Contoh: SDIT Al Hikmah Depok" autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5, display: 'block' }}>Jenjang</label>
              <select ref={jenjangRef} className="fld">
                {['Daycare', 'TK', 'SD', 'SMP', 'SMA', 'SMK'].map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5, display: 'block' }}>Yayasan (opsional)</label>
              <select ref={yayRef} className="fld">
                <option value="">— Mandiri —</option>
                {data.yayasan.map(y => <option key={y.id} value={y.id}>{y.nama}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5, display: 'block' }}>Modul aktif</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {MODULES.map(m => {
                const mc = moduleColor(m);
                const on = modules.includes(m);
                return (
                  <label key={m} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 11,
                    background: on ? mc.bg : 'var(--surface-soft)',
                    color: on ? mc.ink : 'var(--ink-2)',
                    boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--line)',
                    cursor: 'pointer', flex: 1, fontSize: 12.5, fontWeight: 700,
                  }}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => setModules(cur => on ? cur.filter(x => x !== m) : [...cur, m])}
                      style={{ accentColor: 'var(--purple-600)' }}
                    />
                    {moduleLabel(m)}
                  </label>
                );
              })}
            </div>
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--info-soft)', borderRadius: 8, fontSize: 11.5, color: 'var(--info)', lineHeight: 1.4 }}>
            💡 Aspek Karakter belum otomatis dibuat di sini, atur lewat layar Sekolah &amp; Modul setelah sekolah ini dibuat.
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--surface-soft)', borderRadius: '0 0 20px 20px' }}>
          <button className="btn-secondary" onClick={close}>Batal</button>
          <button className="btn-primary" onClick={submit}>Tambah sekolah</button>
        </div>
      </div>
    </>
  );
}

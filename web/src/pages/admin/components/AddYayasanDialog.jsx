import { useRef, useState } from 'react';
import { useCms } from '../store/CmsStore';
import { IconX } from './icons';

export function AddYayasanDialog() {
  const { state, setAddYayasanOpen, addYayasan } = useCms();
  const [busy, setBusy] = useState(false);
  const namaRef = useRef(null);

  if (!state.addYayasanOpen) return null;

  const close = () => setAddYayasanOpen(false);
  const submit = async () => {
    const nama = namaRef.current?.value.trim();
    if (!nama) return;
    setBusy(true);
    try {
      const ok = await addYayasan({ nama });
      if (ok) close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(33,27,46,.42)', zIndex: 60 }} onClick={close} />
      <div className="dialog-enter" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--surface)', borderRadius: 20, width: 'min(480px,92vw)', boxShadow: '0 24px 60px rgba(33,27,46,.28)', zIndex: 70 }}>
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="disp" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Tambah yayasan</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>
              Otomatis buat baris di <span className="mono" style={{ fontSize: 11 }}>yayasan</span>
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={close}><IconX size={16} /></button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5, display: 'block' }}>Nama yayasan</label>
            <input
              ref={namaRef} className="fld" placeholder="Contoh: Yayasan Al Madani" autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            />
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--info-soft)', borderRadius: 8, fontSize: 11.5, color: 'var(--info)', lineHeight: 1.4 }}>
            💡 Setelah dibuat, yayasan ini langsung bisa dipilih di dropdown "Yayasan" saat menambah sekolah.
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--surface-soft)', borderRadius: '0 0 20px 20px' }}>
          <button className="btn-secondary" onClick={close} disabled={busy}>Batal</button>
          <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? 'Menyimpan…' : 'Tambah yayasan'}</button>
        </div>
      </div>
    </>
  );
}

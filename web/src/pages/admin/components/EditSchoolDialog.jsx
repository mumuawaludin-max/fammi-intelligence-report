import { useRef, useState } from 'react';
import { useCms } from '../store/CmsStore';
import { IconX } from './icons';

// Sama persis dengan ambang di AddSchoolDialog.jsx (lihat komentar di sana) -- dua salinan
// karena dua dialog ini tidak berbagi berkas util, konsisten dengan pola file lain di folder ini
// yang masing-masing berdiri sendiri.
const MAX_LOGO_BYTES = 1.5 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * EditSchoolDialog -- padanan AddSchoolDialog tapi khusus untuk sekolah yang SUDAH terdaftar
 * (dibuka lewat tombol titik-tiga di baris Sekolah.jsx), dan cuma soal logo. Sekolah yang dibuat
 * sebelum fitur logo ada (atau salah unggah saat pembuatan) bisa menambah/mengganti/menghapus
 * logo lewat sini -- field lain (nama/yayasan/jenjang/modul) belum ada jalur edit-nya sama
 * sekali di CMS ini, modul sendiri sudah punya toggle terpisah di tabel Sekolah.jsx.
 */
export function EditSchoolDialog() {
  const { state, setEditSchoolTarget, editSchool, showToast } = useCms();
  const k = state.editSchoolTarget;
  const [busy, setBusy] = useState(false);
  // null = belum disentuh sama sekali (pertahankan logo lama apa adanya kalau submit).
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const logoInputRef = useRef(null);

  if (!k) return null;

  const close = () => {
    setLogoDataUrl(null);
    setRemoveLogo(false);
    setEditSchoolTarget(null);
  };

  async function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'image/png') {
      showToast('Logo harus berformat PNG.', 'alert');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      showToast('Ukuran logo maksimal 1,5MB.', 'alert');
      e.target.value = '';
      return;
    }
    try {
      setLogoDataUrl(await readFileAsDataUrl(file));
      setRemoveLogo(false);
    } catch {
      showToast('Gagal membaca file logo.', 'alert');
    }
  }

  function clearLogo() {
    setLogoDataUrl(null);
    setRemoveLogo(true);
    if (logoInputRef.current) logoInputRef.current.value = '';
  }

  // Pratinjau: file baru yang belum disimpan > logo lama (kalau belum ditandai hapus) > kosong.
  const preview = logoDataUrl || (!removeLogo ? k.logoUrl : null);
  const adaPerubahan = Boolean(logoDataUrl) || removeLogo;

  const submit = async () => {
    if (!adaPerubahan) { close(); return; }
    setBusy(true);
    try {
      await editSchool(k.id, {
        logoBase64: logoDataUrl || undefined,
        removeLogo: removeLogo || undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(33,27,46,.42)', zIndex: 60 }} onClick={close} />
      <div className="dialog-enter" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--surface)', borderRadius: 20, width: 'min(440px,92vw)', boxShadow: '0 24px 60px rgba(33,27,46,.28)', zIndex: 70 }}>
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="disp" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Logo sekolah</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>{k.nama}</div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={close}><IconX size={16} /></button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              style={{
                width: 72, height: 72, flex: '0 0 auto', padding: 0, overflow: 'hidden',
                borderRadius: 16, border: '1.5px dashed var(--line)',
                background: preview ? 'var(--surface)' : 'var(--surface-soft)',
                display: 'grid', placeItems: 'center', cursor: 'pointer',
              }}
              aria-label="Unggah logo sekolah"
            >
              {preview
                ? <img src={preview} alt="Pratinjau logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                : <span style={{ fontSize: 24, color: 'var(--ink-4)', lineHeight: 1 }}>+</span>}
            </button>
            <input ref={logoInputRef} type="file" accept="image/png" onChange={handleLogoChange} style={{ display: 'none' }} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.4 }}>PNG, maks 1,5MB.</span>
              {preview && (
                <button type="button" className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12, alignSelf: 'flex-start' }} onClick={clearLogo}>
                  Hapus logo
                </button>
              )}
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--surface-soft)', borderRadius: '0 0 20px 20px' }}>
          <button className="btn-secondary" onClick={close} disabled={busy}>Batal</button>
          <button className="btn-primary" onClick={submit} disabled={busy || !adaPerubahan}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
        </div>
      </div>
    </>
  );
}

import { useRef, useState } from 'react';
import { useCms } from '../store/CmsStore';
import { moduleColor, moduleLabel } from '../data/helpers';
import { IconX } from './icons';

const MODULES = ['karakter', 'mi', 'screening', 'cw', 'sc', 'pa'];
// Daycare..SMK = jenjang akademik (sekolah K-12). "Semua Jenjang" untuk satu Yayasan yang
// mendaftar sebagai SATU baris `schools`/satu login tapi mencakup beberapa jenjang sekaligus
// (mis. Sekolah Islam Athirah: SD/SMP/SMA dalam satu wadah) -- label ini murni deskriptif untuk
// daftar Admin CMS, TIDAK membatasi unit/jenjang apa yang boleh diimpor untuk sekolah itu (lihat
// kolom `unit` di pa_lembaga/sc_lembaga, itu yang sungguhan memecah data per jenjang).
// Manajemen/Karyawan ditambahkan untuk organisasi yang bukan sekolah berjenjang (klien modul
// Culture & Wellbeing/School Culture), dipilih sesuai peran dominan yang mengisi asesmen budaya
// kerja di organisasi itu.
const JENJANG_OPTIONS = ['Daycare', 'TK', 'SD', 'SMP', 'SMA', 'SMK', 'Semua Jenjang', 'Manajemen', 'Karyawan'];

// Batas ukuran mentah file logo -- dicek DI SINI (klien) sebelum sempat dibaca jadi base64
// sama sekali, supaya pesan errornya cepat dan tidak menunggu bolak-balik ke Edge Function.
// Server (admin-actions) tetap menegakkan ambang keduanya sebagai pertahanan lapis kedua.
const MAX_LOGO_BYTES = 1.5 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function AddSchoolDialog() {
  const { data, state, setAddSchoolOpen, addSchool, showToast } = useCms();
  const [modules, setModules] = useState(['karakter']);
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const namaRef = useRef(null);
  const jenjangRef = useRef(null);
  const yayRef = useRef(null);
  const logoInputRef = useRef(null);

  if (!state.addSchoolOpen) return null;

  const close = () => { setLogoDataUrl(null); setAddSchoolOpen(false); };

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
    } catch {
      showToast('Gagal membaca file logo.', 'alert');
    }
  }

  function removeLogo() {
    setLogoDataUrl(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  }

  const submit = async () => {
    const nama = namaRef.current?.value.trim();
    if (!nama) return;
    await addSchool({
      nama,
      jenjang: jenjangRef.current?.value,
      yayasanId: yayRef.current?.value || null,
      modules,
      logoBase64: logoDataUrl || undefined,
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
          <div>
            <label style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5, display: 'block' }}>Logo sekolah (opsional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                style={{
                  width: 64, height: 64, flex: '0 0 auto', padding: 0, overflow: 'hidden',
                  borderRadius: 14, border: '1.5px dashed var(--line)',
                  background: logoDataUrl ? 'var(--surface)' : 'var(--surface-soft)',
                  display: 'grid', placeItems: 'center', cursor: 'pointer',
                }}
                aria-label="Unggah logo sekolah"
              >
                {logoDataUrl
                  ? <img src={logoDataUrl} alt="Pratinjau logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <span style={{ fontSize: 22, color: 'var(--ink-4)', lineHeight: 1 }}>+</span>}
              </button>
              <input ref={logoInputRef} type="file" accept="image/png" onChange={handleLogoChange} style={{ display: 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {logoDataUrl ? (
                  <button type="button" className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={removeLogo}>Hapus logo</button>
                ) : (
                  <span style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.4 }}>PNG, maks 1,5MB. Tampil di header laporan sekolah ini.</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5, display: 'block' }}>Jenjang</label>
              <select ref={jenjangRef} className="fld">
                {JENJANG_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
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
            {/* flexWrap + flex-basis 30% (bukan flex:1 di baris tunggal) -- dengan enam modul
                sekarang (nambah "pa"), memaksa semuanya sejajar satu baris di dialog 560px bikin
                label panjang seperti "Multiple Intelligence"/"Culture & Wellbeing" kepepet.
                Dibiarkan melipat jadi dua baris x tiga kolom supaya tetap terbaca. */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MODULES.map(m => {
                const mc = moduleColor(m);
                const on = modules.includes(m);
                return (
                  <label key={m} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 11,
                    background: on ? mc.bg : 'var(--surface-soft)',
                    color: on ? mc.ink : 'var(--ink-2)',
                    boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--line)',
                    cursor: 'pointer', flex: '1 1 30%', minWidth: 140, fontSize: 12.5, fontWeight: 700,
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

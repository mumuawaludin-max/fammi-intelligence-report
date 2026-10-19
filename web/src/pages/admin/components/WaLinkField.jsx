// Isian tautan akun Pegawai ke isian Wellbeing Assessment (profiles.wa_individu_id). Pilihannya
// dibaca dari wa_individu dataset aktif sekolah itu (Admin Fammi membacanya lewat policy
// *_admin_baca). Jika nama akun cocok persis dengan satu nama di dataset, ditawarkan sebagai saran
// sekali klik; kecocokan tidak pernah dipasang diam-diam.

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { cocokkanNamaWa } from '../importers/waAkun';

const labelStyle = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5, display: 'block' };

export function WaLinkField({ peran, schoolId, nama, value, onChange }) {
  const [individu, setIndividu] = useState([]);
  const [status, setStatus] = useState('');
  const perlu = peran === 'Pegawai';

  useEffect(() => {
    let hidup = true;
    (async () => {
      await Promise.resolve();
      if (!hidup) return;
      if (!perlu || !schoolId) { setIndividu([]); setStatus(''); return; }
      const { data: ds, error } = await supabase.from('wa_dataset').select('id').eq('sekolah_id', schoolId).eq('aktif', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!hidup) return;
      if (error) { setIndividu([]); setStatus('Tabel Wellbeing Assessment belum ada (migration 20261020100000 belum dijalankan).'); return; }
      if (!ds) { setIndividu([]); setStatus(`Belum ada data Wellbeing Assessment untuk ${schoolId}.`); return; }
      const { data } = await supabase.from('wa_individu').select('individu_id, nama, data').eq('dataset_id', ds.id).order('nama').range(0, 4999);
      if (!hidup) return;
      setIndividu((data || []).map((r) => ({ id: r.individu_id, nama: r.nama, unit: r.data?.unit || '', jabatan: r.data?.jabatan || '' })));
      setStatus('');
    })();
    return () => { hidup = false; };
  }, [perlu, schoolId]);

  if (!perlu) return null;
  const terpilih = individu.find((x) => x.id === value);
  const saran = !value && nama ? cocokkanNamaWa(nama, individu) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px', background: 'var(--surface-soft)', borderRadius: 10 }}>
      <label style={labelStyle}>Isian Wellbeing Assessment (wa_individu_id, opsional)</label>
      <input list="wa-individu-opts" className="fld mono" value={value || ''} onChange={(e) => onChange(e.target.value.trim())} placeholder={individu.length ? 'Ketik nama, lalu pilih' : 'Contoh: R042'} />
      <datalist id="wa-individu-opts">
        {individu.map((x) => <option key={x.id} value={x.id}>{`${x.nama} · ${x.unit}${x.jabatan ? ` · ${x.jabatan}` : ''}`}</option>)}
      </datalist>
      {value && individu.length > 0 && (
        <div style={{ fontSize: 12, color: terpilih ? 'var(--ink-3)' : 'var(--status-warn)' }}>
          {terpilih ? `${terpilih.nama} · ${terpilih.unit}` : 'Id tidak ditemukan di daftar Wellbeing Assessment sekolah ini.'}
        </div>
      )}
      {saran && (
        <button type="button" className="btn-secondary" style={{ alignSelf: 'flex-start', fontSize: 12 }} onClick={() => onChange(saran.id)}>
          Pakai {saran.id}: {saran.nama} · {saran.unit}
        </button>
      )}
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.4 }}>
        {status || 'Pegawai dengan isian ini membaca laporan Wellbeing Assessment dirinya sendiri. Satu akun boleh tertaut ke Screening Awal dan Wellbeing Assessment sekaligus.'}
      </div>
    </div>
  );
}

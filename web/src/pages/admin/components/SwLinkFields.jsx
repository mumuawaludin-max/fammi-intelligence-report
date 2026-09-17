// Isian tautan akun modul Screening Awal Wellbeing di dialog pengguna Admin Fammi.
// KepalaUnit ditautkan ke satu unit (profiles.sw_unit_id), Pegawai ke satu baris isian
// (profiles.sw_individu_id). Pilihannya dibaca dari sw_unit/sw_individu dataset aktif sekolah
// itu; Admin Fammi boleh membacanya lewat policy *_admin_baca. Kalau seed modul sw sekolah itu
// belum masuk, daftarnya kosong dan id masih bisa diketik sendiri.

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const labelStyle = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5, display: 'block' };

export function SwLinkFields({ peran, schoolId, unitId, onUnitId, individuId, onIndividuId }) {
  const [unit, setUnit] = useState([]);
  const [individu, setIndividu] = useState([]);
  const [status, setStatus] = useState('');
  const perlu = peran === 'KepalaUnit' || peran === 'Pegawai';

  useEffect(() => {
    let hidup = true;
    (async () => {
      // Menunggu satu putaran supaya setState tidak sinkron di badan effect.
      await Promise.resolve();
      if (!hidup) return;
      if (!perlu || !schoolId) { setUnit([]); setIndividu([]); setStatus(''); return; }
      setStatus('Memuat unit dan pegawai…');
      const { data: ds } = await supabase.from('sw_dataset').select('id').eq('sekolah_id', schoolId).eq('aktif', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!hidup) return;
      if (!ds) { setUnit([]); setIndividu([]); setStatus(`Belum ada data Screening Awal Wellbeing untuk ${schoolId}. Jalankan seed dulu, atau ketik id secara manual.`); return; }
      const [u, o] = await Promise.all([
        supabase.from('sw_unit').select('unit_id, n_pengisi, data').eq('dataset_id', ds.id).order('unit_id'),
        peran === 'Pegawai' ? supabase.from('sw_individu').select('individu_id, nama, unit_id, data').eq('dataset_id', ds.id).order('nama') : Promise.resolve({ data: [] }),
      ]);
      if (!hidup) return;
      setUnit((u.data || []).map((r) => ({ id: r.unit_id, nama: r.data?.nama || r.unit_id, n: r.n_pengisi })));
      setIndividu((o.data || []).map((r) => ({ id: r.individu_id, nama: r.nama, unit: r.unit_id, jabatan: r.data?.jabatan || '' })));
      setStatus('');
    })();
    return () => { hidup = false; };
  }, [perlu, peran, schoolId]);

  if (!perlu) return null;
  const namaUnit = Object.fromEntries(unit.map((x) => [x.id, x.nama]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px', background: 'var(--surface-soft)', borderRadius: 10 }}>
      {peran === 'KepalaUnit' && (
        <div>
          <label style={labelStyle}>Unit yang dipimpin (sw_unit_id)</label>
          {unit.length ? (
            <select className="fld" value={unitId || ''} onChange={(e) => onUnitId(e.target.value)}>
              <option value="">Pilih unit…</option>
              {unit.map((x) => <option key={x.id} value={x.id}>{x.nama} ({x.n} pengisi)</option>)}
            </select>
          ) : (
            <input className="fld mono" value={unitId || ''} onChange={(e) => onUnitId(e.target.value)} placeholder="Contoh: u-sd-athirah-kajaolalido" />
          )}
        </div>
      )}
      {peran === 'Pegawai' && (
        <div>
          <label style={labelStyle}>Isian milik pegawai ini (sw_individu_id)</label>
          <input list="sw-individu-opts" className="fld mono" value={individuId || ''} onChange={(e) => onIndividuId(e.target.value)} placeholder={individu.length ? 'Ketik nama, lalu pilih' : 'Contoh: p324'} />
          <datalist id="sw-individu-opts">
            {individu.map((x) => <option key={x.id} value={x.id}>{`${x.nama} · ${namaUnit[x.unit] || x.unit}${x.jabatan ? ` · ${x.jabatan}` : ''}`}</option>)}
          </datalist>
          {individuId && individu.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
              {(() => { const x = individu.find((i) => i.id === individuId); return x ? `${x.nama} · ${namaUnit[x.unit] || x.unit}` : 'Id tidak ditemukan di daftar pegawai sekolah ini.'; })()}
            </div>
          )}
        </div>
      )}
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.4 }}>
        {status || (peran === 'KepalaUnit'
          ? 'Kepala unit hanya melihat unitnya sendiri dibanding lembaga, tanpa nama pegawai.'
          : 'Pegawai hanya melihat hasil isiannya sendiri, dalam tampilan ponsel. Satu akun untuk satu baris isian.')}
      </div>
    </div>
  );
}

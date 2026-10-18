import { useState } from 'react';
import { IconX } from './icons';
import { LABEL_ISU_QC, isianTeks, qcNarasiWa } from '../../wa/lib/waAturan';

// Laci tinjau satu narasi Wellbeing Assessment. Isi narasi ditampilkan per isian teks dengan
// labelnya, bisa disunting selama masih menunggu (edit-wa), lalu disetujui atau ditolak.
// Respons cerita dan baris berpenanda perlu ahli wajib dicentang "sudah ditinjau psikolog"
// sebelum tombol setujui menyala; server menolak persetujuan tanpa centang itu.

const LABEL_CAKUPAN = {
  lembaga: 'Narasi lembaga', jenjang: 'Narasi jenjang', unit: 'Narasi unit', kelompok_jabatan: 'Narasi kelompok jabatan',
  individu: 'Laporan pribadi pegawai', respons_cerita: 'Respons untuk cerita pegawai',
};

const LABEL_KUNCI = {
  ringkasan: 'Ringkasan', wellbeing: 'Wellbeing', kepuasan: 'Kepuasan', survey: 'Survey', testimoni: 'Testimoni', tema: 'Tema',
  insight: 'Temuan', tindak_lanjut: 'Tindak lanjut', tema_cerita: 'Tema cerita', langkah_kecil: 'Langkah kecil',
  refleksi: 'Refleksi', draf: 'Isi respons', hal_baik: 'Hal baik', hal_ditingkatkan: 'Hal yang ditingkatkan',
  hal_kuat: 'Hal kuat', hal_tantangan: 'Tantangan', resume_kuat: 'Resume kuat', resume_lemah: 'Resume lemah',
  fokus_kekuatan: 'Fokus kekuatan', perbaikan_segera: 'Perbaikan segera', narasi: 'Narasi', judul: 'Judul', isi: 'Isi',
  bukti: 'Bukti', mengapa: 'Mengapa', langkah: 'Langkah', indikator: 'Indikator', alasan: 'Alasan', ringkasan_tema: 'Ringkasan',
};

function labelJalur(jalur) {
  return jalur.split('.').map((k) => (/^\d+$/.test(k) ? `#${Number(k) + 1}` : (LABEL_KUNCI[k] || k.replace(/_/g, ' ')))).join(' · ');
}

function setJalur(obj, jalur, nilai) {
  const salin = structuredClone(obj);
  const bagian = jalur.split('.');
  let t = salin;
  for (let i = 0; i < bagian.length - 1; i++) t = t[/^\d+$/.test(bagian[i]) ? Number(bagian[i]) : bagian[i]];
  const akhir = bagian[bagian.length - 1];
  t[/^\d+$/.test(akhir) ? Number(akhir) : akhir] = nilai;
  return salin;
}

export function WaNarasiDrawer({ row, onClose, onSave, onAct }) {
  const open = Boolean(row);
  return (
    <>
      {open && <div style={{ position: 'fixed', inset: 0, background: 'rgba(33,27,46,.35)', zIndex: 40 }} onClick={onClose} />}
      {open && (
        <div className="drawer-enter" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(760px,94vw)', background: 'var(--surface-soft)', zIndex: 50, boxShadow: '-24px 0 60px rgba(33,27,46,.18)', display: 'flex', flexDirection: 'column' }}>
          <Isi key={`${row.dataset_id}|${row.cakupan}|${row.kunci}`} row={row} onClose={onClose} onSave={onSave} onAct={onAct} />
        </div>
      )}
    </>
  );
}

function Isi({ row, onClose, onSave, onAct }) {
  const [isi, setIsi] = useState(() => row.isi || {});
  const [ubah, setUbah] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [ahli, setAhli] = useState(false);
  const menunggu = row.status === 'menunggu_persetujuan';
  const isian = isianTeks(isi);
  const qc = qcNarasiWa({ ...row, isi });
  const qcPerJalur = qc.reduce((a, x) => ({ ...a, [x.jalur]: [...(a[x.jalur] || []), x.isu] }), {});

  async function simpan() {
    setSibuk(true);
    try { await onSave(row, isi); setUbah(false); } catch { /* toast sudah ditampilkan pemanggil */ } finally { setSibuk(false); }
  }

  async function aksi(jenis) {
    setSibuk(true);
    try { await onAct(row, jenis, ahli); onClose(); } catch { /* toast sudah ditampilkan pemanggil */ } finally { setSibuk(false); }
  }

  return (
    <>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--purple-700)' }}>{LABEL_CAKUPAN[row.cakupan] || row.cakupan}</div>
          <div className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>{row.nama}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
            {row.sekolah_nama}{row.unit ? ` · ${row.unit}` : ''}{row.jabatan ? ` · ${row.jabatan}` : ''}{row.n_responden ? ` · ${row.n_responden} pegawai` : ''}
          </div>
        </div>
        <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose} aria-label="Tutup"><IconX /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {row.butuh_tinjauan_ahli && (
          <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--status-warn-bg)', color: 'var(--ink)', fontSize: 12.5, lineHeight: 1.5 }}>
            <b style={{ color: 'var(--status-warn)' }}>Wajib ditinjau psikolog.</b>{' '}
            {row.cakupan === 'respons_cerita' ? 'Ini jawaban untuk cerita pribadi pegawai. Hanya pegawai itu yang akan membacanya.' : 'Narasi ini ditandai perlu perhatian ahli.'}
            {row.alasan_perhatian && <div style={{ marginTop: 6 }}>Catatan pengolah: <i>{row.alasan_perhatian}</i></div>}
          </div>
        )}
        {qc.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[...new Set(qc.map((x) => x.isu))].map((k) => (
              <span key={k} className="pill" style={{ background: 'var(--status-warn-bg)', color: 'var(--status-warn)' }}>⚠ {LABEL_ISU_QC[k] || k}</span>
            ))}
          </div>
        )}
        {row.disunting && <span className="pill" style={{ alignSelf: 'flex-start', background: 'var(--purple-050)', color: 'var(--purple-700)' }}>Sudah disunting admin</span>}

        {isian.map(({ jalur, nilai }) => (
          <div key={jalur} style={{ padding: '11px 13px', background: 'var(--surface)', borderRadius: 12, boxShadow: '0 2px 8px rgba(33,27,46,.05)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{labelJalur(jalur)}</span>
              {(qcPerJalur[jalur] || []).map((k) => <span key={k} title={LABEL_ISU_QC[k]} style={{ fontSize: 11, color: 'var(--status-warn)' }}>⚠</span>)}
            </div>
            {ubah ? (
              <textarea className="fld" rows={Math.min(8, Math.max(2, Math.ceil(nilai.length / 90)))} value={nilai} onChange={(e) => setIsi((x) => setJalur(x, jalur, e.target.value))} style={{ width: '100%', fontSize: 13, lineHeight: 1.55 }} />
            ) : (
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{nilai || <span style={{ color: 'var(--ink-4)' }}>(kosong)</span>}</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: '14px 22px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--surface)' }}>
        {menunggu && row.butuh_tinjauan_ahli && (
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: 'var(--ink)', cursor: 'pointer' }}>
            <input type="checkbox" checked={ahli} onChange={(e) => setAhli(e.target.checked)} style={{ marginTop: 2 }} />
            Isi ini sudah ditinjau psikolog dan layak dibaca pegawai.
          </label>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {menunggu && (ubah ? (
            <>
              <button className="btn-ghost" disabled={sibuk} onClick={() => { setIsi(row.isi || {}); setUbah(false); }}>Batal</button>
              <button className="btn-primary" disabled={sibuk} onClick={simpan}>{sibuk ? 'Menyimpan…' : 'Simpan perubahan'}</button>
            </>
          ) : (
            <button className="btn-secondary" disabled={sibuk} onClick={() => setUbah(true)}>✎ Sunting</button>
          ))}
          <div style={{ flex: 1 }} />
          {menunggu && !ubah && (
            <>
              <button className="btn-secondary" disabled={sibuk} onClick={() => aksi('tolak')}>Tolak</button>
              <button className="btn-primary" style={{ background: 'var(--status-safe)' }} disabled={sibuk || (row.butuh_tinjauan_ahli && !ahli)} onClick={() => aksi('setuju')}>
                {sibuk ? '…' : 'Setujui & tayangkan'}
              </button>
            </>
          )}
          {!menunggu && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Status: {row.status === 'disetujui' ? 'sudah tayang' : 'ditolak'}</span>}
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { useCms } from '../store/CmsStore';
import { LoadingCards } from '../components/LoadingCards';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Toggle } from '../components/StatusPill';
import { IconMoreVertical } from '../components/icons';

const MODULES = ['karakter', 'mi', 'screening'];

export function Sekolah() {
  const { data, loading, error, setAddSchoolOpen, setAddYayasanOpen, showToast, isModuleOn, toggleModule, refetch } = useCms();
  const [expanded, setExpanded] = useState(null);

  if (loading) return <LoadingCards rows={4} />;
  if (error) {
    return <ErrorState title="Gagal memuat sekolah" desc={error} cta="Muat ulang" onCta={refetch} />;
  }
  if (data.sekolah.length === 0) {
    return <EmptyState title="Belum ada sekolah" desc="Tambahkan sekolah pertama untuk mulai." cta="Tambah sekolah" onCta={() => setAddSchoolOpen(true)} />;
  }

  const expandedSekolah = expanded ? data.sekolah.find(s => s.id === expanded) : null;

  return (
    <div style={{ padding: '22px 26px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => showToast('Ekspor belum tersedia di v1', 'info')}>Ekspor</button>
          <button className="btn-secondary" onClick={() => setAddYayasanOpen(true)}>+ Tambah yayasan</button>
          <button className="btn-primary" onClick={() => setAddSchoolOpen(true)}>+ Tambah sekolah</button>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Sekolah</th>
                <th>Yayasan</th>
                <th>Jenjang</th>
                <th>Karakter</th>
                <th>MI</th>
                <th>Screening</th>
                <th>Aspek config</th>
                <th>Aktif</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {data.sekolah.map(k => (
                <SekolahRow
                  key={k.id}
                  k={k}
                  yayNama={data.yayasan.find(y => y.id === k.yay)?.nama}
                  isModuleOn={isModuleOn}
                  toggleModule={toggleModule}
                  onExpand={() => setExpanded(cur => cur === k.id ? null : k.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {expandedSekolah && (
        <div className="card" style={{ padding: '22px 24px', marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Konfigurasi Aspek Karakter — {expandedSekolah.nama}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>karakter_aspek_config · custom per sekolah, sinkron ke laporan siswa/wali/kepsek</div>
            </div>
          </div>
          {!expandedSekolah.aspekConfig || expandedSekolah.aspekConfig.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Belum ada konfigurasi aspek untuk sekolah ini.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {expandedSekolah.aspekConfig.map((a, i) => (
                <div key={i} style={{ padding: '11px 13px', background: 'var(--surface-soft)', borderRadius: 11, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>{a.aspek_label}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }}>{a.aspek_kode}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SekolahRow({ k, yayNama, isModuleOn, toggleModule, onExpand }) {
  return (
    <tr className="hover-row">
      <td>
        <div style={{ fontWeight: 700 }}>{k.nama}</div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{k.id}</div>
      </td>
      <td style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{yayNama ? yayNama.replace('Yayasan ', '') : <span style={{ color: 'var(--ink-4)' }}>Mandiri</span>}</td>
      <td style={{ fontSize: 12.5 }}>{k.jenjang}</td>
      {MODULES.map(m => {
        const on = isModuleOn(k, m);
        return <td key={m}><Toggle on={on} onClick={() => toggleModule(k.id, m, on)} /></td>;
      })}
      <td>
        {k.modules.includes('karakter')
          ? <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 11.5 }} onClick={onExpand}>⚙ Lihat aspek</button>
          : <span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>—</span>}
      </td>
      <td>
        {k.aktif
          ? <span className="pill" style={{ background: 'var(--status-safe-bg)', color: 'var(--status-safe)' }}><span className="dot" style={{ background: 'var(--status-safe)' }} />Aktif</span>
          : <span className="pill" style={{ background: '#F0F0F4', color: 'var(--ink-3)' }}><span className="dot" style={{ background: 'var(--ink-4)' }} />Nonaktif</span>}
      </td>
      <td style={{ textAlign: 'right' }}><IconMoreVertical size={14} stroke="#7C7689" /></td>
    </tr>
  );
}

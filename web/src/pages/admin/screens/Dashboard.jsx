import { useCms } from '../store/CmsStore';
import { LoadingCards } from '../components/LoadingCards';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { StatusPill } from '../components/StatusPill';
import { moduleColor, moduleLabel, moduleShort, statusColor } from '../data/helpers';
import { IconChevronRight, IconPlus } from '../components/icons';

export function Dashboard() {
  const { data, loading, error, setScreen, setAddSchoolOpen, refetch } = useCms();

  if (loading) return <LoadingCards rows={4} />;
  if (error) {
    return <ErrorState title="Gagal memuat ringkasan sekolah" desc={error} cta="Coba lagi" onCta={refetch} />;
  }

  const s = data.sekolah;
  if (s.length === 0) {
    return <EmptyState title="Belum ada sekolah aktif" desc="Tambahkan sekolah pertama untuk mulai mengelola data." cta="Tambah sekolah" onCta={() => setAddSchoolOpen(true)} />;
  }

  const totalPending = data.antrian.length;
  const totalErr = data.uploadHistory.filter(u => u.status === 'gagal').length;
  const totalGap = s.filter(k => k.gap !== 'none').length;
  const countModule = (m) => s.filter(k => k.modules.includes(m)).length;
  const countActiveModules = s.reduce((a, k) => a + k.modules.length, 0);

  const kpis = [
    { icon: '🏫', label: 'Sekolah aktif', value: s.length, sub: `${s.filter(k => k.gap === 'none').length} lengkap · ${totalGap} ada gap`, ink: 'var(--ink)', bg: '#fff' },
    { icon: '⏳', label: 'Menunggu persetujuan', value: totalPending, sub: `${data.antrian.filter(a => a.prioritas === 'tinggi').length} prioritas tinggi`, ink: 'var(--status-warn)', bg: '#FAF1DC' },
    { icon: '⚠️', label: 'Error import 7 hari', value: totalErr, sub: totalErr > 0 ? 'Cek riwayat upload' : 'Semua import lancar', ink: 'var(--status-alert)', bg: '#FBE7EA' },
    { icon: '📊', label: 'Modul aktif tercatat', value: countActiveModules, sub: `Karakter ${countModule('karakter')} · MI ${countModule('mi')} · Screening ${countModule('screening')}`, ink: 'var(--purple-700)', bg: 'var(--purple-050)' },
  ];

  const sortedSekolah = [...s].sort((a, b) =>
    (b.pendingCount + (b.gap !== 'none' ? 100 : 0) + (b.err ? 200 : 0)) -
    (a.pendingCount + (a.gap !== 'none' ? 100 : 0) + (a.err ? 200 : 0))
  );

  const quickActions = [
    { i: '📤', l: 'Upload Excel', dst: 'upload', ink: 'var(--purple-700)', bg: 'var(--purple-050)' },
    { i: '✓', l: `Tinjau ${totalPending} draf`, dst: 'antrian', ink: 'var(--status-warn)', bg: 'var(--status-warn-bg)' },
    { i: '⚡', l: 'Trigger Gemini', dst: 'gemini', ink: 'var(--info)', bg: 'var(--info-soft)' },
    { i: '👤', l: 'Tambah pengguna', dst: 'pengguna', ink: 'var(--status-safe)', bg: 'var(--status-safe-bg)' },
  ];

  return (
    <div style={{ padding: '22px 26px 40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} className="card lift" style={{ padding: '18px 20px', background: k.bg, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ fontSize: 22 }}>{k.icon}</div>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: k.ink, opacity: 0.7 }}>{k.label}</div>
            </div>
            <div className="disp" style={{ fontSize: 32, fontWeight: 700, color: k.ink, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6, fontWeight: 500 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: '6px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px 12px' }}>
            <div>
              <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Semua Sekolah</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Urutkan · prioritas tertinggi di atas (ada gap atau pending banyak)</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-primary" onClick={() => setAddSchoolOpen(true)}><IconPlus size={14} />Tambah sekolah</button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Sekolah</th>
                  <th>Yayasan</th>
                  <th>Modul aktif</th>
                  <th>Periode</th>
                  <th>Status data</th>
                  <th style={{ textAlign: 'right' }}>Menunggu</th>
                  <th style={{ textAlign: 'right', width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {sortedSekolah.map(k => {
                  const gapLabel = k.gap === 'gap'
                    ? { label: 'Ada gap', bg: 'var(--status-alert-bg)', ink: 'var(--status-alert)' }
                    : k.gap === 'periode'
                      ? { label: 'Periode tertinggal', bg: 'var(--status-warn-bg)', ink: 'var(--status-warn)' }
                      : { label: 'Lengkap', bg: 'var(--status-safe-bg)', ink: 'var(--status-safe)' };
                  const yay = data.yayasan.find(y => y.id === k.yay);
                  return (
                    <tr key={k.id} className="hover-row row-clk" onClick={() => setScreen('sekolah')}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{k.nama}</div>
                        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{k.id} · {k.jenjang}</div>
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{yay ? yay.nama.replace('Yayasan ', '') : <span style={{ color: 'var(--ink-4)' }}>Mandiri</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {k.modules.map(m => {
                            const mc = moduleColor(m);
                            return <span key={m} className="pill" style={{ background: mc.bg, color: mc.ink }}>{moduleShort(m)}</span>;
                          })}
                        </div>
                      </td>
                      <td className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{k.periode || '—'}</td>
                      <td><StatusPill bg={gapLabel.bg} ink={gapLabel.ink} dot={gapLabel.ink}>{gapLabel.label}</StatusPill></td>
                      <td style={{ textAlign: 'right' }}>
                        {k.pendingCount > 0
                          ? <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--status-warn)' }}>{k.pendingCount}</span>
                          : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}><IconChevronRight size={14} stroke="#7C7689" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 20 }}>
            <div className="disp" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>Aksi cepat</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {quickActions.map((a, i) => (
                <button key={i} className="clk lift" onClick={() => setScreen(a.dst)} style={{ padding: '12px 14px', background: a.bg, borderRadius: 12, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer' }}>
                  <div style={{ fontSize: 19 }}>{a.i}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: a.ink, lineHeight: 1.2 }}>{a.l}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="disp" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Aktivitas terbaru</div>
              <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 11.5 }} onClick={() => setScreen('upload')}>Lihat semua</button>
            </div>
            {data.uploadHistory.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Belum ada aktivitas upload.</p>
            ) : (
              <div>
                {data.uploadHistory.slice(0, 6).map((h, i, arr) => {
                  const st = statusColor(h.status);
                  return (
                    <div key={h.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none' }}>
                      <div className="dot" style={{ background: st.dot, marginTop: 6 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 700 }}>Upload {moduleLabel(h.modul)}</span>
                          {' · '}
                          <span>{h.sekolah}</span>
                          {h.status === 'sukses' && h.rows > 0 && <span style={{ color: 'var(--ink-3)' }}> · {h.rows} baris</span>}
                        </div>
                        {h.pesan && h.status !== 'sukses' && (
                          <div style={{ fontSize: 11.5, color: h.status === 'gagal' ? 'var(--status-alert)' : 'var(--status-warn)', marginTop: 2 }}>⚠ {h.pesan}</div>
                        )}
                        <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 3 }}>{h.when} · {h.by}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

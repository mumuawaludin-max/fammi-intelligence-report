import { useCms } from '../store/CmsStore';
import { IconDash, IconCheck, IconUpload, IconSpark, IconSchool, IconUser, IconLogOut } from './icons';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', Icon: IconDash, badge: null },
  { key: 'antrian', label: 'Antrian Persetujuan', Icon: IconCheck, badge: 'dynamic' },
  { key: 'persetujuan-mi', label: 'Persetujuan MI', Icon: IconCheck, badge: null },
  { key: 'upload', label: 'Upload Data', Icon: IconUpload, badge: null },
  { key: 'gemini', label: 'Trigger & Gemini', Icon: IconSpark, badge: null },
  { key: 'sekolah', label: 'Sekolah & Modul', Icon: IconSchool, badge: null },
  { key: 'pengguna', label: 'Pengguna & Peran', Icon: IconUser, badge: null },
];

export function Sidebar({ session, onLogout }) {
  const { data, state, setScreen } = useCms();
  const totalPending = data.antrian.length;
  const initials = (session.nama || session.username || '?').trim().split(' ').slice(0, 2).map(x => x[0]).join('').toUpperCase();

  return (
    <aside style={{ background: 'var(--surface)', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', padding: '22px 14px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 22px', marginBottom: 6, borderBottom: '1px solid var(--line)' }}>
        <img src="/logo-purple.png" alt="Fammi" style={{ height: 26, width: 'auto', display: 'block', flexShrink: 0 }} />
        <div style={{ flex: 1, borderLeft: '1px solid var(--line)', marginLeft: 2, paddingLeft: 10 }}>
          <div style={{ fontSize: 10.5, color: 'var(--purple-700)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 800 }}>Admin CMS</div>
          <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1 }}>Internal</div>
        </div>
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', padding: '12px 12px 6px' }}>Ruang kerja</div>

      {NAV.map(n => {
        const active = state.screen === n.key;
        const badge = n.badge === 'dynamic' ? (totalPending > 0 ? String(totalPending) : null) : n.badge;
        return (
          <button
            key={n.key}
            className="clk"
            onClick={() => setScreen(n.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11,
              background: active ? 'var(--purple-050)' : 'transparent',
              color: active ? 'var(--purple-700)' : 'var(--ink-2)',
              fontWeight: active ? 700 : 600, fontSize: 13.5, textAlign: 'left', marginBottom: 2, width: '100%',
            }}
          >
            <span style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: active ? 'var(--purple-600)' : 'var(--ink-3)' }}>
              <n.Icon />
            </span>
            <span style={{ flex: 1 }}>{n.label}</span>
            {badge && (
              <span className="pill" style={{ background: active ? 'var(--purple-600)' : 'var(--purple-100)', color: active ? '#fff' : 'var(--purple-700)', padding: '1px 7px', fontSize: 10.5 }}>
                {badge}
              </span>
            )}
          </button>
        );
      })}

      <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderRadius: 11 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--purple-100)', color: 'var(--purple-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: 14 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.nama || session.username}</div>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{session.username}</div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} title="Keluar" onClick={onLogout}>
            <IconLogOut />
          </button>
        </div>
      </div>
    </aside>
  );
}

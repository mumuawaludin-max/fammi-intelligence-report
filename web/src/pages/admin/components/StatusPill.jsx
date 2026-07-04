export function StatusPill({ bg, ink, dot, children }) {
  return (
    <span className="pill" style={{ background: bg, color: ink }}>
      {dot && <span className="dot" style={{ background: dot }} />}
      {children}
    </span>
  );
}

export function Toggle({ on, onClick }) {
  return (
    <div className="clk" onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 32, height: 18, borderRadius: 99,
        background: on ? 'var(--purple-600)' : 'var(--surface-soft)',
        boxShadow: on ? '0 2px 6px rgba(99,35,218,.28)' : 'inset 0 0 0 1px var(--line)',
        position: 'relative', cursor: 'pointer', transition: '.2s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: on ? 16 : 2,
          width: 14, height: 14, borderRadius: '50%', background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,.15)', transition: '.2s',
        }} />
      </div>
    </div>
  );
}

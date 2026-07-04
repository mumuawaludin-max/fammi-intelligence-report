export function ChipRow({ label, options, current, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {options.map(o => {
          const active = o.key === current;
          return (
            <button
              key={o.key}
              className="clk"
              onClick={() => onChange(o.key)}
              style={{
                padding: '5px 11px',
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 700,
                background: active ? (o.color ? o.color.bg : 'var(--purple-100)') : 'transparent',
                color: active ? (o.color ? o.color.ink : 'var(--purple-700)') : 'var(--ink-3)',
                boxShadow: active ? 'none' : 'inset 0 0 0 1px var(--line)',
                transition: '.14s',
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LoadingCards({ rows = 4 }) {
  return (
    <div style={{ padding: '22px 26px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: '20px 22px', height: 110 }}>
            <div className="skeleton" style={{ width: '40%', height: 12, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: '60%', height: 26, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '80%', height: 10 }} />
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: '20px 22px' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: i < rows - 1 ? '1px solid var(--line)' : 'none' }}>
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 9 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '40%', height: 12, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: '70%', height: 10 }} />
            </div>
            <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 99 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

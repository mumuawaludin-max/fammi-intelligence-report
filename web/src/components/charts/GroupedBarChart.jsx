/**
 * GroupedBarChart — bar chart per kategori (mis. aspek karakter), tiap kategori
 * punya beberapa bar berwarna beda per entitas (kelas/sekolah). Dipakai untuk
 * perbandingan lebih dari 3-4 entitas, di mana radar overlay mulai berantakan.
 *
 * categories: [{ key, label }]
 * series: [{ name, color, values: { [categoryKey]: number 0-100 } }]
 */
export default function GroupedBarChart({ categories = [], series = [] }) {
  if (categories.length === 0 || series.length === 0) return null;

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {categories.map((cat) => (
          <div key={cat.key}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}>{cat.label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {series.map((s, i) => {
                const v = s.values[cat.key] ?? 0;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 88, fontSize: 11, color: "var(--ink-3)", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.name}
                    </span>
                    <div style={{ flex: 1, height: 10, borderRadius: 99, background: "var(--surface-soft, #F1ECE3)", position: "relative", overflow: "hidden" }}>
                      <div style={{ width: `${Math.max(0, Math.min(100, v))}%`, height: "100%", borderRadius: 99, background: s.color }} />
                    </div>
                    <span style={{ width: 34, fontSize: 11, fontWeight: 700, color: "var(--ink-2)", textAlign: "right", flexShrink: 0 }}>
                      {v}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
        {series.map((s, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--ink-3)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block" }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

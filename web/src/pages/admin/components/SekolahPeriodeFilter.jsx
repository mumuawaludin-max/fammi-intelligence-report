const LABEL_STYLE = {
  fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
  color: 'var(--ink-3)', marginBottom: 6, display: 'block',
};
const CHECK_LABEL = {
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
  color: 'var(--ink-2)', cursor: 'pointer', padding: '5px 10px', borderRadius: 8,
  background: 'var(--surface-soft)',
};

/**
 * Yayasan (dropdown, opsional) -> Sekolah (dropdown) -> Periode (checkbox multi-pilih).
 * Checkbox periode baru muncul begitu sekolah SPESIFIK dipilih (bukan "Semua sekolah") --
 * daftar periode tergantung sekolah mana, jadi menampilkannya lebih awal cuma membingungkan.
 * "Semua periode" adalah shortcut, bukan checkbox terpisah dari yang lain -- checked kalau
 * seluruh periode yang tersedia sedang tercentang.
 */
export function SekolahPeriodeFilter({
  showYayasan, yayasanOptions, sekolahOptions, periodeOptions,
  filter, onYayasanChange, onSekolahChange, onPeriodeChange,
}) {
  const selectedSet = filter.periode === 'all'
    ? new Set(periodeOptions.map((p) => p.key))
    : new Set(filter.periode);
  const allChecked = periodeOptions.length > 0 && selectedSet.size === periodeOptions.length;

  function togglePeriode(key, checked) {
    const next = new Set(selectedSet);
    if (checked) next.add(key); else next.delete(key);
    onPeriodeChange(next.size === periodeOptions.length ? 'all' : Array.from(next));
  }

  return (
    <div className="card" style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
      {showYayasan && (
        <div>
          <label style={LABEL_STYLE}>Yayasan</label>
          <select className="fld" style={{ minWidth: 200 }} value={filter.yayasan} onChange={(e) => onYayasanChange(e.target.value)}>
            {yayasanOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>
      )}
      <div>
        <label style={LABEL_STYLE}>Sekolah</label>
        <select className="fld" style={{ minWidth: 220 }} value={filter.sekolah} onChange={(e) => onSekolahChange(e.target.value)}>
          {sekolahOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </div>
      {filter.sekolah !== 'all' && (
        <div style={{ flex: 1, minWidth: 240 }}>
          <label style={LABEL_STYLE}>Periode</label>
          {periodeOptions.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Tidak ada periode untuk sekolah ini.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <label style={{ ...CHECK_LABEL, background: allChecked ? 'var(--purple-100)' : 'var(--surface-soft)', color: allChecked ? 'var(--purple-700)' : 'var(--ink-2)' }}>
                <input type="checkbox" checked={allChecked} onChange={(e) => onPeriodeChange(e.target.checked ? 'all' : [])} />
                Semua periode
              </label>
              {periodeOptions.map((p) => {
                const checked = selectedSet.has(p.key);
                return (
                  <label key={p.key} style={{ ...CHECK_LABEL, background: checked ? 'var(--purple-100)' : 'var(--surface-soft)', color: checked ? 'var(--purple-700)' : 'var(--ink-2)' }}>
                    <input type="checkbox" checked={checked} onChange={(e) => togglePeriode(p.key, e.target.checked)} />
                    {p.label}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

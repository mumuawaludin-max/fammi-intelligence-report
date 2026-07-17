import { IconX } from './icons';

// Preview isi lengkap laporan MI hasil generate Gemini, dibaca dari kolom mi_hasil.detail
// (jsonb, output penuh miPipeline.ts buildOutputRow_). Read-only -- ini alat review admin
// sebelum approve, bukan tampilan final ke siswa (itu BakatView di web/src/pages/siswa).
// Field mengikuti persis nama kolom di miPipeline.ts, lihat komentar "Kolom BakatView bagian
// N" di sana untuk peta lengkapnya.

const MI_TOP_ORDER = [1, 2, 3];

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8, display: 'block' }}>
        {title}
      </label>
      {children}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ padding: '13px 15px', background: 'var(--surface)', borderRadius: 14, boxShadow: '0 2px 10px rgba(33,27,46,.06)', ...style }}>
      {children}
    </div>
  );
}

function Prose({ text }) {
  if (!text) return <span style={{ color: 'var(--ink-4)' }}>—</span>;
  return <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{text}</div>;
}

const SKOR_FIELDS = [
  ['r_inter', 'pred_inter', 'Interpersonal'],
  ['r_intra', 'pred_intra', 'Intrapersonal'],
  ['r_kines', 'pred_kines', 'Kinestetik'],
  ['r_linguistik', 'pred_linguistik', 'Linguistik'],
  ['r_logmat', 'pred_logmat', 'Logika-Matematika'],
  ['r_musikal', 'pred_musikal', 'Musikal'],
  ['r_naturalis', 'pred_naturalis', 'Naturalis'],
  ['r_spasial', 'pred_spasial', 'Spasial'],
];

function SkorGrid({ d }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
      {SKOR_FIELDS.map(([scoreKey, levelKey, label]) => (
        <div key={scoreKey} style={{ padding: '10px 11px', background: 'var(--surface)', borderRadius: 12, boxShadow: '0 2px 8px rgba(33,27,46,.05)' }}>
          <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 700, marginBottom: 3 }}>{label}</div>
          <div className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{d[scoreKey] ?? '—'}</div>
          <div style={{ fontSize: 10.5, color: 'var(--purple-700)', fontWeight: 700, marginTop: 2 }}>{d[levelKey] || '—'}</div>
        </div>
      ))}
    </div>
  );
}

function TopIntelCard({ d, n }) {
  const nama = d[`top_${n}`];
  if (!nama) return null;
  const lakukan = String(d[`top_${n}_lakukan`] || '').split('\n').filter(Boolean);
  const profesi = String(d[`top_${n}_profesi`] || '').split('\n').filter(Boolean);
  const terlihat = String(d[`top_${n}_terlihat`] || '').split('\n').filter(Boolean);
  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span className="pill" style={{ background: 'var(--purple-050)', color: 'var(--purple-700)' }}>Top {n}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{nama}</span>
      </div>
      {d[`top_${n}_arti`] && <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 8 }}>{d[`top_${n}_arti`]}</div>}
      {d[`top_${n}_jaga`] && (
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 8 }}>
          <strong style={{ color: 'var(--status-warn)' }}>Perlu dijaga:</strong> {d[`top_${n}_jaga`]}
        </div>
      )}
      {lakukan.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 4 }}>YANG BISA DILAKUKAN</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {lakukan.map((l, i) => <li key={i} style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>{l}</li>)}
          </ul>
        </div>
      )}
      {terlihat.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 4 }}>TANDA-TANDANYA</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {terlihat.map((l, i) => <li key={i} style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>{l}</li>)}
          </ul>
        </div>
      )}
      {profesi.length > 0 && (
        <div style={{ marginBottom: d[`top_${n}_jurusan`] || d[`top_${n}_parenttip`] ? 8 : 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 4 }}>PROFESI</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {profesi.map((p, i) => <span key={i} className="pill" style={{ background: 'var(--surface-soft)', color: 'var(--ink-2)', fontSize: 11 }}>{p}</span>)}
          </div>
        </div>
      )}
      {d[`top_${n}_jurusan`] && (
        <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 6 }}>
          <strong style={{ color: 'var(--purple-700)' }}>Jurusan:</strong> {d[`top_${n}_jurusan`]}
        </div>
      )}
      {d[`top_${n}_parenttip`] && (
        <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 6 }}>
          <strong style={{ color: 'var(--purple-700)' }}>Tip untuk orang tua:</strong> {d[`top_${n}_parenttip`]}
        </div>
      )}
      {d[`top_${n}_profesi_sorot`] && (
        <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--surface-soft)', borderRadius: 10 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>🔎 Sorot profesi: {d[`top_${n}_profesi_sorot`]}</div>
          {d[`top_${n}_profesi_sorot_desc`] && <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 3, lineHeight: 1.5 }}>{d[`top_${n}_profesi_sorot_desc`]}</div>}
        </div>
      )}
      {d[`top_${n}_profesi_detail`] && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ fontSize: 11, color: 'var(--purple-700)', cursor: 'pointer', fontWeight: 700 }}>Data profesi mentah (dari Gemini)</summary>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'pre-wrap', marginTop: 6, lineHeight: 1.5 }}>{d[`top_${n}_profesi_detail`]}</div>
        </details>
      )}
    </Card>
  );
}

function NumberedList({ items }) {
  const valid = items.filter((x) => x && (x.title || x.body || typeof x === 'string'));
  if (valid.length === 0) return <span style={{ color: 'var(--ink-4)' }}>—</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {valid.map((it, i) => (
        <div key={i} style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
          {typeof it === 'string' ? it : (
            <>{it.title && <strong style={{ color: 'var(--ink)' }}>{it.title}. </strong>}{it.body}</>
          )}
        </div>
      ))}
    </div>
  );
}

export function MiDetailDrawer({ row, onClose }) {
  const open = !!row;
  const d = row?.detail || {};

  const caraBelajar = [1, 2, 3, 4, 5].map((i) => ({ title: d[`cara_belajar_${i}_title`], body: d[`cara_belajar_${i}_body`] }));
  const hari = [1, 2, 3, 4, 5, 6, 7].map((i) => d[`hari_${i}`]).filter(Boolean);
  const sinyal = [1, 2, 3, 4, 5].map((i) => ({ icon: d[`sinyal_${i}_icon`], title: d[`sinyal_${i}_title`], body: d[`sinyal_${i}_body`] })).filter((s) => s.title || s.body);
  const refleksi = [1, 2, 3, 4].map((i) => d[`refleksi_${i}`]).filter(Boolean);
  const diskusi = [1, 2, 3, 4].map((i) => d[`diskusi_${i}`]).filter(Boolean);
  const cirikhas = [1, 2, 3, 4].map((i) => d[`ciri_khas_${i}`]).filter(Boolean);
  const essayEntries = Object.keys(d).filter((k) => k.startsWith('essay_') && d[k]);

  return (
    <>
      {open && <div style={{ position: 'fixed', inset: 0, background: 'rgba(33,27,46,.35)', zIndex: 40 }} onClick={onClose} />}
      {open && (
        <div className="drawer-enter" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(760px,94vw)', background: 'var(--surface-soft)', zIndex: 50, boxShadow: '-24px 0 60px rgba(33,27,46,.18)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 26px 16px', borderBottom: '1px solid var(--line)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span className="pill" style={{ background: '#E5EBF7', color: '#3B5A9E' }}>MI</span>
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--ink-3)' }}>{String(row?.id || '').slice(0, 8)}</span>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}><IconX size={16} /></button>
            </div>
            <div className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{row?.nama_siswa || row?.murid_id}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{row?.kelas_id} · {row?.periode_id}</div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '20px 26px' }}>
            <Section title="Skor 8 kecerdasan"><SkorGrid d={d} /></Section>

            <Section title="Top 3 kecerdasan dominan">
              {MI_TOP_ORDER.map((n) => <TopIntelCard key={n} d={d} n={n} />)}
            </Section>

            <Section title="Narasi hero">
              <Card><Prose text={d.narasi_hero} /></Card>
            </Section>

            <Section title="Narasi kombinasi">
              <Card><Prose text={d.narasi_kombinasi} /></Card>
            </Section>

            <Section title="Narasi profil lengkap">
              <Card><Prose text={d.narasi_profil_final} /></Card>
            </Section>

            {(d.cara_belajar_summary || caraBelajar.some((c) => c.title || c.body)) && (
              <Section title="Cara belajar">
                <Card>
                  {d.cara_belajar_summary && <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 10, lineHeight: 1.55 }}>{d.cara_belajar_summary}</div>}
                  <NumberedList items={caraBelajar} />
                </Card>
              </Section>
            )}

            {cirikhas.length > 0 && (
              <Section title="Ciri khas">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {cirikhas.map((c, i) => <span key={i} className="pill" style={{ background: 'var(--purple-050)', color: 'var(--purple-700)' }}>{c}</span>)}
                </div>
              </Section>
            )}

            {(d.mapel_sulit_1 || d.mapel_sulit_2) && (
              <Section title="Mapel yang dirasa sulit">
                <Card>
                  {d.mapel_sulit_1 && <div style={{ fontSize: 12.5, marginBottom: 4 }}><strong>{d.mapel_sulit_1}</strong>{d.mapel_sulit_1_desc ? ` — ${d.mapel_sulit_1_desc}` : ''}</div>}
                  {d.mapel_sulit_2 && <div style={{ fontSize: 12.5, marginBottom: 8 }}><strong>{d.mapel_sulit_2}</strong>{d.mapel_sulit_2_desc ? ` — ${d.mapel_sulit_2_desc}` : ''}</div>}
                  {d.mapel_sulit_narasi_final && <Prose text={d.mapel_sulit_narasi_final} />}
                </Card>
              </Section>
            )}

            {(d.smart_s || d.smart_m || d.smart_a || d.smart_r || d.smart_t) && (
              <Section title="SMART goals">
                <Card>
                  {[['S', d.smart_s], ['M', d.smart_m], ['A', d.smart_a], ['R', d.smart_r], ['T', d.smart_t]].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 6 }}><strong style={{ color: 'var(--purple-700)' }}>{k}:</strong> {v}</div>
                  ))}
                </Card>
              </Section>
            )}

            {hari.length > 0 && (
              <Section title="Rencana 7 hari">
                <Card>
                  <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {hari.map((h, i) => <li key={i} style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{h}</li>)}
                  </ol>
                </Card>
              </Section>
            )}

            {sinyal.length > 0 && (
              <Section title="Sinyal untuk orang tua">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sinyal.map((s, i) => (
                    <Card key={i}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>{s.icon} {s.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>{s.body}</div>
                    </Card>
                  ))}
                </div>
              </Section>
            )}

            {(refleksi.length > 0 || diskusi.length > 0) && (
              <Section title="Refleksi & diskusi">
                <Card>
                  {refleksi.length > 0 && (
                    <div style={{ marginBottom: diskusi.length > 0 ? 10 : 0 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 4 }}>REFLEKSI</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>{refleksi.map((r, i) => <li key={i} style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>{r}</li>)}</ul>
                    </div>
                  )}
                  {diskusi.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 4 }}>DISKUSI DENGAN ORANG TUA</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>{diskusi.map((r, i) => <li key={i} style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>{r}</li>)}</ul>
                    </div>
                  )}
                </Card>
              </Section>
            )}

            {essayEntries.length > 0 && (
              <Section title="Jawaban esai siswa">
                <Card>
                  {essayEntries.map((k) => (
                    <div key={k} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 3 }}>{k.replace('essay_', '').replace(/_/g, ' ').toUpperCase()}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{d[k]}</div>
                    </div>
                  ))}
                </Card>
              </Section>
            )}
          </div>
        </div>
      )}
    </>
  );
}

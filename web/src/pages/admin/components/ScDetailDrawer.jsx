import { useState } from 'react';
import { IconX } from './icons';

// Preview isi lengkap laporan individu School Culture hasil generate Gemini, dibaca dari kolom
// sc_hasil.detail (jsonb, struktur LaporanIndividuSC -- lihat web/src/pages/sc/sc.types.ts).
// Alat review admin sebelum approve, bukan tampilan final ke staf (itu ScLaporanIndividuPage di
// web/src/pages/sc). Pola sama dengan MiDetailDrawer.jsx, DITAMBAH Fase C: field naratif kini
// bisa disunting manual ("Simpan perubahan", lewat updateScDraftAction) dan draf bisa
// diregenerate dengan catatan reviewer (lewat regenerateScIndividuAction) tanpa menutup drawer.

const QC_ISSUE_LABEL = {
  contains_number: 'Mengandung angka',
  contains_em_dash: 'Mengandung tanda hubung ganda (em dash)',
  contains_forbidden_terms: 'Memakai istilah OCAI/akademik mentah',
  exceeds_sentence_limit: 'Kalimat terlalu panjang',
};

function QcBadges({ qcFlags }) {
  if (!Array.isArray(qcFlags) || qcFlags.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {qcFlags.map((f, i) => (
        <span
          key={i}
          className="pill"
          title={f.field}
          style={{ background: 'var(--status-warn-bg)', color: 'var(--status-warn)' }}
        >
          ⚠ {QC_ISSUE_LABEL[f.issue] || f.issue}
        </span>
      ))}
    </div>
  );
}

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

function BudayaGrid({ chartData = [], tabelGap = [] }) {
  const gapByLabel = Object.fromEntries(tabelGap.map((g) => [g.label, g]));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
      {chartData.map((c) => {
        const g = gapByLabel[c.tipe];
        return (
          <div key={c.tipe} style={{ padding: '10px 11px', background: 'var(--surface)', borderRadius: 12, boxShadow: '0 2px 8px rgba(33,27,46,.05)' }}>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 700, marginBottom: 3 }}>{c.tipe}</div>
            <div className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{c.saat_ini ?? '—'}%</div>
            <div style={{ fontSize: 10.5, color: 'var(--purple-700)', fontWeight: 700, marginTop: 2 }}>
              harapan {c.harapan ?? '—'}% {g?.nilai_gap != null ? `(${g.nilai_gap > 0 ? '+' : ''}${g.nilai_gap})` : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ItemGrid({ items = [] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
      {items.map((it) => (
        <div key={it.kode} style={{ padding: '10px 11px', background: 'var(--surface)', borderRadius: 12, boxShadow: '0 2px 8px rgba(33,27,46,.05)' }}>
          <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 700, marginBottom: 3 }}>{it.label}</div>
          <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{it.nilai ?? '—'}%</div>
          {it.kategori && <div style={{ fontSize: 10.5, color: 'var(--purple-700)', fontWeight: 700, marginTop: 2 }}>{it.kategori}</div>}
          {it.harapan != null && (
            <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 2 }}>
              harapan {it.harapan}% ({it.gap > 0 ? '+' : ''}{it.gap})
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Textarea kecil untuk field naratif yang bisa disunting -- dipakai berulang untuk
 * header/narasi/refleksi/rencana_aksi. Tidak pakai class .fld supaya tetap cocok dengan Card
 * di sekitarnya (background surface-soft, bukan surface). */
function EditableText({ value, onChange, minHeight = 60, style }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', minHeight, padding: '9px 11px', fontSize: 13, lineHeight: 1.6,
        color: 'var(--ink-2)', background: 'var(--surface-soft)', border: '1px solid var(--line)',
        borderRadius: 10, resize: 'vertical', fontFamily: 'inherit', ...style,
      }}
    />
  );
}

export function ScDetailDrawer({ row, onClose, onSave, onRegenerate }) {
  const open = !!row;
  return (
    <>
      {open && <div style={{ position: 'fixed', inset: 0, background: 'rgba(33,27,46,.35)', zIndex: 40 }} onClick={onClose} />}
      {open && (
        <div className="drawer-enter" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(760px,94vw)', background: 'var(--surface-soft)', zIndex: 50, boxShadow: '-24px 0 60px rgba(33,27,46,.18)', display: 'flex', flexDirection: 'column' }}>
          <ScDetailDrawerBody key={row.id} row={row} onClose={onClose} onSave={onSave} onRegenerate={onRegenerate} />
        </div>
      )}
    </>
  );
}

function ScDetailDrawerBody({ row, onClose, onSave, onRegenerate }) {
  const [d, setD] = useState(() => row?.detail || {});
  const [dirty, setDirty] = useState(false);
  const [busySave, setBusySave] = useState(false);
  const [catatanRegen, setCatatanRegen] = useState('');
  const [busyRegen, setBusyRegen] = useState(false);

  const meta = d.meta || {};
  const rencanaAksi = d.rencana_aksi || [];

  function patch(path, value) {
    setDirty(true);
    setD((prev) => {
      const next = structuredClone(prev);
      let obj = next;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return next;
    });
  }

  async function handleSave() {
    setBusySave(true);
    try {
      await onSave(row.id, d);
      setDirty(false);
    } finally {
      setBusySave(false);
    }
  }

  async function handleRegenerate() {
    setBusyRegen(true);
    try {
      await onRegenerate(row.sc_personal_id, catatanRegen);
    } finally {
      setBusyRegen(false);
    }
  }

  return (
    <>
      <div style={{ padding: '20px 26px 16px', borderBottom: '1px solid var(--line)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          <span className="pill" style={{ background: '#FFEBCB', color: '#8A4E00' }}>School Culture</span>
          {dirty && <span className="pill" style={{ background: 'var(--status-warn-bg)', color: 'var(--status-warn)' }}>✎ belum disimpan</span>}
          <span className="mono" style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--ink-3)' }}>{String(row?.id || '').slice(0, 8)}</span>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}><IconX size={16} /></button>
        </div>
        <div className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{meta.nama_responden || row?.sc_personal_id}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{meta.peran_kerja}{meta.unit ? ` · ${meta.unit}` : ''} · {row?.periode_id}</div>
        <QcBadges qcFlags={row?.qc_flags} />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 26px' }}>
        <Section title="Pesan pembuka">
          <Card>
            <EditableText value={d.header?.hook} onChange={(v) => patch(['header', 'hook'], v)} minHeight={44} style={{ fontWeight: 700, marginBottom: 8 }} />
            <EditableText value={d.header?.sub_hook} onChange={(v) => patch(['header', 'sub_hook'], v)} minHeight={44} />
          </Card>
        </Section>

        <Section title="Profil budaya (4 tipe)">
          <BudayaGrid chartData={d.bagian_budaya?.chart_data} tabelGap={d.bagian_budaya?.tabel_gap} />
          <div style={{ marginTop: 10 }}><EditableText value={d.bagian_budaya?.narasi} onChange={(v) => patch(['bagian_budaya', 'narasi'], v)} /></div>
        </Section>

        <Section title={`Kesejahteraan (indeks ${d.bagian_kesejahteraan?.indeks ?? '—'} · ${d.bagian_kesejahteraan?.kategori || '—'})`}>
          <ItemGrid items={d.bagian_kesejahteraan?.chart_data} />
          <div style={{ marginTop: 10 }}><EditableText value={d.bagian_kesejahteraan?.narasi} onChange={(v) => patch(['bagian_kesejahteraan', 'narasi'], v)} /></div>
        </Section>

        <Section title="Profil organisasi (6 dimensi)">
          <ItemGrid items={d.bagian_profil_organisasi?.chart_data} />
          <div style={{ marginTop: 10 }}><EditableText value={d.bagian_profil_organisasi?.narasi} onChange={(v) => patch(['bagian_profil_organisasi', 'narasi'], v)} /></div>
        </Section>

        <Section title="Refleksi">
          <Card><EditableText value={d.bagian_refleksi} onChange={(v) => patch(['bagian_refleksi'], v)} minHeight={44} /></Card>
        </Section>

        {rencanaAksi.length > 0 && (
          <Section title={`Rencana aksi (${rencanaAksi.length})`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rencanaAksi.map((a, i) => (
                <Card key={a.id}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>{a.ikon} <EditableText value={a.judul} onChange={(v) => patch(['rencana_aksi', i, 'judul'], v)} minHeight={30} style={{ display: 'inline-block', width: 'calc(100% - 28px)', fontWeight: 700 }} /></div>
                  <EditableText value={a.alasan} onChange={(v) => patch(['rencana_aksi', i, 'alasan'], v)} minHeight={44} />
                  <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4 }}>{a.terkait} · {a.jangka}</div>
                </Card>
              ))}
            </div>
          </Section>
        )}

        <Section title="Simpan atau regenerate">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn-primary" onClick={handleSave} disabled={!dirty || busySave}>
              {busySave ? 'Menyimpan…' : '💾 Simpan perubahan'}
            </button>
            <Card>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>🔄 Regenerate dengan catatan</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 8, lineHeight: 1.45 }}>
                Catatan tersimpan permanen dan otomatis dipatuhi Gemini untuk staf ini di generate berikutnya. Draf ini akan diganti seluruhnya (perubahan manual yang belum disimpan akan hilang).
              </div>
              <EditableText
                value={catatanRegen}
                onChange={setCatatanRegen}
                minHeight={54}
                style={{ marginBottom: 8 }}
              />
              <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleRegenerate} disabled={busyRegen}>
                {busyRegen ? 'Meregenerate…' : '🔄 Regenerate dengan catatan'}
              </button>
            </Card>
          </div>
        </Section>
      </div>
    </>
  );
}

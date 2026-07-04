import { useState } from 'react';
import { useCms } from '../store/CmsStore';
import { LoadingCards } from '../components/LoadingCards';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { ChipRow } from '../components/ChipRow';
import { moduleColor, moduleShort, prioritasColor, statusColor } from '../data/helpers';

export function Antrian() {
  const { data, loading, error, state, setScreen, setApprovalFilter, setSelectedApproval, actApproval, refetch } = useCms();
  const [tab, setTab] = useState('menunggu');
  const [bulkBusy, setBulkBusy] = useState(null);

  if (loading) return <LoadingCards rows={6} />;
  if (error) {
    return <ErrorState title="Gagal memuat antrian" desc={error} cta="Muat ulang" onCta={refetch} />;
  }

  const source = tab === 'menunggu' ? data.antrian : data.riwayatDisetujui;
  const f = state.approvalFilter;
  const items = source.filter(a =>
    (f.modul === 'all' || a.modul === f.modul) &&
    (f.prioritas === 'all' || a.prioritas === f.prioritas) &&
    (f.sekolah === 'all' || a.sekolah === f.sekolah)
  );

  const modulCount = { all: source.length, karakter: 0, mi: 0, screening: 0 };
  source.forEach(a => { modulCount[a.modul] = (modulCount[a.modul] || 0) + 1; });

  const prioritasCount = { all: source.length, tinggi: 0, sedang: 0, rendah: 0 };
  source.forEach(a => { prioritasCount[a.prioritas] = (prioritasCount[a.prioritas] || 0) + 1; });

  const sekolahCount = {};
  source.forEach(a => { sekolahCount[a.sekolah] = (sekolahCount[a.sekolah] || 0) + 1; });
  const sekolahOptions = [
    { key: 'all', label: `Semua (${source.length})` },
    ...data.sekolah
      .filter(s => sekolahCount[s.id])
      .map(s => ({ key: s.id, label: `${s.nama} (${sekolahCount[s.id]})` })),
  ];

  async function handleSetujuiSemua() {
    if (items.length === 0) return;
    const label = f.sekolah !== 'all' ? sekolahOptions.find(o => o.key === f.sekolah)?.label.replace(/\s*\(\d+\)$/, '') : null;
    const ok = window.confirm(
      `Setujui ${items.length} draf sekaligus${label ? ` untuk ${label}` : ''}? Semua opsi tindak lanjut/briefing di kartu yang sedang tampil (sesuai filter) langsung tayang ke sekolah.`
    );
    if (!ok) return;
    setBulkBusy({ done: 0, total: items.length });
    for (const a of items) {
      await actApproval(a.id, 'setuju');
      setBulkBusy((s) => (s ? { ...s, done: s.done + 1 } : s));
    }
    setBulkBusy(null);
  }

  return (
    <div style={{ padding: '22px 26px 40px' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center' }}>
        {[
          ['menunggu', `⏳ Menunggu (${data.antrian.length})`],
          ['disetujui', `✓ Disetujui (${data.riwayatDisetujui.length})`],
        ].map(([key, label]) => (
          <button key={key} className="clk" onClick={() => setTab(key)} style={{
            padding: '9px 16px', borderRadius: 12, fontSize: 12.5, fontWeight: 700,
            background: tab === key ? 'var(--purple-600)' : 'var(--surface)',
            color: tab === key ? '#fff' : 'var(--ink-2)',
            boxShadow: tab === key ? '0 4px 14px rgba(99,35,218,.24)' : '0 1px 4px rgba(33,27,46,.06)',
          }}>{label}</button>
        ))}
        {tab === 'menunggu' && items.length > 0 && (
          <button
            className="btn-primary"
            style={{ marginLeft: 'auto', padding: '9px 16px', fontSize: 12.5, background: 'var(--status-safe)' }}
            disabled={!!bulkBusy}
            onClick={handleSetujuiSemua}
          >
            {bulkBusy ? `Menyetujui ${bulkBusy.done}/${bulkBusy.total}…` : `✓ Setujui semua (${items.length})`}
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <ChipRow
          label="Sekolah"
          current={f.sekolah}
          onChange={(k) => setApprovalFilter({ sekolah: k })}
          options={sekolahOptions}
        />
        <div style={{ width: 1, height: 22, background: 'var(--line)' }} />
        <ChipRow
          label="Modul"
          current={f.modul}
          onChange={(k) => setApprovalFilter({ modul: k })}
          options={[
            { key: 'all', label: `Semua (${modulCount.all})` },
            { key: 'karakter', label: `Karakter (${modulCount.karakter})`, color: moduleColor('karakter') },
            { key: 'mi', label: `MI (${modulCount.mi})`, color: moduleColor('mi') },
            { key: 'screening', label: `Screening (${modulCount.screening})`, color: moduleColor('screening') },
          ]}
        />
        <div style={{ width: 1, height: 22, background: 'var(--line)' }} />
        <ChipRow
          label="Prioritas"
          current={f.prioritas}
          onChange={(k) => setApprovalFilter({ prioritas: k })}
          options={[
            { key: 'all', label: 'Semua' },
            { key: 'tinggi', label: `Tinggi (${prioritasCount.tinggi})`, color: prioritasColor('tinggi') },
            { key: 'sedang', label: `Sedang (${prioritasCount.sedang})`, color: prioritasColor('sedang') },
            { key: 'rendah', label: `Rendah (${prioritasCount.rendah})`, color: prioritasColor('rendah') },
          ]}
        />
      </div>

      {items.length === 0 ? (
        tab === 'menunggu'
          ? <EmptyState title="Semua draf sudah ditinjau" desc="Antrian bersih. Draf baru muncul di sini otomatis setelah Gemini selesai." cta="Trigger Gemini" onCta={() => setScreen('gemini')} />
          : <EmptyState title="Belum ada yang disetujui" desc="Draf yang kamu setujui akan tampil di sini dan bisa di-regenerate kapan saja." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {items.map(a => (
            <ApprovalCard key={a.id} a={a} data={data} onOpen={() => setSelectedApproval(a.id)} onApprove={() => actApproval(a.id, 'setuju')} />
          ))}
        </div>
      )}
    </div>
  );
}

function ApprovalCard({ a, data, onOpen, onApprove }) {
  const pr = prioritasColor(a.prioritas);
  const mc = moduleColor(a.modul);
  const st = statusColor(a.status);
  const sekolah = data.sekolah.find(s => s.id === a.sekolah);
  const isBriefing = a.tipe === 'briefing';
  const isDisetujui = a.status === 'disetujui';

  return (
    <div className="card lift clk" onClick={onOpen} style={{ padding: '18px 20px', position: 'relative', display: 'flex', flexDirection: 'column', gap: 11 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span className="pill" style={{ background: mc.bg, color: mc.ink }}>{moduleShort(a.modul)}</span>
        <span className="pill" style={{ background: pr.bg, color: pr.ink }}>
          <span className="dot" style={{ background: pr.ink }} />
          Prioritas {a.prioritas}
        </span>
        {isDisetujui && (
          <span className="pill" style={{ background: st.bg, color: st.ink }}>
            <span className="dot" style={{ background: st.dot }} />Tayang
          </span>
        )}
        <span className="pill" style={{ background: 'var(--surface-soft)', color: 'var(--ink-3)' }}>
          {isBriefing ? '📋 Briefing' : '🎯 Tindak lanjut'}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>{a.id.slice(0, 8)}</span>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>
        {sekolah ? sekolah.nama : a.sekolah}{a.kelas ? ' · ' + a.kelas : ''} · scope {a.scope}
      </div>

      <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {a.teks}
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--ink-2)', padding: '8px 10px', background: 'var(--surface-soft)', borderRadius: 8, borderLeft: '3px solid ' + mc.ink }}>
        <span style={{ fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10 }}>Pemicu · </span>
        {a.pemicu}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, paddingTop: 11, borderTop: '1px solid var(--line)' }}>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>{a.dibuat}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-ghost" style={{ padding: '5px 8px', fontSize: 11.5 }} onClick={(ev) => { ev.stopPropagation(); onOpen(); }}>
            {isDisetujui ? '🔄 Buka & regenerate' : 'Buka'}
          </button>
          {!isDisetujui && (
            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 11.5, background: 'var(--status-safe)' }} onClick={(ev) => { ev.stopPropagation(); onApprove(); }}>Setujui</button>
          )}
        </div>
      </div>
    </div>
  );
}

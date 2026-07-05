import { useEffect, useState } from 'react';
import { useCms } from '../store/CmsStore';
import { moduleColor, moduleLabel, prioritasColor, statusColor } from '../data/helpers';
import { IconX } from './icons';

const SMART_LABEL = {
  spesifik: 'Spesifik', terukur: 'Terukur', realistis: 'Realistis',
  relevan: 'Relevan', batas_waktu: 'Batas waktu',
};

export function ApprovalDrawer() {
  const { data, state, setSelectedApproval } = useCms();
  const id = state.selectedApproval;
  const open = !!id;
  // Draf bisa dibuka dari antrian menunggu maupun riwayat disetujui (mode regenerate).
  const a = id
    ? data.antrian.find(x => x.id === id) || data.riwayatDisetujui.find(x => x.id === id)
    : null;

  return (
    <>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(33,27,46,.35)', zIndex: 40 }} onClick={() => setSelectedApproval(null)} />
      )}
      {open && a && (
        <div className="drawer-enter" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(760px,94vw)', background: 'var(--surface)', zIndex: 50, boxShadow: '-24px 0 60px rgba(33,27,46,.18)', display: 'flex', flexDirection: 'column' }}>
          <DrawerContent key={a.id} a={a} />
        </div>
      )}
    </>
  );
}

/** Deteksi bentuk opsi: skema baru punya fase[].checklist[], skema lama punya langkah[] flat. */
function isOpsiBaru(opsi) {
  return Array.isArray(opsi?.fase);
}

/** Baris tindak_lanjut skema kartu Rapor Karakter (satu baris = satu rekomendasi utuh). */
function isKebijakanBaru(a) {
  return a.tipe === 'tindak_lanjut' && !!a.title && Array.isArray(a.konkret);
}

const TERM_LABEL = { short: '1-3 bulan', long: '6 bulan' };
const FOKUS_LABEL = { mutu: 'Mutu Layanan', citra: 'Citra Sekolah' };
const TARGET_ROLE_LABEL = {
  wali_kelas: 'Untuk Wali Kelas', kepala_sekolah: 'Untuk Kepala Sekolah', yayasan: 'Untuk Yayasan', orang_tua: 'Untuk Orang Tua',
};

function comboLabel(type, fokus) {
  const f = FOKUS_LABEL[fokus] || fokus;
  return type === 'pertahankan' ? `Pertahankan ${f}` : `${f} Perlu Perhatian`;
}

/** Isi drawer untuk baris skema baru: title/teaser/mengapa/dasar_teori/manfaat/konkret. */
function KebijakanBaruBody({ a }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        <span className="pill" style={{ background: 'var(--purple-050)', color: 'var(--purple-700)' }}>
          {comboLabel(a.type, a.fokus)}
        </span>
        {a.term && <span className="pill" style={{ background: 'var(--surface-soft)', color: 'var(--ink-3)' }}>{TERM_LABEL[a.term] || a.term}</span>}
        {a.jenjang && <span className="pill" style={{ background: 'var(--surface-soft)', color: 'var(--ink-3)' }}>{a.jenjang}</span>}
        {a.targetRole && <span className="pill" style={{ background: 'var(--purple-600)', color: '#fff' }}>{TARGET_ROLE_LABEL[a.targetRole] || a.targetRole}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
        {a.icon && <span style={{ fontSize: 22 }}>{a.icon}</span>}
        <div className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>{a.title}</div>
      </div>
      {a.teaser && <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 16 }}>{a.teaser}</div>}

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8, display: 'block' }}>Mengapa ini perlu</label>
        {a.mengapaData && (
          <div style={{ padding: '12px 14px', background: 'var(--surface)', borderRadius: 12, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 8, boxShadow: '0 2px 8px rgba(33,27,46,.05)' }}>
            <strong style={{ color: 'var(--purple-700)' }}>📊 Dari data:</strong> {a.mengapaData}
          </div>
        )}
        {a.mengapaPerspektif && (
          <div style={{ padding: '12px 14px', background: 'var(--surface)', borderRadius: 12, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, boxShadow: '0 2px 8px rgba(33,27,46,.05)' }}>
            <strong style={{ color: 'var(--purple-700)' }}>🌱 Dari sisi perkembangan anak:</strong> {a.mengapaPerspektif}
          </div>
        )}
      </div>

      {a.dasarTeori && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--status-warn-bg)', borderRadius: 10, fontSize: 12, color: 'var(--ink-2)' }}>
          <strong style={{ color: 'var(--status-warn)' }}>⚠ Dasar teori (internal, bukan untuk tayang):</strong> {a.dasarTeori}
        </div>
      )}

      {a.manfaat && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8, display: 'block' }}>Manfaatnya</label>
          {typeof a.manfaat === 'string' ? (
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>{a.manfaat}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {a.manfaat.anak && <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}><strong style={{ color: 'var(--purple-700)' }}>Untuk anak:</strong> {a.manfaat.anak}</div>}
              {a.manfaat.orang_tua && <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}><strong style={{ color: 'var(--purple-700)' }}>Untuk orang tua:</strong> {a.manfaat.orang_tua}</div>}
              {a.manfaat.sekolah && <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}><strong style={{ color: 'var(--purple-700)' }}>Untuk sekolah:</strong> {a.manfaat.sekolah}</div>}
            </div>
          )}
        </div>
      )}

      <div>
        <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8, display: 'block' }}>Langkah konkret</label>
        <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {a.konkret.map((k, i) => (
            <li key={i} style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              {typeof k === 'string' ? k : (
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{k.aksi}</div>
                  {k.waktu && <div style={{ color: 'var(--purple-700)', fontWeight: 600, fontSize: 11.5, marginTop: 2 }}>🕒 {k.waktu}</div>}
                  {k.kenapa && <div style={{ color: 'var(--ink-3)', fontSize: 11.5, marginTop: 2 }}>Kenapa: {k.kenapa}</div>}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function SmartChips({ smart }) {
  const [openKey, setOpenKey] = useState(null);
  if (!smart) return null;
  const entries = Object.entries(SMART_LABEL).filter(([k]) => smart[k]);
  if (entries.length === 0) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {entries.map(([k, label]) => (
          <button
            key={k} type="button"
            onClick={(e) => { e.stopPropagation(); setOpenKey(openKey === k ? null : k); }}
            style={{
              border: 'none', cursor: 'pointer', borderRadius: 999, padding: '4px 11px',
              fontSize: 10.5, fontWeight: 800, letterSpacing: '0.03em',
              background: openKey === k ? 'var(--purple-600)' : 'var(--purple-050)',
              color: openKey === k ? '#fff' : 'var(--purple-700)',
            }}
          >{label}</button>
        ))}
      </div>
      {openKey && (
        <div style={{ marginTop: 8, padding: '9px 12px', background: 'var(--surface)', borderRadius: 10, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5, boxShadow: '0 2px 8px rgba(33,27,46,.06)' }}>
          <strong style={{ color: 'var(--purple-700)' }}>{SMART_LABEL[openKey]}:</strong> {smart[openKey]}
        </div>
      )}
    </div>
  );
}

/** Item checklist ber-ikon ✓: aksi tebal (WHAT), kenapa (WHY) & cara (HOW) sub-baris. */
function ChecklistItem({ item }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{
        width: 18, height: 18, borderRadius: 6, flexShrink: 0, marginTop: 1,
        background: 'var(--status-safe-bg)', color: 'var(--status-safe)',
        display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800,
      }}>✓</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.45 }}>{item.aksi}</div>
        {item.kenapa && (
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.45, marginTop: 2 }}>
            <strong style={{ color: 'var(--ink-2)' }}>Kenapa:</strong> {item.kenapa}
          </div>
        )}
        {item.cara && (
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.45, marginTop: 2 }}>
            <strong style={{ color: 'var(--ink-2)' }}>Cara:</strong> {item.cara}
          </div>
        )}
      </div>
    </div>
  );
}

/** Kartu satu fase (7/30/66 hari) berisi checklist. Tanpa ring border, latar lembut saja. */
function FaseCard({ fase }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '13px 15px', boxShadow: '0 2px 10px rgba(33,27,46,.06)' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '3px 10px', borderRadius: 999, background: 'var(--purple-050)', color: 'var(--purple-700)', fontSize: 11, fontWeight: 800 }}>
        📅 {fase.jangka}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(fase.checklist || []).map((item, i) => <ChecklistItem key={i} item={item} />)}
      </div>
    </div>
  );
}

function OpsiCard({ opsi, selected, onToggle }) {
  const baru = isOpsiBaru(opsi);
  return (
    <div
      onClick={onToggle}
      style={{
        cursor: 'pointer', borderRadius: 16, padding: '15px 16px', transition: '.14s',
        background: selected ? 'var(--purple-050)' : 'var(--surface-soft)',
        boxShadow: selected ? '0 6px 20px rgba(99,35,218,.14)' : '0 1px 4px rgba(33,27,46,.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{
          width: 19, height: 19, borderRadius: 6, flexShrink: 0, display: 'grid', placeItems: 'center',
          background: selected ? 'var(--purple-600)' : 'var(--surface)',
          color: '#fff', fontSize: 12, fontWeight: 800,
          boxShadow: selected ? 'none' : '0 1px 4px rgba(33,27,46,.12)',
        }}>{selected ? '✓' : ''}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{opsi.label}</span>
      </div>

      <SmartChips smart={opsi.smart} />

      {baru ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {opsi.fase.map((f, i) => <FaseCard key={i} fase={f} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, paddingLeft: 28 }}>
          {(opsi.langkah || []).map((l, li) => (
            <div key={li} style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700, color: 'var(--ink-3)' }}>{l.jangka}:</span> {l.aksi}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DrawerContent({ a }) {
  const { data, state, setSelectedApproval, setApprovalEditText, resetApprovalEditText, actApproval, regenerateDraft } = useCms();
  const mc = moduleColor(a.modul);
  const pr = prioritasColor(a.prioritas);
  const st = statusColor(a.status);
  const sekolah = data.sekolah.find(s => s.id === a.sekolah);
  const editedText = state.approvalEditText[a.id];
  const currentText = editedText != null ? editedText : a.teks;

  const isDisetujui = a.status === 'disetujui';
  const kebijakanBaru = isKebijakanBaru(a);
  const punyaOpsi = !kebijakanBaru && a.tipe === 'tindak_lanjut' && Array.isArray(a.opsiKandidat) && a.opsiKandidat.length > 0;

  const [selectedIdx, setSelectedIdx] = useState(() => new Set(punyaOpsi ? [0] : []));
  const [catatanRegen, setCatatanRegen] = useState('');
  const [busyRegen, setBusyRegen] = useState(false);

  function toggleOpsi(i) {
    setSelectedIdx((prev) => {
      const next = new Set(prev);
      if (next.has(i)) { if (next.size > 1) next.delete(i); }
      else next.add(i);
      return next;
    });
  }
  const semuaTerpilih = punyaOpsi && selectedIdx.size === a.opsiKandidat.length;

  // Teks final ikut opsi pertama yang dipilih (masih bisa diedit manual sebelum approve).
  useEffect(() => {
    if (!punyaOpsi || isDisetujui) return;
    const first = a.opsiKandidat[Math.min(...selectedIdx)];
    const ringkas = first?.fase?.[0]?.checklist?.[0]?.aksi || first?.langkah?.[0]?.aksi;
    if (ringkas) setApprovalEditText(a.id, ringkas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIdx]);

  function approve() {
    const langkahTerpilih = punyaOpsi
      ? a.opsiKandidat.filter((_, i) => selectedIdx.has(i))
      : null;
    actApproval(a.id, 'setuju', langkahTerpilih);
  }

  async function handleRegenerate() {
    setBusyRegen(true);
    try {
      await regenerateDraft(a.id, catatanRegen);
    } finally {
      setBusyRegen(false);
    }
  }

  return (
    <>
      <div style={{ padding: '20px 26px 16px', borderBottom: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          <span className="pill" style={{ background: mc.bg, color: mc.ink }}>{moduleLabel(a.modul)}</span>
          <span className="pill" style={{ background: pr.bg, color: pr.ink }}><span className="dot" style={{ background: pr.ink }} />Prioritas {a.prioritas}</span>
          <span className="pill" style={{ background: st.bg, color: st.ink }}><span className="dot" style={{ background: st.dot }} />{st.label}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{a.id.slice(0, 8)}</span>
            <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setSelectedApproval(null)}><IconX size={16} /></button>
          </div>
        </div>
        <div className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>
          {(a.tipe === 'briefing' ? 'Briefing untuk ' : 'Tindak lanjut untuk ') + (sekolah ? sekolah.nama : a.sekolah) + (a.kelas ? ' · ' + a.kelas : '')}
        </div>
        <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Dibuat {a.dibuat} · scope {a.scope}</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 26px', background: 'var(--surface-soft)' }}>
        {kebijakanBaru && <KebijakanBaruBody a={a} />}

        {!kebijakanBaru && a.gambaran && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8, display: 'block' }}>Gambaran situasi</label>
            <div style={{ padding: '14px 16px', background: 'var(--surface)', borderRadius: 14, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6, boxShadow: '0 2px 10px rgba(33,27,46,.06)' }}>
              {a.gambaran}
            </div>
          </div>
        )}

        {punyaOpsi && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
                Pilih opsi ({selectedIdx.size}/{a.opsiKandidat.length} dipilih)
              </label>
              {!isDisetujui && (
                <button
                  className="btn-ghost" style={{ fontSize: 11.5, padding: '3px 9px' }}
                  onClick={() => setSelectedIdx(semuaTerpilih ? new Set([0]) : new Set(a.opsiKandidat.map((_, i) => i)))}
                >
                  {semuaTerpilih ? 'Batalkan pilih semua' : '✓ Pilih semua'}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {a.opsiKandidat.map((opsi, i) => (
                <OpsiCard key={i} opsi={opsi} selected={selectedIdx.has(i)} onToggle={isDisetujui ? undefined : () => toggleOpsi(i)} />
              ))}
            </div>
          </div>
        )}

        {!isDisetujui && !kebijakanBaru && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
                Teks ringkas untuk kartu laporan
              </label>
              <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--ink-3)', alignItems: 'center' }}>
                <span>{currentText.length} karakter</span>
                {editedText != null && <span className="pill" style={{ background: 'var(--status-warn-bg)', color: 'var(--status-warn)' }}>✎ diedit</span>}
                <button className="btn-ghost" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => resetApprovalEditText(a.id)}>Reset</button>
              </div>
            </div>
            <textarea
              value={currentText}
              onChange={(ev) => setApprovalEditText(a.id, ev.target.value)}
              className="fld"
              style={{ minHeight: 84, padding: '12px 14px', fontSize: 13.5, lineHeight: 1.6, resize: 'vertical', background: 'var(--surface)' }}
            />
          </div>
        )}

        {a.catatanInternal && (
          <div style={{ padding: '13px 16px', background: 'var(--status-warn-bg)', borderRadius: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--status-warn)', marginBottom: 5 }}>
              ⚠ Catatan internal, tidak tayang ke sekolah
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>{a.catatanInternal}</div>
          </div>
        )}

        <div style={{ padding: '14px 16px', background: 'var(--surface)', borderRadius: 14, boxShadow: '0 2px 10px rgba(33,27,46,.06)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', marginBottom: 3 }}>🔄 Minta regenerate</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 10, lineHeight: 1.45 }}>
            Catatanmu tersimpan permanen dan otomatis dipatuhi Gemini di semua generate berikutnya untuk {a.kelas || a.scope} ini.
            {isDisetujui && ' Versi yang tayang sekarang tetap tampil sampai penggantinya kamu setujui.'}
          </div>
          <textarea
            value={catatanRegen}
            onChange={(e) => setCatatanRegen(e.target.value)}
            className="fld"
            placeholder="Apa yang harus diperbaiki? Contoh: jangan pakai istilah asing, fokus ke kegiatan kelompok kecil…"
            style={{ minHeight: 64, padding: '10px 12px', fontSize: 12.5, lineHeight: 1.5, resize: 'vertical', background: 'var(--surface-soft)', marginBottom: 10 }}
          />
          <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleRegenerate} disabled={busyRegen}>
            {busyRegen ? 'Meregenerate…' : '🔄 Regenerate dengan catatan'}
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 26px', borderTop: '1px solid var(--line)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          {isDisetujui
            ? 'Sudah tayang di laporan sekolah. Regenerate kalau mau menggantinya.'
            : <>Setelah disetujui, otomatis tampil di report {sekolah ? sekolah.nama : a.sekolah}</>}
        </div>
        {!isDisetujui && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button className="btn-secondary" onClick={() => actApproval(a.id, 'tolak')}>Tolak</button>
            <button className="btn-primary" style={{ background: 'var(--status-safe)' }} onClick={approve}>
              Setujui{punyaOpsi ? ` ${selectedIdx.size} opsi` : ''} & tayangkan
            </button>
          </div>
        )}
      </div>
    </>
  );
}

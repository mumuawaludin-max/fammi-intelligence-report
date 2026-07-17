import { useState } from 'react';
import { useCms } from '../store/CmsStore';
import { LoadingCards } from '../components/LoadingCards';
import { ErrorState } from '../components/ErrorState';
import { moduleColor, moduleShort, statusColor } from '../data/helpers';
import { parseKarakterWorkbook } from '../importers/karakterImporter';
import { periodeLabel } from '../../karakter/karakterMeta';

const STEPS = ['Sekolah', 'Modul', 'Upload file', 'Cek & konfirmasi'];

export function Upload() {
  const { data, loading, error, runImport, refetch } = useCms();
  const [step, setStep] = useState(1);
  const [sekolahId, setSekolahId] = useState('');
  const [modul, setModul] = useState('karakter');
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingCards rows={3} />;
  if (error) {
    return <ErrorState title="Gagal memuat riwayat upload" desc={error} cta="Muat ulang" onCta={refetch} />;
  }

  const sekolah = data.sekolah.find((s) => s.id === sekolahId);

  async function handleFile(f) {
    if (!f) return;
    setFile(f);
    setParseError(null);
    setParsed(null);
    if (modul !== 'karakter') {
      setParseError('Importer untuk modul ini belum tersedia, baru modul Karakter yang didukung.');
      return;
    }
    try {
      const result = await parseKarakterWorkbook(f, { sekolahId });
      if (!result.ok) {
        setParseError(result.error);
        return;
      }
      setParsed(result);
      setStep(4);
    } catch (e) {
      setParseError(e.message || 'Gagal memparse file.');
    }
  }

  async function handleConfirm() {
    setBusy(true);
    try {
      await runImport({ sekolahId, modul, fileName: file?.name, parsed });
      setStep(1);
      setSekolahId('');
      setFile(null);
      setParsed(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: '22px 26px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 22 }}>
        {STEPS.map((s, i) => {
          const idx = i + 1;
          const done = idx < step;
          const active = idx === step;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : '0 0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                  background: done ? 'var(--status-safe)' : active ? 'var(--purple-600)' : 'var(--surface-soft)',
                  color: done || active ? '#fff' : 'var(--ink-3)',
                  boxShadow: active ? '0 3px 10px rgba(99,35,218,.32)' : 'none', transition: '.2s',
                }}>
                  {done ? '✓' : idx}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: active ? 700 : 600, color: active ? 'var(--ink)' : done ? 'var(--ink-2)' : 'var(--ink-4)' }}>{s}</div>
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: done ? 'var(--status-safe)' : 'var(--line)', margin: '0 14px', borderRadius: 99 }} />}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <div className="card" style={{ padding: 24 }}>
          <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>Pilih sekolah tujuan</div>
          <select className="fld" value={sekolahId} onChange={(e) => setSekolahId(e.target.value)}>
            <option value="">— Pilih sekolah —</option>
            {data.sekolah.map((s) => <option key={s.id} value={s.id}>{s.nama} ({s.id})</option>)}
          </select>
          <button className="btn-primary" style={{ marginTop: 16 }} disabled={!sekolahId} onClick={() => setStep(2)}>Lanjut ke langkah 2</button>
        </div>
      )}

      {step === 2 && (
        <div className="card" style={{ padding: 24 }}>
          <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>Pilih modul</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            {['karakter', 'mi', 'screening'].map((m) => {
              const mc = moduleColor(m);
              const active = m === modul;
              // Importer baru mendukung Karakter -- MI/Screening sengaja dinonaktifkan di sini
              // (bukan cuma dibiarkan klik lalu gagal belakangan pas upload file) supaya tidak
              // kelihatan seperti modul itu "ON tapi tidak bisa dipilih" padahal memang belum ada importernya.
              const supported = m === 'karakter';
              return (
                <button
                  key={m} className="clk" onClick={() => supported && setModul(m)}
                  disabled={!supported}
                  title={supported ? undefined : 'Importer modul ini belum tersedia'}
                  style={{
                    padding: '10px 14px', borderRadius: 11, fontSize: 12.5, fontWeight: 700,
                    background: active ? mc.bg : 'var(--surface-soft)', color: active ? mc.ink : 'var(--ink-2)',
                    boxShadow: active ? 'none' : 'inset 0 0 0 1px var(--line)',
                    opacity: supported ? 1 : 0.45, cursor: supported ? 'pointer' : 'not-allowed',
                  }}>
                  {moduleShort(m)}{!supported && ' · segera hadir'}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 14 }}>Periode tidak perlu diketik manual — sistem membaca kolom "bulan" langsung dari tiap baris file, jadi satu file boleh memuat beberapa bulan sekaligus.</div>
          <button className="btn-primary" onClick={() => setStep(3)}>Lanjut ke langkah 3</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="card" style={{ padding: '14px 20px', marginBottom: 14, display: 'flex', gap: 20, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Sekolah</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 2 }}>{sekolah?.nama} ({sekolahId})</div>
            </div>
            <div style={{ width: 1, height: 32, background: 'var(--line)' }} />
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Modul</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 2 }}>{moduleShort(modul)}</div>
            </div>
            <button className="btn-ghost" style={{ marginLeft: 'auto', fontSize: 12 }} onClick={() => setStep(1)}>Ubah</button>
          </div>
          <div className="card" style={{ padding: 40, border: '2px dashed var(--purple-300)', borderRadius: 16, textAlign: 'center', background: 'var(--purple-050)' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📄</div>
            <div className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Pilih file Excel</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 16 }}>.xlsx / .xls · sheet detail_persentase_karakter dkk (format sama seperti data awal)</div>
            <label className="btn-primary" style={{ display: 'inline-flex', cursor: 'pointer' }}>
              Pilih file
              <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files?.[0])} />
            </label>
            {parseError && <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--status-alert)' }}>⚠ {parseError}</div>}
          </div>
        </div>
      )}

      {step === 4 && parsed && (
        <div>
          <div className="card" style={{ padding: '18px 22px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Preview file: {file?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>
                  {parsed.rows.skorRows.length} baris skor · {parsed.muridBaru} murid baru terdeteksi
                </div>
              </div>
              <span className="pill" style={{ background: 'var(--status-safe-bg)', color: 'var(--status-safe)' }}><span className="dot" style={{ background: 'var(--status-safe)' }} />Siap import</span>
            </div>
            {parsed.preview.periodeDetected?.length > 0 && (
              <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
                  Terdeteksi {parsed.preview.periodeDetected.length} bulan ·
                </span>
                {parsed.preview.periodeDetected.map((p) => (
                  <span key={p.periode} className="pill" style={{ background: 'var(--purple-050)', color: 'var(--purple-700)' }}>
                    {periodeLabel(p.periode)} ({p.rows} baris)
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {parsed.preview.sheets.map((s, i) => (
                <div key={i} style={{ padding: '10px 12px', background: 'var(--surface-soft)', borderRadius: 9, display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span className="mono">{s.name}</span>
                  <span style={{ color: s.found ? 'var(--status-safe)' : 'var(--ink-4)', fontWeight: 700 }}>{s.found ? `${s.rows} baris` : 'tidak ada'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-soft)' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>Akan menulis ke tabel: </div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--purple-700)', marginTop: 3 }}>karakter_skor · karakter_skor_indikator · karakter_pernyataan_ortu · karakter_summary</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setStep(3)}>Batal</button>
              <button className="btn-primary btn-safe" onClick={handleConfirm} disabled={busy}>{busy ? 'Mengimpor…' : 'Konfirmasi & import'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, marginTop: 22 }}>
        <div style={{ padding: '16px 22px 12px', borderBottom: '1px solid var(--line)' }}>
          <div className="disp" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Riwayat upload</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>Audit trail dari import_log</div>
        </div>
        {data.uploadHistory.length === 0 ? (
          <p style={{ padding: 22, fontSize: 12.5, color: 'var(--ink-3)' }}>Belum ada riwayat upload.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Sekolah</th>
                  <th>Modul</th>
                  <th>Periode</th>
                  <th style={{ textAlign: 'right' }}>Baris</th>
                  <th>Status</th>
                  <th>Oleh</th>
                </tr>
              </thead>
              <tbody>
                {data.uploadHistory.map((h) => {
                  const st = statusColor(h.status);
                  const mc = moduleColor(h.modul);
                  return (
                    <tr key={h.id} className="hover-row">
                      <td className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{h.when}</td>
                      <td style={{ fontWeight: 600 }}>{h.sekolah}</td>
                      <td><span className="pill" style={{ background: mc.bg, color: mc.ink }}>{moduleShort(h.modul)}</span></td>
                      <td style={{ fontSize: 12.5 }}>{h.periode ? h.periode.split(',').map(periodeLabel).join(', ') : '—'}</td>
                      <td className="mono" style={{ textAlign: 'right', fontWeight: 600 }}>{h.rows > 0 ? h.rows : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span className="pill" style={{ background: st.bg, color: st.ink }}><span className="dot" style={{ background: st.dot }} />{st.label}</span>
                          {h.pesan && <span style={{ fontSize: 11, color: h.status === 'gagal' ? 'var(--status-alert)' : 'var(--status-warn)' }}>{h.pesan}</span>}
                        </div>
                      </td>
                      <td className="mono" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{h.by}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

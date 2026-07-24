import { useState } from 'react';
import { useCms } from '../store/CmsStore';
import { LoadingCards } from '../components/LoadingCards';
import { ErrorState } from '../components/ErrorState';
import { moduleColor, moduleShort, statusColor } from '../data/helpers';
import { parseKarakterWorkbook } from '../importers/karakterImporter';
import { parseMiWorkbook } from '../importers/miImporter';
import { parseScWorkbook } from '../importers/scImporter';
import { loadScPersonalIdsAction, loadScPendingAction, actScApproval } from '../useAdminCmsData';
import { periodeLabel } from '../../karakter/karakterMeta';

// Modul MI dibaca per-baris dari file (multi-sekolah), jadi tidak pakai langkah "pilih sekolah".
// Sentinel ini dipakai di dropdown langkah 1 untuk masuk ke mode MI.
const SEKOLAH_MI = '__mi__';
const STEPS = ['Sekolah', 'Modul', 'Upload file', 'Cek & konfirmasi'];

// Progress bar terlihat "macet" di 100% selama beberapa menit kalau Gemini sedang padat (503) --
// bilah tetap penuh karena onProgress lapis retry (runMiGenerateAction/runScIndividuGenerateAction
// di useAdminCmsData.js) memang melapor done=total selama fase ini. Tanpa pesan ini, admin tidak
// bisa membedakan "masih jalan, cuma lambat karena retry" dari "beneran macet/error" -- itu sendiri
// yang bikin laporan "kenapa masih error" padahal prosesnya masih berjalan di background.
function retryStatusText(retry) {
  if (!retry) return null;
  return retry.waiting
    ? `Gemini sedang padat (503), menunggu sebelum mencoba ulang ${retry.sisaGagal} yang gagal (putaran ${retry.pass}/${retry.ofPass})…`
    : `Mencoba ulang ${retry.sisaGagal} yang sempat gagal (putaran ${retry.pass}/${retry.ofPass})…`;
}

export function Upload() {
  const { data, loading, error, runImport, runMiGenerate, runScIndividuGenerate, refetch } = useCms();
  const [step, setStep] = useState(1);
  const [sekolahId, setSekolahId] = useState('');
  const [modul, setModul] = useState('karakter');
  // School Culture tidak punya kolom bulan/periode sendiri di filenya (sudah dicek langsung ke
  // contoh file asli), jadi periode wajib diketik admin sebelum upload -- beda dari Karakter/MI
  // yang membaca periode dari tiap baris file.
  const [periodeSc, setPeriodeSc] = useState('');
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [miProgress, setMiProgress] = useState(null); // { done, total }
  const [miResults, setMiResults] = useState(null); // ringkasan hasil generate
  const [scImported, setScImported] = useState(false); // import mentah sc_personal/sc_lembaga selesai
  const [scProgress, setScProgress] = useState(null); // { done, total }
  const [scResults, setScResults] = useState(null); // ringkasan hasil generate laporan individu SC
  const [scApproveBusy, setScApproveBusy] = useState(false);
  const [scApproveProgress, setScApproveProgress] = useState(null); // { done, total }
  const [scApproveResult, setScApproveResult] = useState(null); // { okCount, failed, akunBaru }

  if (loading) return <LoadingCards rows={3} />;
  if (error) {
    return <ErrorState title="Gagal memuat riwayat upload" desc={error} cta="Muat ulang" onCta={refetch} />;
  }

  const isMi = modul === 'mi';
  const isSc = modul === 'sc';
  const sekolah = data.sekolah.find((s) => s.id === sekolahId);

  function resetFlow() {
    setStep(1); setSekolahId(''); setModul('karakter'); setFile(null);
    setParsed(null); setParseError(null); setMiProgress(null); setMiResults(null); setPeriodeSc('');
    setScImported(false); setScProgress(null); setScResults(null);
    setScApproveBusy(false); setScApproveProgress(null); setScApproveResult(null);
  }

  // Klik terakhir dari alur upload SC: setujui SEMUA draf 'menunggu_persetujuan' milik
  // sekolah+periode ini sekaligus. Approve yang berhasil otomatis memicu ensureKaryawanScAccount
  // (admin-actions) -- begitu tombol ini selesai, akun Karyawan+kode langsung ada dan muncul di
  // menu Pengguna & Peran, TANPA admin perlu pindah ke layar Persetujuan School Culture secara
  // terpisah. Ini bukan jalan pintas melewati gerbang persetujuan (CLAUDE.md butir 6) -- klik
  // ini SENDIRI adalah tindakan persetujuannya, cuma ditaruh di alur yang sama supaya satu klik.
  async function handleApproveSemuaSc() {
    const targets = (scResults || []).filter((r) => r.ok);
    if (targets.length === 0) return;
    setScApproveBusy(true);
    setScApproveProgress({ done: 0, total: targets.length });
    try {
      const pendingRows = await loadScPendingAction();
      const rowsSekolahIni = pendingRows.filter((r) => r.sekolah_id === sekolahId && r.periode_id === periodeSc);
      let okCount = 0;
      const failed = [];
      const akunBaru = [];
      for (let i = 0; i < rowsSekolahIni.length; i++) {
        const r = rowsSekolahIni[i];
        try {
          const akun = await actScApproval(r.id, 'setuju');
          okCount++;
          if (akun?.created) akunBaru.push({ username: akun.username, password: akun.password });
        } catch (e) {
          failed.push({ nama: r.nama_responden || r.sc_personal_id, error: e.message || String(e) });
        }
        setScApproveProgress({ done: i + 1, total: rowsSekolahIni.length });
      }
      setScApproveResult({ okCount, failed, akunBaru });
    } catch (e) {
      setParseError(e.message || 'Gagal memuat antrian persetujuan School Culture.');
    } finally {
      setScApproveBusy(false);
      setScApproveProgress(null);
    }
  }

  async function handleFile(f) {
    if (!f) return;
    setFile(f);
    setParseError(null);
    setParsed(null);
    setMiResults(null);
    try {
      let result;
      if (modul === 'karakter') {
        result = await parseKarakterWorkbook(f, { sekolahId });
      } else if (modul === 'mi') {
        result = await parseMiWorkbook(f, { schools: data.sekolah });
      } else if (modul === 'sc') {
        result = await parseScWorkbook(f, { sekolahId, periodeId: periodeSc });
      } else {
        setParseError('Importer untuk modul ini belum tersedia (baru Karakter, MI, dan School Culture).');
        return;
      }
      if (!result.ok) { setParseError(result.error); return; }
      setParsed(result);
      setStep(4);
    } catch (e) {
      setParseError(e.message || 'Gagal memparse file.');
    }
  }

  async function handleConfirm() {
    setBusy(true);
    try {
      if (isMi) {
        setMiProgress({ done: 0, total: parsed.rows.length });
        const results = await runMiGenerate(parsed.rows, (done, total, retry) => setMiProgress({ done, total, retry }));
        setMiProgress(null);
        setMiResults(results);
        // Tetap di langkah 4 supaya admin lihat ringkasan berhasil/gagal per siswa.
      } else if (isSc) {
        await runImport({ sekolahId, modul, fileName: file?.name, parsed });
        setScImported(true);
        // Sama alurnya dengan MI: begitu file selesai diimpor, laporan narasi tiap staf
        // langsung digenerate otomatis (tidak perlu klik tombol terpisah lagi) -- HANYA sampai
        // status 'menunggu_persetujuan', BUKAN langsung tayang/buat akun. Akun Karyawan +
        // kode login tetap baru dibuat saat admin approve (lihat ensureKaryawanScAccount di
        // admin-actions/index.ts) -- gerbang persetujuan manusia CLAUDE.md butir 6 tidak boleh
        // dilewati sekalipun untuk kemudahan alur upload.
        await handleGenerateScIndividu();
      } else {
        await runImport({ sekolahId, modul, fileName: file?.name, parsed });
        resetFlow();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateScIndividu() {
    setBusy(true);
    try {
      const personalRows = await loadScPersonalIdsAction(sekolahId, periodeSc);
      setScProgress({ done: 0, total: personalRows.length });
      const results = await runScIndividuGenerate(personalRows, (done, total, retry) => setScProgress({ done, total, retry }));
      setScProgress(null);
      setScResults(results);
    } catch (e) {
      setParseError(e.message || 'Gagal memuat daftar responden untuk digenerate.');
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
          <select
            className="fld"
            value={sekolahId}
            onChange={(e) => {
              const v = e.target.value;
              setSekolahId(v);
              // Mode MI: sekolah dibaca dari file, jadi modul otomatis MI dan dikunci di langkah 2.
              if (v === SEKOLAH_MI) setModul('mi');
              else if (modul === 'mi') setModul('karakter');
            }}
          >
            <option value="">— Pilih sekolah —</option>
            <option value={SEKOLAH_MI}>— Modul MI: banyak sekolah, dibaca dari file —</option>
            {data.sekolah.map((s) => <option key={s.id} value={s.id}>{s.nama} ({s.id})</option>)}
          </select>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 8 }}>Untuk modul MI, pilih baris paling atas: satu file bisa memuat banyak sekolah dan tiap baris dicocokkan otomatis ke sekolah terdaftar lewat namanya.</div>
          <button className="btn-primary" style={{ marginTop: 16 }} disabled={!sekolahId} onClick={() => setStep(2)}>Lanjut ke langkah 2</button>
        </div>
      )}

      {step === 2 && (
        <div className="card" style={{ padding: 24 }}>
          <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>Pilih modul</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            {['karakter', 'mi', 'screening', 'sc'].map((m) => {
              const mc = moduleColor(m);
              const active = m === modul;
              // Kalau masuk lewat mode MI (sekolah dibaca dari file), modul dikunci ke MI, dan
              // sebaliknya modul MI cuma boleh lewat mode itu.
              const locked = (sekolahId === SEKOLAH_MI && m !== 'mi') || (sekolahId !== SEKOLAH_MI && m === 'mi');
              return (
                <button key={m} className="clk" disabled={locked} onClick={() => setModul(m)} style={{ padding: '10px 14px', borderRadius: 11, fontSize: 12.5, fontWeight: 700, opacity: locked ? 0.4 : 1, cursor: locked ? 'not-allowed' : 'pointer', background: active ? mc.bg : 'var(--surface-soft)', color: active ? mc.ink : 'var(--ink-2)', boxShadow: active ? 'none' : 'inset 0 0 0 1px var(--line)' }}>
                  {moduleShort(m)}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 14 }}>
            {isMi
              ? 'MI: tiap baris file = satu siswa. Gemini merumuskan seluruh laporan (dominan, narasi, profesi, rencana) lalu masuk antrian persetujuan. Periode dan sekolah dibaca dari file.'
              : modul === 'sc'
              ? 'School Culture: sheet "Personal" (satu baris per staf) + sheet "Lembaga" (agregat sekolah). File ini TIDAK punya kolom bulan sendiri, jadi periode wajib diisi manual di bawah.'
              : 'Periode tidak perlu diketik manual — sistem membaca kolom "bulan" langsung dari tiap baris file, jadi satu file boleh memuat beberapa bulan sekaligus.'}
          </div>
          {modul === 'sc' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 6 }}>Periode (format YYYY-MM)</label>
              <input
                className="fld"
                type="text"
                placeholder="mis. 2026-07"
                value={periodeSc}
                onChange={(e) => setPeriodeSc(e.target.value.trim())}
                style={{ maxWidth: 160 }}
              />
            </div>
          )}
          <button className="btn-primary" disabled={modul === 'sc' && !/^\d{4}-\d{2}$/.test(periodeSc)} onClick={() => setStep(3)}>Lanjut ke langkah 3</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="card" style={{ padding: '14px 20px', marginBottom: 14, display: 'flex', gap: 20, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Sekolah</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 2 }}>{isMi ? 'Banyak sekolah (dari file)' : `${sekolah?.nama} (${sekolahId})`}</div>
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
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 16 }}>
              {isMi
                ? '.xlsx / .xls · satu sheet, satu baris per siswa (kolom nama_siswa, kelas_id, sekolah_id, periode, r_inter..r_spasial, essay_*)'
                : modul === 'sc'
                ? '.xlsx / .xls · sheet "Personal" (satu baris per staf) + sheet "Lembaga" (agregat sekolah)'
                : '.xlsx / .xls · sheet detail_persentase_karakter dkk (format sama seperti data awal)'}
            </div>
            <label className="btn-primary" style={{ display: 'inline-flex', cursor: 'pointer' }}>
              Pilih file
              <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files?.[0])} />
            </label>
            {parseError && <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--status-alert)' }}>⚠ {parseError}</div>}
          </div>
        </div>
      )}

      {step === 4 && parsed && isMi && (
        <div>
          <div className="card" style={{ padding: '18px 22px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Preview MI: {file?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>
                  {parsed.rows.length} siswa · {parsed.preview.sekolahCount} sekolah terdeteksi
                </div>
              </div>
              <span className="pill" style={{ background: 'var(--status-safe-bg)', color: 'var(--status-safe)' }}><span className="dot" style={{ background: 'var(--status-safe)' }} />Siap generate</span>
            </div>
            {parsed.preview.periodeDetected?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Periode ·</span>
                {parsed.preview.periodeDetected.map((p) => (
                  <span key={p.periode} className="pill" style={{ background: 'var(--purple-050)', color: 'var(--purple-700)' }}>
                    {periodeLabel(p.periode)} ({p.rows} siswa)
                  </span>
                ))}
              </div>
            )}
          </div>

          {miResults ? (
            <div className="card" style={{ padding: '16px 22px' }}>
              <div className="disp" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                Hasil generate: {miResults.filter((r) => r.ok).length}/{miResults.length} berhasil
              </div>
              {miResults.filter((r) => !r.ok).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                  {miResults.filter((r) => !r.ok).map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--status-alert)' }}>⚠ {r.nama}: {r.error}</div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 12 }}>Laporan yang berhasil masuk Antrian Persetujuan berstatus menunggu. Setujui di sana supaya tayang ke siswa/orang tua.</div>
              <button className="btn-primary" onClick={resetFlow}>Selesai</button>
            </div>
          ) : (
            <div className="card" style={{ padding: '16px 22px' }}>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 12 }}>
                Tiap siswa dirumuskan Gemini (dominan, narasi, profesi, rencana) lalu masuk Antrian Persetujuan berstatus menunggu. Prosesnya ~15-30 detik per siswa, jadi {parsed.rows.length} siswa bisa memakan beberapa menit. Jangan tutup halaman ini selama proses berjalan.
              </div>
              {miProgress && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ height: 8, background: 'var(--surface-soft)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((miProgress.done / miProgress.total) * 100)}%`, background: 'var(--purple-600)', transition: '.3s' }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>Memproses {miProgress.done}/{miProgress.total} siswa…</div>
                  {retryStatusText(miProgress.retry) && (
                    <div style={{ fontSize: 12, color: 'var(--status-warn)', marginTop: 4 }}>⚠ {retryStatusText(miProgress.retry)}</div>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" onClick={() => setStep(3)} disabled={busy}>Batal</button>
                <button className="btn-primary" onClick={handleConfirm} disabled={busy}>{busy ? 'Menggenerate…' : `Generate ${parsed.rows.length} laporan MI`}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 4 && parsed && !isMi && (
        <div>
          <div className="card" style={{ padding: '18px 22px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Preview file: {file?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>
                  {isSc
                    ? `${parsed.rows.personalRows.length} responden · ${parsed.rows.lembagaRows.length} baris agregat lembaga`
                    : `${parsed.rows.skorRows.length} baris skor · ${parsed.muridBaru} murid baru terdeteksi`}
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

            {/* Kolom "laporan_json" (opsional): laporan siap pakai dari hulu. Ditampilkan SEBELUM
                konfirmasi supaya admin tahu berapa orang yang tidak perlu Gemini sama sekali, dan
                baris mana yang JSON-nya perlu diperbaiki dulu kalau tidak mau jatuh ke Gemini. */}
            {isSc && (parsed.preview.pregenCount > 0 || parsed.preview.pregenWarnings?.length > 0) && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: parsed.preview.pregenWarnings?.length > 0 ? 'var(--status-warn-bg)' : 'var(--status-safe-bg)', borderRadius: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: parsed.preview.pregenWarnings?.length > 0 ? 'var(--status-warn)' : 'var(--status-safe)' }}>
                  📄 {parsed.preview.pregenCount} dari {parsed.rows.personalRows.length} responden punya laporan siap pakai di kolom laporan_json
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.5 }}>
                  Yang siap pakai langsung dipakai apa adanya tanpa memanggil Gemini. Sisanya tetap digenerate Gemini seperti biasa. Semuanya tetap masuk antrian persetujuan.
                </div>
                {parsed.preview.pregenWarnings?.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--status-warn)' }}>JSON tidak terbaca, akan jatuh ke Gemini:</div>
                    {parsed.preview.pregenWarnings.map((w, i) => (
                      <div key={i} style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>⚠ {w}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {isSc && scImported ? (
            <div className="card" style={{ padding: '16px 22px' }}>
              <div className="disp" style={{ fontSize: 15, fontWeight: 700, color: 'var(--status-safe)', marginBottom: 8 }}>✓ Data mentah berhasil diimpor</div>
              {scResults ? (
                <>
                  <div className="disp" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                    Hasil generate laporan individu: {scResults.filter((r) => r.ok).length}/{scResults.length} berhasil
                  </div>
                  {scResults.filter((r) => !r.ok).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                      {scResults.filter((r) => !r.ok).map((r, i) => (
                        <div key={i} style={{ fontSize: 12, color: 'var(--status-alert)' }}>⚠ {r.nama}: {r.error}</div>
                      ))}
                    </div>
                  )}

                  {scApproveResult ? (
                    <>
                      <div className="disp" style={{ fontSize: 14, fontWeight: 700, color: 'var(--status-safe)', marginBottom: 8 }}>
                        ✓ {scApproveResult.okCount} laporan disetujui & tayang
                      </div>
                      {scApproveResult.failed.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                          {scApproveResult.failed.map((f, i) => (
                            <div key={i} style={{ fontSize: 12, color: 'var(--status-alert)' }}>⚠ {f.nama}: {f.error}</div>
                          ))}
                        </div>
                      )}
                      {scApproveResult.akunBaru.length > 0 && (
                        <div style={{ marginBottom: 12, padding: '12px 14px', background: 'var(--info-soft)', borderRadius: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--info)', marginBottom: 8 }}>
                            💡 {scApproveResult.akunBaru.length} akun Karyawan baru · kode cuma tampil sekali di sini, sudah muncul juga di menu Pengguna & Peran
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {scApproveResult.akunBaru.map((a, i) => (
                              <div key={i} className="mono" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{a.username} / {a.password}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      <button className="btn-primary" onClick={resetFlow}>Selesai</button>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 12 }}>
                        Draf laporan menunggu ditinjau. Klik di bawah untuk menyetujui SEMUA sekaligus (satu klik) -- akun Karyawan + kode login langsung dibuat untuk staf yang belum punya akun, dan laporan langsung tayang ke mereka. Cek dulu ringkasan hasil generate di atas kalau mau meninjau satu-satu lewat menu Persetujuan School Culture sebelum menyetujui semua.
                      </div>
                      {scApproveProgress && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ height: 8, background: 'var(--surface-soft)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.round((scApproveProgress.done / scApproveProgress.total) * 100)}%`, background: 'var(--status-safe)', transition: '.3s' }} />
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>Menyetujui {scApproveProgress.done}/{scApproveProgress.total}…</div>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-secondary" onClick={resetFlow} disabled={scApproveBusy}>Lewati, tinjau nanti</button>
                        <button className="btn-primary" style={{ background: 'var(--status-safe)' }} onClick={handleApproveSemuaSc} disabled={scApproveBusy}>
                          {scApproveBusy ? 'Menyetujui…' : '✓ Setujui semua & buat akun'}
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 12 }}>
                    Generate laporan narasi per staf otomatis berjalan setelah import. Kalau belum mulai atau sempat gagal di tengah jalan, pakai tombol di bawah untuk memicu ulang (aman diulang, draf lama untuk staf yang sudah berhasil tidak akan ditimpa dua kali).
                  </div>
                  {scProgress && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ height: 8, background: 'var(--surface-soft)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round((scProgress.done / scProgress.total) * 100)}%`, background: 'var(--purple-600)', transition: '.3s' }} />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>Memproses {scProgress.done}/{scProgress.total} staf…</div>
                      {retryStatusText(scProgress.retry) && (
                        <div style={{ fontSize: 12, color: 'var(--status-warn)', marginTop: 4 }}>⚠ {retryStatusText(scProgress.retry)}</div>
                      )}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-secondary" onClick={resetFlow} disabled={busy}>Lewati, selesai</button>
                    <button className="btn-primary" onClick={handleGenerateScIndividu} disabled={busy}>{busy ? 'Menggenerate…' : `Generate ${parsed.rows.personalRows.length} laporan individu`}</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-soft)' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>Akan menulis ke tabel: </div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--purple-700)', marginTop: 3 }}>
                  {isSc ? 'sc_personal · sc_lembaga' : 'karakter_skor · karakter_skor_indikator · karakter_pernyataan_ortu · karakter_summary'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" onClick={() => setStep(3)}>Batal</button>
                <button className="btn-primary btn-safe" onClick={handleConfirm} disabled={busy}>{busy ? 'Mengimpor…' : 'Konfirmasi & import'}</button>
              </div>
            </div>
          )}
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

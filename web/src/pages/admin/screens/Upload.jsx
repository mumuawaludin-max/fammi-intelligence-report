import { useState } from 'react';
import { useCms } from '../store/CmsStore';
import { LoadingCards } from '../components/LoadingCards';
import { ErrorState } from '../components/ErrorState';
import { moduleColor, moduleShort, statusColor } from '../data/helpers';
import { parseKarakterWorkbook } from '../importers/karakterImporter';
import { parseMiWorkbook, resolveMiUnresolved, computePeriodeDetected } from '../importers/miImporter';
import { parseScWorkbook } from '../importers/scImporter';
import { parsePaWorkbook } from '../importers/paImporter';
import { loadScPersonalIdsAction, loadScPendingAction, actScApproval } from '../useAdminCmsData';
import { periodeLabel } from '../../karakter/karakterMeta';

// Modul MI bisa dipakai untuk satu sekolah spesifik (dipilih normal di langkah 1, sama seperti
// modul lain) ATAU untuk file yang mencampur banyak sekolah sekaligus. Sentinel ini dipakai di
// dropdown langkah 1 khusus untuk masuk ke mode "banyak sekolah dari file" yang kedua.
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

/**
 * Kerangka karakter yang terbaca dari berkas, satu blok per jenjang.
 *
 * Ini satu-satunya kesempatan admin melihat KERANGKA APA yang akan tersimpan sebelum datanya
 * masuk. Untuk sekolah yang tiap jenjangnya punya karakter berbeda, salah tempel satu sheet
 * berarti seluruh jenjang dinilai dengan karakter milik jenjang lain, dan setelah tersimpan
 * cacat itu tidak kelihatan lagi dari mana pun: angkanya wajar, namanya wajar, cuma salah.
 *
 * Sengaja menampilkan nama karakter DAN nama indikatornya, karena nama karakter saja tidak
 * cukup untuk membedakan: di SD Amal Mulia, "Senang Beribadah" ada di keenam jenjang dengan
 * indikator yang berbeda-beda, dan justru indikatornya yang menentukan itu karakter yang sama
 * atau bukan.
 */
function KerangkaPreview({ kerangka, perJenjang, barisHeaderTerulang, ringkasanSekolahDilewati, pekanPerPeriode }) {
  if (!kerangka || kerangka.length === 0) return null;
  return (
    <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--surface-soft)', borderRadius: 10, border: '1px solid var(--line)' }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>
        {perJenjang
          ? `🧩 Kerangka karakter berbeda per jenjang · ${kerangka.length} jenjang terdeteksi`
          : '🧩 Kerangka karakter tunggal untuk seluruh sekolah'}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.5 }}>
        {perJenjang
          ? 'Tiap jenjang disimpan sebagai kerangka sendiri, jadi karakter dengan nomor sama di jenjang berbeda tidak akan tercampur. Cocokkan daftar di bawah dengan kerangka yang sekolah pakai sebelum melanjutkan.'
          : 'Semua kelas memakai daftar karakter yang sama.'}
        {barisHeaderTerulang > 0 && ` ${barisHeaderTerulang} baris dilewati karena isinya baris header yang ikut ter-copy, bukan data murid.`}
      </div>
      {/* Pekan yang terbaca per periode. Kalau sekolah lupa mengisi kolom pekan, di sini akan
          tertulis "bulanan" dan itu ketahuan SEBELUM data masuk, bukan setelah grafik pekanannya
          ternyata kosong dan tidak ada yang tahu kenapa. */}
      {pekanPerPeriode?.length > 0 && (
        <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--ink)' }}>Pekan terbaca:</strong>{' '}
          {pekanPerPeriode.map((p) => {
            const pekanan = p.pekan.filter((n) => n > 0);
            return `${p.periode} — ${pekanan.length > 0 ? `P${pekanan.join(', P')}` : 'bulanan (tanpa rincian pekan)'}`;
          }).join(' · ')}
          {pekanPerPeriode.some((p) => p.pekan.some((n) => n > 0)) && (
            <span> · Angka bulanan diambil dari pekan terakhir yang ada isinya, bukan rata-rata.</span>
          )}
        </div>
      )}
      {ringkasanSekolahDilewati > 0 && (
        <div style={{ fontSize: 11.5, color: 'var(--status-warn)', marginTop: 6, lineHeight: 1.5 }}>
          ⚠ {ringkasanSekolahDilewati} sheet ringkasan sekolah tidak diimpor. Berkas ini punya satu
          sheet ringkasan &ldquo;sekolah&rdquo; per jenjang, padahal ringkasan tingkat sekolah cuma
          boleh ada satu; kalau semuanya dimasukkan, keenamnya saling menimpa dan yang tersisa cuma
          jenjang terakhir, tampil sebagai angka seluruh sekolah. Angka tingkat sekolah dihitung
          dari data skornya sendiri, bukan dari sheet ini.
        </div>
      )}
      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
        {kerangka.map((j) => (
          <div key={j.jenjang} style={{ padding: '8px 10px', background: 'var(--surface)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ungu-600)' }}>
              {j.jenjang === '*' ? 'Seluruh sekolah' : j.jenjang}
            </div>
            <div style={{ display: 'grid', gap: 4, marginTop: 4 }}>
              {j.aspek.map((a) => (
                <div key={a.kode} style={{ fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  <span className="mono" style={{ color: 'var(--ink-3)' }}>{a.kode}</span>{' '}
                  <strong style={{ color: 'var(--ink)' }}>{a.label || '(tanpa nama)'}</strong>
                  {a.indikator.length > 0 && <span> — {a.indikator.join(' · ')}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Upload() {
  const { data, loading, error, runImport, runMiGenerate, runScIndividuGenerate, retryScAccounts, refetch } = useCms();
  const [step, setStep] = useState(1);
  const [sekolahId, setSekolahId] = useState('');
  const [modul, setModul] = useState('karakter');
  // School Culture tidak punya kolom bulan/periode sendiri di filenya (sudah dicek langsung ke
  // contoh file asli), jadi periode wajib diketik admin sebelum upload -- beda dari Karakter/MI
  // yang membaca periode dari tiap baris file.
  const [periodeSc, setPeriodeSc] = useState('');
  // Modul Perilaku Anak saja: admin memilih eksplisit tiap upload apakah ini menambah periode
  // baru (default, aman -- periode lain tidak disentuh) atau memperbaiki periode yang sedang
  // berjalan (destruktif, hapus SELURUH periode sekolah ini). Lihat migration 20260802100000.
  const [paMode, setPaMode] = useState('baru');
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState(null);
  // Pratinjau dari parse yang GAGAL, dipakai supaya kerangka jenjang yang sempat terbaca tetap
  // terlihat di bawah pesan error (lihat catatan di handleFile).
  const [previewGagal, setPreviewGagal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [miProgress, setMiProgress] = useState(null); // { done, total }
  const [miResults, setMiResults] = useState(null); // ringkasan hasil generate
  // Mode "banyak sekolah dari file" saja: pemetaan manual nama-sekolah-di-file -> sekolah_id
  // terdaftar, untuk baris yang gagal cocok otomatis (lihat unresolved di parseMiWorkbook).
  const [miMapping, setMiMapping] = useState({});
  const [miMappingBusy, setMiMappingBusy] = useState(false);
  const [scImported, setScImported] = useState(false); // import mentah sc_personal/sc_lembaga selesai
  const [scProgress, setScProgress] = useState(null); // { done, total }
  const [scResults, setScResults] = useState(null); // ringkasan hasil generate laporan individu SC
  const [scApproveBusy, setScApproveBusy] = useState(false);
  const [scApproveProgress, setScApproveProgress] = useState(null); // { done, total }
  const [scApproveResult, setScApproveResult] = useState(null); // { okCount, failed, akunBaru, akunGagal }
  const [scRetryAkunBusy, setScRetryAkunBusy] = useState(false);

  if (loading) return <LoadingCards rows={3} />;
  if (error) {
    return <ErrorState title="Gagal memuat riwayat upload" desc={error} cta="Muat ulang" onCta={refetch} />;
  }

  const isMi = modul === 'mi';
  const isSc = modul === 'sc';
  const isPa = modul === 'pa';
  const isKarakter = modul === 'karakter';
  // SC dan PA sama-sama tidak punya kolom periode di dalam filenya, jadi keduanya memakai input
  // periode manual yang sama di langkah 2.
  const butuhPeriodeManual = isSc || isPa;
  const sekolah = data.sekolah.find((s) => s.id === sekolahId);
  // Ringkasan refleksi per sumber (orang tua/siswa) dari hasil parse karakterImporter. Optional
  // chaining di seluruh rantai supaya modul lain atau hasil parse lama (tanpa field ini) tidak
  // melempar error, blok tampilannya cukup tidak dirender.
  const refleksiPreview = parsed?.preview?.refleksiPerSumber
    ? {
        orangtua: parsed.preview.refleksiPerSumber.orangtua ?? 0,
        siswa: parsed.preview.refleksiPerSumber.siswa ?? 0,
        sheetAda: parsed.preview.refleksiSheetAda || [],
        dilewatiOrangtua: parsed.preview.refleksiBarisDilewati?.orangtua || 0,
        dilewatiSiswa: parsed.preview.refleksiBarisDilewati?.siswa || 0,
      }
    : null;

  function resetFlow() {
    setStep(1); setSekolahId(''); setModul('karakter'); setFile(null);
    setParsed(null); setParseError(null); setPreviewGagal(null); setMiProgress(null); setMiResults(null); setPeriodeSc('');
    setPaMode('baru');
    setMiMapping({}); setMiMappingBusy(false);
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
      // akunGagal DIPISAH dari `failed` -- laporan TETAP tayang meski akunnya gagal dibuat
      // (lihat ensureKaryawanScAccount), jadi ini bukan kegagalan approve, tapi kegagalan
      // berbeda yang SEBELUMNYA dibuang diam-diam (cuma `akun?.created` yang dicek). Sengaja
      // dipisah dari daftar `failed` supaya admin tidak bingung "laporannya gagal atau tidak".
      const akunGagal = [];
      for (let i = 0; i < rowsSekolahIni.length; i++) {
        const r = rowsSekolahIni[i];
        // Jeda kecil ANTAR approve -- tiap approve memicu createUser lewat Supabase Auth admin
        // API, menembak beruntun tanpa jeda diduga jadi penyebab kegagalan diam-diam yang
        // pernah terjadi (16 laporan tayang, cuma 11 akun jadi -- lihat riwayat perbaikan ini).
        if (i > 0) await new Promise((resolve) => setTimeout(resolve, 400));
        try {
          const akun = await actScApproval(r.id, 'setuju');
          okCount++;
          if (akun?.created) akunBaru.push({ username: akun.username, password: akun.password });
          else if (akun && !akun.existing) akunGagal.push({ nama: r.nama_responden || r.sc_personal_id, error: akun.error || 'Gagal tanpa keterangan.' });
        } catch (e) {
          failed.push({ nama: r.nama_responden || r.sc_personal_id, error: e.message || String(e) });
        }
        setScApproveProgress({ done: i + 1, total: rowsSekolahIni.length });
      }
      setScApproveResult({ okCount, failed, akunBaru, akunGagal });
    } catch (e) {
      setParseError(e.message || 'Gagal memuat antrian persetujuan School Culture.');
    } finally {
      setScApproveBusy(false);
      setScApproveProgress(null);
    }
  }

  // Tombol pemulihan: laporan sudah tayang, tapi sebagian akun Karyawan-nya gagal dibuat (lihat
  // akunGagal di atas). Dipanggil terpisah dari approve supaya bisa diklik berkali-kali sampai
  // semua beres, tanpa perlu mengulang approve (yang sudah tayang tidak boleh disetujui dua kali).
  async function handleRetryAkun() {
    setScRetryAkunBusy(true);
    try {
      const result = await retryScAccounts(sekolahId, periodeSc);
      setScApproveResult((s) => ({
        ...s,
        akunBaru: [...(s?.akunBaru || []), ...result.akunBaru],
        akunGagal: result.gagal,
      }));
    } catch (e) {
      setParseError(e.message || 'Gagal memeriksa ulang akun Karyawan.');
    } finally {
      setScRetryAkunBusy(false);
    }
  }

  async function handleFile(f) {
    if (!f) return;
    setFile(f);
    setParseError(null);
    setPreviewGagal(null);
    setParsed(null);
    setMiResults(null);
    try {
      let result;
      if (modul === 'karakter') {
        result = await parseKarakterWorkbook(f, { sekolahId });
      } else if (modul === 'mi') {
        // Sekolah tunggal dipilih di langkah 1 (bukan sentinel SEKOLAH_MI): pakai langsung,
        // kolom sekolah di file diabaikan sama sekali -- tidak ada nama yang perlu dicocokkan.
        result = await parseMiWorkbook(f, { schools: data.sekolah, sekolahId: sekolahId !== SEKOLAH_MI ? sekolahId : null });
        if (result.ok && result.unresolved?.length > 0) {
          const initial = {};
          result.unresolved.forEach((u) => { initial[u.namaFile] = u.suggestion?.id || ''; });
          setMiMapping(initial);
        }
      } else if (modul === 'sc') {
        result = await parseScWorkbook(f, { sekolahId, periodeId: periodeSc });
      } else if (modul === 'pa') {
        // Perilaku Anak ikut pola SC: periode tidak ada di dalam file, diketik admin di langkah 2.
        result = await parsePaWorkbook(f, { sekolahId, periodeId: periodeSc });
      } else {
        setParseError('Importer untuk modul ini belum tersedia (baru Karakter, MI, School Culture, dan Perilaku Anak).');
        return;
      }
      // Pratinjau kerangka tetap disimpan walau parse GAGAL. Justru di situlah admin paling
      // butuh melihat apa yang sempat terbaca: berkas yang ditolak karena dua baris nyasar
      // tetap memperlihatkan enam jenjang beserta karakternya, jadi admin tahu berkasnya sudah
      // hampir benar dan tinggal membetulkan yang disebut pesan errornya.
      if (!result.ok) { setParseError(result.error); setPreviewGagal(result.preview || null); return; }
      setParsed(result);
      setStep(4);
    } catch (e) {
      setParseError(e.message || 'Gagal memparse file.');
    }
  }

  // Setelah admin memetakan tiap nama-sekolah-tak-dikenal ke sekolah terdaftar (atau memilih
  // lewati), gabungkan baris yang baru terselesaikan ke rows utama tanpa perlu upload ulang file.
  async function applyMiMapping() {
    setMiMappingBusy(true);
    setParseError(null);
    try {
      const mapping = {};
      Object.entries(miMapping).forEach(([namaFile, v]) => { mapping[namaFile] = v === '__skip__' || !v ? null : v; });
      const { rows: extraRows } = await resolveMiUnresolved(parsed.unresolved, mapping, parsed.muridState);
      const mergedRows = [...parsed.rows, ...extraRows];
      setParsed({
        ...parsed,
        rows: mergedRows,
        unresolved: undefined,
        preview: { ...parsed.preview, periodeDetected: computePeriodeDetected(mergedRows), sekolahCount: new Set(mergedRows.map((r) => r.sekolah_id)).size },
      });
      setMiMapping({});
    } catch (e) {
      setParseError(e.message || 'Gagal mencocokkan sekolah.');
    } finally {
      setMiMappingBusy(false);
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
        await runImport({ sekolahId, modul, fileName: file?.name, parsed, paMode });
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
              // Mode "banyak sekolah dari file": modul otomatis MI (satu-satunya yang didukung
              // mode ini). Pindah ke sekolah spesifik TIDAK memaksa modul lain -- MI tetap valid
              // untuk satu sekolah juga, jadi pilihan modul admin dibiarkan seperti sebelumnya.
              if (v === SEKOLAH_MI) setModul('mi');
            }}
          >
            <option value="">— Pilih sekolah —</option>
            <option value={SEKOLAH_MI}>— Modul MI: banyak sekolah, dibaca dari file —</option>
            {data.sekolah.map((s) => <option key={s.id} value={s.id}>{s.nama} ({s.id})</option>)}
          </select>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 8 }}>Untuk modul MI: pilih sekolah tujuan seperti biasa kalau filenya cuma untuk satu sekolah. Baris paling atas ("banyak sekolah, dibaca dari file") cuma dipakai kalau satu file mencampur beberapa sekolah sekaligus, dicocokkan lewat nama tiap barisnya.</div>
          <button className="btn-primary" style={{ marginTop: 16 }} disabled={!sekolahId} onClick={() => setStep(2)}>Lanjut ke langkah 2</button>
        </div>
      )}

      {step === 2 && (
        <div className="card" style={{ padding: 24 }}>
          <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>Pilih modul</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            {['karakter', 'mi', 'screening', 'sc', 'pa'].map((m) => {
              const mc = moduleColor(m);
              const active = m === modul;
              // Modul MI selalu boleh dipilih, baik untuk satu sekolah spesifik (dari file
              // sekolah_id-nya diabaikan, langsung pakai sekolah yang dipilih) maupun mode
              // "banyak sekolah dari file". Modul lain butuh satu sekolah konkret, jadi terkunci
              // selama masih di mode MI sentinel (belum ada sekolah spesifik yang dipilih).
              const locked = sekolahId === SEKOLAH_MI && m !== 'mi';
              return (
                <button key={m} className="clk" disabled={locked} onClick={() => setModul(m)} style={{ padding: '10px 14px', borderRadius: 11, fontSize: 12.5, fontWeight: 700, opacity: locked ? 0.4 : 1, cursor: locked ? 'not-allowed' : 'pointer', background: active ? mc.bg : 'var(--surface-soft)', color: active ? mc.ink : 'var(--ink-2)', boxShadow: active ? 'none' : 'inset 0 0 0 1px var(--line)' }}>
                  {moduleShort(m)}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 14 }}>
            {isMi
              ? (sekolahId === SEKOLAH_MI
                ? 'MI: tiap baris file = satu siswa, boleh lintas sekolah. Sekolah tiap baris dicocokkan ke sekolah terdaftar lewat namanya; yang tidak cocok bisa dipetakan manual sebelum generate. Periode dibaca dari file.'
                : `MI: tiap baris file = satu siswa. Semua baris langsung dianggap milik ${sekolah?.nama || 'sekolah yang dipilih'} -- kolom sekolah di file (kalau ada) diabaikan. Periode dibaca dari file.`)
              : isSc
              ? 'School Culture: sheet "Personal" (satu baris per staf) + sheet "Lembaga" (agregat sekolah). File ini TIDAK punya kolom bulan sendiri, jadi periode wajib diisi manual di bawah.'
              : isPa
              ? 'Perilaku Anak: satu workbook berisi sheet data (PAGE 1-4) + sheet NARASI. Sheet dikenali dari nama kolomnya, bukan nama sheet-nya. File TIDAK punya kolom bulan, jadi periode wajib diisi manual di bawah. Pilih juga mode unggah di bawah sebelum lanjut.'
              : 'Periode tidak perlu diketik manual — sistem membaca kolom "bulan" langsung dari tiap baris file, jadi satu file boleh memuat beberapa bulan sekaligus.'}
          </div>
          {butuhPeriodeManual && (
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
          {/* Perilaku Anak saja: pilihan eksplisit "unggah periode baru" (default, aman -- periode
              lain tidak disentuh) vs "unggah ulang" (perbaiki periode ini, tapi menghapus SELURUH
              periode sekolah ini dulu). Keduanya tidak bisa dibedakan dari isi berkas saja, jadi
              admin yang harus memilih -- lihat migration 20260802100000_pa_import_mode.sql. */}
          {isPa && (
            <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>Mode unggah</label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', border: paMode === 'baru' ? '1px solid var(--purple-600)' : '1px solid var(--line)', borderRadius: 10, background: paMode === 'baru' ? 'var(--purple-050)' : 'var(--surface-soft)', cursor: 'pointer' }}>
                <input type="radio" name="paMode" value="baru" checked={paMode === 'baru'} onChange={() => setPaMode('baru')} style={{ marginTop: 3 }} />
                <span>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>Unggah periode baru</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>Menambah periode {periodeSc || '(isi dulu di atas)'} untuk sekolah ini. Periode lain yang sudah ada TIDAK terhapus. Kalau periode ini sudah pernah diunggah sebelumnya, isinya diganti (tidak dobel).</span>
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', border: paMode === 'ulang' ? '1px solid var(--status-alert)' : '1px solid var(--line)', borderRadius: 10, background: paMode === 'ulang' ? 'var(--status-alert-bg)' : 'var(--surface-soft)', cursor: 'pointer' }}>
                <input type="radio" name="paMode" value="ulang" checked={paMode === 'ulang'} onChange={() => setPaMode('ulang')} style={{ marginTop: 3 }} />
                <span>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>Unggah ulang (perbaiki periode ini)</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>Menghapus SELURUH data Perilaku Anak sekolah ini (semua periode, termasuk periode selain {periodeSc || 'yang diisi di atas'}), lalu mengganti total dengan isi berkas ini. Tidak bisa dibatalkan.</span>
                </span>
              </label>
            </div>
          )}
          <button className="btn-primary" disabled={butuhPeriodeManual && !/^\d{4}-\d{2}$/.test(periodeSc)} onClick={() => setStep(3)}>Lanjut ke langkah 3</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="card" style={{ padding: '14px 20px', marginBottom: 14, display: 'flex', gap: 20, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Sekolah</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 2 }}>{sekolahId === SEKOLAH_MI ? 'Banyak sekolah (dari file)' : `${sekolah?.nama} (${sekolahId})`}</div>
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
                ? (sekolahId === SEKOLAH_MI
                  ? '.xlsx / .xls · satu sheet, satu baris per siswa (kolom nama_siswa, kelas_id, sekolah_id, periode, r_inter..r_spasial, essay_*)'
                  : '.xlsx / .xls · satu sheet, satu baris per siswa (kolom nama_siswa, kelas_id, periode, r_inter..r_spasial, essay_*). Kolom sekolah di file boleh ada atau tidak, tidak dipakai.')
                : modul === 'sc'
                ? '.xlsx / .xls · sheet "Personal" (satu baris per staf) + sheet "Lembaga" (agregat sekolah)'
                : '.xlsx / .xls · sheet detail_persentase_karakter dkk (format sama seperti data awal). Sheet detail_pernyataan_siswa opsional, untuk refleksi siswa sendiri.'}
            </div>
            <label className="btn-primary" style={{ display: 'inline-flex', cursor: 'pointer' }}>
              Pilih file
              <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files?.[0])} />
            </label>
            {parseError && <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--status-alert)' }}>⚠ {parseError}</div>}
            {/* Kerangka yang sempat terbaca tetap ditampilkan walau berkasnya ditolak -- lihat
                catatan di KerangkaPreview dan handleFile. */}
            {parseError && previewGagal && (
              <KerangkaPreview kerangka={previewGagal.kerangka} perJenjang={previewGagal.perJenjang} barisHeaderTerulang={previewGagal.barisHeaderTerulang} ringkasanSekolahDilewati={previewGagal.ringkasanSekolahDilewati} pekanPerPeriode={previewGagal.pekanPerPeriode} />
            )}
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

          {parsed.unresolved?.length > 0 && (
            <div className="card" style={{ padding: '16px 22px', marginBottom: 14, boxShadow: 'inset 0 0 0 1px var(--status-warn)' }}>
              <div className="disp" style={{ fontSize: 14, fontWeight: 700, color: 'var(--status-warn)', marginBottom: 6 }}>
                ⚠ {parsed.unresolved.length} nama sekolah di file belum cocok dengan yang terdaftar ({parsed.unresolved.reduce((n, u) => n + u.count, 0)} siswa tertahan)
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 12, lineHeight: 1.5 }}>
                Cocokkan tiap nama ke sekolah terdaftar, atau lewati baris-baris itu. Tidak ditebak otomatis -- pilih sendiri per baris supaya tidak salah sekolah.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {parsed.unresolved.map((u) => (
                  <div key={u.namaFile} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, fontSize: 12.5, minWidth: 0 }}>
                      <span className="mono">{u.namaFile}</span>
                      <span style={{ color: 'var(--ink-3)' }}> · {u.count} siswa</span>
                      {u.suggestion && <span style={{ color: 'var(--purple-600)' }}> · mirip "{u.suggestion.nama}"</span>}
                    </div>
                    <select
                      className="fld" style={{ maxWidth: 280 }}
                      value={miMapping[u.namaFile] || ''}
                      onChange={(e) => setMiMapping((m) => ({ ...m, [u.namaFile]: e.target.value }))}
                    >
                      <option value="">— pilih sekolah —</option>
                      <option value="__skip__">Lewati {u.count} siswa ini</option>
                      {data.sekolah.map((s) => <option key={s.id} value={s.id}>{s.nama} ({s.id})</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button
                className="btn-primary" disabled={miMappingBusy || parsed.unresolved.some((u) => !miMapping[u.namaFile])}
                onClick={applyMiMapping}
              >
                {miMappingBusy ? 'Mencocokkan…' : 'Terapkan pencocokan'}
              </button>
            </div>
          )}

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
          ) : !parsed.unresolved?.length ? (
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
                {/* rows bisa 0 kalau semua baris tadinya tak-cocok lalu admin memilih lewati
                    semuanya -- tanpa guard ini tombol berbunyi "Generate 0 laporan". */}
                <button className="btn-primary" onClick={handleConfirm} disabled={busy || parsed.rows.length === 0}>
                  {busy ? 'Menggenerate…' : parsed.rows.length === 0 ? 'Tidak ada siswa tersisa' : `Generate ${parsed.rows.length} laporan MI`}
                </button>
              </div>
            </div>
          ) : null}
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
                    : isPa
                    ? `${parsed.rows.siswaRows.length} baris siswa/domain · ${parsed.rows.lembagaRows.length} baris agregat · ${parsed.rows.esaiRows.length} jawaban esai`
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
                  <span className="mono">{s.name}{s.sheetCount > 1 ? ` ×${s.sheetCount}` : ''}</span>
                  <span style={{ color: s.found ? 'var(--status-safe)' : 'var(--ink-4)', fontWeight: 700 }}>{s.found ? `${s.rows} baris` : 'tidak ada'}</span>
                </div>
              ))}
            </div>

            {isKarakter && (
              <KerangkaPreview
                kerangka={parsed.preview.kerangka}
                perJenjang={parsed.preview.perJenjang}
                barisHeaderTerulang={parsed.preview.barisHeaderTerulang}
                ringkasanSekolahDilewati={parsed.preview.ringkasanSekolahDilewati}
                pekanPerPeriode={parsed.preview.pekanPerPeriode}
              />
            )}

            {/* Karakter: ringkasan baris refleksi per sumber (orang tua/siswa) hasil parse.
                Sumber yang sheet-nya tidak ada di file ditulis eksplisit "tidak ada di file",
                bukan "0 baris", supaya admin bisa membedakan sheet kosong dari sheet absen. */}
            {isKarakter && refleksiPreview && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: (refleksiPreview.dilewatiOrangtua + refleksiPreview.dilewatiSiswa) > 0 ? 'var(--status-warn-bg)' : 'var(--status-safe-bg)', borderRadius: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: (refleksiPreview.dilewatiOrangtua + refleksiPreview.dilewatiSiswa) > 0 ? 'var(--status-warn)' : 'var(--status-safe)' }}>
                  💬 Refleksi orang tua: {refleksiPreview.sheetAda.includes('orangtua') ? `${refleksiPreview.orangtua} baris` : 'tidak ada di file'} · Refleksi siswa: {refleksiPreview.sheetAda.includes('siswa') ? `${refleksiPreview.siswa} baris` : 'tidak ada di file'}
                </div>
                {(refleksiPreview.dilewatiOrangtua + refleksiPreview.dilewatiSiswa) > 0 && (
                  <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.5 }}>
                    {[
                      refleksiPreview.dilewatiOrangtua > 0 ? `${refleksiPreview.dilewatiOrangtua} baris orang tua` : null,
                      refleksiPreview.dilewatiSiswa > 0 ? `${refleksiPreview.dilewatiSiswa} baris siswa` : null,
                    ].filter(Boolean).join(' · ')} dilewati karena kosong (sisa spreadsheet selain kolom bulan).
                  </div>
                )}
                <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 4 }}>
                  Sumber yang tidak ada di file tidak akan dihapus dari periode yang sama.
                </div>
              </div>
            )}

            {/* Karakter: baris ganda yang disaring importer. Dulu baris seperti ini lolos ke
                Postgres dan menggagalkan seluruh periode dengan pesan mentah "duplicate key
                value violates unique constraint" yang tidak menyebut satu pun nama murid.
                Sekarang importnya jalan (baris terakhir yang dipakai), tapi daftarnya WAJIB
                terlihat sebelum konfirmasi: kalau kelasnya beda, itu tanda kuat dua anak berbeda
                bernama sama, bukan satu anak yang mengisi dua kali -- dan itu perlu dibetulkan
                di berkas sumbernya, bukan diputuskan importer. */}
            {isKarakter && parsed.preview.duplikat?.total > 0 && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--status-warn-bg)', borderRadius: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--status-warn)' }}>
                  ⚠ {parsed.preview.duplikat.murid.length} murid punya baris ganda di file ini ({parsed.preview.duplikat.total} baris disaring)
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.5 }}>
                  Baris terakhir untuk tiap murid yang dipakai, sisanya dibuang supaya import tidak gagal total.
                  {parsed.preview.duplikat.murid.some((m) => m.bedaKelas) && ' Yang ditandai beda kelas kemungkinan dua anak berbeda dengan nama sama, cek berkas sumbernya.'}
                </div>
                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {parsed.preview.duplikat.murid.slice(0, 12).map((m, i) => (
                    <span key={i} className="pill" style={{ background: 'var(--surface)', color: m.bedaKelas ? 'var(--status-alert)' : 'var(--ink-2)' }}>
                      {m.nama} · {periodeLabel(m.periode)}{m.bedaKelas ? ` · beda kelas: ${m.kelas.join(' / ')}` : ''}
                    </span>
                  ))}
                  {parsed.preview.duplikat.murid.length > 12 && (
                    <span style={{ fontSize: 11.5, color: 'var(--ink-3)', alignSelf: 'center' }}>+{parsed.preview.duplikat.murid.length - 12} murid lain</span>
                  )}
                </div>
              </div>
            )}

            {/* Kolom "laporan_json" (opsional): laporan siap pakai dari hulu. Ditampilkan SEBELUM
                konfirmasi supaya admin tahu berapa orang yang tidak perlu Gemini sama sekali, dan
                baris mana yang JSON-nya perlu diperbaiki dulu kalau tidak mau jatuh ke Gemini. */}
            {/* Perilaku Anak: status kelengkapan narasi. Ini yang membedakan unggahan tahap 1
                (data saja, kolom ISI_ masih kosong) dari tahap 2 (narasi sudah diisi) -- admin
                perlu tahu SEBELUM konfirmasi, karena keduanya sama-sama "berhasil" di mata
                importer, cuma laporannya nanti tampil tanpa kalimat insight. */}
            {isPa && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: parsed.preview.pregenWarnings?.length > 0 ? 'var(--status-warn-bg)' : 'var(--status-safe-bg)', borderRadius: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: parsed.preview.pregenWarnings?.length > 0 ? 'var(--status-warn)' : 'var(--status-safe)' }}>
                  📝 Narasi terisi untuk {parsed.preview.narasiScopeTerisi} cakupan unit · {parsed.preview.anotasiEsaiTerisi} dari {parsed.rows.esaiRows.length} jawaban esai sudah dianotasi
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.5 }}>
                  Unit terdeteksi: {(parsed.preview.unitTerdeteksi || []).join(' · ') || '—'}.
                </div>
                {/* Mode dipilih admin di langkah 2 (lihat migration 20260802100000) -- 'ulang'
                    destruktif (hapus semua periode sekolah ini), 'baru' cuma ganti periode yang
                    sama. Konfirmasi terakhir sebelum menekan tombol wajib mengulang konsekuensi
                    mode yang dipilih, bukan cuma diasumsikan dari langkah sebelumnya. */}
                {paMode === 'ulang' ? (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--status-alert-bg)', borderRadius: 8, fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                    ⚠ Mode <strong>unggah ulang</strong>: menghapus seluruh data Perilaku Anak sekolah ini (semua periode, termasuk periode selain {periodeSc}), lalu menggantinya dengan isi berkas ini. Tidak bisa dibatalkan.
                  </div>
                ) : (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--status-warn-bg)', borderRadius: 8, fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                    ⚠ Mode <strong>unggah periode baru</strong>: menambah/mengganti periode {periodeSc}, periode lain sekolah ini tidak disentuh.
                  </div>
                )}
                {parsed.preview.pregenWarnings?.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {parsed.preview.pregenWarnings.map((w, i) => (
                      <div key={i} style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>⚠ {w}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                      {/* Laporan sudah tayang, tapi akun Karyawan-nya gagal dibuat -- SEBELUMNYA
                          dibuang diam-diam (cuma akun?.created yang dicek), staf yang kena ini
                          tidak akan pernah bisa login sampai admin sadar dan buat akunnya manual.
                          Tombol di bawah aman diklik berkali-kali sampai semua beres. */}
                      {scApproveResult.akunGagal?.length > 0 && (
                        <div style={{ marginBottom: 12, padding: '12px 14px', background: 'var(--status-warn-bg)', borderRadius: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--status-warn)', marginBottom: 8 }}>
                            ⚠ {scApproveResult.akunGagal.length} laporan tayang tapi akun Karyawan-nya BELUM jadi
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                            {scApproveResult.akunGagal.map((f, i) => (
                              <div key={i} style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{f.nama}: {f.error}</div>
                            ))}
                          </div>
                          <button className="btn-secondary" onClick={handleRetryAkun} disabled={scRetryAkunBusy}>
                            {scRetryAkunBusy ? 'Mencoba lagi…' : '🔁 Coba lagi buat akun yang gagal'}
                          </button>
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
                  {isSc ? 'sc_personal · sc_lembaga' : isPa ? 'pa_lembaga · pa_siswa · pa_esai' : 'karakter_skor · karakter_skor_indikator · karakter_pernyataan_ortu · karakter_summary'}
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

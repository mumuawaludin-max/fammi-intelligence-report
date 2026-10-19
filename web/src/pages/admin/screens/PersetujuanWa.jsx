import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCms } from '../store/CmsStore';
import { LoadingCards } from '../components/LoadingCards';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { WaNarasiDrawer } from '../components/WaNarasiDrawer';
import { actWaApprovalAction, actWaBulkApprovalAction, editWaNarasiAction, loadWaNarasiAction } from '../useAdminCmsData';
import { LABEL_ISU_QC, isianTeks, qcNarasiWa } from '../../wa/lib/waAturan';

// Persetujuan narasi Wellbeing Assessment (modul wa). Narasi masuk dari seed berstatus
// menunggu_persetujuan dan tidak terbaca siapa pun sampai disetujui di sini (RLS wa_narasi).
// Data ditarik lewat admin-actions (service role) karena kolom peninjau (perlu_ahli,
// alasan_perhatian) tidak diberikan ke peran authenticated.
//
// Respons untuk cerita pribadi pegawai dan narasi berpenanda perlu ahli tidak ikut "Setujui yang
// tampil". Keduanya disetujui satu per satu, atau sekaligus lewat "Setujui semua respons cerita"
// (keputusan pemilik produk 2026-10-19) yang mewajibkan centang "sudah ditinjau psikolog". Server
// menegakkan aturan yang sama, tombol di sini hanya mengikutinya.

const CAKUPAN = [
  { kunci: '', label: 'Semua' },
  { kunci: 'lembaga', label: 'Lembaga' },
  { kunci: 'jenjang', label: 'Jenjang' },
  { kunci: 'unit', label: 'Unit' },
  { kunci: 'kelompok_jabatan', label: 'Jabatan' },
  { kunci: 'individu', label: 'Laporan pribadi' },
  { kunci: 'respons_cerita', label: 'Respons cerita' },
];

const STATUS = [
  { kunci: 'menunggu_persetujuan', label: 'Menunggu' },
  { kunci: 'disetujui', label: 'Sudah tayang' },
  { kunci: 'ditolak', label: 'Ditolak' },
];

const PER_HALAMAN = 40;

function cuplikan(isi) {
  const t = isianTeks(isi).map((x) => x.nilai).find((s) => s && s.length > 30) || '';
  return t.length > 180 ? `${t.slice(0, 180)}…` : t;
}

export function PersetujuanWa() {
  const { showToast } = useCms();
  const [status, setStatus] = useState('menunggu_persetujuan');
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const [cakupan, setCakupan] = useState('');
  const [hanyaAhli, setHanyaAhli] = useState(false);
  const [cari, setCari] = useState('');
  const [batas, setBatas] = useState(PER_HALAMAN);
  const [buka, setBuka] = useState(null);
  const [sibukMassal, setSibukMassal] = useState(false);

  const load = useCallback(async (s) => {
    setState((x) => ({ ...x, loading: true, error: null }));
    try {
      const rows = await loadWaNarasiAction(s);
      setState({ loading: false, error: null, rows });
    } catch (e) {
      setState({ loading: false, error: e.message || String(e), rows: [] });
    }
  }, []);

  // Ditunda satu putaran supaya setState tidak berjalan sinkron di badan effect.
  useEffect(() => { Promise.resolve().then(() => load(status)); }, [load, status]);

  const hitung = useMemo(() => {
    const h = {};
    for (const r of state.rows) h[r.cakupan] = (h[r.cakupan] || 0) + 1;
    return h;
  }, [state.rows]);

  const tersaring = useMemo(() => {
    const k = cari.trim().toLowerCase();
    return state.rows.filter((r) => (!cakupan || r.cakupan === cakupan)
      && (!hanyaAhli || r.butuh_tinjauan_ahli)
      && (!k || `${r.nama} ${r.unit || ''} ${r.sekolah_nama}`.toLowerCase().includes(k)));
  }, [state.rows, cakupan, hanyaAhli, cari]);

  const bisaMassal = tersaring.filter((r) => !r.butuh_tinjauan_ahli);
  const nAhli = state.rows.filter((r) => r.butuh_tinjauan_ahli).length;
  // Respons cerita yang tampil (ikut saringan cari dan "hanya perlu ahli"), untuk persetujuan massal
  // bertanda tinjauan psikolog.
  const responsTampil = tersaring.filter((r) => r.cakupan === 'respons_cerita');
  const responsAhli = responsTampil.filter((r) => r.perlu_ahli).length;
  const [konfirmasiRespons, setKonfirmasiRespons] = useState(false);
  const [sudahDitinjau, setSudahDitinjau] = useState(false);

  const kunciBaris = (r) => `${r.dataset_id}|${r.cakupan}|${r.kunci}`;
  const buang = (rows) => {
    const k = new Set(rows.map(kunciBaris));
    setState((s) => ({ ...s, rows: s.rows.filter((r) => !k.has(kunciBaris(r))) }));
  };

  async function act(row, aksi, tinjauanAhli) {
    try {
      await actWaApprovalAction(row, aksi, tinjauanAhli);
      buang([row]);
      showToast(aksi === 'setuju' ? 'Narasi disetujui dan tayang.' : 'Narasi ditolak.', aksi === 'setuju' ? 'safe' : 'alert');
    } catch (e) {
      showToast('Gagal: ' + e.message, 'alert', 6000);
      throw e;
    }
  }

  async function simpan(row, isi) {
    try {
      await editWaNarasiAction(row, isi);
      setState((s) => ({ ...s, rows: s.rows.map((r) => (kunciBaris(r) === kunciBaris(row) ? { ...r, isi, disunting: true } : r)) }));
      setBuka((b) => (b && kunciBaris(b) === kunciBaris(row) ? { ...b, isi, disunting: true } : b));
      showToast('Perubahan disimpan.', 'safe');
    } catch (e) {
      showToast('Gagal simpan: ' + e.message, 'alert', 6000);
      throw e;
    }
  }

  async function setujuiMassal() {
    if (!bisaMassal.length) return;
    const dilewati = tersaring.length - bisaMassal.length;
    const pesan = `Setujui ${bisaMassal.length} narasi yang tampil sekaligus? Semuanya langsung tayang.`
      + (dilewati ? `\n\n${dilewati} respons cerita atau narasi perlu ahli dilewati; tinjau satu per satu.` : '');
    if (!window.confirm(pesan)) return;
    setSibukMassal(true);
    try {
      const hasil = await actWaBulkApprovalAction(bisaMassal);
      buang(bisaMassal);
      showToast(`${hasil.disetujui} narasi disetujui dan tayang.${hasil.dilewati ? ` ${hasil.dilewati} dilewati.` : ''}`, 'safe', 6000);
      if (hasil.dilewati) load(status);
    } catch (e) {
      showToast('Gagal: ' + e.message, 'alert', 6000);
    } finally {
      setSibukMassal(false);
    }
  }

  async function setujuiSemuaRespons() {
    if (!responsTampil.length || !sudahDitinjau) return;
    setSibukMassal(true);
    try {
      const hasil = await actWaBulkApprovalAction(responsTampil, { tinjauanAhli: true });
      if (hasil.disetujui === 0) {
        // Edge Function versi lama mengabaikan tinjauan_ahli dan melewati semua respons cerita.
        showToast('Tidak ada respons yang disetujui. Pastikan Edge Function admin-actions sudah versi terbaru.', 'alert', 8000);
      } else {
        showToast(`${hasil.disetujui} respons cerita disetujui dan tayang.${hasil.dilewati ? ` ${hasil.dilewati} dilewati.` : ''}`, 'safe', 6000);
      }
      setKonfirmasiRespons(false);
      setSudahDitinjau(false);
      load(status);
    } catch (e) {
      showToast('Gagal: ' + e.message, 'alert', 6000);
    } finally {
      setSibukMassal(false);
    }
  }

  return (
    <div style={{ padding: '22px 26px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 720 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Persetujuan Wellbeing</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2, lineHeight: 1.5 }}>
            Narasi Wellbeing Assessment dari berkas olahan. Narasi kelompok tayang ke Human Capital, laporan pribadi dan respons cerita hanya ke pegawai yang bersangkutan. Respons cerita dan narasi perlu ahli wajib ditinjau psikolog sebelum disetujui; respons cerita bisa disetujui sekaligus setelah dinyatakan sudah ditinjau.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => load(status)} disabled={sibukMassal}>Refresh</button>
          {status === 'menunggu_persetujuan' && bisaMassal.length > 0 && (
            <button className="btn-primary" style={{ fontSize: 12.5, background: 'var(--status-safe)' }} onClick={setujuiMassal} disabled={sibukMassal}>
              {sibukMassal ? 'Menyetujui…' : `✓ Setujui yang tampil (${bisaMassal.length})`}
            </button>
          )}
          {status === 'menunggu_persetujuan' && responsTampil.length > 0 && (
            <button className="btn-secondary" style={{ fontSize: 12.5 }} onClick={() => { setSudahDitinjau(false); setKonfirmasiRespons(true); }} disabled={sibukMassal}>
              ✓ Setujui semua respons cerita ({responsTampil.length})
            </button>
          )}
        </div>
      </div>

      {konfirmasiRespons && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(33,27,46,.42)', zIndex: 60 }} onClick={sibukMassal ? undefined : () => setKonfirmasiRespons(false)} />
          <div className="dialog-enter" role="dialog" aria-modal="true" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--surface)', borderRadius: 20, width: 'min(520px,92vw)', padding: '22px 24px', boxShadow: '0 24px 60px rgba(33,27,46,.28)', zIndex: 70, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="disp" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Setujui {responsTampil.length} respons cerita?</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              Semua respons yang tampil langsung terbaca oleh pegawai pemiliknya.
              {responsAhli > 0 && <> <b style={{ color: 'var(--status-warn)' }}>{responsAhli} di antaranya bertanda wajib ditinjau psikolog.</b></>}
              {(cari.trim() || hanyaAhli) && ' Saringan yang aktif ikut berlaku; respons di luar saringan tidak ikut.'}
            </div>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12, background: 'var(--status-warn-bg)', fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={sudahDitinjau} onChange={(e) => setSudahDitinjau(e.target.checked)} disabled={sibukMassal} style={{ marginTop: 3 }} />
              <span>Saya menyatakan seluruh {responsTampil.length} respons ini sudah ditinjau psikolog dan layak tayang.</span>
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-ghost" onClick={() => setKonfirmasiRespons(false)} disabled={sibukMassal}>Batal</button>
              <button className="btn-primary" style={{ background: 'var(--status-safe)' }} onClick={setujuiSemuaRespons} disabled={!sudahDitinjau || sibukMassal}>
                {sibukMassal ? 'Menyetujui…' : `Setujui ${responsTampil.length} respons`}
              </button>
            </div>
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {STATUS.map((s) => (
          <button key={s.kunci} className={status === s.kunci ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => { setStatus(s.kunci); setBatas(PER_HALAMAN); }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        {CAKUPAN.map((c) => {
          const n = c.kunci ? (hitung[c.kunci] || 0) : state.rows.length;
          if (c.kunci && !n) return null;
          const aktif = cakupan === c.kunci;
          return (
            <button key={c.kunci || 'semua'} className="pill clk" onClick={() => { setCakupan(c.kunci); setBatas(PER_HALAMAN); }}
              style={{ cursor: 'pointer', border: 'none', background: aktif ? 'var(--purple-600)' : 'var(--purple-050)', color: aktif ? '#fff' : 'var(--purple-700)' }}>
              {c.label} · {n}
            </button>
          );
        })}
        {nAhli > 0 && (
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: 'var(--status-warn)', fontWeight: 700, marginLeft: 6 }}>
            <input type="checkbox" checked={hanyaAhli} onChange={(e) => setHanyaAhli(e.target.checked)} /> Hanya yang wajib ditinjau psikolog ({nAhli})
          </label>
        )}
        <input className="fld" style={{ marginLeft: 'auto', maxWidth: 260, fontSize: 12.5 }} placeholder="Cari nama, unit, sekolah" value={cari} onChange={(e) => { setCari(e.target.value); setBatas(PER_HALAMAN); }} />
      </div>

      {state.loading && <LoadingCards rows={5} />}
      {!state.loading && state.error && <ErrorState title="Gagal memuat narasi Wellbeing Assessment" desc={state.error} cta="Muat ulang" onCta={() => load(status)} />}
      {!state.loading && !state.error && tersaring.length === 0 && (
        <EmptyState title="Tidak ada narasi di sini" desc={status === 'menunggu_persetujuan' ? 'Narasi masuk lewat seed hasil npm run wa:baca dan menunggu di sini sampai disetujui.' : 'Belum ada narasi dengan status ini.'} />
      )}

      {!state.loading && !state.error && tersaring.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
            {tersaring.slice(0, batas).map((r) => {
              const qc = [...new Set(qcNarasiWa(r).map((x) => x.isu))];
              return (
                <div key={kunciBaris(r)} className="card lift" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }} onClick={() => setBuka(r)}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="pill" style={{ background: '#F1EEF9', color: '#342060' }}>{CAKUPAN.find((c) => c.kunci === r.cakupan)?.label || r.cakupan}</span>
                    {r.butuh_tinjauan_ahli && <span className="pill" style={{ background: 'var(--status-warn-bg)', color: 'var(--status-warn)' }}>Tinjau psikolog</span>}
                    {r.disunting && <span className="pill" style={{ background: 'var(--purple-050)', color: 'var(--purple-700)' }}>Disunting</span>}
                    {qc.length > 0 && <span className="pill" title={qc.map((k) => LABEL_ISU_QC[k] || k).join(', ')} style={{ background: 'var(--status-warn-bg)', color: 'var(--status-warn)' }}>⚠ QC {qc.length}</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{r.nama}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{r.sekolah_nama}{r.unit ? ` · ${r.unit}` : ''}{r.n_responden ? ` · ${r.n_responden} pegawai` : ''}</div>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{cuplikan(r.isi)}</div>
                </div>
              );
            })}
          </div>
          {tersaring.length > batas && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <button className="btn-secondary" onClick={() => setBatas((b) => b + PER_HALAMAN)}>Tampilkan {Math.min(PER_HALAMAN, tersaring.length - batas)} lagi ({batas} dari {tersaring.length})</button>
            </div>
          )}
        </>
      )}

      <WaNarasiDrawer row={buka} onClose={() => setBuka(null)} onSave={simpan} onAct={act} />
    </div>
  );
}

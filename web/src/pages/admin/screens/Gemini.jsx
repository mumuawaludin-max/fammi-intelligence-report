import { useState } from 'react';
import { useCms } from '../store/CmsStore';
import { LoadingCards } from '../components/LoadingCards';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { ChipRow } from '../components/ChipRow';
import { moduleColor, moduleShort } from '../data/helpers';
import { IconZap } from '../components/icons';

const SCOPES = ['sekolah', 'kelas', 'jenjang', 'murid', 'yayasan'];
const MODULES = ['karakter', 'mi', 'screening'];
const ROLES = [
  ['wali_kelas', 'Wali Kelas'],
  ['kepala_sekolah', 'Kepala Sekolah'],
  ['yayasan', 'Yayasan'],
  ['orang_tua', 'Orang Tua'],
];
const INTERVAL_OPTIONS = [1, 3, 6, 12, 24];

export function Gemini() {
  const { data, loading, error, state, setGeminiFilter, setScreen, triggerGeminiJob, updateGeminiSchedule, refetch } = useCms();
  const [busyKey, setBusyKey] = useState(null);
  const [batchProgress, setBatchProgress] = useState(null); // { sekolahId, done, total } -- panel kelas
  const [batchSimple, setBatchSimple] = useState(null); // { panel: 'sekolah'|'yayasan', done, total }

  if (loading) return <LoadingCards rows={4} />;
  if (error) {
    return <ErrorState title="Gagal memuat data Gemini" desc={error} cta="Coba lagi" onCta={refetch} />;
  }

  const gf = state.geminiFilter;
  // Yayasan difilter dulu, supaya opsi sekolah yang ditawarkan cuma sekolah di bawahnya.
  const byYayasan = (r) => gf.yayasan === 'all' || r.yayasanId === gf.yayasan;
  const byFilter = (r) => byYayasan(r) && (gf.sekolah === 'all' || r.sekolahId === gf.sekolah) && (gf.periode === 'all' || r.periodeId === gf.periode);

  const rekomendasi = data.rekomendasi.filter(byFilter);
  const rekomendasiSekolah = data.rekomendasiSekolah.filter(byFilter);
  const rekomendasiYayasan = data.rekomendasiYayasan.filter(byFilter);
  const recentAll = data.antrian.filter((a) =>
    (gf.yayasan === 'all' || a.yayasan === gf.yayasan) &&
    (gf.sekolah === 'all' || a.sekolah === gf.sekolah) &&
    (gf.periode === 'all' || a.periode === gf.periode)
  );
  const recent = recentAll.slice(0, 8);

  // Opsi filter dihitung dari gabungan ketiga daftar rekomendasi + draf terbaru, supaya semua
  // yayasan/sekolah/periode yang relevan di layar ini kepilih, bukan cuma satu panel saja.
  const semuaBaris = [...data.rekomendasi, ...data.rekomendasiSekolah, ...data.rekomendasiYayasan];
  const semuaBarisByYayasan = semuaBaris.filter(byYayasan);
  const yayasanCount = {};
  semuaBaris.forEach((r) => { if (r.yayasanId) yayasanCount[r.yayasanId] = (yayasanCount[r.yayasanId] || 0) + 1; });
  const yayasanOptions = [
    { key: 'all', label: `Semua (${semuaBaris.length})` },
    ...data.yayasan.filter((y) => yayasanCount[y.id]).map((y) => ({ key: y.id, label: `${y.nama} (${yayasanCount[y.id]})` })),
  ];
  const sekolahCount = {};
  semuaBarisByYayasan.forEach((r) => { sekolahCount[r.sekolahId] = (sekolahCount[r.sekolahId] || 0) + 1; });
  const sekolahOptionsFilter = [
    { key: 'all', label: `Semua (${semuaBarisByYayasan.length})` },
    ...data.sekolah.filter((s) => sekolahCount[s.id]).map((s) => ({ key: s.id, label: `${s.nama} (${sekolahCount[s.id]})` })),
  ];
  const periodeCount = {};
  semuaBarisByYayasan
    .filter((r) => gf.sekolah === 'all' || r.sekolahId === gf.sekolah)
    .forEach((r) => { if (r.periodeId) periodeCount[r.periodeId] = (periodeCount[r.periodeId] || 0) + 1; });
  const periodeOptionsFilter = [
    { key: 'all', label: `Semua (${Object.values(periodeCount).reduce((a, b) => a + b, 0)})` },
    ...Object.keys(periodeCount).sort((a, b) => (a < b ? 1 : -1)).map((p) => ({ key: p, label: `${p} (${periodeCount[p]})` })),
  ];

  async function generateRekomendasi(r) {
    const key = `${r.sekolahId}|${r.kelasId}|${r.periodeId}`;
    setBusyKey(key);
    try {
      await triggerGeminiJob({
        scope: 'kelas', scopeId: r.kelasId, sekolahId: r.sekolahId, modul: 'karakter',
        tipe: 'tindak_lanjut', periodeId: r.periodeId, role: 'wali_kelas',
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function generateSemuaSekolah(sekolahId, items) {
    setBatchProgress({ sekolahId, done: 0, total: items.length });
    try {
      for (let i = 0; i < items.length; i++) {
        const r = items[i];
        await triggerGeminiJob({
          scope: 'kelas', scopeId: r.kelasId, sekolahId: r.sekolahId, modul: 'karakter',
          tipe: 'tindak_lanjut', periodeId: r.periodeId, role: 'wali_kelas',
        });
        setBatchProgress({ sekolahId, done: i + 1, total: items.length });
      }
    } finally {
      setBatchProgress(null);
    }
  }

  async function generateSekolah(r) {
    const key = `sekolah|${r.sekolahId}|${r.periodeId}`;
    setBusyKey(key);
    try {
      await triggerGeminiJob({
        scope: 'sekolah', scopeId: r.sekolahId, sekolahId: r.sekolahId, modul: 'karakter',
        tipe: 'tindak_lanjut', periodeId: r.periodeId, role: 'kepala_sekolah',
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function generateYayasan(r) {
    const key = `yayasan|${r.sekolahId}|${r.periodeId}`;
    setBusyKey(key);
    try {
      await triggerGeminiJob({
        scope: 'sekolah', scopeId: r.sekolahId, sekolahId: r.sekolahId, modul: 'karakter',
        tipe: 'tindak_lanjut', periodeId: r.periodeId, role: 'yayasan',
      });
    } finally {
      setBusyKey(null);
    }
  }

  // Batch untuk panel Kepala Sekolah / Yayasan: generate semua (sekolah, periode) sekaligus.
  async function generateSemuaLevel(panel, items, role) {
    setBatchSimple({ panel, done: 0, total: items.length });
    try {
      for (let i = 0; i < items.length; i++) {
        const r = items[i];
        await triggerGeminiJob({
          scope: 'sekolah', scopeId: r.sekolahId, sekolahId: r.sekolahId, modul: 'karakter',
          tipe: 'tindak_lanjut', periodeId: r.periodeId, role,
        });
        setBatchSimple({ panel, done: i + 1, total: items.length });
      }
    } finally {
      setBatchSimple(null);
    }
  }

  return (
    <div style={{ padding: '22px 26px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        {data.yayasan.length > 0 && (
          <>
            <ChipRow
              label="Yayasan"
              current={gf.yayasan}
              onChange={(k) => setGeminiFilter({ yayasan: k, sekolah: 'all' })}
              options={yayasanOptions}
            />
            <div style={{ width: 1, height: 22, background: 'var(--line)' }} />
          </>
        )}
        <ChipRow
          label="Sekolah"
          current={gf.sekolah}
          onChange={(k) => setGeminiFilter({ sekolah: k })}
          options={sekolahOptionsFilter}
        />
        <div style={{ width: 1, height: 22, background: 'var(--line)' }} />
        <ChipRow
          label="Periode"
          current={gf.periode}
          onChange={(k) => setGeminiFilter({ periode: k })}
          options={periodeOptionsFilter}
        />
      </div>

      <RekomendasiPanel rekomendasi={rekomendasi} busyKey={busyKey} batchProgress={batchProgress} onGenerate={generateRekomendasi} onGenerateSemua={generateSemuaSekolah} />
      <RekomendasiSederhanaPanel
        judul="Rekomendasi Kepala Sekolah" ikon="🏫" satuan="sekolah×periode" busyPrefix="sekolah"
        items={rekomendasiSekolah} busyKey={busyKey} onGenerate={generateSekolah}
        onGenerateSemua={() => generateSemuaLevel('sekolah', rekomendasiSekolah, 'kepala_sekolah')}
        batchProgress={batchSimple?.panel === 'sekolah' ? batchSimple : null}
        anyBusy={busyKey != null || batchSimple != null || batchProgress != null}
        labelBaris={(r) => r.sekolahNama}
      />
      <RekomendasiSederhanaPanel
        judul="Rekomendasi Yayasan" ikon="🏛️" satuan="sekolah×periode" busyPrefix="yayasan"
        items={rekomendasiYayasan} busyKey={busyKey} onGenerate={generateYayasan}
        onGenerateSemua={() => generateSemuaLevel('yayasan', rekomendasiYayasan, 'yayasan')}
        batchProgress={batchSimple?.panel === 'yayasan' ? batchSimple : null}
        anyBusy={busyKey != null || batchSimple != null || batchProgress != null}
        labelBaris={(r) => `${r.sekolahNama} · ${r.yayasanNama}`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <JadwalOtomatisPanel schedule={data.geminiSchedule} onUpdate={updateGeminiSchedule} />
          <TriggerManualPanel data={data} triggerGeminiJob={triggerGeminiJob} />
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 22px 12px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Draf terbaru menunggu tinjauan</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Diambil dari briefing/tindak_lanjut berstatus menunggu_persetujuan</div>
            </div>
            <button className="btn-ghost" style={{ fontSize: 11.5 }} onClick={refetch}>Refresh</button>
          </div>
          {recent.length === 0 ? (
            <EmptyState title="Belum ada draf" desc="Klik generate di panel Rekomendasi, atau pakai trigger manual." />
          ) : (
            <div style={{ padding: '6px 0' }}>
              {recent.map((j, i) => {
                const mc = moduleColor(j.modul);
                return (
                  <div key={j.id} style={{ padding: '14px 22px', borderBottom: i < recent.length - 1 ? '1px solid var(--line)' : 'none', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ marginTop: 5 }}>
                      <div className="dot" style={{ width: 12, height: 12, background: 'var(--status-warn)', boxShadow: '0 0 0 4px var(--status-warn-bg)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                        <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>{j.id.slice(0, 8)}</span>
                        <span className="pill" style={{ background: mc.bg, color: mc.ink }}>{moduleShort(j.modul)}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>scope {j.scope} · {j.sekolah}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{j.gambaran || j.teks}</div>
                      <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 6 }}>{j.dibuat}</div>
                    </div>
                    <button className="btn-ghost" style={{ fontSize: 11.5, alignSelf: 'center' }} onClick={() => setScreen('antrian')}>Buka antrian →</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Blok paling atas, paling penting: kelas yang belum ada tindak lanjut, dikelompokkan per
 * sekolah, bisa generate satu kelas atau semua kelas satu sekolah sekaligus (berurutan).
 */
function RekomendasiPanel({ rekomendasi, busyKey, batchProgress, onGenerate, onGenerateSemua }) {
  if (rekomendasi.length === 0) {
    return (
      <div className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 22 }}>✅</span>
        <div>
          <div className="disp" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Semua kelas sudah ada tindak lanjut</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Tidak ada rekomendasi untuk periode berjalan.</div>
        </div>
      </div>
    );
  }

  const bySekolah = {};
  rekomendasi.forEach((r) => { (bySekolah[r.sekolahId] ||= []).push(r); });

  return (
    <div className="card" style={{ padding: '18px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>💡</span>
        <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Rekomendasi Wali Kelas</div>
        <span className="pill" style={{ background: 'var(--status-warn-bg)', color: 'var(--status-warn)' }}>{rekomendasi.length} kelas×periode</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>Tiap baris = satu kelas di satu periode yang punya data karakter tapi belum ada draf tindak lanjut. Tindak lanjut dibuat per periode, jadi kalau ada 4 periode data, keempatnya muncul terpisah. Generate satu per satu, atau semua sekaligus per sekolah.</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 340, overflowY: 'auto' }}>
        {Object.entries(bySekolah).map(([sekolahId, items]) => {
          const batchAktif = batchProgress?.sekolahId === sekolahId;
          const adaBatchLain = batchProgress && !batchAktif;
          return (
            <div key={sekolahId}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, position: 'sticky', top: 0, background: 'var(--surface)', paddingBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>🏫</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{items[0].sekolahNama}</span>
                  <span className="pill" style={{ background: 'var(--purple-050)', color: 'var(--purple-700)', fontSize: 10.5 }}>{items.length} item</span>
                </div>
                <button
                  className="btn-primary" style={{ padding: '6px 13px', fontSize: 11.5 }}
                  onClick={() => onGenerateSemua(sekolahId, items)}
                  disabled={batchProgress != null || busyKey != null}
                >
                  {batchAktif
                    ? `Memproses ${batchProgress.done}/${batchProgress.total}…`
                    : <><IconZap size={12} />Generate semua ({items.length})</>}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map((r) => {
                  const key = `${r.sekolahId}|${r.kelasId}|${r.periodeId}`;
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-soft)', borderRadius: 10 }}>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>{r.kelasId}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>periode {r.periodeId}</div>
                      </div>
                      <button
                        className="btn-secondary" style={{ padding: '6px 12px', fontSize: 11.5 }}
                        onClick={() => onGenerate(r)}
                        disabled={busyKey === key || batchAktif || adaBatchLain}
                      >
                        {busyKey === key ? 'Memicu…' : 'Generate'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Versi lebih sederhana dari RekomendasiPanel, dipakai untuk level Kepala Sekolah dan
 * Yayasan: daftar datar (tidak dikelompokkan per kelas), satu tombol Generate per baris.
 * Dipisah dari RekomendasiPanel supaya panel kelas tidak makin rumit dicampur dua level lain.
 */
function RekomendasiSederhanaPanel({ judul, ikon, satuan, items, busyKey, onGenerate, onGenerateSemua, batchProgress, anyBusy, labelBaris, busyPrefix }) {
  if (!items || items.length === 0) {
    return (
      <div className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 22 }}>✅</span>
        <div>
          <div className="disp" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{judul}: semua sudah ada tindak lanjut</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Tidak ada rekomendasi untuk periode berjalan.</div>
        </div>
      </div>
    );
  }

  const batchAktif = batchProgress != null;

  return (
    <div className="card" style={{ padding: '18px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{ikon}</span>
          <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{judul}</div>
          <span className="pill" style={{ background: 'var(--status-warn-bg)', color: 'var(--status-warn)' }}>{items.length} {satuan}</span>
        </div>
        <button
          className="btn-primary" style={{ padding: '6px 13px', fontSize: 11.5 }}
          onClick={onGenerateSemua}
          disabled={anyBusy}
        >
          {batchAktif
            ? `Memproses ${batchProgress.done}/${batchProgress.total}…`
            : <><IconZap size={12} />Generate semua ({items.length})</>}
        </button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>Belum ada draf tindak lanjut untuk periode berjalan di level ini.</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
        {items.map((r) => {
          const key = `${busyPrefix}|${r.sekolahId}|${r.periodeId}`;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-soft)', borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>{labelBaris(r)}</div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>periode {r.periodeId}</div>
              </div>
              <button
                className="btn-secondary" style={{ padding: '6px 12px', fontSize: 11.5 }}
                onClick={() => onGenerate(r)}
                disabled={busyKey === key || anyBusy}
              >
                {busyKey === key ? 'Memicu…' : 'Generate'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Toggle + interval batch otomatis, baca-tulis langsung ke tabel gemini_schedule. */
function JadwalOtomatisPanel({ schedule, onUpdate }) {
  return (
    <div className="card" style={{ padding: '18px 22px' }}>
      <div className="disp" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>Jadwal otomatis</div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>Generate rekomendasi otomatis tiap interval, kamu tinggal tinjau di Antrian.</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Aktif</span>
        <button
          type="button" className="clk"
          onClick={() => onUpdate({ aktif: !schedule.aktif })}
          style={{
            width: 40, height: 22, borderRadius: 99, position: 'relative', border: 'none', cursor: 'pointer',
            background: schedule.aktif ? 'var(--purple-600)' : 'var(--surface-soft)',
            boxShadow: schedule.aktif ? '0 2px 6px rgba(99,35,218,.28)' : 'inset 0 0 0 1px var(--line)',
          }}
        >
          <span style={{ position: 'absolute', top: 2, left: schedule.aktif ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.15)', transition: '.2s' }} />
        </button>
      </div>

      <label style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6, display: 'block' }}>Interval</label>
      <select className="fld" value={schedule.interval_jam} onChange={(e) => onUpdate({ interval_jam: Number(e.target.value) })} disabled={!schedule.aktif}>
        {INTERVAL_OPTIONS.map((h) => <option key={h} value={h}>Tiap {h} jam</option>)}
      </select>

      <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--ink-3)' }}>
        Terakhir jalan: {schedule.terakhir_jalan ? new Date(schedule.terakhir_jalan).toLocaleString('id-ID') : 'belum pernah'}
      </div>
    </div>
  );
}

/** Form lama, sekarang jadi opsi sekunder untuk kasus di luar rekomendasi (scope jenjang/murid/yayasan, atau briefing). */
function TriggerManualPanel({ data, triggerGeminiJob }) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState('sekolah');
  const [sekolahId, setSekolahId] = useState(data?.sekolah?.[0]?.id || '');
  const [modul, setModul] = useState('karakter');
  const [tipe, setTipe] = useState('tindak_lanjut');
  const [role, setRole] = useState('kepala_sekolah');
  const [periode, setPeriode] = useState('');
  const [scopeId, setScopeId] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleTrigger() {
    setBusy(true);
    try {
      await triggerGeminiJob({ scope, scopeId: scopeId || sekolahId, sekolahId, modul, tipe, periodeId: periode, role });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ padding: '18px 22px' }}>
      <button className="btn-ghost" style={{ width: '100%', justifyContent: 'space-between', padding: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink)' }} onClick={() => setOpen((v) => !v)}>
        <span className="disp">Trigger manual</span>
        <span>{open ? '▾' : '▸'}</span>
      </button>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>Untuk scope di luar rekomendasi otomatis (jenjang, murid, yayasan) atau briefing.</div>

      {open && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6, display: 'block' }}>Role tujuan</label>
            <select className="fld" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6, display: 'block' }}>Scope</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {SCOPES.map(s => (
                <button key={s} className="clk" onClick={() => setScope(s)} style={{
                  padding: '8px 6px', borderRadius: 9, fontSize: 11.5, fontWeight: 600,
                  background: s === scope ? 'var(--purple-100)' : 'var(--surface-soft)',
                  color: s === scope ? 'var(--purple-700)' : 'var(--ink-2)',
                  textTransform: 'capitalize', boxShadow: s === scope ? 'none' : 'inset 0 0 0 1px var(--line)',
                }}>{s}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6, display: 'block' }}>Sekolah</label>
            <select className="fld" value={sekolahId} onChange={(e) => setSekolahId(e.target.value)}>
              {data.sekolah.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
          </div>

          {scope !== 'sekolah' && scope !== 'yayasan' && (
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6, display: 'block' }}>
                {scope === 'kelas' ? 'Nama kelas' : scope === 'jenjang' ? 'Nama jenjang' : 'murid_id'}
              </label>
              <input className="fld" value={scopeId} onChange={(e) => setScopeId(e.target.value)} placeholder={scope === 'kelas' ? 'G1 Abu Bakar' : scope === 'jenjang' ? 'Grade 1' : 'M001'} />
            </div>
          )}

          <div>
            <label style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6, display: 'block' }}>Modul</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {MODULES.map(m => {
                const mc = moduleColor(m);
                const active = m === modul;
                return (
                  <button key={m} className="clk" onClick={() => setModul(m)} style={{
                    padding: '8px 12px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                    background: active ? mc.bg : 'var(--surface-soft)',
                    color: active ? mc.ink : 'var(--ink-3)',
                    boxShadow: active ? 'none' : 'inset 0 0 0 1px var(--line)',
                  }}>{moduleShort(m)}</button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6, display: 'block' }}>Tipe draf</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="clk" onClick={() => setTipe('tindak_lanjut')} style={{ flex: 1, padding: '10px 12px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: tipe === 'tindak_lanjut' ? 'var(--purple-100)' : 'var(--surface-soft)', color: tipe === 'tindak_lanjut' ? 'var(--purple-700)' : 'var(--ink-3)', boxShadow: tipe === 'tindak_lanjut' ? 'none' : 'inset 0 0 0 1px var(--line)' }}>🎯 Tindak lanjut</button>
              <button className="clk" onClick={() => setTipe('briefing')} style={{ flex: 1, padding: '10px 12px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: tipe === 'briefing' ? 'var(--purple-100)' : 'var(--surface-soft)', color: tipe === 'briefing' ? 'var(--purple-700)' : 'var(--ink-3)', boxShadow: tipe === 'briefing' ? 'none' : 'inset 0 0 0 1px var(--line)' }}>📋 Briefing</button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6, display: 'block' }}>Periode acuan</label>
            <input className="fld" value={periode} onChange={(e) => setPeriode(e.target.value)} placeholder="2026-06" />
          </div>

          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }} onClick={handleTrigger} disabled={busy || !sekolahId}>
            <IconZap size={14} />{busy ? 'Memicu…' : 'Picu Gemini · Edge Function'}
          </button>

          <div style={{ padding: '10px 12px', background: 'var(--info-soft)', borderRadius: 8, fontSize: 11.5, color: 'var(--info)', lineHeight: 1.45 }}>
            💡 API key Gemini disimpan di <span className="mono" style={{ fontSize: 11 }}>GEMINI_API_KEY</span> env Supabase Functions, tidak pernah ada di kode React.
          </div>
        </div>
      )}
    </div>
  );
}

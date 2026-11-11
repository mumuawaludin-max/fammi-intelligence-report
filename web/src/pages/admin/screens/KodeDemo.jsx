import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useCms } from '../store/CmsStore';
import { StatusPill } from '../components/StatusPill';
import { DEMO_SYSTEMS } from '../../demo/demoSystems';

/**
 * Layar "Kode Demo": membuat, melihat, dan mencabut kode akses demo halaman masuk.
 *
 * Semua keputusan tetap di Postgres (migration 20261111100000): demo_code_create, demo_code_list,
 * dan demo_code_revoke hanya jalan untuk Admin Fammi (demo_boleh_kelola). Kode mentah hanya
 * dikembalikan SEKALI saat dibuat; database menyimpan HMAC-nya saja, jadi layar ini tidak pernah
 * bisa menampilkan ulang kode lama. Kode baru hanya hidup di state layar ini sampai ditutup.
 */

const PILIHAN_BERLAKU = [
  { nilai: '1', label: '1 hari' },
  { nilai: '3', label: '3 hari' },
  { nilai: '7', label: '7 hari' },
  { nilai: '14', label: '14 hari' },
  { nilai: '30', label: '30 hari' },
  { nilai: '', label: 'Tanpa batas waktu' },
];

const PILIHAN_SESI = [
  { nilai: 60, label: '1 jam' },
  { nilai: 180, label: '3 jam' },
  { nilai: 480, label: '8 jam' },
  { nilai: 1440, label: '24 jam' },
];

const STATUS = {
  active: { label: 'Aktif', bg: 'var(--status-safe-bg)', ink: 'var(--status-safe)' },
  expired: { label: 'Kedaluwarsa', bg: 'var(--status-warn-bg)', ink: 'var(--sun-ink)' },
  exhausted: { label: 'Jatah habis', bg: 'var(--status-warn-bg)', ink: 'var(--sun-ink)' },
  revoked: { label: 'Dicabut', bg: 'var(--status-alert-bg)', ink: 'var(--status-alert)' },
};

const SEMUA_SISTEM = DEMO_SYSTEMS.map((s) => s.id);
const JUDUL_SISTEM = Object.fromEntries(DEMO_SYSTEMS.map((s) => [s.id, `${s.nomor} ${s.judul}`]));

function formatWaktu(iso) {
  if (!iso) return null;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(t);
}

function pesanGalat(error, cadangan) {
  const teks = error?.message || '';
  if (/demo_code_(create|list|revoke)/.test(teks) && /(not find|does not exist|schema cache)/i.test(teks)) {
    return 'Fungsi kode demo belum ada di database. Jalankan migration 20261111100000_demo_access.sql dulu.';
  }
  return teks || cadangan;
}

export function KodeDemo() {
  const { showToast } = useCms();
  const [daftar, setDaftar] = useState(null);
  const [galatDaftar, setGalatDaftar] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [sembunyikanMati, setSembunyikanMati] = useState(true);

  const muat = useCallback(async () => {
    setMemuat(true);
    const { data, error } = await supabase.rpc('demo_code_list');
    setMemuat(false);
    if (error) {
      setGalatDaftar(pesanGalat(error, 'Daftar kode belum bisa dimuat.'));
      return;
    }
    setGalatDaftar('');
    setDaftar(data || []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- memuat data awal dari server
    muat();
  }, [muat]);

  async function cabut(kode) {
    const sesi = Number(kode.sesi_aktif) || 0;
    const peringatan = sesi > 0 ? ` ${sesi} pengunjung yang sedang memakai kode ini ikut dikeluarkan.` : '';
    if (!window.confirm(`Cabut kode "${kode.code_label}"? Kode tidak bisa dipakai lagi.${peringatan}`)) return;
    const { data, error } = await supabase.rpc('demo_code_revoke', { p_id: kode.id });
    if (error) {
      showToast('Gagal mencabut: ' + pesanGalat(error, 'coba lagi.'), 'alert');
      return;
    }
    const berhenti = data?.sesi_dihentikan || 0;
    showToast(berhenti > 0 ? `Kode dicabut, ${berhenti} sesi dihentikan.` : 'Kode dicabut.', 'safe');
    muat();
  }

  const tampil = (daftar || []).filter((k) => !sembunyikanMati || k.status === 'active');
  const jumlahMati = (daftar || []).filter((k) => k.status !== 'active').length;

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px' }}>Kode Demo</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6, margin: '0 0 20px', maxWidth: 760 }}>
        Kode untuk calon sekolah yang ingin mencoba demo lewat tautan &ldquo;Lihat demo aplikasi&rdquo; di halaman
        masuk. Kode baru hanya tampil satu kali, jadi langsung salin dan kirim. Mencabut kode ikut menghentikan
        pengunjung yang sedang memakainya.
      </p>

      <FormKode onDibuat={muat} />

      <div className="card" style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>Daftar kode</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--ink-2)', cursor: 'pointer' }}>
              <input type="checkbox" checked={sembunyikanMati} onChange={(e) => setSembunyikanMati(e.target.checked)} />
              Hanya yang aktif{sembunyikanMati && jumlahMati > 0 && ` (${jumlahMati} tidak aktif disembunyikan)`}
            </label>
            <button className="btn-ghost" onClick={muat} disabled={memuat}>{memuat ? 'Memuat…' : 'Muat ulang'}</button>
          </div>
        </div>

        {galatDaftar ? (
          <div style={{ padding: 18, fontSize: 13, color: 'var(--status-alert)' }}>{galatDaftar}</div>
        ) : daftar === null ? (
          <div style={{ padding: 18, fontSize: 13, color: 'var(--ink-3)' }}>Memuat daftar kode…</div>
        ) : tampil.length === 0 ? (
          <div style={{ padding: 18, fontSize: 13, color: 'var(--ink-3)' }}>
            {daftar.length === 0 ? 'Belum ada kode demo. Buat kode pertama lewat formulir di atas.' : 'Tidak ada kode aktif.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Status</th>
                  <th>Sistem</th>
                  <th>Pemakaian</th>
                  <th>Sesi aktif</th>
                  <th>Berlaku sampai</th>
                  <th>Dibuat</th>
                  <th style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {tampil.map((k) => {
                  const st = STATUS[k.status] || STATUS.active;
                  const semua = (k.available_systems || []).length === SEMUA_SISTEM.length;
                  return (
                    <tr key={k.id} className="hover-row">
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{k.code_label}</div>
                        {k.description && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{k.description}</div>}
                      </td>
                      <td><StatusPill bg={st.bg} ink={st.ink} dot={st.ink}>{st.label}</StatusPill></td>
                      <td style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
                        {semua ? 'Kelima sistem' : (k.available_systems || []).map((s) => JUDUL_SISTEM[s] || s).join(', ')}
                      </td>
                      <td style={{ fontSize: 12.5 }}>{k.usage_count}{k.max_uses ? ` / ${k.max_uses}` : ' (tanpa batas)'}</td>
                      <td style={{ fontSize: 12.5 }}>{Number(k.sesi_aktif) || 0}</td>
                      <td style={{ fontSize: 12.5 }}>{formatWaktu(k.expires_at) || 'Tanpa batas'}</td>
                      <td style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{formatWaktu(k.created_at)}</td>
                      <td>
                        {k.status !== 'revoked' && (
                          <button className="btn-danger" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={() => cabut(k)}>Cabut</button>
                        )}
                      </td>
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

function FormKode({ onDibuat }) {
  const { showToast } = useCms();
  const [label, setLabel] = useState('');
  const [catatan, setCatatan] = useState('');
  const [berlakuHari, setBerlakuHari] = useState('7');
  const [batasPakai, setBatasPakai] = useState('');
  const [menitSesi, setMenitSesi] = useState(180);
  const [sistem, setSistem] = useState(SEMUA_SISTEM);
  const [galat, setGalat] = useState('');
  const [mengirim, setMengirim] = useState(false);
  const [hasil, setHasil] = useState(null);

  function ubahSistem(id) {
    setSistem((lama) => (lama.includes(id) ? lama.filter((s) => s !== id) : SEMUA_SISTEM.filter((s) => s === id || lama.includes(s))));
  }

  async function buat(e) {
    e.preventDefault();
    setGalat('');
    if (!label.trim()) { setGalat('Label wajib diisi, misalnya nama sekolah atau acara.'); return; }
    if (sistem.length === 0) { setGalat('Pilih minimal satu sistem.'); return; }
    const batas = batasPakai.trim() === '' ? null : Number(batasPakai);
    if (batas !== null && (!Number.isInteger(batas) || batas < 1)) { setGalat('Batas pemakaian harus bilangan bulat 1 ke atas, atau kosongkan.'); return; }

    const kedaluwarsa = berlakuHari ? new Date(Date.now() + Number(berlakuHari) * 86400000).toISOString() : null;
    setMengirim(true);
    const { data, error } = await supabase.rpc('demo_code_create', {
      p_label: label.trim(),
      p_description: catatan.trim() || null,
      p_expires_at: kedaluwarsa,
      p_max_uses: batas,
      p_available_systems: sistem.length === SEMUA_SISTEM.length ? null : sistem,
      p_session_minutes: menitSesi,
    });
    setMengirim(false);
    if (error || !data?.code) {
      setGalat(pesanGalat(error, 'Kode belum bisa dibuat. Coba lagi.'));
      return;
    }
    setHasil(data);
    setLabel('');
    setCatatan('');
    showToast('Kode demo dibuat. Salin sekarang, kode hanya tampil sekali.', 'safe', 4000);
    onDibuat();
  }

  async function salin(teks, pesan) {
    try {
      await navigator.clipboard.writeText(teks);
      showToast(pesan, 'safe');
    } catch {
      showToast('Gagal menyalin otomatis. Blok teksnya lalu salin manual.', 'alert');
    }
  }

  const pesanUndangan = hasil ? [
    `Kode demo Fammi Intelligence Report: ${hasil.code}`,
    `Buka ${window.location.origin}, klik "Lihat demo aplikasi", lalu masukkan kode di atas.`,
    hasil.expires_at ? `Kode berlaku sampai ${formatWaktu(hasil.expires_at)}.` : null,
  ].filter(Boolean).join('\n') : '';

  const labelGaya = { display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 6 };

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 14 }}>Buat kode baru</div>

      {hasil && (
        <div style={{ marginBottom: 18, padding: 16, borderRadius: 12, background: 'var(--purple-050)', boxShadow: 'inset 0 0 0 1px var(--purple-100)' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--purple-700)' }}>Kode untuk &ldquo;{hasil.label}&rdquo;</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <span className="mono" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--ink)', userSelect: 'all' }}>{hasil.code}</span>
            <button className="btn-primary" onClick={() => salin(hasil.code, 'Kode disalin.')}>Salin kode</button>
            <button className="btn-secondary" onClick={() => salin(pesanUndangan, 'Pesan undangan disalin.')}>Salin pesan undangan</button>
            <button className="btn-ghost" onClick={() => setHasil(null)}>Tutup</button>
          </div>
          <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--sun-ink)', fontWeight: 600 }}>
            Kode ini hanya tampil sekarang. Setelah ditutup atau halaman dimuat ulang, kode tidak bisa dilihat lagi; buat kode baru kalau hilang.
          </div>
        </div>
      )}

      <form onSubmit={buat} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
          <div>
            <label style={labelGaya} htmlFor="kode-label">Label</label>
            <input id="kode-label" className="fld" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="mis. Presentasi Yayasan Al Madani" maxLength={120} />
          </div>
          <div>
            <label style={labelGaya} htmlFor="kode-catatan">Catatan (opsional)</label>
            <input id="kode-catatan" className="fld" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="mis. Rapat 14 November" maxLength={240} />
          </div>
          <div>
            <label style={labelGaya} htmlFor="kode-berlaku">Berlaku</label>
            <select id="kode-berlaku" className="fld" value={berlakuHari} onChange={(e) => setBerlakuHari(e.target.value)}>
              {PILIHAN_BERLAKU.map((p) => <option key={p.label} value={p.nilai}>{p.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            <div>
              <label style={labelGaya} htmlFor="kode-batas">Batas pemakaian</label>
              <input id="kode-batas" className="fld" type="number" min="1" step="1" value={batasPakai} onChange={(e) => setBatasPakai(e.target.value)} placeholder="Tanpa batas" />
            </div>
            <div>
              <label style={labelGaya} htmlFor="kode-sesi">Lama satu sesi</label>
              <select id="kode-sesi" className="fld" value={menitSesi} onChange={(e) => setMenitSesi(Number(e.target.value))}>
                {PILIHAN_SESI.map((p) => <option key={p.nilai} value={p.nilai}>{p.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <fieldset style={{ border: 'none', margin: '16px 0 0', padding: 0 }}>
          <legend style={labelGaya}>Sistem yang dibuka</legend>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px' }}>
            {DEMO_SYSTEMS.map((s) => (
              <label key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer' }}>
                <input type="checkbox" checked={sistem.includes(s.id)} onChange={() => ubahSistem(s.id)} />
                {s.nomor} {s.judul}
              </label>
            ))}
          </div>
        </fieldset>

        {galat && <div role="alert" style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: 'var(--status-alert)' }}>{galat}</div>}

        <div style={{ marginTop: 16 }}>
          <button type="submit" className="btn-primary" disabled={mengirim}>{mengirim ? 'Membuat…' : 'Buat kode'}</button>
        </div>
      </form>
    </div>
  );
}

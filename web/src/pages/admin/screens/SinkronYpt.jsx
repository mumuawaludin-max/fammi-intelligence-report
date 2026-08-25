import { useState } from 'react';
import { supabase, edgeErrorDetail } from '../../../lib/supabase';
import { useCms } from '../store/CmsStore';

/**
 * Layar "Sinkron Spreadsheet YPT": memicu Edge Function sync-ypt-sheets, yang menarik dua
 * spreadsheet Google milik Yayasan Pendidikan Telkom (Survei Kepuasan dan Testimoni Citra
 * Sekolah) ke Supabase.
 *
 * Beda dengan layar Upload Data: di sana admin mengunggah berkas Excel sekali jalan per periode.
 * Di sini sumbernya respons form yang terus bertambah, jadi yang dilakukan adalah menarik ulang
 * dan hanya menyimpan baris yang belum pernah masuk. Menjalankannya berkali-kali aman.
 */
export function SinkronYpt() {
  const { showToast } = useCms();
  const [jalan, setJalan] = useState(false);
  const [hasil, setHasil] = useState(null);
  const [refreshJalan, setRefreshJalan] = useState(false);

  async function sinkronkan(sumber) {
    setJalan(true);
    setHasil(null);
    try {
      const { data, error } = await supabase.functions.invoke('sync-ypt-sheets', { body: { sumber } });
      if (error) throw new Error(await edgeErrorDetail(error, 'Sinkronisasi gagal.'));
      setHasil(data?.hasil || {});
      showToast('Sinkronisasi selesai.', 'safe');
    } catch (e) {
      setHasil({ gagalTotal: e.message });
      showToast('Gagal: ' + e.message, 'alert');
    } finally {
      setJalan(false);
    }
  }

  // Empat view Rapor Karakter YPT (ypt_k_sekolah dkk) adalah materialized view -- cepat dibaca,
  // tapi tidak otomatis ikut berubah saat admin mengimpor data Karakter baru. Tombol ini memicu
  // Edge Function refresh-ypt-views (bukan RPC langsung) supaya jalan sebagai service_role --
  // panggilan langsung sebagai role authenticated TERBUKTI kena statement_timeout connection
  // pooler Supabase yang tidak bisa ditimpa dari SET LOCAL maupun ALTER ROLE (dicoba dan gagal
  // 2026-08-26, lihat catatan di supabase/functions/refresh-ypt-views/index.ts). Makan waktu
  // belasan detik (data ratusan ribu baris), makanya ada indikator "Menghitung ulang…" terpisah
  // dari tombol sinkronisasi spreadsheet di atas.
  async function refreshRingkasan() {
    setRefreshJalan(true);
    try {
      const { data, error } = await supabase.functions.invoke('refresh-ypt-views');
      if (error) throw new Error(await edgeErrorDetail(error, 'Refresh gagal.'));
      if (data?.error) throw new Error(data.error);
      showToast('Ringkasan Rapor Karakter YPT sudah terbaru.', 'safe');
    } catch (e) {
      showToast('Gagal refresh: ' + e.message, 'alert');
    } finally {
      setRefreshJalan(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px' }}>
        Sinkron Spreadsheet YPT
      </h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6, margin: '0 0 20px' }}>
        Menarik respons terbaru dari dua spreadsheet Yayasan Pendidikan Telkom: Survei Kepuasan
        Rapor Karakter dan Testimoni Citra Sekolah. Baris yang sudah pernah masuk tidak
        digandakan, jadi aman dijalankan berkali-kali. Syaratnya kedua spreadsheet dibagikan
        dengan akses &ldquo;siapa saja dengan link boleh melihat&rdquo;.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button className="btn-primary" onClick={() => sinkronkan('semua')} disabled={jalan}>
          {jalan ? 'Menyinkronkan…' : 'Sinkronkan keduanya'}
        </button>
        <button className="btn-ghost" onClick={() => sinkronkan('kepuasan')} disabled={jalan}>
          Survei Kepuasan saja
        </button>
        <button className="btn-ghost" onClick={() => sinkronkan('testimoni')} disabled={jalan}>
          Testimoni saja
        </button>
      </div>

      {hasil?.gagalTotal && (
        <div style={kotak('alert')}>
          <strong>Sinkronisasi gagal</strong>
          <p style={{ margin: '6px 0 0' }}>{hasil.gagalTotal}</p>
        </div>
      )}

      {hasil && !hasil.gagalTotal && (
        <div style={{ display: 'grid', gap: 14 }}>
          {[['kepuasan', 'Survei Kepuasan'], ['testimoni', 'Testimoni Citra Sekolah']].map(([kunci, label]) => {
            const r = hasil[kunci];
            if (!r) return null;
            if (r.error) {
              return (
                <div key={kunci} style={kotak('alert')}>
                  <strong>{label}</strong>
                  <p style={{ margin: '6px 0 0' }}>{r.error}</p>
                </div>
              );
            }
            return (
              <div key={kunci} style={kotak('safe')}>
                <strong>{label}</strong>
                <p style={{ margin: '6px 0 0' }}>
                  {r.total} baris terbaca · <b>{r.baru} baris baru masuk</b>
                  {r.dilewati > 0 && ` · ${r.dilewati} dilewati (sekolah tidak dikenali atau isian kosong)`}
                </p>
                {r.aliasTakDikenal?.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {/* Nama sekolah yang tidak cocok TIDAK dibuang diam-diam. Kalau dibiarkan,
                        seluruh responden dari sekolah itu tidak akan pernah muncul di dashboard. */}
                    <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--warn-ink, #8a4e00)' }}>
                      Nama sekolah berikut belum terhubung ke data sekolah mana pun:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.7 }}>
                      {r.aliasTakDikenal.map((a) => <li key={a}>{a}</li>)}
                    </ul>
                    <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--ink-3)' }}>
                      Tambahkan pemetaannya lewat SQL ke tabel <code>ypt_sekolah_alias</code>, lalu
                      jalankan sinkronisasi lagi.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '28px 0' }} />

      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px' }}>
        Refresh Ringkasan Rapor Karakter
      </h2>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6, margin: '0 0 16px' }}>
        Dashboard Yayasan Pendidikan Telkom membaca ringkasan yang sudah dihitung sebelumnya
        (bukan langsung dari data mentah), supaya tetap cepat walau datanya besar. Jalankan
        ini setiap kali ada impor data Karakter baru untuk sekolah Telkom mana pun -- prosesnya
        memakan waktu belasan detik.
      </p>
      <button className="btn-primary" onClick={refreshRingkasan} disabled={refreshJalan}>
        {refreshJalan ? 'Menghitung ulang…' : 'Refresh sekarang'}
      </button>
    </div>
  );
}

function kotak(kind) {
  return {
    border: '1px solid var(--line)',
    borderLeft: `3px solid ${kind === 'alert' ? 'var(--alert, #d6455a)' : 'var(--safe, #2e9e6b)'}`,
    borderRadius: 12,
    background: 'var(--surface)',
    padding: '14px 16px',
    fontSize: 13,
    color: 'var(--ink-2)',
    lineHeight: 1.55,
  };
}

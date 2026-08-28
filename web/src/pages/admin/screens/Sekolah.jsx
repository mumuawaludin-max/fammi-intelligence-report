import { useEffect, useState } from 'react';
import { useCms } from '../store/CmsStore';
import { LoadingCards } from '../components/LoadingCards';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Toggle } from '../components/StatusPill';
import { IconMoreVertical } from '../components/icons';
import { loadAspekKandidatAction, saveAspekConfigAction, refreshYptViewsAction } from '../useAdminCmsData';

// Urutannya harus sama dengan kolom <th> di tabel bawah -- baris data dirender dengan
// MODULES.map, jadi menambah modul di sini tanpa menambah header bikin kolom bergeser.
// 'lw' sempat tertinggal di sini padahal modulnya sudah jalan (Leadership & Wellbeing,
// migration 20260803100000) -- akibatnya entitlement-nya cuma bisa diatur lewat SQL, tidak lewat
// CMS. 'kp' (Survey Kepuasan YPT) ditambahkan sekalian.
const MODULES = ['karakter', 'mi', 'screening', 'cw', 'sc', 'pa', 'lw', 'kp'];

export function Sekolah() {
  const { data, loading, error, setAddSchoolOpen, setAddYayasanOpen, setEditSchoolTarget, showToast, isModuleOn, toggleModule, refetch } = useCms();
  const [expanded, setExpanded] = useState(null);

  if (loading) return <LoadingCards rows={4} />;
  if (error) {
    return <ErrorState title="Gagal memuat sekolah" desc={error} cta="Muat ulang" onCta={refetch} />;
  }
  if (data.sekolah.length === 0) {
    return <EmptyState title="Belum ada sekolah" desc="Tambahkan sekolah pertama untuk mulai." cta="Tambah sekolah" onCta={() => setAddSchoolOpen(true)} />;
  }

  const expandedSekolah = expanded ? data.sekolah.find(s => s.id === expanded) : null;

  return (
    <div style={{ padding: '22px 26px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => showToast('Ekspor belum tersedia di v1', 'info')}>Ekspor</button>
          <button className="btn-secondary" onClick={() => setAddYayasanOpen(true)}>+ Tambah yayasan</button>
          <button className="btn-primary" onClick={() => setAddSchoolOpen(true)}>+ Tambah sekolah</button>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Sekolah</th>
                <th>Yayasan</th>
                <th>Jenjang</th>
                <th>Karakter</th>
                <th>MI</th>
                <th>Screening</th>
                <th>Culture</th>
                <th>School Culture</th>
                <th>Perilaku Anak</th>
                <th>Leadership</th>
                <th>Kepuasan</th>
                <th>Aspek config</th>
                <th>Aktif</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {data.sekolah.map(k => (
                <SekolahRow
                  key={k.id}
                  k={k}
                  yayNama={data.yayasan.find(y => y.id === k.yay)?.nama}
                  isModuleOn={isModuleOn}
                  toggleModule={toggleModule}
                  onExpand={() => setExpanded(cur => cur === k.id ? null : k.id)}
                  onEdit={() => setEditSchoolTarget(k)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {expandedSekolah && (
        <AspekConfigEditor key={expandedSekolah.id} sekolah={expandedSekolah} />
      )}
    </div>
  );
}

/** Ubah "indikator1_dengar_pendapat_sebelum_menanggapi" jadi kalimat yang enak dibaca. */
function bacaIndikator(kode) {
  return kode.replace(/^indikator\d+_/i, '').replace(/_/g, ' ').trim();
}

/** Tebakan awal nama dari kodenya sendiri, untuk sekolah yang kodenya sudah deskriptif. */
function tebakDariKode(kode) {
  const sisa = kode.replace(/^karakter\d+_?/i, '').replace(/_/g, ' ').trim();
  if (!sisa) return '';
  return sisa.replace(/\b\w/g, (c) => c.toUpperCase());
}

function nomorAspek(kode) {
  const m = /^karakter(\d+)/i.exec(kode);
  return m ? parseInt(m[1], 10) : 999;
}

/**
 * Editor karakter_aspek_config per sekolah.
 *
 * Alasan ini ada: importer Karakter tidak pernah mengisi tabel ini (lihat catatan panjang di
 * useAdminCmsData). Tanpa editor, satu-satunya cara memberi nama karakter adalah menulis migration
 * SQL tangan seperti yang dulu dilakukan untuk SMK Telkom Purwokerto, dan itu sebabnya 11 sekolah
 * YPT lain tampil sebagai "Karakter 1..N" di dashboard yayasan.
 *
 * Baris yang ditawarkan bukan cuma yang sudah ada di config, tapi SEMUA kode aspek yang benar
 * benar dipakai sekolah ini di karakter_skor -- kalau cuma menampilkan config yang ada, sekolah
 * yang confignya kosong akan menampilkan form kosong juga dan admin tidak tahu harus isi apa.
 */
function AspekConfigEditor({ sekolah }) {
  const { showToast, refetch } = useCms();
  const [rows, setRows] = useState([]);
  const [indikator, setIndikator] = useState({});
  const [hapus, setHapus] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [gagalMuat, setGagalMuat] = useState(null);

  useEffect(() => {
    let batal = false;
    setMemuat(true);
    setGagalMuat(null);
    loadAspekKandidatAction(sekolah.id)
      .then((k) => {
        if (batal) return;
        const config = {};
        (sekolah.aspekConfig || []).forEach((a) => { config[a.aspek_kode] = a; });
        // Gabungan kode yang terpakai di data DAN kode yang sudah terlanjur ada di config --
        // config lama yang kodenya tidak lagi muncul di data tetap ditampilkan supaya bisa dihapus,
        // bukan menghilang diam-diam.
        const semuaKode = [...new Set([...k.kode, ...Object.keys(config)])];
        setRows(semuaKode
          .sort((a, b) => nomorAspek(a) - nomorAspek(b) || a.localeCompare(b))
          .map((kode, i) => ({
            aspek_kode: kode,
            aspek_label: config[kode]?.aspek_label || tebakDariKode(kode),
            urutan: config[kode]?.urutan ?? (nomorAspek(kode) === 999 ? i + 1 : nomorAspek(kode)),
            adaDiData: k.kode.includes(kode),
          })));
        setIndikator(k.indikator);
        setMemuat(false);
      })
      .catch((e) => { if (!batal) { setGagalMuat(e.message); setMemuat(false); } });
    return () => { batal = true; };
  }, [sekolah.id, sekolah.aspekConfig]);

  function ubahLabel(kode, nilai) {
    setRows((r) => r.map((x) => (x.aspek_kode === kode ? { ...x, aspek_label: nilai } : x)));
  }

  function hapusBaris(kode) {
    setRows((r) => r.filter((x) => x.aspek_kode !== kode));
    setHapus((h) => (h.includes(kode) ? h : [...h, kode]));
  }

  function tambahBaris() {
    const nomorBaru = Math.max(0, ...rows.map((r) => nomorAspek(r.aspek_kode)).filter((n) => n !== 999)) + 1;
    const kode = `karakter${nomorBaru}`;
    if (rows.some((r) => r.aspek_kode === kode)) return;
    setRows((r) => [...r, { aspek_kode: kode, aspek_label: '', urutan: nomorBaru, adaDiData: false }]);
    setHapus((h) => h.filter((k) => k !== kode));
  }

  async function simpan() {
    const isi = rows.filter((r) => r.aspek_label.trim());
    if (isi.length === 0) {
      showToast('Isi minimal satu nama karakter dulu.', 'warn');
      return;
    }
    // Nama yang sama untuk dua kode berbeda hampir pasti salah ketik, dan di FIR akan tampil
    // sebagai dua batang bernama sama yang tidak bisa dibedakan pembacanya.
    const namaDipakai = isi.map((r) => r.aspek_label.trim().toLowerCase());
    const kembar = namaDipakai.find((n, i) => namaDipakai.indexOf(n) !== i);
    if (kembar) {
      showToast(`Nama "${kembar}" dipakai dua kali. Beri nama berbeda tiap karakter.`, 'alert');
      return;
    }

    setMenyimpan(true);
    try {
      await saveAspekConfigAction(
        sekolah.id,
        isi.map((r) => ({ aspek_kode: r.aspek_kode, aspek_label: r.aspek_label.trim(), urutan: r.urutan })),
        hapus,
      );
      setHapus([]);
      showToast(`${isi.length} nama karakter tersimpan untuk ${sekolah.nama}.`, 'safe');
      refetch();
      try {
        await refreshYptViewsAction();
        showToast('Ringkasan Rapor Karakter YPT ikut diperbarui.', 'safe');
      } catch (e) {
        showToast('Tersimpan, tapi ringkasan YPT belum dihitung ulang: ' + e.message, 'warn', 5200);
      }
    } catch (e) {
      showToast('Gagal simpan: ' + e.message, 'alert', 5200);
    } finally {
      setMenyimpan(false);
    }
  }

  const belumDiisi = rows.filter((r) => !r.aspek_label.trim()).length;

  return (
    <div className="card" style={{ padding: '22px 24px', marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 16 }}>
        <div>
          <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Nama Karakter — {sekolah.nama}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
            karakter_aspek_config · nama ini yang tampil di laporan siswa, wali kelas, kepala sekolah, dan yayasan
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn-secondary" onClick={tambahBaris} disabled={memuat || menyimpan}>+ Aspek</button>
          <button className="btn-primary" onClick={simpan} disabled={memuat || menyimpan}>
            {menyimpan ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </div>

      {memuat && <p style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Membaca kode aspek yang dipakai sekolah ini…</p>}

      {gagalMuat && (
        <p style={{ fontSize: 12.5, color: 'var(--status-alert)' }}>Gagal membaca data aspek: {gagalMuat}</p>
      )}

      {!memuat && !gagalMuat && rows.length === 0 && (
        <p style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
          Sekolah ini belum punya data karakter sama sekali, jadi belum ada aspek untuk dinamai.
        </p>
      )}

      {!memuat && rows.length > 0 && (
        <>
          {belumDiisi > 0 && (
            <p style={{ fontSize: 12, color: 'var(--status-warn)', margin: '0 0 12px' }}>
              {belumDiisi} karakter belum punya nama. Selama kosong, FIR menampilkannya sebagai
              &ldquo;Karakter 1&rdquo;, &ldquo;Karakter 2&rdquo;, dan seterusnya.
            </p>
          )}

          <div style={{ display: 'grid', gap: 8 }}>
            {rows.map((r) => (
              <div key={r.aspek_kode} style={{ padding: '11px 13px', background: 'var(--surface-soft)', borderRadius: 11, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', width: 84, flexShrink: 0, paddingTop: 8 }}>
                  {r.aspek_kode}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    value={r.aspek_label}
                    onChange={(e) => ubahLabel(r.aspek_kode, e.target.value)}
                    placeholder="Nama karakter, mis. Empati"
                    style={{ width: '100%', padding: '7px 10px', fontSize: 12.5, fontWeight: 600, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
                  />
                  {/* Petunjuk terpenting di form ini: kode indikator menyimpan teks asli dari header
                      file upload, jadi admin bisa membaca isinya dan tahu karakter apa yang dimaksud
                      tanpa membuka file aslinya. */}
                  {indikator[r.aspek_kode]?.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 5, lineHeight: 1.45 }}>
                      Indikatornya: {indikator[r.aspek_kode].slice(0, 4).map(bacaIndikator).join(' · ')}
                      {indikator[r.aspek_kode].length > 4 && ` · +${indikator[r.aspek_kode].length - 4} lagi`}
                    </div>
                  )}
                  {!r.adaDiData && (
                    <div style={{ fontSize: 11, color: 'var(--status-warn)', marginTop: 5 }}>
                      Kode ini tidak ditemukan di data skor sekolah ini.
                    </div>
                  )}
                </div>
                <button
                  className="btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 11.5, flexShrink: 0 }}
                  onClick={() => hapusBaris(r.aspek_kode)}
                  title="Hapus baris konfigurasi ini"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SekolahRow({ k, yayNama, isModuleOn, toggleModule, onExpand, onEdit }) {
  return (
    <tr className="hover-row">
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {k.logoUrl && (
            <img src={k.logoUrl} alt="" style={{ width: 22, height: 22, objectFit: 'contain', borderRadius: 5, flexShrink: 0 }} />
          )}
          <div style={{ fontWeight: 700 }}>{k.nama}</div>
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{k.id}</div>
      </td>
      <td style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{yayNama ? yayNama.replace('Yayasan ', '') : <span style={{ color: 'var(--ink-4)' }}>Mandiri</span>}</td>
      <td style={{ fontSize: 12.5 }}>{k.jenjang}</td>
      {MODULES.map(m => {
        const on = isModuleOn(k, m);
        return <td key={m}><Toggle on={on} onClick={() => toggleModule(k.id, m, on)} /></td>;
      })}
      <td>
        {k.modules.includes('karakter')
          ? <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 11.5 }} onClick={onExpand}>⚙ Atur nama karakter</button>
          : <span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>—</span>}
      </td>
      <td>
        {k.aktif
          ? <span className="pill" style={{ background: 'var(--status-safe-bg)', color: 'var(--status-safe)' }}><span className="dot" style={{ background: 'var(--status-safe)' }} />Aktif</span>
          : <span className="pill" style={{ background: '#F0F0F4', color: 'var(--ink-3)' }}><span className="dot" style={{ background: 'var(--ink-4)' }} />Nonaktif</span>}
      </td>
      <td style={{ textAlign: 'right' }}>
        <button className="btn-ghost" style={{ padding: 6 }} onClick={onEdit} title="Edit sekolah">
          <IconMoreVertical size={14} stroke="#7C7689" />
        </button>
      </td>
    </tr>
  );
}

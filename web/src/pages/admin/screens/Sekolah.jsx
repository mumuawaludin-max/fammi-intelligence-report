import { useEffect, useState } from 'react';
import { useCms } from '../store/CmsStore';
import { LoadingCards } from '../components/LoadingCards';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Toggle } from '../components/StatusPill';
import { IconMoreVertical, IconX } from '../components/icons';
import { loadAspekKandidatAction, saveAspekConfigAction, refreshYptViewsAction } from '../useAdminCmsData';

// Urutannya harus sama dengan kolom <th> di tabel bawah -- baris data dirender dengan
// MODULES.map, jadi menambah modul di sini tanpa menambah header bikin kolom bergeser.
// 'lw' sempat tertinggal di sini padahal modulnya sudah jalan (Leadership & Wellbeing,
// migration 20260803100000) -- akibatnya entitlement-nya cuma bisa diatur lewat SQL, tidak lewat
// CMS. 'kp' (Survey Kepuasan YPT) ditambahkan sekalian.
const MODULES = ['karakter', 'mi', 'screening', 'cw', 'sc', 'pa', 'lw', 'kp'];

export function Sekolah() {
  const { data, loading, error, setAddSchoolOpen, setAddYayasanOpen, setEditSchoolTarget, showToast, isModuleOn, toggleModule, refetch } = useCms();
  // Menyimpan OBJEK sekolahnya, bukan id-nya saja. Dengan id, dialog cuma muncul kalau
  // pencariannya di data.sekolah ketemu; kalau meleset karena alasan apa pun, tidak ada yang
  // tampil dan tidak ada pesan apa pun -- persis gejala "diklik tidak terjadi apa-apa" yang
  // sulit dilacak. Data terbaru tetap diutamakan, objek tersimpan cuma jadi cadangan.
  const [expanded, setExpanded] = useState(null);

  if (loading) return <LoadingCards rows={4} />;
  if (error) {
    return <ErrorState title="Gagal memuat sekolah" desc={error} cta="Muat ulang" onCta={refetch} />;
  }
  if (data.sekolah.length === 0) {
    return <EmptyState title="Belum ada sekolah" desc="Tambahkan sekolah pertama untuk mulai." cta="Tambah sekolah" onCta={() => setAddSchoolOpen(true)} />;
  }

  const expandedSekolah = expanded
    ? (data.sekolah.find(s => s.id === expanded.id) || expanded)
    : null;

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
                  onExpand={() => setExpanded(cur => (cur?.id === k.id ? null : k))}
                  onEdit={() => setEditSchoolTarget(k)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {expandedSekolah && (
        <AspekConfigEditor
          key={expandedSekolah.id}
          sekolah={expandedSekolah}
          onTutup={() => setExpanded(null)}
        />
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

/** '*' adalah sentinel "sekolah ini satu kerangka untuk semua jenjang" (lihat migration
 * 20260828110000). Di layar admin, sentinel itu tidak boleh muncul apa adanya. */
function labelJenjang(jenjang) {
  return jenjang === '*' ? 'Seluruh sekolah' : jenjang;
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
 *
 * DIALOG, bukan panel di bawah tabel. Versi pertama merendernya sebagai kartu di akhir halaman,
 * dan admin melaporkan "diklik tidak terjadi apa-apa": panelnya memang muncul, tapi daftar
 * sekolah sudah puluhan baris sehingga panel itu jauh di luar layar dan tidak ada yang menggulir
 * ke sana. Dialog menghilangkan seluruh kelas masalah itu, sekalian mengikuti pola dialog CMS
 * yang sudah ada (AddUserDialog).
 */
function AspekConfigEditor({ sekolah, onTutup }) {
  const { showToast, refetch } = useCms();
  const [rows, setRows] = useState([]);
  const [indikator, setIndikator] = useState({});
  const [hapus, setHapus] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [gagalMuat, setGagalMuat] = useState(null);

  // Escape menutup, dan latar dikunci supaya menggulir di dalam dialog tidak menggeser tabel di
  // belakangnya. Tidak menutup saat sedang menyimpan: pekerjaannya sudah terkirim ke server dan
  // menghilangkan dialognya di tengah jalan cuma menyembunyikan hasilnya dari admin.
  // Kunci gulir SENGAJA di effect sendiri dengan deps kosong. Kalau digabung dengan pendengar
  // tombol di bawah, effect-nya ikut berjalan ulang setiap `onTutup` berganti identitas (dan itu
  // terjadi tiap render induknya), sehingga `gulirLama` yang tersimpan jadi 'hidden' hasil
  // jalannya sendiri -- dan saat dialog ditutup halaman tetap terkunci, tidak bisa digulir lagi.
  useEffect(() => {
    const gulirLama = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = gulirLama; };
  }, []);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && !menyimpan) onTutup(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menyimpan, onTutup]);

  // Dimuat SEKALI saat dialog dibuka. Komponennya di-key menurut sekolah.id, jadi memilih sekolah
  // lain memasangnya ulang dari awal dan `memuat` sudah bernilai true dari useState -- tidak perlu
  // menyetel ulang state di dalam effect. `sekolah.aspekConfig` sengaja tidak jadi dependensi:
  // identitasnya berganti tiap kali daftar CMS dimuat ulang, dan kalau itu memicu pemuatan ulang,
  // isian yang sedang diketik admin akan tertimpa data lama di tengah pengetikan.
  useEffect(() => {
    let batal = false;
    loadAspekKandidatAction(sekolah.id)
      .then((k) => {
        if (batal) return;
        // Gabungan baris yang terpakai di data DAN baris yang sudah terlanjur ada di config --
        // config lama yang (jenjang, kode)-nya tidak lagi muncul di data tetap ditampilkan supaya
        // bisa dihapus, bukan menghilang diam-diam.
        const perKunci = new Map();
        k.kerangka.forEach((r) => { perKunci.set(`${r.jenjang}|${r.aspek_kode}`, { ...r }); });
        (sekolah.aspekConfig || []).forEach((a) => {
          const kunci = `${a.jenjang ?? '*'}|${a.aspek_kode}`;
          if (!perKunci.has(kunci)) {
            perKunci.set(kunci, { jenjang: a.jenjang ?? '*', aspek_kode: a.aspek_kode, aspek_label: a.aspek_label, urutan: a.urutan, identitas_kode: a.identitas_kode, adaDiData: false });
          }
        });
        setRows([...perKunci.values()]
          .sort((a, b) =>
            String(a.jenjang).localeCompare(String(b.jenjang), 'id', { numeric: true })
            || nomorAspek(a.aspek_kode) - nomorAspek(b.aspek_kode)
            || a.aspek_kode.localeCompare(b.aspek_kode))
          .map((r, i) => ({
            jenjang: r.jenjang,
            aspek_kode: r.aspek_kode,
            aspek_label: r.aspek_label || tebakDariKode(r.aspek_kode),
            urutan: r.urutan ?? (nomorAspek(r.aspek_kode) === 999 ? i + 1 : nomorAspek(r.aspek_kode)),
            identitas_kode: r.identitas_kode || '',
            adaDiData: r.adaDiData !== false,
          })));
        setIndikator(k.indikator);
        setMemuat(false);
      })
      .catch((e) => { if (!batal) { setGagalMuat(e.message); setMemuat(false); } });
    return () => { batal = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sekolah.id]);

  const kunciBaris = (r) => `${r.jenjang}|${r.aspek_kode}`;

  function ubahLabel(kunci, nilai) {
    setRows((r) => r.map((x) => (kunciBaris(x) === kunci ? { ...x, aspek_label: nilai } : x)));
  }

  /** Pernyataan "karakter ini sama dengan karakter itu di jenjang lain". Satu-satunya jalan
   * masuk identitas_kode ke database; tidak ada pencocokan otomatis di mana pun. */
  function ubahIdentitas(kunci, nilai) {
    setRows((r) => r.map((x) => (kunciBaris(x) === kunci ? { ...x, identitas_kode: nilai } : x)));
  }

  function hapusBaris(kunci) {
    const baris = rows.find((x) => kunciBaris(x) === kunci);
    setRows((r) => r.filter((x) => kunciBaris(x) !== kunci));
    if (baris) setHapus((h) => (h.some((k) => `${k.jenjang}|${k.aspek_kode}` === kunci) ? h : [...h, { jenjang: baris.jenjang, aspek_kode: baris.aspek_kode }]));
  }

  function tambahBaris(jenjang) {
    const diJenjang = rows.filter((r) => r.jenjang === jenjang);
    const nomorBaru = Math.max(0, ...diJenjang.map((r) => nomorAspek(r.aspek_kode)).filter((n) => n !== 999)) + 1;
    const kode = `karakter${nomorBaru}`;
    if (diJenjang.some((r) => r.aspek_kode === kode)) return;
    setRows((r) => [...r, { jenjang, aspek_kode: kode, aspek_label: '', urutan: nomorBaru, identitas_kode: '', adaDiData: false }]);
    setHapus((h) => h.filter((k) => !(k.jenjang === jenjang && k.aspek_kode === kode)));
  }

  async function simpan() {
    const isi = rows.filter((r) => r.aspek_label.trim());
    if (isi.length === 0) {
      showToast('Isi minimal satu nama karakter dulu.', 'warn');
      return;
    }
    // Nama kembar dicek PER JENJANG, bukan sekolah-wide. Sekolah berkerangka per jenjang memang
    // memakai nama yang sama di beberapa jenjang ("Senang Beribadah" ada di keenam jenjang SD
    // Amal Mulia) -- itu wajar dan bukan salah ketik. Yang tidak wajar adalah dua kode berbeda
    // bernama sama DI DALAM satu jenjang, karena di laporan jenjang itu keduanya jadi dua batang
    // yang tidak bisa dibedakan pembacanya.
    for (const jenjang of [...new Set(isi.map((r) => r.jenjang))]) {
      const nama = isi.filter((r) => r.jenjang === jenjang).map((r) => r.aspek_label.trim().toLowerCase());
      const kembar = nama.find((n, i) => nama.indexOf(n) !== i);
      if (kembar) {
        showToast(`Di ${labelJenjang(jenjang)}, nama "${kembar}" dipakai dua kali. Beri nama berbeda tiap karakter.`, 'alert');
        return;
      }
    }

    setMenyimpan(true);
    try {
      await saveAspekConfigAction(
        sekolah.id,
        isi.map((r) => ({ jenjang: r.jenjang, aspek_kode: r.aspek_kode, aspek_label: r.aspek_label.trim(), urutan: r.urutan, identitas_kode: r.identitas_kode || null })),
        hapus,
      );
      setHapus([]);
      showToast(`${isi.length} nama karakter tersimpan untuk ${sekolah.nama}.`, 'safe');

      // Refresh view YPT DULU, baru tutup dan muat ulang daftar. Urutannya penting: refetch()
      // menyalakan state loading, dan layar Sekolah mengganti seluruh isinya dengan kerangka
      // memuat, sehingga dialog ini ikut dilepas di tengah pekerjaan yang belum selesai.
      try {
        await refreshYptViewsAction();
        showToast('Ringkasan Rapor Karakter YPT ikut diperbarui.', 'safe');
      } catch (e) {
        showToast('Tersimpan, tapi ringkasan YPT belum dihitung ulang: ' + e.message, 'warn', 5200);
      }

      setMenyimpan(false);
      onTutup();
      refetch();
      return;
    } catch (e) {
      showToast('Gagal simpan: ' + e.message, 'alert', 5200);
    }
    setMenyimpan(false);
  }

  const belumDiisi = rows.filter((r) => !r.aspek_label.trim()).length;

  const daftarJenjang = [...new Set(rows.map((r) => r.jenjang))]
    .sort((a, b) => String(a).localeCompare(String(b), 'id', { numeric: true }));
  // Sekolah berkerangka tunggal punya satu jenjang saja ('*'); seluruh kendali identitas
  // disembunyikan untuk mereka, karena tidak ada jenjang lain untuk disandingkan.
  //
  // Ditulis dengan .some, bukan cek panjang + indeks 0. Bentuk itu memberi `true` untuk daftar
  // KOSONG (undefined !== '*'), yaitu sekolah yang datanya belum pernah diunggah -- dan di
  // keadaan itu tombol "+ Aspek" di kaki dialog berganti jadi petunjuk "tombolnya ada di tiap
  // jenjang", padahal tidak ada satu pun jenjang yang tergambar. Sekolah tanpa data jadi
  // kehilangan satu-satunya cara menambah baris aspek manual.
  const perJenjang = daftarJenjang.some((j) => j !== '*');

  /** Grup identitas beserta anggotanya dan apakah indikator antaranggotanya benar-benar sama.
   * Perbandingannya memakai teks indikator apa adanya, dan hasilnya cuma PERINGATAN, bukan
   * larangan: sebagian perbedaan cuma beda ketikan ("mau_wudhu_waktu_sholat" vs "mau_berwudhu"),
   * sebagian lain perbedaan tingkat kesulitan yang nyata. Pencocokan teks tidak bisa membedakan
   * keduanya, jadi keputusannya tetap di admin -- lihat aturan identitas di migration
   * 20260828110000_karakter_kerangka_per_jenjang.sql. */
  const grupInfo = {};
  rows.filter((r) => r.identitas_kode).forEach((r) => {
    const g = (grupInfo[r.identitas_kode] ||= { nama: '', anggota: [], indikatorBeda: false });
    g.anggota.push(r);
    if (!g.nama && r.aspek_label.trim()) g.nama = r.aspek_label.trim();
  });
  Object.values(grupInfo).forEach((g) => {
    if (!g.nama) g.nama = '(belum dinamai)';
    const sidik = g.anggota.map((a) => (indikator[`${a.jenjang}|${a.aspek_kode}`] || []).map(bacaIndikator).slice().sort().join('|'));
    g.indikatorBeda = new Set(sidik).size > 1;
  });

  const kodeGrupBaru = () => {
    const angka = Object.keys(grupInfo)
      .map((k) => parseInt(String(k).replace(/\D/g, ''), 10))
      .filter(Number.isFinite);
    return `grup${Math.max(0, ...angka) + 1}`;
  };

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(33,27,46,.42)', zIndex: 60 }}
        onClick={menyimpan ? undefined : onTutup}
      />
      <div
        className="dialog-enter"
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          background: 'var(--surface)', borderRadius: 20, width: 'min(760px,94vw)', maxHeight: '86vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(33,27,46,.28)', zIndex: 70,
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`Nama karakter ${sekolah.nama}`}
      >
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div className="disp" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Nama Karakter — {sekolah.nama}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>
              Nama ini yang tampil di laporan siswa, wali kelas, kepala sekolah, dan yayasan
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: 6, flexShrink: 0 }} onClick={onTutup} disabled={menyimpan} aria-label="Tutup">
            <IconX size={16} />
          </button>
        </div>

        <div style={{ padding: '18px 24px', overflowY: 'auto', flex: 1 }}>

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

          {perJenjang && (
            <div style={{ padding: '10px 13px', background: 'var(--ungu-050)', borderRadius: 11, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ungu-700)' }}>
                Sekolah ini punya kerangka karakter berbeda di {daftarJenjang.length} jenjang
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.5 }}>
                Tiap jenjang dinamai sendiri. Karakter dari jenjang berbeda hanya boleh disandingkan
                dalam satu grafik kalau nama DAN indikatornya sama persis, dan itu dinyatakan lewat
                kolom &ldquo;Sama dengan&rdquo; di bawah. Selama tidak dinyatakan, tiap karakter
                berdiri sendiri.
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 16 }}>
            {daftarJenjang.map((jenjang) => (
              <div key={jenjang}>
                {perJenjang && (
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ungu-600)', marginBottom: 6 }}>
                    {labelJenjang(jenjang)}
                  </div>
                )}
                <div style={{ display: 'grid', gap: 8 }}>
                  {rows.filter((r) => r.jenjang === jenjang).map((r) => {
                    const kunci = kunciBaris(r);
                    const indList = indikator[kunci] || [];
                    const grup = r.identitas_kode ? grupInfo[r.identitas_kode] : null;
                    return (
                      <div key={kunci} style={{ padding: '11px 13px', background: 'var(--surface-soft)', borderRadius: 11, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', width: 84, flexShrink: 0, paddingTop: 8 }}>
                          {r.aspek_kode}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <input
                            value={r.aspek_label}
                            onChange={(e) => ubahLabel(kunci, e.target.value)}
                            placeholder="Nama karakter, mis. Empati"
                            style={{ width: '100%', padding: '7px 10px', fontSize: 12.5, fontWeight: 600, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
                          />
                          {/* Petunjuk terpenting di form ini: kode indikator menyimpan teks asli dari header
                              file upload, jadi admin bisa membaca isinya dan tahu karakter apa yang dimaksud
                              tanpa membuka file aslinya. */}
                          {indList.length > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 5, lineHeight: 1.45 }}>
                              Indikatornya: {indList.slice(0, 4).map(bacaIndikator).join(' · ')}
                              {indList.length > 4 && ` · +${indList.length - 4} lagi`}
                            </div>
                          )}
                          {!r.adaDiData && (
                            <div style={{ fontSize: 11, color: 'var(--status-warn)', marginTop: 5 }}>
                              Kode ini tidak ditemukan di data skor sekolah ini.
                            </div>
                          )}

                          {perJenjang && (
                            <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Sama dengan:</span>
                              <select
                                value={r.identitas_kode || ''}
                                onChange={(e) => ubahIdentitas(kunci, e.target.value === '__baru__' ? kodeGrupBaru() : e.target.value)}
                                style={{ padding: '4px 8px', fontSize: 11.5, borderRadius: 7, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', maxWidth: 320 }}
                              >
                                <option value="">Berdiri sendiri</option>
                                {Object.entries(grupInfo).map(([kode, g]) => (
                                  <option key={kode} value={kode}>
                                    {g.nama} — {g.anggota.map((a) => labelJenjang(a.jenjang)).join(', ')}
                                  </option>
                                ))}
                                <option value="__baru__">+ Grup baru</option>
                              </select>
                              {grup && grup.anggota.length > 1 && grup.indikatorBeda && (
                                <span style={{ fontSize: 11, color: 'var(--status-warn)' }}>
                                  ⚠ indikator anggota grup ini tidak sama persis
                                </span>
                              )}
                            </div>
                          )}

                          {/* Perbandingan indikator antar anggota grup, ditampilkan di tempat
                              keputusannya diambil. Nama karakter saja tidak cukup untuk memutuskan
                              dua karakter itu sama: di SD Amal Mulia "Senang Beribadah" ada di
                              keenam jenjang, dan justru indikatornyalah yang membedakan. */}
                          {grup && grup.anggota.length > 1 && (
                            <div style={{ marginTop: 6, padding: '7px 9px', background: 'var(--surface)', borderRadius: 8, border: '1px dashed var(--line)' }}>
                              {grup.anggota.map((a) => (
                                <div key={`${a.jenjang}|${a.aspek_kode}`} style={{ fontSize: 10.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                                  <strong>{labelJenjang(a.jenjang)}</strong>: {(indikator[`${a.jenjang}|${a.aspek_kode}`] || []).map(bacaIndikator).join(' · ') || '(tidak ada indikator)'}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          className="btn-ghost"
                          style={{ padding: '4px 8px', fontSize: 11.5, flexShrink: 0 }}
                          onClick={() => hapusBaris(kunci)}
                          title="Hapus baris konfigurasi ini"
                        >
                          Hapus
                        </button>
                      </div>
                    );
                  })}
                </div>
                {perJenjang && (
                  <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 11.5, marginTop: 6 }} onClick={() => tambahBaris(jenjang)} disabled={menyimpan}>
                    + Karakter di {labelJenjang(jenjang)}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          {/* Sekolah berkerangka per jenjang punya tombol tambah SENDIRI di tiap jenjang, karena
              satu tombol di kaki dialog tidak bisa tahu jenjang mana yang dimaksud. */}
          {perJenjang
            ? <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Tombol tambah karakter ada di tiap jenjang</span>
            : <button className="btn-secondary" onClick={() => tambahBaris('*')} disabled={memuat || menyimpan}>+ Aspek</button>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={onTutup} disabled={menyimpan}>Batal</button>
            <button className="btn-primary" onClick={simpan} disabled={memuat || menyimpan}>
              {menyimpan ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </>
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

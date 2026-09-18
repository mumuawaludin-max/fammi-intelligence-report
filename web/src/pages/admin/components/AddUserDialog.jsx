import { useEffect, useRef, useState } from 'react';
import { useCms } from '../store/CmsStore';
import { IconX } from './icons';
import { parseGuruFile } from '../importers/guruImporter';
import { parseSwFile, unduhTemplateSw } from '../importers/swImporter';
import { PERAN_SW, downloadXlsx } from '../data/helpers';
import { SwLinkFields } from './SwLinkFields';

const PERAN_OPTIONS = ['AdminFammi', 'Yayasan', 'KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Karyawan', 'WaliKelas', 'OrangTua', 'Siswa', ...PERAN_SW];
const labelStyle = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5, display: 'block' };

export function AddUserDialog() {
  const { state, setAddUserOpen } = useCms();
  const [tab, setTab] = useState('satu');

  if (!state.addUserOpen) return null;
  const close = () => setAddUserOpen(false);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(33,27,46,.42)', zIndex: 60 }} onClick={close} />
      <div className="dialog-enter" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--surface)', borderRadius: 20, width: 'min(720px,94vw)', maxHeight: '86vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px rgba(33,27,46,.28)', zIndex: 70 }}>
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="disp" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Buat akun baru</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3, marginBottom: 14 }}>Password sementara auto-generate lewat Edge Function create-user</div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={close}><IconX size={16} /></button>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: '0 24px', borderBottom: '1px solid var(--line)' }}>
          {[['satu', 'Satu per satu'], ['bulk', 'Upload CSV / Excel']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '10px 4px', marginRight: 20, background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, color: tab === key ? 'var(--purple-600)' : 'var(--ink-3)',
              borderBottom: tab === key ? '2px solid var(--purple-600)' : '2px solid transparent',
            }}>{label}</button>
          ))}
        </div>
        {tab === 'satu' ? <SingleForm close={close} /> : <BulkForm close={close} />}
      </div>
    </>
  );
}

function SingleForm({ close }) {
  const { createUser } = useCms();
  const [busy, setBusy] = useState(false);
  const namaRef = useRef(null);
  const usernameRef = useRef(null);
  const peranRef = useRef(null);
  const cakupanRef = useRef(null);
  const schoolRef = useRef(null);
  // Peran dan sekolah dipantau sebagai state supaya isian tautan modul sw bisa muncul/menghilang.
  const [peran, setPeran] = useState(PERAN_OPTIONS[0]);
  const [schoolId, setSchoolId] = useState('');
  const [swUnitId, setSwUnitId] = useState('');
  const [swIndividuId, setSwIndividuId] = useState('');

  const submit = async () => {
    const nama = namaRef.current?.value.trim();
    const username = usernameRef.current?.value.trim();
    if (!nama || !username) return;
    if (peran === 'KepalaUnit' && !swUnitId.trim()) return;
    if (peran === 'Pegawai' && !swIndividuId.trim()) return;
    setBusy(true);
    try {
      await createUser({
        nama,
        username,
        peran: peranRef.current?.value,
        schoolId: schoolRef.current?.value.trim() || null,
        cakupan: cakupanRef.current?.value.trim() || null,
        swUnitId: peran === 'KepalaUnit' ? swUnitId.trim() : null,
        swIndividuId: peran === 'Pegawai' ? swIndividuId.trim() : null,
      });
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <div>
          <label style={labelStyle}>Nama lengkap</label>
          <input ref={namaRef} className="fld" placeholder="Contoh: Bu Ratna Dewi" autoFocus />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Username (atau email)</label>
            <input ref={usernameRef} className="fld mono" placeholder="wali.x-a atau nama@sekolah.id" />
          </div>
          <div>
            <label style={labelStyle}>Peran</label>
            <select ref={peranRef} className="fld" value={peran} onChange={(e) => setPeran(e.target.value)}>
              {PERAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Sekolah (school_id{PERAN_SW.includes(peran) ? ', wajib' : ', opsional'})</label>
          <input ref={schoolRef} className="fld mono" placeholder="Contoh: SDIP-ALMADANI" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} />
        </div>
        <SwLinkFields peran={peran} schoolId={schoolId.trim()} unitId={swUnitId} onUnitId={setSwUnitId} individuId={swIndividuId} onIndividuId={setSwIndividuId} />
        <div>
          <label style={labelStyle}>Cakupan</label>
          <input ref={cakupanRef} className="fld" placeholder="Sesuai peran: nama kelas / yayasan_id, pisah koma kalau lebih dari satu" />
        </div>
        <div style={{ padding: '10px 12px', background: 'var(--info-soft)', borderRadius: 8, fontSize: 11.5, color: 'var(--info)', lineHeight: 1.4 }}>
          💡 Kalau username diisi alamat email asli (ada "@"), login pakai email itu langsung — bukan lewat domain @fammi.internal.
        </div>
      </div>
      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--surface-soft)', borderRadius: '0 0 20px 20px' }}>
        <button className="btn-secondary" onClick={close} disabled={busy}>Batal</button>
        <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? 'Membuat…' : 'Buat akun & kirim password'}</button>
      </div>
    </>
  );
}

// Jenis berkas yang bisa diunggah: database guru (Karakter) atau dua jenis akun modul Screening
// Awal Wellbeing. Yang kedua dan ketiga mencocokkan baris ke sw_unit/sw_individu sekolah itu.
const JENIS_BERKAS = [
  { kunci: 'guru', label: 'Guru dan wali kelas (modul Karakter)' },
  { kunci: 'kunit', label: 'Kepala unit (Screening Awal Wellbeing)' },
  { kunci: 'pegawai', label: 'Pegawai (Screening Awal Wellbeing)' },
];

function BulkForm({ close }) {
  const { bulkCreateUsers, data } = useCms();
  const [sekolahId, setSekolahId] = useState(data.sekolah[0]?.id || '');
  const [jenis, setJenis] = useState('guru');
  const [rows, setRows] = useState(null);
  const [parseInfo, setParseInfo] = useState(null);
  const [swRef, setSwRef] = useState({ unit: [], individu: [] });
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [err, setErr] = useState(null);
  const fileRef = useRef(null);
  const scrollRef = useRef(null);
  const sw = jenis !== 'guru';

  // Sekali baris tabel punya banyak <select> (Peran/Kelas) dan salah satunya sudah difokus
  // (diklik untuk pilih kelas manual), Chrome/Firefox mengarahkan scroll wheel berikutnya untuk
  // GANTI NILAI select itu, bukan scroll daftar di belakangnya -- baris jadi terasa "tidak bisa
  // discroll" begitu tabel makin panjang. Listener native (bukan prop onWheel React, yang
  // dipasang passive sejak React 17 sehingga preventDefault() di situ diam-diam tidak berlaku)
  // memaksa wheel di atas select tetap men-scroll kontainer ini, bukan mengubah pilihannya.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (e.target.closest('select')) {
        e.preventDefault();
        // Scroll wadah terdekat yang benar-benar bisa discroll (tabel preview/hasil punya
        // scrollbar sendiri sekarang), fallback ke panel dialog.
        const scroller = e.target.closest('[data-scroll]') || el;
        scroller.scrollTop += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const gantiJenis = (k) => {
    setJenis(k);
    setRows(null);
    setResults(null);
    setParseInfo(null);
    setErr(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !sekolahId) return;
    setErr(null);
    setResults(null);
    setParseInfo(null);
    try {
      if (sw) {
        const usernameAda = new Set((data.users || []).map((u) => u.username));
        const parsed = await parseSwFile(file, { sekolahId, jenis, usernameAda });
        setRows(parsed.rows);
        setSwRef({ unit: parsed.unit, individu: parsed.individu });
        setParseInfo({ sheetCount: parsed.sheetCount, dupCount: parsed.dupCount });
      } else {
        const parsed = await parseGuruFile(file, { sekolahId });
        setRows(parsed.rows);
        setParseInfo({ sheetCount: parsed.sheetCount, dupCount: parsed.dupCount });
      }
    } catch (ex) {
      setErr(ex.message);
    }
  };

  const unduhTemplate = async () => {
    setErr(null);
    try { await unduhTemplateSw(sekolahId, jenis); } catch (ex) { setErr(ex.message); }
  };

  const updateRow = (idx, patch) => {
    setRows((rs) => rs.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };

  const submit = async () => {
    setBusy(true);
    setProgress({ done: 0, total: rows.length });
    try {
      const res = await bulkCreateUsers(rows, sekolahId, (done, total) => setProgress({ done, total }));
      setResults(res);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const unmatchedCount = rows
    ? rows.filter((r) => (r.peran === 'WaliKelas' && r.confidence === 'unmatched')
      || (r.peran === 'KepalaUnit' && !r.sw_unit_id)
      || (r.peran === 'Pegawai' && !r.sw_individu_id)).length
    : 0;
  const bisaKirim = rows && rows.length > 0 && !rows.some((r) => (r.peran === 'KepalaUnit' && !r.sw_unit_id) || (r.peran === 'Pegawai' && !r.sw_individu_id));

  return (
    <>
      <div ref={scrollRef} style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Sekolah</label>
            <select className="fld" value={sekolahId} onChange={(e) => setSekolahId(e.target.value)}>
              {data.sekolah.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Jenis berkas</label>
            <select className="fld" value={jenis} onChange={(e) => gantiJenis(e.target.value)}>
              {JENIS_BERKAS.map((j) => <option key={j.kunci} value={j.kunci}>{j.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: sw ? '1fr auto' : '1fr', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>File CSV / Excel</label>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="fld" onChange={onFile} />
          </div>
          {sw && <button className="btn-secondary" onClick={unduhTemplate} type="button">Unduh template</button>}
        </div>
        {jenis === 'guru' && (
          <div style={{ padding: '10px 12px', background: 'var(--info-soft)', borderRadius: 8, fontSize: 11.5, color: 'var(--info)', lineHeight: 1.4 }}>
            💡 Kolom yang dibaca: <span className="mono">Nama Lengkap, Posisi, Wali Kelas, Email</span>. Baris dengan Wali Kelas = "Pimpinan Sekolah" jadi peran <span className="mono">KepalaSekolah</span>, sisanya <span className="mono">WaliKelas</span> dengan kelas dicocokkan otomatis ke data karakter_skor.
          </div>
        )}
        {jenis === 'kunit' && (
          <div style={{ padding: '10px 12px', background: 'var(--info-soft)', borderRadius: 8, fontSize: 11.5, color: 'var(--info)', lineHeight: 1.4 }}>
            💡 Satu baris per akun pimpinan. Kolom: <span className="mono">Unit</span> (wajib, dicocokkan ke nama unit di data screening), <span className="mono">Jabatan</span>, <span className="mono">Nama Lengkap</span> (kalau kosong dipakai jabatannya), <span className="mono">Username</span> (kalau kosong dibuat dari nama). Satu unit boleh punya beberapa baris: "Direktur dan Wakil Direktur" disiapkan untuk Direktur dan tiga Wakil Direktur Wilayah. "Unduh template" memberi semua baris yang tinggal diisi.
          </div>
        )}
        {jenis === 'pegawai' && (
          <div style={{ padding: '10px 12px', background: 'var(--info-soft)', borderRadius: 8, fontSize: 11.5, color: 'var(--info)', lineHeight: 1.4 }}>
            💡 Satu baris per pegawai. Kolom: <span className="mono">Nama Lengkap</span> (wajib, dicocokkan ke nama di data screening), <span className="mono">Unit</span> (dipakai kalau ada nama yang sama di dua unit), <span className="mono">Username</span> (kalau kosong dibuat dari nama, mis. fatmawaty.syam). "Unduh template" memberi daftar semua pegawai yang tinggal diisi; hapus baris yang tidak perlu dibuatkan akun.
          </div>
        )}
        {err && <div style={{ padding: '10px 12px', background: 'var(--status-alert-bg,#FBE7EA)', borderRadius: 8, fontSize: 12, color: 'var(--status-alert,#D6455A)' }}>{err}</div>}

        {rows && !results && (
          <>
            <div style={{ padding: '10px 12px', background: 'var(--status-safe-bg,#E7F4EE)', borderRadius: 8, fontSize: 12, color: 'var(--status-safe,#2E9E6B)' }}>
              ✅ {rows.length} baris terbaca dari {parseInfo?.sheetCount || 1} sheet
              {parseInfo?.dupCount > 0 ? `, ${parseInfo.dupCount} baris ganda dilewati` : ''}. Semua akan diproses, tidak ada batas jumlah.
            </div>
            {unmatchedCount > 0 && (
              <div style={{ padding: '10px 12px', background: '#FAF1DC', borderRadius: 8, fontSize: 12, color: '#D69219' }}>
                ⚠️ {unmatchedCount} baris {sw ? 'belum cocok dengan data screening' : 'kelasnya tidak ketemu otomatis'}: pilih manual di kolom {sw ? (jenis === 'kunit' ? 'Unit' : 'Pegawai di data') : 'Kelas'} sebelum submit.
              </div>
            )}
            <div data-scroll style={{ border: '1px solid var(--line)', borderRadius: 10, overflowY: 'auto', maxHeight: '46vh', flexShrink: 0 }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr style={{ background: 'var(--surface-soft)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px' }}>Nama</th>
                    <th style={{ padding: '8px 10px' }}>{sw ? 'Username' : 'Email (username)'}</th>
                    {!sw && <th style={{ padding: '8px 10px' }}>Peran</th>}
                    <th style={{ padding: '8px 10px' }}>{jenis === 'guru' ? 'Kelas' : jenis === 'kunit' ? 'Unit' : 'Pegawai di data'}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid var(--line)' }}>
                      <td style={{ padding: '6px 10px' }}>
                        {sw ? <input className="fld" style={{ padding: '4px 6px', fontSize: 12 }} value={r.nama} onChange={(e) => updateRow(idx, { nama: e.target.value })} /> : r.nama}
                      </td>
                      <td style={{ padding: '6px 10px' }} className="mono">
                        {sw ? <input className="fld mono" style={{ padding: '4px 6px', fontSize: 12 }} value={r.username} onChange={(e) => updateRow(idx, { username: e.target.value.trim().toLowerCase() })} /> : r.email}
                      </td>
                      {!sw && (
                        <td style={{ padding: '6px 10px' }}>
                          <select className="fld" style={{ padding: '4px 6px', fontSize: 12 }} value={r.peran}
                            onChange={(e) => updateRow(idx, { peran: e.target.value, cakupan: e.target.value === 'WaliKelas' ? r.cakupan : [] })}>
                            {PERAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                      )}
                      <td style={{ padding: '6px 10px' }}>
                        {jenis === 'kunit' && (
                          <select className="fld" style={{ padding: '4px 6px', fontSize: 12, borderColor: !r.sw_unit_id ? '#D69219' : undefined }} value={r.sw_unit_id}
                            onChange={(e) => updateRow(idx, { sw_unit_id: e.target.value, confidence: e.target.value ? 'manual' : 'unmatched' })}>
                            <option value="">{r.unitTeks ? `Tidak cocok: "${r.unitTeks}"` : 'Pilih unit…'}</option>
                            {swRef.unit.map((u) => <option key={u.id} value={u.id}>{u.nama} ({u.n} pengisi)</option>)}
                          </select>
                        )}
                        {jenis === 'pegawai' && (
                          <>
                            <input list={`sw-orang-${idx}`} className="fld mono" style={{ padding: '4px 6px', fontSize: 12, borderColor: !r.sw_individu_id ? '#D69219' : undefined }}
                              placeholder={r.confidence === 'ambigu' ? `Nama ada di ${r.kandidat.length} unit, pilih satu` : 'Tidak cocok, ketik nama lalu pilih'}
                              value={r.sw_individu_id} onChange={(e) => updateRow(idx, { sw_individu_id: e.target.value.trim(), confidence: 'manual' })} />
                            <datalist id={`sw-orang-${idx}`}>
                              {(r.confidence === 'ambigu' ? r.kandidat : swRef.individu).map((o) => <option key={o.id} value={o.id}>{`${o.nama} · ${o.unitNama}`}</option>)}
                            </datalist>
                            {r.sw_individu_id && (
                              <div style={{ fontSize: 11, color: r.confidence === 'fuzzy' ? '#D69219' : 'var(--ink-3)', marginTop: 2 }}>
                                {(() => { const o = swRef.individu.find((x) => x.id === r.sw_individu_id); return o ? `${o.nama} · ${o.unitNama}${r.confidence === 'fuzzy' ? ' (ejaan beda, cek lagi)' : ''}` : 'Id tidak ada di data'; })()}
                              </div>
                            )}
                          </>
                        )}
                        {jenis === 'guru' && (r.peran === 'WaliKelas' ? (
                          <>
                            {/* Input teks + datalist, bukan <select> murni -- kelasOptions berasal dari
                                karakter_skor yang SUDAH terimpor untuk sekolah ini. Kalau sekolah belum
                                pernah impor data Karakter (mis. akun guru dibuat duluan sebelum skor
                                diupload), kelasOptions kosong dan <select> murni tidak punya satu pun
                                opsi untuk dipilih -- admin terjebak, tidak bisa submit sama sekali.
                                Input teks dengan datalist tetap menyarankan kelas yang sudah dikenal
                                (kalau ada) tapi selalu mengizinkan ketik manual. */}
                            <input list={`kelas-opts-${idx}`} className="fld" style={{ padding: '4px 6px', fontSize: 12, borderColor: r.confidence === 'unmatched' ? '#D69219' : undefined }}
                              placeholder="Ketik nama kelas"
                              value={r.cakupan[0] || ''} onChange={(e) => updateRow(idx, { cakupan: e.target.value ? [e.target.value] : [] })} />
                            <datalist id={`kelas-opts-${idx}`}>
                              {r.kelasOptions.map(k => <option key={k} value={k} />)}
                            </datalist>
                          </>
                        ) : <span style={{ color: 'var(--ink-4)' }}>-</span>)}
                        {jenis === 'kunit' && r.jabatan && (
                          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{r.jabatan}</div>
                        )}
                        {jenis === 'kunit' && r.sw_unit_binaan?.length > 0 && (
                          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }} title={r.sw_unit_binaan.map((id) => swRef.unit.find((u) => u.id === id)?.nama || id).join(', ')}>
                            Melihat {r.sw_unit_binaan.length} unit binaan
                          </div>
                        )}
                        {jenis === 'kunit' && r.unitTeks && r.sw_unit_id && r.confidence === 'fuzzy' && (
                          <div style={{ fontSize: 11, color: '#D69219', marginTop: 2 }}>Ejaan beda dari "{r.unitTeks}", cek lagi.</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {results && (
          <div data-scroll style={{ border: '1px solid var(--line)', borderRadius: 10, overflowY: 'auto', maxHeight: '46vh', flexShrink: 0 }}>
            <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span>{results.filter(r => r.ok).length} berhasil, {results.filter(r => !r.ok).length} gagal dari {results.length} baris</span>
              <button className="btn-secondary" type="button" style={{ padding: '4px 10px', fontSize: 12 }}
                onClick={() => downloadXlsx(`kode-akun-${jenis}-${sekolahId}.xlsx`, results.map((r) => ({ Username: r.username, Nama: r.nama || '', Status: r.ok ? 'Berhasil' : r.error, 'Kode khusus': r.ok ? r.password : '' })))}>
                Unduh kode (Excel)
              </button>
            </div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-soft)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>Username</th>
                  <th style={{ padding: '8px 10px' }}>Status</th>
                  <th style={{ padding: '8px 10px' }}>Kode khusus</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={{ padding: '6px 10px' }} className="mono">{r.username}</td>
                    <td style={{ padding: '6px 10px', color: r.ok ? '#2E9E6B' : '#D6455A' }}>{r.ok ? 'Berhasil' : r.error}</td>
                    <td style={{ padding: '6px 10px' }} className="mono">{r.ok ? r.password : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '10px 12px', fontSize: 11.5, color: 'var(--ink-3)' }}>
              ⚠️ Kode khusus di atas cuma tampil sekali di sini: unduh atau salin sebelum menutup dialog ini.
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--surface-soft)', borderRadius: '0 0 20px 20px' }}>
        <button className="btn-secondary" onClick={close} disabled={busy}>{results ? 'Tutup' : 'Batal'}</button>
        {rows && !results && (
          <button className="btn-primary" onClick={submit} disabled={busy || !bisaKirim} title={bisaKirim ? undefined : 'Masih ada baris yang belum cocok'}>
            {busy ? `Membuat ${progress?.done ?? 0}/${progress?.total ?? rows.length}…` : `Buat ${rows.length} akun`}
          </button>
        )}
      </div>
    </>
  );
}

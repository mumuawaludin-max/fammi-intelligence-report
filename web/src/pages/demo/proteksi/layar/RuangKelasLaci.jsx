import { useState } from "react";
import { Ikon, KepalaLaci, Laci, Segmen } from "../komponen";
import { HurufHeart, PilStatus } from "../bersama/HeartKecil";
import { HEART, cariAspek, metaStatus } from "../bersama/heart";
import { LABEL_ALUR } from "../bersama/tindakLanjut";
import {
  HARI_DEMO,
  JUMLAH_BUTIR,
  LANGKAH_SKRINING,
  adaTandaBahaya,
  cariAnak,
  langkahBelumLengkap,
  namaDepan,
  statusAlasan,
  terjawabLangkah,
  terjawabSemua,
} from "./ruangKelasData";

/**
 * Empat laci layar Ruang wali kelas: formulir skrining HEART versi wali kelas, ringkasan satu anak,
 * tetapkan buddy, dan catat observasi. Laci hanya menyimpan isian sementaranya; yang berdampak ke
 * layar (terkirim, buddy baru, catatan baru) diserahkan ke RuangKelas lewat prop.
 */

/** Status anak untuk kelas avatar: waspada, perhatian, baik, belum. */
function kelasStatus(status) {
  return metaStatus(status).id;
}

// ── Formulir skrining HEART versi wali kelas ───────────────────────────────────────────────────

/**
 * anakIsi: nama anak yang sedang diisi. pilihanAnak: nama anak yang belum punya hasil.
 * jawaban: isian anak ini { idLangkah: { indeks: pilihan } }. terkirim: { kasus } bila sudah
 * dikirim. onJawab(idLangkah, indeks, pilihan), onPilihAnak(nama), onKirim(nama).
 */
export function LaciSkrining({ anakIsi, pilihanAnak, jawaban, terkirim, sudahDikirim, onPilihAnak, onJawab, onKirim, onTutup, toast }) {
  // Bagian yang terbuka disimpan per anak supaya berpindah anak tidak menghapus posisi.
  const [langkahPer, setLangkahPer] = useState({});
  const idLangkah = langkahPer[anakIsi] || langkahBelumLengkap(jawaban);
  const nLangkah = LANGKAH_SKRINING.findIndex((l) => l.id === idLangkah);
  const langkah = LANGKAH_SKRINING[nLangkah];
  const berikut = LANGKAH_SKRINING[nLangkah + 1] || null;
  const terjawab = terjawabSemua(jawaban);
  const lengkap = terjawab === JUMLAH_BUTIR;
  const tanda = adaTandaBahaya(jawaban);
  const depan = namaDepan(anakIsi);

  function keLangkah(id) {
    setLangkahPer((l) => ({ ...l, [anakIsi]: id }));
  }

  // Bagian yang sedang dijawab dikunci supaya jawaban kelima tidak membuat formulir melompat sendiri
  // ke aspek berikutnya; pindah bagian hanya lewat tombol Lanjut atau deretan bagian.
  function jawab(i, j) {
    if (!langkahPer[anakIsi]) keLangkah(idLangkah);
    onJawab(idLangkah, i, j);
  }

  function kirim() {
    if (terkirim) return;
    if (!lengkap) {
      toast(`Masih ada ${JUMLAH_BUTIR - terjawab} pernyataan yang belum dijawab`);
      keLangkah(langkahBelumLengkap(jawaban));
      return;
    }
    onKirim(anakIsi);
  }

  const pilihan = pilihanAnak.map((n) => ({ id: n, label: n + (sudahDikirim(n) ? " (terkirim)" : "") }));

  return (
    <Laci label={`Skrining HEART ${anakIsi}`} labelTutup="Tutup formulir skrining" onTutup={onTutup}>
      <KepalaLaci
        awal={
          <div className="tile p">
            <Ikon nama="skrining" size={20} />
          </div>
        }
        judul={`Skrining HEART · ${anakIsi}`}
        sub="Versi wali kelas · yang Anda lihat di sekolah sebulan terakhir · sekitar 3 menit"
        onTutup={onTutup}
      />
      {pilihan.length > 1 && (
        <Segmen label="Pilih anak" pilihan={pilihan} nilai={anakIsi} onPilih={onPilihAnak} style={{ alignSelf: "flex-start" }} />
      )}

      {terkirim ? (
        <p className={terkirim.kasus ? "reco bad" : "reco ok"}>
          {terkirim.kasus
            ? `Skrining ${depan} sudah terkirim. Jawaban Ya pada pertanyaan keamanan menjadi laporan ${terkirim.kasus} dan sedang menunggu triage Bu Laras.`
            : `Skrining ${depan} sudah terkirim. Hasil HEART keluar setelah isian orang tua masuk dan dianalisis tim ahli Fammi.`}
        </p>
      ) : (
        <>
          <div className="fslangkah" role="group" aria-label="Bagian formulir">
            {LANGKAH_SKRINING.map((l) => {
              const n = terjawabLangkah(jawaban, l.id);
              const penuh = n === l.butir.length;
              const aktif = l.id === idLangkah;
              return (
                <button
                  key={l.id}
                  type="button"
                  className={`fsstep${aktif ? " on" : ""}${penuh ? " penuh" : ""}`}
                  aria-pressed={aktif}
                  aria-label={`${l.nama}, ${n} dari ${l.butir.length} terjawab`}
                  onClick={() => keLangkah(l.id)}
                >
                  <span className="fskode">{l.kode || <Ikon nama="perisai" size={12} />}</span>
                  {/* Nama aspek hanya di bagian yang terbuka supaya enam bagian muat sebaris. */}
                  {(aktif || !l.kode) && <span className="fsnama">{l.kode ? l.nama : "Keamanan"}</span>}
                  {penuh ? <Ikon nama="centang" size={13} className="fscek" /> : <span className="fsjml">{`${n}/${l.butir.length}`}</span>}
                </button>
              );
            })}
          </div>

          <div className={`fskepala${langkah.keamanan ? " aman" : ""}`}>
            <span className="fsbadge">{langkah.kode || <Ikon nama="perisai" size={15} />}</span>
            <div>
              <h3 className="fsjudul">{langkah.nama}</h3>
              <p className="fsket">{langkah.ket}</p>
            </div>
          </div>

          <ol className="fsdaftar">
            {langkah.butir.map((teks, i) => {
              const nomor = langkah.awal + i;
              const dipilih = jawaban?.[langkah.id]?.[i];
              return (
                <li key={teks} className="fsbaris">
                  <span className="fsno" aria-hidden="true">
                    {nomor}
                  </span>
                  <span className="fsteks" id={`rk-butir-${nomor}`}>
                    {teks}
                  </span>
                  <span className="fsopsi" role="group" aria-labelledby={`rk-butir-${nomor}`}>
                    {langkah.skala.map((label, j) => {
                      const aktif = dipilih === j;
                      const bahaya = langkah.keamanan && j === 2;
                      return (
                        <button
                          key={label}
                          type="button"
                          className={`fsopt${aktif ? " on" : ""}${aktif && bahaya ? " bahaya" : ""}`}
                          aria-pressed={aktif}
                          onClick={() => jawab(i, j)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </span>
                </li>
              );
            })}
          </ol>

          {tanda && (
            <p className="reco bad">
              Ada jawaban Ya pada pertanyaan keamanan. Setelah dikirim, sistem membuat laporan kejadian baru dan meneruskannya ke
              Bu Laras (Koordinator BK) untuk triage.
            </p>
          )}
        </>
      )}

      <div className="fsbar">
        <span className="fsprog">
          <span className="ckbar" aria-hidden="true">
            <span style={{ width: `${Math.round((terjawab / JUMLAH_BUTIR) * 100)}%` }} />
          </span>
          {`${terjawab} dari ${JUMLAH_BUTIR} terjawab`}
        </span>
        <span className="fstombol">
          {!terkirim && berikut && (
            <button type="button" className="ghost sm" onClick={() => keLangkah(berikut.id)}>
              {`Lanjut: ${berikut.kode ? berikut.nama : "Keamanan"}`}
              <Ikon nama="kanan" size={16} />
            </button>
          )}
          {terkirim ? (
            <button type="button" className="ghost sm" onClick={onTutup}>
              Tutup
            </button>
          ) : (
            // Tetap bisa ditekan saat belum lengkap: pemberitahuan menjelaskan apa yang kurang.
            <button type="button" className={lengkap ? "btnp" : "btnp off"} aria-disabled={lengkap ? undefined : "true"} onClick={kirim}>
              {`Kirim skrining ${depan}`}
            </button>
          )}
        </span>
      </div>
    </Laci>
  );
}

// ── Ringkasan satu anak ────────────────────────────────────────────────────────────────────────

/**
 * nama: anak yang dibuka. buddy: pasangan buddy yang memuat anak ini, atau null. butir: checklist
 * Bu Rina untuk anak ini. catatan: catatan observasi terakhirnya. terkirim: { kasus } bila formulir
 * wali kelasnya baru dikirim. perluBuddy: anak ini menunggu buddy.
 */
export function LaciRingkasan({ nama, buddy, butir, centang, catatan, terkirim, perluBuddy, onIsi, onObs, onBuddy, onRaka, onTutup }) {
  const anak = cariAnak(nama);
  if (!anak) return null;
  const belum = !anak.heart;
  const sebagaiBuddy = buddy && buddy.buddy === anak.nama;

  return (
    <Laci label={`Ringkasan ${anak.nama}`} labelTutup="Tutup ringkasan anak" onTutup={onTutup} lebar={440}>
      <KepalaLaci
        awal={<span className={`pkav besar ${kelasStatus(anak.status)}`}>{anak.inisial}</span>}
        judul={anak.nama}
        sub="Kelas 2B · wali kelas Bu Rina"
        onTutup={onTutup}
      />

      <div className="rsatas">
        <PilStatus status={anak.status} />
        <HurufHeart heart={anak.heart} ukuran="md" />
      </div>

      {belum ? (
        <p className={terkirim?.kasus ? "reco bad" : "reco info"}>
          {terkirim
            ? terkirim.kasus
              ? `Formulir wali kelas terkirim hari ini. Jawaban Ya pada pertanyaan keamanan menjadi laporan ${terkirim.kasus}.`
              : "Formulir wali kelas terkirim hari ini. Hasil HEART keluar setelah isian orang tua masuk dan dianalisis tim ahli Fammi."
            : "Belum diskrining: formulir wali kelas belum diisi. Hasil HEART keluar setelah formulir Anda dan orang tua masuk."}
        </p>
      ) : (
        <section className="rsbagian" aria-label="Status per aspek">
          <h3 className="rslabel">Status per aspek</h3>
          <ul className="rsaspek">
            {HEART.map((a) => (
              <li key={a.id} className="rsbaris">
                <span className="rskode" aria-hidden="true">
                  {a.kode}
                </span>
                <span className="rsnama">{a.nama}</span>
                <PilStatus status={anak.heart[a.id]} kecil />
              </li>
            ))}
          </ul>
        </section>
      )}

      {(buddy || perluBuddy) && (
        <section className="rsbagian" aria-label="Buddy">
          <h3 className="rslabel">Buddy</h3>
          {buddy ? (
            <p className="rsteks">
              {sebagaiBuddy ? (
                <>
                  {"Menjadi buddy untuk "}
                  <b>{buddy.anak}</b>
                  {` sejak ${buddy.sejak}.`}
                </>
              ) : (
                <>
                  <b>{buddy.buddy}</b>
                  {` menemani sejak ${buddy.sejak} (${buddy.alasan}).`}
                </>
              )}
            </p>
          ) : (
            <p className="rsteks">Belum punya buddy. Calon disarankan sudah tersedia.</p>
          )}
        </section>
      )}

      {butir.length > 0 && (
        <section className="rsbagian" aria-label="Checklist Anda untuk anak ini">
          <h3 className="rslabel">Checklist Anda</h3>
          <ul className="rsceklis">
            {butir.map((c) => {
              const beres = Boolean(centang[c.id]);
              return (
                <li key={c.id} className={beres ? "beres" : undefined}>
                  <Ikon nama={beres ? "sukses" : "jam"} size={15} />
                  <span>
                    {c.judul}
                    <span className="mut">{` · ${beres ? "selesai" : c.waktu}`}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {catatan && (
        <section className="rsbagian" aria-label="Catatan observasi terakhir">
          <h3 className="rslabel">Catatan terakhir</h3>
          <p className="rsteks">
            <span className="mut">{`${catatan.tgl}: `}</span>
            {catatan.teks}
          </p>
        </section>
      )}

      <p className="rsraka">
        <Ikon nama="info" size={15} />
        <span>
          Laporan HEART lengkap (skor, indikator, faktor pendukung, dan saran) dalam demo ini tersedia untuk Raka Pratama.{" "}
          <button type="button" className="rstautan" onClick={onRaka}>
            Buka laporan Raka
          </button>
        </span>
      </p>

      <div className="dacts">
        <button type="button" className="ghost" onClick={onObs}>
          <Ikon nama="pena" size={16} />
          Catat observasi
        </button>
        {belum && !terkirim && (
          <button type="button" className="btnp" onClick={onIsi}>
            Isi skrining
          </button>
        )}
        {perluBuddy && (
          <button type="button" className="btnp" onClick={onBuddy}>
            Tetapkan buddy
          </button>
        )}
      </div>
    </Laci>
  );
}

// ── Tetapkan buddy ─────────────────────────────────────────────────────────────────────────────

/** data: satu baris BELUM_BUDDY_2B ({ anak, alasan, calon }). onTetapkan(nama calon). */
export function LaciBuddy({ data, onTetapkan, onTutup }) {
  const [pilih, setPilih] = useState(data.calon[0]);
  const anak = cariAnak(data.anak);
  const nada = metaStatus(statusAlasan(data.alasan)).nada;

  return (
    <Laci label={`Tetapkan buddy untuk ${data.anak}`} labelTutup="Tutup pilihan buddy" onTutup={onTutup} lebar={440}>
      <KepalaLaci
        awal={<span className={`pkav besar ${kelasStatus(anak?.status)}`}>{anak?.inisial}</span>}
        judul={`Buddy untuk ${namaDepan(data.anak)}`}
        sub={data.anak}
        onTutup={onTutup}
      />
      <p className="bdalasan">
        <span className={`pill sm ${nada}`}>{data.alasan}</span>
      </p>
      <p className="reco info">
        Buddy adalah teman sekelas yang menemani saat kerja kelompok dan istirahat. Pilih teman yang duduk dekat dan sabar;
        Bu Laras melihat pasangan ini di peta dukungan.
      </p>
      <fieldset className="bdpilih">
        <legend className="flabel">Calon yang disarankan</legend>
        {data.calon.map((nama) => {
          const calon = cariAnak(nama);
          return (
            <label key={nama} className={`bdopsi${pilih === nama ? " on" : ""}`}>
              <input type="radio" name="rk-calon-buddy" value={nama} checked={pilih === nama} onChange={() => setPilih(nama)} />
              <span className={`pkav ${kelasStatus(calon?.status)}`} aria-hidden="true">
                {calon?.inisial}
              </span>
              <span className="bdopsinama">{nama}</span>
              <HurufHeart heart={calon?.heart || null} />
            </label>
          );
        })}
      </fieldset>
      <div className="dacts">
        <button type="button" className="ghost" onClick={onTutup}>
          Batal
        </button>
        <button type="button" className="btnp" onClick={() => onTetapkan(pilih)}>
          {`Tetapkan ${namaDepan(pilih)} sebagai buddy`}
        </button>
      </div>
    </Laci>
  );
}

// ── Catat observasi ────────────────────────────────────────────────────────────────────────────

/** anakAwal: anak yang terpilih saat laci dibuka. daftarAnak: nama seluruh kelas. onSimpan(isian). */
export function LaciObservasi({ anakAwal, daftarAnak, onSimpan, onTutup }) {
  const [anak, setAnak] = useState(anakAwal);
  const [aspek, setAspek] = useState({});
  const [membaik, setMembaik] = useState(false);
  const [teks, setTeks] = useState("");
  const [bk, setBk] = useState(false);

  function simpan() {
    onSimpan({
      anak,
      aspek: HEART.filter((a) => aspek[a.id]).map((a) => a.id),
      membaik,
      teks: teks.trim() || "Catatan singkat tanpa keterangan tambahan.",
      bk,
    });
  }

  return (
    <Laci label="Catat observasi" labelTutup="Tutup catatan" onTutup={onTutup} lebar={520}>
      <KepalaLaci
        awal={
          <div className="tile p">
            <Ikon nama="pena" size={20} />
          </div>
        }
        judul="Catat observasi"
        sub={`${HARI_DEMO.label} 2026 · tulis yang Anda lihat, bukan dugaan`}
        onTutup={onTutup}
      />
      <div className="fld">
        <label className="flabel" htmlFor="rk-obs-anak">
          Anak
        </label>
        <select id="rk-obs-anak" className="inp" value={anak} onChange={(e) => setAnak(e.target.value)}>
          {daftarAnak.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="fld">
        <span className="flabel" id="rk-obs-aspek">
          Aspek HEART yang terlihat
        </span>
        <div className="chips" role="group" aria-labelledby="rk-obs-aspek">
          {HEART.map((a) => {
            const aktif = Boolean(aspek[a.id]);
            return (
              <button
                key={a.id}
                type="button"
                className={`chip${aktif ? " on" : ""}`}
                aria-pressed={aktif}
                onClick={() => setAspek((x) => ({ ...x, [a.id]: !x[a.id] }))}
              >
                {a.nama}
              </button>
            );
          })}
          <button type="button" className={`chip${membaik ? " on" : ""}`} aria-pressed={membaik} onClick={() => setMembaik((m) => !m)}>
            Membaik
          </button>
        </div>
      </div>
      <div className="fld">
        <label className="flabel" htmlFor="rk-obs-teks">
          Catatan
        </label>
        <textarea
          id="rk-obs-teks"
          className="inp"
          rows={4}
          placeholder="Contoh: saat istirahat bermain sendiri di dekat perpustakaan, menolak diajak ke kantin."
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
        />
      </div>
      <label className="chk">
        <input type="checkbox" checked={bk} onChange={() => setBk((b) => !b)} />
        <span>
          Perlu dibahas dengan Guru BK
          <span className="mut">Bu Laras menerima notifikasi dan bisa langsung menambah tindak lanjut.</span>
        </span>
      </label>
      <div className="dacts">
        <button type="button" className="ghost" onClick={onTutup}>
          Batal
        </button>
        <button type="button" className="btnp" onClick={simpan}>
          Simpan catatan
        </button>
      </div>
    </Laci>
  );
}

/** Label penanda alur checklist, untuk dipakai ulang di layar. */
export function PenandaAlur({ alur }) {
  const nada = alur === "kejadian" ? "bad" : alur === "cegah" ? "mid" : "gray";
  return <span className={`pill sm ${nada}`}>{LABEL_ALUR[alur]}</span>;
}

/** Huruf satu aspek HEART berwarna status anak untuk aspek itu (dipakai di daftar checklist). */
export function HurufAspek({ idAspek, status }) {
  const aspek = cariAspek(idAspek);
  if (!aspek) return null;
  const meta = metaStatus(status);
  return (
    <span className={`ckhuruf ${meta.id}`} title={`${aspek.nama}: ${meta.label}`}>
      <span aria-hidden="true">{aspek.kode}</span>
      <span className="sr">{`${aspek.nama} ${meta.label}`}</span>
    </span>
  );
}

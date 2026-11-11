import { useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaLaci, Laci, Segmen } from "../komponen";
import { inisial } from "../alat";
import { HurufHeart, PilStatus } from "../bersama/HeartKecil";
import { HEART } from "../bersama/heart";
import { BELUM_BUDDY_2B, BUDDY_2B } from "../bersama/dukungan";
import { PEMILIK, checklistAnak } from "../bersama/tindakLanjut";
import {
  BUTIR_HEART,
  EVALUASI,
  JAWABAN_HEART,
  JAWABAN_KEAMANAN,
  PENDUKUNG,
  PERTANYAAN_KEAMANAN,
  SUB_FORMULIR,
  VERSI,
  WALI,
  aspekMenonjol,
  bacaHeart,
  usulanAnak,
} from "./skriningData";

/**
 * Laci layar Skrining HEART:
 *   LaciFormulir       isi formulir versi orang tua dan wali kelas (HEART, isian pendukung,
 *                      pertanyaan keamanan)
 *   LaciTindakLanjut   Guru BK menyusun tindak lanjut anak Waspada: butir checklist per aspek,
 *                      buddy, tanggal evaluasi
 *   LaciRingkasan      ringkasan satu anak (selain Raka, yang punya laporan lengkap)
 */

/** "Wali kelas · Pak Fajar", "Guru BK · Bu Laras", "Orang tua", "Guru piket · Pak Joko". */
function labelPemilik(oleh, wali) {
  const p = PEMILIK[oleh];
  const orang = oleh === "walas" ? wali : oleh === "ortu" ? null : p.orang;
  return orang ? `${p.label} · ${orang}` : p.label;
}

/** Avatar inisial di kepala laci anak. */
function AvatarAnak({ nama }) {
  return (
    <span className="av avbesar" aria-hidden="true">
      {inisial(nama)}
    </span>
  );
}

/** Huruf HEART besar + nama aspek yang tidak Baik dengan pil statusnya. */
function HasilSingkat({ kode }) {
  const menonjol = aspekMenonjol(kode);
  return (
    <div className="hasilbaris">
      <HurufHeart heart={bacaHeart(kode)} ukuran="md" />
      <span className="hasilaspek">
        {menonjol.map(({ aspek, status }) => (
          <span key={aspek.id} className="hasilitem">
            {aspek.nama}
            <PilStatus status={status} kecil />
          </span>
        ))}
      </span>
    </div>
  );
}

export function LaciFormulir({ onTutup }) {
  const [versi, setVersi] = useState("ot");
  const pendukung = PENDUKUNG[versi];
  const jumlahHeart = HEART.length * 5;

  return (
    <Laci label="Formulir skrining HEART" labelTutup="Tutup formulir" onTutup={onTutup}>
      <KepalaLaci
        awal={
          <div className="tile p">
            <Ikon nama="skrining" size={22} />
          </div>
        }
        judul="Formulir skrining HEART"
        sub={SUB_FORMULIR[versi]}
        onTutup={onTutup}
      />
      <Segmen label="Versi formulir" pilihan={VERSI} nilai={versi} onPilih={setVersi} className="fseg" />
      <p className="skala">
        <b>Pilihan jawaban:</b>
        {JAWABAN_HEART.map((j) => (
          <span key={j} className="pill sm gray">
            {j}
          </span>
        ))}
        <span className="mut">Label abu-abu di tiap butir = indikator yang dinilainya di laporan anak.</span>
      </p>

      {HEART.map((a, i) => (
        <section key={a.id} className="fgroup" aria-label={`Aspek ${a.nama}`}>
          <div className="fgh">
            <span className="akode" aria-hidden="true">
              {a.kode}
            </span>
            <span className="fgt">
              <b>{a.nama}</b>
              <span className="mut">{a.dinilai}</span>
            </span>
            <span className="fgamb">
              <span>{`Perlu Perhatian mulai ${a.ambang.perhatian}`}</span>
              <span>{`Waspada mulai ${a.ambang.waspada}`}</span>
            </span>
          </div>
          <ol className="items" start={i * 5 + 1}>
            {BUTIR_HEART[a.id].map((b, j) => (
              <li key={b}>
                <span>{b}</span>
                <span className="indik">{a.indikator[j]}</span>
              </li>
            ))}
          </ol>
          {a.id === "tolong" ? (
            <p className="reco info">
              Lima butir ini kekuatan anak. Saat diolah skornya dibalik, jadi seperti aspek lain, skor tinggi berarti perlu
              perhatian.
            </p>
          ) : null}
        </section>
      ))}

      <section className="fgroup" aria-label={pendukung.judul}>
        <div className="fgh">
          <span className="akode netral" aria-hidden="true">
            <Ikon nama="orang" size={16} />
          </span>
          <span className="fgt">
            <b>{pendukung.judul}</b>
            <span className="mut">Isian singkat, tidak diskor. Mengisi faktor pendukung dan peta dukungan di laporan anak.</span>
          </span>
        </div>
        <ul className="items titik">
          {pendukung.butir.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </section>

      <section className="fgroup bahaya" aria-label="Pertanyaan keamanan">
        <div className="fgh">
          <span className="akode merah" aria-hidden="true">
            <Ikon nama="peringatan" size={16} />
          </span>
          <span className="fgt">
            <b>Pertanyaan keamanan</b>
            <span className="mut">Jawaban: {JAWABAN_KEAMANAN.join(", ")}</span>
          </span>
          <span className="pill sm crit">Di luar HEART</span>
        </div>
        <ol className="items" start={jumlahHeart + 1}>
          {PERTANYAAN_KEAMANAN.map((b) => (
            <li key={b}>
              <span>{b}</span>
            </li>
          ))}
        </ol>
        <p className="reco bad">
          Jawaban Ya langsung menjadi laporan kejadian: masuk triage di alur kejadian dan Koordinator BK diberi tahu. Jawaban
          Tidak yakin diteruskan ke Guru BK untuk ditanyakan ulang dalam 1 hari kerja.
        </p>
      </section>

      <p className="dfoot">
        Susunan butir di prototipe ini contoh. Isi dan ambang final mengikuti instrumen yang divalidasi tim psikolog Fammi.
      </p>
    </Laci>
  );
}

/**
 * Guru BK menyusun tindak lanjut satu anak Waspada. Usulan butir diambil dari aspek yang tidak Baik
 * (Waspada lebih dulu); isian mulai dari usulan setiap kali laci dibuka (komponen dipasang ulang).
 */
export function LaciTindakLanjut({ anak, onTutup, onSimpan }) {
  const usulan = usulanAnak(anak.heart);
  const wali = WALI[anak.kelas];
  const buddyTetap = anak.tindak.buddy || null;
  const [mati, setMati] = useState({});
  const [buddy, setBuddy] = useState("");
  const [evaluasi, setEvaluasi] = useState("4");
  const [kirimOrtu, setKirimOrtu] = useState(true);
  const dipilih = usulan.filter((u) => !mati[u.id]);
  const bisaSimpan = dipilih.length > 0;

  function simpan() {
    if (!bisaSimpan) return;
    onSimpan(anak, {
      butir: dipilih.map((u) => ({ ...u, label: labelPemilik(u.oleh, wali) })),
      buddy: buddyTetap || buddy || null,
      evaluasi: EVALUASI.find((e) => e.id === evaluasi),
      kirimOrtu,
    });
  }

  return (
    <Laci label={`Susun tindak lanjut ${anak.nama}`} labelTutup="Tutup tindak lanjut" onTutup={onTutup}>
      <KepalaLaci
        awal={<AvatarAnak nama={anak.nama} />}
        judul="Susun tindak lanjut"
        sub={`${anak.nama} · Kelas ${anak.kelas} · wali kelas ${wali}`}
        onTutup={onTutup}
      />
      <HasilSingkat kode={anak.heart} />
      <p className="reco info">
        Butir di bawah usulan dari hasil HEART. Hapus centang yang tidak sesuai, lalu simpan. Tiap butir masuk checklist
        pemiliknya dan dievaluasi bersama orang tua.
      </p>

      {aspekMenonjol(anak.heart).map(({ aspek, status }) => (
        <fieldset key={aspek.id} className="fset">
          <legend className="flegend">
            <span className="akode kecil" aria-hidden="true">
              {aspek.kode}
            </span>
            {aspek.nama}
            <PilStatus status={status} kecil />
          </legend>
          {usulan
            .filter((u) => u.aspek === aspek.id)
            .map((u) => (
              <label key={u.id} className="chk usul">
                <input
                  type="checkbox"
                  checked={!mati[u.id]}
                  onChange={() => setMati((m) => ({ ...m, [u.id]: !m[u.id] }))}
                />
                <span className="usulteks">{u.teks}</span>
                <span className="oleh">{labelPemilik(u.oleh, wali)}</span>
              </label>
            ))}
        </fieldset>
      ))}

      <div className="row2f">
        <div className="fld">
          {buddyTetap ? (
            <>
              <span className="flabel">Buddy</span>
              <p className="statis">
                {buddyTetap}, ditetapkan wali kelas {anak.tindak.sejak}
              </p>
            </>
          ) : (
            <>
              <label className="flabel" htmlFor="skrining-buddy">
                Buddy (opsional)
              </label>
              <select id="skrining-buddy" className="inp" value={buddy} onChange={(e) => setBuddy(e.target.value)}>
                <option value="">Belum ditetapkan</option>
                {(anak.calonBuddy || []).map((n) => (
                  <option key={n} value={n}>
                    {`${n} (usulan wali kelas)`}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        <div className="fld">
          <label className="flabel" htmlFor="skrining-evaluasi">
            Evaluasi bersama orang tua
          </label>
          <select id="skrining-evaluasi" className="inp" value={evaluasi} onChange={(e) => setEvaluasi(e.target.value)}>
            {EVALUASI.map((e) => (
              <option key={e.id} value={e.id}>
                {`${e.label}, ${e.tanggal}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="chk">
        <input type="checkbox" checked={kirimOrtu} onChange={() => setKirimOrtu((v) => !v)} />
        <span>
          Kirim butir untuk rumah ke orang tua lewat aplikasi Fammi
          <span className="mut">Orang tua melihat butir miliknya dan tanggal evaluasi, tanpa label diagnosis.</span>
        </span>
      </label>

      <div className="dacts">
        <span className="dhitung" aria-live="polite">
          {dipilih.length} butir dipilih
        </span>
        <button type="button" className="ghost" onClick={onTutup}>
          Batal
        </button>
        <button
          type="button"
          className={`btnp${bisaSimpan ? "" : " off"}`}
          aria-disabled={bisaSimpan ? undefined : "true"}
          onClick={simpan}
        >
          Simpan tindak lanjut
        </button>
      </div>
    </Laci>
  );
}

/** Satu butir rencana: tanda selesai (bila ada), teks, pemilik dan waktu. */
function ButirRencana({ teks, ket, selesai }) {
  return (
    <li className="rbutir">
      {selesai == null ? (
        <span className="cek titik" aria-hidden="true" />
      ) : (
        <span className={`cek${selesai ? " on" : ""}`} aria-hidden="true">
          {selesai ? <Ikon nama="centang" size={12} /> : null}
        </span>
      )}
      <span>
        {teks}
        {selesai != null ? <span className="sr">{selesai ? ", selesai" : ", belum"}</span> : null}
        <span className="mut">{ket}</span>
      </span>
    </li>
  );
}

/**
 * Ringkasan satu anak: hasil HEART per aspek dan tindak lanjutnya. Untuk anak kelas 2B, checklist
 * dan buddy dibaca dari data bersama (centang hidup dari konteks), jadi sama dengan Ruang wali kelas.
 * `disusun` = tindak lanjut yang baru disimpan di layar ini, atau null.
 */
export function LaciRingkasan({ anak, disusun, onTutup }) {
  const { centang } = useProteksi();
  const heart = bacaHeart(anak.heart);
  const waspada = Boolean(anak.tindak);
  const wali = WALI[anak.kelas];
  const pasangan = BUDDY_2B.find((b) => b.anak === anak.nama);
  const calon = BELUM_BUDDY_2B.find((b) => b.anak === anak.nama);
  const checklist = checklistAnak(anak.nama);

  let isi;
  if (disusun) {
    isi = (
      <>
        <p className="lket">
          Disusun hari ini oleh Bu Laras · evaluasi {disusun.evaluasi.tanggal}
          {disusun.buddy ? ` · buddy ${disusun.buddy}` : ""}
        </p>
        <ul className="rlist">
          {disusun.butir.map((b) => (
            <ButirRencana key={b.id} teks={b.teks} ket={b.label} />
          ))}
        </ul>
      </>
    );
  } else if (waspada && checklist.length) {
    isi = (
      <>
        <p className="lket">
          Tindak lanjut berjalan · evaluasi {anak.tindak.evaluasi}
          {pasangan ? ` · buddy ${pasangan.buddy} sejak ${pasangan.sejak}` : ""}
        </p>
        <ul className="rlist">
          {checklist.map((c) => (
            <ButirRencana
              key={c.id}
              teks={c.judul}
              ket={`${labelPemilik(c.oleh, wali)} · ${c.waktu}`}
              selesai={Boolean(centang[c.id])}
            />
          ))}
        </ul>
      </>
    );
  } else if (waspada) {
    isi = (
      <>
        <p className="lket">
          Tindak lanjut berjalan · evaluasi {anak.tindak.evaluasi}
          {anak.tindak.buddy ? ` · buddy ${anak.tindak.buddy}` : ""}
        </p>
        <ul className="rlist">
          {usulanAnak(anak.heart)
            .slice(0, 3)
            .map((u) => (
              <ButirRencana key={u.id} teks={u.teks} ket={labelPemilik(u.oleh, wali)} />
            ))}
        </ul>
      </>
    );
  } else {
    isi = (
      <>
        <p className="lket">
          Observasi oleh {wali} · minggu {anak.minggu} dari 4
        </p>
        <span className="rbar obs" aria-hidden="true">
          <span style={{ width: `${anak.minggu * 25}%` }} />
        </span>
        <blockquote className="kutip">
          <span className="mut">Catatan terakhir wali kelas</span>
          {anak.catatan}
        </blockquote>
        {pasangan ? (
          <p className="lket">
            Buddy: {pasangan.buddy}, sejak {pasangan.sejak}
          </p>
        ) : null}
        {calon ? <p className="lket">Buddy belum ditetapkan. Usulan wali kelas: {calon.calon.join(" atau ")}.</p> : null}
        {checklist.length ? (
          <ul className="rlist">
            {checklist.map((c) => (
              <ButirRencana
                key={c.id}
                teks={c.judul}
                ket={`${labelPemilik(c.oleh, wali)} · ${c.waktu}`}
                selesai={Boolean(centang[c.id])}
              />
            ))}
          </ul>
        ) : null}
        <p className="dfoot">Bila 4 minggu belum membaik, Guru BK menyusun tindak lanjut bersama wali kelas dan orang tua.</p>
      </>
    );
  }

  return (
    <Laci label={`Ringkasan ${anak.nama}`} labelTutup="Tutup ringkasan" onTutup={onTutup} lebar={480}>
      <KepalaLaci
        awal={<AvatarAnak nama={anak.nama} />}
        judul={anak.nama}
        sub={`Kelas ${anak.kelas} · wali kelas ${wali}`}
        onTutup={onTutup}
      />
      <div className="hasilbaris">
        <HurufHeart heart={heart} ukuran="md" />
        <PilStatus status={waspada ? "waspada" : "perhatian"} />
      </div>
      <ul className="asplist2" aria-label="Hasil per aspek HEART">
        {HEART.map((a) => (
          <li key={a.id}>
            <span className="akode kecil" aria-hidden="true">
              {a.kode}
            </span>
            <span className="anama">{a.nama}</span>
            <PilStatus status={heart[a.id]} kecil />
          </li>
        ))}
      </ul>
      <h3 className="lsub">Tindak lanjut</h3>
      {isi}
    </Laci>
  );
}

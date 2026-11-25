import { useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaLaci, Laci, Segmen } from "../komponen";
import { inisial } from "../alat";
import { HurufHeart, PilStatus } from "../bersama/HeartKecil";
import { HEART, RINGKAS_SEKOLAH } from "../bersama/heart";
import { BELUM_BUDDY_2B, BUDDY_2B } from "../bersama/dukungan";
import { PEMILIK, checklistAnak } from "../bersama/tindakLanjut";
import FormTindakLanjut from "../bersama/FormTindakLanjut";
import { ORANG } from "../layarProteksi";
import {
  ASPEK_TERATAS,
  BUTIR_HEART,
  EVALUASI,
  HASIL_KELAS,
  JAWABAN_HEART,
  JAWABAN_KEAMANAN,
  KELAS,
  KELAS_WALAS_BELUM,
  PENDUKUNG,
  PERTANYAAN_KEAMANAN,
  SUB_FORMULIR,
  TOTAL,
  VERSI,
  WALI,
  aspekMenonjol,
  bacaHeart,
  usulanAnak,
} from "./skriningData";

/**
 * Laci layar Skrining HEART. Halaman utama hanya memuat yang mendesak dan ringkasan; rinciannya di
 * sini:
 *   LaciKemajuan       pengisian formulir per kelas, plus tombol pengingat
 *   LaciSebaran        hasil per aspek HEART dan per kelas
 *   LaciDaftar         daftar lengkap anak (Waspada, Perlu Perhatian, tanda bahaya)
 *   LaciFormulir       isi formulir versi orang tua dan wali kelas
 *   LaciTindakLanjut   Guru BK menyusun tindak lanjut anak Waspada
 *   LaciRingkasan      ringkasan satu anak (selain Raka, yang punya laporan lengkap)
 * BarisAnak dipakai bersama daftar di halaman utama dan di LaciDaftar.
 */

const persen = (n, dari) => `${Math.round((n / dari) * 100)}%`;

/** "Wali kelas · Pak Fajar", "Guru BK · Bu Laras", "Orang tua", "Guru piket · Pak Joko". */
function labelPemilik(oleh, wali) {
  const p = PEMILIK[oleh];
  const orang = oleh === "walas" ? wali : oleh === "ortu" ? null : p.orang;
  return orang ? `${p.label} · ${orang}` : p.label;
}

/** Ubin ikon di kepala laci. */
function UbinLaci({ ikon }) {
  return (
    <div className="tile p">
      <Ikon nama={ikon} size={20} />
    </div>
  );
}

/** Avatar inisial di kepala laci anak. */
function AvatarAnak({ nama }) {
  return (
    <span className="av avbesar" aria-hidden="true">
      {inisial(nama)}
    </span>
  );
}

/** Aspek yang tidak Baik, dipisah koma; yang Waspada ditebalkan. */
export function AspekMenonjol({ kode }) {
  return aspekMenonjol(kode).map((x, i) => (
    <span key={x.aspek.id}>
      {i > 0 ? ", " : ""}
      {x.status === "waspada" ? <b>{x.aspek.nama}</b> : x.aspek.nama}
    </span>
  ));
}

/**
 * Satu baris anak: nama dan kelas, keterangan, lalu satu tombol. `r` = { nama, kelas, heart, ket,
 * status, aksi }. `ringkas` (halaman utama) tanpa huruf HEART dan baris status. Tombolnya tetap
 * elemen yang sama saat labelnya berganti, supaya laci bisa mengembalikan fokus ke baris itu.
 */
export function BarisAnak({ r, ringkas = false }) {
  return (
    <li className={`anak${ringkas ? " ringkas" : ""}`}>
      <span className="av" aria-hidden="true">
        {inisial(r.nama)}
      </span>
      <span className="anaknama">
        <b>{r.nama}</b>
        <span className="mut">{` · ${r.kelas}`}</span>
      </span>
      <span className="anakket">
        {!ringkas && r.heart ? <HurufHeart heart={bacaHeart(r.heart)} /> : null}
        <span>{r.ket}</span>
      </span>
      {!ringkas && r.status ? <span className="anakstatus">{r.status}</span> : null}
      <button
        type="button"
        className={`abtn anakaksi${r.aksi.utama ? " utama" : ""}`}
        aria-label={`${r.aksi.label} ${r.aksi.label2}`}
        aria-haspopup={r.aksi.dialog ? "dialog" : undefined}
        onClick={r.aksi.onClick}
      >
        {r.aksi.ikon ? <Ikon nama={r.aksi.ikon} size={16} /> : null}
        {r.aksi.label}
      </button>
    </li>
  );
}

// ── Kemajuan pengisian ──────────────────────────────────────────────────────────────────────────

/** Batang kecil + angka "n / dari". `label` hanya tampil di layar sempit, saat kepala tabel disembunyikan. */
function Progres({ nilai, dari, nada, label }) {
  return (
    <span className="pcell">
      <span className="hp" aria-hidden="true">
        {label}
      </span>
      <span className="prog" aria-hidden="true">
        <span className={`progf ${nada}`} style={{ width: persen(nilai, dari) }} />
      </span>
      <span className={nilai < dari && nada === "warn" ? "o" : undefined}>{`${nilai} / ${dari}`}</span>
    </span>
  );
}

/**
 * Pengisian formulir per kelas. Status pengingat dipegang layar (`diingatkan` per kelas,
 * `semuaDiingatkan`, `walasDiingatkan`), jadi tetap sama saat laci ditutup lalu dibuka lagi.
 */
export function LaciKemajuan({ diingatkan, semuaDiingatkan, walasDiingatkan, onIngatkanSemua, onIngatkanKelas, onIngatkanWalas, onTutup }) {
  return (
    <Laci label="Kemajuan screening per kelas" labelTutup="Tutup kemajuan screening" onTutup={onTutup}>
      <KepalaLaci
        awal={<UbinLaci ikon="baris" />}
        judul="Kemajuan screening"
        sub="Batas Jumat, 13 Nov · 2 hari lagi"
        onTutup={onTutup}
      />
      <div className="ringkas2">
        <div className="rblok">
          <span className="rtop">
            <span className="rlabel">Formulir wali kelas</span>
            <span className="rnilai">
              {TOTAL.walas}
              <small>{` dari ${TOTAL.anak}`}</small>
            </span>
          </span>
          <span className="rbar" aria-hidden="true">
            <span className="pu" style={{ width: persen(TOTAL.walas, TOTAL.anak) }} />
          </span>
          {walasDiingatkan ? (
            <span className="rsub">Pengingat terkirim 10.31</span>
          ) : (
            <button type="button" className="abtn kecil" onClick={onIngatkanWalas}>
              <Ikon nama="kirim" size={14} />
              {`Ingatkan ${KELAS_WALAS_BELUM.length} wali kelas`}
            </button>
          )}
        </div>
        <div className="rblok">
          <span className="rtop">
            <span className="rlabel">Formulir orang tua</span>
            <span className="rnilai">
              {TOTAL.ortu}
              <small>{` dari ${TOTAL.anak}`}</small>
            </span>
          </span>
          <span className="rbar" aria-hidden="true">
            <span className="or" style={{ width: persen(TOTAL.ortu, TOTAL.anak) }} />
          </span>
          {semuaDiingatkan ? (
            <span className="rsub">Pengingat ketiga terkirim 10.31</span>
          ) : (
            <button type="button" className="abtn kecil" onClick={onIngatkanSemua}>
              <Ikon nama="kirim" size={14} />
              {`Ingatkan ${TOTAL.belumOrtu} orang tua`}
            </button>
          )}
        </div>
      </div>

      <div className="tbox">
        <table className="tbl tumpukp">
          <thead>
            <tr>
              <th>Kelas</th>
              <th>Wali kelas</th>
              <th>Orang tua</th>
              <th>
                <span className="sr">Pengingat orang tua</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {KELAS.map((k) => {
              const belum = k.anak - k.ortu;
              return (
                <tr key={k.kelas}>
                  <td>
                    <span className="kls">
                      <b>{k.kelas}</b>
                      <span className="mut">{k.wali}</span>
                    </span>
                  </td>
                  <td>
                    <Progres nilai={k.walas} dari={k.anak} nada={k.walas < k.anak ? "warn" : "ok"} label="Wali kelas" />
                  </td>
                  <td>
                    <Progres nilai={k.ortu} dari={k.anak} nada={k.ortu / k.anak < 0.85 ? "warn" : "mid"} label="Orang tua" />
                  </td>
                  <td>
                    {diingatkan[k.kelas] || semuaDiingatkan ? (
                      <span className="pill sm ok">Terkirim</span>
                    ) : (
                      <button
                        type="button"
                        className="abtn kecil"
                        aria-label={`Kirim pengingat WhatsApp ke ${belum} orang tua kelas ${k.kelas}`}
                        onClick={() => onIngatkanKelas(k)}
                      >
                        {`Ingatkan ${belum}`}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="dfoot">Anak terhitung sudah ikut screening begitu formulir wali kelasnya masuk.</p>
    </Laci>
  );
}

// ── Sebaran hasil ───────────────────────────────────────────────────────────────────────────────

const TAB_SEBARAN = [
  { id: "aspek", label: "Per aspek" },
  { id: "kelas", label: "Per kelas" },
];

/** Sebaran hasil: batang per aspek HEART, atau tabel jumlah anak per kelas dan aspek. */
export function LaciSebaran({ onTutup }) {
  const [tab, setTab] = useState("aspek");
  return (
    <Laci label="Sebaran hasil screening" labelTutup="Tutup sebaran hasil" onTutup={onTutup}>
      <KepalaLaci
        awal={<UbinLaci ikon="hati" />}
        judul="Sebaran hasil"
        sub={`${RINGKAS_SEKOLAH.terpetakan} anak sudah ikut screening`}
        onTutup={onTutup}
      />
      <Segmen label="Tampilan sebaran" pilihan={TAB_SEBARAN} nilai={tab} onPilih={setTab} className="fseg" />

      {tab === "aspek" ? (
        <>
          <span className="legenda" aria-hidden="true">
            <span>
              <i className="lg ok" />
              Aman
            </span>
            <span>
              <i className="lg warn" />
              Perlu Diperhatikan
            </span>
            <span>
              <i className="lg bad" />
              Perlu Perhatian Lebih
            </span>
          </span>
          <ul className="asplist">
            {HEART.map((a) => {
              const x = RINGKAS_SEKOLAH.perAspek[a.id];
              const jumlah = x.baik + x.perhatian + x.waspada;
              return (
                <li key={a.id} className="asprow">
                  <span className="akode" aria-hidden="true">
                    {a.kode}
                  </span>
                  <span className="anama">{a.nama}</span>
                  <span
                    className="abar"
                    role="img"
                    aria-label={`${a.nama}: ${x.baik} Aman, ${x.perhatian} Perlu Diperhatikan, ${x.waspada} Perlu Perhatian Lebih`}
                  >
                    {["baik", "perhatian", "waspada"].map((s, i) =>
                      x[s] > 0 ? (
                        <span key={s} className={["ok", "warn", "bad"][i]} style={{ width: persen(x[s], jumlah) }} />
                      ) : null,
                    )}
                  </span>
                  <span className="anums" aria-hidden="true">
                    <span className="anum ok">{x.baik}</span>
                    <span className="anum warn">{x.perhatian}</span>
                    <span className="anum bad">{x.waspada}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="reco info">
            {`Terbanyak di ${ASPEK_TERATAS.map((t) => `${t.aspek.nama} (${t.n} anak)`).join(" dan ")}. Bisa jadi tema kelas kesadaran bulan ini.`}
          </p>
        </>
      ) : (
        <>
          <div className="tbox">
            <table className="tbl rapat">
              <thead>
                <tr>
                  <th>Kelas</th>
                  {HEART.map((a) => (
                    <th key={a.id} className="hth">
                      <span className="hk" title={a.nama}>
                        {a.kode}
                      </span>
                      <span className="sr">{a.nama}</span>
                    </th>
                  ))}
                  <th>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {HASIL_KELAS.map((k) => (
                  <tr key={k.kelas}>
                    <td>
                      <b>{k.kelas}</b>
                    </td>
                    {k.perAspek.map((x) => (
                      <td key={x.aspek.id} className="hcel">
                        <span className={`hc l${Math.min(x.ditandai, 3)}`}>
                          {x.ditandai}
                          {x.waspada > 0 ? <span className="hcw" aria-hidden="true" /> : null}
                          <span className="sr">{` anak, ${x.ditandai - x.waspada} Perlu Diperhatikan, ${x.waspada} Perlu Perhatian Lebih`}</span>
                        </span>
                      </td>
                    ))}
                    <td>
                      <b>{k.jumlah}</b>
                      <span className="mut">
                        <span className="pisah"> · </span>
                        {`${k.waspada} Perlu Perhatian Lebih`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="dfoot">
            {`Angka: anak Perlu Diperhatikan atau Perlu Perhatian Lebih. Titik merah: ada yang Perlu Perhatian Lebih. Kelas ${KELAS_WALAS_BELUM.map((k) => k.kelas).join(", ")} belum lengkap.`}
          </p>
        </>
      )}
    </Laci>
  );
}

// ── Daftar lengkap ──────────────────────────────────────────────────────────────────────────────

const BARIS_AWAL = 8;

/**
 * Daftar lengkap anak. Kelompok yang dipilih dan "tampilkan semua" dipegang layar, jadi tetap sama
 * sesudah laci anak di atasnya ditutup. `baris` = baris kelompok terpilih (bentuk BarisAnak).
 */
export function LaciDaftar({ pilihan, kelompok, onPilih, pengantar, baris, semua, onSemua, onTutup }) {
  const tampil = semua ? baris : baris.slice(0, BARIS_AWAL);
  return (
    <Laci label="Daftar anak hasil screening" labelTutup="Tutup daftar anak" onTutup={onTutup}>
      <KepalaLaci
        awal={<UbinLaci ikon="kelompok" />}
        judul="Daftar anak"
        sub={`${RINGKAS_SEKOLAH.baik} anak Aman ikut kelas kesadaran bersama wali kelasnya`}
        onTutup={onTutup}
      />
      <Segmen label="Kelompok anak" pilihan={pilihan} nilai={kelompok} onPilih={onPilih} className="fseg" />
      <p className="lket">{pengantar}</p>
      <ul className="anaklist">
        {tampil.map((r) => (
          <BarisAnak key={`${kelompok}:${r.nama}`} r={r} />
        ))}
      </ul>
      {baris.length > BARIS_AWAL ? (
        <button type="button" className="linkbtn" aria-expanded={semua} onClick={onSemua}>
          {semua ? "Tampilkan lebih sedikit" : `Tampilkan semua ${baris.length} anak`}
        </button>
      ) : null}
    </Laci>
  );
}

// ── Formulir ────────────────────────────────────────────────────────────────────────────────────

const BAGIAN_FORMULIR = [
  { id: "heart", label: "HEART" },
  { id: "pendukung", label: "Isian pendukung" },
  { id: "keamanan", label: "Keamanan" },
];

/** Isi formulir, dibagi tiga bagian. Tiap aspek HEART dilipat; buka untuk melihat lima butirnya. */
export function LaciFormulir({ onTutup }) {
  const [versi, setVersi] = useState("ot");
  const [bagian, setBagian] = useState("heart");
  const pendukung = PENDUKUNG[versi];
  const jumlahHeart = HEART.length * 5;

  return (
    <Laci label="Formulir screening HEART" labelTutup="Tutup formulir" onTutup={onTutup}>
      <KepalaLaci awal={<UbinLaci ikon="skrining" />} judul="Formulir screening HEART" sub={SUB_FORMULIR[versi]} onTutup={onTutup} />
      <div className="fbaris">
        <Segmen label="Versi formulir" pilihan={VERSI} nilai={versi} onPilih={setVersi} />
        <Segmen label="Bagian formulir" pilihan={BAGIAN_FORMULIR} nilai={bagian} onPilih={setBagian} />
      </div>

      {bagian === "heart" ? (
        <>
          <p className="skala">
            <b>Jawaban:</b>
            {JAWABAN_HEART.map((j) => (
              <span key={j} className="pill sm gray">
                {j}
              </span>
            ))}
            <span className="mut">Label abu-abu: indikator di laporan anak.</span>
          </p>
          {HEART.map((a, i) => (
            <details key={a.id} className="fgroup">
              <summary className="fgh">
                <span className="akode" aria-hidden="true">
                  {a.kode}
                </span>
                <span className="fgt">
                  <b>{a.nama}</b>
                  <span className="mut">{a.dinilai}</span>
                </span>
                <Ikon nama="turun" size={18} className="fpanah" />
              </summary>
              <ol className="items" start={i * 5 + 1}>
                {BUTIR_HEART[a.id].map((b, j) => (
                  <li key={b}>
                    <span>{b}</span>
                    <span className="indik">{a.indikator[j]}</span>
                  </li>
                ))}
              </ol>
              <p className="dfoot">
                {`Perlu Diperhatikan mulai skor ${a.ambang.perhatian}, Perlu Perhatian Lebih mulai ${a.ambang.waspada}.`}
                {a.id === "tolong" ? " Butir ini kekuatan anak, jadi skornya dibalik." : ""}
              </p>
            </details>
          ))}
        </>
      ) : null}

      {bagian === "pendukung" ? (
        <section className="fgroup buka" aria-label={pendukung.judul}>
          <div className="fgh">
            <span className="akode netral" aria-hidden="true">
              <Ikon nama="orang" size={16} />
            </span>
            <span className="fgt">
              <b>{pendukung.judul}</b>
              <span className="mut">Tidak diskor. Mengisi peta dukungan di laporan anak.</span>
            </span>
          </div>
          <ul className="items titik">
            {pendukung.butir.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {bagian === "keamanan" ? (
        <section className="fgroup buka bahaya" aria-label="Pertanyaan keamanan">
          <div className="fgh">
            <span className="akode merah" aria-hidden="true">
              <Ikon nama="peringatan" size={16} />
            </span>
            <span className="fgt">
              <b>Pertanyaan keamanan</b>
              <span className="mut">{`Jawaban: ${JAWABAN_KEAMANAN.join(", ")}. Di luar skor HEART.`}</span>
            </span>
          </div>
          <ol className="items" start={jumlahHeart + 1}>
            {PERTANYAAN_KEAMANAN.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ol>
          <p className="reco bad">
            Jawaban Ya langsung jadi laporan kejadian yang menunggu cek awal. Tidak yakin ditanyakan ulang Guru BK dalam 1 hari kerja.
          </p>
        </section>
      ) : null}

      <p className="dfoot">Butir contoh. Isi final mengikuti instrumen tim psikolog Fammi.</p>
    </Laci>
  );
}

// ── Tindak lanjut ───────────────────────────────────────────────────────────────────────────────

/** Huruf HEART besar + nama aspek yang tidak Baik dengan pil statusnya. */
function HasilSingkat({ kode }) {
  return (
    <div className="hasilbaris">
      <HurufHeart heart={bacaHeart(kode)} ukuran="md" />
      <span className="hasilaspek">
        {aspekMenonjol(kode).map(({ aspek, status }) => (
          <span key={aspek.id} className="hasilitem">
            {aspek.nama}
            <PilStatus status={status} kecil />
          </span>
        ))}
      </span>
    </div>
  );
}

/**
 * Guru BK menyusun tindak lanjut satu anak Waspada. Usulan butir diambil dari aspek yang tidak Baik
 * (Waspada lebih dulu); isian mulai dari usulan setiap kali laci dibuka (komponen dipasang ulang).
 */
export function LaciTindakLanjut({ anak, onTutup, onSimpan }) {
  const usulan = usulanAnak(anak.heart);
  const wali = WALI[anak.kelas];
  const pendampingTetap = anak.tindak.buddy || null;
  const [mati, setMati] = useState({});
  const [pendamping, setPendamping] = useState("");
  const [evaluasi, setEvaluasi] = useState("4");
  const [kirimOrtu, setKirimOrtu] = useState(true);
  // Tindak lanjut tambahan dari sekolah di samping rekomendasi Fammi.
  const [tambahan, setTambahan] = useState([]);
  const [formBuka, setFormBuka] = useState(false);
  const { peran } = useProteksi();
  const penambah = ORANG[peran]?.nama || "Guru BK";
  const dipilih = [
    ...usulan.filter((u) => !mati[u.id]),
    ...tambahan.map((t) => ({ id: t.id, aspek: t.aspek, teks: t.judul, oleh: t.oleh, sumber: t.sumber })),
  ];
  const bisaSimpan = dipilih.length > 0;

  function simpan() {
    if (!bisaSimpan) return;
    onSimpan(anak, {
      butir: dipilih.map((u) => ({ ...u, label: labelPemilik(u.oleh, wali) })),
      buddy: pendampingTetap || pendamping || null,
      evaluasi: EVALUASI.find((e) => e.id === evaluasi),
      kirimOrtu,
    });
  }

  return (
    <Laci label={`Susun tindak lanjut ${anak.nama}`} labelTutup="Tutup tindak lanjut" onTutup={onTutup}>
      <KepalaLaci
        awal={<AvatarAnak nama={anak.nama} />}
        judul="Susun tindak lanjut"
        sub={`${anak.nama} · Kelas ${anak.kelas} · ${wali}`}
        onTutup={onTutup}
      />
      <HasilSingkat kode={anak.heart} />
      <p className="lket">Rekomendasi Fammi dari hasil screening. Hapus centang yang tidak cocok, atau tambah sendiri di bawah.</p>

      {aspekMenonjol(anak.heart).map(({ aspek, status }) => (
        <fieldset key={aspek.id} className="fset">
          <legend className="flegend">
            {aspek.nama}
            <PilStatus status={status} kecil />
          </legend>
          {usulan
            .filter((u) => u.aspek === aspek.id)
            .map((u) => (
              <label key={u.id} className="chk usul">
                <input type="checkbox" checked={!mati[u.id]} onChange={() => setMati((m) => ({ ...m, [u.id]: !m[u.id] }))} />
                <span className="usulteks">{u.teks}</span>
                <span className="oleh">{labelPemilik(u.oleh, wali)}</span>
              </label>
            ))}
        </fieldset>
      ))}

      {tambahan.length > 0 && (
        <fieldset className="fset">
          <legend className="flegend">Ditambah sekolah</legend>
          {tambahan.map((t) => (
            <div key={t.id} className="chk usul">
              <span className="usulteks">{t.judul}</span>
              <span className="oleh">{`${labelPemilik(t.oleh, wali)} · ${t.waktu}`}</span>
              <button
                type="button"
                className="abtn"
                aria-label={`Hapus ${t.judul}`}
                onClick={() => setTambahan((d) => d.filter((x) => x.id !== t.id))}
              >
                Hapus
              </button>
            </div>
          ))}
        </fieldset>
      )}
      {formBuka ? (
        <FormTindakLanjut
          anak={anak.nama}
          aspekAwal={aspekMenonjol(anak.heart)[0]?.aspek.id}
          oleh={penambah}
          onTambah={(b) => {
            setTambahan((d) => [...d, b]);
            setFormBuka(false);
          }}
          onBatal={() => setFormBuka(false)}
        />
      ) : (
        <button type="button" className="ghost" onClick={() => setFormBuka(true)}>
          <Ikon nama="tambah" size={16} />
          Tambah tindak lanjut sendiri
        </button>
      )}

      <div className="row2f">
        <div className="fld">
          {pendampingTetap ? (
            <>
              <span className="flabel">Pendamping sebaya</span>
              <p className="statis">{`${pendampingTetap}, sejak ${anak.tindak.sejak}`}</p>
            </>
          ) : (
            <>
              <label className="flabel" htmlFor="skrining-pendamping">
                Pendamping sebaya (boleh kosong)
              </label>
              <select id="skrining-pendamping" className="inp" value={pendamping} onChange={(e) => setPendamping(e.target.value)}>
                <option value="">Belum dipilih</option>
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
          Kirim butir untuk rumah ke aplikasi orang tua
          <span className="mut">Tanpa label diagnosis.</span>
        </span>
      </label>

      <div className="dacts">
        <span className="dhitung" aria-live="polite">
          {dipilih.length} butir dipilih
        </span>
        <button type="button" className="ghost" onClick={onTutup}>
          Batal
        </button>
        <button type="button" className={`btnp${bisaSimpan ? "" : " off"}`} aria-disabled={bisaSimpan ? undefined : "true"} onClick={simpan}>
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

/** Daftar checklist bersama satu anak (centang hidup dari konteks). */
function DaftarChecklist({ checklist, wali, centang }) {
  return (
    <ul className="rlist">
      {checklist.map((c) => (
        <ButirRencana key={c.id} teks={c.judul} ket={`${labelPemilik(c.oleh, wali)} · ${c.waktu}`} selesai={Boolean(centang[c.id])} />
      ))}
    </ul>
  );
}

/**
 * Ringkasan satu anak: hasil HEART per aspek dan tindak lanjutnya. Untuk anak kelas 2B, checklist
 * dan pendamping sebaya dibaca dari data bersama (centang hidup dari konteks), jadi sama dengan Ruang
 * wali kelas. `disusun` = tindak lanjut yang baru disimpan di layar ini, atau null. `lebar` mengikuti
 * laci di bawahnya bila dibuka dari daftar anak.
 */
export function LaciRingkasan({ anak, disusun, onTutup, lebar = 480 }) {
  const { centang } = useProteksi();
  const heart = bacaHeart(anak.heart);
  const waspada = Boolean(anak.tindak);
  const wali = WALI[anak.kelas];
  const pasangan = BUDDY_2B.find((b) => b.anak === anak.nama);
  const calon = BELUM_BUDDY_2B.find((b) => b.anak === anak.nama);
  const checklist = checklistAnak(anak.nama);

  let ket;
  let isi;
  if (disusun) {
    ket = `Disusun hari ini oleh Bu Laras · evaluasi ${disusun.evaluasi.tanggal}${disusun.buddy ? ` · pendamping sebaya ${disusun.buddy}` : ""}`;
    isi = (
      <ul className="rlist">
        {disusun.butir.map((b) => (
          <ButirRencana key={b.id} teks={b.teks} ket={b.label} />
        ))}
      </ul>
    );
  } else if (waspada) {
    const nama = pasangan?.buddy || anak.tindak.buddy;
    ket = `Berjalan · evaluasi ${anak.tindak.evaluasi}${nama ? ` · pendamping sebaya ${nama}` : ""}`;
    isi = checklist.length ? (
      <DaftarChecklist checklist={checklist} wali={wali} centang={centang} />
    ) : (
      <ul className="rlist">
        {usulanAnak(anak.heart)
          .slice(0, 3)
          .map((u) => (
            <ButirRencana key={u.id} teks={u.teks} ket={labelPemilik(u.oleh, wali)} />
          ))}
      </ul>
    );
  } else {
    ket = `Pengamatan ${wali} · minggu ${anak.minggu} dari 4`;
    isi = (
      <>
        <span className="rbar obs" aria-hidden="true">
          <span style={{ width: `${anak.minggu * 25}%` }} />
        </span>
        <blockquote className="kutip">
          <span className="mut">Catatan terakhir wali kelas</span>
          {anak.catatan}
        </blockquote>
        {pasangan ? <p className="lket">{`Pendamping sebaya: ${pasangan.buddy}, sejak ${pasangan.sejak}`}</p> : null}
        {calon ? <p className="lket">{`Pendamping sebaya belum dipilih. Usulan wali kelas: ${calon.calon.join(" atau ")}.`}</p> : null}
        {checklist.length ? <DaftarChecklist checklist={checklist} wali={wali} centang={centang} /> : null}
        <p className="dfoot">Bila 4 minggu belum membaik, Guru BK menyusun tindak lanjut.</p>
      </>
    );
  }

  return (
    <Laci label={`Ringkasan ${anak.nama}`} labelTutup="Tutup ringkasan" onTutup={onTutup} lebar={lebar}>
      <KepalaLaci awal={<AvatarAnak nama={anak.nama} />} judul={anak.nama} sub={`Kelas ${anak.kelas} · ${wali}`} onTutup={onTutup} />
      <div className="hasilbaris">
        <HurufHeart heart={heart} ukuran="md" />
        <PilStatus status={waspada ? "waspada" : "perhatian"} />
      </div>
      <ul className="asplist2" aria-label="Hasil per aspek HEART">
        {HEART.map((a) => (
          <li key={a.id}>
            <span className="anama">{a.nama}</span>
            <PilStatus status={heart[a.id]} kecil />
          </li>
        ))}
      </ul>
      <h3 className="lsub">Tindak lanjut</h3>
      <p className="lket">{ket}</p>
      {isi}
    </Laci>
  );
}

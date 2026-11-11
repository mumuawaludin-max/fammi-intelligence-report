import { useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaKartu, KepalaLaci, Laci, Segmen } from "../komponen";
import { inisial } from "../alat";
import {
  ASPEK,
  DAFTAR,
  DUKUNGAN,
  KATEGORI,
  KELAS,
  PANTAU,
  SARAN,
  SUB_FORMULIR,
  TAB_PETA,
  TANDA,
  TANGGAL_EVALUASI,
  VERSI,
  WALI,
} from "./skriningData";
import css from "./Skrining.module.css";

// Jalur ikon khusus layar ini (tidak ada di ikonData.js).
const IC = {
  tangan:
    "M23 5.5V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83s1.26-1.23 1.3-1.25c.22-.19.49-.29.79-.29.22 0 .42.06.6.16.04.01 4.31 2.46 4.31 2.46V4c0-.83.67-1.5 1.5-1.5S11 3.17 11 4v7h1V1.5c0-.83.67-1.5 1.5-1.5S15 .67 15 1.5V11h1V2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h1V5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z",
  petir: "M7 2v11h3v9l7-12h-4l4-8z",
};

/** Ubin ikon kecil satu aspek instrumen; Tanda keamanan berwarna merah. */
function UbinAspek({ aspek }) {
  return (
    <span className={`tile sm ${aspek.keamanan ? "red" : "p"}`}>
      <Ikon nama={aspek.ikon} d={IC[aspek.ikon]} size={18} />
    </span>
  );
}

/**
 * Skrining & pemetaan (sudut pandang Bu Laras, Koordinator BK): kelompok hasil skrining, progres
 * pengisian, isi instrumen, peta per kelas, dan daftar anak yang perlu ditindaklanjuti, plus laci
 * formulir skrining dan laci rencana dukungan. Semua data contoh dari skriningData.js.
 */
export default function Skrining() {
  const { pindah, toast } = useProteksi();
  const [tab, setTab] = useState("prog");
  const [daftar, setDaftar] = useState("dukung");
  const [semua, setSemua] = useState(false);
  const [laci, setLaci] = useState(null);
  const [versi, setVersi] = useState("ot");
  const [rencanaUntuk, setRencanaUntuk] = useState(null);
  const [direncanakan, setDirencanakan] = useState({});
  const [diingatkan, setDiingatkan] = useState({});
  const [semuaDiingatkan, setSemuaDiingatkan] = useState(false);

  const bukaFormulir = () => setLaci("formulir");
  const tutupLaci = () => setLaci(null);

  function pilihDaftar(id) {
    setDaftar(id);
    setSemua(false);
  }

  function pilihKategori(k) {
    if (k.daftar) pilihDaftar(k.daftar);
    else toast("221 anak ikut kelas kesadaran bersama kelasnya");
  }

  function ingatkanSemua() {
    if (semuaDiingatkan) return;
    setSemuaDiingatkan(true);
    toast("Pengingat WhatsApp terkirim ke 47 orang tua di 11 kelas");
  }

  function ingatkanKelas(kelas, belum) {
    setDiingatkan((d) => ({ ...d, [kelas]: true }));
    toast(`Pengingat WhatsApp terkirim ke ${belum} orang tua kelas ${kelas}`);
  }

  function bukaRencana(nama) {
    setRencanaUntuk(nama);
    setLaci("rencana");
  }

  function simpanRencana(nama, pesan) {
    setDirencanakan((p) => ({ ...p, [nama]: true }));
    setLaci(null);
    toast(pesan);
  }

  const bukaKasus = (id) => pindah("kasus", { jenis: "kasus", id });
  const infoDaftar = DAFTAR.find((d) => d.id === daftar);

  // Satu tombol aksi per baris. Tombolnya tetap elemen yang sama saat "Buat rencana" berganti
  // jadi "Lihat rencana", supaya laci rencana bisa mengembalikan fokus ke baris itu.
  let anak;
  let kaki = infoDaftar.kaki;
  if (daftar === "dukung") {
    const tampil = semua ? DUKUNGAN : DUKUNGAN.slice(0, 8);
    kaki = `Menampilkan ${tampil.length} dari 18 anak.`;
    anak = tampil.map((r) => {
      const baru = !!direncanakan[r.nama];
      let status;
      let nada;
      if (r.jenis === "kasus") {
        status = `Kasus ${r.kasus} · ${r.ket}`;
        nada = "bad";
      } else if (r.jenis === "rencana") {
        status = `Rencana berjalan · ${r.ket}`;
        nada = "mid";
      } else if (baru) {
        status = "Rencana dibuat hari ini";
        nada = "mid";
      } else {
        status = "Belum ada rencana";
        nada = "warn";
      }
      let aksi;
      if (r.profil) aksi = { label: "Lihat profil", onClick: () => pindah("anak") };
      else if (r.jenis === "kasus") aksi = { label: "Buka kasus", onClick: () => bukaKasus(r.kasus) };
      else if (r.jenis === "belum" && !baru) aksi = { label: "Buat rencana", ikon: "tambah", onClick: () => bukaRencana(r.nama) };
      else {
        aksi = {
          label: "Lihat rencana",
          onClick: () => toast(`Rencana dukungan ${r.nama}: 3 langkah berjalan, ${r.ket || "evaluasi 4 minggu lagi"}`),
        };
      }
      return { ...r, isi: r.aspek, status, nada, aksi };
    });
  } else if (daftar === "pantau") {
    anak = PANTAU.map((r) => ({
      ...r,
      isi: r.aspek,
      status: `Observasi ${r.minggu}`,
      nada: "warn",
      aksi: { label: "Catatan terakhir", onClick: () => toast(`${r.nama}: ${r.catatan}`) },
    }));
  } else {
    anak = TANDA.map((r) => ({
      ...r,
      isi: r.tanda,
      status: `Kasus ${r.kasus} · ${r.ket}`,
      nada: "bad",
      aksi: { label: "Buka kasus", onClick: () => bukaKasus(r.kasus) },
    }));
  }

  const anakRencana = DUKUNGAN.find((r) => r.nama === rencanaUntuk) || DUKUNGAN[6];

  return (
    <div className={`isi ${css.layar}`}>
      <section className="titlerow">
        <div>
          <p className="eyebrow">Sekolah Proteksi · Cegah · Tahap 2: pemetaan awal</p>
          <h1 className="h1">Skrining perilaku dan mental anak 4–10 tahun</h1>
          <p className="lead">
            Orang tua dan wali kelas mengisi pernyataan yang sama untuk tiap anak. Hasilnya menjadi peta awal sekolah:
            siapa yang cukup ikut kelas kesadaran, siapa yang perlu dipantau, didukung, atau segera ditangani.
          </p>
        </div>
        <div className="tbtns">
          <button type="button" className="ghost" onClick={bukaFormulir}>
            <Ikon nama="mata" size={18} />
            Lihat formulir
          </button>
          <button
            type="button"
            className={`btnp${semuaDiingatkan ? " done" : ""}`}
            aria-disabled={semuaDiingatkan || undefined}
            onClick={ingatkanSemua}
          >
            <Ikon nama="kirim" size={18} />
            {semuaDiingatkan ? "Pengingat terkirim" : "Ingatkan 47 orang tua"}
          </button>
        </div>
      </section>

      <section className="card tcard">
        <div className="tophead">
          <KepalaKartu ikon="bendera" judul={["Dari Hasil", "ke Tindakan"]} />
          <span className="mut" style={{ fontSize: 12 }}>
            Pengelompokan otomatis, bisa dikoreksi Guru BK. Klik kelompok untuk melihat daftar anak.
          </span>
        </div>
        <div className="cats">
          {KATEGORI.map((k) => {
            const aktif = k.daftar !== null && k.daftar === daftar;
            return (
              <button
                key={k.nada}
                type="button"
                className={`cat ${k.nada}${aktif ? " on" : ""}`}
                aria-pressed={aktif}
                onClick={() => pilihKategori(k)}
              >
                <span className="catt">
                  <span className={`cdot ${k.nada}`} />
                  {k.judul}
                </span>
                <span className="catn">{k.jumlah}</span>
                <span className="catd">{k.isi}</span>
                <span className="catw">{k.oleh}</span>
              </button>
            );
          })}
        </div>
        <p className="chartnote">276 dari 288 anak sudah terpetakan. 12 anak belum, karena formulir wali kelasnya belum diisi.</p>
      </section>

      <section className="row2">
        <div className="card hero">
          <div className="herotop">
            <KepalaKartu ikon="jam" nada="dark" judul={["Progres Pengisian", "Batas Jumat, 13 Nov"]} />
            <p className="herobig">2 hari lagi</p>
          </div>
          <div className="herobot">
            <div>
              <div className="mini">
                <span className="ic">
                  <Ikon nama="pena" size={15} warna="#111" />
                </span>
                Wali kelas
              </div>
              <p className="heroval">276 dari 288</p>
              <div className="hbar">
                <span className="pu" style={{ width: "96%" }} />
              </div>
              <p className="herosub">Belum lengkap: 1B, 2B, 4A</p>
            </div>
            <div>
              <div className="mini">
                <span className="ic">
                  <Ikon nama="kelompok" size={15} warna="#111" />
                </span>
                Orang tua
              </div>
              <p className="heroval">
                <span>241 dari 288</span>
                <span className="dot" />
                <span className="o">47 belum</span>
              </p>
              <div className="hbar">
                <span className="or" style={{ width: "84%" }} />
              </div>
              <p className="herosub">
                {semuaDiingatkan
                  ? "Pengingat ketiga terkirim hari ini pukul 10.31"
                  : "Pengingat WhatsApp terkirim 2 kali, terakhir Selasa 10 Nov"}
              </p>
            </div>
          </div>
        </div>

        <div className="card akses">
          <div className="tophead">
            <KepalaKartu ikon="skrining" nada="black" judul={["Isi Instrumen", "31 pernyataan"]} />
            <button type="button" className="abtn" onClick={bukaFormulir}>
              Lihat formulir
            </button>
          </div>
          <ul className="aspl">
            {ASPEK.map((a) => (
              <li key={a.judul}>
                <UbinAspek aspek={a} />
                <span>
                  <span className="ast">{a.judul}</span>
                  <span className="asd">{a.ringkas}</span>
                </span>
                <span className="asn">{a.butir.length} butir</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card tcard">
        <div className="tophead">
          <KepalaKartu ikon="baris" judul={["Peta", "per Kelas"]} />
          <Segmen label="Tampilan tabel" pilihan={TAB_PETA} nilai={tab} onPilih={setTab} />
        </div>
        {tab === "prog" ? (
          <div className="tbox">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Kelas</th>
                  <th>Formulir wali kelas</th>
                  <th>Formulir orang tua</th>
                  <th>Orang tua belum mengisi</th>
                  <th>Pengingat</th>
                </tr>
              </thead>
              <tbody>
                {KELAS.map((k) => {
                  const belum = k.anak - k.ortu;
                  const terkirim = !!diingatkan[k.kelas] || semuaDiingatkan;
                  return (
                    <tr key={k.kelas}>
                      <td>
                        <div className="cellbox">
                          <b>{k.kelas}</b>
                          <span className="mut">{k.wali}</span>
                        </div>
                      </td>
                      <td>
                        <div className="pcell">
                          <span className="prog">
                            <span
                              className={`progf ${k.walas < k.anak ? "warn" : "ok"}`}
                              style={{ width: `${Math.round((k.walas / k.anak) * 100)}%` }}
                            />
                          </span>
                          <span>{`${k.walas} / ${k.anak}`}</span>
                        </div>
                      </td>
                      <td>
                        <div className="pcell">
                          <span className="prog">
                            <span
                              className={`progf ${k.ortu / k.anak < 0.85 ? "warn" : "mid"}`}
                              style={{ width: `${Math.round((k.ortu / k.anak) * 100)}%` }}
                            />
                          </span>
                          <span>{`${k.ortu} / ${k.anak}`}</span>
                        </div>
                      </td>
                      <td>{belum} orang tua</td>
                      <td>
                        {terkirim ? (
                          <span className="pill sm ok">Terkirim 10.31</span>
                        ) : (
                          <button
                            type="button"
                            className="abtn"
                            aria-label={`Kirim pengingat WhatsApp ke ${belum} orang tua kelas ${k.kelas}`}
                            onClick={() => ingatkanKelas(k.kelas, belum)}
                          >
                            <Ikon nama="kirim" size={16} warna="var(--sp-hijau-batang)" />
                            Ingatkan via WhatsApp
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="tbox">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Kelas</th>
                    <th>Perasaan</th>
                    <th>Perilaku</th>
                    <th>Fokus &amp; energi</th>
                    <th>Pertemanan</th>
                    <th>Kepedulian</th>
                    <th>Anak perlu tindak lanjut</th>
                  </tr>
                </thead>
                <tbody>
                  {KELAS.map((k) => (
                    <tr key={k.kelas}>
                      <td>
                        <div className="cellbox">
                          <b>{k.kelas}</b>
                          <span className="mut">{k.wali}</span>
                        </div>
                      </td>
                      {k.aspek.map((v, i) => (
                        <td key={i}>
                          <span className={`hc t${Math.min(v, 4)}`}>{v}</span>
                        </td>
                      ))}
                      <td>
                        <b>{k.tindak} anak</b> <span className="mut">dari {k.walas} terpetakan</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total sekolah</td>
                    <td>24</td>
                    <td>15</td>
                    <td>29</td>
                    <td>21</td>
                    <td>11</td>
                    <td>55 anak dari 276</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="chartnote">
              Angka = jumlah anak yang aspeknya perlu dipantau atau perlu dukungan. Makin gelap, makin banyak. Fokus &amp;
              energi paling sering muncul; Pertemanan menonjol di kelas 2B.
            </p>
          </>
        )}
      </section>

      <section className="card tcard">
        <div className="tophead">
          <KepalaKartu ikon="hati" judul={["Anak yang Perlu", "Ditindaklanjuti"]} />
          <Segmen label="Kelompok anak" pilihan={DAFTAR} nilai={daftar} onPilih={pilihDaftar} />
        </div>
        <p className="lead2">{infoDaftar.pengantar}</p>
        <div className="tbox">
          <table className="tbl">
            <thead>
              <tr>
                <th>Anak</th>
                <th>Kelas</th>
                <th>{infoDaftar.kolom}</th>
                <th>Sumber</th>
                <th>Tindak lanjut</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {anak.map((r) => (
                <tr key={`${daftar}:${r.nama}`}>
                  <td>
                    <div className="kid">
                      <span className="av" aria-hidden="true">
                        {inisial(r.nama)}
                      </span>
                      <b>{r.nama}</b>
                    </div>
                  </td>
                  <td>{r.kelas}</td>
                  <td className="wrapcell">{r.isi}</td>
                  <td>{r.sumber}</td>
                  <td>
                    <span className={`pill sm ${r.nada}`}>{r.status}</span>
                  </td>
                  <td>
                    <button type="button" className="abtn" onClick={r.aksi.onClick}>
                      {r.aksi.ikon ? <Ikon nama={r.aksi.ikon} size={16} warna="var(--sp-ungu)" /> : null}
                      {r.aksi.label}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="footrow">
          <p className="chartnote">{kaki}</p>
          {daftar === "dukung" ? (
            <button type="button" className="linkbtn" onClick={() => setSemua((s) => !s)}>
              {semua ? "Tampilkan lebih sedikit" : "Tampilkan semua 18 anak"}
            </button>
          ) : null}
        </div>
      </section>

      {laci === "formulir" && (
        <Laci label="Formulir skrining" labelTutup="Tutup formulir" onTutup={tutupLaci}>
          <KepalaLaci
            awal={
              <div className="tile p">
                <Ikon nama="skrining" size={22} />
              </div>
            }
            judul="Formulir skrining anak 4–10 tahun"
            sub={SUB_FORMULIR[versi]}
            onTutup={tutupLaci}
          />
          <Segmen label="Versi formulir" pilihan={VERSI} nilai={versi} onPilih={setVersi} style={{ alignSelf: "flex-start" }} />
          <div className="scale">
            <b>Pilihan jawaban:</b>
            <span className="pill sm gray">Tidak pernah</span>
            <span className="pill sm gray">Kadang-kadang</span>
            <span className="pill sm gray">Sering</span>
          </div>
          {ASPEK.map((a, i) => (
            <div key={a.judul} className="fgroup">
              <div className="fgh">
                <UbinAspek aspek={a} />
                <b>{a.judul}</b>
                <span className="mut">
                  {a.butir.length} pernyataan{a.keamanan ? " · jawaban Ya, Tidak, Tidak yakin" : ""}
                </span>
              </div>
              <ol className="items" start={i * 5 + 1}>
                {a.butir.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ol>
              {a.keamanan ? (
                <p className="reco bad">
                  Jawaban Ya langsung membuat kasus dan masuk alur penanganan dengan SLA. Jawaban Tidak yakin diteruskan ke
                  Guru BK untuk ditanyakan ulang dalam 1 hari kerja.
                </p>
              ) : null}
              {a.kekuatan ? (
                <p className="reco info">Aspek kekuatan. Skor tinggi berarti baik dan ditampilkan lebih dulu kepada orang tua.</p>
              ) : null}
            </div>
          ))}
          <p className="dfoot">
            Butir di prototipe ini adalah contoh susunan. Isi dan ambang batas final mengikuti instrumen yang divalidasi tim
            psikolog Fammi.
          </p>
        </Laci>
      )}

      {laci === "rencana" && <LaciRencana anak={anakRencana} onTutup={tutupLaci} onSimpan={simpanRencana} />}
    </div>
  );
}

/**
 * Laci rencana dukungan untuk satu anak. Isiannya mulai dari saran aspek pertama anak itu setiap
 * kali laci dibuka (komponen dipasang ulang), seperti desain.
 */
function LaciRencana({ anak, onTutup, onSimpan }) {
  const saran = SARAN[anak.aspek.split(", ")[0]] || SARAN.Perasaan;
  const [tujuan, setTujuan] = useState(null);
  const [langkahMati, setLangkahMati] = useState({});
  const [koordinator, setKoordinator] = useState("bk");
  const [evaluasi, setEvaluasi] = useState("4");
  const [kirimOrtu, setKirimOrtu] = useState(true);
  const jumlahLangkah = saran.langkah.filter((_, i) => !langkahMati[i]).length;

  function simpan() {
    onSimpan(
      anak.nama,
      `Rencana ${anak.nama} tersimpan: ${jumlahLangkah} langkah, evaluasi ${TANGGAL_EVALUASI[evaluasi]}${
        kirimOrtu ? ", ringkasan dikirim ke orang tua" : ""
      }`,
    );
  }

  return (
    <Laci label="Buat rencana dukungan" labelTutup="Tutup rencana" onTutup={onTutup}>
      <KepalaLaci
        awal={
          <div className="tile p">
            <Ikon nama="hati" size={22} />
          </div>
        }
        judul="Rencana dukungan"
        sub={`${anak.nama} · Kelas ${anak.kelas} · aspek ${anak.aspek}`}
        onTutup={onTutup}
      />
      <p className="reco info">
        Langkah di bawah adalah saran awal dari hasil skrining. Hapus centang yang tidak sesuai, lalu simpan. Rencana akan
        muncul di profil anak dan ruang wali kelas.
      </p>
      <div className="fld">
        <label className="flabel" htmlFor="skrining-tujuan">
          Tujuan
        </label>
        <textarea
          id="skrining-tujuan"
          className="inp"
          rows={2}
          value={tujuan ?? saran.tujuan}
          onChange={(e) => setTujuan(e.target.value)}
        />
      </div>
      <fieldset className="fset">
        <legend className="flabel" style={{ marginBottom: 6 }}>
          Langkah yang disarankan
        </legend>
        {saran.langkah.map(([teks, oleh], i) => (
          <label key={teks} className="chk">
            <input
              type="checkbox"
              checked={!langkahMati[i]}
              onChange={() => setLangkahMati((m) => ({ ...m, [i]: !m[i] }))}
            />
            <span>
              <b>{teks}</b>
              <span className="mut">Penanggung jawab: {oleh}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="row2f">
        <div className="fld">
          <label className="flabel" htmlFor="skrining-koordinator">
            Koordinator rencana
          </label>
          <select
            id="skrining-koordinator"
            className="inp"
            value={koordinator}
            onChange={(e) => setKoordinator(e.target.value)}
          >
            <option value="bk">Bu Laras (Guru BK)</option>
            <option value="wk">{`${WALI[anak.kelas]} (wali kelas ${anak.kelas})`}</option>
          </select>
        </div>
        <div className="fld">
          <label className="flabel" htmlFor="skrining-evaluasi">
            Evaluasi bersama orang tua
          </label>
          <select id="skrining-evaluasi" className="inp" value={evaluasi} onChange={(e) => setEvaluasi(e.target.value)}>
            <option value="2">2 minggu lagi</option>
            <option value="4">4 minggu lagi</option>
            <option value="6">6 minggu lagi</option>
          </select>
        </div>
      </div>
      <label className="chk">
        <input type="checkbox" checked={kirimOrtu} onChange={() => setKirimOrtu((v) => !v)} />
        <span>
          Kirim ringkasan rencana ke orang tua lewat aplikasi Fammi
          <span className="mut">Orang tua melihat tujuan dan peran mereka, tanpa label diagnosis.</span>
        </span>
      </label>
      <div className="dacts">
        <button type="button" className="ghost" onClick={onTutup}>
          Batal
        </button>
        <button type="button" className="btnp" onClick={simpan}>
          Simpan rencana
        </button>
      </div>
    </Laci>
  );
}

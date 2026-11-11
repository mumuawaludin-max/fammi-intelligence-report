import { useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaKartu, KepalaLaci, Laci, Segmen } from "../komponen";
import { inisial } from "../alat";
import {
  ASPEK,
  FAKTA,
  IKON_RIWAYAT,
  LANGKAH_KASUS,
  LANGKAH_RENCANA,
  PENANDA,
  PIL_KASUS,
  RIWAYAT_AWAL,
  SARING_RIWAYAT,
  kategoriAspek,
} from "./profilAnakData";
import css from "./ProfilAnak.module.css";

const NAMA_ANAK = "Raka Pratama";
const TANGGAL_HARI_INI = "Rabu, 11 Nov";

// Warna ikon kartu "Yang Perlu Diketahui Tim" menurut nada kartunya (desain).
const WARNA_FAKTA = { ok: "var(--sp-hijau-ikon)", warn: "#B86A00", info: "var(--sp-ungu)" };

/**
 * Profil satu anak (artboard "4 · Profil anak"): Raka Pratama, kelas 2B, dilihat Bu Rina sebagai
 * wali kelas. Isinya hasil skrining dari dua pengisi, catatan untuk tim, rencana dukungan, kasus
 * yang sedang berjalan, dan riwayat. Langkah rencana milik Bu Rina bisa ditandai selesai, dan
 * observasi baru dari laci "Catat observasi" langsung masuk ke riwayat. Semuanya state layar ini
 * saja, tidak ada yang disimpan.
 */
export default function ProfilAnak() {
  const { pindah, toast } = useProteksi();
  const [selesai, setSelesai] = useState({});
  const [saring, setSaring] = useState("semua");
  const [laciObs, setLaciObs] = useState(false);
  const [teksObs, setTeksObs] = useState("");
  const [penanda, setPenanda] = useState({});
  const [tambahan, setTambahan] = useState([]);

  const rencana = LANGKAH_RENCANA.map((p, i) => {
    const hariIni = !!selesai[i];
    let status = "Terjadwal";
    let pil = "gray";
    if (p.jenis === "selesai") {
      status = "Selesai";
      pil = "ok";
    } else if (hariIni) {
      status = "Selesai hari ini";
      pil = "ok";
    } else if (p.jenis === "berjalan") {
      status = "Berjalan";
      pil = "mid";
    }
    return { ...p, i, hariIni, beres: p.jenis === "selesai" || hariIni, status, pil };
  });
  const jumlahBeres = rencana.filter((p) => p.beres).length;
  const persenBeres = (jumlahBeres / LANGKAH_RENCANA.length) * 100;

  const riwayat = [...tambahan, ...RIWAYAT_AWAL].filter(
    (e) => saring === "semua" || e.jenis === saring || (saring === "skr" && e.jenis === "plan"),
  );

  function ubahLangkah(p) {
    setSelesai((lama) => ({ ...lama, [p.i]: !lama[p.i] }));
    if (!p.hariIni) toast(`Langkah "${p.t}" ditandai selesai. Bu Laras diberi tahu.`);
  }

  function bukaObs() {
    setTeksObs("");
    setPenanda({});
    setLaciObs(true);
  }

  function tutupObs() {
    setLaciObs(false);
  }

  function simpanObs() {
    const tanda = PENANDA.filter((g) => penanda[g]).join(", ");
    const teks = (teksObs.trim() || "Catatan singkat tanpa keterangan tambahan.") + (tanda ? ` (${tanda})` : "");
    setTambahan((lama) => [
      { id: `obs-${lama.length + 1}`, d: TANGGAL_HARI_INI, jenis: "obs", t: "Observasi Bu Rina", x: teks },
      ...lama,
    ]);
    setLaciObs(false);
    setSaring("semua");
    toast("Catatan observasi Raka tersimpan dan muncul di riwayat.");
  }

  return (
    <div className={`isi ${css.layar}`}>
      <nav aria-label="Lokasi halaman">
        <p className="crumb">
          <button type="button" onClick={() => pindah("kelas")}>
            Ruang wali kelas 2B
          </button>
          <Ikon nama="kanan" size={16} />
          <span aria-current="page">Profil anak</span>
        </p>
      </nav>

      <section className="card prof">
        <div className="proftop">
          <span className="bigav" aria-hidden="true">
            {inisial(NAMA_ANAK)}
          </span>
          <div className="pinfo">
            <h1 className="pname">{NAMA_ANAK}</h1>
            <p className="pmeta">7 tahun · Kelas 2B · Wali kelas Bu Rina Kartika · Orang tua Ibu Dewi Lestari</p>
            <div className="ptags">
              <span className="pill sm bad">Perlu dukungan</span>
              <span className="pill sm bad">Kasus aktif KS-015 · Tinggi</span>
              <span className="pill sm mid">Rencana dukungan berjalan</span>
            </div>
          </div>
          <div className="pacts">
            <button
              type="button"
              className="ghost"
              onClick={() => toast("Membuka WhatsApp Ibu Dewi Lestari. Percakapan tercatat di riwayat Raka.")}
            >
              <Ikon nama="telepon" size={18} warna="var(--sp-hijau-batang)" />
              Hubungi orang tua
            </button>
            <button type="button" className="btnp" onClick={bukaObs}>
              <Ikon nama="pena" size={18} />
              Catat observasi
            </button>
          </div>
        </div>
        <p className="privacy">
          <Ikon nama="gembok" size={16} warna="var(--sp-tinta-3)" />
          Data rahasia. Hanya wali kelas 2B, tim BK, dan Kepala Sekolah yang bisa membuka profil ini, dan setiap akses
          tercatat. Hasil skrining bukan diagnosis.
        </p>
      </section>

      <section className="row2">
        <div className="card tcard">
          <div className="tophead">
            <KepalaKartu ikon="grafik" judul={["Hasil", "Skrining Awal"]} />
            <div className="legend">
              <span>
                <i className="sw ot" aria-hidden="true" />
                Orang tua, 3 Nov
              </span>
              <span>
                <i className="sw wk" aria-hidden="true" />
                Wali kelas, 23 Okt
              </span>
            </div>
          </div>
          <div>
            {ASPEK.map((a) => {
              const kat = kategoriAspek(a);
              return (
                <div key={a.id} className="asp">
                  <div className="aspn">
                    {a.t}
                    <span>{a.sub}</span>
                  </div>
                  <div className="bars">
                    <div className="brow">
                      <span className="btrack">
                        <span className="bfill ot" style={{ width: `${a.ot * 10}%` }} />
                      </span>
                      <span className="bval">
                        <span className="sr">Orang tua </span>
                        {a.ot}/10
                      </span>
                    </div>
                    <div className="brow">
                      <span className="btrack">
                        <span className="bfill wk" style={{ width: `${a.wk * 10}%` }} />
                      </span>
                      <span className="bval">
                        <span className="sr">Wali kelas </span>
                        {a.wk}/10
                      </span>
                    </div>
                  </div>
                  <span className={`pill sm ${kat.pil}`}>{kat.label}</span>
                </div>
              );
            })}
          </div>
          <p className="note">
            Ambang contoh: 0–3 sesuai tahap, 4–5 perlu dipantau, 6–10 perlu dukungan. Untuk kepedulian, skor tinggi berarti
            kekuatan. Perbandingan awal dan akhir muncul setelah skrining akhir pada Desember 2026.
          </p>
        </div>

        <div className="card tcard">
          <KepalaKartu ikon="info" judul={["Yang Perlu", "Diketahui Tim"]} />
          <div className="facts">
            {FAKTA.map((f) => (
              <div key={f.id} className={`fact ${f.nada}`}>
                <Ikon nama={f.ikon} size={20} warna={WARNA_FAKTA[f.nada]} />
                <div>
                  <b>{f.judul}</b>
                  <p>{f.isi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card tcard">
        <div className="tophead">
          <KepalaKartu ikon="hati" judul={["Rencana", "Dukungan"]} />
          <span className="mut dibuat">Dibuat Bu Laras, 5 Nov · disetujui Ibu Dewi di aplikasi</span>
        </div>
        <div className="planhead">
          <div className="goal">
            <b>Tujuan</b>
            <br />
            Raka punya teman bermain dan merasa aman saat jam istirahat.
          </div>
          <div className="pstat">
            <span className="prog" aria-hidden="true">
              <span className="progf" style={{ width: `${persenBeres}%` }} />
            </span>
            {jumlahBeres} dari {LANGKAH_RENCANA.length} langkah selesai
          </div>
          <span className="pill sm mid">Evaluasi Kamis, 3 Des</span>
        </div>
        <div className="tbox">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Langkah</th>
                <th scope="col">Penanggung jawab</th>
                <th scope="col">Waktu</th>
                <th scope="col">Status</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rencana.map((p) => {
                const labelAksi = p.hariIni ? "Batalkan" : "Tandai selesai";
                return (
                  <tr key={p.t}>
                    <td className="wrapcell">
                      <b>{p.t}</b>
                    </td>
                    <td>{p.who}</td>
                    <td>{p.when}</td>
                    <td>
                      <span className={`pill sm ${p.pil}`}>{p.status}</span>
                    </td>
                    <td>
                      {p.milikSaya ? (
                        <button
                          type="button"
                          className="abtn"
                          aria-label={`${labelAksi}: ${p.t}`}
                          onClick={() => ubahLangkah(p)}
                        >
                          {labelAksi}
                        </button>
                      ) : p.jenis !== "selesai" ? (
                        <span className="mut">Bukan tugas Anda</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="row2">
        <div className="card tcard">
          <div className="tophead">
            <KepalaKartu ikon="tiket" nada="red" judul={["Kasus Terkait", "KS-015 · Tinggi"]} />
            <button type="button" className="ghost" onClick={() => pindah("kasus", { jenis: "kasus", id: "KS-015" })}>
              Buka di Kasus &amp; SLA
            </button>
          </div>
          <p className="kasusket">
            <b>Didorong dan dipukul kakak kelas di dekat kantin.</b> Dilaporkan Ibu Dewi lewat Lapor Aman, Rabu 11 Nov
            08.12. Ditangani Bu Rina (wali kelas) dan Bu Laras (Guru BK); Kepala Sekolah diberi tahu.
          </p>
          <div className="sla">
            <b>Respon pertama: sisa 1 j 42 m</b>
            <div className="sbar" aria-hidden="true">
              <span />
            </div>
            <span>Batas 12.12 hari ini · rencana tindak paling lambat Jumat 13 Nov 08.12</span>
          </div>
          <ol className="steps">
            {LANGKAH_KASUS.map((k, i) => (
              <li key={k.t} className="step">
                <span className={`sdot ${k.jenis}`}>{i + 1}</span>
                <div>
                  <div className="st">{k.t}</div>
                  <div className="sd">{k.d}</div>
                </div>
                <span className={`pill sm ${PIL_KASUS[k.jenis]}`}>{k.s}</span>
              </li>
            ))}
          </ol>
          <p className="note">
            Kasus sebelumnya: KS-008, 30 Okt, saling ejek saat antre, selesai 3 Nov lewat mediasi wali kelas.
          </p>
        </div>

        <div className="card tcard">
          <div className="tophead">
            <KepalaKartu ikon="riwayat" judul={["Riwayat", "Raka"]} />
            <Segmen label="Saring riwayat" pilihan={SARING_RIWAYAT} nilai={saring} onPilih={setSaring} />
          </div>
          <ol className="tl">
            {riwayat.map((e) => (
              <li key={e.id} className="tli">
                <span className="tld">{e.d}</span>
                <span className={`tlic ${e.jenis}`}>
                  <Ikon nama={IKON_RIWAYAT[e.jenis]} size={16} />
                </span>
                <span className="tlt">
                  <b>{e.t}</b>
                  {` · ${e.x}`}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {laciObs && (
        <Laci label="Catat observasi Raka" labelTutup="Tutup catatan" lebar={560} className="laciobs" onTutup={tutupObs}>
          <KepalaLaci
            awal={
              <div className="tile p">
                <Ikon nama="pena" size={22} />
              </div>
            }
            judul="Catat observasi"
            sub={`${NAMA_ANAK} · Rabu, 11 November 2026`}
            onTutup={tutupObs}
          />
          <div className="fld">
            <span className="flabel">Yang terlihat</span>
            <div className="chips" role="group" aria-label="Penanda observasi">
              {PENANDA.map((g) => {
                const aktif = !!penanda[g];
                return (
                  <button
                    key={g}
                    type="button"
                    className={`chip${aktif ? " on" : ""}`}
                    aria-pressed={aktif}
                    onClick={() => setPenanda((lama) => ({ ...lama, [g]: !lama[g] }))}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="fld">
            <label className="flabel" htmlFor="anak-obs">
              Catatan
            </label>
            <textarea
              id="anak-obs"
              className="inp"
              rows={5}
              placeholder="Tulis yang Anda lihat sendiri. Contoh: istirahat kedua bermain bola dengan Alif, tidak ke kantin."
              value={teksObs}
              onChange={(e) => setTeksObs(e.target.value)}
            />
          </div>
          <div className="dacts">
            <button type="button" className="ghost" onClick={tutupObs}>
              Batal
            </button>
            <button type="button" className="btnp" onClick={simpanObs}>
              Simpan catatan
            </button>
          </div>
        </Laci>
      )}
    </div>
  );
}

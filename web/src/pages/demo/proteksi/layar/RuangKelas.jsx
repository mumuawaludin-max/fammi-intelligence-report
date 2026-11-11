import { useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaKartu, KepalaLaci, Laci, Segmen } from "../komponen";
import { inisial } from "../alat";
import {
  ANAK_2B,
  ANAK_BELUM_DIISI,
  AWAL_TANDA_KEAMANAN,
  BUTIR_SKRINING,
  CATATAN_AWAL,
  JUMLAH_BUTIR,
  KATEGORI,
  KEPALA_BUTIR,
  PIL_TAHAP,
  SESI_KESADARAN,
  SKALA,
  SKALA_AMAN,
  TANDA_OBSERVASI,
  URUT_SEBARAN,
  adaTandaKeamanan,
  hasilSementara,
} from "./ruangKelasData";
import css from "./RuangKelas.module.css";

const PESAN_MATERI = "Materi sesi 3 (PDF, 6 halaman) dan 12 kartu cerita siap diunduh";

const namaDepan = (nama) => nama.split(" ")[0];

/** Keterangan kecil di ubin peta kelas, atau null kalau tidak ada. */
function penandaAnak(a) {
  if (a.nama === "Raka Pratama") return { teks: "Kasus KS-015 · tugas Anda", merah: true };
  if (a.kasusBaru) return { teks: "Kasus KS-017 dibuat", merah: true };
  if (!a.ortu && a.kat !== "belum") return { teks: "Orang tua belum mengisi", merah: false };
  if (a.kat === "belum") return { teks: "Formulir Anda belum diisi", merah: false };
  return null;
}

/**
 * Layar 3 · Ruang wali kelas (Bu Rina, wali kelas 2B): tugas berbatas waktu, kemajuan skrining
 * kelas, peta kelas dengan saringan, kelas kesadaran, dan catatan observasi. Tiga laci: ringkasan
 * satu anak, formulir skrining versi wali kelas (31 butir), dan formulir catat observasi.
 * Semua perubahan hanya hidup di state layar ini.
 */
export default function RuangKelas() {
  const { pindah, toast } = useProteksi();
  const [saring, setSaring] = useState("semua");
  const [laci, setLaci] = useState(null); // "anak" | "isi" | "obs"
  const [anakDilihat, setAnakDilihat] = useState(null);
  const [ksDicatat, setKsDicatat] = useState(false);
  const [sesiSelesai, setSesiSelesai] = useState(false);
  const [anakIsi, setAnakIsi] = useState(ANAK_BELUM_DIISI[0]);
  const [jawaban, setJawaban] = useState({});
  const [terkirim, setTerkirim] = useState({});
  const [obs, setObs] = useState({ anak: "Raka Pratama", tanda: {}, teks: "", bk: false });
  const [catatanBaru, setCatatanBaru] = useState([]);

  const tutupLaci = () => setLaci(null);
  const ubahObs = (sebagian) => setObs((o) => ({ ...o, ...sebagian }));

  function bukaAnak(nama) {
    setAnakDilihat(nama);
    setLaci("anak");
  }

  function bukaIsi(nama) {
    setAnakIsi(nama);
    setLaci("isi");
  }

  // Tanpa `anak`, pilihan anak terakhir dipertahankan (seperti tombol Catat observasi di desain).
  function bukaObs(anak) {
    setObs((o) => ({ anak: anak || o.anak, tanda: {}, teks: "", bk: false }));
    setLaci("obs");
  }

  // ---- formulir skrining wali kelas ----
  const jawabanIni = jawaban[anakIsi] || {};
  const terjawab = Object.keys(jawabanIni).length;
  const adaTanda = adaTandaKeamanan(jawabanIni);
  const belumDiisi = ANAK_BELUM_DIISI.filter((n) => !terkirim[n]);
  const sudahTerkirim = Boolean(terkirim[anakIsi]);
  const siapKirim = terjawab === JUMLAH_BUTIR && !sudahTerkirim;
  const labelKirim = sudahTerkirim
    ? "Sudah terkirim"
    : terjawab === JUMLAH_BUTIR
      ? `Kirim skrining ${namaDepan(anakIsi)}`
      : "Jawab semua pernyataan";
  const pilihanIsi = ANAK_BELUM_DIISI.map((n) => ({ id: n, label: n + (terkirim[n] ? " (terkirim)" : "") }));

  function pilihJawaban(i, j) {
    setJawaban((lama) => ({ ...lama, [anakIsi]: { ...(lama[anakIsi] || {}), [i]: j } }));
  }

  function kirimIsi() {
    if (sudahTerkirim) {
      toast(`Skrining ${anakIsi} sudah terkirim`);
      return;
    }
    if (terjawab < JUMLAH_BUTIR) {
      toast(`Masih ada ${JUMLAH_BUTIR - terjawab} pernyataan yang belum dijawab`);
      return;
    }
    const hasil = hasilSementara(jawabanIni);
    const baru = { ...terkirim, [anakIsi]: { hasil, tanda: adaTanda } };
    const berikut = ANAK_BELUM_DIISI.find((n) => !baru[n]);
    setTerkirim(baru);
    setAnakIsi(berikut || anakIsi);
    setLaci(berikut ? "isi" : null);
    toast(
      adaTanda
        ? `Skrining ${anakIsi} terkirim. Tanda keamanan terdeteksi: kasus KS-017 dibuat dan diteruskan ke Bu Laras.`
        : `Skrining ${anakIsi} terkirim. Hasil sementara: ${KATEGORI[hasil].label}.`,
    );
  }

  // ---- anak kelas 2B: formulir yang baru terkirim mengganti baris contohnya ----
  const semuaAnak = ANAK_2B.map((a) => {
    const kirim = terkirim[a.nama];
    if (!kirim) return a;
    return {
      ...a,
      kat: kirim.tanda ? "dukung" : kirim.hasil,
      ortu: false,
      menonjol: kirim.tanda ? "Tanda keamanan dari formulir wali kelas." : "Hasil dari formulir wali kelas, menunggu formulir orang tua.",
      tindak: kirim.tanda ? "Kasus KS-017 diteruskan ke Bu Laras." : "Dibaca ulang setelah orang tua mengisi.",
      kasusBaru: kirim.tanda,
    };
  });
  const jumlah = { dukung: 0, pantau: 0, belum: 0, sesuai: 0 };
  for (const a of semuaAnak) jumlah[a.kat] += 1;
  const anakTampil = semuaAnak.filter((a) => saring === "semua" || a.kat === saring);
  const pilihanSaring = [
    { id: "semua", label: "Semua (28)" },
    { id: "dukung", label: `Perlu dukungan (${jumlah.dukung})` },
    { id: "pantau", label: `Perlu dipantau (${jumlah.pantau})` },
    { id: "belum", label: `Belum (${jumlah.belum})` },
    { id: "sesuai", label: `Sesuai tahap (${jumlah.sesuai})` },
  ];
  const formulirSaya = 26 + Object.keys(terkirim).length;

  // ---- ringkasan satu anak ----
  const semuaCatatan = [...catatanBaru, ...CATATAN_AWAL];
  const dilihat = semuaAnak.find((a) => a.nama === anakDilihat) || semuaAnak[0];
  const catatanTerakhir = semuaCatatan.find((n) => n.anak === dilihat.nama);
  const formulirDilihat =
    dilihat.kat === "belum"
      ? "Wali kelas belum, orang tua belum"
      : "Wali kelas sudah" + (dilihat.ortu ? ", orang tua sudah" : ", orang tua belum");

  // ---- tugas saya ----
  const tugas = [
    {
      id: "ks",
      ikon: "tiket",
      ubin: "tile sm red",
      judul: "KS-015 · Temui Raka dan catat kronologi kejadian",
      ket: "Perundungan fisik · tingkat Tinggi · diteruskan Bu Laras pukul 08.41",
      batas: ksDicatat ? "Respon tercatat 10.32 · tepat waktu" : "Respon pertama: sisa 1 j 42 m",
      pil: "pill sm ok",
      terbuka: !ksDicatat,
      tombol: "Catat respon",
      aksi: () => {
        setKsDicatat(true);
        toast("Respon pertama KS-015 tercatat 10.32, tepat waktu. Bu Laras menyusun rencana tindak paling lambat Jumat 08.12.");
      },
    },
    {
      id: "isi",
      ikon: "skrining",
      ubin: "tile sm p",
      judul: belumDiisi.length
        ? `Isi skrining ${belumDiisi.length} anak: ${belumDiisi.map(namaDepan).join(" dan ")}`
        : "Skrining kelas 2B lengkap",
      ket: "Formulir wali kelas · sekitar 3 menit per anak",
      batas: belumDiisi.length ? "Batas Jumat, 13 Nov" : "Selesai hari ini",
      pil: belumDiisi.length ? "pill sm warn" : "pill sm ok",
      terbuka: belumDiisi.length > 0,
      tombol: "Isi sekarang",
      aksi: () => bukaIsi(belumDiisi[0] || anakIsi),
    },
    {
      id: "sesi",
      ikon: "buku",
      ubin: "tile sm p",
      judul: "Kelas kesadaran sesi 3: Rahasia Aman dan Rahasia Tidak Aman",
      ket: "Materi, kartu cerita, dan lembar kerja sudah tersedia",
      batas: sesiSelesai ? "Selesai hari ini" : "Kamis, 12 Nov · 07.30",
      pil: sesiSelesai ? "pill sm ok" : "pill sm mid",
      terbuka: !sesiSelesai,
      tombol: "Lihat materi",
      aksi: () => toast(PESAN_MATERI),
    },
    {
      id: "obs",
      ikon: "pena",
      ubin: "tile sm p",
      judul: "Catatan observasi minggu ke-3 untuk 4 anak",
      ket: "Keisha, Rizky, Naura, Arka",
      batas: catatanBaru.length ? `${catatanBaru.length} catatan baru hari ini` : "Jumat, 13 Nov",
      pil: catatanBaru.length ? "pill sm ok" : "pill sm mid",
      terbuka: true,
      tombol: "Catat",
      aksi: () => bukaObs("Keisha Ananda"),
    },
  ];
  const tugasTerbuka = tugas.filter((t) => t.terbuka).length;

  // ---- kelas kesadaran ----
  const sesi = SESI_KESADARAN.map((l) =>
    l.tahap === "next" && sesiSelesai ? { ...l, tahap: "done", waktu: l.waktuSelesai } : l,
  );

  function selesaikanSesi() {
    setSesiSelesai(true);
    toast("Sesi 3 ditandai selesai. Ringkasan sesi dikirim ke orang tua kelas 2B.");
  }

  // ---- catatan observasi ----
  function ubahTanda(g) {
    setObs((o) => ({ ...o, tanda: { ...o.tanda, [g]: !o.tanda[g] } }));
  }

  function simpanObs() {
    const tanda = TANDA_OBSERVASI.filter((g) => obs.tanda[g]).join(", ") || "Tanpa penanda";
    const teks = obs.teks.trim() || "Catatan singkat tanpa keterangan tambahan.";
    const catatan = {
      id: `baru-${catatanBaru.length + 1}`,
      anak: obs.anak,
      tgl: "Rabu, 11 Nov",
      teks,
      tanda: tanda + (obs.bk ? " · dibahas dengan Guru BK" : ""),
    };
    setCatatanBaru((lama) => [catatan, ...lama]);
    ubahObs({ teks: "", tanda: {} });
    setLaci(null);
    toast(`Catatan untuk ${obs.anak} tersimpan${obs.bk ? ". Bu Laras diberi tahu." : "."}`);
  }

  return (
    <div className={`isi ${css.layar}`}>
      <section className="titlerow">
        <div>
          <p className="eyebrow">Ruang wali kelas · Kelas 2B · 28 anak</p>
          <h1 className="h1">Selamat pagi, Bu Rina</h1>
          <p className="lead">
            Kerjakan dulu yang ada di Tugas saya, urut dari batas waktu terdekat. Peta kelas menunjukkan hasil skrining tiap
            anak; klik nama untuk melihat ringkasannya.
          </p>
        </div>
        <div className="tbtns">
          <button type="button" className="ghost" onClick={() => bukaObs()}>
            <Ikon nama="pena" size={18} />
            Catat observasi
          </button>
          {belumDiisi.length > 0 && (
            <button type="button" className="btnp" onClick={() => bukaIsi(belumDiisi[0] || anakIsi)}>
              <Ikon nama="skrining" size={18} />
              {`Isi skrining (${belumDiisi.length} anak)`}
            </button>
          )}
        </div>
      </section>

      <section className="row2">
        <div className="card tcard">
          <div className="tophead">
            <KepalaKartu ikon="tugas" judul={["Tugas", "Saya"]} />
            <span className="pill sm mid">{`${tugasTerbuka} terbuka`}</span>
          </div>
          <div className="tasks">
            {tugas.map((t) => (
              <div key={t.id} className={`task${t.terbuka ? "" : " done"}`}>
                <span className={t.ubin}>
                  <Ikon nama={t.ikon} size={18} />
                </span>
                <div>
                  <div className="tt">{t.judul}</div>
                  <div className="tm">{t.ket}</div>
                </div>
                <div className="tright">
                  <span className={t.pil}>{t.batas}</span>
                  {t.terbuka && (
                    <button type="button" className="abtn" onClick={t.aksi}>
                      {t.tombol}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card hero">
          <div className="herotop">
            <KepalaKartu ikon="skrining" nada="dark" judul={["Skrining", "Kelas 2B"]} />
            <p className="herobig">{`${formulirSaya} dari 28`}</p>
          </div>
          <div className="herobot">
            <div>
              <div className="mini">
                <span className="ic">
                  <Ikon nama="pena" size={15} warna="#111" />
                </span>
                Formulir saya
              </div>
              <p className="heroval">{`${formulirSaya} dari 28`}</p>
              <div className="hbar">
                <span className="pu" style={{ width: `${Math.round((formulirSaya / 28) * 100)}%` }} />
              </div>
              <p className="herosub">
                {belumDiisi.length
                  ? `Belum: ${belumDiisi.map(namaDepan).join(", ")} · batas Jumat 13 Nov`
                  : "Lengkap. Terima kasih, Bu Rina."}
              </p>
            </div>
            <div>
              <div className="mini">
                <span className="ic">
                  <Ikon nama="kelompok" size={15} warna="#111" />
                </span>
                Orang tua
              </div>
              <p className="heroval">23 dari 28</p>
              <div className="hbar">
                <span className="or" style={{ width: "82%" }} />
              </div>
              <p className="herosub">Belum: Bagas, Putri, Kenzo, Omar, Vania</p>
            </div>
          </div>
          <div className="dist">
            {URUT_SEBARAN.map((k) => (
              <span key={k} className={KATEGORI[k].pil}>{`${KATEGORI[k].label} ${jumlah[k]}`}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="card tcard">
        <div className="tophead">
          <KepalaKartu ikon="kelompok" judul={["Peta", "Kelas 2B"]} />
          <Segmen label="Saring anak" pilihan={pilihanSaring} nilai={saring} onPilih={setSaring} />
        </div>
        <div className="kgrid">
          {anakTampil.map((a) => {
            const kat = KATEGORI[a.kat];
            const tanda = penandaAnak(a);
            return (
              <button
                key={a.nama}
                type="button"
                className="ktile"
                aria-label={`${a.nama}, ${kat.label}`}
                onClick={() => bukaAnak(a.nama)}
              >
                <span className={`kav ${a.kat}`}>{inisial(a.nama)}</span>
                <span className="kname">{a.nama}</span>
                <span className={kat.pil}>{kat.label}</span>
                {tanda && <span className={tanda.merah ? "kflag r" : "kflag"}>{tanda.teks}</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="row2">
        <div className="card tcard">
          <div className="tophead">
            <KepalaKartu ikon="buku" judul={["Kelas", "Kesadaran"]} />
            <span className="mut" style={{ fontSize: 12 }}>{`${sesiSelesai ? 3 : 2} dari 4 sesi selesai`}</span>
          </div>
          <ol className="lesl">
            {sesi.map((l, i) => (
              <li key={l.judul} className={`les${l.tahap === "next" ? " next" : ""}`}>
                <span className={`sno ${l.tahap}`}>{i + 1}</span>
                <div>
                  <div className="lt">{l.judul}</div>
                  <div className="ld">{l.isi}</div>
                  <div className="lfoot">
                    <span className={`pill sm ${PIL_TAHAP[l.tahap]}`}>{l.waktu}</span>
                    {l.tahap === "next" && (
                      <>
                        <button type="button" className="abtn" onClick={() => toast(PESAN_MATERI)}>
                          Unduh materi
                        </button>
                        <button type="button" className="abtn" onClick={selesaikanSesi}>
                          Tandai selesai
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="card tcard">
          <div className="tophead">
            <KepalaKartu ikon="pena" judul={["Catatan", "Observasi"]} />
            <button type="button" className="abtn" onClick={() => bukaObs()}>
              <Ikon nama="tambah" size={16} warna="var(--sp-ungu)" />
              Tambah catatan
            </button>
          </div>
          <ul className="notes">
            {semuaCatatan.slice(0, 5).map((n) => (
              <li key={n.id} className="note">
                <span className="av">{inisial(n.anak)}</span>
                <div>
                  <div className="nh">
                    <b>{n.anak}</b>
                    {` · ${n.tgl}`}
                  </div>
                  <div className="nt">{n.teks}</div>
                  <div className="ntag">
                    <span className="pill sm gray">{n.tanda}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="privacy">
            <Ikon nama="gembok" size={16} warna="var(--sp-tinta-3)" style={{ flex: "none", marginTop: 1 }} />
            Catatan hanya terlihat oleh Anda, Guru BK, dan Kepala Sekolah. Orang tua melihat ringkasan yang sudah disetujui
            Guru BK.
          </p>
        </div>
      </section>

      {laci === "anak" && (
        <Laci label="Ringkasan anak" labelTutup="Tutup ringkasan anak" onTutup={tutupLaci}>
          <KepalaLaci
            awal={
              <span className={`kav ${dilihat.kat}`} style={{ width: 48, height: 48 }}>
                {inisial(dilihat.nama)}
              </span>
            }
            judul={dilihat.nama}
            sub={`Kelas 2B · ${dilihat.usia}`}
            onTutup={tutupLaci}
          />
          <div className="qv">
            <div className="qvrow">
              <span className="qvl">Hasil skrining</span>
              <span>
                <span className={KATEGORI[dilihat.kat].pil}>{KATEGORI[dilihat.kat].label}</span>
              </span>
            </div>
            <div className="qvrow">
              <span className="qvl">Yang menonjol</span>
              <span>{dilihat.menonjol}</span>
            </div>
            <div className="qvrow">
              <span className="qvl">Tindak lanjut</span>
              <span>{dilihat.tindak}</span>
            </div>
            <div className="qvrow">
              <span className="qvl">Formulir</span>
              <span>{formulirDilihat}</span>
            </div>
            <div className="qvrow">
              <span className="qvl">Catatan terakhir</span>
              <span>{catatanTerakhir ? `${catatanTerakhir.tgl}: ${catatanTerakhir.teks}` : "Belum ada catatan."}</span>
            </div>
          </div>
          {dilihat.nama === "Raka Pratama" && !ksDicatat && (
            <p className="reco bad">
              Kasus KS-015 diteruskan ke Anda: temui Raka dan catat kronologi. Respon pertama paling lambat 12.12 hari ini.
            </p>
          )}
          <div className="dacts">
            {dilihat.kat === "belum" && (
              <button type="button" className="btnp" onClick={() => bukaIsi(dilihat.nama)}>
                Isi skrining sekarang
              </button>
            )}
            {dilihat.kat !== "belum" && (
              <button type="button" className="ghost" onClick={() => bukaObs(dilihat.nama)}>
                Catat observasi
              </button>
            )}
            {dilihat.nama === "Raka Pratama" && (
              <button type="button" className="btnp" onClick={() => pindah("anak")}>
                Buka profil lengkap
              </button>
            )}
          </div>
        </Laci>
      )}

      {laci === "isi" && (
        <Laci label="Isi skrining versi wali kelas" labelTutup="Tutup formulir" onTutup={tutupLaci}>
          <KepalaLaci
            awal={
              <div className="tile p">
                <Ikon nama="skrining" size={22} />
              </div>
            }
            judul={`Skrining ${anakIsi}`}
            sub="Versi wali kelas · tentang anak di sekolah selama sebulan terakhir · sekitar 3 menit"
            onTutup={tutupLaci}
          />
          <Segmen label="Pilih anak" pilihan={pilihanIsi} nilai={anakIsi} onPilih={setAnakIsi} style={{ alignSelf: "flex-start" }} />
          <p className="reco info">
            Pilih jawaban yang paling sesuai dengan yang Anda lihat sendiri. Tidak ada jawaban benar atau salah; hasilnya dibaca
            bersama jawaban orang tua.
          </p>
          <div>
            {BUTIR_SKRINING.map((teks, i) => {
              const keamanan = i >= AWAL_TANDA_KEAMANAN;
              return (
                <div key={i}>
                  {KEPALA_BUTIR[i] && <p className="fsec">{KEPALA_BUTIR[i]}</p>}
                  <div className="qrow">
                    <span className="qno">{i + 1}</span>
                    <span className="qt">{teks}</span>
                    <div className="qopts" role="group" aria-label={`Jawaban pernyataan ${i + 1}`}>
                      {(keamanan ? SKALA_AMAN : SKALA).map((label, j) => {
                        const aktif = jawabanIni[i] === j;
                        return (
                          <button
                            key={label}
                            type="button"
                            className={`opt${aktif ? " on" : ""}${keamanan && j === 2 && aktif ? " danger" : ""}`}
                            aria-pressed={aktif}
                            onClick={() => pilihJawaban(i, j)}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {adaTanda && (
            <p className="reco bad">
              Ada jawaban Ya pada tanda keamanan. Setelah dikirim, sistem membuat kasus baru dan meneruskannya ke Bu Laras
              (Koordinator BK) dengan batas respon 4 jam.
            </p>
          )}
          <div className="fbar">
            <span className="fprog">
              <span className="prog">
                <span className="progf" style={{ width: `${Math.round((terjawab / JUMLAH_BUTIR) * 100)}%` }} />
              </span>
              {`${terjawab} dari ${JUMLAH_BUTIR} terjawab`}
            </span>
            {/* Tetap bisa ditekan saat belum siap: pemberitahuan menjelaskan apa yang kurang. */}
            <button
              type="button"
              className={siapKirim ? "btnp" : "btnp off"}
              aria-disabled={siapKirim ? undefined : "true"}
              onClick={kirimIsi}
            >
              {labelKirim}
            </button>
          </div>
        </Laci>
      )}

      {laci === "obs" && (
        <Laci label="Catat observasi" labelTutup="Tutup catatan" onTutup={tutupLaci}>
          <KepalaLaci
            awal={
              <div className="tile p">
                <Ikon nama="pena" size={22} />
              </div>
            }
            judul="Catat observasi"
            sub="Rabu, 11 November 2026 · tulis yang Anda lihat, bukan dugaan"
            onTutup={tutupLaci}
          />
          <div className="fld">
            <label className="flabel" htmlFor="kelas-obskid">
              Anak
            </label>
            <select
              id="kelas-obskid"
              className="inp"
              value={obs.anak}
              onChange={(e) => ubahObs({ anak: e.target.value })}
            >
              {ANAK_2B.map((a) => (
                <option key={a.nama} value={a.nama}>
                  {a.nama}
                </option>
              ))}
            </select>
          </div>
          <div className="fld">
            <span className="flabel">Yang terlihat</span>
            <div className="chips" role="group" aria-label="Penanda observasi">
              {TANDA_OBSERVASI.map((g) => {
                const aktif = Boolean(obs.tanda[g]);
                return (
                  <button
                    key={g}
                    type="button"
                    className={`chip${aktif ? " on" : ""}`}
                    aria-pressed={aktif}
                    onClick={() => ubahTanda(g)}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="fld">
            <label className="flabel" htmlFor="kelas-obstxt">
              Catatan
            </label>
            <textarea
              id="kelas-obstxt"
              className="inp"
              rows={4}
              placeholder="Contoh: saat istirahat bermain sendiri di dekat perpustakaan, menolak diajak ke kantin."
              value={obs.teks}
              onChange={(e) => ubahObs({ teks: e.target.value })}
            />
          </div>
          <label className="chk">
            <input type="checkbox" checked={obs.bk} onChange={() => ubahObs({ bk: !obs.bk })} />
            <span>
              Perlu dibahas dengan Guru BK
              <span className="mut">Bu Laras menerima notifikasi dan bisa langsung menambah langkah ke rencana dukungan.</span>
            </span>
          </label>
          <div className="dacts">
            <button type="button" className="ghost" onClick={tutupLaci}>
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

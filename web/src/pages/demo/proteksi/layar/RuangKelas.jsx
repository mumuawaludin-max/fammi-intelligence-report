import { useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaKartu, Segmen } from "../komponen";
import AlurBar from "../bersama/AlurBar";
import { HurufHeart } from "../bersama/HeartKecil";
import { ANAK_2B, BELUM, HEART, LAPORAN_RAKA, RINGKAS_2B, cariAspek, metaStatus } from "../bersama/heart";
import { BELUM_BUDDY_2B, BUDDY_2B } from "../bersama/dukungan";
import { checklistMilik } from "../bersama/tindakLanjut";
import {
  AKSI_KHUSUS,
  ANAK_BELUM_DIISI,
  ANAK_OBSERVASI,
  CATATAN_AWAL,
  HARI_DEMO,
  KELOMPOK_CHECKLIST,
  PESAN_MATERI,
  PIL_TAHAP,
  SESI_KESADARAN,
  adaTandaBahaya,
  cariAnak,
  kelompokWaktu,
  kunciUrut,
  namaDepan,
  statusAlasan,
} from "./ruangKelasData";
import { HurufAspek, LaciBuddy, LaciObservasi, LaciRingkasan, LaciSkrining, PenandaAlur } from "./RuangKelasLaci";
import css from "./RuangKelas.module.css";

/** Checklist Bu Rina: butir tindak lanjut, skrining, dan penugasan kasus miliknya. */
const BUTIR_SAYA = checklistMilik("walas");
/** Butir "isi skrining" Bu Rina: tercentang sendiri begitu semua formulir wali kelas terkirim. */
const BUTIR_ISI_SKRINING = BUTIR_SAYA.find((c) => c.alur === "skrining") || null;
const NAMA_RAKA = LAPORAN_RAKA.anak.nama;
const NAMA_2B = ANAK_2B.map((a) => a.nama);
/** Urutan segmen saringan peta kelas (sesudah Semua) dan urutan warna di legendanya. */
const SARINGAN = ["waspada", "perhatian", "belum", "baik"];
const URUT_LEGENDA = ["baik", "perhatian", "waspada", "belum"];

// Ikon Material khusus layar ini: supervisor_account (kartu buddy) dan compare_arrows (pasangan).
const IKON_BUDDY =
  "M16.5 12c1.38 0 2.49-1.12 2.49-2.5S17.88 7 16.5 7C15.12 7 14 8.12 14 9.5s1.12 2.5 2.5 2.5zM9 11c1.66 0 2.99-1.34 2.99-3S10.66 5 9 5C7.34 5 6 6.34 6 8s1.34 3 3 3zm7.5 3c-1.83 0-5.5.92-5.5 2.75V19h11v-2.25c0-1.83-3.67-2.75-5.5-2.75zM9 13c-2.33 0-7 1.17-7 3.5V19h7v-2.25c0-.85.33-2.34 2.37-3.47C10.5 13.1 9.66 13 9 13z";
const IKON_PASANGAN = "M9.01 14H2v2h7.01v3L13 15l-3.99-4v3zm5.98-1v-3H22V8h-7.01V5L11 9l3.99 4z";

/** Label tombol ubin peta kelas untuk pembaca layar: status, aspek yang tidak Baik, dan aksinya. */
function labelUbin(a, kirim) {
  if (a.nama === NAMA_RAKA) return `${a.nama}, ${metaStatus(a.status).label}. Buka laporan HEART lengkap`;
  if (!a.heart) {
    if (!kirim) return `${a.nama}, ${BELUM.label}. Isi skrining`;
    return `${a.nama}, formulir terkirim${kirim.kasus ? `, laporan ${kirim.kasus}` : ""}. Buka ringkasan`;
  }
  const sorot = HEART.filter((x) => a.heart[x.id] !== "baik").map((x) => `${x.nama} ${metaStatus(a.heart[x.id]).label}`);
  return `${a.nama}, ${metaStatus(a.status).label}${sorot.length ? `. ${sorot.join(", ")}` : ""}. Buka ringkasan`;
}

/** Satu baris checklist: kotak centang, judul, anak, penanda alur, waktu, dan aksi singkat. */
function BarisChecklist({ butir: c, selesai, aksi, onCentang }) {
  const anak = c.anak ? cariAnak(c.anak) : null;
  const idCek = `rk-ck-${c.id}`;
  return (
    <li className={`ckbaris${selesai ? " beres" : ""}${c.alur === "kejadian" ? " kasus" : ""}`}>
      <input
        id={idCek}
        type="checkbox"
        className="ckcek"
        checked={selesai}
        aria-describedby={`${idCek}-ket`}
        onChange={(e) => onCentang(c, e.target.checked)}
      />
      <label htmlFor={idCek} className="ckjudul">
        {c.judul}
      </label>
      <span className="ckmeta" id={`${idCek}-ket`}>
        <span className="ckanak">
          {c.aspek && anak?.heart ? <HurufAspek idAspek={c.aspek} status={anak.heart[c.aspek]} /> : null}
          <span className="cknama">{c.anak || "Kelas 2B"}</span>
        </span>
        <span className="ckalur">
          <PenandaAlur alur={c.alur} />
        </span>
        <span className="ckwaktu">
          <Ikon nama="jam" size={13} />
          {c.waktu}
        </span>
      </span>
      {aksi && !selesai ? (
        <button type="button" className="abtn ckaksi" onClick={aksi.jalankan}>
          {aksi.label}
          <Ikon nama="kanan" size={15} />
        </button>
      ) : null}
    </li>
  );
}

/**
 * Layar Ruang wali kelas (Bu Rina, wali kelas 2B, 28 anak), langkah Checklist di alur pencegahan.
 * Urutannya: checklist milik Bu Rina (termasuk penugasan kasus KS-015), peta kelas HEART dengan
 * saringan status, peta buddy kelas, lalu kelas kesadaran dan catatan observasi. Empat laci:
 * formulir skrining HEART versi wali kelas, ringkasan satu anak, tetapkan buddy, catat observasi.
 * Centang checklist hidup di konteks prototipe (terlihat di layar lain); sisanya state layar ini.
 */
export default function RuangKelas() {
  const { pindah, toast, beriTahu, centang, ubahCentang, checklistTambahan, buatLaporan } = useProteksi();
  // Butir dari tindak lanjut yang disusun Guru BK di Skrining selama demo ikut masuk checklist Bu Rina.
  const butirSaya = [...BUTIR_SAYA, ...checklistTambahan.filter((c) => c.oleh === "walas")];
  const [saring, setSaring] = useState("semua");
  const [laci, setLaci] = useState(null); // { jenis: "isi" | "anak" | "buddy" | "obs", nama }
  const [jawaban, setJawaban] = useState({}); // { nama: { idLangkah: { indeks: pilihan } } }
  const [terkirim, setTerkirim] = useState({}); // { nama: { kasus } }
  const [buddyBaru, setBuddyBaru] = useState([]);
  const [selesaiTerbuka, setSelesaiTerbuka] = useState(false);
  const [sesiSelesai, setSesiSelesai] = useState(false);
  const [catatanBaru, setCatatanBaru] = useState([]);
  const [semuaCatatan, setSemuaCatatan] = useState(false);
  // Butir yang sudah selesai saat layar dibuka masuk kelompok Selesai. Butir yang dicentang
  // sesudahnya tetap di tempatnya (dicoret) supaya baris tidak melompat dan fokus tidak hilang.
  const [selesaiAwal] = useState(() => new Set(butirSaya.filter((c) => centang[c.id]).map((c) => c.id)));

  const tutupLaci = () => setLaci(null);
  const bukaIsi = (nama) => setLaci({ jenis: "isi", nama });
  const bukaAnak = (nama) => setLaci({ jenis: "anak", nama });
  const bukaBuddy = (nama) => setLaci({ jenis: "buddy", nama });
  const bukaObs = (nama) => setLaci({ jenis: "obs", nama: nama || NAMA_RAKA });

  const belumDiisi = ANAK_BELUM_DIISI.filter((n) => !terkirim[n]);
  const pasangan = [...buddyBaru, ...BUDDY_2B];
  const belumBuddy = BELUM_BUDDY_2B.filter((b) => !buddyBaru.some((p) => p.anak === b.anak));
  const perluBuddy = (nama) => belumBuddy.some((b) => b.anak === nama);
  const catatan = [...catatanBaru, ...CATATAN_AWAL];

  // ---- checklist ----
  const jumlahSelesai = butirSaya.filter((c) => centang[c.id]).length;
  const kelompok = Object.fromEntries(KELOMPOK_CHECKLIST.map((k) => [k.id, []]));
  for (const c of butirSaya) kelompok[selesaiAwal.has(c.id) ? "selesai" : kelompokWaktu(c)].push(c);
  for (const daftar of Object.values(kelompok)) daftar.sort((a, b) => kunciUrut(a) - kunciUrut(b));

  function centangButir(c, selesai) {
    ubahCentang(c.id, selesai);
    if (!selesai) {
      toast(`Dibuka lagi: ${c.judul}`);
      return;
    }
    toast(`Selesai: ${c.judul}. Bu Laras diberi tahu.`);
    beriTahu({
      peran: "bk",
      ikon: "ceklis",
      nada: "ok",
      judul: "Bu Rina menyelesaikan checklist",
      isi: c.judul,
      tujuan: { layar: "kelas", aksi: { jenis: "gulir", id: "checklist" } },
    });
  }

  function aksiButir(c) {
    if (c.alur === "kejadian" && c.kasus) {
      return { label: "Buka kasus", jalankan: () => pindah("kasus", { jenis: "kasus", id: c.kasus }) };
    }
    if (c.alur === "skrining") return belumDiisi.length ? { label: "Isi skrining", jalankan: () => bukaIsi(belumDiisi[0]) } : null;
    const khusus = AKSI_KHUSUS[c.id];
    if (khusus === "buddy") return perluBuddy(c.anak) ? { label: "Tetapkan buddy", jalankan: () => bukaBuddy(c.anak) } : null;
    if (khusus === "observasi") return { label: "Catat observasi", jalankan: () => bukaObs(ANAK_OBSERVASI[0]) };
    if (c.anak === NAMA_RAKA) {
      return { label: "Lihat tindak lanjut", jalankan: () => pindah("anak", { jenis: "gulir", id: "tindak" }) };
    }
    if (c.anak) return { label: "Lihat ringkasan", jalankan: () => bukaAnak(c.anak) };
    return null;
  }

  // ---- formulir skrining ----
  function jawab(nama, idLangkah, i, j) {
    setJawaban((lama) => {
      const anak = lama[nama] || {};
      return { ...lama, [nama]: { ...anak, [idLangkah]: { ...(anak[idLangkah] || {}), [i]: j } } };
    });
  }

  function kirimSkrining(nama) {
    const tanda = adaTandaBahaya(jawaban[nama]);
    // Jawaban Ya pada pertanyaan keamanan langsung jadi laporan kejadian di antrean triage layar
    // Kasus (jembatan alur pencegahan -> alur kejadian). Usulan tingkat Sedang, sama dengan Panduan
    // dan KS-012: tanda dari skrining belum terverifikasi, Guru BK menaikkan tingkat saat triage.
    const kasus = tanda
      ? buatLaporan({
          lapor: {
            jenis: "Tanda bahaya dari skrining",
            nama,
            kelas: "2B",
            lokasi: "Sekolah",
            kapan: "Hari ini",
            cerita: `Jawaban Ya pada pertanyaan keamanan di formulir skrining HEART wali kelas untuk ${nama}.`,
            jawaban: [0, 0, 0, 0, 0, 1],
          },
          sumber: "Bu Rina (wali kelas) · skrining HEART",
          tambahan: { dariSkrining: true },
        })
      : null;
    const baru = { ...terkirim, [nama]: { kasus } };
    const sisa = ANAK_BELUM_DIISI.filter((n) => !baru[n]);
    const depan = namaDepan(nama);
    setTerkirim(baru);
    if (sisa.length === 0 && BUTIR_ISI_SKRINING) ubahCentang(BUTIR_ISI_SKRINING.id, true);
    setLaci(sisa.length ? { jenis: "isi", nama: sisa[0] } : null);
    beriTahu(
      tanda
        ? {
            peran: "bk",
            ikon: "peringatan",
            nada: "red",
            judul: `Laporan baru ${kasus} dari skrining ${depan}`,
            isi: "Jawaban Ya pada pertanyaan keamanan. Belum ditriage.",
            tujuan: { layar: "kasus", aksi: { jenis: "kasus", id: kasus } },
          }
        : {
            peran: "bk",
            ikon: "skrining",
            nada: "p",
            judul: `Skrining HEART ${depan} masuk`,
            isi: "Formulir wali kelas 2B dari Bu Rina, menunggu analisis.",
            tujuan: { layar: "skrining" },
          },
    );
    const akhir = sisa.length === 0 ? " Checklist skrining selesai." : "";
    toast(
      tanda
        ? `Skrining ${nama} terkirim. Ada tanda bahaya: laporan ${kasus} dibuat dan diteruskan ke Bu Laras.${akhir}`
        : `Skrining ${nama} terkirim. Hasil HEART keluar setelah dianalisis tim ahli Fammi.${akhir}`,
    );
  }

  // ---- buddy ----
  function tetapkanBuddy(data, calon) {
    const butir = BUTIR_SAYA.find((c) => AKSI_KHUSUS[c.id] === "buddy" && c.anak === data.anak);
    setBuddyBaru((l) => [{ anak: data.anak, buddy: calon, sejak: HARI_DEMO.sejak, alasan: data.alasan, baru: true }, ...l]);
    if (butir) ubahCentang(butir.id, true);
    setLaci(null);
    toast(`${calon} menjadi buddy ${namaDepan(data.anak)}. Checklist ditandai selesai, Bu Laras diberi tahu.`);
    beriTahu({
      peran: "bk",
      ikon: "kelompok",
      nada: "ok",
      judul: `Bu Rina menetapkan buddy untuk ${namaDepan(data.anak)}`,
      isi: `${calon} menemani ${namaDepan(data.anak)} (${data.alasan}).`,
      tujuan: { layar: "kelas", aksi: { jenis: "gulir", id: "buddy" } },
    });
  }

  // ---- peta kelas ----
  const anakTampil = ANAK_2B.filter((a) => saring === "semua" || a.status === saring);
  const pilihanSaring = [
    { id: "semua", label: `Semua (${RINGKAS_2B.total})` },
    ...SARINGAN.map((id) => ({ id, label: `${metaStatus(id).label} (${RINGKAS_2B[id]})` })),
  ];

  function klikAnak(a) {
    if (a.nama === NAMA_RAKA) pindah("anak", { jenis: "gulir", id: "hasil" });
    else if (!a.heart && !terkirim[a.nama]) bukaIsi(a.nama);
    else bukaAnak(a.nama);
  }

  // ---- kelas kesadaran ----
  const sesi = SESI_KESADARAN.map((l) =>
    l.tahap === "next" && sesiSelesai ? { ...l, tahap: "done", waktu: l.waktuSelesai } : l,
  );
  const sesiBeres = sesi.filter((l) => l.tahap === "done").length;

  function selesaikanSesi(l, nomor) {
    setSesiSelesai(true);
    toast(`Sesi "${l.judul}" ditandai selesai. Ringkasannya dikirim ke orang tua kelas 2B.`);
    beriTahu({
      peran: "ortu",
      ikon: "buku",
      nada: "p",
      judul: `Kelas kesadaran 2B: sesi ${nomor} selesai`,
      isi: `${l.judul}. Lihat ringkasan dan cara membahasnya di rumah.`,
      tujuan: { layar: "orangtua" },
    });
  }

  // ---- catatan observasi ----
  function simpanObs(isian) {
    const baru = { id: `baru-${catatanBaru.length + 1}`, tgl: HARI_DEMO.label, ...isian };
    setCatatanBaru((l) => [baru, ...l]);
    setLaci(null);
    toast(`Catatan untuk ${isian.anak} tersimpan${isian.bk ? ". Bu Laras diberi tahu." : "."}`);
    if (isian.bk) {
      beriTahu({
        peran: "bk",
        ikon: "pena",
        nada: "p",
        judul: `Catatan observasi ${namaDepan(isian.anak)} perlu dibahas`,
        isi: isian.teks,
        tujuan: { layar: "kelas", aksi: { jenis: "gulir", id: "observasi" } },
      });
    }
  }

  const catatanTampil = semuaCatatan ? catatan : catatan.slice(0, 3);
  const dataBuddy = laci?.jenis === "buddy" ? belumBuddy.find((b) => b.anak === laci.nama) : null;

  return (
    <div className={`isi ${css.layar}`}>
      <AlurBar alur="cegah" aktif="checklist" />

      <section className="titlerow">
        <div>
          <p className="eyebrow">{`Kelas 2B · ${RINGKAS_2B.total} anak`}</p>
          <h1 className="h1">Selamat pagi, Bu Rina</h1>
          <p className="lead">Kerjakan checklist dari tenggat terdekat; peta kelas menunjukkan hasil HEART tiap anak.</p>
        </div>
        <div className="tbtns">
          <button type="button" className="ghost" onClick={() => bukaObs()}>
            <Ikon nama="pena" size={17} />
            Catat observasi
          </button>
          {belumDiisi.length > 0 && (
            <button type="button" className="btnp" onClick={() => bukaIsi(belumDiisi[0])}>
              <Ikon nama="skrining" size={17} />
              {`Isi skrining (${belumDiisi.length} anak)`}
            </button>
          )}
        </div>
      </section>

      {/* ---------- checklist ---------- */}
      <section className="card tcard" data-bagian="checklist" aria-label="Checklist saya">
        <div className="tophead">
          <KepalaKartu ikon="ceklis" judul="Checklist saya" />
          <span className="ckkemajuan">
            <span className="ckbar" aria-hidden="true">
              <span style={{ width: `${Math.round((jumlahSelesai / butirSaya.length) * 100)}%` }} />
            </span>
            {`${jumlahSelesai} dari ${butirSaya.length} selesai`}
          </span>
        </div>
        {KELOMPOK_CHECKLIST.map((k) => {
          const daftar = kelompok[k.id];
          if (daftar.length === 0) return null;
          const lipat = k.id === "selesai";
          const idDaftar = `rk-ck-${k.id}`;
          return (
            <div key={k.id} className="ckgrup">
              {lipat ? (
                <button
                  type="button"
                  className="ckkepala cktoggle"
                  aria-expanded={selesaiTerbuka}
                  aria-controls={idDaftar}
                  onClick={() => setSelesaiTerbuka((v) => !v)}
                >
                  <Ikon nama="turun" size={16} className="ckpanah" />
                  {k.label}
                  <span className="ckjml">{daftar.length}</span>
                </button>
              ) : (
                <h3 className="ckkepala" id={`${idDaftar}-judul`}>
                  {k.label}
                  <span className="ckjml">{daftar.length}</span>
                </h3>
              )}
              <ul
                className="cklist"
                id={idDaftar}
                hidden={lipat && !selesaiTerbuka}
                aria-labelledby={lipat ? undefined : `${idDaftar}-judul`}
                aria-label={lipat ? k.label : undefined}
              >
                {daftar.map((c) => (
                  <BarisChecklist key={c.id} butir={c} selesai={Boolean(centang[c.id])} aksi={aksiButir(c)} onCentang={centangButir} />
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {/* ---------- peta kelas ---------- */}
      <section className="card tcard" data-bagian="peta" aria-label="Peta kelas 2B HEART">
        <div className="tophead">
          <KepalaKartu ikon="kelompok" judul="Peta kelas 2B · HEART" />
          <Segmen label="Saring anak menurut status" pilihan={pilihanSaring} nilai={saring} onPilih={setSaring} />
        </div>
        <div className="pklegenda">
          <span className="pkkode">
            {HEART.map((a) => (
              <span key={a.id}>
                <b>{a.kode}</b>
                {a.nama}
              </span>
            ))}
          </span>
          <span className="pkwarna">
            {URUT_LEGENDA.map((s) => (
              <span key={s}>
                <i className={s} aria-hidden="true" />
                {metaStatus(s).label}
              </span>
            ))}
          </span>
        </div>
        <ul className="pkgrid">
          {anakTampil.map((a) => {
            const kirim = terkirim[a.nama];
            const raka = a.nama === NAMA_RAKA;
            return (
              <li key={a.nama}>
                <button type="button" className={`pktile ${a.status}`} aria-label={labelUbin(a, kirim)} onClick={() => klikAnak(a)}>
                  <span className="pkatas">
                    <span className={`pkav ${a.status}`}>{a.inisial}</span>
                    <span className="pknama">{a.nama}</span>
                    {raka && <Ikon nama="sebelah" size={15} className="pkpanah" />}
                  </span>
                  {a.heart ? (
                    <HurufHeart heart={a.heart} />
                  ) : kirim ? (
                    <span className={`pkchip${kirim.kasus ? " bahaya" : ""}`}>
                      <Ikon nama={kirim.kasus ? "peringatan" : "sukses"} size={13} />
                      {kirim.kasus ? `Laporan ${kirim.kasus}` : "Terkirim"}
                    </span>
                  ) : (
                    <span className="pkchip ajak">
                      <Ikon nama="pena" size={13} />
                      Isi skrining
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- peta buddy ---------- */}
      <section className="card tcard" data-bagian="buddy" aria-label="Peta buddy kelas">
        <div className="tophead">
          <KepalaKartu d={IKON_BUDDY} judul="Peta buddy kelas" />
          <span className="ckkemajuan">
            {`${pasangan.length} pasangan`}
            {belumBuddy.length > 0 && ` · ${belumBuddy.length} anak belum punya buddy`}
          </span>
        </div>
        {belumBuddy.map((b) => {
          const anak = cariAnak(b.anak);
          return (
            <div key={b.anak} className="bdbelum">
              <span className={`pkav ${anak?.status}`} aria-hidden="true">
                {anak?.inisial}
              </span>
              <div className="bdbelumteks">
                <p>
                  <b>{b.anak}</b>
                  {" belum punya buddy "}
                  <span className={`pill sm ${metaStatus(statusAlasan(b.alasan)).nada}`}>{b.alasan}</span>
                </p>
                <p className="mut">{`Calon yang disarankan: ${b.calon.join(", ")}. Dikerjakan Bu Rina, tenggat Jumat 13 Nov.`}</p>
              </div>
              <button type="button" className="btnp" onClick={() => bukaBuddy(b.anak)}>
                <Ikon nama="tambah" size={16} />
                Tetapkan buddy
              </button>
            </div>
          );
        })}
        <ul className="bdgrid">
          {pasangan.map((p) => {
            const anak = cariAnak(p.anak);
            const buddy = cariAnak(p.buddy);
            return (
              <li key={p.anak} className={`bdpasang${p.baru ? " baru" : ""}`}>
                <span className="bdnama">
                  <span className={`pkav ${anak?.status}`} aria-hidden="true">
                    {anak?.inisial}
                  </span>
                  <span className="bdorang">{p.anak}</span>
                  <Ikon d={IKON_PASANGAN} size={16} className="bdpanah" label="berpasangan dengan" />
                  <span className={`pkav ${buddy?.status}`} aria-hidden="true">
                    {buddy?.inisial}
                  </span>
                  <span className="bdorang">{p.buddy}</span>
                </span>
                <span className="bdmeta">
                  <span className={`pill sm ${metaStatus(statusAlasan(p.alasan)).nada}`}>{p.alasan}</span>
                  <span>{`sejak ${p.sejak}`}</span>
                  {p.baru && <span className="pill sm mid">Baru</span>}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="bdcatat">
          Buddy menemani saat kerja kelompok dan istirahat. Pasangan ditinjau bersama Bu Laras pada evaluasi 4 minggu.
        </p>
      </section>

      {/* ---------- kelas kesadaran dan catatan observasi ---------- */}
      <div className="row2">
        <section className="card tcard" data-bagian="kesadaran" aria-label="Kelas kesadaran">
          <div className="tophead">
            <KepalaKartu ikon="buku" judul="Kelas kesadaran" />
            <span className="ckkemajuan">{`${sesiBeres} dari ${sesi.length} sesi selesai`}</span>
          </div>
          <ol className="kzlist">
            {sesi.map((l, i) => (
              <li key={l.judul} className={`kzbaris ${l.tahap}`}>
                <span className={`kzno ${l.tahap}`} aria-hidden="true">
                  {l.tahap === "done" ? <Ikon nama="centang" size={14} /> : i + 1}
                </span>
                <div className="kzisi">
                  <p className="kzjudul">{l.judul}</p>
                  <p className="kzaspek">
                    {l.keamanan
                      ? "Keamanan diri, di luar HEART"
                      : `HEART: ${l.aspek.map((id) => cariAspek(id)?.nama).join(", ")}`}
                  </p>
                  {l.tahap === "next" && (
                    <>
                      <p className="kzket">{l.isi}</p>
                      <div className="kzaksi">
                        <button type="button" className="abtn" onClick={() => toast(PESAN_MATERI)}>
                          <Ikon nama="unduh" size={15} />
                          Unduh materi
                        </button>
                        <button type="button" className="abtn" onClick={() => selesaikanSesi(l, i + 1)}>
                          <Ikon nama="centang" size={15} />
                          Tandai selesai
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <span className={`pill sm ${PIL_TAHAP[l.tahap]}`}>{l.waktu}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="card tcard" data-bagian="observasi" aria-label="Catatan observasi">
          <div className="tophead">
            <KepalaKartu ikon="pena" judul="Catatan observasi" />
            <button type="button" className="abtn" onClick={() => bukaObs()}>
              <Ikon nama="tambah" size={16} warna="var(--sp-ungu)" />
              Tambah catatan
            </button>
          </div>
          <ul className="oblist">
            {catatanTampil.map((n) => (
              <li key={n.id} className="obbaris">
                <span className="av" aria-hidden="true">
                  {cariAnak(n.anak)?.inisial}
                </span>
                <div className="obisi">
                  <p className="obkepala">
                    <b>{n.anak}</b>
                    {` · ${n.tgl}`}
                  </p>
                  <p className="obteks">{n.teks}</p>
                  <p className="obtag">
                    {n.aspek.map((id) => (
                      <span key={id} className="pill sm gray">
                        {cariAspek(id)?.nama}
                      </span>
                    ))}
                    {n.membaik && <span className="pill sm ok">Membaik</span>}
                    {n.bk && <span className="pill sm mid">Dibahas dengan Guru BK</span>}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {catatan.length > 3 && (
            <button type="button" className="obsemua" aria-expanded={semuaCatatan} onClick={() => setSemuaCatatan((v) => !v)}>
              {semuaCatatan ? "Tampilkan 3 terbaru" : `Tampilkan semua (${catatan.length})`}
            </button>
          )}
          <p className="obprivasi">
            <Ikon nama="gembok" size={14} />
            Hanya terlihat oleh Anda, Guru BK, dan Kepala Sekolah. Orang tua menerima ringkasan yang disetujui Guru BK.
          </p>
        </section>
      </div>

      {laci?.jenis === "isi" && (
        <LaciSkrining
          anakIsi={laci.nama}
          pilihanAnak={ANAK_BELUM_DIISI}
          jawaban={jawaban[laci.nama] || {}}
          terkirim={terkirim[laci.nama] || null}
          sudahDikirim={(n) => Boolean(terkirim[n])}
          onPilihAnak={(n) => bukaIsi(n)}
          onJawab={(idLangkah, i, j) => jawab(laci.nama, idLangkah, i, j)}
          onKirim={kirimSkrining}
          onTutup={tutupLaci}
          toast={toast}
        />
      )}

      {laci?.jenis === "anak" && (
        <LaciRingkasan
          nama={laci.nama}
          buddy={pasangan.find((p) => p.anak === laci.nama || p.buddy === laci.nama) || null}
          butir={butirSaya.filter((c) => c.anak === laci.nama)}
          centang={centang}
          catatan={catatan.find((n) => n.anak === laci.nama) || null}
          terkirim={terkirim[laci.nama] || null}
          perluBuddy={perluBuddy(laci.nama)}
          onIsi={() => bukaIsi(laci.nama)}
          onObs={() => bukaObs(laci.nama)}
          onBuddy={() => bukaBuddy(laci.nama)}
          onRaka={() => pindah("anak", { jenis: "gulir", id: "hasil" })}
          onTutup={tutupLaci}
        />
      )}

      {dataBuddy && <LaciBuddy data={dataBuddy} onTetapkan={(calon) => tetapkanBuddy(dataBuddy, calon)} onTutup={tutupLaci} />}

      {laci?.jenis === "obs" && <LaciObservasi anakAwal={laci.nama} daftarAnak={NAMA_2B} onSimpan={simpanObs} onTutup={tutupLaci} />}
    </div>
  );
}

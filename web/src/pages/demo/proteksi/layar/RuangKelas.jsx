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
import { Cincin, Donat, Legenda } from "../bersama/Grafik";
import { WARNA_STATUS } from "../bersama/grafikAlat";
import css from "./RuangKelas.module.css";

/** Sebaran status anak kelas 2B untuk donat. */
const DATA_KELAS = [
  { id: "baik", label: "Aman", nilai: RINGKAS_2B.baik, warna: WARNA_STATUS.baik },
  { id: "perhatian", label: "Perlu Diperhatikan", nilai: RINGKAS_2B.perhatian, warna: WARNA_STATUS.perhatian },
  { id: "waspada", label: "Perlu Perhatian Lebih", nilai: RINGKAS_2B.waspada, warna: WARNA_STATUS.waspada },
  { id: "belum", label: "Belum ikut screening", nilai: RINGKAS_2B.belum, warna: WARNA_STATUS.belum },
];

/** Checklist Bu Rina: butir tindak lanjut, skrining, dan tugas kasus miliknya. */
const BUTIR_SAYA = checklistMilik("walas");
/** Butir "isi skrining" Bu Rina: tercentang sendiri begitu semua formulir wali kelas terkirim. */
const BUTIR_ISI_SKRINING = BUTIR_SAYA.find((c) => c.alur === "skrining") || null;
const NAMA_RAKA = LAPORAN_RAKA.anak.nama;
const NAMA_2B = ANAK_2B.map((a) => a.nama);
const ANAK_WASPADA = ANAK_2B.filter((a) => a.status === "waspada");
/** Urutan segmen saringan peta kelas (sesudah Semua) dan urutan warna di legendanya. */
const SARINGAN = ["waspada", "perhatian", "belum", "baik"];
const URUT_LEGENDA = ["baik", "perhatian", "waspada", "belum"];
/** Kelompok checklist yang terbuka saat layar dibuka: yang jatuh tempo minggu ini. */
const GRUP_TERBUKA_AWAL = { hari: true, minggu: true };
/** Id bagian rincian kelas. Sama dengan target aksi gulir dari notifikasi ({ jenis: "gulir", id }). */
const ID_RINCIAN = ["peta", "buddy", "kesadaran", "observasi"];

// Ikon Material khusus layar ini: supervisor_account (pendamping sebaya) dan compare_arrows (pasangan).
const IKON_PENDAMPING =
  "M16.5 12c1.38 0 2.49-1.12 2.49-2.5S17.88 7 16.5 7C15.12 7 14 8.12 14 9.5s1.12 2.5 2.5 2.5zM9 11c1.66 0 2.99-1.34 2.99-3S10.66 5 9 5C7.34 5 6 6.34 6 8s1.34 3 3 3zm7.5 3c-1.83 0-5.5.92-5.5 2.75V19h11v-2.25c0-1.83-3.67-2.75-5.5-2.75zM9 13c-2.33 0-7 1.17-7 3.5V19h7v-2.25c0-.85.33-2.34 2.37-3.47C10.5 13.1 9.66 13 9 13z";
const IKON_PASANGAN = "M9.01 14H2v2h7.01v3L13 15l-3.99-4v3zm5.98-1v-3H22V8h-7.01V5L11 9l3.99 4z";

/** Label tombol ubin peta kelas untuk pembaca layar: status, aspek yang tidak Baik, dan aksinya. */
function labelUbin(a, kirim) {
  if (a.nama === NAMA_RAKA) return `${a.nama}, ${metaStatus(a.status).label}. Buka laporan HEART lengkap`;
  if (!a.heart) {
    if (!kirim) return `${a.nama}, ${BELUM.label}. Isi screening`;
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
      {/* Kotak centang buatan sendiri tanpa garis tepi: input asli tetap ada untuk papan ketik dan
          pembaca layar, kotak di sebelahnya hanya tampilan. */}
      <label className="ckkotak" htmlFor={idCek}>
        <input
          id={idCek}
          type="checkbox"
          className="ckcek"
          checked={selesai}
          aria-describedby={`${idCek}-ket`}
          onChange={(e) => onCentang(c, e.target.checked)}
        />
        <span className="ckbox" aria-hidden="true">
          <Ikon nama="centang" size={13} />
        </span>
      </label>
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
 * Urutannya mengikuti hari Bu Rina: yang perlu segera (tugas kasus, laporan dari skrining, anak
 * Waspada), lalu checklist yang dicentang tiap hari, lalu rincian kelas yang dibuka lewat menu
 * (peta kelas, pendamping sebaya, kelas kesadaran, catatan pengamatan). Empat laci: formulir
 * skrining HEART versi wali kelas, ringkasan satu anak, tetapkan pendamping, catat pengamatan.
 * Centang checklist hidup di konteks prototipe (terlihat di layar lain); sisanya state layar ini.
 */
export default function RuangKelas() {
  const { pindah, aksi, toast, beriTahu, centang, ubahCentang, checklistTambahan, buatLaporan } = useProteksi();
  // Butir dari tindak lanjut yang disusun Guru BK di Skrining selama demo ikut masuk checklist Bu Rina.
  const butirSaya = [...BUTIR_SAYA, ...checklistTambahan.filter((c) => c.oleh === "walas")];
  const [saring, setSaring] = useState("semua");
  const [laci, setLaci] = useState(null); // { jenis: "isi" | "anak" | "buddy" | "obs", nama }
  const [jawaban, setJawaban] = useState({}); // { nama: { idLangkah: { indeks: pilihan } } }
  const [terkirim, setTerkirim] = useState({}); // { nama: { kasus } }
  const [buddyBaru, setBuddyBaru] = useState([]);
  const [grupTerbuka, setGrupTerbuka] = useState(GRUP_TERBUKA_AWAL);
  const [sesiSelesai, setSesiSelesai] = useState(false);
  const [catatanBaru, setCatatanBaru] = useState([]);
  const [semuaCatatan, setSemuaCatatan] = useState(false);
  const [rincian, setRincian] = useState(null); // id ID_RINCIAN yang terbuka, atau null
  const [aksiDibaca, setAksiDibaca] = useState(null);
  // Butir yang sudah selesai saat layar dibuka masuk kelompok Selesai. Butir yang dicentang
  // sesudahnya tetap di tempatnya (dicoret) supaya baris tidak melompat dan fokus tidak hilang.
  const [selesaiAwal] = useState(() => new Set(butirSaya.filter((c) => centang[c.id]).map((c) => c.id)));

  // Notifikasi yang menuju salah satu rincian kelas ({ jenis: "gulir", id: "buddy" }) membuka
  // rinciannya. SekolahProteksi yang menggulir ke [data-bagian]; di sini cukup membuka isinya.
  // Dibaca saat render (bukan efek) supaya bagian sudah terbuka sebelum digulir.
  if (aksi !== aksiDibaca) {
    setAksiDibaca(aksi);
    if (aksi?.jenis === "gulir" && ID_RINCIAN.includes(aksi.id)) setRincian(aksi.id);
  }

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

  // ---- perlu segera ----
  const kasusSaya = butirSaya.filter((c) => c.alur === "kejadian" && c.kasus && !centang[c.id]);
  const laporanSkrining = Object.entries(terkirim)
    .filter(([, v]) => v.kasus)
    .map(([nama, v]) => ({ nama, kasus: v.kasus }));

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
    if (c.alur === "skrining") return belumDiisi.length ? { label: "Isi screening", jalankan: () => bukaIsi(belumDiisi[0]) } : null;
    const khusus = AKSI_KHUSUS[c.id];
    if (khusus === "buddy") return perluBuddy(c.anak) ? { label: "Pilih pendamping", jalankan: () => bukaBuddy(c.anak) } : null;
    if (khusus === "observasi") return { label: "Catat pengamatan", jalankan: () => bukaObs(ANAK_OBSERVASI[0]) };
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
    // Jawaban Ya pada pertanyaan keamanan langsung jadi laporan kejadian yang menunggu cek awal di
    // layar Kasus (jembatan alur pencegahan -> alur kejadian). Usulan tingkat Sedang, sama dengan
    // Panduan dan KS-012: tanda dari skrining belum terverifikasi, Guru BK menaikkan tingkat saat cek awal.
    const kasus = tanda
      ? buatLaporan({
          lapor: {
            jenis: "Tanda bahaya dari screening",
            nama,
            kelas: "2B",
            lokasi: "Sekolah",
            kapan: "Hari ini",
            cerita: `Jawaban Ya pada pertanyaan keamanan di formulir screening HEART wali kelas untuk ${nama}.`,
            jawaban: [0, 0, 0, 0, 0, 1],
          },
          sumber: "Bu Rina (wali kelas) · screening HEART",
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
            judul: `Laporan baru ${kasus} dari screening ${depan}`,
            isi: "Jawaban Ya pada pertanyaan keamanan. Menunggu dicek.",
            tujuan: { layar: "kasus", aksi: { jenis: "kasus", id: kasus } },
          }
        : {
            peran: "bk",
            ikon: "skrining",
            nada: "p",
            judul: `Screening HEART ${depan} masuk`,
            isi: "Formulir wali kelas 2B dari Bu Rina, menunggu analisis.",
            tujuan: { layar: "skrining" },
          },
    );
    const akhir = sisa.length === 0 ? " Checklist screening selesai." : "";
    toast(
      tanda
        ? `Screening ${nama} terkirim. Ada tanda bahaya: laporan ${kasus} dibuat dan diteruskan ke Bu Laras.${akhir}`
        : `Screening ${nama} terkirim. Hasil HEART keluar setelah dianalisis tim ahli Fammi.${akhir}`,
    );
  }

  // ---- pendamping sebaya ----
  function tetapkanBuddy(data, calon) {
    const butir = BUTIR_SAYA.find((c) => AKSI_KHUSUS[c.id] === "buddy" && c.anak === data.anak);
    setBuddyBaru((l) => [{ anak: data.anak, buddy: calon, sejak: HARI_DEMO.sejak, alasan: data.alasan, baru: true }, ...l]);
    if (butir) ubahCentang(butir.id, true);
    setLaci(null);
    toast(`${calon} jadi teman pendamping ${namaDepan(data.anak)}. Checklist selesai, Bu Laras diberi tahu.`);
    beriTahu({
      peran: "bk",
      ikon: "kelompok",
      nada: "ok",
      judul: `Bu Rina memilih teman pendamping untuk ${namaDepan(data.anak)}`,
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
    toast(`Sesi "${l.judul}" selesai. Ringkasannya dikirim ke orang tua kelas 2B.`);
    beriTahu({
      peran: "ortu",
      ikon: "buku",
      nada: "p",
      judul: `Kelas kesadaran 2B: sesi ${nomor} selesai`,
      isi: `${l.judul}. Lihat ringkasan dan cara membahasnya di rumah.`,
      tujuan: { layar: "orangtua" },
    });
  }

  // ---- catatan pengamatan ----
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
        judul: `Catatan pengamatan ${namaDepan(isian.anak)} perlu dibahas`,
        isi: isian.teks,
        tujuan: { layar: "kelas", aksi: { jenis: "gulir", id: "observasi" } },
      });
    }
  }

  const catatanTampil = semuaCatatan ? catatan : catatan.slice(0, 3);
  const dataBuddy = laci?.jenis === "buddy" ? belumBuddy.find((b) => b.anak === laci.nama) : null;

  // ---- rincian kelas: menu ringkas, isi dibuka lewat klik ----
  const menuRincian = [
    {
      id: "peta",
      ikon: "kelompok",
      judul: "Peta kelas",
      ket: `${RINGKAS_2B.total} anak · ${RINGKAS_2B.waspada} Perlu Perhatian Lebih · ${RINGKAS_2B.perhatian} Perlu Diperhatikan`,
    },
    {
      id: "buddy",
      d: IKON_PENDAMPING,
      judul: "Pendamping sebaya",
      ket: `${pasangan.length} pasangan${belumBuddy.length ? ` · ${belumBuddy.length} anak menunggu` : ""}`,
      tanda: belumBuddy.length > 0,
    },
    { id: "kesadaran", ikon: "buku", judul: "Kelas kesadaran", ket: `${sesiBeres} dari ${sesi.length} sesi selesai` },
    { id: "observasi", ikon: "pena", judul: "Catatan pengamatan", ket: `${catatan.length} catatan · terbaru ${catatan[0].tgl}` },
  ];
  const rincianAktif = menuRincian.find((m) => m.id === rincian) || null;

  function isiRincian(id) {
    if (id === "peta") {
      return (
        <>
          <Segmen label="Saring anak menurut status" pilihan={pilihanSaring} nilai={saring} onPilih={setSaring} style={{ alignSelf: "flex-start" }} />
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
              return (
                <li key={a.nama}>
                  <button type="button" className={`pktile ${a.status}`} aria-label={labelUbin(a, kirim)} onClick={() => klikAnak(a)}>
                    <span className="pkatas">
                      <span className={`pkav ${a.status}`}>{a.inisial}</span>
                      <span className="pknama">{a.nama}</span>
                      {a.nama === NAMA_RAKA && <Ikon nama="sebelah" size={15} className="pkpanah" />}
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
                        Isi screening
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      );
    }

    if (id === "buddy") {
      return (
        <>
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
                    {" belum punya teman pendamping "}
                    <span className={`pill sm ${metaStatus(statusAlasan(b.alasan)).nada}`}>{b.alasan}</span>
                  </p>
                  <p className="mut">{`Calon: ${b.calon.join(", ")}. Paling lambat Jumat 13 Nov.`}</p>
                </div>
                <button type="button" className="btnp" onClick={() => bukaBuddy(b.anak)}>
                  <Ikon nama="tambah" size={16} />
                  Pilih pendamping
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
                    <Ikon d={IKON_PASANGAN} size={16} className="bdpanah" label="ditemani" />
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
          <p className="bdcatat">Pendamping menemani saat kerja kelompok dan istirahat, ditinjau bersama Bu Laras setelah 4 minggu.</p>
        </>
      );
    }

    if (id === "kesadaran") {
      return (
        <ol className="kzlist">
          {sesi.map((l, i) => (
            <li key={l.judul} className={`kzbaris ${l.tahap}`}>
              <span className={`kzno ${l.tahap}`} aria-hidden="true">
                {l.tahap === "done" ? <Ikon nama="centang" size={14} /> : i + 1}
              </span>
              <div className="kzisi">
                <p className="kzjudul">{l.judul}</p>
                <p className="kzaspek">
                  {l.keamanan ? "Keamanan diri, di luar HEART" : `HEART: ${l.aspek.map((x) => cariAspek(x)?.nama).join(", ")}`}
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
      );
    }

    // observasi
    return (
      <>
        <button type="button" className="abtn" style={{ alignSelf: "flex-start" }} onClick={() => bukaObs()}>
          <Ikon nama="tambah" size={16} warna="var(--sp-ungu)" />
          Tambah catatan
        </button>
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
                  {n.aspek.map((x) => (
                    <span key={x} className="pill sm gray">
                      {cariAspek(x)?.nama}
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
          Hanya untuk Anda, Guru BK, dan Kepala Sekolah. Orang tua menerima ringkasan dari Guru BK.
        </p>
      </>
    );
  }

  return (
    <div className={`isi ${css.layar}`}>
      <AlurBar alur="cegah" aktif="checklist" />

      <section className="titlerow">
        <div>
          <p className="eyebrow">{`Kelas 2B · ${RINGKAS_2B.total} anak`}</p>
          <h1 className="h1">Selamat pagi, Bu Rina</h1>
          <p className="lead">Mulai dari yang perlu segera, lalu centang checklist Anda.</p>
        </div>
        <div className="tbtns">
          <button type="button" className="ghost" onClick={() => bukaObs()}>
            <Ikon nama="pena" size={17} />
            Catat pengamatan
          </button>
          {belumDiisi.length > 0 && (
            <button type="button" className="btnp" onClick={() => bukaIsi(belumDiisi[0])}>
              <Ikon nama="skrining" size={17} />
              {`Isi screening (${belumDiisi.length} anak)`}
            </button>
          )}
        </div>
      </section>

      {/* ---------- 1. perlu segera ---------- */}
      <section className="card tcard" data-bagian="segera" aria-label="Perlu segera">
        <KepalaKartu ikon="peringatan" nada="red" judul="Perlu segera" />
        <ul className="sglist">
          {kasusSaya.map((c) => (
            <li key={c.id} className="sgbaris">
              <span className="sgtitik" aria-hidden="true" />
              <div className="sgisi">
                <p className="sgjudul">{c.judul}</p>
                <p className="sgket">{`Batas waktu: ${c.waktu}`}</p>
              </div>
              <button type="button" className="btnp sgaksi" onClick={() => pindah("kasus", { jenis: "kasus", id: c.kasus })}>
                Buka kasus
              </button>
            </li>
          ))}
          {laporanSkrining.map((l) => (
            <li key={l.kasus} className="sgbaris">
              <span className="sgtitik" aria-hidden="true" />
              <div className="sgisi">
                <p className="sgjudul">{`Laporan ${l.kasus}: tanda bahaya dari screening ${namaDepan(l.nama)}`}</p>
                <p className="sgket">Menunggu dicek Bu Laras.</p>
              </div>
              <button type="button" className="abtn sgaksi" onClick={() => pindah("kasus", { jenis: "kasus", id: l.kasus })}>
                Buka laporan
                <Ikon nama="kanan" size={15} />
              </button>
            </li>
          ))}
          <li className="sgbaris">
            <span className="sgtitik" aria-hidden="true" />
            <div className="sgisi">
              <p className="sgjudul">{`${ANAK_WASPADA.length} anak berstatus Perlu Perhatian Lebih`}</p>
              <p className="sgket">Pantau tiap hari. Ketuk nama untuk melihat ringkasannya.</p>
            </div>
            <span className="sganakdaftar">
              {ANAK_WASPADA.map((a) => (
                <button key={a.nama} type="button" className="sganak" aria-label={labelUbin(a, terkirim[a.nama])} onClick={() => klikAnak(a)}>
                  <span className={`pkav ${a.status}`} aria-hidden="true">
                    {a.inisial}
                  </span>
                  {namaDepan(a.nama)}
                </button>
              ))}
            </span>
          </li>
        </ul>
      </section>

      {/* ---------- grafik kelas: hasil HEART dan kemajuan checklist ---------- */}
      <section className="card tcard rkgrafik" aria-label="Kelas 2B sekarang">
        <div className="tophead">
          <KepalaKartu ikon="grafik" judul="Kelas 2B sekarang" />
          <button type="button" className="ghost sm" onClick={() => pindah("pemetaan")}>
            Lihat hasil HEART kelas
            <Ikon nama="kanan" size={16} />
          </button>
        </div>
        <div className="rkgrafikisi">
          <div className="rkgrafikitem">
            <Donat data={DATA_KELAS} tengah={RINGKAS_2B.total} sub="anak" ukuran={124} tebal={15} />
            <Legenda data={DATA_KELAS} kolom />
          </div>
          <div className="rkgrafikitem">
            <Cincin
              nilai={jumlahSelesai}
              dari={butirSaya.length}
              ukuran={124}
              tebal={13}
              sub="checklist"
              label={`${jumlahSelesai} dari ${butirSaya.length} butir checklist selesai`}
            />
            <span className="rkgrafikteks">
              <b>{`${jumlahSelesai} dari ${butirSaya.length} butir selesai`}</b>
              <span>Checklist dievaluasi bersama Guru BK tiap 4 minggu.</span>
            </span>
          </div>
        </div>
      </section>

      {/* ---------- 2. checklist ---------- */}
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
          const terbuka = Boolean(grupTerbuka[k.id]);
          const idDaftar = `rk-ck-${k.id}`;
          return (
            <div key={k.id} className="ckgrup">
              <button
                type="button"
                className="ckkepala cktoggle"
                aria-expanded={terbuka}
                aria-controls={idDaftar}
                onClick={() => setGrupTerbuka((g) => ({ ...g, [k.id]: !g[k.id] }))}
              >
                <Ikon nama="turun" size={16} className="ckpanah" />
                {k.label}
                <span className="ckjml">{daftar.length}</span>
              </button>
              <ul className="cklist" id={idDaftar} hidden={!terbuka} aria-label={k.label}>
                {daftar.map((c) => (
                  <BarisChecklist key={c.id} butir={c} selesai={Boolean(centang[c.id])} aksi={aksiButir(c)} onCentang={centangButir} />
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {/* ---------- 3. rincian kelas: menu, isi dibuka lewat klik ---------- */}
      <section className="rkrincian" aria-labelledby="rk-rincian-judul">
        <h2 className="rkjudul" id="rk-rincian-judul">
          Kelas 2B
        </h2>
        <ul className="rkmenu">
          {menuRincian.map((m) => {
            const aktif = m.id === rincian;
            return (
              <li key={m.id} data-bagian={m.id}>
                <button
                  type="button"
                  className={`rkubin${aktif ? " on" : ""}`}
                  aria-expanded={aktif}
                  aria-controls="rk-rincian-isi"
                  onClick={() => setRincian(aktif ? null : m.id)}
                >
                  <span className="tile p" aria-hidden="true">
                    <Ikon nama={m.ikon} d={m.d} size={19} />
                  </span>
                  <span className="rkteks">
                    <span className="rknama">
                      {m.judul}
                      {m.tanda && <span className="rktanda" aria-label="perlu tindakan" role="img" />}
                    </span>
                    <span className="rkket">{m.ket}</span>
                  </span>
                  <Ikon nama="turun" size={18} className="rkpanah" />
                </button>
              </li>
            );
          })}
        </ul>
        {rincianAktif && (
          <section className="card tcard" id="rk-rincian-isi" aria-label={rincianAktif.judul}>
            <KepalaKartu ikon={rincianAktif.ikon} d={rincianAktif.d} judul={rincianAktif.judul} as="h3" />
            {isiRincian(rincianAktif.id)}
          </section>
        )}
      </section>

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

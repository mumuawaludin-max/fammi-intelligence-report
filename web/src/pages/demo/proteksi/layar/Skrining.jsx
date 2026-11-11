import { useRef, useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaKartu, Segmen } from "../komponen";
import { inisial } from "../alat";
import AlurBar from "../bersama/AlurBar";
import { HurufHeart, PilStatus } from "../bersama/HeartKecil";
import { HEART, RINGKAS_SEKOLAH } from "../bersama/heart";
import { checklistAnak } from "../bersama/tindakLanjut";
import {
  HEART_ANAK,
  KELAS,
  KELAS_WALAS,
  PERHATIAN,
  PERTANYAAN_KEAMANAN,
  TANDA_BAHAYA,
  WALI,
  WASPADA,
  aspekMenonjol,
  bacaHeart,
} from "./skriningData";
import { LaciFormulir, LaciRingkasan, LaciTindakLanjut } from "./SkriningLaci";
import css from "./Skrining.module.css";

/** Empat ubin status. `daftar` = daftar anak yang dibuka saat ubin diklik (Baik tidak punya daftar). */
const UBIN = [
  {
    id: "baik",
    nada: "ok",
    status: "baik",
    jumlah: RINGKAS_SEKOLAH.baik,
    langkah: "Kelas kesadaran bersama",
    oleh: "Wali kelas",
  },
  {
    id: "perhatian",
    nada: "warn",
    status: "perhatian",
    jumlah: RINGKAS_SEKOLAH.perhatian,
    langkah: "Observasi 4 minggu",
    oleh: "Wali kelas",
    daftar: "perhatian",
  },
  {
    id: "waspada",
    nada: "bad",
    status: "waspada",
    jumlah: RINGKAS_SEKOLAH.waspada,
    langkah: "Tindak lanjut, checklist, dan buddy",
    oleh: "Guru BK, wali kelas, orang tua",
    daftar: "waspada",
  },
  {
    id: "tanda",
    nada: "crit",
    label: "Tanda bahaya",
    jumlah: RINGKAS_SEKOLAH.tandaBahaya,
    langkah: "Langsung jadi laporan kejadian",
    oleh: "Koordinator BK",
    daftar: "tanda",
  },
];

const DAFTAR = [
  { id: "waspada", label: `Waspada (${WASPADA.length})` },
  { id: "perhatian", label: `Perlu Perhatian (${PERHATIAN.length})` },
  { id: "tanda", label: `Tanda bahaya (${TANDA_BAHAYA.length})` },
];

const PENGANTAR = {
  waspada:
    "Guru BK menyusun tindak lanjut bersama wali kelas dan orang tua: butir checklist per aspek dan buddy. Yang belum punya tindak lanjut ada di atas.",
  perhatian:
    "Wali kelas mengamati selama 4 minggu dan mencatat tiap minggu. Bila belum membaik, Guru BK menyusun tindak lanjut.",
  tanda:
    "Jawaban Ya pada pertanyaan keamanan langsung menjadi laporan kejadian dan ditangani di alur kejadian, terpisah dari hasil HEART.",
};

const TAB_KELAS = [
  { id: "progres", label: "Progres pengisian" },
  { id: "hasil", label: "Hasil per kelas" },
];

const BARIS_AWAL = 8;

const jumlahKelas = (kunci) => KELAS.reduce((n, k) => n + k[kunci], 0);
const TOTAL_ANAK = jumlahKelas("anak");
const TOTAL_WALAS = jumlahKelas("walas");
const TOTAL_ORTU = jumlahKelas("ortu");
const BELUM_ORTU = TOTAL_ANAK - TOTAL_ORTU;
const KELAS_WALAS_BELUM = KELAS.filter((k) => k.walas < k.anak);
const SEMUA_ANAK = [...WASPADA, ...PERHATIAN];

const persen = (n, dari) => `${Math.round((n / dari) * 100)}%`;

/** Dua aspek dengan anak Perlu Perhatian atau Waspada terbanyak, untuk catatan di bawah grafik. */
const ASPEK_TERATAS = HEART.map((a) => {
  const x = RINGKAS_SEKOLAH.perAspek[a.id];
  return { aspek: a, n: x.perhatian + x.waspada };
})
  .sort((p, q) => q.n - p.n)
  .slice(0, 2);

/** Hasil satu kelas per aspek: jumlah anak tidak Baik dan yang Waspada. */
const HASIL_KELAS = KELAS.map((k) => {
  const anak = SEMUA_ANAK.filter((a) => a.kelas === k.kelas);
  const perAspek = HEART.map((a) => {
    const status = anak.map((x) => bacaHeart(x.heart)[a.id]);
    return {
      aspek: a,
      ditandai: status.filter((s) => s !== "baik").length,
      waspada: status.filter((s) => s === "waspada").length,
    };
  });
  return { ...k, perAspek, jumlah: anak.length, waspada: anak.filter((x) => WASPADA.includes(x)).length };
});

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
 * Skrining HEART (sudut pandang Bu Laras, Koordinator BK, seluruh sekolah): langkah pertama alur
 * pencegahan. Empat ubin status menyaring daftar anak, hasil per aspek HEART, progres pengisian dan
 * hasil per kelas, lalu daftar anak yang perlu ditindaklanjuti beserta langkah berikutnya. Laci:
 * formulir, susun tindak lanjut, dan ringkasan anak. Semua data contoh.
 */
export default function Skrining() {
  const { pindah, toast, beriTahu, centang, rencanaBaru, simpanRencana, tambahChecklist } = useProteksi();
  const [daftar, setDaftar] = useState("waspada");
  const [semua, setSemua] = useState(false);
  const [tabKelas, setTabKelas] = useState("progres");
  const [laci, setLaci] = useState(null);
  // Tindak lanjut yang disusun di layar ini disimpan di konteks, jadi tetap ada saat layar berganti.
  const disusun = rencanaBaru;
  const [diingatkan, setDiingatkan] = useState({});
  const [semuaDiingatkan, setSemuaDiingatkan] = useState(false);
  const [walasDiingatkan, setWalasDiingatkan] = useState(false);
  const daftarRef = useRef(null);

  function pilihDaftar(id) {
    setDaftar(id);
    setSemua(false);
  }

  // Ubin menyaring daftar anak di bawah, lalu menggulir ke sana. Fokus pindah ke tombol segmen yang
  // sama di kartu daftar, supaya papan ketik dan pembaca layar ikut ke tempat hasilnya.
  function pilihUbin(u) {
    if (!u.daftar) {
      toast(`${u.jumlah} anak Baik cukup ikut kelas kesadaran bersama, dijadwalkan wali kelas masing-masing`);
      return;
    }
    pilihDaftar(u.daftar);
    const kartu = daftarRef.current;
    if (!kartu) return;
    const halus = !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    kartu.scrollIntoView({ block: "start", behavior: halus ? "smooth" : "auto" });
    const tombol = kartu.querySelectorAll(".seg .segb")[DAFTAR.findIndex((d) => d.id === u.daftar)];
    tombol?.focus({ preventScroll: true });
  }

  function ingatkanSemua() {
    if (semuaDiingatkan) return;
    setSemuaDiingatkan(true);
    toast(`Pengingat WhatsApp terkirim ke ${BELUM_ORTU} orang tua di ${KELAS.length} kelas`);
  }

  function ingatkanKelas(k) {
    setDiingatkan((d) => ({ ...d, [k.kelas]: true }));
    toast(`Pengingat WhatsApp terkirim ke ${k.anak - k.ortu} orang tua kelas ${k.kelas}`);
  }

  function ingatkanWalas() {
    if (walasDiingatkan) return;
    setWalasDiingatkan(true);
    const walas = KELAS_WALAS_BELUM.find((k) => k.kelas === KELAS_WALAS);
    if (walas) {
      beriTahu({
        peran: "walas",
        ikon: "skrining",
        nada: "warn",
        judul: "Pengingat skrining HEART dari Bu Laras",
        isi: `Formulir ${walas.anak - walas.walas} anak kelas ${walas.kelas} belum diisi. Batas Jumat, 13 Nov.`,
        tujuan: { layar: "kelas", aksi: { jenis: "gulir", id: "checklist" } },
      });
    }
    toast(`Pengingat terkirim ke ${KELAS_WALAS_BELUM.map((k) => `${k.wali} (${k.kelas})`).join(", ")}`);
  }

  function simpanTindak(anak, hasil) {
    simpanRencana(anak.nama, hasil);
    setLaci(null);
    // Anak 2B: butirnya masuk checklist bersama, jadi milik Bu Rina langsung muncul di Ruang wali
    // kelas (langkah Checklist). Kelas lain punya wali kelas di luar prototipe.
    if (anak.kelas === KELAS_WALAS) {
      const awalan = `tl-${anak.nama.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      tambahChecklist(
        hasil.butir.map((b) => ({
          id: `${awalan}-${b.id}`,
          anak: anak.nama,
          aspek: b.aspek,
          alur: "cegah",
          judul: b.teks,
          oleh: b.oleh,
          waktu: "Mulai Kamis, 12 Nov",
          selesai: false,
        })),
      );
    }
    const wali = WALI[anak.kelas];
    const n = hasil.butir.length;
    const tanggal = hasil.evaluasi.tanggal;
    const aspek = aspekMenonjol(anak.heart)
      .filter((x) => hasil.butir.some((b) => b.aspek === x.aspek.id))
      .map((x) => x.aspek.nama)
      .join(" dan ");
    const keOrtu = hasil.kirimOrtu && hasil.butir.some((b) => b.oleh === "ortu");
    // Lonceng prototipe hanya punya satu wali kelas (Bu Rina, 2B); wali kelas lain diberi tahu di
    // luar prototipe, jadi cukup disebut di pemberitahuan.
    if (anak.kelas === KELAS_WALAS) {
      beriTahu({
        peran: "walas",
        ikon: "ceklis",
        nada: "p",
        judul: `Tindak lanjut baru untuk ${anak.nama}`,
        isi: `${n} butir checklist dari Bu Laras untuk ${aspek}. Evaluasi ${tanggal}.`,
        tujuan: { layar: "kelas", aksi: { jenis: "gulir", id: "checklist" } },
      });
    }
    toast(
      `Tindak lanjut ${anak.nama} tersimpan: ${n} butir checklist, evaluasi ${tanggal}. ${wali}${keOrtu ? " dan orang tua" : ""} diberi tahu.`,
    );
  }

  const bukaKasus = (id) => pindah("kasus", { jenis: "kasus", id });

  // Kemajuan checklist Raka hidup dari konteks: centang di Ruang wali kelas ikut terlihat di sini.
  const butirRaka = checklistAnak("Raka Pratama");
  const selesaiRaka = butirRaka.filter((b) => centang[b.id]).length;

  // Baris daftar anak. Tiap baris punya satu tombol aksi yang tetap elemen yang sama saat labelnya
  // berganti (Susun tindak lanjut -> Ringkasan), supaya laci bisa mengembalikan fokus ke baris itu.
  function barisWaspada(a) {
    const t = a.tindak;
    const baru = disusun[a.nama];
    const dasar = { nama: a.nama, kelas: a.kelas, heart: a.heart, aspek: aspekMenonjol(a.heart) };
    if (t.jenis === "laporan") {
      return {
        ...dasar,
        tindak: (
          <span className="tl">
            <span className="tlbar" aria-hidden="true">
              <span style={{ width: persen(selesaiRaka, butirRaka.length) }} />
            </span>
            <b>{`${selesaiRaka} dari ${butirRaka.length} checklist`}</b>
            <span className="mut">{`Kasus ${t.kasus}`}</span>
          </span>
        ),
        aksi: { label: "Buka laporan", label2: a.nama, onClick: () => pindah("anak", { jenis: "gulir", id: "hasil" }) },
      };
    }
    if (t.jenis === "kasus") {
      return {
        ...dasar,
        tindak: (
          <span className="tl">
            <span className="pill sm bad">{`Kasus ${t.kasus}`}</span>
            <span className="mut">{`${t.tingkat} · ${t.oleh}`}</span>
          </span>
        ),
        aksi: { label: "Buka kasus", label2: `${t.kasus} ${a.nama}`, onClick: () => bukaKasus(t.kasus) },
      };
    }
    if (t.jenis === "berjalan" || baru) {
      return {
        ...dasar,
        tindak: (
          <span className="tl">
            <span className="pill sm mid">Tindak lanjut berjalan</span>
            <span className="mut">{baru ? `disusun hari ini · evaluasi ${baru.evaluasi.tanggal}` : `evaluasi ${t.evaluasi}`}</span>
          </span>
        ),
        aksi: { label: "Ringkasan", label2: a.nama, onClick: () => setLaci({ jenis: "ringkasan", nama: a.nama }) },
      };
    }
    return {
      ...dasar,
      tindak: (
        <span className="tl">
          <span className="pill sm warn">{t.buddy ? "Checklist belum disusun" : "Belum ada tindak lanjut"}</span>
          <span className="mut">{t.buddy ? `buddy ${t.buddy.split(" ")[0]} sejak ${t.sejak}` : "Guru BK"}</span>
        </span>
      ),
      aksi: {
        label: "Susun tindak lanjut",
        label2: `untuk ${a.nama}`,
        ikon: "tambah",
        onClick: () => setLaci({ jenis: "tindak", nama: a.nama }),
      },
    };
  }

  let baris;
  if (daftar === "waspada") {
    baris = WASPADA.map(barisWaspada);
  } else if (daftar === "perhatian") {
    baris = PERHATIAN.map((a) => ({
      nama: a.nama,
      kelas: a.kelas,
      heart: a.heart,
      aspek: aspekMenonjol(a.heart),
      tindak: (
        <span className="tl">
          <span className="pill sm mid">{`Observasi minggu ${a.minggu} dari 4`}</span>
          <span className="mut">{WALI[a.kelas]}</span>
        </span>
      ),
      aksi: { label: "Ringkasan", label2: a.nama, onClick: () => setLaci({ jenis: "ringkasan", nama: a.nama }) },
    }));
  } else {
    baris = TANDA_BAHAYA.map((a) => ({
      nama: a.nama,
      kelas: a.kelas,
      heart: HEART_ANAK[a.nama],
      tanda: (
        <>
          {PERTANYAAN_KEAMANAN[a.butir].replace(/\.$/, "")}
          <span className="mut">{` · isian ${a.sumber.toLowerCase()}`}</span>
        </>
      ),
      tindak: a.selesai ? (
        <span className="tl">
          <span className="pill sm ok">{`Kasus ${a.kasus} selesai`}</span>
          <span className="mut">{a.selesai}</span>
        </span>
      ) : (
        <span className="tl">
          <span className="pill sm bad">{`Kasus ${a.kasus}`}</span>
          <span className="mut">{`${a.tingkat} · ${a.oleh}`}</span>
        </span>
      ),
      aksi: { label: "Buka kasus", label2: `${a.kasus} ${a.nama}`, onClick: () => bukaKasus(a.kasus) },
    }));
  }
  const total = baris.length;
  const tampil = semua ? baris : baris.slice(0, BARIS_AWAL);

  const anakLaci = laci ? SEMUA_ANAK.find((a) => a.nama === laci.nama) : null;

  return (
    <div className={`isi ${css.layar}`}>
      <AlurBar alur="cegah" aktif="skrining" />

      <section className="titlerow">
        <div>
          <p className="eyebrow">Alur pencegahan · Langkah 1</p>
          <h1 className="h1">Skrining HEART</h1>
          <p className="lead">
            Orang tua dan wali kelas mengisi pernyataan yang sama untuk tiap anak, lalu hasilnya menjadi lima aspek HEART per
            anak: Hiperaktivitas, Emosional, Agresi, Relasi Pertemanan, dan Tolong Menolong.
          </p>
        </div>
        <div className="tbtns">
          <button type="button" className="ghost" onClick={() => setLaci({ jenis: "formulir" })}>
            <Ikon nama="mata" size={18} />
            Lihat formulir
          </button>
          {semuaDiingatkan ? (
            <button type="button" className="ghost" aria-disabled="true" onClick={ingatkanSemua}>
              <Ikon nama="centang" size={18} />
              Pengingat terkirim
            </button>
          ) : (
            <button type="button" className="btnp" onClick={ingatkanSemua}>
              <Ikon nama="kirim" size={18} />
              {`Ingatkan ${BELUM_ORTU} orang tua`}
            </button>
          )}
        </div>
      </section>

      <section className="stiles" aria-labelledby="skrining-ubin">
        <h2 id="skrining-ubin" className="sr">
          Hasil skrining sekolah
        </h2>
        {UBIN.map((u) => {
          const aktif = Boolean(u.daftar) && u.daftar === daftar;
          return (
            <div key={u.id} className={`stile ${u.nada}${aktif ? " on" : ""}`}>
              <button
                type="button"
                className="stileb"
                aria-pressed={u.daftar ? aktif : undefined}
                onClick={() => pilihUbin(u)}
              >
                <span className="sthead">
                  {u.status ? <PilStatus status={u.status} kecil /> : <span className="pill sm crit">{u.label}</span>}
                  <span className="stnum">
                    {u.jumlah}
                    <small> anak</small>
                  </span>
                </span>
                <span className="stlangkah">{u.langkah}</span>
                <span className="stoleh">
                  <Ikon nama="orang" size={14} />
                  {u.oleh}
                </span>
              </button>
              {u.id === "tanda" ? (
                <button type="button" className="stlink" onClick={() => pindah("kasus")}>
                  Buka alur kejadian
                  <Ikon nama="sebelah" size={14} />
                </button>
              ) : null}
            </div>
          );
        })}
      </section>

      <section className="card tcard">
        <div className="tophead">
          <KepalaKartu ikon="hati" judul="Hasil per aspek HEART" />
          <span className="legenda">
            <span aria-hidden="true">
              <i className="lg ok" />
              Baik
            </span>
            <span aria-hidden="true">
              <i className="lg warn" />
              Perlu Perhatian
            </span>
            <span aria-hidden="true">
              <i className="lg bad" />
              Waspada
            </span>
            <span className="mut">{`dari ${RINGKAS_SEKOLAH.terpetakan} anak terpetakan`}</span>
          </span>
        </div>
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
                  aria-label={`${a.nama}: ${x.baik} Baik, ${x.perhatian} Perlu Perhatian, ${x.waspada} Waspada`}
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
        <p className="catatan">
          Paling banyak Perlu Perhatian atau Waspada:{" "}
          {ASPEK_TERATAS.map((t, i) => (
            <span key={t.aspek.id}>
              {i > 0 ? " dan " : ""}
              <b>{t.aspek.nama}</b>
              {` (${t.n} anak)`}
            </span>
          ))}
          . Keduanya bisa menjadi tema kelas kesadaran bulan ini.
        </p>
      </section>

      <section className="card tcard">
        <div className="tophead">
          <div className="kepalagrup">
            <KepalaKartu ikon="baris" judul="Pengisian dan hasil per kelas" />
            <span className="pill sm warn">
              <Ikon nama="jam" size={14} />
              Batas Jumat, 13 Nov · 2 hari lagi
            </span>
          </div>
          <Segmen label="Tampilan per kelas" pilihan={TAB_KELAS} nilai={tabKelas} onPilih={setTabKelas} />
        </div>

        {tabKelas === "progres" ? (
          <>
            <div className="ringkas2">
              <div className="rblok">
                <span className="rtop">
                  <span className="rlabel">
                    <Ikon nama="pena" size={15} />
                    Formulir wali kelas
                  </span>
                  <span className="rnilai">
                    {TOTAL_WALAS}
                    <small>{` dari ${TOTAL_ANAK}`}</small>
                  </span>
                </span>
                <span className="rbar" aria-hidden="true">
                  <span className="pu" style={{ width: persen(TOTAL_WALAS, TOTAL_ANAK) }} />
                </span>
                <span className="rbaris">
                  <span className="rsub">{`Belum lengkap: ${KELAS_WALAS_BELUM.map((k) => k.kelas).join(", ")}`}</span>
                  {walasDiingatkan ? (
                    <span className="pill sm ok">Terkirim 10.31</span>
                  ) : (
                    <button type="button" className="abtn kecil" onClick={ingatkanWalas}>
                      {`Ingatkan ${KELAS_WALAS_BELUM.length} wali kelas`}
                    </button>
                  )}
                </span>
              </div>
              <div className="rblok">
                <span className="rtop">
                  <span className="rlabel">
                    <Ikon nama="kelompok" size={15} />
                    Formulir orang tua
                  </span>
                  <span className="rnilai">
                    {TOTAL_ORTU}
                    <small>{` dari ${TOTAL_ANAK}`}</small>
                  </span>
                </span>
                <span className="rbar" aria-hidden="true">
                  <span className="or" style={{ width: persen(TOTAL_ORTU, TOTAL_ANAK) }} />
                </span>
                <span className="rbaris">
                  <span className="rsub">
                    {semuaDiingatkan
                      ? `${BELUM_ORTU} belum · pengingat ketiga terkirim hari ini 10.31`
                      : `${BELUM_ORTU} belum · pengingat WhatsApp terakhir Selasa, 10 Nov`}
                  </span>
                </span>
              </div>
            </div>
            <div className="tbox">
              <table className="tbl tumpukp">
                <thead>
                  <tr>
                    <th>Kelas</th>
                    <th>Formulir wali kelas</th>
                    <th>Formulir orang tua</th>
                    <th>Pengingat orang tua</th>
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
                          <Progres
                            nilai={k.walas}
                            dari={k.anak}
                            nada={k.walas < k.anak ? "warn" : "ok"}
                            label="Wali kelas"
                          />
                        </td>
                        <td>
                          <Progres
                            nilai={k.ortu}
                            dari={k.anak}
                            nada={k.ortu / k.anak < 0.85 ? "warn" : "mid"}
                            label="Orang tua"
                          />
                        </td>
                        <td>
                          {diingatkan[k.kelas] || semuaDiingatkan ? (
                            <span className="pill sm ok">Terkirim 10.31</span>
                          ) : (
                            <button
                              type="button"
                              className="abtn"
                              aria-label={`Kirim pengingat WhatsApp ke ${belum} orang tua kelas ${k.kelas}`}
                              onClick={() => ingatkanKelas(k)}
                            >
                              <Ikon nama="kirim" size={15} warna="var(--sp-hijau-batang)" />
                              {`Ingatkan ${belum} orang tua`}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="catatan">
              {`${TOTAL_WALAS} dari ${TOTAL_ANAK} anak sudah terpetakan. ${TOTAL_ANAK - TOTAL_WALAS} anak belum, karena formulir wali kelasnya belum masuk.`}
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
                        <span className="hk">{a.kode}</span>
                        <span className="hn">{a.nama}</span>
                      </th>
                    ))}
                    <th>Perlu tindak lanjut</th>
                  </tr>
                </thead>
                <tbody>
                  {HASIL_KELAS.map((k) => (
                    <tr key={k.kelas}>
                      <td>
                        <span className="kls">
                          <b>{k.kelas}</b>
                          <span className="mut">{k.wali}</span>
                        </span>
                      </td>
                      {k.perAspek.map((x) => (
                        <td key={x.aspek.id} className="hcel">
                          <span className={`hc l${Math.min(x.ditandai, 3)}`}>
                            {x.ditandai}
                            {x.waspada > 0 ? <span className="hcw" aria-hidden="true" /> : null}
                            <span className="sr">
                              {` anak, ${x.ditandai - x.waspada} Perlu Perhatian, ${x.waspada} Waspada`}
                            </span>
                          </span>
                        </td>
                      ))}
                      <td>
                        <b>{`${k.jumlah} anak`}</b>
                        <span className="mut">
                          <span className="pisah"> · </span>
                          {`${k.waspada} Waspada`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="catatan">
              Angka = anak Perlu Perhatian atau Waspada pada aspek itu, titik merah = ada anak Waspada.{" "}
              {`Anak yang belum terpetakan (${KELAS_WALAS_BELUM.map((k) => k.kelas).join(", ")}) belum masuk hitungan.`}
            </p>
          </>
        )}
      </section>

      <section ref={daftarRef} className="card tcard" data-bagian="daftar-anak" aria-labelledby="skrining-daftar">
        <div className="tophead">
          <div className="chead">
            <div className="tile p">
              <Ikon nama="kelompok" size={19} />
            </div>
            <h2 id="skrining-daftar" className="ctitle">
              Anak yang perlu ditindaklanjuti
            </h2>
          </div>
          <Segmen label="Kelompok anak" pilihan={DAFTAR} nilai={daftar} onPilih={pilihDaftar} />
        </div>
        <p className="lead2">{PENGANTAR[daftar]}</p>
        <div className="tbox">
          <table className="tbl tumpuk">
            <thead>
              <tr>
                <th>Anak</th>
                <th>Kelas</th>
                <th>HEART</th>
                <th>{daftar === "tanda" ? "Jawaban Ya pada" : "Aspek menonjol"}</th>
                <th>Tindak lanjut</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tampil.map((r) => (
                <tr key={`${daftar}:${r.nama}`}>
                  <td>
                    <span className="kid">
                      <span className="av" aria-hidden="true">
                        {inisial(r.nama)}
                      </span>
                      <b>{r.nama}</b>
                    </span>
                  </td>
                  <td className="klsanak">
                    <span className="hpk">Kelas </span>
                    {r.kelas}
                  </td>
                  <td>
                    <HurufHeart heart={bacaHeart(r.heart)} />
                  </td>
                  <td className="wrapcell">
                    {r.tanda
                      ? r.tanda
                      : r.aspek.map((x, i) => (
                          <span key={x.aspek.id}>
                            {i > 0 ? ", " : ""}
                            {x.status === "waspada" ? <b>{x.aspek.nama}</b> : x.aspek.nama}
                          </span>
                        ))}
                  </td>
                  <td>{r.tindak}</td>
                  <td>
                    <button
                      type="button"
                      className="abtn"
                      aria-label={`${r.aksi.label} ${r.aksi.label2}`}
                      onClick={r.aksi.onClick}
                    >
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
          <p className="catatan">{`Menampilkan ${tampil.length} dari ${total} anak.`}</p>
          {total > BARIS_AWAL ? (
            <button type="button" className="linkbtn" aria-expanded={semua} onClick={() => setSemua((s) => !s)}>
              {semua ? "Tampilkan lebih sedikit" : `Tampilkan semua ${total} anak`}
            </button>
          ) : null}
        </div>
      </section>

      {laci?.jenis === "formulir" && <LaciFormulir onTutup={() => setLaci(null)} />}
      {laci?.jenis === "tindak" && anakLaci && (
        <LaciTindakLanjut anak={anakLaci} onTutup={() => setLaci(null)} onSimpan={simpanTindak} />
      )}
      {laci?.jenis === "ringkasan" && anakLaci && (
        <LaciRingkasan anak={anakLaci} disusun={disusun[anakLaci.nama] || null} onTutup={() => setLaci(null)} />
      )}
    </div>
  );
}

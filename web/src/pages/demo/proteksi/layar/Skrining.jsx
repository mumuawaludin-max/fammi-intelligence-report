import { useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaKartu } from "../komponen";
import AlurBar from "../bersama/AlurBar";
import { RINGKAS_SEKOLAH } from "../bersama/heart";
import { checklistAnak } from "../bersama/tindakLanjut";
import {
  ASPEK_TERATAS,
  HEART_ANAK,
  KELAS,
  KELAS_WALAS,
  KELAS_WALAS_BELUM,
  PERHATIAN,
  PERTANYAAN_KEAMANAN,
  SEMUA_ANAK,
  TANDA_BAHAYA,
  TANDA_TERBUKA,
  TOTAL,
  WALI,
  WASPADA,
  WASPADA_BELUM,
  aspekMenonjol,
} from "./skriningData";
import {
  AspekMenonjol,
  BarisAnak,
  LaciDaftar,
  LaciFormulir,
  LaciKemajuan,
  LaciRingkasan,
  LaciSebaran,
  LaciTindakLanjut,
} from "./SkriningLaci";
import { Cincin } from "../bersama/Grafik";
import css from "./Skrining.module.css";

const DAFTAR = [
  { id: "waspada", label: `Perlu Perhatian Lebih (${WASPADA.length})` },
  { id: "perhatian", label: `Perlu Diperhatikan (${PERHATIAN.length})` },
  { id: "tanda", label: `Tanda bahaya (${TANDA_BAHAYA.length})` },
];

const PENGANTAR = {
  waspada: "Guru BK menyusun tindak lanjut bersama wali kelas dan orang tua.",
  perhatian: "Wali kelas mengamati 4 minggu, lalu Guru BK menyusun tindak lanjut bila belum membaik.",
  tanda: "Jawaban Ya pada pertanyaan keamanan langsung jadi laporan kejadian.",
};

const persen = (n, dari) => `${Math.round((n / dari) * 100)}%`;

/**
 * Skrining HEART (sudut pandang Bu Laras, Koordinator BK, seluruh sekolah): langkah pertama alur
 * pencegahan. Halaman utama ringkas seperti menu, urut menurut journey Guru BK:
 *   1. Perlu ditangani sekarang  tanda bahaya yang kasusnya terbuka dan anak Waspada tanpa tindak
 *                                lanjut ([data-bagian="daftar-anak"], tujuan gulir dari Ringkasan)
 *   2. Kemajuan skrining         berapa anak sudah diskrining, kelas mana yang belum
 *   3. Rincian hasil             daftar lengkap anak, sebaran per aspek dan kelas, isi formulir
 * Rincian ada di laci (SkriningLaci.jsx). Laci anak (susun tindak lanjut, ringkasan) bisa terbuka di
 * atas laci daftar; menutupnya kembali ke daftar. Semua data contoh.
 */
export default function Skrining() {
  const { pindah, toast, beriTahu, centang, rencanaBaru, simpanRencana, tambahChecklist } = useProteksi();
  const [laci, setLaci] = useState(null);
  const [laciAnak, setLaciAnak] = useState(null);
  const [daftar, setDaftar] = useState("waspada");
  const [semua, setSemua] = useState(false);
  // Tindak lanjut yang disusun di layar ini disimpan di konteks, jadi tetap ada saat layar berganti.
  const disusun = rencanaBaru;
  const [diingatkan, setDiingatkan] = useState({});
  const [semuaDiingatkan, setSemuaDiingatkan] = useState(false);
  const [walasDiingatkan, setWalasDiingatkan] = useState(false);

  function pilihDaftar(id) {
    setDaftar(id);
    setSemua(false);
  }

  function ingatkanSemua() {
    if (semuaDiingatkan) return;
    setSemuaDiingatkan(true);
    toast(`Pengingat WhatsApp terkirim ke ${TOTAL.belumOrtu} orang tua di ${KELAS.length} kelas`);
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
        judul: "Pengingat screening HEART dari Bu Laras",
        isi: `Formulir ${walas.anak - walas.walas} anak kelas ${walas.kelas} belum diisi. Batas Jumat, 13 Nov.`,
        tujuan: { layar: "kelas", aksi: { jenis: "gulir", id: "checklist" } },
      });
    }
    toast(`Pengingat terkirim ke ${KELAS_WALAS_BELUM.map((k) => `${k.wali} (${k.kelas})`).join(", ")}`);
  }

  function simpanTindak(anak, hasil) {
    simpanRencana(anak.nama, hasil);
    setLaciAnak(null);
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
          ...(b.sumber ? { sumber: b.sumber } : {}),
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
  const bukaRingkasan = (nama) => setLaciAnak({ jenis: "ringkasan", nama });
  const bukaTindak = (nama) => setLaciAnak({ jenis: "tindak", nama });

  // Kemajuan checklist Raka hidup dari konteks: centang di Ruang wali kelas ikut terlihat di sini.
  const butirRaka = checklistAnak("Raka Pratama");
  const selesaiRaka = butirRaka.filter((b) => centang[b.id]).length;

  const aksiRingkasan = (nama) => ({ label: "Lihat ringkasan", label2: nama, dialog: true, onClick: () => bukaRingkasan(nama) });

  // Baris anak Waspada. Satu baris = nama, aspek yang menonjol, status tindak lanjut, satu tombol.
  function barisWaspada(a) {
    const t = a.tindak;
    const baru = disusun[a.nama];
    const dasar = { nama: a.nama, kelas: a.kelas, heart: a.heart, ket: <AspekMenonjol kode={a.heart} /> };
    if (t.jenis === "laporan") {
      return {
        ...dasar,
        status: (
          <>
            <span className="tlbar" aria-hidden="true">
              <span style={{ width: persen(selesaiRaka, butirRaka.length) }} />
            </span>
            <b>{`${selesaiRaka} dari ${butirRaka.length} checklist`}</b>
            <span className="mut">{`Kasus ${t.kasus}`}</span>
          </>
        ),
        aksi: { label: "Buka laporan", label2: a.nama, onClick: () => pindah("anak", { jenis: "gulir", id: "hasil" }) },
      };
    }
    if (t.jenis === "kasus") {
      return {
        ...dasar,
        status: (
          <>
            <span className="pill sm bad">{`Kasus ${t.kasus}`}</span>
            <span className="mut">{`${t.tingkat} · ${t.oleh}`}</span>
          </>
        ),
        aksi: { label: "Buka kasus", label2: `${t.kasus} ${a.nama}`, onClick: () => bukaKasus(t.kasus) },
      };
    }
    if (t.jenis === "berjalan" || baru) {
      return {
        ...dasar,
        status: (
          <>
            <span className="pill sm mid">{baru ? "Tersimpan hari ini" : "Berjalan"}</span>
            <span className="mut">{`evaluasi ${baru ? baru.evaluasi.tanggal : t.evaluasi}`}</span>
          </>
        ),
        aksi: aksiRingkasan(a.nama),
      };
    }
    return {
      ...dasar,
      status: (
        <>
          <span className="pill sm warn">Belum ada tindak lanjut</span>
          {t.buddy ? <span className="mut">{`pendamping sebaya sejak ${t.sejak}`}</span> : null}
        </>
      ),
      aksi: { label: "Susun tindak lanjut", label2: `untuk ${a.nama}`, ikon: "tambah", utama: true, dialog: true, onClick: () => bukaTindak(a.nama) },
    };
  }

  function barisTanda(a) {
    return {
      nama: a.nama,
      kelas: a.kelas,
      heart: HEART_ANAK[a.nama],
      ket: `${PERTANYAAN_KEAMANAN[a.butir].replace(/\.$/, "")} (isian ${a.sumber.toLowerCase()})`,
      status: a.selesai ? (
        <>
          <span className="pill sm ok">{`Kasus ${a.kasus} selesai`}</span>
          <span className="mut">{a.selesai}</span>
        </>
      ) : (
        <>
          <span className="pill sm bad">{`Kasus ${a.kasus}`}</span>
          <span className="mut">{`${a.tingkat} · ${a.oleh}`}</span>
        </>
      ),
      aksi: { label: "Buka kasus", label2: `${a.kasus} ${a.nama}`, onClick: () => bukaKasus(a.kasus) },
    };
  }

  function barisPerhatian(a) {
    return {
      nama: a.nama,
      kelas: a.kelas,
      heart: a.heart,
      ket: <AspekMenonjol kode={a.heart} />,
      status: (
        <>
          <span className="pill sm mid">{`Pengamatan minggu ${a.minggu} dari 4`}</span>
          <span className="mut">{WALI[a.kelas]}</span>
        </>
      ),
      aksi: aksiRingkasan(a.nama),
    };
  }

  // 1. Paling mendesak: tanda bahaya yang kasusnya terbuka, lalu anak Waspada tanpa tindak lanjut.
  // Anak yang tindak lanjutnya baru disimpan tetap di barisnya (tombol yang sama, label berganti)
  // supaya fokus kembali ke tempatnya sesudah laci ditutup.
  const mendesak = [
    ...TANDA_TERBUKA.map((a) => ({
      nama: a.nama,
      kelas: a.kelas,
      ket: (
        <>
          <span className="pill sm crit">Tanda bahaya</span>
          {`Kasus ${a.kasus} · ${a.oleh}`}
        </>
      ),
      aksi: { label: "Buka kasus", label2: `${a.kasus} ${a.nama}`, onClick: () => bukaKasus(a.kasus) },
    })),
    ...WASPADA_BELUM.map((a) => {
      const baru = disusun[a.nama];
      return {
        nama: a.nama,
        kelas: a.kelas,
        ket: baru ? (
          <>
            <span className="pill sm ok">Tersimpan</span>
            {`evaluasi ${baru.evaluasi.tanggal}`}
          </>
        ) : (
          <>
            <span className="pill sm bad">Perlu Perhatian Lebih</span>
            <AspekMenonjol kode={a.heart} />
          </>
        ),
        aksi: baru
          ? aksiRingkasan(a.nama)
          : { label: "Susun tindak lanjut", label2: `untuk ${a.nama}`, ikon: "tambah", utama: true, dialog: true, onClick: () => bukaTindak(a.nama) },
      };
    }),
  ];
  const sisa = TANDA_TERBUKA.length + WASPADA_BELUM.filter((a) => !disusun[a.nama]).length;

  let barisDaftar;
  if (daftar === "waspada") barisDaftar = WASPADA.map(barisWaspada);
  else if (daftar === "perhatian") barisDaftar = PERHATIAN.map(barisPerhatian);
  else barisDaftar = TANDA_BAHAYA.map(barisTanda);

  const anakLaci = laciAnak ? SEMUA_ANAK.find((a) => a.nama === laciAnak.nama) : null;
  const tutup = () => setLaci(null);
  const tutupAnak = () => setLaciAnak(null);
  const menu = [
    {
      id: "daftar",
      ikon: "kelompok",
      judul: "Daftar anak",
      ket: `${RINGKAS_SEKOLAH.waspada} Perlu Perhatian Lebih · ${RINGKAS_SEKOLAH.perhatian} Perlu Diperhatikan · ${RINGKAS_SEKOLAH.baik} Aman`,
    },
    {
      id: "sebaran",
      ikon: "hati",
      judul: "Sebaran per aspek dan kelas",
      ket: `Terbanyak: ${ASPEK_TERATAS.map((t) => t.aspek.nama).join(" dan ")}`,
    },
    { id: "formulir", ikon: "skrining", judul: "Isi formulir", ket: "Versi orang tua dan wali kelas" },
  ];

  return (
    <div className={`isi ${css.layar}`}>
      <AlurBar alur="cegah" aktif="skrining" />

      <section className="titlerow">
        <div>
          <p className="eyebrow">Alur pencegahan · Langkah 1</p>
          <h1 className="h1">Screening HEART</h1>
          <p className="lead">Orang tua dan wali kelas mengisi pernyataan yang sama untuk tiap anak.</p>
        </div>
      </section>

      <section className="card tcard" data-bagian="daftar-anak" aria-label="Perlu ditangani sekarang">
        <div className="tophead">
          <KepalaKartu ikon="peringatan" nada="red" judul="Perlu ditangani sekarang" />
          {sisa ? <span className="pill sm bad">{`${sisa} anak`}</span> : <span className="pill sm ok">Semua sudah ditangani</span>}
        </div>
        <ul className="anaklist">
          {mendesak.map((r) => (
            <BarisAnak key={r.nama} r={r} ringkas />
          ))}
        </ul>
      </section>

      <div className="duakolom">
        <section className="card tcard" aria-label="Kemajuan screening">
          <div className="tophead">
            <KepalaKartu ikon="baris" judul="Kemajuan screening" />
            <span className="pill sm warn">
              <Ikon nama="jam" size={14} />
              Batas Jumat, 13 Nov
            </span>
          </div>
          <div className="cincin2">
            <div className="cincinItem">
              <Cincin
                nilai={TOTAL.walas}
                dari={TOTAL.anak}
                ukuran={108}
                tebal={11}
                sub="ikut screening"
                label={`${TOTAL.walas} dari ${TOTAL.anak} anak sudah ikut screening`}
              />
              <span className="cincinTeks">
                <b>{`${TOTAL.walas} dari ${TOTAL.anak} anak`}</b>
                <span>{`Belum lengkap: ${KELAS_WALAS_BELUM.map((k) => k.kelas).join(", ")}`}</span>
              </span>
            </div>
            <div className="cincinItem">
              <Cincin
                nilai={TOTAL.ortu}
                dari={TOTAL.anak}
                warna="var(--sp-jingga)"
                ukuran={108}
                tebal={11}
                sub="orang tua"
                label={`${TOTAL.ortu} dari ${TOTAL.anak} formulir orang tua masuk`}
              />
              <span className="cincinTeks">
                <b>{`${TOTAL.ortu} formulir orang tua`}</b>
                <span>{semuaDiingatkan ? "Pengingat terkirim 10.31" : `${TOTAL.belumOrtu} belum mengisi`}</span>
              </span>
            </div>
          </div>
          <button type="button" className="menub" aria-haspopup="dialog" onClick={() => setLaci("kemajuan")}>
            <span className="menut">
              <b>Lihat per kelas</b>
              <span className="mut">Kirim pengingat ke wali kelas dan orang tua</span>
            </span>
            <Ikon nama="kanan" size={20} />
          </button>
        </section>

        <section className="card tcard" aria-label="Rincian hasil">
          <KepalaKartu ikon="grafik" judul="Rincian hasil" />
          <ul className="menu">
            <li>
              <button type="button" className="menub" onClick={() => pindah("pemetaan")}>
                <span className="tile p" aria-hidden="true">
                  <Ikon nama="grafik" size={18} />
                </span>
                <span className="menut">
                  <b>Hasil HEART per kelas</b>
                  <span className="mut">Ringkasan, grafik, dan rincian tiap anak</span>
                </span>
                <Ikon nama="kanan" size={20} />
              </button>
            </li>
            {menu.map((m) => (
              <li key={m.id}>
                <button type="button" className="menub" aria-haspopup="dialog" onClick={() => setLaci(m.id)}>
                  <span className="tile p" aria-hidden="true">
                    <Ikon nama={m.ikon} size={18} />
                  </span>
                  <span className="menut">
                    <b>{m.judul}</b>
                    <span className="mut">{m.ket}</span>
                  </span>
                  <Ikon nama="kanan" size={20} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {laci === "kemajuan" && (
        <LaciKemajuan
          diingatkan={diingatkan}
          semuaDiingatkan={semuaDiingatkan}
          walasDiingatkan={walasDiingatkan}
          onIngatkanSemua={ingatkanSemua}
          onIngatkanKelas={ingatkanKelas}
          onIngatkanWalas={ingatkanWalas}
          onTutup={tutup}
        />
      )}
      {laci === "sebaran" && <LaciSebaran onTutup={tutup} />}
      {laci === "formulir" && <LaciFormulir onTutup={tutup} />}
      {laci === "daftar" && (
        <LaciDaftar
          pilihan={DAFTAR}
          kelompok={daftar}
          onPilih={pilihDaftar}
          pengantar={PENGANTAR[daftar]}
          baris={barisDaftar}
          semua={semua}
          onSemua={() => setSemua((s) => !s)}
          onTutup={tutup}
        />
      )}
      {laciAnak?.jenis === "tindak" && anakLaci && (
        <LaciTindakLanjut anak={anakLaci} onTutup={tutupAnak} onSimpan={simpanTindak} />
      )}
      {laciAnak?.jenis === "ringkasan" && anakLaci && (
        <LaciRingkasan
          anak={anakLaci}
          disusun={disusun[anakLaci.nama] || null}
          onTutup={tutupAnak}
          lebar={laci === "daftar" ? 612 : 480}
        />
      )}
    </div>
  );
}

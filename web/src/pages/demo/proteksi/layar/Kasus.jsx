import { useCallback, useEffect, useRef, useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaKartu, KepalaLaci, Laci, Segmen } from "../komponen";
import {
  AKSI_TAHAP,
  ATURAN,
  ATURAN_SLA,
  ATURAN_TEKS,
  BOBOT_TINGKAT,
  CATATAN_ATURAN,
  HASIL_AKHIR,
  JAM_AWAL,
  JAWABAN,
  JENIS_KEJADIAN,
  KASUS_AWAL,
  KELAS,
  LANGKAH,
  LOKASI,
  PERTANYAAN,
  PIL_TINGKAT,
  TAHAP,
  TAHAP_ALUR,
  URUTAN_TAHAP,
  WAKTU_KEJADIAN,
  alasanDari,
  barisSla,
  capWaktu,
  hariKe,
  jamMenit,
  kasusDariLapor,
  langkahBerikut,
  laporKosong,
  rute,
  slaKasus,
  tingkatDari,
  waktuLengkap,
} from "./kasusData";
import css from "./Kasus.module.css";

const LEBAR_LACI = 640;

// Saringan antrean (segmen). Id tahap (analisis, diteruskan, ...) juga sah sebagai saringan,
// dipasang lewat kartu alur.
const SARINGAN = [
  { id: "aktif", label: "Aktif", cocok: (c) => c.tahap !== "selesai" },
  { id: "saya", label: "Tugas saya", cocok: (c) => c.milikSaya && c.tahap !== "selesai" },
  { id: "telat", label: "Lewat SLA", cocok: (c, sla) => c.tahap !== "selesai" && sla.telat },
  { id: "selesai", label: "Selesai", cocok: (c) => c.tahap === "selesai" },
  { id: "semua", label: "Semua", cocok: () => true },
];

/**
 * Kasus & SLA (artboard "5 · Kasus & SLA", sudut pandang Bu Laras, Koordinator BK): alur
 * penanganan, kartu angka, antrean kasus dengan saringan, laci detail kasus (triase enam
 * pertanyaan, penerusan, rencana tindak, SLA, riwayat), laci Lapor kejadian, dan laci Aturan SLA.
 * Semua data contoh dan hanya hidup di state layar ini.
 */
export default function Kasus() {
  const { aksi, aksiSelesai, toast, setHitungKasus } = useProteksi();
  const [daftar, setDaftar] = useState(KASUS_AWAL);
  const [kini, setKini] = useState(JAM_AWAL);
  const [saring, setSaring] = useState("aktif");
  const [laci, setLaci] = useState(null);
  const [pilihan, setPilihan] = useState(null);
  const [koreksi, setKoreksi] = useState({});
  const [catatan, setCatatan] = useState("");
  const [hasil, setHasil] = useState(HASIL_AKHIR[0].id);
  const [lapor, setLapor] = useState(laporKosong);
  const [tercatat, setTercatat] = useState(null);
  const [nomorBaru, setNomorBaru] = useState(0);

  const bukaLapor = useCallback(() => {
    setLapor(laporKosong());
    setTercatat(null);
    setLaci("lapor");
  }, []);

  const bukaKasus = useCallback((id) => {
    setPilihan(id);
    setCatatan("");
    setLaci("kasus");
  }, []);

  const tutupLaci = () => setLaci(null);

  // Permintaan dari tombol Lapor Kejadian di header atau dari layar lain. Laci sengaja dibuka
  // lewat efek: saat layar baru dipasang, efek induk memindahkan fokus ke judul lebih dulu, lalu
  // laci yang terbuka sesudahnya mengambil fokus dan mengembalikannya ke judul saat ditutup.
  useEffect(() => {
    if (!aksi) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- permintaan sekali pakai, sengaja sesudah efek induk (lihat atas)
    if (aksi.jenis === "lapor") bukaLapor();
    else if (aksi.jenis === "kasus" && daftar.some((c) => c.id === aksi.id)) bukaKasus(aksi.id);
    aksiSelesai();
  }, [aksi, aksiSelesai, bukaLapor, bukaKasus, daftar]);

  /** Ubah satu kasus; `menit` memajukan jam prototipe. */
  function ubahKasus(id, ubah, menit = 0) {
    setDaftar((semua) => semua.map((x) => (x.id === id ? { ...x, ...ubah(x) } : x)));
    if (menit) setKini((t) => t + menit);
  }

  // ---------- antrean ----------
  const sla = new Map(daftar.map((c) => [c.id, slaKasus(c, kini)]));
  const hitungTahap = (tahap) => daftar.filter((c) => c.tahap === tahap).length;
  const saringan = SARINGAN.find((s) => s.id === saring);
  const cocok = saringan ? saringan.cocok : (c) => c.tahap === saring;
  const peringkat = (c) =>
    (c.tahap === "selesai" ? 9 : c.tahap === "pantau" ? 5 : 0) +
    (sla.get(c.id).telat ? -2 : 0) +
    BOBOT_TINGKAT[c.tingkat] * 0.1 +
    URUTAN_TAHAP.indexOf(c.tahap) * 0.01;
  const baris = daftar.filter((c) => cocok(c, sla.get(c.id))).sort((a, b) => peringkat(a) - peringkat(b));
  const menunggu = daftar.filter((c) => c.tahap === "analisis");
  const lewat = daftar.filter((c) => c.tahap !== "selesai" && sla.get(c.id).telat);
  const pilihanSegmen = SARINGAN.map((s) => ({
    id: s.id,
    label: `${s.label} (${daftar.filter((c) => s.cocok(c, sla.get(c.id))).length})`,
  }));

  // Lencana menu "Kasus & SLA" mengikuti jumlah kasus aktif di layar ini (desain: {{activeCount}}).
  const jumlahAktif = daftar.filter((c) => c.tahap !== "selesai").length;
  useEffect(() => {
    setHitungKasus(jumlahAktif);
  }, [jumlahAktif, setHitungKasus]);
  useEffect(() => () => setHitungKasus(null), [setHitungKasus]);

  // ---------- kasus yang terbuka di laci ----------
  const kasus = daftar.find((x) => x.id === pilihan) || daftar[0];
  const jawabanKasus = koreksi[kasus.id] || kasus.jawaban;

  function pilihJawabanKasus(i, j) {
    setKoreksi((semua) => {
      const baru = (semua[kasus.id] || kasus.jawaban).slice();
      baru[i] = j;
      return { ...semua, [kasus.id]: baru };
    });
  }

  function tandaiRencana(i) {
    ubahKasus(kasus.id, (x) => ({ rencana: x.rencana.map((p, j) => (j === i ? [p[0], p[1], p[2], !p[3]] : p)) }));
  }

  function tambahCatatan() {
    const isi = catatan.trim();
    if (!isi) {
      toast("Tulis catatannya dulu");
      return;
    }
    ubahKasus(kasus.id, (x) => ({ riwayat: [[capWaktu(kini), "Bu Laras: " + isi], ...x.riwayat] }), 1);
    setCatatan("");
  }

  function eskalasi() {
    ubahKasus(
      kasus.id,
      (x) => ({
        eskalasi: true,
        penangan: [...x.penangan, ["HW", "Bu Hartini", "Kepala Sekolah · eskalasi"]],
        riwayat: [[capWaktu(kini), "Bu Laras mengeskalasi kasus ke Kepala Sekolah."], ...x.riwayat],
      }),
      2,
    );
    toast(`${kasus.id} dieskalasi. Bu Hartini menerima notifikasi aplikasi dan WhatsApp.`);
  }

  /** Tombol utama laci: memindahkan kasus ke tahap berikutnya (aturannya di kasusData.js). */
  function lanjutkanTahap() {
    const hasilAkhir = HASIL_AKHIR.find((h) => h.id === hasil) || HASIL_AKHIR[0];
    const langkah = langkahBerikut(kasus, kini, jawabanKasus, hasilAkhir);
    if (!langkah) return;
    if (langkah.ubah) ubahKasus(kasus.id, langkah.ubah, 2);
    toast(langkah.pesan);
  }

  // ---------- lapor kejadian ----------
  function ubahLapor(kunci, nilai) {
    setLapor((r) => ({ ...r, [kunci]: nilai }));
  }

  function jawabLapor(i, j) {
    setLapor((r) => {
      const jawaban = r.jawaban.slice();
      jawaban[i] = j;
      return { ...r, jawaban };
    });
  }

  function kirimLapor() {
    if (!lapor.jenis) {
      toast("Pilih dulu jenis kejadiannya");
      return;
    }
    const baru = kasusDariLapor(lapor, "KS-0" + (17 + nomorBaru), kini);
    setDaftar((semua) => [baru, ...semua]);
    setNomorBaru((n) => n + 1);
    setTercatat({ id: baru.id, tingkat: baru.tingkat });
    setSaring("aktif");
    setKini((t) => t + 2);
  }

  return (
    <div className={`isi ${css.layar}`}>
      <section className="titlerow">
        <div>
          <p className="eyebrow">Sekolah Proteksi · Lapor dan Tindak · Rabu, 11 Nov 2026, {jamMenit(kini)} WIB</p>
          <h1 className="h1">Kasus &amp; penanganan</h1>
          <p className="lead">
            Setiap laporan dicatat, dinilai tingkat keseriusannya, diteruskan ke orang yang tepat, lalu dipantau sampai selesai. Jam SLA
            mulai berjalan sejak laporan masuk, dan yang lewat batas otomatis naik ke atasan.
          </p>
        </div>
        <div className="tbtns">
          <button type="button" className="ghost" onClick={() => setLaci("aturan")}>
            <Ikon nama="jam" size={18} />
            Aturan SLA
          </button>
          <button type="button" className="btnp" onClick={bukaLapor}>
            <Ikon nama="tambah" size={18} />
            Lapor kejadian
          </button>
        </div>
      </section>

      <section className="card tcard">
        <div className="tophead">
          <KepalaKartu ikon="bendera" judul={["Alur Bila", "Terjadi Kejadian"]} />
          <span className="mut" style={{ fontSize: 12 }}>
            Klik tahap untuk menyaring antrean
          </span>
        </div>
        <div className="pipe">
          {TAHAP_ALUR.map((t, i) => {
            const n = hitungTahap(t.id);
            const aktif = saring === t.id;
            return (
              <div key={t.id} className="pitem">
                <button
                  type="button"
                  className={`pst${t.id === "analisis" && n > 0 ? " hot" : ""}${aktif ? " on" : ""}`}
                  aria-pressed={aktif}
                  onClick={() => setSaring(aktif ? "aktif" : t.id)}
                >
                  <span className="pl">{t.judul}</span>
                  <span className="pn">{n}</span>
                  <span className="pd">{t.ket}</span>
                </button>
                {i < TAHAP_ALUR.length - 1 && (
                  <span className="pchev" aria-hidden="true">
                    <Ikon nama="kanan" size={20} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="row4">
        <div className="card kpi">
          <KepalaKartu ikon="peringatan" judul={["Menunggu", "Analisis"]} as="h3" />
          <p className="num">{menunggu.length} kasus</p>
          <p className="ksub o">
            {menunggu.length
              ? menunggu.map((x) => `${x.id} · ${x.tingkat} · ${sla.get(x.id).label.toLowerCase()}`).join("; ")
              : "Tidak ada yang menunggu"}
          </p>
        </div>
        <div className="card kpi">
          <KepalaKartu ikon="atas" judul={["Lewat SLA", "dan Dieskalasi"]} as="h3" />
          <p className="num">{lewat.length} kasus</p>
          <p className="ksub r">
            {lewat.length
              ? lewat.map((x) => `${x.id} · ${sla.get(x.id).nama.toLowerCase()} ${sla.get(x.id).label.toLowerCase()}`).join("; ")
              : "Semua dalam batas waktu"}
          </p>
        </div>
        <div className="card kpi">
          <KepalaKartu ikon="jam" judul={["Respon Pertama", "Rata-rata"]} as="h3" />
          <p className="num">42 menit</p>
          <p className="ksub g">Semua tingkat, sejak 19 Okt</p>
        </div>
        <div className="card kpi">
          <KepalaKartu ikon="tugas" judul={["Ketepatan", "SLA"]} as="h3" />
          <p className="num">96%</p>
          <p className="ksub g">25 dari 26 tahap tepat waktu</p>
        </div>
      </section>

      <section className="card tcard">
        <div className="tophead">
          <KepalaKartu ikon="tiket" judul={["Antrean", "Kasus"]} />
          <Segmen label="Saring antrean" pilihan={pilihanSegmen} nilai={saring} onPilih={setSaring} />
        </div>
        <div className="tbox">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Kejadian</th>
                <th scope="col">Anak · kelas</th>
                <th scope="col">Tingkat</th>
                <th scope="col">Tahap</th>
                <th scope="col">Ditangani oleh</th>
                <th scope="col">SLA berikutnya</th>
                <th scope="col">Diperbarui</th>
              </tr>
            </thead>
            <tbody>
              {baris.map((c) => (
                <BarisKasus key={c.id} kasus={c} sla={sla.get(c.id)} onBuka={bukaKasus} />
              ))}
            </tbody>
          </table>
          {baris.length === 0 && <p className="empty">Tidak ada kasus di saringan ini.</p>}
        </div>
        <p className="rule">
          Nama anak pada kasus Darurat disingkat di daftar. Kasus yang melibatkan staf sekolah sebagai terlapor hanya bisa dibuka Kepala
          Sekolah dan pendamping Fammi.
        </p>
      </section>

      {laci === "kasus" && (
        <Laci label="Detail kasus" labelTutup="Tutup detail kasus" lebar={LEBAR_LACI} onTutup={tutupLaci}>
          <DetailKasus
            kasus={kasus}
            kini={kini}
            jawaban={jawabanKasus}
            catatan={catatan}
            hasil={hasil}
            onJawab={pilihJawabanKasus}
            onRencana={tandaiRencana}
            onCatatan={setCatatan}
            onTambahCatatan={tambahCatatan}
            onHasil={setHasil}
            onEskalasi={eskalasi}
            onLanjut={lanjutkanTahap}
            onTutup={tutupLaci}
          />
        </Laci>
      )}
      {laci === "lapor" && (
        <Laci label="Lapor kejadian" labelTutup="Tutup formulir laporan" lebar={LEBAR_LACI} onTutup={tutupLaci}>
          <FormLapor
            lapor={lapor}
            kini={kini}
            tercatat={tercatat}
            onUbah={ubahLapor}
            onJawab={jawabLapor}
            onKirim={kirimLapor}
            onBukaKasus={() => bukaKasus(tercatat.id)}
            onTutup={tutupLaci}
          />
        </Laci>
      )}
      {laci === "aturan" && (
        <Laci label="Aturan SLA" labelTutup="Tutup aturan SLA" lebar={LEBAR_LACI} onTutup={tutupLaci}>
          <AturanSla onAtur={() => toast("Pengaturan acuan SLA sekolah akan dibuka di jendela terpisah")} onTutup={tutupLaci} />
        </Laci>
      )}
    </div>
  );
}

/** Satu baris antrean. Nama anak kasus Darurat disingkat; kasus terlapor staf disembunyikan. */
function BarisKasus({ kasus: c, sla, onBuka }) {
  const anak = c.terbatas
    ? "Akses terbatas"
    : (c.tingkat === "Darurat" ? c.anakSingkat || c.anak : c.anak) + (c.kelas ? " · " + c.kelas : "");
  const nama =
    c.penangan
      .slice(0, 2)
      .map((w) => w[1])
      .join(", ") + (c.penangan.length > 2 ? " +" + (c.penangan.length - 2) : "");
  const tahap = TAHAP[c.tahap];
  return (
    <tr className={sla.telat ? "late" : undefined}>
      <td>
        <button type="button" className="idbtn" aria-label={`Buka kasus ${c.id}`} onClick={() => onBuka(c.id)}>
          {c.id}
        </button>
      </td>
      <td className="wrapcell">
        <b>
          {c.terbatas && <Ikon nama="gembok" size={14} warna="var(--sp-tinta-2)" />}
          {c.judul}
        </b>
        <span className="sub2">{c.kategori}</span>
      </td>
      <td>{anak}</td>
      <td>
        <span className={PIL_TINGKAT[c.tingkat]}>{c.tingkat}</span>
      </td>
      <td>
        <span className={tahap.pil}>{tahap.label}</span>
      </td>
      <td>
        <div className="avs">
          {c.penangan.slice(0, 3).map((w, i) => (
            <span key={i} className="av sm" aria-hidden="true">
              {w[0]}
            </span>
          ))}
          <span className="whoL">{nama}</span>
        </div>
      </td>
      <td>
        <div className="slac">
          <span className="slan">{sla.nama}</span>
          <span className={sla.pil}>{sla.label}</span>
        </div>
      </td>
      <td className="mut">{c.riwayat.length ? c.riwayat[0][0] : ""}</td>
    </tr>
  );
}

/** Tiga pilihan jawaban triase (Tidak, Tidak yakin, Ya). "Ya" yang terpilih berwarna merah. */
function PilihanJawaban({ pertanyaan, nilai, onPilih }) {
  return (
    <span className="qopts" role="group" aria-label={pertanyaan}>
      {JAWABAN.map((label, j) => {
        const aktif = nilai === j;
        return (
          <button
            key={label}
            type="button"
            className={`opt${aktif ? " on" : ""}${aktif && j === 2 ? " y" : ""}`}
            aria-pressed={aktif}
            onClick={() => onPilih(j)}
          >
            {label}
          </button>
        );
      })}
    </span>
  );
}

/** Isi laci detail kasus. Pada tahap analisis, tingkat dan penerusan dihitung ulang dari jawaban. */
function DetailKasus({
  kasus: c,
  kini,
  jawaban,
  catatan,
  hasil,
  onJawab,
  onRencana,
  onCatatan,
  onTambahCatatan,
  onHasil,
  onEskalasi,
  onLanjut,
  onTutup,
}) {
  const kepalaRef = useRef(null);
  const analisis = c.tahap === "analisis";
  const tingkat = analisis ? tingkatDari(jawaban) : c.tingkat;
  const langkahKini = c.tahap === "selesai" ? LANGKAH.length : URUTAN_TAHAP.indexOf(c.tahap) + 1;
  const penangan = analisis ? rute(tingkat, jawaban, c.kelas) : c.penangan;
  const nSelesai = c.rencana.filter((p) => p[3]).length;
  const tahap = TAHAP[c.tahap];
  const aksiTahap = AKSI_TAHAP[c.tahap];
  const alasan =
    alasanDari(jawaban) + (analisis ? ` Respon pertama paling lambat ${waktuLengkap(ATURAN[tingkat].respon(c.masuk))}.` : "");
  const aturanPenerusan =
    (analisis ? "Usulan penerusan, berlaku setelah Anda menetapkan tingkat. " : "") +
    (jawaban[4] === 2 ? "Terlapor staf sekolah: hanya Kepala Sekolah dan pendamping Fammi yang menangani, akses dibatasi. " : "") +
    ATURAN_TEKS[tingkat];

  // Tombol Eskalasi dan Tutup kasus hilang sesudah ditekan. Fokus pindah ke laci lebih dulu
  // supaya tidak jatuh ke luar dialog.
  function fokusKeLaci() {
    kepalaRef.current?.closest('[role="dialog"]')?.focus({ preventScroll: true });
  }

  return (
    <>
      <div className="dhead" ref={kepalaRef}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="dtags">
            <span className="pill sm gray">{c.id}</span>
            <span className={PIL_TINGKAT[tingkat]}>{tingkat}</span>
            <span className={tahap.pil}>{tahap.label}</span>
            {c.eskalasi && <span className="pill sm bad">Dieskalasi ke Kepala Sekolah</span>}
          </div>
          <h2 className="dtitle">{c.judul}</h2>
          <p className="dsub">{c.terbatas ? "Detail kasus disembunyikan untuk peran Anda." : c.uraian}</p>
        </div>
        <button type="button" className="xbtn" aria-label="Tutup" onClick={onTutup}>
          <Ikon nama="tutup" size={18} />
        </button>
      </div>

      {c.terbatas ? (
        <div className="lock">
          <Ikon nama="gembok" size={22} warna="var(--sp-tinta-4)" style={{ flex: "none" }} />
          <span>
            <b>Akses terbatas.</b> Terlapor dalam kasus ini adalah staf sekolah, jadi detail hanya terbuka untuk Kepala Sekolah dan
            pendamping Fammi. Anda tetap melihat tahap dan SLA agar beban kerja tim terbaca. Kasus masuk Rabu 21 Okt, kini dipantau sampai
            Rabu 18 Nov.
          </span>
        </div>
      ) : (
        <>
          <div className="meta">
            <div>
              <div className="mlabel">Masuk</div>
              <div className="mval">{c.masuk != null ? waktuLengkap(c.masuk) : c.masukLabel}</div>
            </div>
            <div>
              <div className="mlabel">Pelapor dan kanal</div>
              <div className="mval">{c.sumber || ""}</div>
            </div>
            <div>
              <div className="mlabel">Anak</div>
              <div className="mval">{c.anak + (c.kelas ? " · kelas " + c.kelas : "")}</div>
            </div>
            <div>
              <div className="mlabel">Kategori</div>
              <div className="mval">{c.kategori}</div>
            </div>
          </div>

          <ol className="stepper" aria-label="Tahap kasus">
            {LANGKAH.map((t, i) => (
              <li key={t} className={`sp${i === langkahKini ? " now" : ""}`} aria-current={i === langkahKini ? "step" : undefined}>
                <span className={`spd ${i < langkahKini ? "done" : i === langkahKini ? "now" : "next"}`}>{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>

          <div className="slabox" role="group" aria-label="Status SLA">
            {barisSla(c, kini, tingkat).map((r) => (
              <div key={r.judul} className="slarow">
                <span>
                  <b>{r.judul}</b>
                  <span className="slat">{r.target}</span>
                </span>
                <span className={r.pil}>{r.status}</span>
              </div>
            ))}
          </div>

          <div className="dsec">
            <h3 className="dsech">
              <span className="n">1</span>Analisis tingkat keseriusan
            </h3>
            {analisis && (
              <p className="rule">
                Jawaban di bawah berasal dari pelapor. Periksa dan koreksi, lalu tetapkan tingkatnya. Penanggung jawab dan batas SLA
                mengikuti tingkat.
              </p>
            )}
            <div>
              {PERTANYAAN.map((t, i) => (
                <div key={t} className="qrow">
                  <span>{t}</span>
                  {analisis ? (
                    <PilihanJawaban pertanyaan={t} nilai={jawaban[i]} onPilih={(j) => onJawab(i, j)} />
                  ) : (
                    <span className={`pill sm ${jawaban[i] === 2 ? "bad" : jawaban[i] === 1 ? "warn" : "gray"}`}>{JAWABAN[jawaban[i]]}</span>
                  )}
                </div>
              ))}
            </div>
            <div className={`res ${tingkat}`} aria-live="polite">
              <b>Tingkat {tingkat}</b>
              <span>{alasan}</span>
            </div>
          </div>

          <div className="dsec">
            <h3 className="dsech">
              <span className="n">2</span>Diteruskan ke orang yang tepat
            </h3>
            <div className="assg">
              {penangan.map((w, i) => (
                <span key={i} className="person">
                  <span className="av" aria-hidden="true">
                    {w[0]}
                  </span>
                  <span>
                    <b>{w[1]}</b>
                    <span className="r2">{w[2]}</span>
                  </span>
                </span>
              ))}
            </div>
            <p className="rule">{aturanPenerusan}</p>
          </div>

          <div className="dsec">
            <h3 className="dsech">
              <span className="n">3</span>Rencana tindak · {nSelesai} dari {c.rencana.length} selesai
            </h3>
            <div>
              {c.rencana.map((p, i) => (
                <label key={i} className={`chk${p[3] ? " done" : ""}`}>
                  <input type="checkbox" checked={p[3]} onChange={() => onRencana(i)} />
                  <span>
                    <b>{p[0]}</b>
                    <span className="mut">
                      {p[1]} · {p[2]}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="dsec">
            <h3 className="dsech">
              <span className="n">4</span>Pantau progres
            </h3>
            <div className="noteform">
              <label className="sr" htmlFor="kasus-catatan">
                Catatan baru
              </label>
              <input
                id="kasus-catatan"
                className="inp"
                placeholder="Tambah catatan perkembangan"
                value={catatan}
                onChange={(e) => onCatatan(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    onTambahCatatan();
                  }
                }}
              />
              <button type="button" className="ghost" onClick={onTambahCatatan}>
                Tambah
              </button>
            </div>
            <ol className="log">
              {c.riwayat.map((l, i) => (
                <li key={c.riwayat.length - i} className="logi">
                  <span className="logt">{l[0]}</span>
                  <span>{l[1]}</span>
                </li>
              ))}
            </ol>
          </div>

          {c.tahap === "pantau" && (
            <div className="fld">
              <label className="flabel" htmlFor="kasus-hasil">
                Hasil akhir saat menutup kasus
              </label>
              <select id="kasus-hasil" className="inp" value={hasil} onChange={(e) => onHasil(e.target.value)}>
                {HASIL_AKHIR.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="dfootbar">
            <span className="fnote">{aksiTahap.catatan}</span>
            {c.tahap !== "selesai" && !c.eskalasi && (
              <button
                type="button"
                className="btnr"
                onClick={() => {
                  fokusKeLaci();
                  onEskalasi();
                }}
              >
                Eskalasi
              </button>
            )}
            {c.tahap !== "selesai" && (
              <button
                type="button"
                className="btnp"
                onClick={() => {
                  if (c.tahap === "pantau") fokusKeLaci();
                  onLanjut();
                }}
              >
                {aksiTahap.label}
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}

/** Isi laci Lapor kejadian: formulir, lalu kotak hasil sesudah dikirim. */
function FormLapor({ lapor, kini, tercatat, onUbah, onJawab, onKirim, onBukaKasus, onTutup }) {
  const hasilRef = useRef(null);

  // Formulir diganti kotak hasil sesudah dikirim; fokus ikut pindah ke sana.
  useEffect(() => {
    if (tercatat) hasilRef.current?.focus();
  }, [tercatat]);

  const tingkat = tingkatDari(lapor.jawaban);
  const penerima = rute(tingkat, lapor.jawaban, lapor.kelas)
    .map((w) => `${w[1]} (${w[2]})`)
    .join(", ");
  const batas = ATURAN[tingkat].respon(kini);
  const batasLabel = hariKe(batas) === hariKe(kini) ? "hari ini " + jamMenit(batas) : waktuLengkap(batas);

  return (
    <>
      <KepalaLaci
        awal={
          <div className="tile red">
            <Ikon nama="lapor" size={22} />
          </div>
        }
        judul="Lapor kejadian"
        sub="Isi yang Anda ketahui saja. Identitas Anda hanya terlihat oleh tim penanganan."
        onTutup={onTutup}
      />

      {tercatat ? (
        <div className="okbox" ref={hasilRef} tabIndex={-1}>
          <b>Laporan {tercatat.id} tercatat</b>
          <span style={{ fontSize: 13, lineHeight: "19px" }}>
            {`Tingkat awal ${tercatat.tingkat}. Kasus masuk antrean tahap analisis dan jam SLA sudah berjalan. ${
              tercatat.tingkat === "Darurat" ? "Kepala Sekolah sudah diberi tahu otomatis." : "Anda juga bisa melihatnya di Tugas saya."
            }`}
          </span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btnp" onClick={onBukaKasus}>
              Buka kasus
            </button>
            <button type="button" className="ghost" onClick={onTutup}>
              Kembali ke antrean
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="danger">
            <Ikon nama="peringatan" size={18} warna="var(--sp-merah)" style={{ flex: "none" }} />
            <span>
              Bila anak dalam bahaya saat ini, amankan anak dulu dan hubungi 112 atau layanan SAPA 129. Isi laporan setelah anak aman.
            </span>
          </div>

          <div className="fld">
            <span className="flabel">Apa yang terjadi?</span>
            <div className="catgrid" role="group" aria-label="Jenis kejadian">
              {JENIS_KEJADIAN.map((j) => (
                <button
                  key={j}
                  type="button"
                  className={`catb${lapor.jenis === j ? " on" : ""}`}
                  aria-pressed={lapor.jenis === j}
                  onClick={() => onUbah("jenis", j)}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

          <div className="row2f">
            <div className="fld">
              <label className="flabel" htmlFor="kasus-lapor-nama">
                Nama anak (boleh kosong)
              </label>
              <input
                id="kasus-lapor-nama"
                className="inp"
                placeholder="Contoh: Raka Pratama"
                value={lapor.nama}
                onChange={(e) => onUbah("nama", e.target.value)}
              />
            </div>
            <div className="fld">
              <label className="flabel" htmlFor="kasus-lapor-kelas">
                Kelas
              </label>
              <select id="kasus-lapor-kelas" className="inp" value={lapor.kelas} onChange={(e) => onUbah("kelas", e.target.value)}>
                {KELAS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div className="fld">
              <label className="flabel" htmlFor="kasus-lapor-lokasi">
                Di mana
              </label>
              <select id="kasus-lapor-lokasi" className="inp" value={lapor.lokasi} onChange={(e) => onUbah("lokasi", e.target.value)}>
                {LOKASI.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="fld">
              <label className="flabel" htmlFor="kasus-lapor-kapan">
                Kapan
              </label>
              <select id="kasus-lapor-kapan" className="inp" value={lapor.kapan} onChange={(e) => onUbah("kapan", e.target.value)}>
                {WAKTU_KEJADIAN.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="fld">
            <label className="flabel" htmlFor="kasus-lapor-cerita">
              Ceritakan singkat
            </label>
            <textarea
              id="kasus-lapor-cerita"
              className="inp"
              rows={3}
              placeholder="Tulis apa yang Anda lihat atau dengar, tanpa menebak alasannya."
              value={lapor.cerita}
              onChange={(e) => onUbah("cerita", e.target.value)}
            />
          </div>

          <div className="dsec">
            <h3 className="dsech">
              <span className="n" aria-hidden="true">
                ?
              </span>
              Penilaian awal
            </h3>
            <div>
              {PERTANYAAN.map((t, i) => (
                <div key={t} className="qrow">
                  <span>{t}</span>
                  <PilihanJawaban pertanyaan={t} nilai={lapor.jawaban[i]} onPilih={(j) => onJawab(i, j)} />
                </div>
              ))}
            </div>
            <div className={`res ${tingkat}`} aria-live="polite">
              <b>Tingkat awal: {tingkat}</b>
              <span>Diteruskan ke: {penerima}</span>
              <span>Respon pertama paling lambat: {batasLabel}</span>
            </div>
          </div>

          <div className="dfootbar">
            <span className="fnote">Laporan tersimpan lengkap dengan waktu. Koordinator BK memeriksa tingkatnya sebelum diteruskan.</span>
            <button type="button" className="ghost" onClick={onTutup}>
              Batal
            </button>
            <button type="button" className="btnp" onClick={onKirim}>
              Kirim laporan
            </button>
          </div>
        </>
      )}
    </>
  );
}

/** Isi laci Aturan SLA: tabel tingkat, catatan aturan, dan tombol acuan sekolah. */
function AturanSla({ onAtur, onTutup }) {
  return (
    <>
      <KepalaLaci
        awal={
          <div className="tile p">
            <Ikon nama="jam" size={22} />
          </div>
        }
        judul="Aturan SLA dan penerusan"
        sub="Usulan awal. Batas waktu dan penanggung jawab bisa diatur tiap sekolah."
        onTutup={onTutup}
      />
      <div className="tbox">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">Tingkat</th>
              <th scope="col">Contoh</th>
              <th scope="col">Diteruskan ke</th>
              <th scope="col">Respon pertama</th>
              <th scope="col">Rencana tindak</th>
            </tr>
          </thead>
          <tbody>
            {ATURAN_SLA.map((a) => (
              <tr key={a.tingkat}>
                <td>
                  <span className={PIL_TINGKAT[a.tingkat]}>{a.tingkat}</span>
                </td>
                <td className="wrapcell">{a.contoh}</td>
                <td className="wrapcell">{a.ke}</td>
                <td>{ATURAN[a.tingkat].responL}</td>
                <td>{ATURAN[a.tingkat].rencanaL}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ol className="rlist">
        {CATATAN_ATURAN.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ol>
      <div className="dfootbar">
        <button type="button" className="ghost" onClick={onAtur}>
          Atur acuan sekolah
        </button>
        <button type="button" className="btnp" onClick={onTutup}>
          Tutup
        </button>
      </div>
    </>
  );
}

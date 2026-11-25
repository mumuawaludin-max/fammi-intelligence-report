import { useCallback, useEffect, useRef, useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaLaci, Laci, Segmen } from "../komponen";
import AlurBar from "../bersama/AlurBar";
import { ALUR, TAHAP_KASUS } from "../bersama/alur";
import { PEMILIK } from "../bersama/tindakLanjut";
import {
  ATURAN,
  ATURAN_SLA,
  ATURAN_STAF,
  ATURAN_TEKS,
  BOBOT_TINGKAT,
  CATATAN_ATURAN,
  HASIL_AKHIR,
  JAM_AWAL,
  JAWABAN,
  JENIS_KEJADIAN,
  KELAS,
  LOKASI,
  PERTANYAAN,
  PIL_TINGKAT,
  TAHAP,
  TINGKAT,
  URUTAN_TAHAP,
  WAKTU_KEJADIAN,
  aksiTahap,
  alasanDari,
  barisSla,
  batasDari,
  capWaktu,
  catatRespon,
  checklistKasus,
  kandidatTugas,
  kasusAwal,
  kasusDariLapor,
  kasusMendesak,
  kePantau,
  laporKosong,
  namaTugas,
  orangKasus,
  responBelum,
  slaKasus,
  tetapkanTingkat,
  tingkatDari,
  tugaskan,
  tutupKasus,
  usulanTugas,
  waktuLengkap,
} from "./kasusData";
import GrafikKasus from "./GrafikKasus";
import css from "./Kasus.module.css";

const LEBAR_LACI = 640;

/**
 * Saringan daftar kasus. Id tahap sama dengan TAHAP_KASUS, jadi bilah alur dan aksi
 * { jenis: "tahap", id } dari layar lain atau notifikasi langsung memasangnya. Label mengikuti
 * langkah alur kejadian. Kasus selesai tampil terlipat di bawah saringan "Semua aktif" dan
 * "Pantau & selesai"; aksi { jenis: "tahap", id: "selesai" } membuka saringan pantau dengan
 * lipatan itu terbuka.
 */
const SARINGAN = [
  { id: "aktif", label: "Semua aktif", cocok: (c) => c.tahap !== "selesai" },
  ...["triage", "tugas", "tangani", "pantau"].map((id) => ({ id, label: TAHAP[id].label, cocok: (c) => c.tahap === id })),
];

/** Dua peran di formulir Bagi tugas. */
const PERAN_TUGAS = [
  { id: "utama", label: "Utama" },
  { id: "pendukung", label: "Pendukung" },
];

/**
 * Kasus & penugasan (sudut pandang Bu Laras, Koordinator BK). Urutan layar mengikuti kebutuhan
 * Koordinator BK: (1) kasus yang perlu tindakan sekarang, satu tombol langsung ke langkahnya,
 * (2) daftar kasus per tahap yang ringkas (kode, judul, tingkat, tahap, sisa waktu), (3) seluruh
 * detail (kronologi, penilaian awal, rencana penanganan, catatan) di laci setelah baris diklik.
 * Semua data contoh dan hanya hidup di state layar ini; pembagian tugas dan laporan baru memberi
 * tahu peran lain lewat lonceng.
 */
export default function Kasus() {
  const { aksi, aksiSelesai, toast, setHitungKasus, beriTahu, centang, ubahCentang, pindah, laporanBaru, buatLaporan } =
    useProteksi();
  // Laporan yang dibuat selama demo dari layar mana pun (lihat konteks) masuk tahap Cek awal.
  const [daftar, setDaftar] = useState(() => [
    ...laporanBaru.map((l) => ({ ...kasusDariLapor(l.lapor, l.id, JAM_AWAL, l.sumber), ...(l.tambahan || {}) })),
    ...kasusAwal(centang),
  ]);
  const [kini, setKini] = useState(JAM_AWAL);
  const [saring, setSaring] = useState("aktif");
  const [bukaSelesai, setBukaSelesai] = useState(false);
  const [laci, setLaci] = useState(null);
  const [pilihan, setPilihan] = useState(null);
  // Isian laci yang belum dikirim, per kasus: jawaban penilaian yang dikoreksi, tingkat yang dipilih
  // saat cek awal, dan formulir Bagi tugas.
  const [koreksi, setKoreksi] = useState({});
  const [tingkatPilih, setTingkatPilih] = useState({});
  const [drafTugas, setDrafTugas] = useState({});
  const [catatan, setCatatan] = useState("");
  const [hasil, setHasil] = useState(HASIL_AKHIR[0].id);
  const [lapor, setLapor] = useState(laporKosong);
  const [tercatat, setTercatat] = useState(null);

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

  const pilihSaring = useCallback((id) => {
    setSaring(id === "selesai" ? "pantau" : id);
    setBukaSelesai(id === "selesai");
  }, []);

  const tutupLaci = () => setLaci(null);

  // Permintaan dari header, bilah alur layar lain, atau notifikasi. Laci sengaja dibuka lewat efek:
  // saat layar baru dipasang, efek induk memindahkan fokus ke judul lebih dulu, lalu laci yang
  // terbuka sesudahnya mengambil fokus dan mengembalikannya ke judul saat ditutup. Jenis aksi lain
  // (mis. gulir) bukan milik layar ini dan dibiarkan.
  useEffect(() => {
    if (!aksi || !["lapor", "kasus", "tahap"].includes(aksi.jenis)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- permintaan sekali pakai, sengaja sesudah efek induk (lihat atas)
    if (aksi.jenis === "lapor") bukaLapor();
    else if (aksi.jenis === "kasus" && daftar.some((c) => c.id === aksi.id)) bukaKasus(aksi.id);
    else if (aksi.jenis === "tahap" && TAHAP_KASUS.includes(aksi.id)) pilihSaring(aksi.id);
    aksiSelesai();
  }, [aksi, aksiSelesai, bukaLapor, bukaKasus, pilihSaring, daftar]);

  /** Ubah satu kasus; `menit` memajukan jam prototipe. */
  function ubahKasus(id, ubah, menit = 0) {
    setDaftar((semua) => semua.map((x) => (x.id === id ? { ...x, ...ubah(x) } : x)));
    if (menit) setKini((t) => t + menit);
  }

  // ---------- daftar ----------
  const sla = new Map(daftar.map((c) => [c.id, slaKasus(c, kini)]));
  const hitung = (id) => daftar.filter(SARINGAN.find((s) => s.id === id).cocok).length;
  const cocok = (SARINGAN.find((s) => s.id === saring) || SARINGAN[0]).cocok;
  // Urut menurut tahap alur, lalu yang terlambat, lalu tingkat.
  const peringkat = (c) =>
    URUTAN_TAHAP.indexOf(c.tahap) * 10 + (sla.get(c.id).telat ? 0 : 5) + BOBOT_TINGKAT[c.tingkat];
  const baris = daftar.filter(cocok).sort((a, b) => peringkat(a) - peringkat(b));
  const selesai = daftar.filter((c) => c.tahap === "selesai");
  const tampilSelesai = saring === "aktif" || saring === "pantau";
  const pilihanSegmen = SARINGAN.map((s) => ({
    id: s.id,
    label: (
      <>
        {s.label} <span className="segn">{hitung(s.id)}</span>
      </>
    ),
  }));

  const segera = kasusMendesak(daftar, kini);

  // Bilah alur: langkah yang menyala = saringan tahap yang aktif; angka = jumlah kasus per tahap.
  const aktifAlur = ALUR.kejadian.langkah.some((l) => l.id === saring) ? saring : null;
  const hitungAlur = Object.fromEntries(["triage", "tugas", "tangani", "pantau"].map((t) => [t, hitung(t)]));
  const pilihLangkah = (l) => (l.id === "lapor" ? bukaLapor() : pilihSaring(l.id));

  // Lencana tab Kejadian mengikuti jumlah kasus aktif di layar ini.
  const jumlahAktif = hitung("aktif");
  useEffect(() => {
    setHitungKasus(jumlahAktif);
  }, [jumlahAktif, setHitungKasus]);
  useEffect(() => () => setHitungKasus(null), [setHitungKasus]);

  // ---------- kasus yang terbuka di laci ----------
  const kasus = daftar.find((x) => x.id === pilihan) || daftar[0];
  const jawabanKasus = koreksi[kasus.id] || kasus.jawaban;
  const tingkatKasus = kasus.tahap === "triage" ? tingkatPilih[kasus.id] || tingkatDari(jawabanKasus) : kasus.tingkat;
  const drafKasus =
    drafTugas[kasus.id] ||
    (kasus.tugas
      ? { utama: kasus.tugas.utama, pendukung: kasus.tugas.pendukung }
      : usulanTugas(kasus.tingkat, jawabanKasus, kasus.kelas));

  function pilihJawabanKasus(i, j) {
    setKoreksi((semua) => {
      const baru = (semua[kasus.id] || kasus.jawaban).slice();
      baru[i] = j;
      return { ...semua, [kasus.id]: baru };
    });
  }

  /** Formulir Bagi tugas: satu penanggung jawab utama, pendukung boleh lebih dari satu. */
  function aturPeran(id, peran) {
    const awal = drafKasus;
    setDrafTugas((semua) => {
      const d = semua[kasus.id] || awal;
      let utama = d.utama;
      let pendukung = d.pendukung.filter((p) => p !== id);
      if (peran === "utama") {
        if (utama === id) return semua;
        // Utama lama tetap ikut menangani sebagai pendukung.
        if (utama) pendukung = [utama, ...pendukung];
        utama = id;
      } else if (d.pendukung.includes(id)) {
        // Menekan Pendukung lagi melepasnya dari pembagian tugas.
      } else {
        if (utama === id) utama = null;
        pendukung = [...pendukung, id];
      }
      return { ...semua, [kasus.id]: { utama, pendukung } };
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

  /** Teruskan ke Kepala Sekolah: Bu Hartini ikut menangani dan menerima notifikasi. */
  function teruskan() {
    const c = kasus;
    ubahKasus(
      c.id,
      (x) => ({
        eskalasi: true,
        tugas:
          x.tugas && x.tugas.utama !== "hartini" && !x.tugas.pendukung.includes("hartini")
            ? { ...x.tugas, pendukung: [...x.tugas.pendukung, "hartini"] }
            : x.tugas,
        riwayat: [[capWaktu(kini), "Bu Laras meneruskan kasus ke Kepala Sekolah."], ...x.riwayat],
      }),
      2,
    );
    beriTahu({
      peran: "kepsek",
      ikon: "atas",
      nada: "red",
      judul: `${c.id} diteruskan ke Anda`,
      isi: `${c.judul}. Bu Laras meminta keputusan Kepala Sekolah.`,
      tujuan: { layar: "kasus", aksi: { jenis: "kasus", id: c.id } },
    });
    toast(`${c.id} diteruskan ke Kepala Sekolah. Bu Hartini menerima notifikasi aplikasi dan WhatsApp.`);
  }

  /** Tombol utama laci: menjalankan langkah tahap ini (aturannya di kasusData.js). */
  function lanjutkan() {
    const c = kasus;
    let langkah = null;
    if (c.tahap === "triage") langkah = tetapkanTingkat(c, kini, tingkatKasus, jawabanKasus);
    else if (c.tahap === "tugas") {
      if (!drafKasus.utama) {
        toast("Pilih penanggung jawab utama dulu");
        return;
      }
      langkah = tugaskan(c, kini, drafKasus);
    } else if (c.tahap === "tangani") langkah = responBelum(c) ? catatRespon(c, kini) : kePantau(c, kini);
    else if (c.tahap === "pantau") langkah = tutupKasus(c, kini, HASIL_AKHIR.find((h) => h.id === hasil) || HASIL_AKHIR[0]);
    if (!langkah) return;
    if (langkah.ubah) ubahKasus(c.id, langkah.ubah, 2);
    if (langkah.notifikasi) beriTahu(langkah.notifikasi);
    if (langkah.centang) langkah.centang.forEach((id) => ubahCentang(id, true));
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
      toast("Pilih jenis kejadian dulu");
      return;
    }
    // Nomor dibagi konteks (satu urutan untuk semua layar); laporannya juga tersimpan di sana.
    const id = buatLaporan({ lapor, sumber: "Bu Laras (staf) · aplikasi sekolah" });
    const baru = kasusDariLapor(lapor, id, kini);
    setDaftar((semua) => [baru, ...semua]);
    setTercatat({ id, tingkat: baru.tingkat });
    pilihSaring("triage");
    setKini((t) => t + 2);
    beriTahu({
      peran: ["bk", "kepsek"],
      ikon: "peringatan",
      nada: "red",
      judul: `Laporan baru ${id}`,
      isi: `${baru.kategori}, kelas ${baru.kelas}. Usulan tingkat ${baru.tingkat}, menunggu dicek.`,
      tujuan: { layar: "kasus", aksi: { jenis: "kasus", id } },
    });
    toast(`Laporan ${id} masuk, menunggu cek awal.`);
  }

  return (
    <div className={`isi ${css.layar}`}>
      <AlurBar alur="kejadian" aktif={aktifAlur} hitung={hitungAlur} onLangkah={pilihLangkah} />

      <section className="titlerow">
        <div>
          <h1 className="h1">Kasus</h1>
          <p className="lead">Kasus mendesak di atas; klik satu kasus untuk detailnya.</p>
        </div>
        <div className="tbtns">
          <button type="button" className="ghost" onClick={() => setLaci("aturan")}>
            <Ikon nama="jam" size={18} />
            Lihat aturan batas waktu
          </button>
          <button type="button" className="btnp" onClick={bukaLapor}>
            <Ikon nama="tambah" size={18} />
            Lapor kejadian
          </button>
        </div>
      </section>

      <section className="sgsek" aria-labelledby="kasus-segera" data-bagian="segera">
        <div className="sgh">
          <h2 className="sgj" id="kasus-segera">
            Perlu tindakan sekarang <span className="sgn">{segera.length}</span>
          </h2>
          <span className="jamsla">Per {waktuLengkap(kini)}</span>
        </div>
        {segera.length ? (
          <ul className="sglist">
            {segera.map((c) => (
              <KartuSegera key={c.id} kasus={c} sla={sla.get(c.id)} onBuka={bukaKasus} />
            ))}
          </ul>
        ) : (
          <p className="reco ok">Tidak ada kasus mendesak. Semua masih dalam batas waktu.</p>
        )}
      </section>

      <section className="card tcard" aria-labelledby="kasus-gambaran">
        <div className="tophead">
          <h2 className="ctitle" id="kasus-gambaran">
            Gambaran kasus aktif
          </h2>
          <span className="lipk">Klik baris untuk menyaring daftar</span>
        </div>
        <GrafikKasus daftar={daftar} onTahap={pilihSaring} terpilih={saring} />
      </section>

      <section className="card tcard" data-bagian="antrean" aria-labelledby="kasus-daftar">
        <div className="tophead">
          <h2 className="ctitle" id="kasus-daftar">
            Daftar kasus
          </h2>
          <Segmen label="Saring kasus menurut tahap" pilihan={pilihanSegmen} nilai={saring} onPilih={pilihSaring} />
        </div>
        {baris.length ? (
          <ul className="klist">
            {baris.map((c) => (
              <BarisKasus key={c.id} kasus={c} sla={sla.get(c.id)} onBuka={bukaKasus} />
            ))}
          </ul>
        ) : (
          <p className="empty">Tidak ada kasus di tahap ini.</p>
        )}
        {tampilSelesai && selesai.length > 0 && (
          <details className="lipat" open={bukaSelesai} onToggle={(e) => setBukaSelesai(e.currentTarget.open)}>
            <summary>
              <span>Sudah selesai</span>
              <span className="lipk">{selesai.length} kasus</span>
              <Ikon nama="kanan" size={16} className="lipv" />
            </summary>
            <ul className="klist">
              {selesai.map((c) => (
                <BarisKasus key={c.id} kasus={c} sla={sla.get(c.id)} onBuka={bukaKasus} />
              ))}
            </ul>
          </details>
        )}
      </section>

      {laci === "kasus" && (
        <Laci label={`Detail kasus ${kasus.id}`} labelTutup="Tutup detail kasus" lebar={LEBAR_LACI} onTutup={tutupLaci}>
          <DetailKasus
            kasus={kasus}
            kini={kini}
            jawaban={jawabanKasus}
            tingkat={tingkatKasus}
            draf={drafKasus}
            centang={centang}
            catatan={catatan}
            hasil={hasil}
            onJawab={pilihJawabanKasus}
            onTingkat={(t) => setTingkatPilih((s) => ({ ...s, [kasus.id]: t }))}
            onPeran={aturPeran}
            onRencana={tandaiRencana}
            onCatatan={setCatatan}
            onTambahCatatan={tambahCatatan}
            onHasil={setHasil}
            onTeruskan={teruskan}
            onLanjut={lanjutkan}
            onSkrining={() => pindah("skrining")}
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
        <Laci label="Aturan batas waktu" labelTutup="Tutup aturan batas waktu" lebar={LEBAR_LACI} onTutup={tutupLaci}>
          <AturanBatas onAtur={() => toast("Pengaturan acuan sekolah dibuka di jendela terpisah")} onTutup={tutupLaci} />
        </Laci>
      )}
    </div>
  );
}

/** Pil tingkat. Saat cek awal tingkatnya masih usulan pelapor: pil berlatar abu dengan teks berwarna. */
function PilTingkat({ tingkat, usul }) {
  return (
    <span className={`${PIL_TINGKAT[tingkat]}${usul ? " usul" : ""}`} title={usul ? "Usulan pelapor, belum ditetapkan" : undefined}>
      {tingkat}
      {usul && <span className="sr"> (usulan)</span>}
    </span>
  );
}

/** Satu kartu "Perlu tindakan sekarang": alasan mendesaknya, lalu satu tombol ke langkah berikutnya. */
function KartuSegera({ kasus: c, sla, onBuka }) {
  const aksi = aksiTahap(c);
  const nada = sla.telat || c.tingkat === "Darurat" ? "merah" : "kuning";
  return (
    <li className={`sgcard ${nada}`}>
      <span className="sgtop">
        <PilTingkat tingkat={c.tingkat} usul={c.tahap === "triage"} />
        <span className="sgid">{c.id}</span>
        <span className="sgthp">{TAHAP[c.tahap].label}</span>
      </span>
      <b className="sgjud">{c.judul}</b>
      <span className="sgsla">
        {sla.nama} · <b className={sla.telat ? "r" : undefined}>{sla.label}</b>
      </span>
      <button type="button" className="btnp sgbtn" aria-label={`${aksi.segera} ${c.id}`} onClick={() => onBuka(c.id)}>
        {aksi.segera}
        <Ikon nama="kanan" size={16} />
      </button>
    </li>
  );
}

/** Satu baris daftar: kode, judul singkat, tingkat, tahap, sisa waktu. Seluruh baris satu tombol. */
function BarisKasus({ kasus: c, sla, onBuka }) {
  const tahap = TAHAP[c.tahap];
  return (
    <li>
      <button type="button" className="kbaris" onClick={() => onBuka(c.id)}>
        <span className="kid">{c.id}</span>
        <span className="kjud">
          {c.terbatas && <Ikon nama="gembok" size={13} warna="var(--sp-tinta-2)" />}
          <span className="kjt">{c.judul}</span>
        </span>
        <span className="kmeta">
          <span className="ktk">
            <PilTingkat tingkat={c.tingkat} usul={c.tahap === "triage"} />
          </span>
          <span className={`thp ${c.tahap}`}>
            <span className="thn" aria-hidden="true">
              {tahap.no ?? <Ikon nama="centang" size={12} />}
            </span>
            {tahap.label}
          </span>
          <span className="ksla">
            <span className={`${sla.pil} tg`} title={sla.nama}>
              {sla.label}
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}

/** Bagian yang dilipat di laci detail. */
function Lipat({ judul, info, children }) {
  return (
    <details className="lipat">
      <summary>
        <span>{judul}</span>
        {info != null && <span className="lipk">{info}</span>}
        <Ikon nama="kanan" size={16} className="lipv" />
      </summary>
      <div className="lipi">{children}</div>
    </details>
  );
}

/**
 * Tiga pilihan jawaban penilaian awal (Tidak, Tidak yakin, Ya). Yang terpilih berwarna menurut
 * bobotnya: Tidak ungu lembut, Tidak yakin kuning, Ya merah, supaya jawaban yang menaikkan tingkat
 * langsung terlihat.
 */
function PilihanJawaban({ pertanyaan, nilai, onPilih }) {
  return (
    <span className="qopts" role="group" aria-label={pertanyaan}>
      {JAWABAN.map((label, j) => {
        const aktif = nilai === j;
        return (
          <button
            key={label}
            type="button"
            className={`opt${aktif ? " on" : ""}${aktif && j === 1 ? " r" : ""}${aktif && j === 2 ? " y" : ""}`}
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

/** Alur lima langkah satu kasus: langkah yang sudah lewat bercentang dengan waktunya. */
function AlurKasus({ kasus: c }) {
  const langkah = ALUR.kejadian.langkah;
  const aktif = c.tahap === "selesai" ? langkah.length : langkah.findIndex((l) => l.id === c.tahap);
  return (
    <ol className="alurk" aria-label={`Alur kasus ${c.id}`}>
      {langkah.map((l, i) => {
        const lewat = i < aktif;
        const sekarang = i === aktif;
        return (
          <li key={l.id} className={`ak${lewat ? " lewat" : ""}${sekarang ? " kini" : ""}`} aria-current={sekarang ? "step" : undefined}>
            <span className="akn" aria-hidden="true">
              {lewat ? <Ikon nama="centang" size={13} /> : i + 1}
            </span>
            <span className="akl">
              {l.label}
              {lewat && <span className="sr">, selesai</span>}
            </span>{" "}
            <span className="akw">{lewat ? c.waktu?.[l.id] || "" : sekarang ? "Sekarang" : ""}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Cek awal: empat tingkat dengan batas waktunya, usulan dari jawaban pelapor, jawaban yang bisa dikoreksi. */
function BlokTingkat({ kasus: c, jawaban, tingkat, onTingkat, onJawab }) {
  const usulan = tingkatDari(jawaban);
  const penerima = namaTugas(usulanTugas(tingkat, jawaban, c.kelas)).join(", ");
  return (
    <section className="blok" aria-labelledby="kasus-tingkat">
      <div className="blokh">
        <h3 className="blokj" id="kasus-tingkat">
          Tetapkan tingkat
        </h3>
        <span className="blokk">Batas waktu dihitung sejak laporan masuk</span>
      </div>
      <div className="tkgrid" role="group" aria-labelledby="kasus-tingkat">
        {TINGKAT.map((t) => {
          const a = ATURAN[t];
          const pilih = t === tingkat;
          return (
            <button key={t} type="button" className={`tkb${pilih ? " on" : ""}`} aria-pressed={pilih} onClick={() => onTingkat(t)}>
              <span className="tkh">
                <span className={PIL_TINGKAT[t]}>{t}</span>
                {t === usulan && <span className="tku">Usulan</span>}
              </span>{" "}
              <span>
                Tanggapan <b>{a.responL}</b>
              </span>{" "}
              <span>
                Rencana <b>{a.rencanaL}</b>
              </span>
            </button>
          );
        })}
      </div>
      <p className="reco info">
        <b>Usulan {usulan}.</b> {alasanDari(jawaban)} Penanggung jawab {tingkat}: {penerima}.
      </p>
      <p className="rule">{jawaban[4] === 2 ? ATURAN_STAF : ATURAN_TEKS[tingkat]}</p>
      <Lipat judul="Periksa jawaban pelapor" info="Penilaian awal">
        {PERTANYAAN.map((t, i) => (
          <div key={t} className="qrow">
            <span>{t}</span>
            <PilihanJawaban pertanyaan={t} nilai={jawaban[i]} onPilih={(j) => onJawab(i, j)} />
          </div>
        ))}
      </Lipat>
    </section>
  );
}

/**
 * Daftar penanggung jawab. Bagi tugas: formulir (utama dan pendukung). Sesudahnya: siapa memegang
 * kasus dan butir checklist yang lahir dari pembagian tugas ini.
 */
function DaftarTugas({ kasus: c, draf, centang, onPeran }) {
  const form = c.tahap === "tugas";
  const tampil = form ? draf : c.tugas;
  const peranDi = (id) => (tampil?.utama === id ? "utama" : tampil?.pendukung.includes(id) ? "pendukung" : null);
  const daftarOrang = form
    ? [...new Set([...kandidatTugas(c.kelas), ...(tampil.utama ? [tampil.utama] : []), ...tampil.pendukung])]
    : tampil
      ? [tampil.utama, ...tampil.pendukung]
      : [];
  const butir = checklistKasus(c.id);

  return (
    <>
      <ul className="pjl">
        {daftarOrang.map((id) => {
          const o = orangKasus(id);
          if (!o) return null;
          const st = peranDi(id);
          return (
            <li key={id} className={`pjr${form && st ? " on" : ""}`}>
              <span className="av" aria-hidden="true">
                {o.inisial}
              </span>
              <span className="pjn">
                <b>{o.nama}</b> {o.peran}
              </span>
              {form ? (
                <Segmen label={`Peran ${o.nama}`} pilihan={PERAN_TUGAS} nilai={st} onPilih={(p) => onPeran(id, p)} className="pjseg" />
              ) : (
                <span className={st === "utama" ? "pill sm mid" : "pill sm gray"}>{st === "utama" ? "Utama" : "Pendukung"}</span>
              )}
            </li>
          );
        })}
      </ul>
      {c.tugas &&
        butir.map((b) => (
          <p key={b.id} className="ckl">
            <Ikon nama="ceklis" size={16} />
            <span>
              Checklist {PEMILIK[b.oleh]?.orang}: {b.judul.replace(c.id + ": ", "")} · {b.waktu}
            </span>
            <span className={centang[b.id] ? "pill sm ok" : "pill sm gray"}>{centang[b.id] ? "Dicentang" : "Belum dicentang"}</span>
          </p>
        ))}
    </>
  );
}

/** Tiga baris batas waktu: tanggapan pertama, rencana penanganan, pemantauan. */
function BatasWaktu({ kasus: c, kini, tingkat }) {
  return (
    <div className="slal" role="group" aria-label="Batas waktu">
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
  );
}

/** Rencana penanganan: butir yang bisa dicentang selama kasus belum selesai. */
function DaftarRencana({ kasus: c, onRencana }) {
  return (
    <div>
      {c.rencana.map((p, i) => (
        <label key={i} className={`chk${p[3] ? " done" : ""}`}>
          <input type="checkbox" checked={p[3]} disabled={c.tahap === "selesai"} onChange={() => onRencana(i)} />
          <span>
            <b>{p[0]}</b>
            <span className="mut">
              {p[1]} · {p[2]}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}

/**
 * Isi laci detail kasus. Paling atas langkah tahap ini (tetapkan tingkat, bagi tugas, rencana
 * penanganan, atau hasil akhir); data lain dilipat. Tombol utama di bilah bawah menjalankan langkahnya.
 */
function DetailKasus({
  kasus: c,
  kini,
  jawaban,
  tingkat,
  draf,
  centang,
  catatan,
  hasil,
  onJawab,
  onTingkat,
  onPeran,
  onRencana,
  onCatatan,
  onTambahCatatan,
  onHasil,
  onTeruskan,
  onLanjut,
  onSkrining,
  onTutup,
}) {
  const kepalaRef = useRef(null);
  const triage = c.tahap === "triage";
  const aksi = aksiTahap(c);
  const nSelesai = c.rencana.filter((p) => p[3]).length;
  const infoRencana = `${nSelesai} dari ${c.rencana.length} selesai`;
  const adaRencana = ["tangani", "pantau", "selesai"].includes(c.tahap) && c.rencana.length > 0;
  const bisaTeruskan = (c.tahap === "tangani" || c.tahap === "pantau") && !c.eskalasi;
  const utama = orangKasus(c.tugas?.utama);

  // Tombol Teruskan dan Selesaikan kasus hilang sesudah ditekan. Fokus pindah ke laci lebih dulu
  // supaya tidak jatuh ke luar dialog.
  function fokusKeLaci() {
    kepalaRef.current?.closest('[role="dialog"]')?.focus({ preventScroll: true });
  }

  return (
    <>
      <div className="dhead" ref={kepalaRef}>
        <div className="dheadi">
          <div className="dtags">
            <span className="pill sm gray">{c.id}</span>
            <PilTingkat tingkat={tingkat} usul={triage} />
            <span className="pill sm gray">{TAHAP[c.tahap].label}</span>
            {c.dariSkrining && <span className="pill sm mid">Dari screening HEART</span>}
            {c.eskalasi && <span className="pill sm bad">Diteruskan ke Kepala Sekolah</span>}
          </div>
          <h2 className="dtitle">{c.judul}</h2>
          <p className="dsub">{c.terbatas ? "Detail kasus disembunyikan untuk peran Anda." : c.uraian}</p>
          {c.dariSkrining && (
            <p className="skrl">
              <Ikon nama="skrining" size={15} />
              Dibuat dari tanda bahaya di screening HEART.
              <button type="button" className="lnk" onClick={onSkrining}>
                Buka screening
              </button>
            </p>
          )}
        </div>
        <button type="button" className="xbtn" aria-label="Tutup" onClick={onTutup}>
          <Ikon nama="tutup" size={18} />
        </button>
      </div>

      {!c.terbatas && (
        <dl className="dmeta">
          <div>
            <dt>Anak</dt>
            <dd>{c.anak + (c.kelas ? " · " + c.kelas : "")}</dd>
          </div>
          <div>
            <dt>Masuk</dt>
            <dd>{c.masuk != null ? waktuLengkap(c.masuk) : c.masukLabel}</dd>
          </div>
          <div>
            <dt>Penanggung jawab</dt>
            <dd>{utama ? utama.nama : "Belum ditunjuk"}</dd>
          </div>
        </dl>
      )}

      <AlurKasus kasus={c} />

      {c.terbatas ? (
        <div className="lock">
          <Ikon nama="gembok" size={22} warna="var(--sp-tinta-3)" style={{ flex: "none" }} />
          <span>
            <b>Akses terbatas.</b> Terlapor staf sekolah, jadi detailnya hanya untuk Kepala Sekolah dan pendamping Fammi. Masuk Rabu 21
            Okt, dipantau sampai Rabu 18 Nov.
          </span>
        </div>
      ) : (
        <>
          {/* Langkah tahap ini, selalu terbuka. */}
          {triage && <BlokTingkat kasus={c} jawaban={jawaban} tingkat={tingkat} onTingkat={onTingkat} onJawab={onJawab} />}

          {c.tahap === "tugas" && (
            <section className="blok" aria-labelledby="kasus-tugas">
              <div className="blokh">
                <h3 className="blokj" id="kasus-tugas">
                  Bagi tugas
                </h3>
                <span className="blokk">Satu utama, pendukung boleh lebih dari satu</span>
              </div>
              {c.tugas && !c.tugas.tetap && (
                <p className="rule">Ditunjuk otomatis {c.tugas.waktu} menurut aturan {c.tingkat} dan sudah diberi tahu. Periksa, lalu bagi tugas.</p>
              )}
              <DaftarTugas kasus={c} draf={draf} centang={centang} onPeran={onPeran} />
            </section>
          )}

          {c.tahap === "tangani" && adaRencana && (
            <section className="blok" aria-labelledby="kasus-rencana">
              <div className="blokh">
                <h3 className="blokj" id="kasus-rencana">
                  Rencana penanganan
                </h3>
                <span className="blokk">{infoRencana}</span>
              </div>
              <DaftarRencana kasus={c} onRencana={onRencana} />
            </section>
          )}

          {c.tahap === "pantau" && (
            <div className="fld blok">
              <label className="flabel" htmlFor="kasus-hasil">
                Hasil akhir
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

          {/* Data pendukung, dilipat. */}
          <div className="lipatan">
            {c.tugas && c.tahap !== "tugas" && (
              <Lipat judul="Penanggung jawab" info={namaTugas(c.tugas).length + " orang"}>
                <DaftarTugas kasus={c} draf={draf} centang={centang} onPeran={onPeran} />
              </Lipat>
            )}
            <Lipat judul="Batas waktu" info={slaKasus(c, kini).label}>
              <BatasWaktu kasus={c} kini={kini} tingkat={tingkat} />
            </Lipat>
            {adaRencana && c.tahap !== "tangani" && (
              <Lipat judul="Rencana penanganan" info={infoRencana}>
                <DaftarRencana kasus={c} onRencana={onRencana} />
              </Lipat>
            )}
            {!triage && (
              <Lipat judul="Penilaian awal" info={`Tingkat ${c.tingkat}`}>
                {PERTANYAAN.map((t, i) => (
                  <div key={t} className="qrow">
                    <span>{t}</span>
                    <b className="qjaw">{JAWABAN[c.jawaban[i]]}</b>
                  </div>
                ))}
              </Lipat>
            )}
            <Lipat judul="Data laporan" info={c.kategori}>
              <dl className="dmeta">
                <div>
                  <dt>Pelapor dan kanal</dt>
                  <dd>{c.sumber || ""}</dd>
                </div>
                <div>
                  <dt>Jenis</dt>
                  <dd>{c.kategori}</dd>
                </div>
              </dl>
            </Lipat>
            <Lipat judul="Catatan kejadian" info={c.riwayat.length + " catatan"}>
              {c.tahap !== "selesai" && (
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
              )}
              <ol className="log">
                {c.riwayat.map((l, i) => (
                  <li key={c.riwayat.length - i} className="logi">
                    <span className="logt">{l[0]}</span>
                    <span>{l[1]}</span>
                  </li>
                ))}
              </ol>
            </Lipat>
          </div>

          <div className="dfootbar">
            <span className="fnote">{aksi.catatan}</span>
            {bisaTeruskan && (
              <button
                type="button"
                className="btnr"
                onClick={() => {
                  fokusKeLaci();
                  onTeruskan();
                }}
              >
                Teruskan ke Kepala Sekolah
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
                {triage ? `${aksi.label} ${tingkat}` : aksi.label}
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}

/** Isi laci Lapor kejadian (laporan keselamatan): formulir ringkas, lalu kotak hasil sesudah dikirim. */
function FormLapor({ lapor, kini, tercatat, onUbah, onJawab, onKirim, onBukaKasus, onTutup }) {
  const hasilRef = useRef(null);

  // Formulir diganti kotak hasil sesudah dikirim; fokus ikut pindah ke sana.
  useEffect(() => {
    if (tercatat) hasilRef.current?.focus();
  }, [tercatat]);

  const tingkat = tingkatDari(lapor.jawaban);
  const penerima = namaTugas(usulanTugas(tingkat, lapor.jawaban, lapor.kelas)).join(", ");
  const batas = batasDari(ATURAN[tingkat].respon(kini), kini);

  return (
    <>
      <KepalaLaci
        awal={
          <div className="tile red">
            <Ikon nama="lapor" size={22} />
          </div>
        }
        judul="Lapor kejadian"
        sub="Isi yang Anda ketahui saja; identitas pelapor hanya dilihat tim penanganan."
        onTutup={onTutup}
      />

      {tercatat ? (
        <div className="okbox" ref={hasilRef} tabIndex={-1}>
          <b>Laporan {tercatat.id} tercatat</b>
          <span>
            Usulan tingkat {tercatat.tingkat}, menunggu dicek. Koordinator BK dan Kepala Sekolah sudah diberi tahu, batas waktu mulai
            berjalan.
          </span>
          <div className="okacts">
            <button type="button" className="btnp" onClick={onBukaKasus}>
              Buka kasus
            </button>
            <button type="button" className="ghost" onClick={onTutup}>
              Kembali ke daftar kasus
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="reco bad lapdgr">
            <Ikon nama="peringatan" size={16} style={{ flex: "none", marginTop: 1 }} />
            <span>Bila anak dalam bahaya saat ini, amankan anak dulu dan minta bantuan orang dewasa terdekat. Isi laporan setelah anak aman.</span>
          </p>

          <div className="fld">
            <span className="flabel" id="kasus-lapor-jenis">
              Apa yang terjadi?
            </span>
            <div className="chips" role="group" aria-labelledby="kasus-lapor-jenis">
              {JENIS_KEJADIAN.map((j) => (
                <button
                  key={j}
                  type="button"
                  className={`chip${lapor.jenis === j ? " on" : ""}`}
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
              rows={2}
              placeholder="Tulis yang Anda lihat atau dengar, tanpa menebak sebabnya."
              value={lapor.cerita}
              onChange={(e) => onUbah("cerita", e.target.value)}
            />
          </div>

          <section className="blok" aria-labelledby="kasus-lapor-nilai">
            <div className="blokh">
              <h3 className="blokj" id="kasus-lapor-nilai">
                Penilaian awal
              </h3>
              <span className="blokk">Menentukan usulan tingkat</span>
            </div>
            <div>
              {PERTANYAAN.map((t, i) => (
                <div key={t} className="qrow">
                  <span>{t}</span>
                  <PilihanJawaban pertanyaan={t} nilai={lapor.jawaban[i]} onPilih={(j) => onJawab(i, j)} />
                </div>
              ))}
            </div>
            <div className={`res ${tingkat}`} aria-live="polite">
              <b>Usulan tingkat {tingkat}</b>
              <span>
                Tanggapan pertama paling lambat {batas}. Usulan penanggung jawab: {penerima}.
              </span>
            </div>
          </section>

          <div className="dfootbar">
            <span className="fnote">Setelah dikirim, Koordinator BK menetapkan tingkat lalu membagi tugas.</span>
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

/** Isi laci Aturan batas waktu: tabel tingkat, catatan aturan, angka bulan ini, dan tombol acuan sekolah. */
function AturanBatas({ onAtur, onTutup }) {
  return (
    <>
      <KepalaLaci
        awal={
          <div className="tile p">
            <Ikon nama="jam" size={22} />
          </div>
        }
        judul="Aturan batas waktu"
        sub="Usulan awal, bisa diatur tiap sekolah."
        onTutup={onTutup}
      />
      <div className="atbox">
        <table className="tbl atur">
          <thead>
            <tr>
              <th scope="col">Tingkat</th>
              <th scope="col">Contoh</th>
              <th scope="col">Penanggung jawab</th>
              <th scope="col">Tanggapan pertama</th>
              <th scope="col">Rencana penanganan</th>
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
      <dl className="dmeta angka">
        <div>
          <dt>Tanggapan pertama rata-rata</dt>
          <dd>42 menit, semua tingkat sejak 19 Okt</dd>
        </div>
        <div>
          <dt>Tepat waktu</dt>
          <dd>96%, 25 dari 26 tahap</dd>
        </div>
      </dl>
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

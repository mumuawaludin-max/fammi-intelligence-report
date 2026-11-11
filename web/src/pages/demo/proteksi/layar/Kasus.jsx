import { useCallback, useEffect, useRef, useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaKartu, KepalaLaci, Laci, Segmen } from "../komponen";
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
  SAYA,
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
  kePantau,
  laporKosong,
  namaTugas,
  orangKasus,
  responBelum,
  slaKasus,
  tetapkanTingkat,
  tingkatDari,
  tugasSaya,
  tugaskan,
  tutupKasus,
  usulanTugas,
  waktuLengkap,
} from "./kasusData";
import css from "./Kasus.module.css";

const LEBAR_LACI = 640;

/**
 * Saringan antrean (segmen). Id tahap sama dengan TAHAP_KASUS, jadi bilah alur dan aksi
 * { jenis: "tahap", id } dari layar lain atau notifikasi langsung memasangnya.
 */
const SARINGAN = [
  { id: "aktif", label: "Semua aktif", cocok: (c) => c.tahap !== "selesai" },
  { id: "triage", label: "Triage", cocok: (c) => c.tahap === "triage" },
  { id: "tugas", label: "Penugasan", cocok: (c) => c.tahap === "tugas" },
  { id: "tangani", label: "Penanganan", cocok: (c) => c.tahap === "tangani" },
  { id: "pantau", label: "Pantau", cocok: (c) => c.tahap === "pantau" },
  { id: "selesai", label: "Selesai", cocok: (c) => c.tahap === "selesai" },
  { id: "saya", label: "Tugas saya", cocok: tugasSaya },
];

/** Dua peran di formulir Tugaskan. */
const PERAN_TUGAS = [
  { id: "utama", label: "Utama" },
  { id: "pendukung", label: "Pendukung" },
];

/**
 * Kasus & penugasan (sudut pandang Bu Laras, Koordinator BK): alur kejadian lapor -> triage ->
 * penugasan -> penanganan -> pantau dan tutup. Bilah alur sekaligus saringan antrean, empat angka
 * ringkas, antrean padat, laci detail kasus (alur lima langkah, tetapkan tingkat, tugaskan, rencana
 * tindak, pemantauan, riwayat), laci Lapor kejadian, dan laci Aturan SLA. Semua data contoh dan
 * hanya hidup di state layar ini; penugasan dan laporan baru memberi tahu peran lain lewat lonceng.
 */
export default function Kasus() {
  const { aksi, aksiSelesai, toast, setHitungKasus, beriTahu, centang, ubahCentang, pindah, laporanBaru, buatLaporan } =
    useProteksi();
  // Laporan yang dibuat selama demo dari layar mana pun (lihat konteks) masuk antrean di tahap triage.
  const [daftar, setDaftar] = useState(() => [
    ...laporanBaru.map((l) => ({ ...kasusDariLapor(l.lapor, l.id, JAM_AWAL, l.sumber), ...(l.tambahan || {}) })),
    ...kasusAwal(centang),
  ]);
  const [kini, setKini] = useState(JAM_AWAL);
  const [saring, setSaring] = useState("aktif");
  const [laci, setLaci] = useState(null);
  const [pilihan, setPilihan] = useState(null);
  // Isian laci yang belum dikirim, per kasus: jawaban penilaian yang dikoreksi, tingkat yang dipilih
  // saat triage, dan formulir Tugaskan.
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
    else if (aksi.jenis === "tahap" && TAHAP_KASUS.includes(aksi.id)) setSaring(aksi.id);
    aksiSelesai();
  }, [aksi, aksiSelesai, bukaLapor, bukaKasus, daftar]);

  /** Ubah satu kasus; `menit` memajukan jam prototipe. */
  function ubahKasus(id, ubah, menit = 0) {
    setDaftar((semua) => semua.map((x) => (x.id === id ? { ...x, ...ubah(x) } : x)));
    if (menit) setKini((t) => t + menit);
  }

  // ---------- antrean ----------
  const sla = new Map(daftar.map((c) => [c.id, slaKasus(c, kini)]));
  const hitung = (id) => daftar.filter(SARINGAN.find((s) => s.id === id).cocok).length;
  const cocok = (SARINGAN.find((s) => s.id === saring) || SARINGAN[0]).cocok;
  const peringkat = (c) =>
    (c.tahap === "selesai" ? 9 : c.tahap === "pantau" ? 5 : 0) +
    (sla.get(c.id).telat ? -2 : 0) +
    BOBOT_TINGKAT[c.tingkat] * 0.1 +
    URUTAN_TAHAP.indexOf(c.tahap) * 0.01;
  const baris = daftar.filter(cocok).sort((a, b) => peringkat(a) - peringkat(b));
  const pilihanSegmen = SARINGAN.map((s) => ({
    id: s.id,
    label: (
      <>
        {s.label} <span className="segn">{hitung(s.id)}</span>
      </>
    ),
  }));

  // Bilah alur: langkah yang menyala = saringan tahap yang aktif; angka = jumlah kasus per tahap.
  const aktifAlur = ALUR.kejadian.langkah.some((l) => l.id === saring) ? saring : null;
  const hitungAlur = Object.fromEntries(["triage", "tugas", "tangani", "pantau"].map((t) => [t, hitung(t)]));
  const pilihLangkah = (l) => (l.id === "lapor" ? bukaLapor() : setSaring(l.id));

  const menunggu = daftar
    .filter((c) => c.tahap === "triage")
    .sort((a, b) => ATURAN[a.tingkat].respon(a.masuk) - ATURAN[b.tingkat].respon(b.masuk));
  const lewat = daftar.filter((c) => c.tahap !== "selesai" && sla.get(c.id).telat);

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

  /** Formulir Tugaskan: satu penanggung jawab utama, pendukung boleh lebih dari satu. */
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
        // Menekan Pendukung lagi melepasnya dari penugasan.
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

  function eskalasi() {
    const c = kasus;
    ubahKasus(
      c.id,
      (x) => ({
        eskalasi: true,
        tugas:
          x.tugas && x.tugas.utama !== "hartini" && !x.tugas.pendukung.includes("hartini")
            ? { ...x.tugas, pendukung: [...x.tugas.pendukung, "hartini"] }
            : x.tugas,
        riwayat: [[capWaktu(kini), "Bu Laras mengeskalasi kasus ke Kepala Sekolah."], ...x.riwayat],
      }),
      2,
    );
    beriTahu({
      peran: "kepsek",
      ikon: "atas",
      nada: "red",
      judul: `${c.id} dieskalasi ke Anda`,
      isi: `${c.judul}. Bu Laras meminta keputusan Kepala Sekolah.`,
      tujuan: { layar: "kasus", aksi: { jenis: "kasus", id: c.id } },
    });
    toast(`${c.id} dieskalasi. Bu Hartini menerima notifikasi aplikasi dan WhatsApp.`);
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
      toast("Pilih dulu jenis kejadiannya");
      return;
    }
    // Nomor dibagi konteks (satu urutan untuk semua layar); laporannya juga tersimpan di sana.
    const id = buatLaporan({ lapor, sumber: "Bu Laras (staf) · aplikasi sekolah" });
    const baru = kasusDariLapor(lapor, id, kini);
    setDaftar((semua) => [baru, ...semua]);
    setTercatat({ id, tingkat: baru.tingkat });
    setSaring("triage");
    setKini((t) => t + 2);
    beriTahu({
      peran: ["bk", "kepsek"],
      ikon: "peringatan",
      nada: "red",
      judul: `Laporan baru ${id}`,
      isi: `${baru.kategori}, kelas ${baru.kelas}. Usulan tingkat ${baru.tingkat}, menunggu triage.`,
      tujuan: { layar: "kasus", aksi: { jenis: "kasus", id } },
    });
    toast(`Laporan ${id} masuk antrean triage.`);
  }

  return (
    <div className={`isi ${css.layar}`}>
      <AlurBar alur="kejadian" aktif={aktifAlur} hitung={hitungAlur} onLangkah={pilihLangkah} />

      <section className="titlerow">
        <div>
          <p className="eyebrow">Alur kejadian</p>
          <h1 className="h1">Kasus &amp; penugasan</h1>
          <p className="lead">
            Setiap laporan ditriage, ditugaskan ke penanggung jawab, ditangani, lalu dipantau sampai ditutup, masing-masing dengan batas
            waktu (SLA).
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

      <section className="kpirow" aria-label="Angka kasus">
        <Angka
          nilai={menunggu.length}
          satuan="kasus"
          label="Menunggu triage"
          sub={
            menunggu.length
              ? `${menunggu[0].id} · ${sla.get(menunggu[0].id).label.toLowerCase()}${menunggu.length > 1 ? ` · +${menunggu.length - 1} lainnya` : ""}`
              : "Tidak ada laporan yang menunggu"
          }
          nada={menunggu.length ? "o" : "g"}
        />
        <Angka
          nilai={lewat.length}
          satuan="kasus"
          label="Lewat SLA"
          sub={
            lewat.length
              ? lewat.map((x) => `${x.id} · ${sla.get(x.id).nama.split(" ")[0].toLowerCase()} ${sla.get(x.id).label.toLowerCase()}`).join("; ")
              : "Semua dalam batas waktu"
          }
          nada={lewat.length ? "r" : "g"}
        />
        <Angka
          nilai="42"
          satuan="menit"
          label={
            <>
              Respon pertama <span className="nw">rata-rata</span>
            </>
          }
          sub="Semua tingkat, sejak 19 Okt"
          nada="g"
        />
        <Angka nilai="96%" label="Ketepatan SLA" sub="25 dari 26 tahap tepat waktu" nada="g" />
      </section>

      <section className="card tcard" data-bagian="antrean">
        <div className="tophead">
          <div className="anth">
            <KepalaKartu ikon="tiket" judul="Antrean kasus" />
            <span className="jamsla">SLA per {waktuLengkap(kini)}</span>
          </div>
          <Segmen label="Saring antrean menurut tahap" pilihan={pilihanSegmen} nilai={saring} onPilih={setSaring} />
        </div>
        <div className="tbox">
          <table className="tbl antre">
            <colgroup>
              <col className="kid" />
              <col />
              <col className="kanak" />
              <col className="ktk" />
              <col className="kthp" />
              <col className="kpj" />
              <col className="ksla" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Kejadian</th>
                <th scope="col">Anak · kelas</th>
                <th scope="col">Tingkat</th>
                <th scope="col">Tahap</th>
                <th scope="col">Penanggung jawab</th>
                <th scope="col">SLA berikutnya</th>
              </tr>
            </thead>
            <tbody>
              {baris.map((c) => (
                <BarisKasus key={c.id} kasus={c} sla={sla.get(c.id)} onBuka={bukaKasus} />
              ))}
            </tbody>
          </table>
          {baris.length === 0 && <p className="empty">Tidak ada kasus di tahap ini.</p>}
        </div>
        <p className="rule">
          Tingkat bergaris putus-putus masih usulan pelapor, ditetapkan saat triage. Nama anak pada kasus Darurat disingkat; kasus dengan
          terlapor staf sekolah hanya bisa dibuka Kepala Sekolah dan pendamping Fammi.
        </p>
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
            onEskalasi={eskalasi}
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
        <Laci label="Aturan SLA" labelTutup="Tutup aturan SLA" lebar={LEBAR_LACI} onTutup={tutupLaci}>
          <AturanSla onAtur={() => toast("Pengaturan acuan SLA sekolah akan dibuka di jendela terpisah")} onTutup={tutupLaci} />
        </Laci>
      )}
    </div>
  );
}

/** Satu angka ringkas di atas antrean. `nada`: o (menunggu), r (lewat), g (baik). */
function Angka({ nilai, satuan, label, sub, nada }) {
  return (
    <div className="card kpi">
      <p className="kpiv">
        {nilai}
        {satuan && <span className="kpiu"> {satuan}</span>}
      </p>
      <div className="kpit">
        <p className="kpil">{label}</p>
        <p className={`kpisub ${nada}`} title={sub}>
          {sub}
        </p>
      </div>
    </div>
  );
}

/**
 * Satu baris antrean. Seluruh baris bisa diklik lewat tombol ID (lapisan tombol menutup baris).
 * Nama anak kasus Darurat disingkat; kasus terlapor staf disembunyikan.
 */
function BarisKasus({ kasus: c, sla, onBuka }) {
  const anak = c.terbatas
    ? "Akses terbatas"
    : (c.tingkat === "Darurat" ? c.anakSingkat || c.anak : c.anak) + (c.kelas ? " · " + c.kelas : "");
  const tahap = TAHAP[c.tahap];
  const usul = c.tahap === "triage";
  const utama = orangKasus(c.tugas?.utama);
  const nPendukung = c.tugas ? c.tugas.pendukung.length : 0;
  return (
    <tr className={sla.telat ? "late" : undefined}>
      <td className="cid">
        <button
          type="button"
          className="idbtn"
          aria-label={`Buka kasus ${c.id}`}
          title={`${c.id}: ${c.judul}`}
          onClick={() => onBuka(c.id)}
        >
          {c.id}
        </button>
      </td>
      <td className="ckj">
        <span className="kjj">
          {c.terbatas && <Ikon nama="gembok" size={13} warna="var(--sp-tinta-2)" />}
          <span className="kjt">{c.judul}</span>
        </span>{" "}
        <span className="kjs">
          {c.dariSkrining && <span className="skr">Dari skrining HEART</span>}
          <span className="kjt">{c.kategori}</span>
        </span>
      </td>
      <td className="canak">
        <span className="kjt">{anak}</span>
      </td>
      <td className="ctk">
        <span className={`${PIL_TINGKAT[c.tingkat]}${usul ? " usul" : ""}`} title={usul ? "Usulan pelapor, belum ditetapkan" : undefined}>
          {c.tingkat}
          {usul && <span className="sr"> (usulan)</span>}
        </span>
      </td>
      <td className="cthp">
        <span className={`thp ${c.tahap}`}>
          <span className="thn" aria-hidden="true">
            {tahap.no ?? <Ikon nama="centang" size={12} />}
          </span>
          {tahap.label}
        </span>
      </td>
      <td className="cpj">
        {utama ? (
          <span className="pj">
            <span className="av xs" aria-hidden="true">
              {utama.inisial}
            </span>
            <span className="kjt">{utama.nama}</span>
            {nPendukung > 0 && (
              <span className="pjx" title={namaTugas(c.tugas).slice(1).join(", ")}>
                +{nPendukung}
                <span className="sr"> pendukung</span>
              </span>
            )}
          </span>
        ) : (
          // Belum ada penanggung jawab: langkah berikutnya milik Koordinator BK.
          <span className="slac">
            <span className="mut">Belum ditunjuk</span>{" "}
            <span className="slan">
              {TAHAP[c.tahap].label}: {orangKasus(SAYA).nama}
            </span>
          </span>
        )}
      </td>
      <td className="csla">
        <span className="slac">
          <span className="slan">{sla.nama}</span>{" "}
          <span className={`${sla.pil} tg`}>{sla.label}</span>
        </span>
      </td>
    </tr>
  );
}

/**
 * Tiga pilihan jawaban penilaian awal (Tidak, Tidak yakin, Ya). Yang terpilih berwarna menurut
 * bobotnya: Tidak lembut, Tidak yakin kuning, Ya merah, supaya jawaban yang menaikkan tingkat
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

/** Triage: empat tingkat dengan SLA-nya, usulan dari jawaban pelapor, dan jawaban yang bisa dikoreksi. */
function BlokTingkat({ jawaban, tingkat, onTingkat, onJawab }) {
  const usulan = tingkatDari(jawaban);
  return (
    <section className="blok" aria-labelledby="kasus-tingkat">
      <div className="blokh">
        <h3 className="blokj" id="kasus-tingkat">
          Tetapkan tingkat
        </h3>
        <span className="blokk">SLA dihitung sejak laporan masuk</span>
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
                Respon <b>{a.responL}</b>
              </span>{" "}
              <span>
                Rencana <b>{a.rencanaL}</b>
              </span>
            </button>
          );
        })}
      </div>
      <p className="reco info">
        <b>Usulan {usulan}.</b> {alasanDari(jawaban)}
      </p>
      <details className="qdet">
        <summary>Periksa jawaban pelapor</summary>
        <div>
          {PERTANYAAN.map((t, i) => (
            <div key={t} className="qrow">
              <span>{t}</span>
              <PilihanJawaban pertanyaan={t} nilai={jawaban[i]} onPilih={(j) => onJawab(i, j)} />
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

/**
 * Penugasan dan SLA. Triage: usulan menurut tingkat yang dipilih. Penugasan: formulir Tugaskan
 * (utama dan pendukung). Sesudahnya: siapa memegang kasus, batas waktunya, dan butir checklist yang
 * lahir dari penugasan ini.
 */
function BlokTugas({ kasus: c, kini, tingkat, jawaban, draf, centang, onPeran }) {
  const triage = c.tahap === "triage";
  const form = c.tahap === "tugas";
  const tampil = triage ? usulanTugas(tingkat, jawaban, c.kelas) : form ? draf : c.tugas;
  const peranDi = (id) => (tampil?.utama === id ? "utama" : tampil?.pendukung.includes(id) ? "pendukung" : null);
  const daftarOrang = form
    ? [...new Set([...kandidatTugas(c.kelas), ...(tampil.utama ? [tampil.utama] : []), ...tampil.pendukung])]
    : tampil
      ? [tampil.utama, ...tampil.pendukung]
      : [];
  const batasRespon = c.masuk != null ? batasDari(ATURAN[tingkat].respon(c.masuk), kini) : null;
  const butir = checklistKasus(c.id);

  let keterangan = c.tugas ? `Ditugaskan ${c.tugas.waktu}` : "";
  let catatan = null;
  if (triage) {
    keterangan = `Usulan aturan ${tingkat}`;
    catatan = (jawaban[4] === 2 ? ATURAN_STAF : ATURAN_TEKS[tingkat]) + " Ditetapkan sesudah tingkat.";
  } else if (form) {
    keterangan = batasRespon ? `Respon pertama paling lambat ${batasRespon}` : "";
    catatan =
      c.tugas && !c.tugas.tetap
        ? `Ditunjuk otomatis menurut aturan ${c.tingkat} pada ${c.tugas.waktu} dan sudah diberi tahu. Periksa, tambah pendukung bila perlu, lalu tugaskan.`
        : `Terisi usulan aturan ${c.tingkat}. Pilih satu penanggung jawab utama, pendukung boleh lebih dari satu.`;
  }

  return (
    <section className="blok" aria-labelledby="kasus-tugas">
      <div className="blokh">
        <h3 className="blokj" id="kasus-tugas">
          Penugasan
        </h3>
        {keterangan && <span className="blokk">{keterangan}</span>}
      </div>
      {catatan && <p className="rule">{catatan}</p>}
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
      <div className="slal" role="group" aria-label="Batas waktu (SLA)">
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
    </section>
  );
}

/** Isi laci detail kasus. Tombol utama di bilah bawah menjalankan langkah tahap kasus ini. */
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
  onEskalasi,
  onLanjut,
  onSkrining,
  onTutup,
}) {
  const kepalaRef = useRef(null);
  const triage = c.tahap === "triage";
  const aksi = aksiTahap(c);
  const nSelesai = c.rencana.filter((p) => p[3]).length;
  const tampilRencana = ["tangani", "pantau", "selesai"].includes(c.tahap) && c.rencana.length > 0;
  const bisaEskalasi = (c.tahap === "tangani" || c.tahap === "pantau") && !c.eskalasi;

  // Tombol Eskalasi dan Tutup kasus hilang sesudah ditekan. Fokus pindah ke laci lebih dulu
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
            <span className={`${PIL_TINGKAT[tingkat]}${triage ? " usul" : ""}`} title={triage ? "Belum ditetapkan" : undefined}>
              {tingkat}
              {triage && <span className="sr"> (belum ditetapkan)</span>}
            </span>
            <span className="pill sm gray">{TAHAP[c.tahap].label}</span>
            {c.dariSkrining && <span className="pill sm mid">Dari skrining HEART</span>}
            {c.eskalasi && <span className="pill sm bad">Dieskalasi ke Kepala Sekolah</span>}
          </div>
          <h2 className="dtitle">{c.judul}</h2>
          <p className="dsub">{c.terbatas ? "Detail kasus disembunyikan untuk peran Anda." : c.uraian}</p>
          {c.dariSkrining && (
            <p className="skrl">
              <Ikon nama="skrining" size={15} />
              Kasus ini lahir dari tanda bahaya di skrining HEART.
              <button type="button" className="lnk" onClick={onSkrining}>
                Buka skrining
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
            <dt>Masuk</dt>
            <dd>{c.masuk != null ? waktuLengkap(c.masuk) : c.masukLabel}</dd>
          </div>
          <div>
            <dt>Pelapor dan kanal</dt>
            <dd>{c.sumber || ""}</dd>
          </div>
          <div>
            <dt>Anak</dt>
            <dd>{c.anak + (c.kelas ? " · " + c.kelas : "")}</dd>
          </div>
          <div>
            <dt>Jenis</dt>
            <dd>{c.kategori}</dd>
          </div>
        </dl>
      )}

      <AlurKasus kasus={c} />

      {c.terbatas ? (
        <div className="lock">
          <Ikon nama="gembok" size={22} warna="var(--sp-tinta-3)" style={{ flex: "none" }} />
          <span>
            <b>Akses terbatas.</b> Terlapor dalam kasus ini adalah staf sekolah, jadi detail hanya terbuka untuk Kepala Sekolah dan
            pendamping Fammi. Anda tetap melihat tahap dan jadwal tinjau agar beban kerja tim terbaca: masuk Rabu 21 Okt, dipantau sampai
            Rabu 18 Nov.
          </span>
        </div>
      ) : (
        <>
          {triage && <BlokTingkat jawaban={jawaban} tingkat={tingkat} onTingkat={onTingkat} onJawab={onJawab} />}

          <BlokTugas kasus={c} kini={kini} tingkat={tingkat} jawaban={jawaban} draf={draf} centang={centang} onPeran={onPeran} />

          {tampilRencana && (
            <section className="blok" aria-labelledby="kasus-rencana">
              <div className="blokh">
                <h3 className="blokj" id="kasus-rencana">
                  Rencana tindak
                </h3>
                <span className="blokk">
                  {nSelesai} dari {c.rencana.length} selesai
                </span>
              </div>
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
            </section>
          )}

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

          <section className="blok" aria-labelledby="kasus-riwayat">
            <div className="blokh">
              <h3 className="blokj" id="kasus-riwayat">
                Catatan dan riwayat
              </h3>
            </div>
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
          </section>

          <div className="dfootbar">
            <span className="fnote">{aksi.catatan}</span>
            {bisaEskalasi && (
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
        sub="Isi yang Anda ketahui saja. Identitas pelapor hanya terlihat oleh tim penanganan."
        onTutup={onTutup}
      />

      {tercatat ? (
        <div className="okbox" ref={hasilRef} tabIndex={-1}>
          <b>Laporan {tercatat.id} tercatat</b>
          <span>
            Masuk tahap triage dengan usulan tingkat {tercatat.tingkat}. Koordinator BK dan Kepala Sekolah sudah menerima notifikasi; jam
            SLA berjalan sejak sekarang.
          </span>
          <div className="okacts">
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
          <p className="reco bad lapdgr">
            <Ikon nama="peringatan" size={16} style={{ flex: "none", marginTop: 1 }} />
            <span>Bila anak dalam bahaya saat ini, amankan anak dulu dan hubungi 112 atau layanan SAPA 129. Isi laporan setelah anak aman.</span>
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
              placeholder="Tulis apa yang Anda lihat atau dengar, tanpa menebak alasannya."
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
                Respon pertama paling lambat {batas}. Usulan penanggung jawab: {penerima}.
              </span>
            </div>
          </section>

          <div className="dfootbar">
            <span className="fnote">Laporan masuk antrean triage. Koordinator BK menetapkan tingkat, lalu menugaskan.</span>
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
        judul="Aturan SLA dan penugasan"
        sub="Usulan awal. Batas waktu dan penanggung jawab bisa diatur tiap sekolah."
        onTutup={onTutup}
      />
      <div className="tbox">
        <table className="tbl atur">
          <thead>
            <tr>
              <th scope="col">Tingkat</th>
              <th scope="col">Contoh</th>
              <th scope="col">Penanggung jawab</th>
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

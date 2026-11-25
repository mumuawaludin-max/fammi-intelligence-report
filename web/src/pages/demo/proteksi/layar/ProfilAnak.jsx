import { useEffect, useRef, useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaLaci, Laci } from "../komponen";
import { ORANG } from "../layarProteksi";
import AlurBar from "../bersama/AlurBar";
import { PilStatus } from "../bersama/HeartKecil";
import { HEART, LAPORAN_RAKA, URUTAN_STATUS, cariAspek } from "../bersama/heart";
import { DUKUNGAN_RAKA } from "../bersama/dukungan";
import LaporanHeart from "./LaporanHeart";
import ProfilAnakDukungan from "./ProfilAnakDukungan";
import ProfilAnakTindak from "./ProfilAnakTindak";
import { RiwayatAnak } from "./ProfilAnakKasus";
import { HARI_INI, PENANDA, RIWAYAT_AWAL } from "./profilAnakData";
import { PESAN_WA, tautanWa } from "../bersama/whatsapp";
import css from "./ProfilAnak.module.css";

const ANAK = LAPORAN_RAKA.anak;

/** Aspek yang paling butuh perhatian (status terberat, lalu skor tertinggi), dipakai laci pertama kali. */
const ASPEK_AWAL = [...HEART].sort((a, b) => {
  const x = LAPORAN_RAKA.aspek[a.id];
  const y = LAPORAN_RAKA.aspek[b.id];
  return URUTAN_STATUS.indexOf(y.status) - URUTAN_STATUS.indexOf(x.status) || y.skor - x.skor;
})[0].id;

/** Teman pendamping Raka menurut peta dukungan bersama. */
const BUDDY_AWAL = DUKUNGAN_RAKA.kelompok.flatMap((k) => k.orang).find((o) => o.buddy)?.nama ?? "";

/**
 * Laporan anak: Raka Pratama, kelas 2B, dibuka wali kelas atau Guru BK. Langkah "Hasil per anak" dan
 * "Tindak lanjut" di alur pencegahan. Urutannya mengikuti kebutuhan guru: paling atas status anak dan
 * yang perlu dilakukan sekarang (kasus aktif, tugas yang belum selesai), lalu hasil HEART ringkas,
 * lalu menu peta dukungan dan riwayat. Rincian (per aspek HEART, seluruh checklist, kasus, peta
 * dukungan, riwayat) terbuka di laci.
 *
 * Centang checklist hidup di konteks prototipe, jadi terlihat juga di Ruang wali kelas dan aplikasi
 * orang tua. Pengamatan baru, ganti teman pendamping, dan kontak orang tua hanya state layar ini
 * (masuk ke riwayat, hilang saat layar ditutup). Tidak ada yang disimpan.
 */
export default function ProfilAnak() {
  const { peran, pindah, toast } = useProteksi();
  const [langkah, setLangkah] = useState("tindak");
  const [aspek, setAspek] = useState(ASPEK_AWAL);
  const [buddy, setBuddy] = useState(BUDDY_AWAL);
  const [tambahan, setTambahan] = useState([]);
  const [laciObs, setLaciObs] = useState(false);
  const [teksObs, setTeksObs] = useState("");
  const [penanda, setPenanda] = useState({});
  const [aspekObs, setAspekObs] = useState("");
  const akarRef = useRef(null);
  const namaSaya = ORANG[peran]?.nama ?? "Wali kelas";

  // Kartu "Yang perlu dilakukan" ada di atas, hasil HEART di bawahnya. Bilah alur menyalakan "Hasil
  // per anak" begitu bagian hasil (atau bagian sesudahnya) naik ke paruh atas layar; di atasnya
  // "Tindak lanjut".
  useEffect(() => {
    const bagian = akarRef.current?.querySelector('[data-bagian="hasil"]');
    if (!bagian || typeof IntersectionObserver === "undefined") return undefined;
    const pengamat = new IntersectionObserver(
      ([e]) => {
        const sudahLewat = e.boundingClientRect.top < (e.rootBounds ? e.rootBounds.top : 0);
        setLangkah(e.isIntersecting || sudahLewat ? "hasil" : "tindak");
      },
      { rootMargin: "0px 0px -55% 0px" },
    );
    pengamat.observe(bagian);
    return () => pengamat.disconnect();
  }, []);

  function tambahRiwayat(entri) {
    setTambahan((lama) => [{ id: `baru-${lama.length + 1}`, d: HARI_INI, ...entri }, ...lama]);
  }

  function hubungiOrtu() {
    tambahRiwayat({ jenis: "kontak", t: `Menghubungi ${ANAK.ortu}`, x: "Lewat WhatsApp dari laporan anak." });
    toast(`WhatsApp terbuka. Pilih kontak ${ANAK.ortu}, lalu lanjutkan pesannya.`);
  }

  function gantiBuddy(nama) {
    if (!nama || nama === buddy) return;
    tambahRiwayat({
      jenis: "tindak",
      t: "Teman pendamping diganti",
      x: `${nama} menggantikan ${buddy} sebagai teman pendamping Raka.`,
    });
    setBuddy(nama);
    toast(`Teman pendamping Raka sekarang ${nama}, tercatat di riwayat.`);
  }

  function bukaObs() {
    setTeksObs("");
    setPenanda({});
    setAspekObs(aspek);
    setLaciObs(true);
  }

  function simpanObs() {
    const tanda = PENANDA.filter((g) => penanda[g]).join(", ");
    const teks = (teksObs.trim() || "Tanpa catatan tambahan.") + (tanda ? ` (${tanda})` : "");
    const namaAspek = cariAspek(aspekObs)?.nama;
    tambahRiwayat({ jenis: "obs", t: `Pengamatan ${namaSaya}${namaAspek ? ` · ${namaAspek}` : ""}`, x: teks });
    setLaciObs(false);
    toast("Pengamatan Raka tersimpan di riwayat.");
  }

  const riwayat = [...tambahan, ...RIWAYAT_AWAL];

  return (
    <div ref={akarRef} className={`isi ${css.layar}`}>
      <AlurBar alur="cegah" aktif={langkah} />

      <div className="idn">
        <span className="idnav" aria-hidden="true">
          {ANAK.inisial}
        </span>
        <div className="idnisi">
          <nav aria-label="Lokasi halaman">
            <p className="idnjejak">
              <button type="button" onClick={() => pindah("kelas")}>
                Ruang wali kelas {ANAK.kelas}
              </button>
              <Ikon nama="kanan" size={14} />
              <span aria-current="page">Laporan anak</span>
            </p>
          </nav>
          <div className="idnjudul">
            <h1 className="idnnama" data-judul-layar="">
              {ANAK.nama}
            </h1>
            <PilStatus status={LAPORAN_RAKA.status} />
          </div>
          <p className="idnmeta">
            {ANAK.usia} · Kelas {ANAK.kelas} · Wali kelas {ANAK.wali} · Orang tua {ANAK.ortu}
          </p>
        </div>
        <div className="idnaksi">
          <a
            className="ghost"
            href={tautanWa(PESAN_WA.walasKeOrtu)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={hubungiOrtu}
          >
            <Ikon nama="obrolan" size={17} warna="var(--sp-hijau-batang)" />
            Hubungi orang tua
          </a>
          <button type="button" className="btnp" onClick={bukaObs}>
            <Ikon nama="pena" size={17} />
            Catat pengamatan
          </button>
        </div>
        <p className="idnrahasia">
          <Ikon nama="gembok" size={14} />
          Rahasia: hanya wali kelas {ANAK.kelas}, Guru BK, dan Kepala Sekolah, setiap akses tercatat. Hasil screening
          bukan diagnosis.
        </p>
      </div>

      <ProfilAnakTindak />
      <LaporanHeart aspek={aspek} onPilih={setAspek} />

      <section className="card pmkartu" aria-label="Data lain Raka">
        <ul className="pmdaftar">
          <ProfilAnakDukungan buddy={buddy} onGanti={gantiBuddy} />
          <RiwayatAnak riwayat={riwayat} />
        </ul>
      </section>

      {laciObs && (
        <Laci label="Catat pengamatan Raka" labelTutup="Tutup catatan" lebar={520} className="laciobs" onTutup={() => setLaciObs(false)}>
          <KepalaLaci
            awal={
              <div className="tile p">
                <Ikon nama="pena" size={22} />
              </div>
            }
            judul="Catat pengamatan"
            sub={`${ANAK.nama} · Rabu, 11 November 2026`}
            onTutup={() => setLaciObs(false)}
          />
          <div className="fld">
            <span className="flabel" id="anak-obs-tanda">
              Yang terlihat
            </span>
            <div className="chips" role="group" aria-labelledby="anak-obs-tanda">
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
            <label className="flabel" htmlFor="anak-obs-aspek">
              Aspek HEART terkait
            </label>
            <select id="anak-obs-aspek" className="inp" value={aspekObs} onChange={(e) => setAspekObs(e.target.value)}>
              <option value="">Tidak spesifik</option>
              {HEART.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.kode} · {a.nama}
                </option>
              ))}
            </select>
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
          <p className="reco info">Catatan masuk riwayat Raka dan dibaca Guru BK saat evaluasi 4 minggu.</p>
          <div className="dacts">
            <button type="button" className="ghost" onClick={() => setLaciObs(false)}>
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

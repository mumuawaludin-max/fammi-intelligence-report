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
import ProfilAnakKasus from "./ProfilAnakKasus";
import { HARI_INI, KASUS_RAKA, PENANDA, RIWAYAT_AWAL } from "./profilAnakData";
import css from "./ProfilAnak.module.css";

const ANAK = LAPORAN_RAKA.anak;

/** Aspek yang paling butuh perhatian (status terberat, lalu skor tertinggi), dibuka pertama kali. */
const ASPEK_AWAL = [...HEART].sort((a, b) => {
  const x = LAPORAN_RAKA.aspek[a.id];
  const y = LAPORAN_RAKA.aspek[b.id];
  return URUTAN_STATUS.indexOf(y.status) - URUTAN_STATUS.indexOf(x.status) || y.skor - x.skor;
})[0].id;

/** Buddy Raka menurut peta dukungan bersama. */
const BUDDY_AWAL = DUKUNGAN_RAKA.kelompok.flatMap((k) => k.orang).find((o) => o.buddy)?.nama ?? "";

/**
 * Laporan anak: Raka Pratama, kelas 2B, dilihat Bu Rina sebagai wali kelas. Langkah "Hasil per anak"
 * dan "Tindak lanjut" di alur pencegahan: hasil skrining HEART, peta dukungan (buddy, orang dewasa
 * yang dipercaya, tempat aman, titik rawan), checklist tindak lanjut, lalu kasus terkait dan riwayat.
 *
 * Centang checklist hidup di konteks prototipe, jadi terlihat juga di Ruang wali kelas dan aplikasi
 * orang tua. Observasi baru, ganti buddy, dan kontak orang tua hanya state layar ini (masuk ke
 * riwayat, hilang saat layar ditutup). Tidak ada yang disimpan.
 */
export default function ProfilAnak() {
  const { layar, peran, pindah, toast } = useProteksi();
  const [langkah, setLangkah] = useState("hasil");
  const [aspek, setAspek] = useState(ASPEK_AWAL);
  const [buddy, setBuddy] = useState(BUDDY_AWAL);
  const [tambahan, setTambahan] = useState([]);
  const [tabKasus, setTabKasus] = useState("kasus");
  const [laciObs, setLaciObs] = useState(false);
  const [teksObs, setTeksObs] = useState("");
  const [penanda, setPenanda] = useState({});
  const [aspekObs, setAspekObs] = useState("");
  const akarRef = useRef(null);
  const namaSaya = ORANG[peran]?.nama ?? "Wali kelas";

  // Bilah alur menyalakan "Tindak lanjut" selama bagian itu (atau bagian sesudahnya) sudah naik ke
  // paruh atas layar; di atasnya tetap "Hasil per anak".
  useEffect(() => {
    const bagian = akarRef.current?.querySelector('[data-bagian="tindak"]');
    if (!bagian || typeof IntersectionObserver === "undefined") return undefined;
    const pengamat = new IntersectionObserver(
      ([e]) => {
        const sudahLewat = e.boundingClientRect.top < (e.rootBounds ? e.rootBounds.top : 0);
        setLangkah(e.isIntersecting || sudahLewat ? "tindak" : "hasil");
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
    toast(`Membuka WhatsApp ${ANAK.ortu}. Percakapan tercatat di riwayat Raka.`);
  }

  function gantiBuddy(nama) {
    if (!nama || nama === buddy) return;
    tambahRiwayat({ jenis: "tindak", t: "Buddy diganti", x: `${nama} menggantikan ${buddy} sebagai buddy Raka.` });
    setBuddy(nama);
    toast(`Buddy Raka sekarang ${nama}. Perubahan tercatat di riwayat.`);
  }

  function bukaObs() {
    setTeksObs("");
    setPenanda({});
    setAspekObs(aspek);
    setLaciObs(true);
  }

  function simpanObs() {
    const tanda = PENANDA.filter((g) => penanda[g]).join(", ");
    const teks = (teksObs.trim() || "Catatan singkat tanpa keterangan tambahan.") + (tanda ? ` (${tanda})` : "");
    const namaAspek = cariAspek(aspekObs)?.nama;
    tambahRiwayat({ jenis: "obs", t: `Observasi ${namaSaya}${namaAspek ? ` · ${namaAspek}` : ""}`, x: teks });
    setLaciObs(false);
    setTabKasus("riwayat");
    toast("Catatan observasi Raka tersimpan di riwayat.");
  }

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
        </div>
        <div className="idnaksi">
          <button type="button" className="ghost" onClick={hubungiOrtu}>
            <Ikon nama="telepon" size={17} warna="var(--sp-hijau-batang)" />
            Hubungi orang tua
          </button>
          <button type="button" className="btnp" onClick={bukaObs}>
            <Ikon nama="pena" size={17} />
            Catat observasi
          </button>
        </div>
        <div className="idnbawah">
          <p className="idnmeta">
            {ANAK.usia} · Kelas {ANAK.kelas} · Wali kelas {ANAK.wali} · Orang tua {ANAK.ortu}
          </p>
          <button
            type="button"
            className="idncip kasus"
            onClick={() => pindah("kasus", { jenis: "kasus", id: KASUS_RAKA.id })}
          >
            <Ikon nama="tiket" size={15} />
            Kasus aktif {KASUS_RAKA.id} · {KASUS_RAKA.tingkat}
            <Ikon nama="kanan" size={15} />
          </button>
          <button
            type="button"
            className="idncip buddy"
            onClick={() => pindah(layar, { jenis: "gulir", id: "dukungan" })}
          >
            <Ikon nama="kelompok" size={15} />
            Buddy: {buddy}
            <Ikon nama="turun" size={15} />
          </button>
        </div>
        <p className="idnrahasia">
          <Ikon nama="gembok" size={14} />
          Data rahasia: hanya wali kelas {ANAK.kelas}, tim BK, dan Kepala Sekolah yang bisa membuka, dan setiap akses
          tercatat. Hasil skrining bukan diagnosis.
        </p>
      </div>

      <LaporanHeart aspek={aspek} onPilih={setAspek} />
      <ProfilAnakDukungan buddy={buddy} onGanti={gantiBuddy} />
      <ProfilAnakTindak />
      <ProfilAnakKasus tab={tabKasus} onTab={setTabKasus} riwayat={[...tambahan, ...RIWAYAT_AWAL]} />

      {laciObs && (
        <Laci label="Catat observasi Raka" labelTutup="Tutup catatan" lebar={520} className="laciobs" onTutup={() => setLaciObs(false)}>
          <KepalaLaci
            awal={
              <div className="tile p">
                <Ikon nama="pena" size={22} />
              </div>
            }
            judul="Catat observasi"
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
          <p className="reco info">Catatan masuk ke riwayat Raka dan ikut dibaca Guru BK saat evaluasi 4 minggu.</p>
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

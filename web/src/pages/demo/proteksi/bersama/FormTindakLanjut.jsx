import { useState } from "react";
import { Ikon } from "../komponen";
import { HEART } from "./heart";
import { PEMILIK } from "./tindakLanjut";
import Kalender from "./Kalender";
import { iso, labelTanggal } from "./tanggal";
import s from "./formTindakLanjut.module.css";

const SIAPA = ["walas", "bk", "ortu", "piket"];
const KAPAN = ["Hari ini", "Minggu ini", "Pilih tanggal"];

/**
 * Formulir tindak lanjut tambahan dari sekolah (Guru BK, wali kelas, Kepala Sekolah), di samping
 * rekomendasi Fammi (masukan pemilik produk 2026-11-25: Fammi memberi rekomendasi, sekolah boleh
 * menambah sendiri). Hasilnya butir checklist berbentuk sama dengan CHECKLIST di tindakLanjut.js,
 * ditandai `sumber` (nama penambah) supaya terlihat beda dari rekomendasi Fammi. Butir untuk orang
 * tua ikut muncul di aplikasi orang tua lewat konteks prototipe.
 *
 * `anak` = nama anak, `aspekAwal` = aspek bawaan, `oleh` = nama penambah (mis. "Bu Laras"),
 * `onTambah(butir)` dipanggil saat disimpan, `onBatal` menutup formulir.
 */
export default function FormTindakLanjut({ anak, aspekAwal, oleh, onTambah, onBatal }) {
  const [judul, setJudul] = useState("");
  const [aspek, setAspek] = useState(aspekAwal || HEART[0].id);
  const [siapa, setSiapa] = useState("walas");
  const [kapan, setKapan] = useState("Minggu ini");
  const [tanggal, setTanggal] = useState("");
  const bisa = judul.trim().length > 2 && (kapan !== "Pilih tanggal" || tanggal);

  function simpan() {
    if (!bisa) return;
    const waktu = kapan === "Pilih tanggal" ? labelTanggal(tanggal) : kapan;
    onTambah({
      id: `tl-${anak.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`,
      anak,
      aspek,
      alur: "cegah",
      judul: judul.trim(),
      oleh: siapa,
      waktu,
      selesai: false,
      sumber: oleh,
    });
  }

  return (
    <div className={s.form}>
      <p className={s.judulForm}>
        <Ikon nama="tambah" size={18} />
        Tambah tindak lanjut sendiri
      </p>
      <label className={s.fld}>
        <span>Apa yang dilakukan</span>
        <input
          className={s.inp}
          value={judul}
          placeholder="Mis. ajak bicara 10 menit tiap Senin pagi"
          onChange={(e) => setJudul(e.target.value)}
        />
      </label>
      <div className={s.dua}>
        <label className={s.fld}>
          <span>Untuk aspek</span>
          <select className={s.inp} value={aspek} onChange={(e) => setAspek(e.target.value)}>
            {HEART.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nama}
              </option>
            ))}
          </select>
        </label>
        <label className={s.fld}>
          <span>Siapa yang mengerjakan</span>
          <select className={s.inp} value={siapa} onChange={(e) => setSiapa(e.target.value)}>
            {SIAPA.map((p) => (
              <option key={p} value={p}>
                {`${PEMILIK[p].label}${p === "ortu" ? " (masuk aplikasi orang tua)" : ""}`}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={s.fld}>
        <span>Kapan</span>
        <div className={s.chips} role="group" aria-label="Kapan dikerjakan">
          {KAPAN.map((k) => (
            <button key={k} type="button" className={`${s.chip} ${kapan === k ? s.on : ""}`} aria-pressed={kapan === k} onClick={() => setKapan(k)}>
              {k}
            </button>
          ))}
        </div>
      </div>
      {kapan === "Pilih tanggal" && <Kalender nilai={tanggal} onPilih={setTanggal} min={iso()} label="Tanggal tindak lanjut" />}
      <div className={s.aksi}>
        <button type="button" className={s.batal} onClick={onBatal}>
          Batal
        </button>
        <button type="button" className={s.simpan} disabled={!bisa} onClick={simpan}>
          Tambahkan
        </button>
      </div>
    </div>
  );
}

import { useId } from "react";
import { Ikon } from "../komponen";
import { cariAspek } from "../bersama/heart";
import { PEMILIK } from "../bersama/tindakLanjut";
import { awalKecil, kelas } from "./OrangTuaAlat";
import { LANGKAH_KEJADIAN } from "./orangTuaData";

/**
 * Potongan kecil yang dipakai beberapa halaman aplikasi orang tua: bilah kembali, catatan
 * berwarna, batang kemajuan, langkah laporan, dan satu butir checklist.
 */

/**
 * Bilah atas halaman turunan (detail aspek, Lapor Aman, mode cerita anak). Judulnya menerima fokus
 * saat halaman dibuka. `aksi` = { label, onClick } untuk tombol teks di kanan.
 */
export function BilahKembali({ judul, onKembali, aksi }) {
  return (
    <header className="hp-bar">
      <button type="button" className="hp-back" aria-label="Kembali" onClick={onKembali}>
        <Ikon nama="kembali" size={24} />
      </button>
      <h2 className="hp-bart" tabIndex={-1} data-fokus>
        {judul}
      </h2>
      {aksi ? (
        <button type="button" className="hp-baract" onClick={aksi.onClick}>
          {aksi.label}
        </button>
      ) : null}
    </header>
  );
}

/** Catatan berwarna dengan ikon di kiri. nada: info, ok, warn, bad. */
export function Catatan({ nada, ikon, children }) {
  return (
    <div className={`hp-note hp-${nada}`}>
      <Ikon nama={ikon} size={18} />
      <span>{children}</span>
    </div>
  );
}

/** Batang kemajuan n dari m. */
export function Kemajuan({ n, m, label }) {
  const persen = m ? Math.round((n / m) * 100) : 0;
  return (
    <div
      className="hp-kemajuan"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={m}
      aria-valuenow={n}
      aria-valuetext={`${n} dari ${m} selesai`}
    >
      <span style={{ width: `${persen}%` }} />
    </div>
  );
}

function statusLangkah(i, nSekarang) {
  if (i < nSekarang) return "done";
  return i === nSekarang ? "now" : "next";
}

const TEKS_STATUS = { done: "Selesai", now: "Sedang berjalan", next: "Belum" };

/**
 * Lima langkah alur kejadian untuk satu laporan (Lapor, Triage, Penugasan, Penanganan, Pantau &
 * tutup). `tahap` = id langkah yang sedang berjalan, `langkah` = { idLangkah: { waktu?, ket? } }.
 */
export function LangkahLaporan({ tahap, langkah }) {
  const nSekarang = LANGKAH_KEJADIAN.findIndex((l) => l.id === tahap);
  return (
    <ol className="hp-langkah">
      {LANGKAH_KEJADIAN.map((l, i) => {
        const status = statusLangkah(i, nSekarang);
        const isi = langkah[l.id] || {};
        return (
          <li key={l.id} className={`hp-lk hp-${status}`} aria-current={status === "now" ? "step" : undefined}>
            <span className="hp-lkdot" aria-hidden="true">
              {status === "done" ? <Ikon nama="centang" size={14} /> : i + 1}
            </span>
            <div className="hp-lkisi">
              <p className="hp-lkjudul">
                <span className="sr">{TEKS_STATUS[status]}: </span>
                <b>{l.label}</b>
                {status === "now" ? (
                  <span className="hp-lkkini" aria-hidden="true">
                    Sekarang
                  </span>
                ) : null}
                {isi.waktu ? <span className="hp-lkwaktu">{isi.waktu}</span> : null}
              </p>
              {isi.ket ? <p className="hp-lkket">{isi.ket}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Lima ruas kecil untuk kartu ringkas di Beranda: ruas selesai ungu, ruas berjalan ungu muda. */
export function MiniLangkah({ tahap }) {
  const nSekarang = LANGKAH_KEJADIAN.findIndex((l) => l.id === tahap);
  const sekarang = LANGKAH_KEJADIAN[nSekarang];
  return (
    <div className="hp-minilk">
      <div className="hp-mini" aria-hidden="true">
        {LANGKAH_KEJADIAN.map((l, i) => (
          <span key={l.id} className={`hp-${statusLangkah(i, nSekarang)}`} />
        ))}
      </div>
      <span className="hp-cm">
        Langkah {nSekarang + 1} dari {LANGKAH_KEJADIAN.length}: {sekarang?.label}
      </span>
    </div>
  );
}

/**
 * Satu butir checklist. Tugas rumah (`bisaCentang`) memakai kotak centang sungguhan; tugas sekolah
 * hanya dibaca. `onBukaAspek` (opsional) menampilkan tombol ke saran aspek HEART butir itu.
 */
export function BarisTugas({ butir, selesai, bisaCentang, onCentang, onBukaAspek }) {
  const id = useId();
  const pemilik = PEMILIK[butir.oleh];
  const aspek = butir.aspek ? cariAspek(butir.aspek) : null;

  if (bisaCentang) {
    return (
      <li className={kelas("hp-tugas", selesai && "hp-selesai")}>
        <input
          id={id}
          type="checkbox"
          className="hp-tgcek"
          checked={selesai}
          onChange={(e) => onCentang(butir, e.target.checked)}
        />
        <div className="hp-tgisi">
          <label htmlFor={id} className="hp-tgjudul">
            {butir.judul}
          </label>
          <div className="hp-tgmeta">
            <span>
              {butir.waktu}
              {aspek && onBukaAspek ? ` · ${aspek.nama}` : ""}
            </span>
            {aspek && onBukaAspek ? (
              <button
                type="button"
                className="hp-tautan hp-kecil"
                aria-label={`Lihat caranya di saran ${aspek.nama}`}
                onClick={() => onBukaAspek(aspek.id)}
              >
                Lihat caranya
                <Ikon nama="kanan" size={16} />
              </button>
            ) : null}
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className={kelas("hp-tugas", "hp-baca", selesai && "hp-selesai")}>
      <span className="hp-tgstatus" aria-hidden="true">
        {selesai ? <Ikon nama="centang" size={14} /> : null}
      </span>
      <div className="hp-tgisi">
        <p className="hp-tgjudul">
          <span className="sr">{selesai ? "Selesai: " : "Belum selesai: "}</span>
          {butir.judul}
        </p>
        <div className="hp-tgmeta">
          <span>
            {pemilik.orang}, {awalKecil(pemilik.label)} · {butir.waktu}
          </span>
        </div>
      </div>
    </li>
  );
}

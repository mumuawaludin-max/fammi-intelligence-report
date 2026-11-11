import { useRef, useState } from "react";
import { Ikon } from "../komponen";
import { BilahKembali } from "./OrangTuaBagian";
import { kelas, useFokusBerganti } from "./OrangTuaAlat";
import { GAMBAR_KEJADIAN, KEJADIAN_BAIK, ORANG_DIPERCAYA, WAJAH } from "./orangTuaData";

/**
 * Mode cerita anak: empat halaman besar untuk anak (wajah perasaan, gambar kejadian, orang yang
 * dipercaya dan rekam suara, terima kasih). Tombol dengar dan rekam hanya mengubah tampilan: tidak
 * ada mikrofon atau suara yang dinyalakan.
 *
 * `onKirim({ kejadian, orang })` dijalankan saat anak menekan Kirim ceritaku; induk membuat laporan
 * dan memberi tahu sekolah bila ceritanya untuk sekolah, lalu mengembalikan laporannya (atau null).
 * `onKeluar(pesan?)` menutup mode anak, dengan toast opsional.
 */
export default function OrangTuaAnak({ onKirim, onKeluar, tampilkanToast, keAtas }) {
  const [hal, setHal] = useState(1);
  const [rasa, setRasa] = useState(null);
  const [kejadian, setKejadian] = useState(null);
  const [tujuan, setTujuan] = useState(null);
  const [merekam, setMerekam] = useState(false);
  const [rekamanAda, setRekamanAda] = useState(false);
  const [laporan, setLaporan] = useState(null);
  const akarRef = useRef(null);
  useFokusBerganti(akarRef, hal, "[data-fokus-langkah]");

  const orang = ORANG_DIPERCAYA.find((o) => o.label === tujuan);
  const keSekolah = Boolean(orang?.peran);

  function ke(n) {
    setHal(n);
    keAtas();
  }

  function dengarkan() {
    tampilkanToast("Suara membacakan pertanyaan dan pilihan untuk anak yang belum lancar membaca.");
  }

  function lanjut1() {
    if (!rasa) {
      tampilkanToast("Pilih satu wajah dulu, ya");
      return;
    }
    ke(2);
  }

  function lanjut2() {
    if (!kejadian) {
      tampilkanToast("Pilih satu gambar dulu, ya");
      return;
    }
    if (kejadian === KEJADIAN_BAIK) {
      onKeluar("Senang mendengarnya! Mode anak ditutup.");
      return;
    }
    ke(3);
  }

  // Rekaman hanya tiruan: berhenti merekam berarti ada rekaman tersimpan.
  function ubahRekaman() {
    if (merekam) setRekamanAda(true);
    setMerekam(!merekam);
  }

  function kirim() {
    if (!orang) {
      tampilkanToast("Pilih orang yang kamu percaya dulu, ya");
      return;
    }
    setMerekam(false);
    setLaporan(onKirim({ kejadian: GAMBAR_KEJADIAN.find((g) => g.label === kejadian), orang }));
    ke(4);
  }

  function selesai() {
    onKeluar(
      keSekolah
        ? `Cerita Raka terkirim ke sekolah sebagai laporan ${laporan?.kode || ""}. Isinya hanya dibaca ${orang.sapaan} dan tim BK.`
        : "Cerita Raka tersimpan untuk Ibu baca bersama.",
    );
  }

  function kembali() {
    if (hal === 2 || hal === 3) ke(hal - 1);
    else onKeluar();
  }

  return (
    <div ref={akarRef}>
      <BilahKembali judul="Aku mau cerita" onKembali={kembali} aksi={{ label: "Tutup", onClick: () => onKeluar() }} />

      {hal === 1 && (
        <div className="hp-kid">
          <h3 className="hp-kq" tabIndex={-1} data-fokus-langkah>
            Halo! Bagaimana perasaanmu hari ini?
          </h3>
          <TombolDengar onClick={dengarkan} />
          <div className="hp-faces" role="group" aria-label="Pilih perasaan">
            {WAJAH.map((w) => {
              const dipilih = rasa === w.label;
              return (
                <button
                  key={w.label}
                  type="button"
                  className={kelas("hp-face", dipilih && "hp-on")}
                  aria-pressed={dipilih}
                  onClick={() => setRasa(w.label)}
                >
                  <Wajah isi={w.isi} mulut={w.mulut} ukuran={60} />
                  {w.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={kelas("hp-btnp", !rasa && "hp-off")}
            aria-disabled={!rasa || undefined}
            onClick={lanjut1}
          >
            Lanjut
          </button>
        </div>
      )}

      {hal === 2 && (
        <div className="hp-kid">
          <h3 className="hp-kq" tabIndex={-1} data-fokus-langkah>
            Ada yang membuatmu tidak nyaman?
          </h3>
          <TombolDengar onClick={dengarkan} />
          <div className="hp-pics" role="group" aria-label="Pilih yang terjadi">
            {GAMBAR_KEJADIAN.map((g) => (
              <TombolGambar key={g.label} pilihan={g} dipilih={kejadian === g.label} onPilih={() => setKejadian(g.label)} />
            ))}
          </div>
          <button
            type="button"
            className={kelas("hp-btnp", !kejadian && "hp-off")}
            aria-disabled={!kejadian || undefined}
            onClick={lanjut2}
          >
            Lanjut
          </button>
        </div>
      )}

      {hal === 3 && (
        <div className="hp-kid">
          <h3 className="hp-kq" tabIndex={-1} data-fokus-langkah>
            Kamu mau cerita ke siapa?
          </h3>
          <div className="hp-pics" role="group" aria-label="Pilih orang dewasa">
            {ORANG_DIPERCAYA.map((o) => (
              <TombolGambar key={o.label} pilihan={o} dipilih={tujuan === o.label} onPilih={() => setTujuan(o.label)} />
            ))}
          </div>
          <h4 className="hp-kq hp-kqkecil">Mau cerita pakai suaramu?</h4>
          <button
            type="button"
            className={kelas("hp-mic", merekam && "hp-rec")}
            aria-label={merekam ? "Hentikan rekaman" : "Mulai rekam suara"}
            onClick={ubahRekaman}
          >
            <Ikon nama="mik" size={44} />
          </button>
          <p className="hp-cm hp-tengah" aria-live="polite">
            {merekam
              ? "Sedang merekam... tekan lagi untuk berhenti"
              : rekamanAda
                ? "Rekaman tersimpan, 0:24"
                : "Tekan tombol untuk merekam"}
          </p>
          <button
            type="button"
            className={kelas("hp-btnp", !tujuan && "hp-off")}
            aria-disabled={!tujuan || undefined}
            onClick={kirim}
          >
            Kirim ceritaku
          </button>
        </div>
      )}

      {hal === 4 && (
        <div className="hp-kid">
          <div className="hp-big">
            <Wajah isi={WAJAH[0].isi} mulut={WAJAH[0].mulut} ukuran={112} />
            <h3 className="hp-kq" tabIndex={-1} data-fokus-langkah>
              Terima kasih sudah berani bercerita!
            </h3>
            <p className="hp-cd hp-cdbesar">
              Kamu tidak salah. {orang?.sapaan} akan menemuimu{" "}
              {keSekolah ? "besok pagi di sekolah" : "untuk mendengarkan ceritamu"}.
            </p>
          </div>
          <button type="button" className="hp-btnp" onClick={selesai}>
            Selesai
          </button>
        </div>
      )}
    </div>
  );
}

/** Tombol bergambar besar di mode anak: ubin ikon berwarna + kalimat. */
function TombolGambar({ pilihan, dipilih, onPilih }) {
  return (
    <button type="button" className={kelas("hp-pic", dipilih && "hp-on")} aria-pressed={dipilih} onClick={onPilih}>
      <span className={`hp-ic hp-${pilihan.nada}`}>
        <Ikon nama={pilihan.nama} d={pilihan.d} size={28} />
      </span>
      {pilihan.label}
    </button>
  );
}

/** Tombol Dengarkan: di prototipe hanya memberi tahu bahwa pertanyaan akan dibacakan. */
function TombolDengar({ onClick }) {
  return (
    <button type="button" className="hp-listen" onClick={onClick}>
      <Ikon nama="suara" size={20} />
      Dengarkan
    </button>
  );
}

/** Wajah perasaan: lingkaran berwarna, dua mata, dan mulut (warna teks kelas hp-wajah). */
function Wajah({ isi, mulut, ukuran }) {
  return (
    <svg className="hp-wajah" viewBox="0 0 24 24" width={ukuran} height={ukuran} aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill={isi} />
      <circle cx="9" cy="10" r="1.3" fill="currentColor" />
      <circle cx="15" cy="10" r="1.3" fill="currentColor" />
      <path d={mulut} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

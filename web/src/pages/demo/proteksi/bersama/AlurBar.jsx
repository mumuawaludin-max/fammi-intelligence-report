import { useProteksi } from "../konteks";
import { Ikon } from "../komponen";
import { ALUR } from "./alur";
import s from "./alur.module.css";

/**
 * Bilah alur di atas layar: menunjukkan alur yang sedang dijalani (pencegahan atau kejadian) dan
 * langkah aktifnya, dan tiap langkah bisa diklik untuk pindah. `hitung` = { idLangkah: angka }
 * opsional (mis. jumlah kasus per tahap). `onLangkah(langkah)` opsional menggantikan perpindahan
 * bawaan, dipakai layar yang menangani langkahnya sendiri (Kasus menyaring antreannya).
 */
export default function AlurBar({ alur, aktif, hitung, onLangkah }) {
  const { pindah } = useProteksi();
  const def = ALUR[alur];
  if (!def) return null;
  const nAktif = def.langkah.findIndex((l) => l.id === aktif);

  return (
    <nav className={`${s.alur} ${alur === "kejadian" ? s.kejadian : s.cegah}`} aria-label={def.nama}>
      <span className={s.nama}>
        <Ikon nama={alur === "kejadian" ? "lapor" : "perisaiCentang"} size={16} />
        {def.nama}
      </span>
      <ol className={s.daftar}>
        {def.langkah.map((l, i) => {
          const sekarang = l.id === aktif;
          const lewat = nAktif > -1 && i < nAktif;
          const angka = hitung?.[l.id];
          return (
            <li key={l.id} className={s.butir}>
              <button
                type="button"
                className={`${s.langkah} ${sekarang ? s.sekarang : ""} ${lewat ? s.lewat : ""}`}
                aria-current={sekarang ? "step" : undefined}
                title={l.ket}
                onClick={() => (onLangkah ? onLangkah(l) : pindah(l.layar, l.aksi))}
              >
                <span className={s.no} aria-hidden="true">
                  {lewat ? <Ikon nama="centang" size={12} /> : i + 1}
                </span>
                <span className={s.label}>{l.label}</span>
                {angka != null && <span className={s.hitung}>{angka}</span>}
              </button>
              {i < def.langkah.length - 1 && <Ikon nama="kanan" size={16} className={s.panah} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

import { Ikon } from "../komponen";
import s from "./navMelayang.module.css";

/**
 * Bilah navigasi bawah yang melayang untuk aplikasi ponsel (orang tua dan remaja): kapsul putih
 * tembus pandang dengan bayangan lembut, dan penanda aktif berbentuk pil yang bergeser ke tab yang
 * dipilih. `tab` = [{ id, label, nama?, d? }] (ikon dari ikonData atau jalur SVG), `aktif` = id tab,
 * `nada` = "ungu" (orang tua) atau "remaja" (warna aplikasi remaja).
 */
export default function NavMelayang({ tab, aktif, onPilih, label = "Menu aplikasi", nada = "ungu" }) {
  const indeks = Math.max(0, tab.findIndex((t) => t.id === aktif));
  return (
    <nav
      className={`${s.nav} ${nada === "remaja" ? s.remaja : ""}`}
      aria-label={label}
      style={{ "--jumlah": tab.length, "--aktif": indeks }}
    >
      <span className={s.penanda} aria-hidden="true" />
      {tab.map((t) => {
        const sekarang = t.id === aktif;
        return (
          <button
            key={t.id}
            type="button"
            className={`${s.tab} ${sekarang ? s.on : ""}`}
            aria-current={sekarang ? "page" : undefined}
            onClick={() => onPilih(t.id)}
          >
            <Ikon nama={t.nama} d={t.d} size={22} />
            <span className={s.label}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

import styles from "./Rapor.module.css";

/** Panah tren. Naik/turun memakai panah diagonal, datar memakai panah mendatar (sesuai Figma). */
const PANAH = { naik: "↗", turun: "↘", datar: "→" };
const KELAS_TREN = { naik: "trenNaik", turun: "trenTurun", datar: "trenDatar" };

/**
 * Empat kartu pencapaian per jenjang. Dipakai dua kali: sebagai ringkasan statis di tab Rangkuman,
 * dan sebagai FILTER yang bisa diklik di tab Penilaian per Karakter (onPilih diisi).
 * Satu komponen untuk keduanya supaya kedua tab tidak pernah berbeda tampilan.
 */
export default function JenjangCards({ jenjang, aktif, onPilih }) {
  const bisaKlik = typeof onPilih === "function";

  return (
    <div className={styles.jenjangRow}>
      {jenjang.map((g) => {
        const kosong = g.nilai == null;
        const Tag = bisaKlik ? "button" : "div";
        return (
          <Tag
            key={g.id}
            type={bisaKlik ? "button" : undefined}
            onClick={bisaKlik ? () => onPilih(g.id) : undefined}
            className={[
              styles.jenjangCard,
              bisaKlik ? styles.jenjangCardBtn : "",
              aktif === g.id ? styles.jenjangCardActive : "",
            ].join(" ")}
          >
            <span className={styles.jenjangTop}>
              <span className={styles.jenjangIcon} aria-hidden="true">🎓</span>
              <span className={`${styles.jenjangNilai} ${kosong ? styles.jenjangNilaiRedup : ""}`}>
                {kosong ? "—" : `${g.nilai}%`}
              </span>
              <span className={`${styles.jenjangTren} ${styles[KELAS_TREN[g.tren]]}`} aria-hidden="true">
                {PANAH[g.tren]}
              </span>
            </span>
            <span className={styles.jenjangMeta}>
              <strong>{g.label}</strong>
              <span className={styles.jenjangDot}>•</span>
              {g.jumlahSekolah} Sekolah
            </span>
          </Tag>
        );
      })}
    </div>
  );
}

import { useEffect, useState } from "react";
import { SectionTitle } from "../components/Bits";
import styles from "./Citra.module.css";

/**
 * Blok "Top Essay" yang dipakai tiga tab Citra Sekolah (Dukungan, Emosi, dan Keberhasilan).
 * Kategori dipilih lewat dropdown, esainya baru ditarik setelah dipilih -- lihat catatan volume
 * di useCsData.ambilEsai().
 */
export default function EsaiBlok({ judul, topik, kategoriList, kategoriAktif, onGantiKategori, ambilEsai, aksen }) {
  const [esai, setEsai] = useState([]);
  const [memuat, setMemuat] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!kategoriAktif) { setEsai([]); return; }

    setMemuat(true);
    ambilEsai(topik, kategoriAktif).then((rows) => {
      if (!alive) return;
      setEsai(rows);
      setMemuat(false);
    });

    return () => { alive = false; };
  }, [topik, kategoriAktif]);

  return (
    <>
      <div className={styles.esaiHead}>
        <SectionTitle>{judul}</SectionTitle>
      </div>

      <div className={styles.esaiHead} style={{ marginTop: 0 }}>
        <select
          className={styles.esaiSelect}
          value={kategoriAktif || ""}
          onChange={(e) => onGantiKategori(e.target.value)}
          aria-label="Pilih kategori"
        >
          {kategoriList.length === 0 && <option value="">Belum ada kategori</option>}
          {kategoriList.map((k) => (
            <option key={k.nama} value={k.nama}>{k.nama}</option>
          ))}
        </select>
      </div>

      {memuat && <p className={styles.kosong}>Memuat esai…</p>}

      {!memuat && esai.length === 0 && (
        <p className={styles.kosong}>
          Belum ada esai untuk kategori ini pada periode terpilih.
        </p>
      )}

      {!memuat && esai.length > 0 && (
        <div className={styles.esaiGrid}>
          {esai.map((e, i) => (
            <div
              key={`${e.nama}-${i}`}
              className={styles.esaiKartu}
              style={aksen ? { borderBottomColor: aksen } : undefined}
            >
              <div className={styles.esaiTop}>
                <span className={styles.esaiNama}>{e.nama}</span>
                <span className={styles.esaiBadge}>
                  {e.kelas} · <span className={styles.esaiBadgeSekolah}>{e.sekolahNama}</span>
                </span>
              </div>
              <p className={styles.esaiTeks}>{e.teks}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

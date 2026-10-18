// Konstanta gerak bersama modul Wellbeing Assessment (dipisah dari WaUi.jsx supaya berkas
// komponen hanya mengekspor komponen).

export const EASE = [0.16, 1, 0.3, 1];

/** Varian anak untuk wadah bertahap. Dipakai Kartu dan Muncul. */
export const VARIAN_MUNCUL = {
  awal: { opacity: 0, y: 16 },
  tampil: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

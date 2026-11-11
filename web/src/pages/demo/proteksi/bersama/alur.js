/**
 * Dua alur Sekolah Proteksi yang tampil di bilah alur (AlurBar) di atas tiap layar:
 *   cegah    : skrining HEART -> hasil per anak -> tindak lanjut -> checklist
 *   kejadian : lapor -> triage -> penugasan -> penanganan -> pantau dan tutup
 *
 * Tiap langkah menunjuk layar (`layar`) dan, bila perlu, aksi yang dibaca layar tujuan:
 *   { jenis: "gulir", id }  ditangani SekolahProteksi: gulir ke elemen [data-bagian="<id>"]
 *   { jenis: "lapor" }      layar Kasus membuka formulir Lapor kejadian
 *   { jenis: "tahap", id }  layar Kasus menyaring antrean ke tahap itu (TAHAP_KASUS)
 */

export const ALUR = {
  cegah: {
    id: "cegah",
    nama: "Alur pencegahan",
    ringkas: "Skrining HEART, tindak lanjut, lalu checklist",
    langkah: [
      { id: "skrining", label: "Skrining HEART", ket: "Orang tua dan wali kelas mengisi", layar: "skrining" },
      { id: "hasil", label: "Hasil per anak", ket: "Laporan HEART dan peta dukungan", layar: "anak", aksi: { jenis: "gulir", id: "hasil" } },
      { id: "tindak", label: "Tindak lanjut", ket: "Siapa melakukan apa, kapan", layar: "anak", aksi: { jenis: "gulir", id: "tindak" } },
      { id: "checklist", label: "Checklist", ket: "Dicentang tiap orang, dievaluasi 4 minggu", layar: "kelas", aksi: { jenis: "gulir", id: "checklist" } },
    ],
  },
  kejadian: {
    id: "kejadian",
    nama: "Alur kejadian",
    ringkas: "Laporan keselamatan, penugasan, dan SLA",
    langkah: [
      { id: "lapor", label: "Lapor", ket: "Siapa saja bisa melapor", layar: "kasus", aksi: { jenis: "lapor" } },
      { id: "triage", label: "Triage", ket: "Tetapkan tingkat keseriusan", layar: "kasus", aksi: { jenis: "tahap", id: "triage" } },
      { id: "tugas", label: "Penugasan", ket: "Tunjuk penanggung jawab dan SLA", layar: "kasus", aksi: { jenis: "tahap", id: "tugas" } },
      { id: "tangani", label: "Penanganan", ket: "Respon pertama dan rencana tindak", layar: "kasus", aksi: { jenis: "tahap", id: "tangani" } },
      { id: "pantau", label: "Pantau & tutup", ket: "Cek ulang 2 sampai 4 minggu", layar: "kasus", aksi: { jenis: "tahap", id: "pantau" } },
    ],
  },
};

export const ALUR_IDS = Object.keys(ALUR);

/** Id tahap antrean kasus yang wajib dikenali layar Kasus (empat langkah alur kejadian + selesai). */
export const TAHAP_KASUS = ["triage", "tugas", "tangani", "pantau", "selesai"];

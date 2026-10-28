// Uji pembaca kolom laporan_json MI. Jalankan: npm test (dari folder web/).
import { test } from "node:test";
import assert from "node:assert/strict";
import { bacaLaporanJsonMi, hitungTop, semuaSkorNol } from "./miPregen.js";

const SKOR = {
  r_musikal: 60, r_spasial: 82, r_linguistik: 70, r_logmat: 45,
  r_kines: 82, r_inter: 55, r_intra: 40, r_naturalis: 30,
};

function jalur(kecerdasan, profesi) {
  return {
    kecerdasan,
    jurusan: ["Arsitektur", "Desain Interior", "Teknik Sipil"],
    tip_ortu: "Sediakan kertas besar dan pensil warna di meja belajar Raka.",
    profesi_sorot: {
      nama: profesi[0],
      deskripsi: "Merancang bangunan dari sketsa sampai gambar kerja.",
      skill: ["Membaca denah", "Menggambar teknik", "Berpikir ruang"],
      jalur: "Kuliah Arsitektur lalu magang di biro arsitek.",
      figur: ["Ridwan Kamil"],
    },
    profesi_detail: profesi.map((nama) => ({
      nama,
      deskripsi: "Mengerjakan rancangan. Bekerja di studio atau lapangan.",
      skill: ["Satu", "Dua", "Tiga"],
      jalur: "Kuliah S1 yang relevan.",
    })),
  };
}

function laporan(overrides = {}) {
  return {
    top: ["Spasial", "Kinestetik", "Linguistik"],
    narasi_cover: "Raka berpikir lewat ruang dan gerak tangan.",
    cara_belajar: {
      ringkasan: "Raka paling cepat paham saat bisa menggambar dan mencoba langsung.",
      langkah: [1, 2, 3, 4, 5].map((i) => ({ judul: `Langkah ${i}`, isi: `Isi langkah ${i}.` })),
    },
    ciri_khas: ["Suka membongkar barang", "Cepat membaca peta", "Betah menggambar", "Ingat letak benda"],
    mapel_kuasai: ["Seni Budaya", "Matematika", "PJOK", "Prakarya", "IPA"],
    smart: { s: "S.", m: "M.", a: "A.", r: "R.", t: "T." },
    hari: [1, 2, 3, 4, 5, 6, 7].map((i) => `Tugas hari ${i}.`),
    komunikasi: {
      lakukan: ["L1.", "L2.", "L3.", "L4."],
      hindari: ["H1.", "H2.", "H3."],
      kalimat_siswa: [1, 2, 3].map((i) => ({ situasi: `Situasi ${i}`, kalimat: `Kalimat ${i}.` })),
    },
    sinyal_ortu: [1, 2, 3, 4, 5].map((i) => ({ ikon: "🧩", judul: `Sinyal ${i}`, isi: `Isi sinyal ${i}.` })),
    refleksi: ["R1?", "R2?", "R3?", "R4?"],
    diskusi: ["D1?", "D2?", "D3?", "D4?"],
    jalur: [
      jalur("Spasial", ["Arsitek", "Desainer interior"]),
      jalur("Kinestetik", ["Fisioterapis"]),
      jalur("Linguistik", ["Customer relations"]),
    ],
    ...overrides,
  };
}

test("Top memakai urutan kode saat skor seri", () => {
  // Spasial dan Kinestetik sama-sama 82: Spasial menang karena datang lebih dulu di urutan.
  assert.deepEqual(hitungTop(SKOR), ["Spasial", "Kinestetik", "Linguistik"]);
  const nol = Object.fromEntries(Object.keys(SKOR).map((k) => [k, 0]));
  assert.deepEqual(hitungTop(nol), ["Musikal", "Spasial", "Linguistik"]);
  assert.equal(semuaSkorNol(nol), true);
  assert.equal(semuaSkorNol(SKOR), false);
});

test("JSON valid dipecah ke nama kolom detail lama", () => {
  const { pregen, error } = bacaLaporanJsonMi(JSON.stringify(laporan()), SKOR);
  assert.equal(error, undefined);
  assert.deepEqual(pregen.top, ["Spasial", "Kinestetik", "Linguistik"]);
  const k = pregen.kolom;
  assert.equal(k.cara_belajar_5_title, "Langkah 5");
  assert.equal(k.gaya_kom_siswa_3_script, "Kalimat 3.");
  assert.equal(k.sinyal_2_icon, "🧩");
  assert.equal(k.hari_7, "Tugas hari 7.");
  assert.equal(k.mapel_kuasai, "Seni Budaya, Matematika, PJOK, Prakarya, IPA");
  assert.equal(k.top_1_jurusan, "Arsitektur, Desain Interior, Teknik Sipil");
  assert.equal(k.top_1_profesi_sorot_skill_2, "Menggambar teknik");
  assert.equal(k.top_1_profesi_sorot_figur, "Ridwan Kamil");
  assert.equal(
    k.top_1_profesi_detail,
    "Arsitek|Mengerjakan rancangan. Bekerja di studio atau lapangan.|Satu|Dua|Tiga|Kuliah S1 yang relevan.\n"
      + "Desainer interior|Mengerjakan rancangan. Bekerja di studio atau lapangan.|Satu|Dua|Tiga|Kuliah S1 yang relevan.",
  );
});

test("pagar markdown dilucuti, sel kosong dan penanda dikenali", () => {
  assert.ok(bacaLaporanJsonMi("```json\n" + JSON.stringify(laporan()) + "\n```", SKOR).pregen);
  assert.deepEqual(bacaLaporanJsonMi("", SKOR), { pregen: null });
  assert.deepEqual(bacaLaporanJsonMi("TIDAK_DINILAI", SKOR), { pregen: null, tidakDinilai: true });
  assert.match(bacaLaporanJsonMi("{bukan json", SKOR).error, /bukan JSON/);
});

test("Top berbeda dari hitungan sistem ditolak", () => {
  const { error } = bacaLaporanJsonMi(JSON.stringify(laporan({ top: ["Kinestetik", "Spasial", "Linguistik"] })), SKOR);
  assert.match(error, /tidak sama dengan hitungan sistem/);
});

test("jumlah butir, isi kosong, pipa, dan koma di butir daftar ditolak", () => {
  const kurang = laporan({ hari: ["satu", "dua"] });
  assert.match(bacaLaporanJsonMi(JSON.stringify(kurang), SKOR).error, /hari berisi 2 butir, seharusnya 7/);

  const kosong = laporan({ narasi_cover: "  " });
  assert.match(bacaLaporanJsonMi(JSON.stringify(kosong), SKOR).error, /narasi_cover kosong/);

  const pipa = laporan({ refleksi: ["a|b", "R2?", "R3?", "R4?"] });
  assert.match(bacaLaporanJsonMi(JSON.stringify(pipa), SKOR).error, /karakter \|/);

  const koma = laporan({ mapel_kuasai: ["Seni, Budaya", "Matematika", "PJOK", "Prakarya", "IPA"] });
  assert.match(bacaLaporanJsonMi(JSON.stringify(koma), SKOR).error, /koma/);

  const ikon = laporan();
  ikon.sinyal_ortu[0].ikon = "Judul panjang";
  assert.match(bacaLaporanJsonMi(JSON.stringify(ikon), SKOR).error, /satu emoji/);
});

test("kecerdasan di jalur wajib sama dengan urutan top", () => {
  const l = laporan();
  l.jalur[1].kecerdasan = "Musikal";
  assert.match(bacaLaporanJsonMi(JSON.stringify(l), SKOR).error, /jalur ke-2 kecerdasan/);
});

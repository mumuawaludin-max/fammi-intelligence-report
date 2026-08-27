/**
 * Penghitung frekuensi kata untuk word cloud testimoni Citra Sekolah.
 *
 * Kenapa dihitung di klien, bukan di Supabase: ini lapisan tampilan, bukan skor. Aturan "FIR
 * tidak menghitung apa pun" di CLAUDE.md soal skor/status/agregat asesmen yang sudah final di
 * hulu. Frekuensi kata tidak pernah jadi angka penilaian, tidak pernah masuk tindak lanjut, dan
 * berubah begitu daftar stopword disetel. Menaruhnya di view Postgres justru mengunci keputusan
 * tampilan ke migrasi. Teks testimoni satu periode sudah ditarik untuk daftar detail, jadi
 * menghitungnya sekali lagi tidak menambah query.
 *
 * Tidak ada pemanggilan Gemini di sini. Hasilnya deterministik: input sama, cloud sama.
 */

/**
 * Kata fungsi Bahasa Indonesia. Selalu dibuang, tidak bisa dimunculkan lewat tombol apa pun,
 * karena tidak pernah membawa makna sendiri.
 * Disusun dari 120 kata teratas korpus testimoni YPT (13.013 teks) plus daftar kata fungsi baku,
 * termasuk ragam percakapan yang benar-benar muncul di data ("karna", "gak", "udah").
 */
const STOPWORD = new Set(`
ada adalah adanya agar akan aku alangkah antara apa apabila apalagi atas atau
bagaimana bagi bahkan bahwa banget banyak baru beberapa begini begitu belum berupa beserta
biar bila bisa buat bukan bukanlah
cukup
dalam dan dapat dari daripada deh demi dengan demikian dia dilakukan dll dsb dong dulu
engga enggak
gak gini gitu guna
hal hanya harus hingga
ialah ini itu iya
jadi jangan jika juga jua
kah kalau kami kamu karena karna kecuali kembali kemudian kepada ketika kini kita kok
lagi lain lainnya lalu lebih
maka makin malah masih maupun melainkan memang memberi memberikan membuat menjadi mereka
merupakan meski meskipun misalnya mungkin
namun
oleh orang
pada padahal paling para pula
saat saja sama sampai sangat saya sebab sebagai sebelum secara sedang sedangkan segera
sehingga sekali sekitar selain selalu selama seluruh sementara semoga semua semuanya
sepertinya seperti serta sesuai sesuatu setelah setiap sini situ suatu sudah supaya
tadi tanpa tapi telah tentang tentu terhadap terlalu termasuk tersebut tetap tetapi tidak
udah untuk
walau walaupun
yaitu yakni yang
`.trim().split(/\s+/));

/**
 * Kata yang dibuang secara DEFAULT tapi bisa dimunculkan lagi lewat tombol "tampilkan kata umum".
 * BEDA dari STOPWORD yang buangannya permanen: kata-kata di sini punya arti, cuma tidak
 * membedakan satu kategori dari kategori lain, jadi kalau dibiarkan cloud kelima kategori
 * sama-sama berbunyi "sekolah anak guru terimakasih". Kadang bobot relatifnya justru yang mau
 * dilihat (misal seberapa sering "fasilitas" disebut di Keluhan versus di Harapan), makanya
 * disembunyikan, bukan dihapus.
 *
 * Dua kelompok, dipisah baris kosong di bawah:
 *   1. Kata domain: peran, institusi, sapaan. Muncul di mana-mana karena ini memang topiknya.
 *   2. Gema kategori: responden mengulang label pilihannya di kalimat pertama ("Harapan saya...",
 *      "Terima kasih..."). Diverifikasi terhadap data: "terimakasih" jadi kata teratas di
 *      KELIMA kategori, termasuk Keluhan. Itu artefak bentuk pertanyaan, bukan temuan.
 */
const KATA_UMUM = new Set(`
ananda anak anaknya bapak
sekolah sekolahan telkom
guru walikelas walimurid murid siswa siswi
orangtua putra putri pihak

terimakasih harapan saran masukan keluhan kritik
`.trim().split(/\s+/));

/**
 * Frasa dua kata yang harus dibaca sebagai satu istilah. Digabung SEBELUM pemisahan spasi,
 * kalau tidak "terima kasih" pecah jadi "terima" (2.011 kemunculan) dan "kasih" (2.621) yang
 * berdiri sendiri tanpa arti, dan "orang tua" hilang di balik stopword.
 * Urut dari frasa terpanjang supaya "sarana dan prasarana" tidak keburu tertangkap pola
 * "sarana prasarana" yang lebih pendek.
 */
const FRASA = [
  ["sarana dan prasarana", "saranaprasarana"],
  ["sarana prasarana", "saranaprasarana"],
  ["terima kasih", "terimakasih"],
  ["trima kasih", "terimakasih"],
  ["orang tua", "orangtua"],
  ["wali kelas", "walikelas"],
  ["wali murid", "walimurid"],
  ["tepat waktu", "tepatwaktu"],
  ["belajar mengajar", "belajarmengajar"],
  ["percaya diri", "percayadiri"],
  ["tata tertib", "tatatertib"],
  ["ekstra kurikuler", "ekstrakurikuler"],
  ["ekstra kulikuler", "ekstrakurikuler"],
  ["mata pelajaran", "matapelajaran"],
  ["uang saku", "uangsaku"],
];

/**
 * Varian ejaan dan imbuhan yang menunjuk kata yang sama. Bukan stemmer penuh (Sastrawi dan
 * sejenisnya terlalu berat untuk dibundel demi satu cloud), cuma pemetaan varian yang benar
 * benar muncul di korpus ini dengan frekuensi cukup besar untuk memecah satu tema jadi beberapa
 * balok terpisah. Ditambah seperlunya kalau data baru memunculkan varian lain.
 */
const ALIAS = {
  berterimakasih: "terimakasih", berterima: "terimakasih", makasih: "terimakasih",
  makasi: "terimakasih", trimakasih: "terimakasih", terimaksih: "terimakasih",
  mengucapkan: "terimakasih", terimakasihnya: "terimakasih",
  harapannya: "harapan", harapanya: "harapan", berharap: "harapan", diharapkan: "harapan",
  mengharapkan: "harapan",
  keluhannya: "keluhan", mengeluhkan: "keluhan", kritikan: "kritik",
  sarannya: "saran", masukannya: "masukan",
  kedepannya: "kedepan", depan: "kedepan", kdepan: "kedepan",
  disekolah: "sekolah", sekolahnya: "sekolah", gurunya: "guru",
  belajarnya: "belajar", pembelajaran: "belajar", pelajaran: "belajar", pelajarannya: "belajar",
  pengajaran: "mengajar", diajarkan: "mengajar",
  membimbing: "bimbingan", bimbingannya: "bimbingan", dibimbing: "bimbingan",
  pendidikan: "mendidik", didikan: "mendidik", dididik: "mendidik",
  fasilitasnya: "fasilitas",
  perkembangan: "berkembang", berkembangnya: "berkembang", perkembangannya: "berkembang",
  kemandirian: "mandiri", mandirinya: "mandiri",
  temannya: "teman", pertemanan: "teman", temen: "teman",
  komunikasinya: "komunikasi", berkomunikasi: "komunikasi",
  kebersihan: "bersih", kebersihannya: "bersih",
  keamanan: "aman", kenyamanan: "nyaman",
  prestasinya: "prestasi", berprestasi: "prestasi",
  kedisiplinan: "disiplin", disiplinnya: "disiplin",
  perhatiannya: "perhatian", memperhatikan: "perhatian", diperhatikan: "perhatian",
  kegiatannya: "kegiatan",
};

/** Panjang minimum token setelah normalisasi. Di bawahnya isinya partikel dan singkatan. */
const MIN_PANJANG = 4;

/**
 * Satu teks bebas jadi daftar token bersih.
 * Angka dan emoji dibuang seluruhnya: nomor kelas, tahun, dan nominal uang tidak pernah jadi
 * tema, dan emoji yang tidak dibuang akan berdiri sebagai token tersendiri.
 *
 * Hasilnya di-cache SEKALI per testimoni di useCsData, bukan dihitung ulang tiap ganti kategori.
 * Diukur pada data produksi (13.013 testimoni, 5 kategori tumpang tindih): menokenisasi ulang
 * tiap perpindahan tab makan ~900 ms, sedangkan sekali di depan lalu menghitung dari token yang
 * sudah jadi tinggal puluhan milidetik.
 */
export function tokenisasi(teks) {
  let t = String(teks || "").toLowerCase().replace(/[^a-z\s]/g, " ");

  // Rapatkan spasi SEBELUM penggabungan frasa, dan ini bukan kerapian belaka.
  // Baris di atas menyisakan seluruh karakter spasi apa adanya (\s mencakup baris baru, tab, dan
  // spasi tak-putus), DAN justru menciptakan spasi ganda di tiap bekas tanda baca. Pola di FRASA
  // ditulis dengan satu spasi biasa, jadi tanpa perapatan ini "terima\nkasih" dan "orang  tua"
  // luput dari penggabungan. Diuji langsung: "orang  tua saya" menghasilkan token KOSONG, karena
  // "orang" yang tidak tergabung adalah stopword dan "tua" di bawah panjang minimum, sehingga
  // penyebutan itu hilang sama sekali dari hitungan. Baris baru di tengah jawaban bukan kasus
  // langka: parser CSV di Edge Function ditulis tangan justru karena itu sering terjadi.
  t = t.replace(/\s+/g, " ").trim();

  FRASA.forEach(([cari, ganti]) => { t = t.split(cari).join(ganti); });

  return t.split(/\s+/)
    .map((w) => ALIAS[w] || w)
    .filter((w) => w.length >= MIN_PANJANG && !STOPWORD.has(w));
}

/**
 * Hitung frekuensi kata dari sekumpulan testimoni yang SUDAH ditokenisasi.
 *
 * Peringkatnya pakai jumlah TESTIMONI yang memuat kata itu, bukan jumlah kemunculan mentah.
 * Alasannya kelihatan langsung di data: di kategori Kritik, kata "osis" muncul 20 kali tapi
 * seluruhnya dari 2 testimoni yang sama. Peringkat berbasis kemunculan menaikkannya ke posisi
 * kesembilan seolah itu keluhan bersama, padahal itu dua orang yang menulis panjang.
 *
 * @param {string[][]} daftarToken   satu array token per testimoni
 * @param {object}     opsi
 * @param {boolean}    opsi.sertakanKataUmum  true = kata domain dan gema kategori ikut dihitung
 * @param {number}     opsi.batas             jumlah kata teratas yang dikembalikan
 * @param {number}     opsi.minTestimoni      buang kata yang muncul di kurang dari sekian testimoni
 * @returns {{kata: string, testimoni: number, kemunculan: number, bobot: number}[]}
 *          bobot 0..1 relatif terhadap kata teratas, dipakai langsung untuk ukuran font.
 */
export function hitungKata(daftarToken, opsi = {}) {
  const { sertakanKataUmum = false, batas = 60, minTestimoni = 3 } = opsi;
  const { kemunculan, testimoni } = statistikKata(daftarToken, sertakanKataUmum);

  const urut = [...testimoni.entries()]
    .filter(([, n]) => n >= minTestimoni)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, batas);

  const puncak = urut[0]?.[1] || 1;
  return urut.map(([kata, n]) => ({
    kata,
    testimoni: n,
    kemunculan: kemunculan.get(kata) || 0,
    bobot: n / puncak,
  }));
}

/**
 * Statistik dasar satu kumpulan testimoni: berapa kali tiap kata muncul, di berapa testimoni,
 * dan berapa testimoni yang dihitung. Diekspor supaya pemanggil bisa menghitung statistik korpus
 * penuh SEKALI lalu memakainya ulang untuk kelima kategori, alih-alih menyapu korpus lima kali.
 */
export function statistikKata(daftarToken, sertakanKataUmum = false) {
  const kemunculan = new Map();
  const testimoni = new Map();

  (daftarToken || []).forEach((token) => {
    const unik = new Set();
    (token || []).forEach((w) => {
      if (!sertakanKataUmum && KATA_UMUM.has(w)) return;
      kemunculan.set(w, (kemunculan.get(w) || 0) + 1);
      unik.add(w);
    });
    unik.forEach((w) => testimoni.set(w, (testimoni.get(w) || 0) + 1));
  });

  return { kemunculan, testimoni, jumlah: (daftarToken || []).length };
}

/**
 * Kata yang KHAS untuk satu kelompok, bukan yang paling sering muncul di dalamnya.
 *
 * Perlu ada karena frekuensi mentah menjawab pertanyaan yang salah untuk pembaca level yayasan.
 * Diuji pada data produksi: kelima kategori sama-sama menempatkan "belajar", "baik", dan
 * "kegiatan" di posisi teratas, karena itu memang kosakata dasar semua orang tua yang menulis
 * soal sekolah. Membandingkan lima cloud yang isinya kata yang sama tidak memberi tahu apa pun.
 *
 * Skornya rasio angkat: seberapa jauh porsi testimoni yang menyebut satu kata di kelompok ini
 * melebihi porsinya di seluruh korpus. Kata yang tersebar merata dapat skor sekitar 1 dan
 * tenggelam; kata yang menumpuk di satu kategori naik ke atas. Hasilnya untuk kategori Keluhan
 * berubah dari "belajar, baik, fasilitas" menjadi "wifi, panas, kamar mandi", yang justru itulah
 * yang perlu dilihat pengurus yayasan.
 *
 * Pembandingnya KOMPLEMEN, yaitu testimoni yang TIDAK membawa label ini, bukan seluruh korpus.
 * Bedanya menentukan: Ucapan Terimakasih mencakup 81% testimoni, jadi dibandingkan terhadap
 * korpus penuh ia praktis dibandingkan dengan dirinya sendiri dan seluruh rasionya mentok di
 * 1,2x, memunculkan kata acak alih-alih kata khas. Terhadap komplemennya, kontrasnya kembali
 * berarti. Cacah komplemen diturunkan dengan pengurangan dari statistik korpus (komplemen =
 * korpus dikurangi kelompok), yang tepat karena tiap testimoni dihitung sekali di masing-masing.
 *
 * Penghalusan `eps` menahan kata yang cuma muncul di beberapa testimoni dari melompat ke puncak
 * hanya karena penyebutnya nol di tempat lain. Ambang minTestimoni ikut besar kelompoknya, satu
 * persen anggotanya, supaya yang tersaring adalah pola dan bukan salah ketik satu dua orang.
 *
 * @param {string[][]} tokenKelompok   token testimoni di dalam kelompok
 * @param {object}     statistikSemua  keluaran statistikKata() atas SELURUH korpus pembanding,
 *                                     kelompok ini termasuk di dalamnya
 */
export function hitungKataKhas(tokenKelompok, statistikSemua, opsi = {}) {
  const { sertakanKataUmum = false, batas = 24 } = opsi;

  const nKelompok = (tokenKelompok || []).length;
  const nSemua = statistikSemua?.jumlah || 0;
  const nLuar = nSemua - nKelompok;
  if (nKelompok === 0 || nLuar <= 0) return [];

  const minTestimoni = opsi.minTestimoni ?? Math.max(4, Math.round(nKelompok * 0.01));
  const dalam = statistikKata(tokenKelompok, sertakanKataUmum);
  const eps = 1 / nSemua;

  const skor = [...dalam.testimoni.entries()]
    .filter(([, n]) => n >= minTestimoni)
    .map(([kata, n]) => {
      const porsiDalam = n / nKelompok;
      const porsiLuar = ((statistikSemua.testimoni.get(kata) || 0) - n) / nLuar;
      return {
        kata,
        testimoni: n,
        kemunculan: dalam.kemunculan.get(kata) || 0,
        angkat: (porsiDalam + eps) / (porsiLuar + eps),
      };
    })
    .sort((a, b) => b.angkat - a.angkat || b.testimoni - a.testimoni || a.kata.localeCompare(b.kata))
    .slice(0, batas);

  const puncak = skor[0]?.angkat || 1;
  return skor.map((s) => ({ ...s, bobot: s.angkat / puncak }));
}

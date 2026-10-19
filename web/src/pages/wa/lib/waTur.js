// Isi panduan langkah demi langkah modul Wellbeing Assessment (fitur Panduan, permintaan pemilik
// produk 2026-10-19). Tiap langkah menyorot satu bagian layar lewat atribut data-tur dan
// menjelaskannya dengan bahasa sehari-hari. Ditulis sebagai data supaya bisa diuji (tanpa kata
// terlarang, tanpa tanda hubung panjang) dan diubah tanpa menyentuh komponen.
//
// Bentuk langkah: { target?, judul, isi: string[], daftar?: [{ tanda, label, teks }], bagian? }
//   target  nilai data-tur yang disorot; kosong = kartu di tengah layar tanpa sorotan
//   bagian  (laporan pegawai) bagian yang harus dibuka dulu: ringkasan | kuat | perlu | refleksi
// Langkah yang targetnya tidak ada di layar (mis. pegawai tidak menulis cerita) dilewati otomatis.

import { ASPEK, DIMENSI_KEPUASAN, JUDUL_TAB_WELLBEING } from "./waMeta.js";

const DAFTAR_PROTEK = ASPEK.map((a) => ({ tanda: a.huruf, label: a.label, teks: a.arti }));
const DAFTAR_DIMENSI = DIMENSI_KEPUASAN.map((d) => ({ tanda: null, label: d.label, teks: d.arti }));

const KATEGORI_PROTEK_TEKS =
  "Kategorinya dari total skor: Baik 141 sampai 252, Perlu Perhatian 71 sampai 140, Perlu Pendampingan 70 ke bawah.";
const KATEGORI_KEPUASAN_TEKS =
  "Kategorinya: Sangat Puas 4,20 ke atas, Puas 3,40 sampai 4,19, Netral 2,60 sampai 3,39, Tidak Puas 1,80 sampai 2,59, Sangat Tidak Puas di bawahnya.";

// ── Laporan pegawai ─────────────────────────────────────────────────────────────────────────

export function langkahPegawai() {
  return [
    {
      judul: "Panduan membaca laporan Anda",
      isi: [
        "Panduan ini menunjukkan isi laporan satu per satu, kira-kira dua menit.",
        "Tekan Lanjut untuk pindah. Tekan Lewati kalau ingin membaca sendiri. Panduan ini bisa dibuka lagi dari tombol Menu.",
      ],
      bagian: "ringkasan",
    },
    {
      target: "skor-wellbeing",
      bagian: "ringkasan",
      judul: "Skor kesejahteraan diri",
      isi: [
        "Angka ini merangkum jawaban Anda atas 42 pernyataan tentang diri sendiri, misalnya cara Anda memandang diri dan hubungan dengan orang lain.",
        "Tiap pernyataan bernilai 1 sampai 6. Totalnya diubah menjadi persen: makin tinggi, makin baik kondisi yang Anda rasakan.",
        KATEGORI_PROTEK_TEKS,
        "Kotak ungu berisi penjelasan singkat yang disusun dari jawaban Anda dan sudah diperiksa tim Fammi.",
      ],
    },
    {
      target: "aspek",
      bagian: "ringkasan",
      judul: "Apa itu PROTEK",
      isi: [
        "PROTEK adalah singkatan enam aspek kesejahteraan diri. Tiap aspek diukur dengan 7 pernyataan.",
        "Bar jingga menandai aspek yang skornya masuk Perlu Perhatian atau Perlu Pendampingan.",
        "Ketuk satu aspek untuk membaca artinya bagi Anda, hal yang bisa dilakukan, dan tujuh pernyataannya.",
      ],
      daftar: DAFTAR_PROTEK,
    },
    {
      target: "aspek-catatan",
      bagian: "ringkasan",
      judul: "Tanda tambah dan kurang",
      isi: [
        "Tanda tambah berisi hal yang sudah kuat. Tanda kurang berisi hal yang paling bisa dikuatkan.",
        "Keduanya diambil dari pernyataan dengan skor tertinggi dan terendah Anda.",
      ],
    },
    {
      target: "skor-kepuasan",
      bagian: "ringkasan",
      judul: "Kepuasan kerja",
      isi: [
        "Angka ini adalah rata-rata jawaban Anda atas 12 pernyataan tentang pekerjaan, dari 1 (sangat tidak puas) sampai 5 (sangat puas). Bintang menunjukkan angka yang sama.",
        KATEGORI_KEPUASAN_TEKS,
      ],
    },
    {
      target: "dimensi",
      bagian: "ringkasan",
      judul: "Enam bidang kepuasan",
      isi: [
        "Dua belas pernyataan kepuasan dikelompokkan menjadi enam bidang, masing-masing dua pernyataan. Lingkaran jingga menandai bidang dengan nilai paling rendah.",
      ],
      daftar: DAFTAR_DIMENSI,
    },
    {
      target: "top-kuat",
      bagian: "ringkasan",
      judul: "Pernyataan yang sudah kuat",
      isi: [
        "Tiga pernyataan dengan skor tertinggi Anda. Pernyataan dengan skor 5 atau 6 dihitung kuat.",
        "Tekan Lihat Semua untuk membuka daftar lengkapnya.",
      ],
    },
    {
      target: "top-perlu",
      bagian: "ringkasan",
      judul: "Pernyataan yang bisa dikuatkan",
      isi: [
        "Tiga pernyataan dengan skor terendah Anda. Skor 1 sampai 3 dihitung perlu penguatan dan barnya jingga.",
        "Kalau semua skor Anda 4 ke atas, barnya ungu muda.",
      ],
    },
    {
      target: "pesan",
      bagian: "ringkasan",
      judul: "Tanggapan untuk cerita Anda",
      isi: [
        "Kalau Anda menulis cerita saat mengisi, ada tanggapan untuk cerita itu. Tanggapannya ada di bagian Refleksi Saya.",
      ],
    },
    {
      target: "umpan-ajak",
      bagian: "ringkasan",
      judul: "Umpan balik untuk asesmen ini",
      isi: [
        "Setelah membaca, beri nilai pengalaman Anda: sembilan pertanyaan singkat, sekitar dua menit.",
        "Jawaban bisa diubah kapan saja.",
      ],
    },
    {
      target: "refleksi-tanya",
      bagian: "refleksi",
      judul: "Pertanyaan untuk direnungkan",
      isi: [
        "Ini bagian Refleksi Saya. Pertanyaan di atas disusun dari jawaban Anda. Tidak perlu dijawab di aplikasi.",
      ],
    },
    {
      target: "refleksi-pilihan",
      bagian: "refleksi",
      judul: "Pilihan Anda di survei",
      isi: [
        "Pilihan yang Anda centang saat mengisi: hal yang disukai, yang mengganggu, yang terasa mudah dan sulit, serta keputusan pimpinan.",
      ],
    },
    {
      target: "langkah",
      bagian: "refleksi",
      judul: "Langkah kecil",
      isi: [
        "Beberapa hal yang bisa dicoba, disesuaikan dengan hasil Anda. Ketuk kartu untuk menandai langkah yang ingin dicoba.",
        "Tanda itu hanya tampil di layar ini dan tidak disimpan.",
      ],
    },
    {
      target: "tanggapan-cerita",
      bagian: "refleksi",
      judul: "Cerita dan tanggapan",
      isi: [
        "Di atas ada cerita yang Anda tulis saat mengisi, supaya Anda ingat tanggapan ini untuk cerita yang mana. Di bawahnya tanggapan untuk cerita itu.",
        "Kalau tanggapannya belum ada, artinya masih ditinjau.",
      ],
    },
    {
      target: "menu",
      bagian: "ringkasan",
      judul: "Pindah bagian lewat Menu",
      isi: [
        "Tombol Menu membuka lima bagian: Ringkasan, Aspek Kuat, Perlu Penguatan, Refleksi Saya, dan Umpan Balik.",
        "Dari Menu juga Anda bisa membuka panduan ini lagi.",
      ],
    },
  ];
}

// ── Laporan kelompok (Human Capital) ────────────────────────────────────────────────────────

const LANGKAH_HC = {
  ringkasan: ({ nResponden }) => [
    {
      judul: "Panduan laporan kelompok",
      isi: [
        `Laporan ini merangkum hasil Wellbeing Assessment ${nResponden} pegawai. Panduan ini menjelaskan tab Ringkasan.`,
        "Tiap tab punya panduannya sendiri. Bukalah lewat tombol Panduan di bilah atas.",
      ],
    },
    {
      target: "cakupan",
      judul: "Pilih cakupan",
      isi: [
        "Lihat seluruh lembaga, atau satu jenjang, unit, atau kelompok jabatan. Semua tab ikut berubah sesuai pilihan ini.",
        "Unit \"Tidak teridentifikasi\" berisi pegawai yang tidak menulis unitnya dengan jelas saat mengisi.",
      ],
    },
    {
      target: "skor-wellbeing",
      judul: `Skor ${JUDUL_TAB_WELLBEING.toLowerCase()} pegawai`,
      isi: [
        "Rata-rata skor kesejahteraan diri pegawai di cakupan ini. Tiap pegawai menjawab 42 pernyataan bernilai 1 sampai 6; totalnya diubah menjadi persen.",
        KATEGORI_PROTEK_TEKS,
        "Kotak ungu berisi ringkasan yang sudah ditinjau tim Fammi. Kalau kosong, narasinya belum disetujui.",
      ],
    },
    {
      target: "aspek",
      judul: "Enam aspek PROTEK",
      isi: [
        "Tiap huruf adalah satu aspek, diukur dengan 7 pernyataan. Bar jingga menandai aspek dengan skor terendah. Klik huruf untuk melihat sebaran pegawainya.",
      ],
      daftar: DAFTAR_PROTEK,
    },
    {
      target: "catatan-wellbeing",
      judul: "Hal baik dan yang perlu ditingkatkan",
      isi: ["Dua kalimat ringkas dari hasil kelompok: yang sudah kuat dan yang paling perlu dikuatkan."],
    },
    {
      target: "skor-kepuasan",
      judul: "Skor kepuasan kerja",
      isi: [
        "Rata-rata kepuasan pegawai atas 12 pernyataan tentang pekerjaan, skala 1 sampai 5.",
        KATEGORI_KEPUASAN_TEKS,
      ],
    },
    {
      target: "dimensi",
      judul: "Enam bidang kepuasan",
      isi: ["Rata-rata tiap bidang, skala 1 sampai 5. Lingkaran jingga menandai bidang dengan nilai terendah. Klik untuk melihat rinciannya."],
      daftar: DAFTAR_DIMENSI,
    },
    {
      target: "top-item",
      judul: "Pernyataan terkuat dan terlemah",
      isi: [
        "Rata-rata 5 ke atas dihitung kuat, di bawah 4 perlu penguatan.",
        "Sebagian kalimat kuesioner berbunyi negatif. Teks di sini sudah diubah ke arah positif, jadi persen tinggi selalu berarti baik. Arahkan kursor ke teks untuk melihat kalimat aslinya.",
      ],
    },
    {
      target: "tab-bar",
      judul: "Tab lainnya",
      isi: ["Enam tab lain membahas tiap bagian lebih rinci."],
      daftar: [
        { tanda: null, label: JUDUL_TAB_WELLBEING, teks: "Sebaran kategori per aspek dan daftar pegawai per kategori." },
        { tanda: null, label: "Kepuasan Kerja", teks: "Sebaran lima tingkat kepuasan per bidang." },
        { tanda: null, label: "Survey", teks: "Jawaban pilihan ganda: yang disukai, yang sulit, dan keputusan pimpinan." },
        { tanda: null, label: "Testimoni", teks: "Jawaban terbuka pegawai beserta temanya." },
        { tanda: null, label: "Temuan & Langkah", teks: "Temuan lintas data dan usulan tindak lanjut." },
        { tanda: null, label: "Dampak Asesmen", teks: "Rekap umpan balik pegawai setelah membaca laporannya, diperbarui otomatis." },
      ],
    },
  ],
  wellbeing: () => [
    {
      target: "resume",
      judul: "Sebaran kategori",
      isi: [
        "Bar dan tiga kartu ini menunjukkan berapa pegawai di tiap kategori.",
        KATEGORI_PROTEK_TEKS,
        "Klik kartu untuk melihat daftar nama pegawai di kategori itu.",
      ],
    },
    {
      target: "resume-catatan",
      judul: "Yang menguatkan dan yang menurunkan",
      isi: ["Aspek yang paling sering tinggi pada pegawai berkategori Baik, dan aspek yang paling sering rendah pada kategori di bawahnya."],
    },
    {
      target: "rincian",
      judul: "Sebaran per aspek",
      isi: [
        "Tiap baris satu aspek PROTEK. Panjang warna menunjukkan berapa pegawai di tiap kategori untuk aspek itu.",
        "Arahkan kursor ke bar untuk melihat jumlah pegawainya.",
      ],
    },
    {
      target: "top-pegawai",
      judul: "Lima pegawai per kategori",
      isi: [
        "Kolom Baik diurutkan dari skor tertinggi. Dua kolom lain diurutkan dari skor terendah, supaya pegawai yang paling perlu didekati muncul lebih dulu.",
        "Klik nama untuk melihat profil singkat. Profil hanya berisi angka; penjelasan pribadi tetap hanya untuk pegawai itu.",
      ],
    },
  ],
  kepuasan: () => [
    {
      target: "resume",
      judul: "Sebaran kepuasan",
      isi: [
        "Berapa pegawai yang Puas, Netral, dan Tidak Puas, dilihat dari rata-rata 12 pernyataan.",
        "Puas 3,40 ke atas, Netral 2,60 sampai 3,39, Tidak Puas di bawah 2,60. Klik kartu untuk melihat daftar namanya.",
      ],
    },
    {
      target: "dimensi-bintang",
      judul: "Nilai tiap bidang",
      isi: ["Rata-rata kepuasan tiap bidang, skala 1 sampai 5. Ikon jingga menandai bidang dengan nilai terendah."],
    },
    {
      target: "catatan-kepuasan",
      judul: "Hal baik dan yang perlu ditingkatkan",
      isi: ["Dua kalimat ringkas tentang kepuasan kelompok ini."],
    },
    {
      target: "rincian",
      judul: "Lima tingkat kepuasan",
      isi: ["Tiap baris satu bidang. Warna menunjukkan berapa pegawai yang Sangat Puas sampai Sangat Tidak Puas di bidang itu."],
    },
    {
      target: "top-pegawai",
      judul: "Lima pegawai per kategori",
      isi: ["Kolom Puas diurutkan dari nilai tertinggi, dua kolom lain dari nilai terendah. Klik nama untuk profil singkat."],
    },
  ],
  survey: () => [
    {
      target: "kesimpulan",
      judul: "Dua kesimpulan",
      isi: ["Kartu hijau merangkum hal yang sudah berjalan baik. Kartu jingga merangkum hal yang paling sering dikeluhkan dan perlu ditangani lebih dulu."],
    },
    {
      target: "pilihan",
      judul: "Jawaban pilihan ganda",
      isi: [
        "Persen adalah jumlah pegawai yang memilih, dibagi jumlah pegawai di cakupan ini. Satu orang boleh memilih lebih dari satu, jadi totalnya bisa lebih dari 100%.",
        "Jawaban \"tidak ada\" dan \"belum bisa menjawab\" ditaruh redup di bagian bawah.",
      ],
    },
  ],
  testimoni: () => [
    {
      target: "pertanyaan",
      judul: "Empat pertanyaan terbuka",
      isi: ["Klik satu kartu untuk melihat jawaban pertanyaan itu. Angka di pojok kartu adalah jumlah jawaban yang ditampilkan."],
    },
    {
      target: "tema",
      judul: "Tema jawaban",
      isi: ["Jawaban yang mirip dikelompokkan menjadi tema. Angkanya jumlah jawaban. Klik tema untuk menyaring kutipan dan membaca ringkasannya."],
    },
    {
      target: "saring",
      judul: "Saring dan cari",
      isi: ["Saring menurut peran penulis, atau cari kata tertentu."],
    },
    {
      target: "kutipan",
      judul: "Kutipan pegawai",
      isi: [
        "Jawaban ditampilkan apa adanya beserta nama penulisnya.",
        "Jawaban yang menyebut orang lain, berisi keluhan ke orang tertentu, atau diminta dirahasiakan tidak ditampilkan.",
      ],
    },
  ],
  dampak: () => [
    {
      target: "dampak-angka",
      judul: "Dampak asesmen bagi pegawai",
      isi: [
        "Tab ini merangkum umpan balik yang diisi pegawai setelah membaca laporan pribadinya. Isinya diperbarui otomatis tiap 20 detik, jadi isian baru langsung terlihat.",
        "Kartu pertama menunjukkan berapa pegawai yang sudah mengisi. Tiga kartu lain adalah rata-rata nilai 1 sampai 10.",
      ],
    },
    {
      target: "dampak-rencana",
      judul: "Yang ingin dilakukan setelah membaca",
      isi: [
        "Ini dampak yang paling langsung: tindakan yang ingin diambil pegawai setelah membaca laporannya. Satu orang boleh memilih lebih dari satu.",
        "Pilihan \"Menyampaikan kebutuhan ke Human Capital\" layak diperhatikan: artinya ada pegawai yang akan datang membawa kebutuhan.",
      ],
    },
    {
      target: "dampak-diperhatikan",
      judul: "Merasa diperhatikan",
      isi: ["Apakah asesmen ini membuat pegawai merasa diperhatikan lembaga, dan apakah penjelasannya sesuai dengan yang mereka rasakan."],
    },
    {
      target: "dampak-esai",
      judul: "Kata pegawai",
      isi: [
        "Jawaban terbuka apa adanya, tanpa nama, terbaru di atas.",
        "Rekap baru terbuka setelah minimal tiga pegawai mengisi, supaya jawaban tidak bisa ditebak pemiliknya.",
      ],
    },
  ],
  temuan: () => [
    {
      target: "insight",
      judul: "Temuan utama",
      isi: ["Pola yang terlihat setelah beberapa bagian data dibaca bersamaan. Klik \"Lihat angka pendukung\" untuk melihat dasarnya."],
    },
    {
      target: "tindak",
      judul: "Langkah tindak lanjut",
      isi: ["Usulan langkah per pihak: Human Capital, pimpinan unit, atau direksi. Klik kartu untuk melihat langkahnya dan cara mengukur keberhasilannya."],
    },
    {
      target: "tema-cerita",
      judul: "Yang sering diceritakan",
      isi: ["Tema dari cerita yang ditulis pegawai. Hanya tema yang dialami lima orang atau lebih yang ditampilkan, tanpa kutipan dan tanpa nama. Isi cerita hanya dibaca tim Fammi."],
    },
    {
      target: "sebaran",
      judul: "Wellbeing dan kepuasan",
      isi: ["Satu titik satu pegawai. Kalau titik-titik membentuk garis naik ke kanan, pegawai yang lebih puas cenderung juga lebih baik kesejahteraannya. Klik titik untuk profil singkat."],
    },
    {
      target: "banding",
      judul: "Perbandingan antarkelompok",
      isi: ["Skor tiap jenjang, unit, atau jabatan. Garis tegak tipis adalah angka lembaga. Klik baris untuk membuka laporan kelompok itu."],
    },
  ],
};

export function langkahHc(tab, konteks = {}) {
  return (LANGKAH_HC[tab] || LANGKAH_HC.ringkasan)(konteks);
}

export const TAB_BERPANDUAN = Object.keys(LANGKAH_HC);

/**
 * Data dummy modul Corporate Culture & Wellbeing (CW). Konteksnya KORPORAT: satu perusahaan
 * dengan beberapa unit/divisi, respondennya karyawan -- bukan sekolah/guru/murid seperti tiga
 * modul FIR lainnya. Nama organisasi "PT Pertamina Hulu Energi" dipakai atas permintaan
 * eksplisit pemilik produk sebagai contoh yang lebih relevan (perusahaan energi/hulu migas)
 * daripada nama fiktif generik -- SEMUA ANGKA, NARASI, DAN STRUKTUR UNIT DI BAWAH TETAP REKAAN,
 * bukan data PHE sungguhan. SampleTag/badge "Contoh" wajib tetap tampil di UI selama data ini
 * yang dipakai.
 *
 * Nama subdimensi kesejahteraan dan istilah lain yang tidak disebut eksplisit pemilik produk
 * juga rekaan -- lihat catatan ASUMSI di cw.types.ts.
 */
import type { LaporanAgregatCW, LaporanIndividuCW } from "./cw.types";

const ORGANISASI_ID = "org-phe";
const ORGANISASI_NAMA = "PT Pertamina Hulu Energi (contoh)";
const PERIODE = "2026-07";

const DISCLAIMER_INDIVIDU =
  "Laporan ini adalah hasil pengolahan jawaban asesmen Anda dan bersifat rahasia. Gunakan sebagai bahan refleksi pribadi, bukan alat penilaian kinerja formal.";

/** Responden 1: profil budaya seimbang, kesejahteraan baik. Unit Eksplorasi & Produksi. */
const RESPONDEN_1: LaporanIndividuCW = {
  meta: {
    responden_id: "cw-kry-001",
    nama_responden: "Arum Kusuma",
    jenis_kelamin: "Perempuan",
    nama_perusahaan: ORGANISASI_NAMA,
    jabatan: "Reservoir Engineer",
    unit: "Eksplorasi & Produksi",
    organisasi_id: ORGANISASI_ID,
    periode_id: PERIODE,
  },
  header: {
    hook: "Anda melihat perusahaan ini sebagai tempat yang hangat dan terus bertumbuh.",
    sub_hook: "Profil budaya Anda condong ke arah kolaboratif dengan dorongan inovasi yang sehat.",
  },
  bagian_budaya: {
    narasi:
      "Persepsi Anda terhadap budaya perusahaan saat ini paling kuat di sisi Kekeluargaan, menandakan Anda merasakan kedekatan dan rasa saling percaya di antara rekan satu tim lapangan. Harapan Anda ke depan tidak jauh berbeda, hanya ingin porsi Inovasi (ruang bereksperimen dengan pendekatan teknis baru) sedikit lebih besar.",
    chart_data: [
      { tipe: "Kekeluargaan", saat_ini: 68, harapan: 72 },
      { tipe: "Inovasi", saat_ini: 54, harapan: 66 },
      { tipe: "Orientasi", saat_ini: 41, harapan: 40 },
      { tipe: "Aturan", saat_ini: 47, harapan: 42 },
    ],
    tabel_gap: [
      { label: "Kekeluargaan", arah: "naik", nilai_gap: 4 },
      { label: "Inovasi", arah: "naik", nilai_gap: 12 },
      { label: "Orientasi", arah: "tetap", nilai_gap: -1 },
      { label: "Aturan", arah: "turun", nilai_gap: -5 },
    ],
  },
  bagian_kesejahteraan: {
    narasi:
      "Secara umum kondisi kesejahteraan Anda berada di kategori Tinggi. Kenyamanan bekerja jadi titik terkuat, sementara kepuasan pada kepemimpinan jadi yang paling rendah meski masih dalam batas wajar.",
    indeks: 78,
    kategori: "Tinggi",
    chart_data: [
      { kode: "kepuasan_kepemimpinan", label: "Kepuasan pada Kepemimpinan", nilai: 66, kategori: "Sedang" },
      { kode: "kenyamanan_bekerja", label: "Kenyamanan Bekerja", nilai: 88, kategori: "Sangat Tinggi" },
      { kode: "work_life_balance", label: "Work-Life Balance", nilai: 74, kategori: "Tinggi" },
      { kode: "pengembangan_diri", label: "Pengembangan Diri", nilai: 82, kategori: "Sangat Tinggi" },
      { kode: "ekspektasi", label: "Ekspektasi Terpenuhi", nilai: 80, kategori: "Tinggi" },
    ],
  },
  bagian_cermin:
    "Rekan-rekan melihat Anda sebagai sosok yang mudah diajak berdiskusi dan konsisten hadir saat tim butuh bantuan teknis. Kehangatan ini jadi salah satu perekat suasana kerja di unit Anda.",
  bagian_refleksi:
    "Apa satu hal kecil yang bisa Anda lakukan bulan ini supaya ruang mencoba pendekatan teknis baru terasa lebih terbuka di tim Anda?",
  bagian_profil_organisasi: {
    narasi: "Sinergi tim jadi sisi yang paling terasa kuat menurut Arum, sementara manajemen keseharian dinilai paling biasa saja.",
    chart_data: [
      { kode: "karakter_lembaga", label: "Karakter Lembaga", nilai: 70, kategori: "Tinggi" },
      { kode: "kepemimpinan", label: "Kepemimpinan", nilai: 74, kategori: "Tinggi" },
      { kode: "management", label: "Manajemen", nilai: 62, kategori: "Sedang" },
      { kode: "sinergi", label: "Sinergi Tim", nilai: 81, kategori: "Sangat Tinggi" },
      { kode: "fokus", label: "Fokus Strategis", nilai: 68, kategori: "Sedang" },
      { kode: "performance", label: "Kinerja/Performa", nilai: 66, kategori: "Sedang" },
    ],
  },
  jawaban_survey: {
    gambaran_perusahaan: "tempat belajar yang ramai",
    betah: "Tim lapangan saya gampang diajak diskusi. Kalau ada masalah sumur, semua turun tangan tanpa saling menyalahkan.",
    hal_menguras_energi: "Rapat koordinasi yang berulang untuk hal yang sudah diputuskan minggu sebelumnya.",
    yang_ingin_diubah: "Saya ingin ada waktu resmi untuk mencoba pendekatan teknis baru, bukan cuma di sela pekerjaan rutin.",
  },
  lingkar_kontribusi: [
    {
      locus: "control",
      mengapa_fokus: "Ruang eksperimen yang Anda harapkan tidak harus menunggu kebijakan. Satu percobaan kecil di lingkup kerja sendiri sudah cukup untuk memulai.",
      langkah: [
        {
          judul: "Pilih satu masalah teknis yang berulang",
          instruksi: "Ambil yang paling sering muncul di dua bulan terakhir, bukan yang paling besar.",
          contoh: ["Prosedur pembacaan data sumur yang selalu molor", "Format laporan harian yang selalu direvisi"],
          tujuan: "Punya satu sasaran percobaan yang jelas dan kecil.",
        },
        {
          judul: "Rancang percobaan sepekan",
          instruksi: "Tulis apa yang diubah, apa yang diukur, dan kapan dievaluasi.",
          tujuan: "Percobaan bisa dinilai berhasil atau tidak, bukan sekadar terasa berbeda.",
        },
        {
          judul: "Ceritakan hasilnya ke tim",
          instruksi: "Sampaikan juga kalau hasilnya tidak sesuai harapan.",
          tujuan: "Membuat mencoba jadi hal yang wajar di tim, bukan risiko pribadi.",
        },
      ],
    },
    {
      locus: "influence",
      mengapa_fokus: "Kedekatan tim Anda sudah kuat, dan itu modal untuk mengajak rekan unit lain ikut mencoba.",
      langkah: [
        { judul: "Ajak satu rekan unit lain ikut percobaan", instruksi: "Pilih yang pekerjaannya bersinggungan langsung.", tujuan: "Percobaan tidak berhenti di satu unit." },
        { judul: "Bawa hasilnya ke forum bulanan", tujuan: "Pimpinan melihat buktinya, bukan cuma usulan." },
      ],
    },
    {
      locus: "system",
      mengapa_fokus: "Waktu khusus untuk uji coba dan jalur pengajuan ide yang ringkas adalah keputusan perusahaan, bukan satu orang.",
      langkah: [
        { judul: "Usulkan alokasi waktu uji coba rutin", instruksi: "Sertakan hasil percobaan Anda sendiri sebagai dasar.", tujuan: "Usulan berdiri di atas bukti, bukan asumsi." },
      ],
    },
  ],
  approved_at: "2026-07-28",
  rencana_aksi: [
    {
      id: "a1-adhokrasi",
      judul: "Ajukan satu ide teknis untuk diuji coba di forum tim.",
      alasan: "Harapan Anda pada ruang eksperimen 12 poin lebih tinggi dari kondisi sekarang. Memulai dari satu ide konkret lebih efektif daripada menunggu ruangnya dibuka lebih dulu.",
      terkait: "Inovasi",
      jangka: "Bulan ini",
      ikon: "💡",
    },
    {
      id: "a1-beban",
      judul: "Petakan ulang jadwal minggu tersibuk Anda.",
      alasan: "Work-life balance Anda 74%, dan paling terasa tertekan saat jadwal lapangan menumpuk. Memetakan lebih awal menjaga angka ini tidak turun.",
      terkait: "Work-Life Balance",
      jangka: "Minggu ini",
      ikon: "🗓️",
    },
    {
      id: "a1-mentor",
      judul: "Bagikan cara kerja Anda ke rekan yang lebih junior.",
      alasan: "Kenyamanan bekerja Anda sangat tinggi (88%). Kekuatan ini paling bernilai kalau ditularkan, bukan disimpan sendiri.",
      terkait: "Kenyamanan Bekerja",
      jangka: "3 bulan",
      ikon: "🤝",
    },
  ],
  footer: { disclaimer: DISCLAIMER_INDIVIDU },
};

/** Responden 2: gap besar Aturan tinggi vs harapan lebih kolaboratif, kesejahteraan sedang. Unit Keuangan & SDM Korporat. */
const RESPONDEN_2: LaporanIndividuCW = {
  meta: {
    responden_id: "cw-kry-002",
    nama_responden: "Bimo Prasetyo",
    jenis_kelamin: "Laki-laki",
    nama_perusahaan: ORGANISASI_NAMA,
    jabatan: "Staf Keuangan Korporat",
    unit: "Keuangan & SDM Korporat",
    organisasi_id: ORGANISASI_ID,
    periode_id: PERIODE,
  },
  header: {
    hook: "Anda merasakan perusahaan ini masih banyak diatur oleh prosedur dan persetujuan berlapis.",
    sub_hook: "Harapan Anda condong pada suasana kerja yang lebih dekat dan saling mendukung.",
  },
  bagian_budaya: {
    narasi:
      "Persepsi Anda menunjukkan budaya saat ini didominasi Aturan, banyak proses berjalan sesuai prosedur formal khas fungsi keuangan korporat. Namun harapan Anda bergeser cukup jauh ke arah Kekeluargaan, menandakan keinginan akan suasana kerja yang lebih personal dan fleksibel.",
    chart_data: [
      { tipe: "Kekeluargaan", saat_ini: 32, harapan: 60 },
      { tipe: "Inovasi", saat_ini: 28, harapan: 35 },
      { tipe: "Orientasi", saat_ini: 38, harapan: 32 },
      { tipe: "Aturan", saat_ini: 71, harapan: 48 },
    ],
    tabel_gap: [
      { label: "Kekeluargaan", arah: "naik", nilai_gap: 28 },
      { label: "Inovasi", arah: "naik", nilai_gap: 7 },
      { label: "Orientasi", arah: "turun", nilai_gap: -6 },
      { label: "Aturan", arah: "turun", nilai_gap: -23 },
    ],
  },
  bagian_kesejahteraan: {
    narasi:
      "Kondisi kesejahteraan Anda berada di kategori Sedang. Kepuasan pada kepemimpinan jadi subdimensi yang paling perlu diperhatikan, sementara ekspektasi terpenuhi masih relatif terjaga.",
    indeks: 58,
    kategori: "Sedang",
    chart_data: [
      { kode: "kepuasan_kepemimpinan", label: "Kepuasan pada Kepemimpinan", nilai: 39, kategori: "Rendah" },
      { kode: "kenyamanan_bekerja", label: "Kenyamanan Bekerja", nilai: 61, kategori: "Sedang" },
      { kode: "work_life_balance", label: "Work-Life Balance", nilai: 52, kategori: "Sedang" },
      { kode: "pengembangan_diri", label: "Pengembangan Diri", nilai: 55, kategori: "Sedang" },
      { kode: "ekspektasi", label: "Ekspektasi Terpenuhi", nilai: 68, kategori: "Sedang" },
    ],
  },
  bagian_cermin:
    "Rekan kerja menilai Anda sebagai orang yang teliti dan bisa diandalkan untuk urusan administratif dan pelaporan, meski beberapa menyebut Anda jarang berbagi cerita di luar urusan pekerjaan.",
  bagian_refleksi:
    "Prosedur mana yang menurut Anda sudah tidak perlu terlalu berlapis, dan siapa satu rekan kerja yang bisa Anda ajak bicara lebih terbuka minggu ini?",
  bagian_profil_organisasi: {
    narasi: "Bimo menilai sisi aturan dan prosedur paling menonjol, sementara sinergi antar unit paling terasa kurang.",
    chart_data: [
      { kode: "karakter_lembaga", label: "Karakter Lembaga", nilai: 54, kategori: "Sedang" },
      { kode: "kepemimpinan", label: "Kepemimpinan", nilai: 58, kategori: "Sedang" },
      { kode: "management", label: "Manajemen", nilai: 49, kategori: "Rendah" },
      { kode: "sinergi", label: "Sinergi Tim", nilai: 45, kategori: "Rendah" },
      { kode: "fokus", label: "Fokus Strategis", nilai: 57, kategori: "Sedang" },
      { kode: "performance", label: "Kinerja/Performa", nilai: 60, kategori: "Sedang" },
    ],
  },
  jawaban_survey: {
    gambaran_perusahaan: "rapi tapi berjarak",
    betah: "Pekerjaan saya jelas ukurannya. Saya tahu apa yang harus selesai dan kapan.",
    hal_menguras_energi: "Menunggu tanda tangan untuk hal kecil, kadang sampai tiga lapis untuk nominal yang tidak seberapa.",
    yang_ingin_diubah: "Alur persetujuan disederhanakan untuk hal yang risikonya kecil.",
  },
  lingkar_kontribusi: [
    {
      locus: "control",
      mengapa_fokus: "Kedekatan dengan rekan kerja adalah hal yang paling Anda harapkan naik, dan itu tumbuh dari percakapan kecil yang bisa Anda mulai sendiri.",
      langkah: [
        { judul: "Ajak satu rekan bicara di luar urusan pekerjaan", instruksi: "Cukup sekali sepekan, tidak perlu acara khusus.", tujuan: "Membuka jalur bicara yang selama ini cuma soal berkas." },
        { judul: "Catat tiga langkah persetujuan yang paling memakan waktu", instruksi: "Tulis durasi nyatanya, bukan perkiraan.", tujuan: "Punya bahan konkret saat usulan penyederhanaan dibahas." },
      ],
    },
    {
      locus: "influence",
      mengapa_fokus: "Atasan langsung Anda yang paling mungkin menggabungkan atau mendelegasikan langkah persetujuan yang berulang.",
      langkah: [
        { judul: "Bawa catatan durasi itu ke pertemuan satu lawan satu", tujuan: "Pembicaraan soal beban jadi berbasis data, bukan keluhan." },
      ],
    },
    {
      locus: "system",
      mengapa_fokus: "Perubahan ambang persetujuan menyentuh kebijakan keuangan perusahaan, jadi harus lewat ruang keputusan resmi.",
      langkah: [
        { judul: "Usulkan uji coba pada satu jenis pengajuan", instruksi: "Pilih yang nominalnya kecil dan risikonya rendah.", tujuan: "Perubahan bisa diuji tanpa mengendurkan kontrol yang penting." },
      ],
    },
  ],
  approved_at: "2026-07-28",
  rencana_aksi: [
    {
      id: "a2-klan",
      judul: "Jadwalkan satu obrolan santai dengan rekan di luar urusan pekerjaan.",
      alasan: "Selisih terbesar Anda ada di sisi kekeluargaan (28 poin). Kedekatan biasanya tumbuh dari percakapan kecil yang berulang, bukan dari acara besar sekali setahun.",
      terkait: "Kekeluargaan",
      jangka: "Minggu ini",
      ikon: "☕",
    },
    {
      id: "a2-beban",
      judul: "Catat tiga tugas yang paling menyita waktu, lalu bicarakan dengan atasan.",
      alasan: "Work-life balance Anda 52% dan kepuasan pada kepemimpinan 39%, dua angka terendah Anda. Data tertulis membuat pembicaraan soal beban lebih mudah ditindaklanjuti.",
      terkait: "Work-Life Balance",
      jangka: "2 minggu",
      ikon: "📋",
    },
    {
      id: "a2-prosedur",
      judul: "Usulkan satu langkah persetujuan yang bisa disederhanakan.",
      alasan: "Anda merasakan prosedur berlapis paling kuat di antara semua tipe budaya (71%). Usulan spesifik dari orang yang menjalankannya biasanya paling didengar.",
      terkait: "Aturan",
      jangka: "1 bulan",
      ikon: "✂️",
    },
  ],
  footer: { disclaimer: DISCLAIMER_INDIVIDU },
};

/** Responden 3: budaya Orientasi/target produksi dominan, kesejahteraan paling perlu perhatian. Unit Teknik & Rekayasa. */
const RESPONDEN_3: LaporanIndividuCW = {
  meta: {
    responden_id: "cw-kry-003",
    nama_responden: "Citra Wulandari",
    jenis_kelamin: "Perempuan",
    nama_perusahaan: ORGANISASI_NAMA,
    jabatan: "Engineer Proyek Produksi",
    unit: "Teknik & Rekayasa",
    organisasi_id: ORGANISASI_ID,
    periode_id: PERIODE,
  },
  header: {
    hook: "Anda merasakan tekanan pencapaian target produksi menjadi warna utama keseharian kerja.",
    sub_hook: "Anda berharap ada ruang lebih besar untuk saling mendukung, bukan sekadar mengejar angka.",
  },
  bagian_budaya: {
    narasi:
      "Budaya yang Anda rasakan saat ini paling menonjol di sisi Orientasi, dengan penekanan pada pencapaian target produksi dan hasil terukur. Harapan Anda relatif merata di semua tipe, dengan kenaikan paling terasa pada Kekeluargaan.",
    chart_data: [
      { tipe: "Kekeluargaan", saat_ini: 30, harapan: 52 },
      { tipe: "Inovasi", saat_ini: 40, harapan: 48 },
      { tipe: "Orientasi", saat_ini: 74, harapan: 58 },
      { tipe: "Aturan", saat_ini: 45, harapan: 40 },
    ],
    tabel_gap: [
      { label: "Kekeluargaan", arah: "naik", nilai_gap: 22 },
      { label: "Inovasi", arah: "naik", nilai_gap: 8 },
      { label: "Orientasi", arah: "turun", nilai_gap: -16 },
      { label: "Aturan", arah: "turun", nilai_gap: -5 },
    ],
  },
  bagian_kesejahteraan: {
    narasi:
      "Indeks kesejahteraan Anda berada di kategori Rendah, terutama ditekan kepuasan pada kepemimpinan dan work-life balance yang jadi dua subdimensi terlemah. Ini pola yang perlu jadi perhatian bersama, bukan cuma catatan pribadi.",
    indeks: 44,
    kategori: "Rendah",
    chart_data: [
      { kode: "kepuasan_kepemimpinan", label: "Kepuasan pada Kepemimpinan", nilai: 28, kategori: "Sangat Rendah" },
      { kode: "kenyamanan_bekerja", label: "Kenyamanan Bekerja", nilai: 50, kategori: "Sedang" },
      { kode: "work_life_balance", label: "Work-Life Balance", nilai: 33, kategori: "Rendah" },
      { kode: "pengembangan_diri", label: "Pengembangan Diri", nilai: 58, kategori: "Sedang" },
      { kode: "ekspektasi", label: "Ekspektasi Terpenuhi", nilai: 51, kategori: "Sedang" },
    ],
  },
  bagian_cermin:
    "Rekan kerja mengagumi dedikasi Anda mengejar target proyek tim, namun beberapa juga khawatir Anda jarang terlihat benar-benar berhenti sejenak di sela jam kerja.",
  bagian_refleksi:
    "Kalau boleh menunda satu target minggu ini demi waktu istirahat yang cukup, target mana yang akan Anda pilih?",
  bagian_profil_organisasi: {
    narasi: "Citra melihat orientasi kinerja paling menonjol, sementara sisi kepemimpinan dan sinergi terasa paling perlu perhatian.",
    chart_data: [
      { kode: "karakter_lembaga", label: "Karakter Lembaga", nilai: 52, kategori: "Sedang" },
      { kode: "kepemimpinan", label: "Kepemimpinan", nilai: 46, kategori: "Rendah" },
      { kode: "management", label: "Manajemen", nilai: 50, kategori: "Sedang" },
      { kode: "sinergi", label: "Sinergi Tim", nilai: 44, kategori: "Rendah" },
      { kode: "fokus", label: "Fokus Strategis", nilai: 63, kategori: "Sedang" },
      { kode: "performance", label: "Kinerja/Performa", nilai: 72, kategori: "Tinggi" },
    ],
  },
  jawaban_survey: {
    gambaran_perusahaan: "kejar target terus",
    betah: "Saya suka pekerjaan proyeknya. Hasilnya kelihatan dan bisa saya ukur sendiri.",
    hal_menguras_energi: "Linimasa proyek yang bertabrakan, lalu semuanya jadi mendesak di minggu yang sama.",
    yang_ingin_diubah: "Beban proyek dibagi lebih merata, dan ada ruang berhenti sejenak tanpa merasa bersalah.",
  },
  lingkar_kontribusi: [
    {
      locus: "control",
      mengapa_fokus: "Work-life balance Anda rendah dan beban kerja terasa berat. Batas yang Anda tetapkan sendiri adalah hal pertama yang bisa berubah minggu ini.",
      langkah: [
        { judul: "Tetapkan satu jam berhenti kerja", instruksi: "Pilih jam yang realistis, lalu patuhi dua pekan berturut-turut.", tujuan: "Memulihkan jeda tanpa menunggu beban turun lebih dulu." },
        { judul: "Sisipkan jeda 15 menit tanpa layar", instruksi: "Taruh di tengah hari, bukan di ujung.", tujuan: "Menjaga fokus tetap tajam sampai sore." },
        { judul: "Tulis tiga tugas yang paling menyita waktu", tujuan: "Punya bahan konkret saat bicara soal beban dengan atasan." },
      ],
    },
    {
      locus: "influence",
      mengapa_fokus: "Rekan satu tim Anda punya kapasitas membantu, tapi permintaan yang umum jarang ditindaklanjuti.",
      langkah: [
        { judul: "Minta bantuan yang spesifik ke satu rekan", instruksi: "Sebut tugasnya, tenggatnya, dan bagian mana yang dibantu.", tujuan: "Permintaan lebih mudah dipenuhi daripada keluhan umum." },
        { judul: "Bicarakan linimasa yang bertabrakan dengan atasan", tujuan: "Menggeser jadwal lebih murah daripada menambah jam kerja." },
      ],
    },
    {
      locus: "system",
      mengapa_fokus: "Penjadwalan ulang proyek lintas unit dan penambahan kapasitas tim adalah keputusan perusahaan, bukan beban Anda sendiri.",
      langkah: [
        { judul: "Sampaikan pola beban puncak ke pimpinan unit", instruksi: "Gunakan catatan tugas Anda sebagai contoh nyata.", tujuan: "Pola beban terlihat sebagai masalah penjadwalan, bukan masalah orang." },
      ],
    },
  ],
  approved_at: "2026-07-28",
  rencana_aksi: [
    {
      id: "a3-bicara",
      judul: "Bicarakan beban kerja Anda dengan atasan langsung minggu ini.",
      alasan: "Kepuasan pada kepemimpinan Anda 28% (Sangat Rendah) dan work-life balance 33%. Dua angka ini bersamaan adalah sinyal kelelahan kerja yang sebaiknya tidak ditunda.",
      terkait: "Work-Life Balance",
      jangka: "Minggu ini",
      ikon: "🗣️",
    },
    {
      id: "a3-batas",
      judul: "Tetapkan satu batas waktu berhenti kerja, lalu patuhi selama dua minggu.",
      alasan: "Work-life balance Anda 33% (Rendah). Batas yang jelas dan konsisten lebih membantu daripada niat mengurangi jam kerja secara umum.",
      terkait: "Work-Life Balance",
      jangka: "2 minggu",
      ikon: "⏰",
    },
    {
      id: "a3-dukungan",
      judul: "Minta bantuan konkret ke satu rekan untuk tugas yang menumpuk.",
      alasan: "Kenyamanan bekerja Anda di 50% (Sedang), masih ada ruang untuk dimanfaatkan. Permintaan yang spesifik lebih mudah dipenuhi daripada keluhan umum.",
      terkait: "Kenyamanan Bekerja",
      jangka: "Minggu ini",
      ikon: "🤝",
    },
    {
      id: "a3-jeda",
      judul: "Sisipkan jeda 15 menit tanpa layar di tengah hari kerja.",
      alasan: "Rekan kerja menyebut Anda jarang terlihat benar-benar berhenti. Jeda pendek yang rutin memulihkan fokus lebih baik daripada istirahat panjang sesekali.",
      terkait: "Ekspektasi Terpenuhi",
      jangka: "Mulai hari ini",
      ikon: "🌿",
    },
  ],
  footer: { disclaimer: DISCLAIMER_INDIVIDU },
};

export const MOCK_LAPORAN_INDIVIDU_CW: LaporanIndividuCW[] = [RESPONDEN_1, RESPONDEN_2, RESPONDEN_3];

/**
 * Data dummy laporan agregat/pimpinan, satu organisasi satu periode. Angka dibuat masuk akal
 * berdampingan dengan 3 responden di atas (indeks agregat 60, di antara 78/58/44), TAPI tidak
 * dihitung otomatis dari mereka -- ini dummy independen, bukan agregasi nyata.
 *
 * chart_data dan tabel_gap sengaja dijaga konsisten: selisih harapan - saat_ini tiap tipe sama
 * persis dengan nilai_gap, dan Kekeluargaan dibuat tertinggi supaya cocok dengan narasi maupun stat tile
 * "Budaya Dominan" yang menghitung argmax saat_ini. Empat unit dipilih merepresentasikan
 * struktur umum perusahaan hulu migas: Eksplorasi & Produksi (operasi inti lapangan), Teknik &
 * Rekayasa (proyek/konstruksi), HSSE (Health, Safety, Security & Environment -- fungsi wajib di
 * industri migas), dan Keuangan & SDM Korporat.
 */
export const MOCK_LAPORAN_AGREGAT_CW: LaporanAgregatCW = {
  meta: {
    organisasi_id: ORGANISASI_ID,
    organisasi_nama: ORGANISASI_NAMA,
    periode_id: PERIODE,
    jumlah_responden: 142,
  },
  header: {
    hook: "Budaya kerja perusahaan Anda condong kolaboratif, tapi kesejahteraan tim Teknik & Rekayasa perlu perhatian.",
    sub_hook: "Ringkasan dari 142 karyawan lintas empat unit pada periode ini.",
  },
  bagian_budaya: {
    narasi:
      "Secara umum karyawan merasakan budaya Kekeluargaan paling kuat, dengan harapan yang juga bergerak ke arah sana -- artinya arah yang diinginkan karyawan sudah sejalan dengan kondisi saat ini. Gap terbesar ada pada Inovasi: karyawan berharap ruang bereksperimen dan mencoba pendekatan teknis baru lebih terbuka dari kondisi sekarang.",
    chart_data: [
      {
        tipe: "Kekeluargaan", saat_ini: 58, harapan: 67, status: "Cukup selaras",
        interpretation: "Kedekatan antar rekan sudah jadi kekuatan, karyawan ingin ini sedikit lebih terasa lagi di tingkat lintas unit.",
        focus: "Rawat kedekatan yang sudah ada, perluas ke lintas unit yang jarang bersinggungan.",
        priorityActions: [
          "Jadwalkan forum lintas unit rutin, bukan insidental.",
          "Beri ruang mentoring senior ke junior di luar jalur struktural.",
        ],
        phases: [
          { aksi: "Petakan unit yang paling jarang bersinggungan dalam pekerjaan harian.", waktu: "Bulan ini" },
          { aksi: "Jalankan satu forum lintas unit sebagai uji coba.", waktu: "30 hari" },
          { aksi: "Tanyakan balik ke peserta apa yang layak dilanjutkan.", waktu: "60 hari" },
        ],
        indicators: [
          { title: "Forum berjalan rutin", detail: "Minimal satu forum lintas unit terlaksana tiap bulan selama satu kuartal." },
          { title: "Peserta lintas unit", detail: "Peserta datang dari sedikitnya tiga unit berbeda." },
        ],
        warnings: ["Jangan sampai forum berubah jadi rapat kerja biasa, tujuannya membangun kedekatan, bukan menambah agenda."],
      },
      {
        tipe: "Inovasi", saat_ini: 41, harapan: 55, status: "Perlu perhatian",
        interpretation: "Selisih terbesar ada di sini. Karyawan merasa ruang mencoba pendekatan teknis baru masih sempit.",
        focus: "Buka ruang eksperimen yang terjadwal, bukan menunggu momentum.",
        priorityActions: [
          "Alokasikan waktu rutin khusus uji coba ide baru.",
          "Sederhanakan jalur pengajuan ide sampai maksimal satu halaman.",
        ],
        phases: [
          { aksi: "Tetapkan satu hari per bulan sebagai waktu uji coba ide.", waktu: "Bulan ini" },
          { aksi: "Buka kanal pengajuan ide yang bisa diisi tanpa persetujuan berlapis.", waktu: "30 hari" },
          { aksi: "Umumkan terbuka ide yang dicoba, termasuk yang gagal.", waktu: "90 hari" },
        ],
        indicators: [
          { title: "Ide masuk", detail: "Minimal sepuluh ide diajukan lewat kanal baru dalam satu kuartal." },
          { title: "Ide diuji", detail: "Sedikitnya tiga ide benar-benar dijalankan sebagai uji coba." },
        ],
        warnings: ["Kalau cuma ide yang berhasil yang diapresiasi, karyawan akan berhenti mengajukan yang berisiko."],
      },
      {
        tipe: "Orientasi", saat_ini: 46, harapan: 42, status: "Selaras",
        interpretation: "Orientasi hasil dirasa sudah pas, karyawan tidak meminta tekanan target ditambah.",
        focus: "Pertahankan cara kerja yang ada, pantau supaya tidak menguat sendiri saat beban naik.",
        priorityActions: ["Jaga ritme target yang sekarang, tinjau ulang kalau beban kerja naik."],
        phases: [
          { aksi: "Tinjau beban target tiap akhir kuartal bersama pimpinan unit.", waktu: "Tiap kuartal" },
        ],
        indicators: [
          { title: "Target stabil", detail: "Tidak ada kenaikan target sepihak tanpa pembicaraan dengan unit." },
        ],
        warnings: ["Tekanan target biasanya naik diam-diam saat ada proyek besar, itu titik yang perlu dipantau."],
      },
      {
        tipe: "Aturan", saat_ini: 55, harapan: 47, status: "Cukup selaras",
        interpretation: "Prosedur dirasa agak berlapis. Karyawan berharap alurnya lebih ringkas tanpa mengurangi kepatuhan.",
        focus: "Sederhanakan alur persetujuan yang tidak menyangkut keselamatan.",
        priorityActions: [
          "Petakan langkah persetujuan yang bisa digabung atau didelegasikan.",
          "Uji coba alur ringkas di satu jenis izin dulu.",
        ],
        phases: [
          { aksi: "Petakan alur persetujuan yang berjalan sekarang, tandai yang berulang.", waktu: "Bulan ini" },
          { aksi: "Uji alur yang disederhanakan pada satu jenis izin kerja.", waktu: "60 hari" },
        ],
        indicators: [
          { title: "Waktu tunggu turun", detail: "Rata-rata waktu persetujuan izin uji coba turun dibanding kuartal sebelumnya." },
        ],
        warnings: ["Penyederhanaan tidak boleh menyentuh persetujuan yang menyangkut keselamatan kerja."],
      },
    ],
    tabel_gap: [
      { label: "Kekeluargaan", arah: "naik", nilai_gap: 9 },
      { label: "Inovasi", arah: "naik", nilai_gap: 14 },
      { label: "Orientasi", arah: "turun", nilai_gap: -4 },
      { label: "Aturan", arah: "turun", nilai_gap: -8 },
    ],
  },
  bagian_kesejahteraan: {
    narasi:
      "Indeks kesejahteraan gabungan berada di kategori Sedang. Kenyamanan bekerja jadi subdimensi terkuat, sementara work-life balance jadi titik yang paling perlu diperhatikan perusahaan secara keseluruhan.",
    indeks: 60,
    kategori: "Sedang",
    chart_data: [
      {
        kode: "kepuasan_kepemimpinan", label: "Kepuasan pada Kepemimpinan", nilai: 61, kategori: "Sedang",
        items: [
          { label: "Puas dengan cara pimpinan menjalankan tugas", nilai: 3.1 },
          { label: "Percaya pada keputusan pimpinan", nilai: 3.0 },
          { label: "Informasi penting disampaikan terbuka", nilai: 2.7 },
        ],
        focus: "Buka jalur informasi keputusan, titik paling lemah di aspek ini.",
        priorityActions: ["Sampaikan alasan di balik keputusan besar, bukan cuma hasilnya."],
        phases: [
          { aksi: "Audit beban kerja aktual dibanding kapasitas tiap unit.", waktu: "2 minggu" },
          { aksi: "Tinjau ulang linimasa proyek yang paling menekan.", waktu: "30 hari" },
          { aksi: "Buka sesi dengar pendapat sebelum menetapkan solusi.", waktu: "45 hari" },
        ],
        indicators: [
          { title: "Lembur turun", detail: "Rata-rata jam lembur unit paling tertekan turun dibanding bulan sebelumnya." },
          { title: "Beban terpetakan", detail: "Seluruh unit punya peta beban dibanding kapasitas yang tertulis." },
        ],
        warnings: ["Menambah orang tanpa membenahi linimasa biasanya cuma memindahkan beban, bukan menguranginya."],
      },
      {
        kode: "kenyamanan_bekerja", label: "Kenyamanan Bekerja", nilai: 76, kategori: "Tinggi",
        items: [
          { label: "Nyaman bekerja sama dengan rekan", nilai: 3.9 },
          { label: "Terbiasa berbagi ide antar tim", nilai: 3.6 },
        ],
        focus: "Rawat kekuatan ini, jadikan penopang saat beban kerja sedang tinggi.",
        priorityActions: ["Perkuat kebiasaan saling bantu lintas unit."],
        phases: [{ aksi: "Beri pengakuan terbuka untuk tim yang saling menopang saat beban puncak.", waktu: "Tiap bulan" }],
        indicators: [{ title: "Skor bertahan", detail: "Skor dukungan rekan kerja tidak turun pada periode berikutnya." }],
        warnings: ["Kekuatan ini paling cepat tergerus kalau beban kerja dibiarkan tinggi terus."],
      },
      {
        kode: "work_life_balance", label: "Work-Life Balance", nilai: 53, kategori: "Sedang",
        items: [
          { label: "Bisa menjaga keseimbangan kerja dan kehidupan pribadi", nilai: 2.8 },
          { label: "Beban dan jam kerja masih wajar", nilai: 2.5 },
        ],
        focus: "Tegakkan batas jam kerja, terutama pada unit dengan jadwal lapangan padat.",
        priorityActions: ["Sepakati batas komunikasi kerja di luar jam kerja."],
        phases: [
          { aksi: "Sepakati aturan komunikasi kerja di luar jam kerja per unit.", waktu: "30 hari" },
          { aksi: "Evaluasi kepatuhannya bersama pimpinan unit.", waktu: "90 hari" },
        ],
        indicators: [{ title: "Aturan berjalan", detail: "Tiap unit punya kesepakatan tertulis dan dipakai." }],
        warnings: ["Aturan yang dilanggar duluan oleh pimpinan tidak akan diikuti siapa pun."],
      },
      {
        kode: "pengembangan_diri", label: "Pengembangan Diri", nilai: 65, kategori: "Sedang",
        items: [
          { label: "Diberi kesempatan belajar dan menambah kemampuan", nilai: 3.4 },
          { label: "Ada peluang berkembang dalam karier", nilai: 3.0 },
        ],
        focus: "Perjelas jalur karier, bagian yang paling kabur menurut karyawan.",
        priorityActions: ["Terbitkan peta jalur karier per rumpun jabatan."],
        phases: [
          { aksi: "Susun peta jalur karier untuk tiga rumpun jabatan terbesar.", waktu: "60 hari" },
          { aksi: "Bahas peta itu dalam pertemuan satu lawan satu.", waktu: "90 hari" },
        ],
        indicators: [{ title: "Peta tersedia", detail: "Tiga rumpun jabatan terbesar punya peta jalur karier tertulis." }],
        warnings: ["Peta karier tanpa pembicaraan langsung berhenti jadi dokumen yang tidak dibaca."],
      },
      {
        kode: "ekspektasi", label: "Ekspektasi Terpenuhi", nilai: 66, kategori: "Sedang",
        items: [
          { label: "Kerja keras dihargai secara wajar", nilai: 3.1 },
          { label: "Tugas sesuai kemampuan", nilai: 3.6 },
          { label: "Puas dan bangga bekerja di sini", nilai: 3.4 },
        ],
        focus: "Perkuat pengakuan atas kontribusi, titik terlemah di aspek ini.",
        priorityActions: ["Buat kebiasaan pengakuan yang spesifik, bukan seremonial."],
        phases: [{ aksi: "Sisipkan pengakuan kontribusi konkret di forum bulanan tiap unit.", waktu: "Tiap bulan" }],
        indicators: [{ title: "Pengakuan rutin", detail: "Setiap unit menyebut kontribusi konkret minimal sekali per bulan." }],
        warnings: ["Pengakuan yang berputar di orang yang sama akan terbaca sebagai formalitas."],
      },
    ],
  },
  /**
   * Enam dimensi profil organisasi, rata-rata lintas keempat tipe budaya. Angka rekaan, dijaga
   * masuk akal berdampingan dengan skor budaya di atas (sinergi paling tinggi karena Kekeluargaan
   * dominan, manajemen paling rendah karena prosedur dirasa berlapis).
   */
  bagian_profil_organisasi: {
    narasi:
      "Sinergi antar tim jadi dimensi terkuat, sejalan dengan budaya Kekeluargaan yang paling terasa. Manajemen jadi dimensi terlemah: karyawan menilai pengelolaan kerja harian masih banyak bersandar pada prosedur, bukan pada kesepakatan tim.",
    chart_data: [
      { kode: "karakter_lembaga", label: "Karakter Lembaga", nilai: 62, kategori: "Sedang" },
      { kode: "kepemimpinan", label: "Kepemimpinan", nilai: 68, kategori: "Sedang" },
      { kode: "management", label: "Manajemen", nilai: 57, kategori: "Sedang" },
      { kode: "sinergi", label: "Sinergi Tim", nilai: 71, kategori: "Tinggi" },
      { kode: "fokus", label: "Fokus Strategis", nilai: 64, kategori: "Sedang" },
      { kode: "performance", label: "Kinerja/Performa", nilai: 59, kategori: "Sedang" },
    ],
  },

  /**
   * Rata-rata item mentah gambaran_<dimensi>_<tipe>, skala 1-5. Satu sumber dipakai dua kali:
   * dikelompokkan per tipe budaya di section 01-D, per dimensi organisasi di 03-B. Angka rekaan.
   * label_item mengikuti bentuk berkas asli: tiap pasangan dimensi x tipe punya redaksi butir
   * sendiri, bukan empat kalimat yang sama diulang enam kali. Teksnya rekaan juga, sengaja
   * dibuat sepanjang dan sebentuk redaksi berkas klien supaya lebar kartu di preview ikut teruji.
   */
  analisis: {
    heatmap: [
      { dimensi: "Karakter Lembaga", tipe: "Kekeluargaan", nilai_mentah: 3.4, label_item: "Seperti keluarga" },
      { dimensi: "Karakter Lembaga", tipe: "Inovasi", nilai_mentah: 2.3, label_item: "Terbuka hal baru" },
      { dimensi: "Karakter Lembaga", tipe: "Orientasi", nilai_mentah: 2.7, label_item: "Fokus pada hasil" },
      { dimensi: "Karakter Lembaga", tipe: "Aturan", nilai_mentah: 3.1, label_item: "Berjalan dengan aturan" },
      { dimensi: "Kepemimpinan", tipe: "Kekeluargaan", nilai_mentah: 3.6, label_item: "Pimpinan seperti pembimbing" },
      { dimensi: "Kepemimpinan", tipe: "Inovasi", nilai_mentah: 2.5, label_item: "Pimpinan menyambut ide baru" },
      { dimensi: "Kepemimpinan", tipe: "Orientasi", nilai_mentah: 2.9, label_item: "Pimpinan menekankan pencapaian" },
      { dimensi: "Kepemimpinan", tipe: "Aturan", nilai_mentah: 3.3, label_item: "Pimpinan menjaga keteraturan" },
      { dimensi: "Manajemen", tipe: "Kekeluargaan", nilai_mentah: 2.9, label_item: "Mengutamakan kerjasama tim" },
      { dimensi: "Manajemen", tipe: "Inovasi", nilai_mentah: 2.1, label_item: "Memberi ruang inisiatif" },
      { dimensi: "Manajemen", tipe: "Orientasi", nilai_mentah: 2.6, label_item: "Menuntut target terukur" },
      { dimensi: "Manajemen", tipe: "Aturan", nilai_mentah: 3.5, label_item: "Menekankan aturan kerja" },
      { dimensi: "Sinergi Tim", tipe: "Kekeluargaan", nilai_mentah: 3.8, label_item: "Saling percaya" },
      { dimensi: "Sinergi Tim", tipe: "Inovasi", nilai_mentah: 2.6, label_item: "Semangat berkembang" },
      { dimensi: "Sinergi Tim", tipe: "Orientasi", nilai_mentah: 2.8, label_item: "Komitmen target" },
      { dimensi: "Sinergi Tim", tipe: "Aturan", nilai_mentah: 3.0, label_item: "Membuat tertib" },
      { dimensi: "Fokus Strategis", tipe: "Kekeluargaan", nilai_mentah: 3.1, label_item: "Suasana kerja sehat" },
      { dimensi: "Fokus Strategis", tipe: "Inovasi", nilai_mentah: 2.4, label_item: "Pembaruan tuntutan zaman" },
      { dimensi: "Fokus Strategis", tipe: "Orientasi", nilai_mentah: 3.2, label_item: "Capaian unggul" },
      { dimensi: "Fokus Strategis", tipe: "Aturan", nilai_mentah: 2.9, label_item: "Kelancaran operasional" },
      { dimensi: "Kinerja/Performa", tipe: "Kekeluargaan", nilai_mentah: 3.0, label_item: "Staf berkembang" },
      { dimensi: "Kinerja/Performa", tipe: "Inovasi", nilai_mentah: 2.2, label_item: "Lahirnya program baru" },
      { dimensi: "Kinerja/Performa", tipe: "Orientasi", nilai_mentah: 3.4, label_item: "Mutu hasil kerja" },
      { dimensi: "Kinerja/Performa", tipe: "Aturan", nilai_mentah: 2.8, label_item: "Efisiensi biaya" },
    ],
  },

  /**
   * Word cloud tiga kolom dari jawaban esai karyawan, sudah disintesis jadi frasa pendek. BUKAN
   * kutipan asli: frasa unik satu orang bisa dilacak balik ke orangnya. Angka mention rekaan.
   */
  cerita_karyawan: {
    gambaran_perusahaan: [
      { frasa: "kekeluargaan", jumlah_mention: 34 },
      { frasa: "prosedur ketat", jumlah_mention: 27 },
      { frasa: "kerja tim solid", jumlah_mention: 22 },
      { frasa: "banyak persetujuan", jumlah_mention: 18 },
      { frasa: "aman dan stabil", jumlah_mention: 15 },
      { frasa: "kurang ruang ide", jumlah_mention: 12 },
    ],
    saat_ini: [
      { frasa: "rapat menumpuk", jumlah_mention: 29 },
      { frasa: "saling bantu", jumlah_mention: 24 },
      { frasa: "lembur musiman", jumlah_mention: 21 },
      { frasa: "koordinasi lintas unit lambat", jumlah_mention: 16 },
      { frasa: "target berubah mendadak", jumlah_mention: 11 },
    ],
    ingin_diubah: [
      { frasa: "alur persetujuan diringkas", jumlah_mention: 31 },
      { frasa: "beban kerja lebih merata", jumlah_mention: 26 },
      { frasa: "ruang uji coba ide", jumlah_mention: 23 },
      { frasa: "jalur karier lebih jelas", jumlah_mention: 17 },
      { frasa: "komunikasi pimpinan lebih terbuka", jumlah_mention: 14 },
    ],
  },

  /** Tema hasil sintesis jawaban esai, dipakai section 02-C. Rekaan, bukan kutipan karyawan. */
  tema_esai: [
    {
      tema: "Beban kerja menumpuk di unit proyek",
      ringkasan:
        "Karyawan di unit proyek menyebut beban naik tajam saat linimasa proyek bertabrakan, dan pemulihannya bergantung pada inisiatif rekan satu tim, bukan pada penjadwalan ulang.",
      jumlah_mention: 38,
    },
    {
      tema: "Persetujuan berlapis memperlambat pekerjaan harian",
      ringkasan:
        "Banyak jawaban menyinggung langkah persetujuan yang berulang untuk keputusan bernilai kecil, sementara persetujuan yang benar-benar berisiko justru dirasa sudah tepat.",
      jumlah_mention: 31,
    },
    {
      tema: "Dukungan rekan kerja jadi penahan utama",
      ringkasan:
        "Rasa saling bantu antar rekan disebut sebagai alasan bertahan, terutama pada periode beban puncak. Ini kekuatan yang muncul berulang di hampir semua unit.",
      jumlah_mention: 27,
    },
    {
      tema: "Jalur karier belum terbaca jelas",
      ringkasan:
        "Karyawan menengah menyebut belum jelasnya syarat naik jenjang, sehingga pengembangan diri terasa bergantung pada penilaian atasan langsung.",
      jumlah_mention: 19,
    },
  ],

  perbandingan_antarunit: {
    narasi:
      "Kesejahteraan paling tinggi dirasakan unit Eksplorasi & Produksi, menurun bertahap ke Teknik & Rekayasa. Budaya Kekeluargaan mendominasi persepsi di Eksplorasi & Produksi dan Keuangan & SDM Korporat, HSSE condong ke budaya Aturan yang wajar mengingat fungsinya seputar kepatuhan prosedur keselamatan, sementara Teknik & Rekayasa condong ke budaya Orientasi yang berorientasi pencapaian target proyek.",
    rows: [
      { unit: "Eksplorasi & Produksi", jumlah_responden: 52, budaya_dominan: "Kekeluargaan", indeks_kesejahteraan: 74, kategori_kesejahteraan: "Tinggi" },
      { unit: "Keuangan & SDM Korporat", jumlah_responden: 28, budaya_dominan: "Kekeluargaan", indeks_kesejahteraan: 66, kategori_kesejahteraan: "Sedang" },
      { unit: "HSSE", jumlah_responden: 28, budaya_dominan: "Aturan", indeks_kesejahteraan: 58, kategori_kesejahteraan: "Sedang" },
      { unit: "Teknik & Rekayasa", jumlah_responden: 34, budaya_dominan: "Orientasi", indeks_kesejahteraan: 46, kategori_kesejahteraan: "Rendah" },
    ],
  },
  prioritas_perbaikan: [
    {
      peringkat: 1,
      action: "Tinjau ulang beban kerja dan target proyek tim Teknik & Rekayasa.",
      trigger_desc: "Indeks kesejahteraan unit ini paling rendah (46, kategori Rendah), ditekan subdimensi Work-Life Balance.",
      area: "Work-Life Balance · Teknik & Rekayasa",
      langkah: [
        "Audit beban kerja aktual vs kapasitas tim dalam 2 minggu ke depan.",
        "Evaluasi ulang linimasa proyek yang paling menekan, mana yang bisa direalokasi.",
        "Buka sesi dengar pendapat langsung dengan tim sebelum menetapkan solusi.",
      ],
      dampak: "Menurunkan risiko kelelahan kerja dan menjaga kualitas keselamatan proyek jangka panjang.",
    },
    {
      peringkat: 2,
      action: "Buka ruang eksperimen dan uji coba pendekatan teknis baru secara terjadwal, bukan insidental.",
      trigger_desc: "Gap Inovasi paling besar dari semua tipe budaya (+14 poin antara saat ini dan harapan).",
      area: "Inovasi · Seluruh unit",
      langkah: [
        "Alokasikan waktu rutin (mis. 1 hari per bulan) khusus untuk uji coba ide/metode baru.",
        "Buat jalur sederhana untuk karyawan mengajukan ide tanpa birokrasi panjang.",
        "Apresiasi terbuka untuk ide yang dicoba, bukan cuma yang berhasil.",
      ],
      dampak: "Budaya inovasi yang lebih hidup dan daya adaptasi terhadap tantangan teknis baru.",
    },
    {
      peringkat: 3,
      action: "Sederhanakan alur persetujuan berlapis di unit HSSE tanpa mengorbankan standar keselamatan.",
      trigger_desc: "HSSE satu-satunya unit dengan budaya dominan Aturan, sementara harapan perusahaan bergerak turun 8 poin di tipe ini.",
      area: "Aturan · HSSE",
      langkah: [
        "Petakan alur persetujuan yang ada, tandai langkah yang bisa digabung atau didelegasikan.",
        "Uji coba alur yang disederhanakan di satu jenis izin kerja dulu sebelum diperluas.",
      ],
      dampak: "Proses kerja lebih gesit tanpa menurunkan standar keselamatan yang memang wajib ketat.",
    },
  ],
  footer: {
    disclaimer:
      "Laporan ini adalah hasil pengolahan jawaban asesmen seluruh karyawan yang mengisi pada periode berjalan dan bersifat rahasia. Gunakan sebagai bahan pengambilan keputusan organisasi, bukan alat evaluasi individu karyawan tertentu.",
  },
};

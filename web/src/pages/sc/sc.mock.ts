/**
 * Data dummy modul School Culture (SC). Konteksnya SEKOLAH/YAYASAN yang mensurvei budaya kerja
 * STAF-nya sendiri (guru, tenaga kependidikan, pimpinan unit) -- bukan murid. Nama yayasan/sekolah
 * "Yayasan Pendidikan Cendekia Bangsa (contoh)" dan seluruh nama responden FIKTIF, dibuat semata
 * untuk mengikuti struktur data olahan yang dibagikan pemilik produk (kerangka OCAI:
 * Kekeluargaan/Inovasi/Orientasi/Aturan, plus breakdown 6 dimensi dan 5 subdimensi kesejahteraan)
 * -- SEMUA ANGKA, NARASI, DAN NAMA DI BAWAH REKAAN, bukan data sekolah sungguhan. SampleTag/badge
 * "Contoh" wajib tetap tampil di UI selama data ini yang dipakai.
 */
import type { LaporanAgregatSC, LaporanIndividuSC } from "./sc.types";

const ORGANISASI_ID = "org-cendekia";
const ORGANISASI_NAMA = "Yayasan Pendidikan Cendekia Bangsa (contoh)";
const PERIODE = "2026-07";

const DISCLAIMER_INDIVIDU =
  "Laporan ini adalah hasil pengolahan jawaban asesmen Anda dan bersifat rahasia. Gunakan sebagai bahan refleksi pribadi, bukan alat penilaian kinerja formal.";

/** Responden 1: guru SD, profil budaya kekeluargaan kuat, kesejahteraan baik. */
const RESPONDEN_1: LaporanIndividuSC = {
  meta: {
    responden_id: "sc-stf-001",
    nama_responden: "Rani Sulistyowati",
    peran_kerja: "Guru",
    unit: "SD Cendekia Bangsa",
    jenjang: "SD",
    organisasi_id: ORGANISASI_ID,
    periode_id: PERIODE,
  },
  header: {
    hook: "Anda melihat sekolah ini sebagai tempat yang hangat dan terus berkembang.",
    sub_hook: "Profil budaya Anda condong ke arah kekeluargaan dengan dorongan inovasi mengajar yang sehat.",
  },
  bagian_budaya: {
    narasi:
      "Persepsi Anda terhadap budaya sekolah saat ini paling kuat di sisi Kekeluargaan, menandakan Anda merasakan kedekatan dan saling percaya di antara rekan guru satu jenjang. Harapan Anda ke depan tidak jauh berbeda, hanya ingin porsi Inovasi (ruang mencoba metode mengajar baru) sedikit lebih besar.",
    chart_data: [
      { tipe: "Kekeluargaan", saat_ini: 69, harapan: 74 },
      { tipe: "Inovasi", saat_ini: 55, harapan: 68 },
      { tipe: "Orientasi", saat_ini: 42, harapan: 41 },
      { tipe: "Aturan", saat_ini: 48, harapan: 43 },
    ],
    tabel_gap: [
      { label: "Kekeluargaan", arah: "naik", nilai_gap: 5 },
      { label: "Inovasi", arah: "naik", nilai_gap: 13 },
      { label: "Orientasi", arah: "tetap", nilai_gap: -1 },
      { label: "Aturan", arah: "turun", nilai_gap: -5 },
    ],
  },
  bagian_kesejahteraan: {
    narasi:
      "Secara umum kondisi kesejahteraan Anda berada di kategori Tinggi. Kenyamanan bekerja jadi titik terkuat, sementara Work-Life Balance masih dalam batas wajar meski sedikit lebih tertekan menjelang musim ujian.",
    indeks: 79,
    kategori: "Tinggi",
    chart_data: [
      { kode: "kepuasan_kepemimpinan", label: "Kepuasan pada Kepemimpinan", nilai: 73, kategori: "Tinggi" },
      { kode: "kenyamanan_bekerja", label: "Kenyamanan Bekerja", nilai: 90, kategori: "Sangat Tinggi" },
      { kode: "pengembangan_diri", label: "Pengembangan Diri", nilai: 70, kategori: "Tinggi" },
      { kode: "ekspektasi", label: "Ekspektasi Terpenuhi", nilai: 83, kategori: "Sangat Tinggi" },
      { kode: "work_life_balance", label: "Work-Life Balance", nilai: 68, kategori: "Sedang" },
    ],
  },
  bagian_profil_organisasi: {
    narasi:
      "Dari sisi profil 6 dimensi, Karakter Lembaga dan Sinergi Tim jadi yang paling Anda rasakan kuat, sejalan dengan dominasi budaya Kekeluargaan di jawaban Anda.",
    chart_data: [
      { kode: "karakter_lembaga", label: "Karakter Lembaga", nilai: 85, kategori: "Sangat Tinggi", harapan: 88, gap: 3 },
      { kode: "kepemimpinan", label: "Kepemimpinan", nilai: 65, kategori: "Tinggi", harapan: 74, gap: 9 },
      { kode: "management", label: "Manajemen", nilai: 65, kategori: "Tinggi", harapan: 68, gap: 3 },
      { kode: "sinergi", label: "Sinergi Tim", nilai: 75, kategori: "Sangat Tinggi", harapan: 80, gap: 5 },
      { kode: "fokus", label: "Fokus Strategis", nilai: 78, kategori: "Sangat Tinggi", harapan: 82, gap: 4 },
      { kode: "performance", label: "Kinerja/Performa", nilai: 70, kategori: "Tinggi", harapan: 72, gap: 2 },
    ],
  },
  bagian_cermin:
    "\"Ketika rapat kerja, semua saling membantu untuk mensukseskan acara.\" Momen kecil seperti ini yang Anda ceritakan sendiri bulan ini, dan justru momen sederhana begitu yang paling menunjukkan kehangatan Kekeluargaan yang Anda rasakan di SD.",
  bagian_refleksi:
    "Apa satu hal kecil yang bisa Anda lakukan bulan ini supaya ruang mencoba metode mengajar baru terasa lebih terbuka di jenjang Anda?",
  jawaban_survey: {
    betah: "Rekan-rekan guru satu jenjang saling terbuka dan gampang diajak diskusi kalau ada murid yang butuh perhatian khusus.",
    hal_menguras_energi: "Kadang harus menunggu cukup lama untuk dapat kepastian jadwal kegiatan tambahan, jadi susah menyiapkan materi jauh-jauh hari.",
    yang_ingin_disampaikan: "Semoga ide-ide metode mengajar dari guru yang lebih muda juga dikasih ruang untuk dicoba, bukan cuma dari yang senior saja.",
    yang_ingin_diubah: "Jadwal kegiatan menjelang ujian bisa dipetakan lebih awal, supaya persiapan mengajar tidak keteteran.",
  },
  rencana_aksi: [
    {
      id: "sc1-inovasi",
      judul: "Ajukan satu metode mengajar baru untuk diuji coba di kelas.",
      alasan: "Harapan Anda pada ruang eksperimen mengajar 13 poin lebih tinggi dari kondisi sekarang. Memulai dari satu ide konkret lebih efektif daripada menunggu ruangnya dibuka lebih dulu.",
      terkait: "Inovasi",
      jangka: "Bulan ini",
      ikon: "💡",
    },
    {
      id: "sc1-balance",
      judul: "Petakan ulang jadwal minggu menjelang ujian.",
      alasan: "Work-Life Balance jadi subdimensi terendah Anda (68%, kategori Sedang). Memetakan lebih awal menjaga ini tidak turun saat jadwal ujian menumpuk.",
      terkait: "Work-Life Balance",
      jangka: "Minggu ini",
      ikon: "🗓️",
    },
    {
      id: "sc1-mentor",
      judul: "Bagikan cara mengajar Anda ke rekan guru yang lebih baru.",
      alasan: "Kenyamanan bekerja Anda sangat tinggi (90%). Kekuatan ini paling bernilai kalau ditularkan, bukan disimpan sendiri.",
      terkait: "Kenyamanan Bekerja",
      jangka: "3 bulan",
      ikon: "🤝",
    },
  ],
  footer: { disclaimer: DISCLAIMER_INDIVIDU },
};

/** Responden 2: tenaga kependidikan (TU), budaya Aturan dominan, harapan lebih kekeluargaan. */
const RESPONDEN_2: LaporanIndividuSC = {
  meta: {
    responden_id: "sc-stf-002",
    nama_responden: "Bayu Nugraha",
    peran_kerja: "Tenaga Kependidikan",
    unit: "Tata Usaha & Kantor Yayasan",
    jenjang: "Non-Jenjang (TU, Kantor Yayasan)",
    organisasi_id: ORGANISASI_ID,
    periode_id: PERIODE,
  },
  header: {
    hook: "Anda merasakan sekolah ini masih banyak diatur oleh prosedur dan persetujuan berlapis.",
    sub_hook: "Harapan Anda condong pada suasana kerja yang lebih dekat dan saling mendukung.",
  },
  bagian_budaya: {
    narasi:
      "Persepsi Anda menunjukkan budaya saat ini didominasi Aturan, banyak proses berjalan sesuai prosedur administrasi formal khas urusan tata usaha dan kantor yayasan. Namun harapan Anda bergeser cukup jauh ke arah Kekeluargaan, menandakan keinginan akan suasana kerja yang lebih personal.",
    chart_data: [
      { tipe: "Kekeluargaan", saat_ini: 33, harapan: 61 },
      { tipe: "Inovasi", saat_ini: 29, harapan: 36 },
      { tipe: "Orientasi", saat_ini: 37, harapan: 31 },
      { tipe: "Aturan", saat_ini: 70, harapan: 47 },
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
      "Kondisi kesejahteraan Anda berada di kategori Sedang. Ekspektasi terpenuhi jadi subdimensi yang paling perlu diperhatikan, sementara kenyamanan bekerja masih relatif terjaga.",
    indeks: 57,
    kategori: "Sedang",
    chart_data: [
      { kode: "kepuasan_kepemimpinan", label: "Kepuasan pada Kepemimpinan", nilai: 52, kategori: "Sedang" },
      { kode: "kenyamanan_bekerja", label: "Kenyamanan Bekerja", nilai: 64, kategori: "Sedang" },
      { kode: "pengembangan_diri", label: "Pengembangan Diri", nilai: 48, kategori: "Sedang" },
      { kode: "ekspektasi", label: "Ekspektasi Terpenuhi", nilai: 40, kategori: "Rendah" },
      { kode: "work_life_balance", label: "Work-Life Balance", nilai: 63, kategori: "Sedang" },
    ],
  },
  bagian_profil_organisasi: {
    narasi:
      "Dimensi Manajemen dan Fokus Strategis Anda rasakan paling menekan prosedur formal, sejalan dengan tingginya budaya Aturan pada jawaban Anda.",
    chart_data: [
      { kode: "karakter_lembaga", label: "Karakter Lembaga", nilai: 58, kategori: "Sedang" },
      { kode: "kepemimpinan", label: "Kepemimpinan", nilai: 50, kategori: "Sedang" },
      { kode: "management", label: "Manajemen", nilai: 45, kategori: "Sedang" },
      { kode: "sinergi", label: "Sinergi Tim", nilai: 48, kategori: "Sedang" },
      { kode: "fokus", label: "Fokus Strategis", nilai: 52, kategori: "Sedang" },
      { kode: "performance", label: "Kinerja/Performa", nilai: 55, kategori: "Sedang" },
    ],
  },
  bagian_cermin:
    "\"Perencanaan lebih matang\", itu satu hal yang Anda ingin ubah dari keseharian kerja bulan ini. Kalimat singkat itu sering menyimpan lebih banyak daripada kelihatannya, biasanya tandanya bukan kurang teliti, tapi proses di sekitar Anda yang belum cukup mendukung ketelitian itu.",
  bagian_refleksi:
    "Prosedur mana yang menurut Anda sudah tidak perlu terlalu berlapis, dan siapa satu rekan kerja yang bisa Anda ajak bicara lebih terbuka minggu ini?",
  jawaban_survey: {
    betah: "Pekerjaan di tata usaha ini stabil dan saya merasa dibutuhkan untuk kelancaran administrasi sekolah sehari-hari.",
    hal_menguras_energi: "Informasi soal perubahan jadwal atau kebijakan sering mendadak, jadi harus buru-buru menyesuaikan dokumen yang sudah disiapkan.",
    yang_ingin_disampaikan: "Mohon keputusan penting terkait administrasi bisa disampaikan lebih awal, supaya tim TU punya waktu cukup untuk menyiapkan berkasnya.",
    yang_ingin_diubah: "Perencanaan kegiatan lembaga bisa dibuat lebih matang, tidak mendadak, supaya persiapan administrasinya lebih tertata.",
  },
  rencana_aksi: [
    {
      id: "sc2-klan",
      judul: "Jadwalkan satu obrolan santai dengan rekan di luar urusan pekerjaan.",
      alasan: "Selisih terbesar Anda ada di sisi kekeluargaan (28 poin). Kedekatan biasanya tumbuh dari percakapan kecil yang berulang.",
      terkait: "Kekeluargaan",
      jangka: "Minggu ini",
      ikon: "☕",
    },
    {
      id: "sc2-ekspektasi",
      judul: "Catat tiga hal yang membuat pekerjaan terasa kurang sesuai harapan, lalu bicarakan dengan atasan.",
      alasan: "Ekspektasi terpenuhi jadi subdimensi terendah Anda (40%, kategori Rendah). Data tertulis membuat pembicaraan lebih mudah ditindaklanjuti.",
      terkait: "Ekspektasi Terpenuhi",
      jangka: "2 minggu",
      ikon: "📋",
    },
    {
      id: "sc2-prosedur",
      judul: "Usulkan satu langkah persetujuan administrasi yang bisa disederhanakan.",
      alasan: "Anda merasakan prosedur berlapis paling kuat di antara semua tipe budaya (70%). Usulan spesifik dari orang yang menjalankannya biasanya paling didengar.",
      terkait: "Aturan",
      jangka: "1 bulan",
      ikon: "✂️",
    },
  ],
  footer: { disclaimer: DISCLAIMER_INDIVIDU },
};

/** Responden 3: pimpinan unit (Waka SMA), budaya Orientasi/target akademik dominan, kesejahteraan paling perlu perhatian. */
const RESPONDEN_3: LaporanIndividuSC = {
  meta: {
    responden_id: "sc-stf-003",
    nama_responden: "Made Wirawan",
    peran_kerja: "Pimpinan Unit",
    unit: "SMA/SMK Cendekia Bangsa",
    jenjang: "SMA / SMK",
    organisasi_id: ORGANISASI_ID,
    periode_id: PERIODE,
  },
  header: {
    hook: "Anda merasakan tekanan pencapaian target akademik menjadi warna utama keseharian kerja.",
    sub_hook: "Anda berharap ada ruang lebih besar untuk saling mendukung antar guru, bukan sekadar mengejar angka kelulusan.",
  },
  bagian_budaya: {
    narasi:
      "Budaya yang Anda rasakan saat ini paling menonjol di sisi Orientasi, dengan penekanan pada pencapaian target akademik dan mutu lulusan. Harapan Anda relatif merata di semua tipe, dengan kenaikan paling terasa pada Kekeluargaan.",
    chart_data: [
      { tipe: "Kekeluargaan", saat_ini: 31, harapan: 53 },
      { tipe: "Inovasi", saat_ini: 41, harapan: 49 },
      { tipe: "Orientasi", saat_ini: 75, harapan: 59 },
      { tipe: "Aturan", saat_ini: 46, harapan: 41 },
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
      "Indeks kesejahteraan Anda berada di kategori Rendah, terutama ditekan Work-Life Balance dan kenyamanan bekerja yang jadi dua subdimensi terlemah. Ini pola yang perlu jadi perhatian bersama, bukan cuma catatan pribadi.",
    indeks: 45,
    kategori: "Rendah",
    chart_data: [
      { kode: "kepuasan_kepemimpinan", label: "Kepuasan pada Kepemimpinan", nilai: 55, kategori: "Sedang" },
      { kode: "kenyamanan_bekerja", label: "Kenyamanan Bekerja", nilai: 34, kategori: "Rendah" },
      { kode: "pengembangan_diri", label: "Pengembangan Diri", nilai: 51, kategori: "Sedang" },
      { kode: "ekspektasi", label: "Ekspektasi Terpenuhi", nilai: 57, kategori: "Sedang" },
      { kode: "work_life_balance", label: "Work-Life Balance", nilai: 29, kategori: "Sangat Rendah" },
    ],
  },
  bagian_profil_organisasi: {
    narasi:
      "Dimensi Performa dan Fokus Strategis paling menonjol pada jawaban Anda, mencerminkan tekanan target akademik yang tinggi di posisi pimpinan unit.",
    chart_data: [
      { kode: "karakter_lembaga", label: "Karakter Lembaga", nilai: 60, kategori: "Sedang" },
      { kode: "kepemimpinan", label: "Kepemimpinan", nilai: 58, kategori: "Sedang" },
      { kode: "management", label: "Manajemen", nilai: 62, kategori: "Sedang" },
      { kode: "sinergi", label: "Sinergi Tim", nilai: 46, kategori: "Sedang" },
      { kode: "fokus", label: "Fokus Strategis", nilai: 74, kategori: "Tinggi" },
      { kode: "performance", label: "Kinerja/Performa", nilai: 78, kategori: "Sangat Tinggi" },
    ],
  },
  bagian_cermin:
    "\"Persiapan acara mepet waktu\", itu yang paling menguras energi Anda bulan ini. Dedikasi Anda mengejar target akademik jelas terlihat dari jawaban Anda sendiri, tapi kalimat itu juga sinyal jujur bahwa ritme kerja Anda saat ini menekan, bukan cuma sibuk.",
  bagian_refleksi:
    "Kalau boleh menunda satu target minggu ini demi waktu istirahat yang cukup, target mana yang akan Anda pilih?",
  jawaban_survey: {
    betah: "Melihat murid-murid lulus dengan hasil yang baik dan diterima di sekolah/kampus pilihan mereka jadi kepuasan tersendiri.",
    hal_menguras_energi: "Persiapan acara sekolah yang waktunya mepet, jadi harus dikebut di luar jam kerja normal.",
    yang_ingin_disampaikan: "Semoga target akademik yang ditetapkan bisa lebih realistis dengan kapasitas guru yang ada saat ini.",
    yang_ingin_diubah: "Beban kerja menjelang acara-acara besar sekolah perlu dibagi lebih rata, tidak menumpuk di beberapa guru saja.",
  },
  rencana_aksi: [
    {
      id: "sc3-bicara",
      judul: "Bicarakan beban kerja Anda dengan Kepala Sekolah minggu ini.",
      alasan: "Kenyamanan bekerja Anda di 34% (Rendah) dan Work-Life Balance 29% (Sangat Rendah). Dua angka ini bersamaan adalah sinyal kelelahan kerja yang sebaiknya tidak ditunda.",
      terkait: "Kenyamanan Bekerja",
      jangka: "Minggu ini",
      ikon: "🗣️",
    },
    {
      id: "sc3-batas",
      judul: "Tetapkan satu batas waktu berhenti kerja, lalu patuhi selama dua minggu.",
      alasan: "Work-Life Balance Anda 29% (Sangat Rendah). Batas yang jelas dan konsisten lebih membantu daripada niat mengurangi jam kerja secara umum.",
      terkait: "Work-Life Balance",
      jangka: "2 minggu",
      ikon: "⏰",
    },
    {
      id: "sc3-dukungan",
      judul: "Minta bantuan konkret ke satu rekan guru senior untuk tugas yang menumpuk.",
      alasan: "Sinergi Tim Anda di 46% (Sedang), masih ada ruang untuk dimanfaatkan. Permintaan yang spesifik lebih mudah dipenuhi daripada keluhan umum.",
      terkait: "Sinergi Tim",
      jangka: "Minggu ini",
      ikon: "🤝",
    },
    {
      id: "sc3-jeda",
      judul: "Sisipkan jeda 15 menit tanpa layar di tengah hari kerja.",
      alasan: "Rekan guru menyebut Anda jarang terlihat benar-benar berhenti. Jeda pendek yang rutin memulihkan fokus lebih baik daripada istirahat panjang sesekali.",
      terkait: "Kepuasan pada Kepemimpinan",
      jangka: "Mulai hari ini",
      ikon: "🌿",
    },
  ],
  footer: { disclaimer: DISCLAIMER_INDIVIDU },
};

export const MOCK_LAPORAN_INDIVIDU_SC: LaporanIndividuSC[] = [RESPONDEN_1, RESPONDEN_2, RESPONDEN_3];

/**
 * Data dummy laporan agregat/pimpinan, satu yayasan/sekolah satu periode. Angka dibuat masuk akal
 * berdampingan dengan 3 responden di atas (indeks agregat 60, di antara 79/57/45), TAPI tidak
 * dihitung otomatis dari mereka -- ini dummy independen. Empat unit dipilih merepresentasikan
 * struktur umum yayasan pendidikan berjenjang: SD, SMP, SMA/SMK, dan Tata Usaha & Kantor Yayasan.
 */
export const MOCK_LAPORAN_AGREGAT_SC: LaporanAgregatSC = {
  meta: {
    organisasi_id: ORGANISASI_ID,
    organisasi_nama: ORGANISASI_NAMA,
    periode_id: PERIODE,
    jumlah_responden: 68,
  },
  header: {
    hook: "Budaya kerja sekolah Anda condong kekeluargaan, tapi kesejahteraan staf jenjang SMA/SMK perlu perhatian.",
    sub_hook: "Ringkasan dari 68 guru dan tenaga kependidikan lintas empat unit pada periode ini.",
  },
  bagian_budaya: {
    narasi:
      "Secara umum staf merasakan budaya Kekeluargaan paling kuat, dengan harapan yang juga bergerak ke arah sana, artinya arah yang diinginkan staf sudah sejalan dengan kondisi saat ini. Gap terbesar ada pada Inovasi, staf berharap ruang mencoba metode mengajar baru lebih terbuka dari kondisi sekarang.",
    chart_data: [
      // status di sini DIHITUNG lewat ranking |nilai_gap| (sama seperti statusBudayaPerTipe di
      // useScData.js) supaya QA visual konsisten dengan perilaku data asli: Inovasi (gap 15)
      // terbesar -> "Perlu perhatian", Orientasi (gap 4) terkecil -> "Selaras", dua tengah ->
      // "Ringan". priorityActions/phases/targetImpact SENGAJA cuma diisi untuk Inovasi (demo
      // dimensi yang punya tindak_lanjut cocok) -- tiga dimensi lain dibiarkan kosong supaya
      // empty-state "belum tersedia" di ScBudayaGapComparison/ScBudayaActionPlan ikut teruji.
      { tipe: "Kekeluargaan", saat_ini: 60, harapan: 69, status: "Ringan", interpretation: "Staf sudah merasakan kedekatan yang cukup kuat, harapan bergerak searah, tinggal dijaga konsistensinya." },
      {
        tipe: "Inovasi", saat_ini: 42, harapan: 57, status: "Perlu perhatian",
        descriptor: "Kreativitas & perbaikan", interpretation: "Ruang eksperimen metode mengajar masih terbatas, ini gap terbesar di antara keempat tipe budaya periode ini.",
        focus: "Buka ruang eksperimen metode mengajar baru secara terjadwal, bukan insidental.",
        priorityActions: [
          "Alokasikan waktu rutin khusus uji coba metode/media ajar baru.",
          "Buat jalur sederhana untuk guru mengajukan ide tanpa birokrasi panjang.",
        ],
        phases: [
          { aksi: "Kumpulkan ide dari staf dan prioritaskan berdasarkan dampak.", waktu: "Minggu ini" },
          { aksi: "Bentuk tim eksperimen kecil lintas peran dan tetapkan ukuran keberhasilan.", waktu: "Bulan ini" },
          { aksi: "Bandingkan hasil dengan kondisi awal, dokumentasikan yang terbukti efektif.", waktu: "3 bulan" },
        ],
        targetImpact: "Minimal satu eksperimen metode mengajar per unit setiap bulan.",
      },
      { tipe: "Orientasi", saat_ini: 47, harapan: 43, status: "Selaras" },
      { tipe: "Aturan", saat_ini: 56, harapan: 48, status: "Ringan" },
    ],
    tabel_gap: [
      { label: "Kekeluargaan", arah: "naik", nilai_gap: 9 },
      { label: "Inovasi", arah: "naik", nilai_gap: 15 },
      { label: "Orientasi", arah: "turun", nilai_gap: -4 },
      { label: "Aturan", arah: "turun", nilai_gap: -8 },
    ],
  },
  bagian_kesejahteraan: {
    narasi:
      "Indeks kesejahteraan gabungan berada di kategori Sedang. Kenyamanan bekerja jadi subdimensi terkuat, sementara Work-Life Balance jadi titik yang paling perlu diperhatikan sekolah secara keseluruhan.",
    indeks: 60,
    kategori: "Sedang",
    chart_data: [
      { kode: "kepuasan_kepemimpinan", label: "Kepuasan pada Kepemimpinan", nilai: 62, kategori: "Sedang" },
      { kode: "kenyamanan_bekerja", label: "Kenyamanan Bekerja", nilai: 73, kategori: "Tinggi" },
      { kode: "pengembangan_diri", label: "Pengembangan Diri", nilai: 58, kategori: "Sedang" },
      { kode: "ekspektasi", label: "Ekspektasi Terpenuhi", nilai: 61, kategori: "Sedang" },
      // priorityActions/phases/targetImpact SENGAJA cuma diisi untuk satu subdimensi (demo
      // yang punya tindak_lanjut cocok) -- empat lain dibiarkan kosong supaya empty-state di
      // ScDimensiTindakLanjut ikut teruji, sama pola dengan Inovasi di bagian_budaya di atas.
      {
        kode: "work_life_balance", label: "Work-Life Balance", nilai: 46, kategori: "Sedang", status: "Sedang",
        priorityActions: [
          "Tinjau ulang beban kerja dan target akademik guru jenjang SMA/SMK.",
          "Buka sesi dengar pendapat rutin soal beban kerja.",
        ],
        phases: [
          { aksi: "Audit beban mengajar dan tugas tambahan aktual vs kapasitas guru.", waktu: "Minggu ini" },
          { aksi: "Evaluasi ulang linimasa yang paling menekan, realokasi kalau perlu.", waktu: "Bulan ini" },
        ],
        targetImpact: "Skor Work-Life Balance meningkat minimal 10% dalam satu periode.",
      },
    ],
  },
  bagian_profil_organisasi: {
    narasi:
      "Karakter Lembaga jadi dimensi tertinggi (kekeluargaan yang dirasakan kuat), sementara Sinergi Tim relatif paling rendah, staf antarjenjang belum banyak berkolaborasi lintas unit.",
    chart_data: [
      { kode: "karakter_lembaga", label: "Karakter Lembaga", nilai: 76, kategori: "Sangat Tinggi" },
      { kode: "kepemimpinan", label: "Kepemimpinan", nilai: 63, kategori: "Sedang" },
      { kode: "management", label: "Manajemen", nilai: 61, kategori: "Sedang" },
      // harapan/gap SENGAJA cuma diisi untuk satu dimensi (demo kasus importer sempat
      // menghitungnya dari item mentah, lihat buildDimensiHarapan di scImporter.js) -- lima
      // dimensi lain dibiarkan tanpa harapan supaya jalur "harapan belum tersedia" ikut teruji.
      { kode: "sinergi", label: "Sinergi Tim", nilai: 58, kategori: "Sedang", harapan: 74, gap: 16 },
      { kode: "fokus", label: "Fokus Strategis", nilai: 67, kategori: "Sedang" },
      { kode: "performance", label: "Kinerja/Performa", nilai: 65, kategori: "Sedang" },
    ],
  },
  perbandingan_antarunit: {
    narasi:
      "Kesejahteraan paling tinggi dirasakan unit SD, menurun bertahap ke SMA/SMK. Budaya Kekeluargaan mendominasi persepsi di SD dan Tata Usaha & Kantor Yayasan, SMP condong ke budaya Aturan yang wajar mengingat fase transisi jenjang, sementara SMA/SMK condong ke budaya Orientasi yang berfokus pada capaian akademik dan kelulusan.",
    rows: [
      { unit: "SD", jumlah_responden: 24, budaya_dominan: "Kekeluargaan", indeks_kesejahteraan: 71, kategori_kesejahteraan: "Tinggi" },
      { unit: "Tata Usaha & Kantor Yayasan", jumlah_responden: 16, budaya_dominan: "Kekeluargaan", indeks_kesejahteraan: 64, kategori_kesejahteraan: "Sedang" },
      { unit: "SMP", jumlah_responden: 14, budaya_dominan: "Aturan", indeks_kesejahteraan: 56, kategori_kesejahteraan: "Sedang" },
      { unit: "SMA/SMK", jumlah_responden: 14, budaya_dominan: "Orientasi", indeks_kesejahteraan: 45, kategori_kesejahteraan: "Rendah" },
    ],
  },
  prioritas_perbaikan: [
    {
      peringkat: 1,
      action: "Tinjau ulang beban kerja dan target akademik guru jenjang SMA/SMK.",
      trigger_desc: "Indeks kesejahteraan unit ini paling rendah (45, kategori Rendah), ditekan subdimensi Work-Life Balance.",
      area: "Work-Life Balance · SMA/SMK",
      langkah: [
        { aksi: "Audit beban mengajar dan tugas tambahan aktual vs kapasitas guru dalam 2 minggu ke depan.", waktu: "Minggu ini" },
        { aksi: "Evaluasi ulang linimasa persiapan ujian yang paling menekan, mana yang bisa direalokasi.", waktu: "Bulan ini" },
        { aksi: "Buka sesi dengar pendapat langsung dengan guru sebelum menetapkan solusi.", waktu: "Bulan ini" },
      ],
      dampak: "Menurunkan risiko kelelahan kerja guru dan menjaga kualitas pengajaran jangka panjang.",
    },
    {
      peringkat: 2,
      action: "Buka ruang eksperimen metode mengajar baru secara terjadwal, bukan insidental.",
      trigger_desc: "Gap Inovasi paling besar dari semua tipe budaya (+15 poin antara saat ini dan harapan).",
      area: "Inovasi · Seluruh jenjang",
      langkah: [
        { aksi: "Alokasikan waktu rutin (mis. 1 hari per bulan) khusus untuk uji coba metode/media ajar baru.", waktu: "Bulan ini" },
        { aksi: "Buat jalur sederhana untuk guru mengajukan ide tanpa birokrasi panjang.", waktu: "Bulan ini" },
        { aksi: "Apresiasi terbuka untuk ide yang dicoba, bukan cuma yang berhasil.", waktu: "3 bulan" },
      ],
      dampak: "Budaya inovasi mengajar yang lebih hidup dan daya adaptasi terhadap kebutuhan belajar murid yang berubah.",
    },
    {
      peringkat: 3,
      action: "Bangun ruang kolaborasi lintas jenjang supaya Sinergi Tim ikut terangkat.",
      trigger_desc: "Sinergi Tim jadi dimensi profil organisasi paling rendah (58, kategori Sedang) dari keenam dimensi.",
      area: "Sinergi Tim · Seluruh unit",
      langkah: [
        { aksi: "Jadwalkan pertemuan lintas jenjang rutin (mis. bulanan) untuk berbagi praktik baik.", waktu: "Bulan ini" },
        { aksi: "Petakan proyek kecil yang bisa dikerjakan bersama lintas SD/SMP/SMA.", waktu: "3 bulan" },
      ],
      dampak: "Rasa saling percaya dan kerja sama antarjenjang lebih kuat, tidak lagi bekerja dalam silo masing-masing.",
    },
  ],
  footer: {
    disclaimer:
      "Laporan ini adalah hasil pengolahan jawaban asesmen seluruh staf yang mengisi pada periode berjalan dan bersifat rahasia. Gunakan sebagai bahan pengambilan keputusan sekolah, bukan alat evaluasi individu staf tertentu.",
  },
  // Dihitung tangan dari 3 responden MOCK_LAPORAN_INDIVIDU_SC di atas -- cuma untuk QA visual
  // komponen ScAnalisisCharts.jsx (Fase B), BUKAN representasi statistik nyata (n=3 terlalu
  // kecil untuk kesimpulan apa pun, sengaja tidak dipakai untuk narasi). heatmap dikosongkan
  // karena mock individu tidak menyimpan jawaban_mentah (item mentah), cuma data asli import
  // yang punya itu.
  analisis: {
    pie_dominan: [
      { tipe: "Kekeluargaan", jumlah: 1, persen: 33 },
      { tipe: "Inovasi", jumlah: 0, persen: 0 },
      { tipe: "Orientasi", jumlah: 1, persen: 33 },
      { tipe: "Aturan", jumlah: 1, persen: 34 },
    ],
    distribusi_arah: [
      { tipe: "Kekeluargaan", naik: 62, tetap: 31, turun: 7 },
      { tipe: "Inovasi", naik: 74, tetap: 19, turun: 7 },
      { tipe: "Orientasi", naik: 21, tetap: 44, turun: 35 },
      { tipe: "Aturan", naik: 15, tetap: 38, turun: 47 },
    ],
    sebaran_wellbeing: [
      { kode: "kepuasan_kepemimpinan", label: "Kepuasan pada Kepemimpinan", nilai: [73, 52, 55] },
      { kode: "kenyamanan_bekerja", label: "Kenyamanan Bekerja", nilai: [90, 64, 34] },
      { kode: "pengembangan_diri", label: "Pengembangan Diri", nilai: [70, 48, 51] },
      { kode: "ekspektasi", label: "Ekspektasi Terpenuhi", nilai: [83, 40, 57] },
      { kode: "work_life_balance", label: "Work-Life Balance", nilai: [68, 63, 29] },
    ],
    donut_kategori_wellbeing: [
      { kategori: "Sangat Rendah", jumlah: 0, persen: 0 },
      { kategori: "Rendah", jumlah: 0, persen: 0 },
      { kategori: "Sedang", jumlah: 2, persen: 67 },
      { kategori: "Tinggi", jumlah: 0, persen: 0 },
      { kategori: "Sangat Tinggi", jumlah: 1, persen: 33 },
    ],
    // Section 01-D (rating bintang per tipe budaya) -- sumber SAMA dengan heatmap Fase B lama
    // (rata-rata item mentah gambaran_<dimensi>_<tipe>), cuma sekarang disajikan per kartu tipe
    // bukan grid. nilai_mentah skala 1-5 (raw), nilai skala 0-100 (persen) -- keduanya dari
    // angka yang sama, tanpa round-trip pembulatan.
    heatmap: [
      { dimensi: "Karakter Lembaga", tipe: "Kekeluargaan", nilai: 89, nilai_mentah: 4.44 },
      { dimensi: "Kepemimpinan", tipe: "Kekeluargaan", nilai: 80, nilai_mentah: 4.0 },
      { dimensi: "Manajemen", tipe: "Kekeluargaan", nilai: 76, nilai_mentah: 3.81 },
      { dimensi: "Sinergi Tim", tipe: "Kekeluargaan", nilai: 80, nilai_mentah: 4.0 },
      { dimensi: "Fokus Strategis", tipe: "Kekeluargaan", nilai: 81, nilai_mentah: 4.06 },
      { dimensi: "Kinerja/Performa", tipe: "Kekeluargaan", nilai: 75, nilai_mentah: 3.75 },
      { dimensi: "Karakter Lembaga", tipe: "Inovasi", nilai: 72, nilai_mentah: 3.6 },
      { dimensi: "Kepemimpinan", tipe: "Inovasi", nilai: 76, nilai_mentah: 3.8 },
      { dimensi: "Manajemen", tipe: "Inovasi", nilai: 66, nilai_mentah: 3.3 },
      { dimensi: "Sinergi Tim", tipe: "Inovasi", nilai: 70, nilai_mentah: 3.5 },
      { dimensi: "Fokus Strategis", tipe: "Inovasi", nilai: 78, nilai_mentah: 3.9 },
      { dimensi: "Kinerja/Performa", tipe: "Inovasi", nilai: 68, nilai_mentah: 3.4 },
      { dimensi: "Karakter Lembaga", tipe: "Orientasi", nilai: 78, nilai_mentah: 3.9 },
      { dimensi: "Kepemimpinan", tipe: "Orientasi", nilai: 72, nilai_mentah: 3.6 },
      { dimensi: "Manajemen", tipe: "Orientasi", nilai: 74, nilai_mentah: 3.7 },
      { dimensi: "Sinergi Tim", tipe: "Orientasi", nilai: 64, nilai_mentah: 3.2 },
      { dimensi: "Fokus Strategis", tipe: "Orientasi", nilai: 82, nilai_mentah: 4.1 },
      { dimensi: "Kinerja/Performa", tipe: "Orientasi", nilai: 76, nilai_mentah: 3.8 },
      { dimensi: "Karakter Lembaga", tipe: "Aturan", nilai: 82, nilai_mentah: 4.1 },
      { dimensi: "Kepemimpinan", tipe: "Aturan", nilai: 68, nilai_mentah: 3.4 },
      { dimensi: "Manajemen", tipe: "Aturan", nilai: 84, nilai_mentah: 4.2 },
      { dimensi: "Sinergi Tim", tipe: "Aturan", nilai: 62, nilai_mentah: 3.1 },
      { dimensi: "Fokus Strategis", tipe: "Aturan", nilai: 72, nilai_mentah: 3.6 },
      { dimensi: "Kinerja/Performa", tipe: "Aturan", nilai: 78, nilai_mentah: 3.9 },
    ],
    // Ditambah beberapa titik sintetis di luar 3 responden asli supaya QA visual scatter
    // (Fase D) kelihatan sebarannya -- konsisten dengan disclaimer di atas, tetap bukan
    // statistik nyata.
    scatter_budaya_wellbeing: [
      { tipe_dominan: "Kekeluargaan", indeks: 73 },
      { tipe_dominan: "Kekeluargaan", indeks: 61 },
      { tipe_dominan: "Kekeluargaan", indeks: 55 },
      { tipe_dominan: "Inovasi", indeks: 58 },
      { tipe_dominan: "Inovasi", indeks: 44 },
      { tipe_dominan: "Orientasi", indeks: 52 },
      { tipe_dominan: "Orientasi", indeks: 39 },
      { tipe_dominan: "Aturan", indeks: 34 },
      { tipe_dominan: "Aturan", indeks: 29 },
      { tipe_dominan: "Aturan", indeks: 47 },
    ],
    jumlah_responden_dianalisis: 3,
  },
  // Fase D item 12 -- contoh hasil pengelompokan Gemini (sudah lewat approve briefing di CMS),
  // ringkasan diparafrasekan, bukan kutipan verbatim.
  tema_esai: [
    { tema: "Beban kerja jelang ujian", ringkasan: "Beberapa staf menyebut jadwal jadi sangat padat menjelang periode ujian, sampai sulit mengambil waktu istirahat yang cukup.", jumlah_mention: 5 },
    { tema: "Ingin ruang kolaborasi lintas jenjang", ringkasan: "Ada keinginan berulang untuk lebih sering bertukar praktik mengajar dengan rekan dari jenjang lain, bukan cuma dalam forum formal.", jumlah_mention: 4 },
    { tema: "Apresiasi atas dukungan pimpinan", ringkasan: "Beberapa staf menyampaikan rasa terbantu dengan keterbukaan pimpinan mendengarkan keluhan sehari-hari.", jumlah_mention: 3 },
  ],
  // Fase E item 14 -- 3 periode sintetis buat QA visual ScTrenLineChart (data asli baru akan
  // punya ini kalau sekolahnya sudah lewat 2+ periode assessment).
  tren_kesejahteraan: [
    { periode_id: "2026-01", indeks: 52 },
    { periode_id: "2026-04", indeks: 57 },
    { periode_id: "2026-07", indeks: 60 },
  ],
  generated_at: "2026-07-24T09:00:00+07:00",
  // action_owner/review_cadence/target_date/next_review SENGAJA tidak diisi -- data gap murni
  // (lihat sc.types.ts), supaya ScDimensiTindakLanjut menampilkan "Belum ditentukan" jujur,
  // bukan dikarang, saat QA visual lewat ?preview=sc-agregat.
  // Section 01-E -- contoh hasil SINTESIS Gemini (sudah lewat approve briefing), BUKAN kutipan
  // verbatim staf mana pun, lihat CeritaPegawai di sc.types.ts.
  cerita_pegawai: {
    saat_ini: [
      "Beberapa staf merasa suasana kerja sehari-hari terasa hangat, saling membantu antar rekan tanpa diminta.",
      "Ada yang menyebut sering diberi kepercayaan memegang tanggung jawab baru dan merasa didukung pimpinan saat mengelolanya.",
      "Beberapa staf sudah bekerja sejak organisasi ini berdiri, dan merasa itu jadi bagian dari identitas mereka di sini.",
      "Sapaan dan keramahan saat datang kerja disebut berulang sebagai hal yang membuat suasana terasa nyaman.",
    ],
    ingin_diubah: [
      "Beberapa staf berharap ada perencanaan kerja yang lebih matang, tidak mendadak.",
      "Ada keinginan agar kebiasaan kerja lama ikut beradaptasi dengan kebutuhan digital yang berkembang cepat.",
      "Beberapa staf ingin lebih leluasa mengonfirmasi ulang pemahaman tanpa merasa sungkan.",
      "Ada harapan apresiasi dan motivasi diberikan lebih rutin, tidak cuma sesekali.",
    ],
  },
};

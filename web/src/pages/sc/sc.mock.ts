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
    jenis_kelamin: "Perempuan",
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
      alasan: "Harapan pada ruang eksperimen mengajar 13 poin lebih tinggi dari kondisi sekarang. Memulai dari satu ide konkret lebih efektif daripada menunggu ruangnya dibuka lebih dulu.",
      terkait: "Inovasi",
      jangka: "Bulan ini",
      ikon: "💡",
    },
    {
      id: "sc1-balance",
      judul: "Petakan ulang jadwal minggu menjelang ujian.",
      alasan: "Work-Life Balance jadi subdimensi terendah (68%, kategori Sedang). Memetakan lebih awal menjaga ini tidak turun saat jadwal ujian menumpuk.",
      terkait: "Work-Life Balance",
      jangka: "Minggu ini",
      ikon: "🗓️",
    },
    {
      id: "sc1-mentor",
      judul: "Bagikan cara mengajar ke rekan guru yang lebih baru.",
      alasan: "Kenyamanan bekerja sangat tinggi (90%). Kekuatan ini paling bernilai kalau ditularkan, bukan disimpan sendiri.",
      terkait: "Kenyamanan Bekerja",
      jangka: "3 bulan",
      ikon: "🤝",
    },
  ],
  lingkar_kontribusi: [
    {
      locus: "control",
      mengapa_fokus: "Kenyamanan bekerja sudah sangat tinggi (90%), tapi Work-Life Balance jadi subdimensi terendah (68%, kategori Sedang), terutama menjelang periode ujian.",
      langkah: [
        {
          judul: "Petakan beban kerja pribadi setiap awal pekan",
          instruksi: "Setiap Senin pagi, tuliskan:",
          contoh: ["Tugas mengajar dan administrasi minggu ini.", "Kegiatan tambahan yang sudah pasti jadwalnya.", "Waktu istirahat yang ingin dijaga tetap ada."],
          tujuan: "Supaya beban kerja terlihat jelas dari awal, bukan menumpuk mendadak menjelang ujian.",
        },
        {
          judul: "Coba satu ide metode mengajar baru di kelas sendiri",
          instruksi: "Pilih satu topik dalam dua minggu ke depan, lalu:",
          contoh: ["Rancang satu pendekatan mengajar berbeda dari biasanya.", "Coba di satu kelas kecil dulu.", "Catat reaksi murid dan hasil belajarnya."],
          tujuan: "Memulai ruang eksperimen dari langkah kecil yang tidak perlu menunggu persetujuan siapa pun.",
        },
        {
          judul: "Sisihkan satu slot istirahat tetap setiap hari",
          instruksi: "Tentukan satu jam tertentu, lalu:",
          contoh: ["Blokir waktu itu di jadwal pribadi.", "Hindari menjadwalkan kegiatan tambahan di jam itu.", "Gunakan untuk benar-benar berhenti sejenak, bukan menyelesaikan tugas lain."],
          tujuan: "Menjaga Work-Life Balance tidak makin turun saat periode ujian mendekat.",
        },
      ],
    },
    {
      locus: "influence",
      mengapa_fokus: "Harapan terhadap ruang mencoba metode mengajar baru (Inovasi) 13 poin lebih tinggi dari kondisi sekarang, gap terbesar di antara keempat tipe budaya.",
      langkah: [
        {
          judul: "Ajukan ide metode mengajar dalam forum jenjang",
          instruksi: "Pada pertemuan rutin guru jenjang berikutnya, sampaikan:",
          contoh: ["Satu metode yang ingin dicoba beserta alasannya.", "Dukungan yang dibutuhkan dari rekan sejenjang.", "Rencana waktu uji coba."],
          tujuan: "Membuka ruang eksperimen lewat percakapan langsung, bukan menunggu kebijakan turun.",
        },
        {
          judul: "Ajak guru yang lebih muda ikut mengusulkan ide",
          instruksi: "Sebelum forum berikutnya, tanyakan ke satu-dua rekan lebih muda:",
          contoh: ["Ide mengajar yang ingin mereka coba.", "Kendala yang mereka rasakan selama ini.", "Kesediaan mereka ikut menyampaikan di forum."],
          tujuan: "Menindaklanjuti harapan supaya ide dari guru yang lebih muda juga diberi ruang, bukan cuma dari yang senior.",
        },
        {
          judul: "Bicarakan jadwal kegiatan tambahan dengan koordinator jenjang",
          instruksi: "Sampaikan langsung ke koordinator:",
          contoh: ["Kesulitan menyiapkan materi karena jadwal sering mendadak.", "Usulan kepastian jadwal minimal satu minggu di depan."],
          tujuan: "Mendorong perubahan lewat percakapan dua arah, bukan cuma menyimpan keluhan sendiri.",
        },
      ],
    },
    {
      locus: "system",
      mengapa_fokus: "Gap Kepemimpinan pada profil organisasi (65% menuju harapan 74%) menunjukkan masih ada jarak antara gaya pembimbingan yang dirasakan dan yang diharapkan.",
      langkah: [
        {
          judul: "Sampaikan pola jadwal mendadak ke pimpinan sekolah",
          instruksi: "Lewat jalur yang sudah ada (rapat/laporan rutin), sampaikan:",
          contoh: ["Pola jadwal kegiatan tambahan yang sering berubah mendadak.", "Dampaknya pada kesiapan mengajar.", "Usulan jalur konfirmasi jadwal yang lebih awal."],
          tujuan: "Mendokumentasikan pola berulang supaya bisa dipertimbangkan jadi kebijakan, bukan cuma keluhan sesaat.",
        },
        {
          judul: "Usulkan ruang eksperimen metode mengajar jadi agenda resmi",
          instruksi: "Sampaikan ke pimpinan lewat forum yang sesuai:",
          contoh: ["Data bahwa harapan terhadap ruang inovasi 13 poin lebih tinggi dari kondisi sekarang.", "Usulan waktu khusus rutin untuk uji coba metode mengajar."],
          tujuan: "Membawa kebutuhan ini ke level keputusan lembaga, bukan tanggung jawab satu guru.",
        },
        {
          judul: "Dokumentasikan hasil uji coba metode mengajar pribadi",
          instruksi: "Setelah mencoba metode baru, catat:",
          contoh: ["Hasil belajar murid yang teramati.", "Kendala yang muncul.", "Rekomendasi untuk jenjang lain."],
          tujuan: "Menyediakan bukti konkret yang bisa dipakai pimpinan sebagai dasar kebijakan yang lebih luas.",
        },
      ],
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
    jenis_kelamin: "Laki-laki",
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
      alasan: "Selisih terbesar ada di sisi kekeluargaan (28 poin). Kedekatan biasanya tumbuh dari percakapan kecil yang berulang.",
      terkait: "Kekeluargaan",
      jangka: "Minggu ini",
      ikon: "☕",
    },
    {
      id: "sc2-ekspektasi",
      judul: "Catat tiga hal yang membuat pekerjaan terasa kurang sesuai harapan, lalu bicarakan dengan atasan.",
      alasan: "Ekspektasi terpenuhi jadi subdimensi terendah (40%, kategori Rendah). Data tertulis membuat pembicaraan lebih mudah ditindaklanjuti.",
      terkait: "Ekspektasi Terpenuhi",
      jangka: "2 minggu",
      ikon: "📋",
    },
    {
      id: "sc2-prosedur",
      judul: "Usulkan satu langkah persetujuan administrasi yang bisa disederhanakan.",
      alasan: "Prosedur berlapis dirasakan paling kuat di antara semua tipe budaya (70%). Usulan spesifik dari orang yang menjalankannya biasanya paling didengar.",
      terkait: "Aturan",
      jangka: "1 bulan",
      ikon: "✂️",
    },
  ],
  lingkar_kontribusi: [
    {
      locus: "control",
      mengapa_fokus: "Selisih terbesar ada di sisi Kekeluargaan (28 poin) dan prosedur berlapis (Aturan) dirasakan paling berat di antara semua tipe budaya (70%).",
      langkah: [
        {
          judul: "Mulai satu obrolan singkat di luar urusan kerja",
          instruksi: "Setiap hari, luangkan waktu untuk:",
          contoh: ["Menyapa satu rekan dari unit berbeda.", "Menanyakan kabar di luar topik pekerjaan.", "Mendengarkan tanpa buru-buru pindah ke urusan tugas."],
          tujuan: "Menumbuhkan kedekatan personal secara bertahap, sesuai gap kekeluargaan yang paling besar.",
        },
        {
          judul: "Catat langkah persetujuan yang terasa berlapis",
          instruksi: "Selama dua minggu, tuliskan setiap kali:",
          contoh: ["Dokumen atau permintaan harus melewati lebih dari dua persetujuan.", "Berapa lama prosesnya berjalan.", "Bagian mana yang terasa bisa dipercepat."],
          tujuan: "Punya data konkret sebelum mengusulkan penyederhanaan prosedur.",
        },
        {
          judul: "Sederhanakan satu tugas administrasi sendiri",
          instruksi: "Pilih satu tugas rutin, lalu:",
          contoh: ["Buat versi checklist atau template yang lebih ringkas.", "Coba pakai versi itu selama satu minggu.", "Bandingkan waktu yang terpakai sebelum dan sesudah."],
          tujuan: "Mengurangi beban prosedural yang memang berada dalam kendali sendiri, tanpa menunggu kebijakan baru.",
        },
      ],
    },
    {
      locus: "influence",
      mengapa_fokus: "Ekspektasi Terpenuhi jadi subdimensi terendah (40%, kategori Rendah), menandakan ada jarak antara bayangan sebelum bergabung dan kenyataan kerja sehari-hari.",
      langkah: [
        {
          judul: "Ajak diskusi terbuka dengan atasan langsung",
          instruksi: "Jadwalkan satu percakapan empat mata, sampaikan:",
          contoh: ["Tiga hal yang terasa berbeda dari bayangan awal bergabung.", "Bagian mana yang masih bisa diselaraskan.", "Dukungan yang dibutuhkan untuk menyelaraskannya."],
          tujuan: "Membuat kesenjangan ekspektasi terlihat jelas, bukan dipendam sendiri.",
        },
        {
          judul: "Usulkan penyederhanaan satu langkah persetujuan",
          instruksi: "Bawa catatan prosedur berlapis ke rekan atau atasan terkait, sampaikan:",
          contoh: ["Langkah yang paling sering memperlambat.", "Usulan alternatif yang lebih ringkas.", "Dampaknya kalau disederhanakan."],
          tujuan: "Mendorong perubahan lewat percakapan langsung dengan pihak yang berwenang atas prosedur itu.",
        },
        {
          judul: "Bentuk kebiasaan sapa lintas unit bersama rekan lain",
          instruksi: "Ajak satu-dua rekan untuk:",
          contoh: ["Bergantian menyapa unit lain di waktu istirahat.", "Membuat obrolan ringan jadi kebiasaan bersama, bukan usaha sendirian."],
          tujuan: "Memperkuat kedekatan lintas unit lebih cepat lewat kerja sama, bukan sendirian.",
        },
      ],
    },
    {
      locus: "system",
      mengapa_fokus: "Manajemen jadi dimensi profil organisasi terendah (45%), sejalan dengan Aturan yang dirasakan paling dominan dan paling ingin diringankan.",
      langkah: [
        {
          judul: "Sampaikan pola prosedur berlapis lewat jalur resmi",
          instruksi: "Lewat rapat atau laporan rutin, sampaikan:",
          contoh: ["Daftar langkah persetujuan yang tercatat selama dua minggu.", "Waktu rata-rata yang terpakai.", "Usulan langkah yang bisa disederhanakan."],
          tujuan: "Membawa data konkret ke ruang keputusan lembaga, bukan sekadar keluhan lisan.",
        },
        {
          judul: "Usulkan tinjauan ulang alur administrasi unit",
          instruksi: "Ajukan lewat pimpinan unit atau forum terkait:",
          contoh: ["Alur administrasi yang berjalan saat ini.", "Titik-titik yang paling sering memperlambat.", "Manfaat kalau ditinjau ulang secara berkala."],
          tujuan: "Mendorong perbaikan sistem administrasi, bukan tanggung jawab satu orang menanggung semua langkahnya.",
        },
        {
          judul: "Minta kejelasan ekspektasi peran secara tertulis",
          instruksi: "Ajukan permintaan ke atasan atau bagian kepegawaian:",
          contoh: ["Uraian tugas dan tanggung jawab yang berlaku saat ini.", "Perbandingan dengan yang dijanjikan saat bergabung."],
          tujuan: "Menjadikan kejelasan ekspektasi sebagai bagian dari sistem, bukan interpretasi masing-masing orang.",
        },
      ],
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
    jenis_kelamin: "Laki-laki",
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
      judul: "Bicarakan beban kerja dengan Kepala Sekolah minggu ini.",
      alasan: "Kenyamanan bekerja di 34% (Rendah) dan Work-Life Balance 29% (Sangat Rendah). Dua angka ini bersamaan adalah sinyal kelelahan kerja yang sebaiknya tidak ditunda.",
      terkait: "Kenyamanan Bekerja",
      jangka: "Minggu ini",
      ikon: "🗣️",
    },
    {
      id: "sc3-batas",
      judul: "Tetapkan satu batas waktu berhenti kerja, lalu patuhi selama dua minggu.",
      alasan: "Work-Life Balance di 29% (Sangat Rendah). Batas yang jelas dan konsisten lebih membantu daripada niat mengurangi jam kerja secara umum.",
      terkait: "Work-Life Balance",
      jangka: "2 minggu",
      ikon: "⏰",
    },
    {
      id: "sc3-dukungan",
      judul: "Minta bantuan konkret ke satu rekan guru senior untuk tugas yang menumpuk.",
      alasan: "Sinergi Tim di 46% (Sedang), masih ada ruang untuk dimanfaatkan. Permintaan yang spesifik lebih mudah dipenuhi daripada keluhan umum.",
      terkait: "Sinergi Tim",
      jangka: "Minggu ini",
      ikon: "🤝",
    },
    {
      id: "sc3-jeda",
      judul: "Sisipkan jeda 15 menit tanpa layar di tengah hari kerja.",
      alasan: "Rekan guru beberapa kali menyebut pola kerja yang jarang benar-benar berhenti. Jeda pendek yang rutin memulihkan fokus lebih baik daripada istirahat panjang sesekali.",
      terkait: "Kepuasan pada Kepemimpinan",
      jangka: "Mulai hari ini",
      ikon: "🌿",
    },
  ],
  lingkar_kontribusi: [
    {
      locus: "control",
      mengapa_fokus: "Work-Life Balance berada di 29% (Sangat Rendah) dan Kenyamanan Bekerja di 34% (Rendah), dua angka terendah di seluruh laporan ini.",
      langkah: [
        {
          judul: "Tetapkan satu batas waktu berhenti kerja setiap hari",
          instruksi: "Pilih satu jam tetap, lalu:",
          contoh: ["Tentukan jam berhenti kerja yang sama setiap hari kerja.", "Matikan notifikasi terkait pekerjaan setelah jam itu.", "Catat berapa hari berhasil dipatuhi dalam satu minggu."],
          tujuan: "Membangun batas yang jelas dan konsisten, karena niat mengurangi jam kerja secara umum jarang bertahan tanpa batas konkret.",
        },
        {
          judul: "Sisipkan jeda tanpa layar di tengah hari kerja",
          instruksi: "Setiap hari, luangkan 15 menit untuk:",
          contoh: ["Menjauh dari layar dan meja kerja.", "Berjalan sebentar atau sekadar duduk tanpa pekerjaan.", "Kembali bekerja setelah waktu itu selesai, bukan lebih cepat."],
          tujuan: "Memulihkan fokus lewat jeda pendek yang rutin, lebih membantu daripada istirahat panjang sesekali.",
        },
        {
          judul: "Petakan sumber ketidaknyamanan kerja harian",
          instruksi: "Selama satu minggu, catat:",
          contoh: ["Momen yang membuat kerja terasa tidak nyaman.", "Apakah berulang atau kejadian sesekali.", "Bagian yang bisa diubah sendiri."],
          tujuan: "Memisahkan sumber ketidaknyamanan yang bisa diatasi sendiri dari yang butuh pihak lain.",
        },
      ],
    },
    {
      locus: "influence",
      mengapa_fokus: "Sinergi Tim berada di 46% (Sedang), masih ada ruang dimanfaatkan, terutama karena kerja sebagai Pimpinan Unit banyak bersinggungan dengan rekan lintas peran.",
      langkah: [
        {
          judul: "Bicarakan beban kerja dengan Kepala Sekolah",
          instruksi: "Jadwalkan percakapan singkat minggu ini, sampaikan:",
          contoh: ["Kondisi Kenyamanan Bekerja dan Work-Life Balance saat ini.", "Bagian pekerjaan yang paling menyita waktu di luar jam kerja.", "Dukungan yang dibutuhkan untuk meringankannya."],
          tujuan: "Kenyamanan bekerja yang rendah dan Work-Life Balance yang sangat rendah adalah sinyal kelelahan kerja yang sebaiknya tidak ditunda.",
        },
        {
          judul: "Bagi tugas menumpuk dengan rekan yang tepat",
          instruksi: "Pilih satu tugas yang menumpuk, lalu:",
          contoh: ["Sampaikan permintaan bantuan yang spesifik, bukan keluhan umum.", "Sepakati bagian yang bisa dibagi.", "Tentukan tenggat waktu bersama."],
          tujuan: "Permintaan yang spesifik lebih mudah dipenuhi daripada keluhan umum, sekaligus memperkuat Sinergi Tim.",
        },
        {
          judul: "Ajak rekan sesama Pimpinan Unit berbagi cara mengatur beban",
          instruksi: "Pada pertemuan rutin antarunit, tanyakan:",
          contoh: ["Cara rekan lain mengatur waktu dan prioritas.", "Praktik yang bisa saling ditiru antarunit."],
          tujuan: "Memperkuat kerja sama lintas unit sekaligus menemukan cara baru mengelola beban kerja.",
        },
      ],
    },
    {
      locus: "system",
      mengapa_fokus: "Orientasi pada hasil dirasakan turun 16 poin dari harapan (75% menuju 59%), menandakan tekanan pencapaian target dirasa sudah tinggi dan berharap diringankan.",
      langkah: [
        {
          judul: "Sampaikan pola tekanan target ke forum pimpinan",
          instruksi: "Lewat rapat pimpinan unit, sampaikan:",
          contoh: ["Data bahwa harapan terhadap orientasi hasil justru lebih rendah dari kondisi sekarang.", "Dampaknya pada Kenyamanan Bekerja dan Work-Life Balance.", "Usulan penyesuaian ekspektasi target."],
          tujuan: "Menjadikan tekanan pencapaian target sebagai bahan diskusi kebijakan, bukan ditanggung sendiri sebagai Pimpinan Unit.",
        },
        {
          judul: "Usulkan mekanisme berbagi beban antarunit",
          instruksi: "Ajukan ke pimpinan sekolah:",
          contoh: ["Kondisi Sinergi Tim yang masih di kategori Sedang.", "Usulan forum rutin berbagi beban kerja antarunit."],
          tujuan: "Risiko kelelahan kerja lebih baik diatasi lewat mekanisme sistem, bukan cuma inisiatif satu Pimpinan Unit.",
        },
        {
          judul: "Dokumentasikan dampak beban kerja pada kenyamanan",
          instruksi: "Selama satu bulan, catat secara ringkas:",
          contoh: ["Hari dengan beban kerja paling berat.", "Efeknya pada kondisi fisik atau fokus.", "Pola yang berulang dari waktu ke waktu."],
          tujuan: "Menyediakan bukti konkret yang bisa dipakai lembaga untuk mempertimbangkan kebijakan beban kerja.",
        },
      ],
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
    hook: "Budaya kerja sekolah Anda condong kekeluargaan, tapi kesejahteraan Tim jenjang SMA/SMK perlu perhatian.",
    sub_hook: "Ringkasan dari 68 guru dan tenaga kependidikan lintas empat unit pada periode ini.",
  },
  bagian_budaya: {
    narasi:
      "Secara umum Tim merasakan budaya Kekeluargaan paling kuat, dengan harapan yang juga bergerak ke arah sana, artinya arah yang diinginkan Tim sudah sejalan dengan kondisi saat ini. Gap terbesar ada pada Inovasi, Tim berharap ruang mencoba metode mengajar baru lebih terbuka dari kondisi sekarang.",
    chart_data: [
      // status di sini pakai AMBANG TETAP atas |nilai_gap| (sama seperti statusBudayaPerTipe di
      // useScData.js, diputuskan pemilik produk 2026-08): |gap|>5 "Perlu perhatian", 1-5
      // "Ringan", <1 "Selaras" -- supaya QA visual konsisten dengan perilaku data asli.
      // Kekeluargaan (9) dan Aturan (8) sama-sama >5 jadi "Perlu perhatian" juga (bukan cuma
      // Inovasi seperti versi ranking lama). priorityActions/phases/targetImpact SENGAJA cuma
      // diisi untuk Inovasi (demo dimensi yang punya tindak_lanjut cocok) -- tiga dimensi lain
      // dibiarkan kosong supaya empty-state "belum tersedia" ikut teruji.
      { tipe: "Kekeluargaan", saat_ini: 60, harapan: 69, status: "Perlu perhatian", interpretation: "Tim sudah merasakan kedekatan yang cukup kuat, harapan bergerak searah, tinggal dijaga konsistensinya." },
      {
        tipe: "Inovasi", saat_ini: 42, harapan: 57, status: "Perlu perhatian",
        descriptor: "Kreativitas & perbaikan", interpretation: "Ruang eksperimen metode mengajar masih terbatas, ini gap terbesar di antara keempat tipe budaya periode ini.",
        focus: "Buka ruang eksperimen metode mengajar baru secara terjadwal, bukan insidental.",
        priorityActions: [
          "Alokasikan waktu rutin khusus uji coba metode/media ajar baru.",
          "Buat jalur sederhana untuk guru mengajukan ide tanpa birokrasi panjang.",
        ],
        phases: [
          { aksi: "Kumpulkan ide dari Tim dan prioritaskan berdasarkan dampak.", waktu: "Minggu ini" },
          { aksi: "Bentuk tim eksperimen kecil lintas peran dan tetapkan ukuran keberhasilan.", waktu: "Bulan ini" },
          { aksi: "Bandingkan hasil dengan kondisi awal, dokumentasikan yang terbukti efektif.", waktu: "3 bulan" },
        ],
        targetImpact: "Minimal satu eksperimen metode mengajar per unit setiap bulan.",
        indicators: [
          { title: "Jumlah eksperimen tercatat", detail: "Berapa uji coba metode/media ajar baru yang benar-benar dijalankan tiap bulan." },
          { title: "Partisipasi lintas jenjang", detail: "Berapa guru dari jenjang berbeda ikut serta dalam satu siklus eksperimen." },
        ],
        warnings: ["Kalau ide baru cuma didorong tanpa waktu khusus, gurunya justru merasa dibebani di luar jam mengajar biasa."],
      },
      { tipe: "Orientasi", saat_ini: 47, harapan: 47, status: "Selaras" },
      { tipe: "Aturan", saat_ini: 56, harapan: 48, status: "Perlu perhatian" },
    ],
    tabel_gap: [
      { label: "Kekeluargaan", arah: "naik", nilai_gap: 9 },
      { label: "Inovasi", arah: "naik", nilai_gap: 15 },
      // Diturunkan dari -4 (dulu contoh kategori "Selaras" versi ranking lama) jadi 0 supaya
      // tetap benar-benar <1 di bawah ambang baru -- satu-satunya cara "Selaras" muncul lagi
      // untuk QA visual sekarang gap-nya harus genuinely kecil, bukan cuma "terkecil dari 4".
      { label: "Orientasi", arah: "tetap", nilai_gap: 0 },
      { label: "Aturan", arah: "turun", nilai_gap: -8 },
    ],
  },
  bagian_kesejahteraan: {
    narasi:
      "Indeks kesejahteraan gabungan berada di kategori Sedang. Kenyamanan bekerja jadi subdimensi terkuat, sementara Work-Life Balance jadi titik yang paling perlu diperhatikan sekolah secara keseluruhan.",
    indeks: 60,
    kategori: "Sedang",
    chart_data: [
      {
        kode: "kepuasan_kepemimpinan", label: "Kepuasan pada Kepemimpinan", nilai: 62, kategori: "Sedang",
        // items: contoh breakdown butir mentah b1-b3 -- rata-rata sesungguhnya dihitung
        // driverItemsKesejahteraan() di useScData.js dari sc_personal.jawaban_mentah, bukan
        // dikarang di sini, cuma dummy QA visual sama seperti angka lain di berkas ini.
        items: [
          { label: "Puas cara kerja pimpinan", nilai: 3.1 },
          { label: "Percaya keputusan pimpinan", nilai: 3.2 },
          { label: "Informasi terbuka", nilai: 3.0 },
        ],
      },
      { kode: "kenyamanan_bekerja", label: "Kenyamanan Bekerja", nilai: 73, kategori: "Tinggi", items: [
        { label: "Nyaman bekerja", nilai: 3.7 },
        { label: "Terbiasa kerjasama", nilai: 3.6 },
      ] },
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
        indicators: [
          { title: "Jam kerja tercatat", detail: "Rata-rata jam kerja mingguan guru SMA/SMK dibanding sebelum audit." },
          { title: "Kehadiran sesi dengar pendapat", detail: "Berapa guru yang ikut menyampaikan masukan di sesi rutin." },
        ],
        warnings: ["Kalau audit beban kerja cuma berhenti di data tanpa realokasi nyata, Tim bisa merasa keluhannya didengar tapi tidak ditindaklanjuti."],
      },
    ],
  },
  bagian_profil_organisasi: {
    narasi:
      "Karakter Lembaga jadi dimensi tertinggi (kekeluargaan yang dirasakan kuat), sementara Sinergi Tim relatif paling rendah, Tim antarjenjang belum banyak berkolaborasi lintas unit.",
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
      "Laporan ini adalah hasil pengolahan jawaban asesmen seluruh Tim yang mengisi pada periode berjalan dan bersifat rahasia. Gunakan sebagai bahan pengambilan keputusan sekolah, bukan alat evaluasi individu anggota Tim tertentu.",
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
    { tema: "Beban kerja jelang ujian", ringkasan: "Beberapa anggota Tim menyebut jadwal jadi sangat padat menjelang periode ujian, sampai sulit mengambil waktu istirahat yang cukup.", jumlah_mention: 5 },
    { tema: "Ingin ruang kolaborasi lintas jenjang", ringkasan: "Ada keinginan berulang untuk lebih sering bertukar praktik mengajar dengan rekan dari jenjang lain, bukan cuma dalam forum formal.", jumlah_mention: 4 },
    { tema: "Apresiasi atas dukungan pimpinan", ringkasan: "Beberapa anggota Tim menyampaikan rasa terbantu dengan keterbukaan pimpinan mendengarkan keluhan sehari-hari.", jumlah_mention: 3 },
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
  // verbatim staf mana pun, gaya word cloud (frasa pendek + jumlah_mention menentukan ukuran
  // tampilan), lihat CeritaPegawai/FrasaCeritaTim di sc.types.ts.
  cerita_pegawai: {
    gambaran_lembaga: [
      { frasa: "seperti keluarga besar", jumlah_mention: 9 },
      { frasa: "saling membantu", jumlah_mention: 7 },
      { frasa: "ramah dan hangat", jumlah_mention: 6 },
      { frasa: "masih perlu tertib waktu", jumlah_mention: 4 },
      { frasa: "penuh semangat belajar", jumlah_mention: 3 },
    ],
    saat_ini: [
      { frasa: "suasana kerja hangat", jumlah_mention: 8 },
      { frasa: "dipercaya tanggung jawab baru", jumlah_mention: 6 },
      { frasa: "sapaan ramah tiap hari", jumlah_mention: 5 },
      { frasa: "identitas jangka panjang", jumlah_mention: 3 },
    ],
    ingin_diubah: [
      { frasa: "perencanaan lebih matang", jumlah_mention: 7 },
      { frasa: "adaptasi kebutuhan digital", jumlah_mention: 5 },
      { frasa: "ruang konfirmasi ulang", jumlah_mention: 4 },
      { frasa: "apresiasi lebih rutin", jumlah_mention: 4 },
    ],
  },
};
